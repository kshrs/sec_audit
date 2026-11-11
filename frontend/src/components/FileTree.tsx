"use client";

import React, { useState } from "react";
import { Folder, FolderOpen, FileCode, FileText, ChevronRight, ChevronDown } from "lucide-react";

interface FileTreeProps {
  tree: Record<string, any>;
  onSelectFile?: (path: string) => void;
}

export const FileTreeNode: React.FC<{
  name: string;
  node: any;
  currentPath: string;
  onSelectFile?: (path: string) => void;
}> = ({ name, node, currentPath, onSelectFile }) => {
  const [isOpen, setIsOpen] = useState(true);
  const isDirectory = node !== null && typeof node === "object";
  const path = currentPath ? `${currentPath}/${name}` : name;

  if (isDirectory) {
    return (
      <div className="select-none pl-2 text-sm">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 py-1 px-1.5 rounded-md hover:bg-zinc-800/60 cursor-pointer text-zinc-300 transition-colors"
        >
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
          )}
          {isOpen ? (
            <FolderOpen className="w-4 h-4 text-emerald-400/90" />
          ) : (
            <Folder className="w-4 h-4 text-emerald-500/80" />
          )}
          <span className="font-medium text-zinc-200">{name}</span>
        </div>
        {isOpen && (
          <div className="border-l border-zinc-800 ml-3 pl-1">
            {Object.keys(node).map((childKey) => (
              <FileTreeNode
                key={childKey}
                name={childKey}
                node={node[childKey]}
                currentPath={path}
                onSelectFile={onSelectFile}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // File Leaf
  const isCode = /\.(c|cpp|h|hpp|rs|py|go|sh)$/i.test(name);
  return (
    <div
      onClick={() => onSelectFile && onSelectFile(path)}
      className="flex items-center gap-2 py-1 px-2 ml-4 rounded-md hover:bg-zinc-800/40 cursor-pointer text-zinc-400 hover:text-zinc-200 transition-colors text-xs font-mono"
    >
      {isCode ? (
        <FileCode className="w-3.5 h-3.5 text-cyan-400" />
      ) : (
        <FileText className="w-3.5 h-3.5 text-zinc-500" />
      )}
      <span>{name}</span>
    </div>
  );
};

export const FileTreeViewer: React.FC<FileTreeProps> = ({ tree, onSelectFile }) => {
  return (
    <div className="font-sans overflow-y-auto max-h-[380px] p-2 space-y-0.5 custom-scrollbar">
      {Object.keys(tree).map((key) => (
        <FileTreeNode
          key={key}
          name={key}
          node={tree[key]}
          currentPath=""
          onSelectFile={onSelectFile}
        />
      ))}
    </div>
  );
};
