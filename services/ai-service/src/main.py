# ARIA AI Health Assistant - Main FastAPI Application
# This is the core AI service that analyzes symptoms and provides health guidance

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Optional
import logging
from datetime import datetime
import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import our models and services
from src.models.ml_medical_ai import ml_medical_ai, MLDiagnosis
from src.services.rag_service import rag_service

# Data models for API requests and responses
class SymptomAnalysisRequest(BaseModel):
    """Request model for symptom analysis"""
    symptoms: str
    conversation_id: Optional[str] = None
    user_demographics: Optional[Dict] = None
    language: str = "en"

class AdvancedAnalysisRequest(BaseModel):
    """Request model for advanced symptom analysis with medical context"""
    symptoms: str
    user_id: str
    medical_context: Optional[Dict] = None
    conversation_history: Optional[List[Dict]] = None
    language: str = "en"

class HealthResponse(BaseModel):
    """Response model for health guidance"""
    primary_analysis: str
    confidence: float
    urgency_level: str  # low, medium, high, emergency
    immediate_advice: str
    follow_up_questions: List[str]
    red_flags: List[str]
    next_steps: str
    conversation_id: str
    should_seek_medical_attention: bool
    estimated_severity: str

class AdvancedHealthResponse(BaseModel):
    """Response model for advanced health analysis with medical context"""
    primary_diagnosis: str
    confidence: float
    urgency_level: str
    severity: str
    differential_diagnoses: List[Dict]
    risk_assessment: Dict
    personalized_advice: List[str]
    medication_interactions: List[str]
    follow_up_recommendations: List[str]
    red_flags: List[str]
    cultural_considerations: List[str]
    next_steps: str
    conversation_id: str
    timestamp: str

# Create FastAPI application
app = FastAPI(
    title="ARIA AI Health Assistant",
    description="AI-powered health guidance for UMaT students during off-hours",
    version="2.0.0"
)

logger.info("🧠 ARIA AI Service initialized with:")
logger.info(f"   📊 ML Model Info: {ml_medical_ai.get_model_info()}")
logger.info("   ✅ Phase 1: Core functionality with clean architecture!")

