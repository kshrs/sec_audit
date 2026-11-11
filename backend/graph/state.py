from typing import TypedDict, List, Dict, Any, Optional

class AuditState(TypedDict):
    # Workspace Inputs
    project_path: str
    user_goals: str
    file_manifest: List[Dict[str, Any]]
    code_snippets: Dict[str, str]
    
    # RAG Stage
    retrieved_specs: List[Dict[str, Any]]
    rag_citations: List[Dict[str, Any]]
    
    # LangGraph Reflection & Evaluation
    reflection_score: float
    retrieval_sufficient: bool
    
    # CrewAI Specialists Outputs
    systems_architect_report: str
    security_auditor_report: str
    optimizer_report: str
    
    # AST Verification & Patching
    optimizations: List[Dict[str, Any]]
    passive_patches_applied: int
    active_actions_required: int
    architectural_bugs_found: int
    code_vulnerabilities_found: int
    
    # Final Synthesized Report
    final_report_md: str
    run_timestamp: str
