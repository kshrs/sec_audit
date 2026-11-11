"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  ConnectionLineType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AgentNode, AgentNodeData } from "./AgentNode";
import { Terminal, Database, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";
import { AuditStreamEvent } from "@/types/secarch";

const nodeTypes = {
  agentNode: AgentNode,
};

const initialNodes: Node<AgentNodeData>[] = [
  {
    id: "scanner_node",
    type: "agentNode",
    position: { x: 50, y: 150 },
    data: { label: "AST & File Scanner", role: "Deterministic Ingestion", status: "idle" },
  },
  {
    id: "rag_node",
    type: "agentNode",
    position: { x: 340, y: 150 },
    data: { label: "Hybrid RAG Engine", role: "ChromaDB + BM25 Fusion", status: "idle" },
  },
  {
    id: "reflection_node",
    type: "agentNode",
    position: { x: 630, y: 150 },
    data: { label: "LangGraph Evaluator", role: "Context Sufficiency Check", status: "idle" },
  },
  {
    id: "architect_node",
    type: "agentNode",
    position: { x: 920, y: 40 },
    data: { label: "🏛️ Systems Architect", role: "POSIX & Concurrency Audit", status: "idle" },
  },
  {
    id: "security_node",
    type: "agentNode",
    position: { x: 920, y: 150 },
    data: { label: "🛡️ Security Auditor", role: "CVE & CIS Benchmarks", status: "idle" },
  },
  {
    id: "optimizer_node",
    type: "agentNode",
    position: { x: 920, y: 260 },
    data: { label: "⚡ Optimizer Specialist", role: "Cache & Zero-Copy Modernization", status: "idle" },
  },
  {
    id: "ast_gate_node",
    type: "agentNode",
    position: { x: 1220, y: 150 },
    data: { label: "AST Safety Gate", role: "Side-Effect Verification", status: "idle" },
  },
  {
    id: "synthesis_node",
    type: "agentNode",
    position: { x: 1500, y: 150 },
    data: { label: "Report Synthesizer", role: "Scorecard & Patch Archive", status: "idle" },
  },
];

const initialEdges: Edge[] = [
  { id: "e-scan-rag", source: "scanner_node", target: "rag_node", animated: false, style: { stroke: "#3f3f46" } },
  { id: "e-rag-ref", source: "rag_node", target: "reflection_node", animated: false, style: { stroke: "#3f3f46" } },
  { id: "e-ref-arch", source: "reflection_node", target: "architect_node", animated: false, style: { stroke: "#3f3f46" } },
  { id: "e-ref-sec", source: "reflection_node", target: "security_node", animated: false, style: { stroke: "#3f3f46" } },
  { id: "e-ref-opt", source: "reflection_node", target: "optimizer_node", animated: false, style: { stroke: "#3f3f46" } },
  { id: "e-arch-ast", source: "architect_node", target: "ast_gate_node", animated: false, style: { stroke: "#3f3f46" } },
  { id: "e-sec-ast", source: "security_node", target: "ast_gate_node", animated: false, style: { stroke: "#3f3f46" } },
  { id: "e-opt-ast", source: "optimizer_node", target: "ast_gate_node", animated: false, style: { stroke: "#3f3f46" } },
  { id: "e-ast-syn", source: "ast_gate_node", target: "synthesis_node", animated: false, style: { stroke: "#3f3f46" } },
];

export const AgentPipelineGraph: React.FC<{
  runId: string | null;
  onAuditFinished: (finalData: any) => void;
  onGoToReport: () => void;
  isCompleted: boolean;
}> = ({ runId, onAuditFinished, onGoToReport, isCompleted }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [logs, setLogs] = useState<string[]>([]);
  const [ragCitations, setRagCitations] = useState<any[]>([]);

  useEffect(() => {
    if (!runId) return;

    const eventSource = new EventSource(`http://localhost:8000/api/audit/stream/${runId}`);

    eventSource.onmessage = (event) => {
      try {
        const data: AuditStreamEvent = JSON.parse(event.data);

        if (data.type === "NODE_ACTIVE") {
          setNodes((prev) =>
            prev.map((n) => {
              if (n.id === data.node_id) {
                return {
                  ...n,
                  data: { ...n.data, status: "active", activeMessage: data.message },
                };
              }
              return n;
            })
          );
          setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] [${data.node_id}] ${data.message}`]);
        }

        if (data.type === "FLOW_SIGNAL") {
          setEdges((prev) =>
            prev.map((e) => {
              if (e.source === data.node_id || e.id.includes(data.node_id)) {
                return {
                  ...e,
                  animated: true,
                  style: { stroke: "#10b981", strokeWidth: 2.5 },
                };
              }
              return e;
            })
          );
          setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ➔ ${data.message}`]);
        }

        if (data.type === "RAG_CHUNK_LOADED" && data.payload) {
          setRagCitations((prev) => [data.payload, ...prev.slice(0, 15)]);
        }

        if (data.type === "AUDIT_COMPLETED") {
          setNodes((prev) =>
            prev.map((n) => ({ ...n, data: { ...n.data, status: "completed" } }))
          );
          eventSource.close();
          // Pass citations along with completed data
          onAuditFinished({
            ...data.payload,
            rag_citations: ragCitations,
          });
        }
      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [runId, setNodes, setEdges, onAuditFinished]);

  return (
    <div className="space-y-4">
      {/* 1. Interactive React Flow Canvas */}
      <div className="h-[440px] bg-zinc-950/90 border border-zinc-800/80 rounded-xl overflow-hidden relative shadow-2xl backdrop-blur-md">
        <div className="absolute top-3 left-4 z-10 flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-md bg-zinc-900/90 border border-zinc-800 text-zinc-300">
            <span
              className={`w-2 h-2 rounded-full ${
                isCompleted ? "bg-cyan-400" : "bg-emerald-400 animate-pulse"
              }`}
            />
            <span>
              {isCompleted ? "Pipeline Audit Complete" : "Executing Stateful Agent Graph"}
            </span>
          </div>

          {/* User-Controlled Button to View Report */}
          {isCompleted && (
            <button
              onClick={onGoToReport}
              className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold text-xs transition-all shadow-lg shadow-emerald-950/50 cursor-pointer animate-in fade-in-50"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>View Audit & Code Diff Report</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          connectionLineType={ConnectionLineType.SmoothStep}
          fitView
          fitViewOptions={{ padding: 0.2 }}
        >
          <Background color="#27272a" gap={20} size={1} />
          <Controls className="!bg-zinc-900 !border-zinc-800 !fill-zinc-300" />
        </ReactFlow>
      </div>

      {/* 2. Lower Dashboard: Live Logs & RAG Reference Drawer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left: Terminal Thought Stream */}
        <div className="md:col-span-7 bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 font-mono text-xs shadow-lg">
          <div className="flex items-center gap-2 pb-2.5 mb-2.5 border-b border-zinc-800 text-zinc-400 font-sans font-semibold">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>Agent Execution & Thinking Stream</span>
          </div>
          <div className="space-y-1.5 overflow-y-auto max-h-[180px] text-zinc-300 pr-2 select-text">
            {logs.length === 0 ? (
              <p className="text-zinc-600 italic">Awaiting pipeline trigger...</p>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  <span className="text-emerald-500/80">❯</span> {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: RAG References Loaded */}
        <div className="md:col-span-5 bg-zinc-950/80 border border-zinc-800 rounded-xl p-4 font-sans text-xs shadow-lg">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-zinc-800 text-zinc-400 font-semibold">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <span>Citations Fetched by RAG</span>
            </div>
            <span className="font-mono text-[11px] text-zinc-500">
              {ragCitations.length} retrieved
            </span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-[180px] pr-1">
            {ragCitations.length === 0 ? (
              <p className="text-zinc-600 italic">No citations retrieved yet.</p>
            ) : (
              ragCitations.map((chunk, i) => (
                <div
                  key={i}
                  className="p-2 rounded-lg bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center justify-between font-semibold text-zinc-200 mb-0.5">
                    <span className="truncate pr-2">{chunk.title}</span>
                    <span className="text-[10px] font-mono text-emerald-400 shrink-0">
                      RRF: {chunk.score}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 line-clamp-2 font-mono">
                    {chunk.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
