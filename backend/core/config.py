import os
import itertools
from typing import List, Optional
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_ROOT: Path = Path(__file__).resolve().parent.parent.parent
    DATA_DIR: Path = PROJECT_ROOT / "data"
    CHROMA_DB_PATH: Path = DATA_DIR / "chroma_db"
    BM25_INDEX_PATH: Path = DATA_DIR / "bm25_index.pkl"
    MANIFEST_PATH: Path = DATA_DIR / "INGESTION_MANIFEST.md"
    HISTORY_DIR: Path = DATA_DIR / "history"

    # Multi-Key Pool (KEY_1 ... KEY_5)
    KEY_1: Optional[str] = None
    KEY_2: Optional[str] = None
    KEY_3: Optional[str] = None
    KEY_4: Optional[str] = None
    KEY_5: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None  # Fallback

    # Highest rate limit free-tier model: gemini-2.0-flash (15 RPM / 1M TPM / 1500 RPD)
    GEMINI_MODEL: str = "gemini-2.0-flash"
    
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    TOP_K_RETRIEVAL: int = 5
    
    class Config:
        env_file = ".env"
        extra = "ignore"

    def get_api_keys(self) -> List[str]:
        """Collects all configured non-empty keys from the multi-key pool."""
        keys = []
        for k in [self.KEY_1, self.KEY_2, self.KEY_3, self.KEY_4, self.KEY_5, self.GEMINI_API_KEY]:
            if k and k.strip():
                keys.append(k.strip())
        # Also inspect OS environment for KEY_1 through KEY_5
        for i in range(1, 6):
            env_k = os.environ.get(f"KEY_{i}")
            if env_k and env_k.strip() and env_k not in keys:
                keys.append(env_k.strip())
        return keys

settings = Settings()
settings.HISTORY_DIR.mkdir(parents=True, exist_ok=True)
