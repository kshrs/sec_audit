"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import "github-markdown-css/github-markdown-dark.css";
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Wrench,
  FileText,
  Copy,
  Check,
  Sparkles,
  Code
} from "lucide-react";

interface AuditReportProps {
  reportData: {
    report_md: string;
    passive_patches: number;
    active_actions: number;
    architectural_bugs: number;
    vulnerabilities: number;
    history_folder: string;
  } | null;
}

export const AuditReportViewer: React.FC<AuditReportProps> = ({ reportData }) => {
  const [activeSubTab, setActiveSubTab] = useState<"formatted" | "raw">("formatted");
  const [copied, setCopied] = useState(false);

  if (!reportData) {
    return (
      <div className="bg-zinc-900/30 border border-zinc-800 rounded-xl p-16 text-center text-zinc-500 font-sans">
        <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
        <h4 className="text-zinc-300 font-medium text-base">No Completed Audit In Session</h4>
        <p className="text-xs text-zinc-500 mt-1">
          Select a project and launch the workflow in Tab 1 to generate reports.
        </p>
      </div>
    );
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(reportData.report_md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in-50 duration-300">
      {/* 1. Metric Scorecard Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/80 rounded-xl p-4 flex items-center gap-4 shadow-lg shadow-black/40">
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold font-mono text-zinc-100">
              {reportData.passive_patches}
            </span>
            <p className="text-xs text-zinc-400 font-medium">Auto-Patches Applied</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/80 rounded-xl p-4 flex items-center gap-4 shadow-lg shadow-black/40">
          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold font-mono text-zinc-100">
              {reportData.architectural_bugs}
            </span>
            <p className="text-xs text-zinc-400 font-medium">Architectural Flaws</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/80 rounded-xl p-4 flex items-center gap-4 shadow-lg shadow-black/40">
          <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold font-mono text-zinc-100">
              {reportData.vulnerabilities}
            </span>
            <p className="text-xs text-zinc-400 font-medium">Vulnerabilities (CVE/CIS)</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800/80 rounded-xl p-4 flex items-center gap-4 shadow-lg shadow-black/40">
          <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold font-mono text-zinc-100">
              {reportData.active_actions}
            </span>
            <p className="text-xs text-zinc-400 font-medium">Active Actions Required</p>
          </div>
        </div>
      </div>

      {/* 2. Sub-Navigation Bar & Saved Folder info */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-1.5 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveSubTab("formatted")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              activeSubTab === "formatted"
                ? "bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>GitHub Documentation Preview</span>
          </button>

          <button
            onClick={() => setActiveSubTab("raw")}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all ${
              activeSubTab === "raw"
                ? "bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/60"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Code className="w-3.5 h-3.5 text-amber-400" />
            <span>Raw Markdown Source</span>
          </button>
        </div>

        <div className="flex items-center gap-3 pr-2">
          <span className="text-[11px] font-mono text-zinc-500 truncate max-w-sm">
            Saved: {reportData.history_folder}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Copied" : "Copy Source"}</span>
          </button>
        </div>
      </div>

      {/* 3. Main Report Deck using GitHub Markdown Dark Theme + Syntax Highlighting */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
        {activeSubTab === "formatted" ? (
          <div className="p-8 sm:p-12 markdown-body !bg-transparent !text-zinc-200">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const isInline = !match && !String(children).includes("\n");

                  if (isInline) {
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }

                  const language = match ? match[1] : "bash";
                  return (
                    <div className="rounded-lg overflow-hidden my-3 border border-zinc-800/80 shadow-md">
                      <div className="bg-zinc-900/90 px-3.5 py-1.5 border-b border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span className="uppercase text-emerald-400/90 font-semibold">{language}</span>
                        <span>syntax highlighted</span>
                      </div>
                      <SyntaxHighlighter
                        language={language}
                        style={vscDarkPlus}
                        customStyle={{
                          margin: 0,
                          padding: "1rem",
                          background: "#09090b",
                          fontSize: "12px",
                          lineHeight: "1.6",
                          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        }}
                        wrapLongLines={true}
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    </div>
                  );
                },
              }}
            >
              {reportData.report_md}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="p-6 bg-zinc-950">
            <pre className="p-4 rounded-lg bg-zinc-900 border border-zinc-800 font-mono text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[600px] select-all">
              {reportData.report_md}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
