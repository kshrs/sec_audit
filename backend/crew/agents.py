from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from crewai import Agent, Task, Crew, Process
from backend.core.gemini_client import GeminiEngine

class OptimizationItem(BaseModel):
    heading: str
    target_file: str
    line_numbers: str
    old_code_block: str
    new_code_block: str
    advantages: List[str]
    potential_conflicts: List[str]
    has_side_effects: bool
    signature_preserved: bool

class SecAuditCrew:
    """
    CrewAI Multi-Agent Specialist Squad (Unit 5 Syllabus Implementation):
    1. Systems Architect (POSIX & Modern Concurrency standards)
    2. Security Auditor (CVE & CIS Benchmarks)
    3. Optimizer & Auto-Patcher (Low-level performance & AST verification)
    """

    def __init__(self, gemini_engine: Optional[GeminiEngine] = None):
        self.gemini = gemini_engine or GeminiEngine()

    def run_squad(
        self,
        project_context: str,
        retrieved_specs: List[Dict[str, Any]],
        user_goals: str = ""
    ) -> Dict[str, Any]:
        """
        Executes sequential deliberation across the three specialist personas.
        """
        # 1. Systems Architect Analysis
        architect_prompt = f"""
You are the Systems Architect agent for SecAudit.
Review the following project context and POSIX/System reference specs:

[PROJECT CONTEXT]:
{project_context}

[USER CUSTOM GOALS]:
{user_goals or "Standard POSIX conformance and modern async architecture."}

[RETRIEVED STANDARDS & SPECS]:
{chr(10).join([f"- [{s['title']}]: {s['content'][:300]}..." for s in retrieved_specs if s.get('target_agent') == 'systems_architect' or True][:4])}

Provide an architectural evaluation:
1. Concurrency model evaluation (blocking vs event-driven / io_uring / epoll).
2. Memory management and POSIX lifecycle compliance (signals, fork, pipes, zombies).
3. Modern architectural recommendations.
"""
        architect_findings = self.gemini.generate_text(
            prompt=architect_prompt,
            system_instruction="You are a veteran Linux Systems Architect specializing in POSIX standards and modern low-latency architectures."
        )

        # 2. Security Auditor Analysis
        security_prompt = f"""
You are the Security Auditor agent for SecAudit.
Review the project files and ingested CVE/CIS benchmarks:

[PROJECT CONTEXT]:
{project_context}

[ARCHITECTURAL EVALUATION]:
{architect_findings}

[RETRIEVED SECURITY STANDARDS (OWASP & CIS)]:
{chr(10).join([f"- [{s['title']}]: {s['content'][:300]}..." for s in retrieved_specs if s.get('target_agent') == 'security_auditor'][:4])}

Perform a rigorous security audit:
1. Flag any insecure configurations, missing sandboxing directives, or unsafe syscalls.
2. Cross-reference potential CVE patterns (buffer overflows, path traversals, privilege escalation).
3. Provide remediation steps citing exact CIS controls or OWASP recommendations.
"""
        security_findings = self.gemini.generate_text(
            prompt=security_prompt,
            system_instruction="You are a Red-Team Security Auditor specialized in Linux binary security, CIS benchmarks, and OWASP standards."
        )

        # 3. Performance Optimizer Analysis
        optimizer_prompt = f"""
You are the Performance Optimizer agent for SecAudit.
Your goal is to inspect code blocks in the project and identify actionable, high-performance optimizations (SIMD vectorization, avoiding unnecessary syscalls/copies, cache locality, non-blocking I/O).

[PROJECT CONTEXT]:
{project_context}

[SECURITY FINDINGS]:
{security_findings}

Identify candidate code blocks for optimization. For each proposed improvement:
1. Provide the exact heading, target file, and line numbers.
2. Provide the old unoptimized block with comments.
3. Provide the new optimized block with comments.
4. List 1 to 5 advantages (or 'NIL').
5. List 1 to 5 potential future conflicts / risks (or 'NIL').
6. Explicitly state whether the change introduces side effects and if signatures are preserved.
"""
        optimizer_findings = self.gemini.generate_text(
            prompt=optimizer_prompt,
            system_instruction="You are a low-level Systems Performance Engineer specializing in CPU microarchitecture, cache tuning, and Linux zero-copy I/O."
        )

        return {
            "architect_report": architect_findings,
            "security_report": security_findings,
            "optimizer_report": optimizer_findings
        }
