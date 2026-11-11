import os
import shutil
import difflib
from pathlib import Path
from typing import Dict, Any, Tuple
from pydantic import BaseModel

class PatchResult(BaseModel):
    file_path: str
    status: str  # "AUTO_IMPLEMENTED" or "DEFERRED_TO_REPORT"
    diff: str
    backup_path: str
    success: bool
    message: str

class AutoPatcher:
    """
    Safely applies in-place code optimizations to project files.
    Creates a .bak backup prior to touch, computes a unified diff,
    and supports instant rollback.
    """

    @classmethod
    def apply_patch(cls, target_file_path: str, old_block: str, new_block: str) -> PatchResult:
        file_path = Path(target_file_path).resolve()
        if not file_path.exists() or not file_path.is_file():
            return PatchResult(
                file_path=str(file_path),
                status="ERROR",
                diff="",
                backup_path="",
                success=False,
                message=f"File not found: {target_file_path}"
            )

        # 1. Read existing content
        try:
            content = file_path.read_text(encoding="utf-8")
        except Exception as e:
            return PatchResult(
                file_path=str(file_path),
                status="ERROR",
                diff="",
                backup_path="",
                success=False,
                message=f"Failed to read file: {str(e)}"
            )

        # Normalize whitespace line ends for matching
        old_normalized = old_block.strip()
        if old_normalized not in content:
            # Fallback fuzzy attempt: ignore indentation differences
            lines_content = [l.strip() for l in content.splitlines()]
            lines_old = [l.strip() for l in old_normalized.splitlines()]
            match_found = False
            for i in range(len(lines_content) - len(lines_old) + 1):
                if lines_content[i:i + len(lines_old)] == lines_old:
                    match_found = True
                    break
            if not match_found:
                return PatchResult(
                    file_path=str(file_path),
                    status="DEFERRED_TO_REPORT",
                    diff="",
                    backup_path="",
                    success=False,
                    message="Target code block not found exactly in file. Deferred to report."
                )

        # 2. Create .bak backup file
        backup_path = file_path.with_suffix(file_path.suffix + ".bak")
        shutil.copy2(file_path, backup_path)

        # 3. Apply substitution
        new_content = content.replace(old_block, new_block, 1)
        file_path.write_text(new_content, encoding="utf-8")

        # 4. Generate Unified Git-Style Diff
        diff_lines = list(difflib.unified_diff(
            content.splitlines(keepends=True),
            new_content.splitlines(keepends=True),
            fromfile=f"a/{file_path.name}",
            tofile=f"b/{file_path.name}",
            n=3
        ))
        unified_diff_str = "".join(diff_lines)

        return PatchResult(
            file_path=str(file_path),
            status="AUTO_IMPLEMENTED",
            diff=unified_diff_str,
            backup_path=str(backup_path),
            success=True,
            message="Patch successfully auto-implemented with .bak created."
        )

    @classmethod
    def rollback(cls, target_file_path: str) -> bool:
        """Rollback file to .bak version."""
        file_path = Path(target_file_path)
        backup_path = file_path.with_suffix(file_path.suffix + ".bak")
        if backup_path.exists():
            shutil.copy2(backup_path, file_path)
            return True
        return False
