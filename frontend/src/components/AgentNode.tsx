"use client";

import React, { memo } from "react";
import { Handle, Position } from "@xyflow/react";

export interface AgentNodeData extends Record<string, unknown> {
  label: string;
  role: string;
  status: "idle" | "active" | "completed" | "error";
  description?: string;
  activeMessage?: string;
}

export const AgentNode = memo((props: any) => {
  const nodeData = (props.data || {}) as AgentNodeData;
  const status = nodeData.status || "idle";

  const getStatusBorder = () => {
    switch (status) {
      case "active":
        return "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.35)] ring-1 ring-emerald-500/50";
      case "completed":
        return "border-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.2)]";
      case "error":
        return "border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]";
      default:
        return "border-zinc-800 hover:border-zinc-700";
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "active":
        return (
          <span className="flex items-center gap-1.5 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Executing
          </span>
        );
      case "completed":
        return (
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
            Finished
          </span>
        );
      default:
        return (
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-500 border border-zinc-800">
            Idle
          </span>
        );
    }
  };

  return (
    <div
      className={`relative min-w-[220px] max-w-[260px] rounded-xl bg-zinc-950/90 backdrop-blur-md p-3.5 border transition-all duration-300 ${getStatusBorder()}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-zinc-700 !border-zinc-950"
      />

      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-zinc-200 tracking-tight">
          {nodeData.label}
        </span>
        {getStatusBadge()}
      </div>

      <p className="text-[11px] text-zinc-400 font-mono mb-2 leading-tight">
        {nodeData.role}
      </p>

      {nodeData.activeMessage && status === "active" && (
        <div className="mt-2 text-[11px] text-emerald-300/90 font-mono bg-emerald-950/40 border border-emerald-900/60 rounded p-1.5 leading-snug line-clamp-2 animate-in fade-in-50">
          {nodeData.activeMessage}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-emerald-500 !border-zinc-950"
      />
    </div>
  );
});

AgentNode.displayName = "AgentNode";
