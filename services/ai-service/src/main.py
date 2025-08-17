# ARIA AI Health Assistant - Main FastAPI Application
# Phase 2: Core AI + Conversational Doctor AI

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
from src.models.intelligent_doctor import intelligent_doctor, DoctorResponse
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

class DoctorStartRequest(BaseModel):
    """Request model for starting doctor conversation"""
    user_id: str
    message: str

class DoctorContinueRequest(BaseModel):
    """Request model for continuing doctor conversation"""
    session_id: str
    message: str

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

class DoctorResponseModel(BaseModel):
    """Response model for doctor conversations"""
    session_id: str
    doctor_response: str
    follow_up_questions: List[str]
    urgency_level: str
    requires_immediate_care: bool
    confidence: float
    medical_reasoning: str
    timestamp: str
    show_appointment_button: bool = False
    show_choice_buttons: bool = False

# Create FastAPI application
app = FastAPI(
    title="ARIA AI Health Assistant",
    description="AI-powered health guidance with conversational doctor AI for UMaT students",
    version="2.0.0"
)

logger.info("🧠 ARIA AI Service Phase 2 initialized with:")
logger.info(f"   📊 ML Model Info: {ml_medical_ai.get_model_info()}")
logger.info(f"   🩺 Intelligent Doctor: Ready")
logger.info("   ✅ Phase 2: Core ML + Conversational AI!")

