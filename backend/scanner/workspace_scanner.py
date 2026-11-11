import os
from pathlib import Path
from typing import List, Dict, Any
from pydantic import BaseModel

class WorkspaceFile(BaseModel):
    path: str
    relative_path: str
    name: str
    extension: str
    size_bytes: int
    category: str

class WorkspaceSummary(BaseModel):
    total_files: int
    file_tree: Dict[str, Any]
    detected_languages: List[str]
    configs_detected: List[str]
    code_files: List[WorkspaceFile]
    config_files: List[WorkspaceFile]

IGNORE_DIRS = {
    ".git", ".svn", ".hg", "node_modules", "vendor", "__pycache__", 
    ".venv", "venv", "build", "dist", "target", ".idea", ".vscode"
}

CODE_EXTENSIONS = {
    ".c": "C", ".h": "C Header", ".cpp": "C++", ".hpp": "C++ Header",
    ".rs": "Rust", ".py": "Python", ".go": "Go", ".sh": "Shell"
}

CONFIG_NAMES = {
    "nginx.conf", "Makefile", "makefile", "CMakeLists.txt", 
    "Dockerfile", "docker-compose.yml", "docker-compose.yaml"
}

class WorkspaceScanner:
    def __init__(self, root_path: str):
        self.root_path = Path(root_path).resolve()
        if not self.root_path.exists() or not self.root_path.is_dir():
            raise ValueError(f"Invalid workspace path: {root_path}")

    def scan(self) -> WorkspaceSummary:
        file_tree = {}
        code_files: List[WorkspaceFile] = []
        config_files: List[WorkspaceFile] = []
        languages = set()
        configs = set()
        total_count = 0

        for root, dirs, files in os.walk(self.root_path):
            # Prune ignored directories
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS and not d.startswith(".")]
            
            for file_name in files:
                if file_name.startswith("."):
                    continue
                file_path = Path(root) / file_name
                try:
                    stat = file_path.stat()
                except Exception:
                    continue

                rel_path = str(file_path.relative_to(self.root_path))
                ext = file_path.suffix.lower()
                size = stat.st_size

                category = "other"
                if ext in CODE_EXTENSIONS:
                    category = "code"
                    lang = CODE_EXTENSIONS[ext]
                    languages.add(lang)
                    code_files.append(WorkspaceFile(
                        path=str(file_path),
                        relative_path=rel_path,
                        name=file_name,
                        extension=ext,
                        size_bytes=size,
                        category=category
                    ))
                elif file_name in CONFIG_NAMES or ext in {".conf", ".service", ".ini", ".yaml", ".yml"}:
                    category = "config"
                    configs.add(file_name)
                    config_files.append(WorkspaceFile(
                        path=str(file_path),
                        relative_path=rel_path,
                        name=file_name,
                        extension=ext,
                        size_bytes=size,
                        category=category
                    ))

                total_count += 1
                self._build_tree(file_tree, rel_path.split(os.sep))

        return WorkspaceSummary(
            total_files=total_count,
            file_tree=file_tree,
            detected_languages=sorted(list(languages)),
            configs_detected=sorted(list(configs)),
            code_files=code_files,
            config_files=config_files
        )

    def _build_tree(self, current: Dict[str, Any], parts: List[str]):
        if not parts:
            return
        head, *tail = parts
        if not tail:
            current[head] = None  # File leaf
        else:
            if head not in current or current[head] is None:
                current[head] = {}
            self._build_tree(current[head], tail)
