"use client";

import React, { useState, useEffect } from "react";
import { Folder, FolderUp, Check, X, ChevronRight, HardDrive } from "lucide-react";
import axios from "axios";

interface FolderPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (folderPath: string) => void;
  initialPath?: string;
}

export const FolderPickerModal: React.FC<FolderPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  initialPath,
}) => {
  const [currentPath, setCurrentPath] = useState(initialPath || "/home/kshrs/Projects");
  const [parentPath, setParentPath] = useState<string | null>(null);
  const [directories, setDirectories] = useState<Array<{ name: string; path: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDirectory(currentPath);
    }
  }, [isOpen]);

  const loadDirectory = async (targetPath?: string) => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8000/api/fs/browse", {
        params: { path: targetPath },
      });
      setCurrentPath(res.data.current_path);
      setParentPath(res.data.parent_path);
      setDirectories(res.data.directories || []);
    } catch (err) {
      console.error("Failed to browse directory:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] z-10 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-sm text-zinc-100">Select Project Folder</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Path Bar */}
        <div className="px-5 py-2.5 bg-zinc-900/80 border-b border-zinc-800 flex items-center gap-2 text-xs font-mono text-zinc-300">
          <span className="text-zinc-500">Path:</span>
          <span className="truncate text-emerald-400">{currentPath}</span>
        </div>

        {/* Directory List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar min-h-[300px]">
          {parentPath && (
            <button
              onClick={() => loadDirectory(parentPath)}
              className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-colors text-left cursor-pointer"
            >
              <FolderUp className="w-4 h-4 text-amber-400 shrink-0" />
              <span>.. (Parent Directory)</span>
            </button>
          )}

          {loading ? (
            <div className="py-16 text-center text-xs text-zinc-500 font-mono">
              Browsing directories...
            </div>
          ) : directories.length === 0 ? (
            <div className="py-16 text-center text-xs text-zinc-500 font-mono">
              No sub-directories found in this folder.
            </div>
          ) : (
            directories.map((dir) => (
              <div
                key={dir.path}
                onDoubleClick={() => loadDirectory(dir.path)}
                className="group flex items-center justify-between p-2 rounded-lg hover:bg-zinc-900/90 border border-transparent hover:border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white transition-all cursor-pointer"
              >
                <div
                  className="flex items-center gap-2.5 truncate flex-1"
                  onClick={() => loadDirectory(dir.path)}
                >
                  <Folder className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="truncate">{dir.name}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(dir.path);
                    onClose();
                  }}
                  className="opacity-0 group-hover:opacity-100 px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-zinc-950 font-semibold text-[10px] transition-all cursor-pointer"
                >
                  Select This
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between">
          <span className="text-[11px] text-zinc-500 font-mono">
            Double-click to enter folder
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:bg-zinc-900 text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSelect(currentPath);
                onClose();
              }}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Choose Current Folder</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
