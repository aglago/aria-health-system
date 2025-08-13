"""
Simple RAG Service that works with the uploaded knowledge base
"""

import os
import json
import logging
from typing import List, Dict
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

logger = logging.getLogger(__name__)

class RAGService:
    """Simple RAG service using TF-IDF for medical knowledge retrieval"""
    
    def __init__(self):
        self.knowledge_bases = []
        self.vectorizer = None
        self.document_vectors = None
        self.chunks = []
        self._load_knowledge_bases()
    
    def _load_knowledge_bases(self):
        """Load all knowledge bases from the knowledge_base directory"""
        knowledge_dir = os.path.join("src", "data", "knowledge_base")
        
        if not os.path.exists(knowledge_dir):
            logger.warning("⚠️ No knowledge_base directory found")
            return
        
        all_chunks = []
        
        for filename in os.listdir(knowledge_dir):
            if filename.endswith('_knowledge.json'):
                filepath = os.path.join(knowledge_dir, filename)
                
                try:
                    with open(filepath, 'r') as f:
                        data = json.load(f)
                    
                    chunks = data.get('chunks', [])
                    source = data.get('source', filename)
                    
                    for i, chunk in enumerate(chunks):
                        all_chunks.append({
                            'text': chunk,
                            'source': source,
                            'chunk_id': i,
                            'filename': filename
                        })
                    
                    logger.info(f"📚 Loaded {len(chunks)} chunks from {filename}")
                    
                except Exception as e:
                    logger.error(f"❌ Failed to load {filename}: {e}")
        
        if all_chunks:
            self.chunks = all_chunks
            self._create_vectors()
            logger.info(f"✅ Total knowledge base: {len(all_chunks)} chunks")
        else:
            logger.warning("⚠️ No knowledge chunks loaded")
    
    def _create_vectors(self):
        """Create TF-IDF vectors from all chunks"""
        if not self.chunks:
            return
        
        texts = [chunk['text'] for chunk in self.chunks]
        self.vectorizer = TfidfVectorizer(max_features=1000, stop_words='english')
        self.document_vectors = self.vectorizer.fit_transform(texts)
        
        logger.info(f"🧮 Created TF-IDF vectors for {len(texts)} chunks")
    
    def search_similar_content(self, query: str, top_k: int = 3) -> List[Dict]:
        """Search for similar content using TF-IDF"""
        if not self.chunks or self.vectorizer is None:
            logger.warning("⚠️ No knowledge base available")
            return []
        
        try:
            # Vectorize query
            query_vector = self.vectorizer.transform([query])
            
            # Calculate similarities
            similarities = cosine_similarity(query_vector, self.document_vectors)[0]
            
            # Get top results
            top_indices = np.argsort(similarities)[::-1][:top_k]
            
            results = []
            for idx in top_indices:
                if similarities[idx] > 0.1:  # Minimum threshold
                    results.append({
                        "text": self.chunks[idx]['text'],
                        "score": float(similarities[idx]),
                        "source": self.chunks[idx]['source'],
                        "chunk_id": self.chunks[idx]['chunk_id'],
                        "filename": self.chunks[idx]['filename']
                    })
            
            logger.info(f"🔍 Found {len(results)} relevant chunks for query")
            return results
            
        except Exception as e:
            logger.error(f"❌ Search failed: {e}")
            return []
    
    def get_enhanced_context(self, query: str, top_k: int = 3) -> str:
        """Get enhanced context for AI response"""
        results = self.search_similar_content(query, top_k)
        
        if not results:
            return "No relevant medical knowledge found in knowledge base."
        
        context_parts = []
        for i, result in enumerate(results, 1):
            # Truncate text for context
            text_snippet = result['text'][:500]
            if len(result['text']) > 500:
                text_snippet += "..."
            
            context_parts.append(f"[Medical Reference {i} - Score: {result['score']:.2f}]: {text_snippet}")
        
        enhanced_context = "\n\n".join(context_parts)
        
        logger.info(f"🧠 Generated enhanced context with {len(results)} medical references")
        return enhanced_context
    
    def get_knowledge_stats(self) -> Dict:
        """Get statistics about the knowledge base"""
        return {
            "total_chunks": len(self.chunks),
            "sources": list(set(chunk['source'] for chunk in self.chunks)),
            "files_loaded": list(set(chunk['filename'] for chunk in self.chunks)),
            "vectorizer_ready": self.vectorizer is not None
        }

# Global simple RAG service instance
rag_service = RAGService()