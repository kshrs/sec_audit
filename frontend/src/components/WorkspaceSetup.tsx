"use client";

import React, { useState } from "react";
import { FolderSearch, Sparkles, ArrowRight, ShieldCheck, Cpu, Code2, AlertCircle, FolderOpen } from "lucide-react";
import { FileTreeViewer } from "./FileTree";
import { FolderPickerModal } from "./FolderPickerModal";
import { ScanResponse } from "@/types/secaudit";
import axios from "axios";

interface WorkspaceSetupProps {
  onStartAudit: (directoryPath: string, userGoals: string) => void;
  isScanning: boolean;
  setIsScanning: (val: boolean) => void;
}

export const WorkspaceSetup: React.FC<WorkspaceSetupProps> = ({
  onStartAudit,
  isScanning,
  setIsScanning,
}) => {
  const [workspacePath, setWorkspacePath] = useState("/home/kshrs/Projects/unix_log_sentinel");
  const [scanData, setScanData] = useState<ScanResponse | null>(null);
  const [userGoals, setUserGoals] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const handleScan = async (pathOverride?: string) => {
    const pathToScan = pathOverride || workspacePath;
    if (!pathToScan.trim()) return;
    setIsScanning(true);
    setError(null);
    try {
      const res = await axios.post("http://localhost:8000/api/workspace/scan", {
        directory_path: pathToScan.trim(),
      });
      setScanData(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to scan workspace directory.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleFolderSelect = (selectedFolder: string) => {
    setWorkspacePath(selectedFolder);
    handleScan(selectedFolder);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* 1. Header & Path Input with In-Page Folder Picker */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-5 backdrop-blur-md shadow-2xl">
        <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2">
          Select Local Workspace Directory
        </label>
        <div className="flex gap-2.5">
          <div className="relative flex-1">
            <FolderSearch className="absolute left-3.5 top-3 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={workspacePath}
              onChange={(e) => setWorkspacePath(e.target.value)}
              placeholder="/absolute/path/to/project"
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono transition-colors"
            />
          </div>

          {/* In-Page Browser Button */}
          <button
            onClick={() => setIsPickerOpen(true)}
            title="Browse File System"
            className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-200 font-medium text-xs transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <FolderOpen className="w-4 h-4 text-emerald-400" />
            <span>Browse</span>
          </button>

          <button
            onClick={() => handleScan()}
            disabled={isScanning}
            className="px-5 py-2 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isScanning ? (
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-zinc-950 animate-ping" />
                Scanning...
              </span>
            ) : (
              <span>Inspect Workspace</span>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-rose-400 text-xs bg-rose-950/30 border border-rose-800/40 p-2.5 rounded-md">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* 2. Workspace Overview & AI Inference */}
      {scanData && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 animate-in fade-in-50 duration-300">
          {/* Left Column: File Tree */}
          <div className="md:col-span-5 bg-zinc-900/40 border border-zinc-800/60 rounded-xl p-4 backdrop-blur-sm">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80 mb-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Project Explorer
              </span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                {scanData.summary.total_files} files
              </span>
            </div>
            <FileTreeViewer tree={scanData.summary.file_tree} />
          </div>

          {/* Right Column: AI Architecture Inference & Custom Goals */}
          <div className="md:col-span-7 space-y-4">
            {/* AI Architecture Insight Card */}
            <div className="bg-gradient-to-br from-zinc-900/80 to-zinc-950 border border-zinc-800/80 rounded-xl p-5 shadow-lg relative overflow-hidden">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <Sparkles className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>AI Architecture Triage (Gemini Flash)</span>
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed font-sans mb-4">
                {scanData.initial_inference}
              </p>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800/60">
                {scanData.summary.detected_languages.map((lang) => (
                  <span
                    key={lang}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800/80 text-zinc-300 text-xs font-mono border border-zinc-700/50"
                  >
                    <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                    {lang}
                  </span>
                ))}
                {scanData.summary.configs_detected.map((cfg) => (
                  <span
                    key={cfg}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-800/80 text-zinc-300 text-xs font-mono border border-zinc-700/50"
                  >
                    <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                    {cfg}
                  </span>
                ))}
              </div>
            </div>

            {/* Custom User Goal & Instruction Alignment Input */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-xl p-5 backdrop-blur-sm space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Custom Optimization Goals & Directives
                </label>
                <span className="text-[11px] text-zinc-500 font-mono">Optional</span>
              </div>
              <textarea
                value={userGoals}
                onChange={(e) => setUserGoals(e.target.value)}
                placeholder="e.g. Focus on eliminating memory copies in socket read loop; prioritize CIS Level 1 Linux host compliance; check for CVE buffer overflows."
                rows={3}
                className="w-full bg-zinc-950/80 border border-zinc-800 rounded-lg p-3 text-sm text-zinc-200 focus:outline-none focus:border-emerald-500 transition-colors resize-none font-sans placeholder:text-zinc-600"
              />

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => onStartAudit(workspacePath, userGoals)}
                  className="group relative px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-950/50 flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-zinc-950" />
                  <span>Start Security Audit Workflow</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visual File System Folder Picker Modal */}
      <FolderPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleFolderSelect}
        initialPath={workspacePath}
      />
    </div>
  );
};
