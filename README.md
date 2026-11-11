# 🛡️ sec_audit (SecArch)

**Autonomous AI-Powered System Architecture & Security Auditor**

SecArch (`sec_audit`) is an advanced agentic security and systems architecture audit platform. It couples **LangGraph stateful workflow orchestration**, **CrewAI specialist personas**, **Hybrid RAG (Dense BAAI/bge-small-en-v1.5 + Sparse BM25)**, and an **AST Deterministic Safety Gate** to inspect codebases, detect security vulnerabilities, audit POSIX conformance, and safely generate verified code patches.

---

## 🌟 Key Capabilities

- **Stateful Agentic Graph (`LangGraph`)**:
  - Implements an Evaluator-Optimizer loop with reflection and conditional execution.
  - Automatically assesses retrieval relevance and triggers retrieval query expansion if needed.
- **Specialized Multi-Agent Squad (`CrewAI` & Google Gemini)**:
  - **Systems Architect Agent**: POSIX compliance, concurrency models (`io_uring`, `epoll`, event loops), memory safety, signal handling, lifecycle management.
  - **Security Auditor Agent**: CIS Benchmarks, OWASP Cheat Sheet standards, memory corruption risks, privilege escalation, and CVE vulnerability patterns.
  - **Performance Optimizer Agent**: Cache locality, vectorization (SIMD), non-blocking zero-copy I/O, syscall overhead reduction.
- **Deterministic AST Safety Guard**:
  - Mathematical AST invariant verification for proposed code patches prior to application.
  - Validates function signature preservation, parameter purity, and guarantees absence of unintended global/nonlocal mutations or unsafe system calls.
- **Auto-Patcher & Instant Rollback**:
  - Automatic backup creation (`.bak`) before modifying code.
  - Generates unified git-style diffs with real-time visual inspection in the UI.
- **Curated Hybrid Knowledge Base**:
  - Over 18,800+ chunks indexed across 7,940 source files including OWASP Cheat Sheets, CIS Benchmarks, Linux Kernel documentation, `liburing`, and systems design manuals.
  - Dual sparse (`BM25Okapi`) + dense (`bge-small-en-v1.5`) retriever with Reciprocal Rank Fusion (RRF).
- **Interactive Modern UI**:
  - Built with **Next.js 15**, **Tailwind CSS v4**, **xyflow / React Flow** (interactive real-time agent workflow execution graph), and syntax-highlighted diff viewer.

---

## 🏗️ Architecture

```
                   +-----------------------------------+
                   |   Workspace Scanner & File Picker  |
                   +-----------------+-----------------+
                                     |
                                     v
                       +---------------------------+
                       |    LangGraph Orchestrator |
                       +-------------+-------------+
                                     |
              +----------------------+----------------------+
              |                                             |
              v                                             v
  +-----------------------+                    +-------------------------+
  | Dense Retr. (Chroma)  |                    | Sparse Retr. (BM25)     |
  +-----------+-----------+                    +------------+------------+
              |                                             |
              +----------------------+----------------------+
                                     | (RRF Fusion)
                                     v
                       +---------------------------+
                       |      Reflection Node      |
                       +-------------+-------------+
                         [Sufficiency Check]
                         /                 \
        (Needs Expansion)                   (Sufficient)
               /                                 \
    [Re-query Retrieval]              +-----------v------------+
                                      | CrewAI Specialist Squad|
                                      | - Systems Architect    |
                                      | - Security Auditor     |
                                      | - Performance Optimizer|
                                      +-----------+------------+
                                                  |
                                                  v
                                      +------------------------+
                                      |    AST Safety Guard    |
                                      | (Deterministic Gate)   |
                                      +-----------+------------+
                                                  |
                                      +-----------v------------+
                                      |  Auto-Patcher (.bak)   |
                                      |  & Executive Synthesis |
                                      +------------------------+
```

---

## 📂 Repository Structure

```
.
├── backend/
│   ├── app.py                     # FastAPI application & SSE streaming endpoints
│   ├── core/
│   │   ├── config.py              # Application settings & multi-key rotation
│   │   └── gemini_client.py       # Resilient Google Gemini client with failover
│   ├── crew/
│   │   ├── agents.py              # CrewAI specialist persona definitions
│   │   └── auto_patcher.py        # Safe in-place code patcher with rollback
│   ├── graph/
│   │   ├── orchestrator.py        # LangGraph state machine & reflection loop
│   │   └── state.py               # AuditState typed schema
│   ├── history/
│   │   └── session_store.py       # Session persistence & report management
│   ├── rag/
│   │   └── hybrid_retriever.py    # BM25 + Vector RRF hybrid retrieval engine
│   └── scanner/
│       ├── ast_guard.py           # AST signature and side-effect safety gate
│       ├── fs_picker.py           # Native file tree and directory picker API
│       └── workspace_scanner.py   # Multi-language codebase analyzer
├── data/
│   └── INGESTION_MANIFEST.md      # Manifest of the 18,800+ indexed security specs
├── frontend/
│   ├── src/
│   │   ├── app/                   # Next.js App Router (Dashboard & reports)
│   │   ├── components/            # React Flow agent pipeline, diffs, history
│   │   └── types/                 # TypeScript interfaces
│   ├── package.json
│   └── tsconfig.json
├── SecArch_Colab_Ingest.ipynb     # Google Colab GPU notebook for RAG indexing
├── requirements.txt               # Python backend dependencies
├── start_backend.sh               # Backend startup script
├── start_frontend.sh              # Frontend startup script
└── .env.example                   # Environment variable template
```

---

## 🚀 Getting Started

### Prerequisites

- **Python**: 3.11+
- **Node.js**: 18+ (Node 20+ recommended) & `npm`
- **Gemini API Key**: At least one key from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/kshrs/sec_audit.git
cd sec_audit
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and provide your Gemini API key(s):

```bash
cp .env.example .env
```

Edit `.env`:
```ini
# Multi-key pool: automatically load balances and fails over across keys
KEY_1="AIzaSy..."
KEY_2="AIzaSy..."

GEMINI_MODEL="gemini-2.0-flash"
TOP_K_RETRIEVAL="6"
```

### 3. Backend Setup

Set up a virtual environment and install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Launch the FastAPI backend (runs on `http://localhost:8000`):

```bash
chmod +x start_backend.sh
./start_backend.sh
```

### 4. Frontend Setup

In a new terminal, install frontend dependencies and start the Next.js development server:

```bash
cd frontend
npm install
npm run dev
```

Or run the provided startup script from the root:

```bash
chmod +x start_frontend.sh
./start_frontend.sh
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Ingesting Custom Knowledge (Optional)

The pre-indexed corpus includes CIS benchmarks, OWASP cheatsheets, and POSIX manuals. To re-index or add custom security standards:

1. Open `SecArch_Colab_Ingest.ipynb` in [Google Colab](https://colab.research.google.com/).
2. Run the notebook using a free **T4 GPU runtime**.
3. Download the generated `chroma_db/` and `bm25_index.pkl` into the local `data/` directory.

---

## 🔒 Safety & AST Safeguards

SecArch incorporates safety-by-design for automated patch proposals:
- **AST Parsing Verification**: Validates AST grammar and rejects code containing syntax errors.
- **Signature Invariance**: Verifies that function arguments, return signatures, and arities match existing interfaces.
- **Purity Checks**: Flags unauthorized global mutations, unexpected lifecycle changes (`fork`, `kill`, `execve`), or privilege tampering.
- **Deterministic Backups**: Every modified file creates a `.bak` copy and provides an atomic one-click rollback.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
