"use client";

import React, { useState } from "react";
import { Shield, GitGraph, FileText, Menu, Terminal } from "lucide-react";
import { WorkspaceSetup } from "@/components/WorkspaceSetup";
import { AgentPipelineGraph } from "@/components/AgentPipelineGraph";
import { AuditReportViewer } from "@/components/AuditReportViewer";
import { HistoryDrawer } from "@/components/HistoryDrawer";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"workspace" | "pipeline" | "report">("workspace");
  const [isScanning, setIsScanning] = useState(false);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);
  const [auditReportData, setAuditReportData] = useState<any | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleStartAudit = async (directoryPath: string, userGoals: string) => {
    setIsCompleted(false);
    try {
      const res = await fetch("http://localhost:8000/api/audit/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directory_path: directoryPath,
          user_goals: userGoals,
        }),
      });
      const data = await res.json();
      if (data.run_id) {
        setCurrentRunId(data.run_id);
        setActiveTab("pipeline");
      }
    } catch (err) {
      console.error("Failed to start audit:", err);
    }
  };

  const handleAuditFinished = (finalData: any) => {
    setAuditReportData(finalData);
    setIsCompleted(true);
  };

  const handleSelectHistoryRun = (runData: any) => {
    setAuditReportData({
      report_md: runData.final_report_md,
      passive_patches: runData.passive_patches_applied || 0,
      active_actions: runData.active_actions_required || 0,
      architectural_bugs: runData.architectural_bugs_found || 0,
      vulnerabilities: runData.code_vulnerabilities_found || 0,
      history_folder: runData.project_path || "Archive",
    });
    // Direct immediately to Report Page
    setActiveTab("report");
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Hamburger Menu on Left */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            title="View Audit Run Histories"
            className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <Menu className="w-4 h-4 text-emerald-400" />
          </button>

          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-inner">
            <Shield className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h1 className="font-semibold text-sm tracking-tight text-zinc-100 flex items-center gap-2">
              SecArch
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                v1.0 Local-First
              </span>
            </h1>
            <p className="text-[11px] text-zinc-500">Systems & Architecture Auditor</p>
          </div>
        </div>

        {/* Linear Style Tab Switcher */}
        <nav className="flex items-center bg-zinc-900/80 border border-zinc-800 rounded-lg p-1 text-xs">
          <button
            onClick={() => setActiveTab("workspace")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all cursor-pointer font-medium ${
              activeTab === "workspace"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>1. Workspace & Triage</span>
          </button>

          <button
            onClick={() => setActiveTab("pipeline")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all cursor-pointer font-medium ${
              activeTab === "pipeline"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <GitGraph className="w-3.5 h-3.5" />
            <span>2. Agent Node Pipeline</span>
            {isCompleted && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("report")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md transition-all cursor-pointer font-medium ${
              activeTab === "report"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>3. Audit Report</span>
            {isCompleted && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                Ready
              </span>
            )}
          </button>
        </nav>

        {/* Status Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>18,814 Specs Loaded</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        {activeTab === "workspace" && (
          <WorkspaceSetup
            onStartAudit={handleStartAudit}
            isScanning={isScanning}
            setIsScanning={setIsScanning}
          />
        )}

        {activeTab === "pipeline" && (
          <AgentPipelineGraph
            runId={currentRunId}
            onAuditFinished={handleAuditFinished}
            onGoToReport={() => setActiveTab("report")}
            isCompleted={isCompleted}
          />
        )}

        {activeTab === "report" && (
          <AuditReportViewer reportData={auditReportData} />
        )}
      </main>

      {/* Slide-out History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onSelectRun={handleSelectHistoryRun}
      />
    </div>
  );
}