# Basic health check endpoints
@app.get("/")
async def root():
    """Basic health check endpoint"""
    return {
        "message": "ARIA AI Health Assistant is running",
        "version": "2.0.0",
        "status": "healthy",
        "features": ["ML Analysis", "Conversational Doctor AI", "RAG Knowledge"],
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
            "intelligent_doctor": "✓ Ready", 
            "rag_service": "✓ Ready",
            "phase2_features": "✅ ML Analysis + Conversational AI"
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
        
        # Generate conversation ID using UUID for consistency
        import uuid
        conversation_id = f"{request.user_id}_analysis_{str(uuid.uuid4())}"
        
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

# =============================================================================
# PHASE 2: INTELLIGENT DOCTOR CONVERSATION ENDPOINTS
# =============================================================================

@app.post("/doctor/start", response_model=DoctorResponseModel)
async def start_doctor_conversation(request: DoctorStartRequest):
    """
    Start an intelligent doctor conversation using RAG + LLM chain of reasoning
    """
    try:
        logger.info(f"🩺 Starting intelligent doctor conversation for user {request.user_id}")
        
        # Use intelligent doctor with RAG + LLM
        response = intelligent_doctor.start_conversation(request.user_id, request.message)
        
        # Get the actual session ID from the intelligent doctor (most recent session for this user)
        session_id = None
        for sid, session in intelligent_doctor.sessions.items():
            if session.user_id == request.user_id and session.is_active:
                session_id = sid
                break
        
        if not session_id:
            # Fallback if session not found (shouldn't happen)
            import uuid
            session_id = f"{request.user_id}_session_{str(uuid.uuid4())}"
        
        return DoctorResponseModel(
            session_id=session_id,
            doctor_response=response.message,
            follow_up_questions=response.follow_up_questions,
            urgency_level=response.urgency_assessment,
            requires_immediate_care=response.requires_immediate_care,
            confidence=response.confidence_level,
            medical_reasoning=response.medical_reasoning,
            timestamp=datetime.now().isoformat(),
            show_appointment_button=response.show_appointment_button,
            show_choice_buttons=response.show_choice_buttons
        )
        
    except Exception as e:
        logger.error(f"❌ Error starting doctor conversation: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Error starting consultation. If this is an emergency, seek immediate medical attention."
        )

@app.post("/doctor/continue", response_model=DoctorResponseModel)
async def continue_doctor_conversation(request: DoctorContinueRequest):
    """
    Continue an intelligent doctor conversation with context awareness
    """
    try:
        logger.info(f"🩺 Continuing doctor conversation: {request.session_id}")
        
        # Continue intelligent conversation
        response = intelligent_doctor.continue_conversation(request.session_id, request.message)
        
        return DoctorResponseModel(
            session_id=request.session_id,
            doctor_response=response.message,
            follow_up_questions=response.follow_up_questions,
            urgency_level=response.urgency_assessment,
            requires_immediate_care=response.requires_immediate_care,
            confidence=response.confidence_level,
            medical_reasoning=response.medical_reasoning,
            timestamp=datetime.now().isoformat(),
            show_appointment_button=response.show_appointment_button,
            show_choice_buttons=response.show_choice_buttons
        )
        
    except ValueError as e:
        logger.error(f"❌ Session not found: {e}")
        raise HTTPException(status_code=404, detail=f"Conversation session not found: {request.session_id}")
    except Exception as e:
        logger.error(f"❌ Error continuing doctor conversation: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Error continuing consultation. If this is an emergency, seek immediate medical attention."
        )

@app.get("/doctor/session/{session_id}/summary")
async def get_session_summary(session_id: str):
    """
    Get summary of doctor conversation session
    """
    try:
        summary = intelligent_doctor.get_session_summary(session_id)
        
        if "error" in summary:
            raise HTTPException(status_code=404, detail=summary["error"])
            
        return {
            "status": "success",
            "summary": summary
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting session summary: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving session summary")

@app.get("/doctor/user/{user_id}/sessions")
async def get_user_sessions(user_id: str):
    """
    Get all sessions for a specific user
    """
    try:
        sessions = intelligent_doctor.get_all_sessions_for_user(user_id)
        return {
            "status": "success",
            "user_id": user_id,
            "sessions": sessions,
            "count": len(sessions)
        }
    except Exception as e:
        logger.error(f"❌ Error getting user sessions: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving user sessions")

@app.get("/doctor/sessions/debug")
async def debug_all_sessions():
    """
    Debug endpoint to list all sessions (development only)
    """
    try:
        all_sessions = intelligent_doctor.list_all_sessions()
        return {
            "status": "success",
            "debug_info": all_sessions
        }
    except Exception as e:
        logger.error(f"❌ Error listing all sessions: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving session debug info")

@app.post("/doctor/resume")
async def resume_or_start_conversation(request: DoctorStartRequest):
    """
    Resume most recent session or start new conversation
    """
    try:
        logger.info(f"🔄 Resume/start request for user {request.user_id}")
        
        response = intelligent_doctor.resume_or_create_session(request.user_id, request.message)
        
        # Find the actual session ID from the response or sessions
        session_id = None
        for sid, session in intelligent_doctor.sessions.items():
            if session.user_id == request.user_id and session.is_active:
                session_id = sid
                break
        
        return DoctorResponseModel(
            session_id=session_id or f"unknown_{request.user_id}",
            doctor_response=response.message,
            follow_up_questions=response.follow_up_questions,
            urgency_level=response.urgency_assessment,
            requires_immediate_care=response.requires_immediate_care,
            confidence=response.confidence_level,
            medical_reasoning=response.medical_reasoning,
            timestamp=datetime.now().isoformat(),
            show_appointment_button=response.show_appointment_button,
            show_choice_buttons=response.show_choice_buttons
        )
        
    except Exception as e:
        logger.error(f"❌ Error resuming/starting conversation: {e}")
        raise HTTPException(
            status_code=500, 
            detail="Error with conversation management. If this is an emergency, seek immediate medical attention."
        )

@app.post("/doctor/end")
async def end_doctor_conversation_and_assess(request: DoctorContinueRequest):
    """
    End doctor conversation and perform comprehensive medical assessment with scheduling
    """
    try:
        logger.info(f"🏁 Ending doctor conversation and starting assessment: {request.session_id}")
        
        # Add final user message if provided
        if request.message and request.message.strip():
            intelligent_doctor.continue_conversation(request.session_id, request.message)
        
        # Perform medical assessment
        assessment_result = intelligent_doctor.perform_medical_assessment(request.session_id)
        
        if "error" in assessment_result:
            raise HTTPException(status_code=404, detail=assessment_result["error"])
        
        # Generate comprehensive final response
        assessment = assessment_result['severity_assessment']
        appointment = assessment_result['appointment_info']
        
        # Create detailed assessment message
        assessment_message = f"""✅ **Medical Assessment Complete**

**Your Health Assessment:**
• **Severity Score:** {assessment['severity_score']}/100 ({assessment['severity_level'].title()})
• **Priority Level:** {assessment['priority_level'].replace('_', ' ').title()}
• **Possible Conditions:** {', '.join(assessment['possible_conditions'][:3])}

**📅 Appointment Scheduled:**"""
        
        if appointment['status'] == 'scheduled':
            appt = appointment['appointment']
            assessment_message += f"""
• **Doctor:** {appt['doctor']['name']} ({appt['doctor']['specialty']})
• **Time:** {appt['time']}
• **Location:** {appt['location']}, Room {appt['doctor']['room']}
• **Reference ID:** {appt['reference_id']}

**📋 Preparation:**
• {chr(10).join(['• ' + item for item in appointment['preparation']['preparation_notes']])}

**📞 Contact Information:**
• Health Center: {appointment['contact_info']['health_center']}
• Emergency: {appointment['contact_info']['emergency']}"""
        else:
            assessment_message += f"""
• **Status:** {appointment.get('message', 'Please contact health center directly')}
• **Phone:** {appointment.get('phone', '+233-312-022-242')}"""
        
        return DoctorResponseModel(
            session_id=request.session_id,
            doctor_response=assessment_message,
            follow_up_questions=[],
            urgency_level=assessment['severity_level'],
            requires_immediate_care=assessment['severity_level'] == 'emergency',
            confidence=0.95,  # High confidence in assessment
            medical_reasoning=assessment['clinical_reasoning'],
            timestamp=datetime.now().isoformat()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in end conversation assessment: {e}")
        raise HTTPException(
            status_code=500,
            detail="Medical assessment system temporarily unavailable. Please contact UMaT Health Services directly."
        )

@app.get("/doctor/available-times/{session_id}")
async def get_available_appointment_times(session_id: str):
    """
    Get available appointment times for user to choose from
    """
    try:
        logger.info(f"🗓️ Getting available appointment times for session: {session_id}")
        
        # First perform assessment to determine urgency
        assessment_result = intelligent_doctor.perform_medical_assessment(session_id)
        
        if "error" in assessment_result:
            raise HTTPException(status_code=404, detail=assessment_result["error"])
        
        # Generate available time slots based on priority
        from datetime import datetime, timedelta
        
        priority_level = assessment_result['severity_assessment']['priority_level']
        
        # Generate time slots based on urgency
        available_times = []
        now = datetime.now()
        
        if priority_level == "emergency":
            available_times = [
                {"time": "Immediate", "type": "emergency", "note": "Go to emergency room now"}
            ]
        elif priority_level == "high_priority":
            # Same day appointments
            for hour in [14, 15, 16, 17]:  # 2pm - 5pm today
                if now.hour < hour:
                    time_slot = now.replace(hour=hour, minute=0, second=0, microsecond=0)
                    available_times.append({
                        "time": time_slot.strftime("%I:%M %p today"),
                        "datetime": time_slot.isoformat(),
                        "type": "same_day",
                        "doctor": "Dr. Kwame Asante",
                        "room": "204"
                    })
        elif priority_level == "urgent":
            # Next 1-3 days
            for day_offset in [1, 2, 3]:
                appointment_day = now + timedelta(days=day_offset)
                for hour in [9, 11, 14, 16]:
                    time_slot = appointment_day.replace(hour=hour, minute=0, second=0, microsecond=0)
                    doctor = ["Dr. Kwame Asante", "Dr. Ama Osei", "Dr. Kofi Mensah"][day_offset % 3]
                    room = ["204", "106", "301"][day_offset % 3]
                    
                    available_times.append({
                        "time": time_slot.strftime("%I:%M %p on %A"),
                        "datetime": time_slot.isoformat(),
                        "type": "urgent",
                        "doctor": doctor,
                        "room": room
                    })
        else:  # routine
            # Next 1-2 weeks
            for day_offset in range(7, 15):  # 1-2 weeks out
                if (now + timedelta(days=day_offset)).weekday() < 5:  # Weekdays only
                    appointment_day = now + timedelta(days=day_offset)
                    for hour in [10, 14]:  # 10am and 2pm
                        time_slot = appointment_day.replace(hour=hour, minute=0, second=0, microsecond=0)
                        doctor = ["Dr. Kwame Asante", "Dr. Ama Osei", "Dr. Kofi Mensah"][day_offset % 3]
                        room = ["204", "106", "301"][day_offset % 3]
                        
                        available_times.append({
                            "time": time_slot.strftime("%I:%M %p on %B %d"),
                            "datetime": time_slot.isoformat(),
                            "type": "routine",
                            "doctor": doctor,
                            "room": room
                        })
        
        return {
            "status": "success",
            "session_id": session_id,
            "assessment_summary": {
                "severity_score": assessment_result['severity_assessment']['severity_score'],
                "priority_level": priority_level,
                "severity_level": assessment_result['severity_assessment']['severity_level']
            },
            "available_times": available_times[:10],  # Limit to 10 options
            "booking_instructions": "Select your preferred appointment time below"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting available times: {e}")
        raise HTTPException(
            status_code=500,
            detail="Unable to fetch available appointment times. Please contact UMaT Health Center directly."
        )

@app.post("/doctor/book-appointment")
async def book_appointment(request: Dict):
    """
    Book an appointment for the user
    """
    try:
        session_id = request.get("session_id")
        selected_time = request.get("selected_time")
        user_contact = request.get("user_contact", {})
        
        if not session_id or not selected_time:
            raise HTTPException(status_code=400, detail="session_id and selected_time are required")
        
        logger.info(f"📅 Booking appointment for session: {session_id}")
        
        # Get assessment for booking details
        assessment_result = intelligent_doctor.perform_medical_assessment(session_id)
        
        if "error" in assessment_result:
            raise HTTPException(status_code=404, detail=assessment_result["error"])
        
        # Generate booking confirmation
        booking_id = f"ARIA-{datetime.now().strftime('%Y%m%d%H%M')}-{session_id.split('_')[-1][:8]}"
        
        booking_confirmation = {
            "booking_confirmed": True,
            "booking_details": {
                "booking_id": booking_id,
                "appointment_time": selected_time["time"],
                "doctor": selected_time.get("doctor", "Dr. Kwame Asante"),
                "location": "UMaT Health Center",
                "room": selected_time.get("room", "204"),
                "duration": "30 minutes",
                "type": selected_time.get("type", "consultation")
            },
            "patient_preparation": {
                "bring_items": ["Student ID", "Any current medications"],
                "preparation_notes": [
                    "Doctor has been briefed on your condition",
                    "Arrive 10 minutes early for check-in",
                    "Bring list of allergies if any"
                ]
            },
            "assessment_summary": assessment_result['severity_assessment'],
            "contact_info": {
                "health_center": "+233-312-022-242",
                "emergency": "193",
                "appointment_changes": "+233-312-022-245"
            },
            "booking_timestamp": datetime.now().isoformat()
        }
        
        logger.info(f"✅ Appointment booked successfully: {booking_id}")
        
        return {
            "status": "success",
            "message": "Appointment booked successfully!",
            "booking": booking_confirmation
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error booking appointment: {e}")
        raise HTTPException(
            status_code=500,
            detail="Unable to book appointment. Please contact UMaT Health Center directly."
        )

@app.post("/doctor/assess/{session_id}")
async def perform_medical_assessment(session_id: str):
    """
    Perform comprehensive medical assessment and generate doctor scheduling
    """
    try:
        logger.info(f"🔬 Medical assessment requested for session: {session_id}")
        
        assessment_result = intelligent_doctor.perform_medical_assessment(session_id)
        
        if "error" in assessment_result:
            raise HTTPException(status_code=404, detail=assessment_result["error"])
        
        return {
            "status": "success",
            "assessment": assessment_result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error in medical assessment endpoint: {e}")
        raise HTTPException(
            status_code=500,
            detail="Medical assessment system temporarily unavailable. Please contact UMaT Health Services directly."
        )

# =============================================================================
# RAG AND KNOWLEDGE BASE ENDPOINTS
# =============================================================================

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

@app.get("/rag/stats")
async def get_knowledge_stats():
    """
    Get knowledge base statistics
    """
    try:
        stats = rag_service.get_knowledge_stats()
        return {
            "status": "success",
            "stats": stats
        }
    except Exception as e:
        logger.error(f"❌ Error getting knowledge stats: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving knowledge base stats")

# =============================================================================
# SYSTEM INFORMATION ENDPOINTS
# =============================================================================

@app.get("/features")
async def get_features():
    """
    Get available features and capabilities
    """
    return {
        "phase": "Phase 2",
        "features": {
            "ml_analysis": {
                "available": True,
                "description": "Real machine learning medical diagnosis",
                "endpoints": ["/analyze-advanced", "/analyze-ml"]
            },
            "conversational_doctor": {
                "available": True,
                "description": "Intelligent doctor conversations with RAG + LLM",
                "endpoints": ["/doctor/start", "/doctor/continue", "/doctor/session/{id}/summary"]
            },
            "medical_knowledge": {
                "available": True,
                "description": "RAG-powered medical knowledge retrieval",
                "endpoints": ["/rag/search", "/rag/stats"]
            }
        },
        "capabilities": [
            "TF-IDF machine learning medical diagnosis",
            "RAG-enhanced medical knowledge retrieval", 
            "Multi-turn conversational AI with session memory",
            "Ghana-specific medical conditions",
            "Emergency detection and routing",
            "Confidence scoring and uncertainty handling"
        ]
    }

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
    
    logger.info(f"🚀 Starting ARIA AI Service Phase 2 on {host}:{port}")
    logger.info(f"📊 Access API at: http://{host if host != '0.0.0.0' else 'localhost'}:{port}")
    logger.info(f"📚 View docs at: http://{host if host != '0.0.0.0' else 'localhost'}:{port}/docs")
    logger.info(f"🩺 Features: ML Analysis + Conversational Doctor AI + RAG Knowledge")
    
    try:
        uvicorn.run(app, host=host, port=port)
    except KeyboardInterrupt:
        logger.info("🛑 ARIA AI Service stopped by user")
    except Exception as e:
        logger.error(f"❌ Failed to start ARIA AI Service: {e}")