# Basic health check endpoints
@app.get("/")
async def root():
    """Basic health check endpoint"""
    return {
        "message": "ARIA AI Health Assistant is running",
        "version": "2.0.0",
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Detailed health check endpoint"""
    return {
        "status": "healthy",
        "service": "ARIA AI Health Assistant",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat(),
        "dependencies": {
            "fastapi": "✓ Running",
            "ml_medical_ai": "✓ Ready",
            "rag_service": "✓ Ready",
            "phase1_features": "✓ Enabled"
        }
    }

# Core ML Analysis Endpoint
@app.post("/analyze-advanced", response_model=AdvancedHealthResponse)
async def analyze_symptoms_advanced(request: AdvancedAnalysisRequest):
    """
    Advanced symptom analysis with ML and RAG
    """
    try:
        logger.info(f"🧠 Advanced analysis for user {request.user_id}: {request.symptoms[:100]}...")
        
        # Get medical context from RAG
        medical_context = rag_service.get_enhanced_context(request.symptoms)
        
        # Perform ML analysis
        ml_diagnosis = ml_medical_ai.analyze_symptoms_ml(
            symptoms=request.symptoms,
            medical_context=request.medical_context
        )
        
        # Generate conversation ID
        conversation_id = f"{request.user_id}_{int(datetime.now().timestamp())}"
        
        # Convert to response format
        response = AdvancedHealthResponse(
            primary_diagnosis=ml_diagnosis.primary_condition,
            confidence=ml_diagnosis.confidence,
            urgency_level=ml_diagnosis.urgency_level,
            severity=ml_diagnosis.severity,
            differential_diagnoses=ml_diagnosis.differential_diagnoses,
            risk_assessment={
                "overall_risk_score": ml_diagnosis.confidence,
                "risk_level": ml_diagnosis.urgency_level,
                "ml_features": ml_diagnosis.ml_features
            },
            personalized_advice=[ml_diagnosis.reasoning],
            medication_interactions=[],
            follow_up_recommendations=["Monitor symptoms", "Seek medical care if symptoms worsen"],
            red_flags=["Seek immediate care if symptoms become severe"],
            cultural_considerations=[
                "🏥 UMaT health center available for student consultations",
                "🇬🇭 Ghana-specific conditions considered in analysis"
            ],
            next_steps=f"Based on ML analysis: {ml_diagnosis.reasoning}",
            conversation_id=conversation_id,
            timestamp=ml_diagnosis.timestamp.isoformat()
        )
        
        logger.info(f"✅ Advanced analysis complete: {ml_diagnosis.urgency_level} urgency")
        return response
        
    except Exception as e:
        logger.error(f"❌ Error in advanced analysis: {e}")
        raise HTTPException(status_code=500, detail="Error processing advanced analysis")

# Direct ML Analysis Endpoint
@app.post("/analyze-ml")
async def analyze_symptoms_direct_ml(request: Dict):
    """
    Direct ML analysis endpoint to showcase real machine learning capabilities
    """
    try:
        symptoms = request.get('symptoms')
        medical_context = request.get('medical_context', {})
        
        if not symptoms:
            raise HTTPException(status_code=400, detail="symptoms field is required")
        
        logger.info(f"🧠 Direct ML analysis: {symptoms[:100]}...")
        
        # Use ML engine directly
        ml_diagnosis = ml_medical_ai.analyze_symptoms_ml(symptoms, medical_context)
        
        response = {
            "ml_analysis": {
                "primary_condition": ml_diagnosis.primary_condition,
                "confidence": ml_diagnosis.confidence,
                "similarity_score": ml_diagnosis.similarity_score,
                "urgency_level": ml_diagnosis.urgency_level,
                "severity": ml_diagnosis.severity,
                "reasoning": ml_diagnosis.reasoning,
                "differential_diagnoses": ml_diagnosis.differential_diagnoses,
                "ml_features": ml_diagnosis.ml_features,
                "timestamp": ml_diagnosis.timestamp.isoformat()
            },
            "model_info": ml_medical_ai.get_model_info(),
            "analysis_type": "Real Machine Learning (TF-IDF + Weighted Similarity)",
            "is_real_ml": True
        }
        
        logger.info(f"✅ ML analysis complete: {ml_diagnosis.primary_condition}")
        return response
        
    except Exception as e:
        logger.error(f"❌ Error in direct ML analysis: {e}")
        raise HTTPException(status_code=500, detail=f"ML analysis error: {str(e)}")

# RAG Search Endpoint
@app.post("/rag/search")
async def search_medical_knowledge(request: Dict):
    """
    Search medical knowledge using RAG
    """
    try:
        query = request.get('query')
        top_k = request.get('top_k', 5)
        
        if not query:
            raise HTTPException(status_code=400, detail="query is required")
        
        results = rag_service.search_similar_content(query, top_k)
        
        return {
            "status": "success",
            "query": query,
            "results": results,
            "count": len(results)
        }
        
    except Exception as e:
        logger.error(f"❌ Error searching medical knowledge: {e}")
        raise HTTPException(status_code=500, detail="Error searching medical knowledge")

# Run the application
if __name__ == "__main__":
    import socket
    
    # Get configuration from environment variables
    host = os.getenv("AI_SERVICE_HOST", "0.0.0.0")
    port = int(os.getenv("AI_SERVICE_PORT", "8000"))
    
    # Check if port is available
    def is_port_in_use(port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            return s.connect_ex(('localhost', port)) == 0
    
    # Find available port if default is in use
    original_port = port
    while is_port_in_use(port) and port < original_port + 10:
        logger.warning(f"⚠️  Port {port} is already in use, trying port {port + 1}")
        port += 1
    
    if port != original_port:
        logger.info(f"🔄 Using port {port} instead of {original_port}")
    
    if is_port_in_use(port):
        logger.error(f"❌ Could not find available port. Ports {original_port}-{port} are all in use.")
        exit(1)
    
    logger.info(f"🚀 Starting ARIA AI Service on {host}:{port}")
    logger.info(f"📊 Access API at: http://{host if host != '0.0.0.0' else 'localhost'}:{port}")
    logger.info(f"📚 View docs at: http://{host if host != '0.0.0.0' else 'localhost'}:{port}/docs")
    
    try:
        uvicorn.run(app, host=host, port=port)
    except KeyboardInterrupt:
        logger.info("🛑 ARIA AI Service stopped by user")
    except Exception as e:
        logger.error(f"❌ Failed to start ARIA AI Service: {e}")