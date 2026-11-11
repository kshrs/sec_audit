export interface WorkspaceFile {
  path: string;
  relative_path: string;
  name: string;
  extension: string;
  size_bytes: number;
  category: string;
}

export interface WorkspaceSummary {
  total_files: number;
  file_tree: Record<string, any>;
  detected_languages: string[];
  configs_detected: string[];
  code_files: WorkspaceFile[];
  config_files: WorkspaceFile[];
}

export interface ScanResponse {
  summary: WorkspaceSummary;
  initial_inference: string;
}

export interface AuditStreamEvent {
  type: "NODE_ACTIVE" | "FLOW_SIGNAL" | "RAG_CHUNK_LOADED" | "AUDIT_COMPLETED" | "ERROR";
  node_id: string;
  message: string;
  payload?: any;
}

export interface AuditHistoryItem {
  run_id: string;
  project_path: string;
  timestamp: string;
  passive_patches: number;
  architectural_bugs: number;
  vulnerabilities: number;
  report_url: string;
}
