import json
import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional
from backend.core.config import settings

class SessionStore:
    """Persists and retrieves past project audits and diff logs."""

    @classmethod
    def save_run(cls, run_id: str, project_name: str, state_data: Dict[str, Any]) -> Path:
        run_folder = settings.HISTORY_DIR / f"{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}_{run_id}"
        run_folder.mkdir(parents=True, exist_ok=True)

        # 1. Save Raw JSON State
        json_path = run_folder / "audit_state.json"
        with open(json_path, "w", encoding="utf-8") as f:
            # Clean non-serializable items
            cleaned = {k: v for k, v in state_data.items() if isinstance(v, (str, int, float, bool, list, dict))}
            json.dump(cleaned, f, indent=2)

        # 2. Save Markdown Report
        md_path = run_folder / "REPORT.md"
        md_content = state_data.get("final_report_md", "# SecArch Audit Report\nNo data.")
        md_path.write_text(md_content, encoding="utf-8")

        return run_folder

    @classmethod
    def list_history(cls) -> List[Dict[str, Any]]:
        history = []
        if not settings.HISTORY_DIR.exists():
            return []

        for p in sorted(settings.HISTORY_DIR.glob("*"), reverse=True):
            if p.is_dir() and (p / "audit_state.json").exists():
                try:
                    with open(p / "audit_state.json", "r", encoding="utf-8") as f:
                        data = json.load(f)
                    history.append({
                        "run_id": p.name,
                        "project_path": data.get("project_path", "Unknown"),
                        "timestamp": data.get("run_timestamp", p.name[:15]),
                        "passive_patches": data.get("passive_patches_applied", 0),
                        "architectural_bugs": data.get("architectural_bugs_found", 0),
                        "vulnerabilities": data.get("code_vulnerabilities_found", 0),
                        "report_url": str(p / "REPORT.md")
                    })
                except Exception:
                    continue
        return history

    @classmethod
    def get_run_details(cls, run_folder_name: str) -> Optional[Dict[str, Any]]:
        target = settings.HISTORY_DIR / run_folder_name
        if target.exists() and (target / "audit_state.json").exists():
            with open(target / "audit_state.json", "r", encoding="utf-8") as f:
                return json.load(f)
        return None
