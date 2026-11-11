"use client";

import React, { useEffect, useState } from "react";
import { X, History, Clock, FileText, ChevronRight, CheckCircle2, ShieldAlert } from "lucide-react";
import axios from "axios";
import { AuditHistoryItem } from "@/types/secaudit";

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRun: (runData: any) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  onSelectRun,
}) => {
  const [historyList, setHistoryList] = useState<AuditHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:8000/api/history");
      setHistoryList(res.data || []);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunClick = async (runFolder: string) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/history/${runFolder}`);
      if (res.data) {
        onSelectRun(res.data);
        onClose();
      }
    } catch (err) {
      console.error("Failed to load run details:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Drawer */}
      <div className="relative w-full max-w-sm bg-zinc-950 border-r border-zinc-800 h-full p-5 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-sm text-zinc-100">Audit Run Histories</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-xs text-zinc-500 font-mono">
              Loading past audits...
            </div>
          ) : historyList.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-500 font-sans">
              No previous audit runs found.
            </div>
          ) : (
            historyList.map((item) => (
              <div
                key={item.run_id}
                onClick={() => handleRunClick(item.run_id)}
                className="group p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800/80 hover:border-emerald-500/50 transition-all cursor-pointer shadow-sm"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-xs font-semibold text-zinc-200 group-hover:text-emerald-400 transition-colors truncate max-w-[200px]">
                    {item.project_path.split("/").pop() || "Project"}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono mb-2">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  <span>{item.timestamp}</span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/60 text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    {item.passive_patches} patches
                  </span>
                  <span className="flex items-center gap-1 text-rose-400">
                    <ShieldAlert className="w-3 h-3" />
                    {item.vulnerabilities} CVEs
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-zinc-800 text-[11px] text-zinc-500 font-mono text-center">
          Persisted in data/history
        </div>
      </div>
    </div>
  );
};
