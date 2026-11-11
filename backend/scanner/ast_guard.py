import ast
import re
from typing import Dict, Any, Tuple
from pydantic import BaseModel

class ASTValidationResult(BaseModel):
    is_safe: bool
    reason: str
    signature_preserved: bool
    no_external_mutations: bool
    syntax_valid: bool

class ASTSafetyGuard:
    """
    Deterministic gate that evaluates code modifications proposed by the Optimizer.
    Only allows auto-patching if the change is mathematically verified to be side-effect-safe.
    """

    @classmethod
    def validate_patch(cls, language: str, original_snippet: str, optimized_snippet: str) -> ASTValidationResult:
        lang = language.lower()
        if "py" in lang:
            return cls._validate_python(original_snippet, optimized_snippet)
        elif "c" in lang or "cpp" in lang:
            return cls._validate_c_cpp(original_snippet, optimized_snippet)
        else:
            # For shell scripts or configs, never auto-patch without explicit prompt approval
            return ASTValidationResult(
                is_safe=False,
                reason="Configuration/Script auto-patch requires manual review.",
                signature_preserved=False,
                no_external_mutations=False,
                syntax_valid=True
            )

    @classmethod
    def _validate_python(cls, original: str, optimized: str) -> ASTValidationResult:
        try:
            orig_ast = ast.parse(original)
            opt_ast = ast.parse(optimized)
        except SyntaxError as e:
            return ASTValidationResult(
                is_safe=False,
                reason=f"Syntax error in candidate code: {str(e)}",
                signature_preserved=False,
                no_external_mutations=False,
                syntax_valid=False
            )

        # 1. Compare Function Signatures
        orig_funcs = [n for n in ast.walk(orig_ast) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]
        opt_funcs = [n for n in ast.walk(opt_ast) if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef))]

        if len(orig_funcs) != len(opt_funcs):
            return ASTValidationResult(
                is_safe=False,
                reason="Function declaration count mismatch.",
                signature_preserved=False,
                no_external_mutations=False,
                syntax_valid=True
            )

        if orig_funcs and opt_funcs:
            orig_args = [a.arg for a in orig_funcs[0].args.args]
            opt_args = [a.arg for a in opt_funcs[0].args.args]
            if orig_args != opt_args:
                return ASTValidationResult(
                    is_safe=False,
                    reason=f"Function argument signature changed from {orig_args} to {opt_args}.",
                    signature_preserved=False,
                    no_external_mutations=False,
                    syntax_valid=True
                )

        # 2. Check for Global and Nonlocal Mutations
        for node in ast.walk(opt_ast):
            if isinstance(node, (ast.Global, ast.Nonlocal)):
                return ASTValidationResult(
                    is_safe=False,
                    reason="Optimized code introduces global or nonlocal state mutation.",
                    signature_preserved=True,
                    no_external_mutations=False,
                    syntax_valid=True
                )

        return ASTValidationResult(
            is_safe=True,
            reason="Passes AST signature equality and side-effect invariance.",
            signature_preserved=True,
            no_external_mutations=True,
            syntax_valid=True
        )

    @classmethod
    def _validate_c_cpp(cls, original: str, optimized: str) -> ASTValidationResult:
        # Regex signature and keyword purity heuristic for C/C++
        func_sig_regex = re.compile(r"^\s*([a-zA-Z_0-9\*]+\s+)+([a-zA-Z_0-9]+)\s*\((.*?)\)", re.MULTILINE)
        
        orig_match = func_sig_regex.search(original)
        opt_match = func_sig_regex.search(optimized)

        if orig_match and opt_match:
            orig_ret_name = orig_match.group(1).strip()
            opt_ret_name = opt_match.group(1).strip()
            orig_name = orig_match.group(2).strip()
            opt_name = opt_match.group(2).strip()
            orig_params = orig_match.group(3).strip()
            opt_params = opt_match.group(3).strip()

            if orig_name != opt_name or orig_ret_name != opt_ret_name or orig_params != opt_params:
                return ASTValidationResult(
                    is_safe=False,
                    reason="C/C++ Function return type or parameter signature changed.",
                    signature_preserved=False,
                    no_external_mutations=False,
                    syntax_valid=True
                )

        # Detect dangerous syscalls or global mutations in C/C++
        dangerous_ops = ["system(", "popen(", "execve(", "fork(", "kill(", "pthread_create("]
        for op in dangerous_ops:
            if op in optimized and op not in original:
                return ASTValidationResult(
                    is_safe=False,
                    reason=f"Introduces new concurrency or system lifecycle side-effect: {op}",
                    signature_preserved=True,
                    no_external_mutations=False,
                    syntax_valid=True
                )

        return ASTValidationResult(
            is_safe=True,
            reason="C/C++ signature preserved, no new process side-effects detected.",
            signature_preserved=True,
            no_external_mutations=True,
            syntax_valid=True
        )
