import pickle
from typing import List, Dict, Any, Optional
import numpy as np
import chromadb
from sentence_transformers import SentenceTransformer
from rank_bm25 import BM25Okapi
from backend.core.config import settings

class HybridRetriever:
    """
    Unit 2 Syllabus Implementation:
    Advanced Hybrid RAG combining dense vector embeddings (BAAI/bge-small-en-v1.5)
    with sparse lexical keyword search (BM25Okapi) using Reciprocal Rank Fusion (RRF).
    """

    def __init__(self):
        print(f"[*] Initializing Hybrid RAG Engine from: {settings.DATA_DIR}")
        
        # 1. Load ChromaDB Dense Vector Store
        self.chroma_client = chromadb.PersistentClient(path=str(settings.CHROMA_DB_PATH))
        try:
            self.collection = self.chroma_client.get_collection("secaudit_corpus")
        except Exception:
            try:
                self.collection = self.chroma_client.get_collection("secarch_corpus")
            except Exception:
                self.collection = self.chroma_client.get_or_create_collection("secaudit_corpus")
        
        # 2. Load Local Dense Embedding Model
        self.embed_model = SentenceTransformer(settings.EMBEDDING_MODEL, device="cpu")
        
        # 3. Load Inverted BM25 Index
        with open(settings.BM25_INDEX_PATH, "rb") as f:
            bm25_data = pickle.load(f)
            self.bm25: BM25Okapi = bm25_data["bm25"]
            self.doc_ids: List[str] = bm25_data["ids"]
            self.documents: List[str] = bm25_data["documents"]
            self.metadatas: List[Dict[str, Any]] = bm25_data["metadatas"]
            
        self.id_to_index = {doc_id: idx for idx, doc_id in enumerate(self.doc_ids)}
        print(f"[✔] Hybrid Retriever Ready! Ingested Records: {len(self.doc_ids):,}")

    def search(self, query: str, top_k: int = 5, target_agent: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Executes parallel dense cosine search and sparse BM25 search,
        then fuses rank scores using Reciprocal Rank Fusion (RRF).
        """
        # A. Sparse BM25 Search
        q_tokens = query.lower().split()
        bm25_scores = self.bm25.get_scores(q_tokens)
        bm25_top_indices = np.argsort(bm25_scores)[::-1][:top_k * 3]
        
        # B. Dense Vector Search
        query_embedding = self.embed_model.encode(
            [query], normalize_embeddings=True
        ).tolist()
        
        where_filter = {"target_agent": target_agent} if target_agent else None
        
        dense_results = self.collection.query(
            query_embeddings=query_embedding,
            n_results=top_k * 3,
            where=where_filter
        )
        
        dense_ids = dense_results["ids"][0] if dense_results["ids"] else []
        
        # C. Reciprocal Rank Fusion (RRF) Calculation
        # RRF_Score = 1 / (60 + Rank)
        K = 60
        rrf_scores: Dict[str, float] = {}
        
        # BM25 Ranks
        for rank, idx in enumerate(bm25_top_indices):
            doc_id = self.doc_ids[idx]
            # If target_agent filter requested, ensure BM25 respects it
            if target_agent and self.metadatas[idx].get("target_agent") != target_agent:
                continue
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + (1.0 / (K + rank + 1))
            
        # Dense Ranks
        for rank, doc_id in enumerate(dense_ids):
            rrf_scores[doc_id] = rrf_scores.get(doc_id, 0.0) + (1.0 / (K + rank + 1))
            
        # Sort by final RRF score
        sorted_docs = sorted(rrf_scores.items(), key=lambda item: item[1], reverse=True)[:top_k]
        
        results = []
        for doc_id, score in sorted_docs:
            idx = self.id_to_index[doc_id]
            results.append({
                "id": doc_id,
                "score": round(score, 5),
                "title": self.metadatas[idx].get("title", "Standard Ref"),
                "category": self.metadatas[idx].get("category", "General"),
                "source_repo": self.metadatas[idx].get("source_repo", "SecAudit Core"),
                "content": self.documents[idx]
            })
            
        return results
