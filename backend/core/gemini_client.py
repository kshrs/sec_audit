import os
import itertools
from typing import Optional, List, Dict, Any, Generator, Tuple
from google import genai
from google.genai import types
from backend.core.config import settings

class GeminiEngine:
    """
    Multi-Key Rotator and High-Throughput Gemini Client.
    Rotates between KEY_1 through KEY_5 on every call, and automatically
    retries with the next key if a 429 rate limit or quota exhaustion occurs.
    """

    def __init__(self, model: Optional[str] = None):
        self.model = model or settings.GEMINI_MODEL
        self.keys = settings.get_api_keys()
        self._key_cycle = itertools.cycle(self.keys) if self.keys else None
        print(f"[*] GeminiEngine initialized with {len(self.keys)} active API keys in the rotation pool.")

    def _get_next_client(self) -> Tuple[genai.Client, str]:
        if not self.keys:
            # Fallback to system default environment if no explicit KEY_N provided
            return genai.Client(), "default_env"
        current_key = next(self._key_cycle)
        return genai.Client(api_key=current_key), current_key[:6] + "..."

    def generate_text(self, prompt: str, system_instruction: Optional[str] = None, temperature: float = 0.2) -> str:
        """Executes text generation with automatic multi-key failover."""
        attempts = max(len(self.keys), 1)
        last_error = None

        for _ in range(attempts):
            client, key_alias = self._get_next_client()
            try:
                config = types.GenerateContentConfig(
                    temperature=temperature,
                    system_instruction=system_instruction
                )
                response = client.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=config
                )
                return response.text or ""
            except Exception as e:
                err_msg = str(e).lower()
                if "429" in err_msg or "quota" in err_msg or "resource_exhausted" in err_msg:
                    print(f"[!] Rate limit on key {key_alias}. Rotating to next API key immediately...")
                    last_error = e
                    continue
                else:
                    raise e

        raise RuntimeError(f"All {len(self.keys)} Gemini API keys were rate-limited. Last error: {last_error}")

    def generate_structured(self, prompt: str, response_schema: Any, system_instruction: Optional[str] = None) -> Any:
        """Executes structured JSON generation with automatic multi-key failover."""
        attempts = max(len(self.keys), 1)
        last_error = None

        for _ in range(attempts):
            client, key_alias = self._get_next_client()
            try:
                config = types.GenerateContentConfig(
                    temperature=0.1,
                    response_mime_type="application/json",
                    response_schema=response_schema,
                    system_instruction=system_instruction
                )
                response = client.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=config
                )
                return response.parsed or response.text
            except Exception as e:
                err_msg = str(e).lower()
                if "429" in err_msg or "quota" in err_msg or "resource_exhausted" in err_msg:
                    print(f"[!] Rate limit on key {key_alias}. Rotating key...")
                    last_error = e
                    continue
                else:
                    raise e

        raise RuntimeError(f"All Gemini API keys rate-limited. Last error: {last_error}")

    def stream_text(self, prompt: str, system_instruction: Optional[str] = None) -> Generator[str, None, None]:
        """Streams live tokens for real-time frontend logs."""
        client, _ = self._get_next_client()
        config = types.GenerateContentConfig(
            temperature=0.2,
            system_instruction=system_instruction
        )
        response = client.models.generate_content_stream(
            model=self.model,
            contents=prompt,
            config=config
        )
        for chunk in response:
            if chunk.text:
                yield chunk.text
