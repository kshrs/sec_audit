import os
import subprocess
from pathlib import Path
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Query, HTTPException

router = APIRouter(prefix="/api/fs", tags=["filesystem"])

@router.get("/browse")
def browse_directory(path: Optional[str] = Query(None)):
    """Fallback web directory browser."""
    target = Path(path).resolve() if path else Path.home()
    if not target.exists() or not target.is_dir():
        target = Path.home()

    directories = []
    parent = str(target.parent) if target != target.parent else None

    try:
        with os.scandir(target) as it:
            for entry in it:
                if entry.is_dir() and not entry.name.startswith("."):
                    directories.append({
                        "name": entry.name,
                        "path": entry.path
                    })
    except PermissionError:
        pass

    directories.sort(key=lambda x: x["name"].lower())

    return {
        "current_path": str(target),
        "parent_path": parent,
        "directories": directories
    }

@router.post("/pick_x11")
def pick_x11_directory():
    """
    Invokes the native X11 folder picker on your desktop (Zenity, Qarma, YAD, or dmenu fallback).
    """
    env = os.environ.copy()
    if "DISPLAY" not in env:
        env["DISPLAY"] = ":0"

    # 1. Try zenity
    try:
        res = subprocess.run(
            ["zenity", "--file-selection", "--directory", "--title=Select Project Workspace Folder"],
            capture_output=True,
            text=True,
            env=env
        )
        if res.returncode == 0 and res.stdout.strip():
            return {"selected_path": res.stdout.strip()}
    except FileNotFoundError:
        pass

    # 2. Try qarma (Qt zenity drop-in)
    try:
        res = subprocess.run(
            ["qarma", "--file-selection", "--directory", "--title=Select Project Workspace Folder"],
            capture_output=True,
            text=True,
            env=env
        )
        if res.returncode == 0 and res.stdout.strip():
            return {"selected_path": res.stdout.strip()}
    except FileNotFoundError:
        pass

    # 3. Try yad
    try:
        res = subprocess.run(
            ["yad", "--file", "--directory", "--title=Select Project Workspace Folder"],
            capture_output=True,
            text=True,
            env=env
        )
        if res.returncode == 0 and res.stdout.strip():
            return {"selected_path": res.stdout.strip()}
    except FileNotFoundError:
        pass

    # 4. Fallback to dmenu (native X11 prompt)
    try:
        projects_dir = Path.home() / "Projects"
        subdirs = [str(p) for p in projects_dir.iterdir() if p.is_dir() and not p.name.startswith(".")] if projects_dir.exists() else []
        input_list = "\n".join([str(Path.home()), str(projects_dir)] + sorted(subdirs))
        
        dmenu_proc = subprocess.Popen(
            ["dmenu", "-p", "Select Workspace Folder:", "-l", "15"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            text=True,
            env=env
        )
        stdout, _ = dmenu_proc.communicate(input=input_list)
        if stdout and stdout.strip() and Path(stdout.strip()).is_dir():
            return {"selected_path": stdout.strip()}
    except Exception:
        pass

    raise HTTPException(
        status_code=501, 
        detail="No native X11 dialog (zenity/qarma/yad) found. Install with: sudo xbps-install -S zenity"
    )
