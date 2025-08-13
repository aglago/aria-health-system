"""
Intelligent Doctor Service using RAG + LLM Chain of Reasoning
Phase 2: Conversational AI with clean architecture
"""

import json
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from dataclasses import dataclass
import os
import uuid
from dotenv import load_dotenv

# Import our services
from ..services.rag_service import rag_service

load_dotenv()
logger = logging.getLogger(__name__)

@dataclass
class ConversationMessage:
    """Single message in conversation"""
    role: str  # "user" or "doctor"
    message: str
    timestamp: datetime
    medical_context: Optional[Dict] = None

@dataclass
class ConversationSession:
    """Complete conversation session"""
    session_id: str
    user_id: str
    messages: List[ConversationMessage]
    created_at: datetime
    last_interaction: datetime
    is_active: bool = True

@dataclass
class DoctorResponse:
    """Doctor's intelligent response"""
    message: str
    follow_up_questions: List[str]
    urgency_assessment: str = "low"  # low, medium, high, emergency
    medical_reasoning: str = ""
    requires_immediate_care: bool = False
    confidence_level: float = 0.0

class IntelligentDoctor:
    """
    AI Doctor using Chain of Reasoning: RAG → LLM → Response
    """
    
    def __init__(self):
        """Initialize intelligent doctor"""
        self.sessions: Dict[str, ConversationSession] = {}
        self.openai_client: Optional[Any] = None  # Dynamic OpenAI client type
        self._initialize_llm()
        
    def _initialize_llm(self):
        """Initialize OpenAI or other LLM"""
        try:
            api_key = os.getenv("OPENAI_API_KEY")
            if api_key and api_key not in ["your_openai_api_key_here", "your_ope********here", ""]:
                try:
                    import openai
                    openai.api_key = api_key
                    self.openai_client = openai
                    logger.info("✅ OpenAI LLM initialized successfully")
                except ImportError:
                    logger.warning("⚠️ OpenAI package not installed. Using intelligent fallback responses.")
                    self.openai_client = None
            else:
                if api_key in ["your_openai_api_key_here", "your_ope********here"]:
                    logger.info("ℹ️ OpenAI API key is placeholder. Using intelligent fallback responses.")
                else:
                    logger.info("ℹ️ No OpenAI API key configured. Using intelligent fallback responses.")
                self.openai_client = None
        except Exception as e:
            logger.warning(f"⚠️ LLM initialization issue: {e}. Using intelligent fallback responses.")
            self.openai_client = None
    
    def start_conversation(self, user_id: str, initial_message: str) -> DoctorResponse:
        """Start new conversation with intelligent chain of reasoning"""
        # Generate proper session ID using UUID for reliability
        session_uuid = str(uuid.uuid4())
        session_id = f"{user_id}_session_{session_uuid}"
        
        # Create new session
        session = ConversationSession(
            session_id=session_id,
            user_id=user_id,
            messages=[],
            created_at=datetime.now(),
            last_interaction=datetime.now()
        )
        
        # Add user's first message
        user_msg = ConversationMessage(
            role="user",
            message=initial_message,
            timestamp=datetime.now()
        )
        session.messages.append(user_msg)
        
        self.sessions[session_id] = session
        
        # Generate intelligent response
        response = self._generate_intelligent_response(session, initial_message)
        
        # Add doctor's response to session
        doctor_msg = ConversationMessage(
            role="doctor", 
            message=response.message,
            timestamp=datetime.now(),
            medical_context={
                "urgency": response.urgency_assessment,
                "confidence": response.confidence_level
            }
        )
        session.messages.append(doctor_msg)
        
        logger.info(f"🩺 Started intelligent consultation: {session_id}")
        return response
    
    def continue_conversation(self, session_id: str, user_message: str) -> DoctorResponse:
        """Continue conversation with context awareness"""
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        session = self.sessions[session_id]
        session.last_interaction = datetime.now()
        
        # Add user message
        user_msg = ConversationMessage(
            role="user",
            message=user_message,
            timestamp=datetime.now()
        )
        session.messages.append(user_msg)
        
        # Generate intelligent response with conversation context
        response = self._generate_intelligent_response(session, user_message)
        
        # Add doctor response
        doctor_msg = ConversationMessage(
            role="doctor",
            message=response.message,
            timestamp=datetime.now(),
            medical_context={
                "urgency": response.urgency_assessment,
                "confidence": response.confidence_level
            }
        )
        session.messages.append(doctor_msg)
        
        logger.info(f"🩺 Continued intelligent consultation: {session_id}")
        return response
    
    def _generate_intelligent_response(self, session: ConversationSession, current_message: str) -> DoctorResponse:
        """
        Chain of Reasoning: RAG → Context → LLM → Response
        """
        try:
            # Step 1: RAG - Get relevant medical knowledge
            medical_context = self._get_medical_context(current_message)
            
            # Step 2: Build conversation context
            conversation_context = self._build_conversation_context(session)
            
            # Step 3: LLM - Generate doctor response
            if self.openai_client:
                response = self._generate_llm_response(
                    current_message, 
                    medical_context, 
                    conversation_context
                )
            else:
                response = self._generate_fallback_response(
                    current_message, 
                    medical_context,
                    conversation_context
                )
            
            # Step 4: Assess urgency and confidence
            urgency = self._assess_urgency_intelligent(current_message, medical_context)
            confidence = self._calculate_confidence_intelligent(medical_context, conversation_context)
            
            return DoctorResponse(
                message=response["message"],
                follow_up_questions=response.get("follow_up_questions", []),
                urgency_assessment=urgency,
                medical_reasoning=response.get("reasoning", ""),
                requires_immediate_care=urgency in ["high", "emergency"],
                confidence_level=confidence
            )
            
        except Exception as e:
            logger.error(f"❌ Error generating intelligent response: {e}")
            return self._generate_error_response()
    
    def _get_medical_context(self, user_message: str) -> str:
        """Step 1: Use RAG to get relevant medical knowledge"""
        try:
            # Use RAG service to find relevant medical information
            medical_context = rag_service.get_enhanced_context(user_message, top_k=3)
            
            logger.info(f"🧠 Retrieved medical context: {len(medical_context)} characters")
            return medical_context
            
        except Exception as e:
            logger.error(f"❌ Failed to get medical context: {e}")
            return "No additional medical knowledge available."
    
    def _build_conversation_context(self, session: ConversationSession) -> str:
        """Step 2: Build conversation history context"""
        try:
            if len(session.messages) <= 1:
                return "This is the start of the consultation."
            
            # Get last few messages for context
            recent_messages = session.messages[-6:]  # Last 3 exchanges
            
            context_parts = []
            for msg in recent_messages:
                role = "Patient" if msg.role == "user" else "Doctor"
                context_parts.append(f"{role}: {msg.message}")
            
            conversation_context = "\n".join(context_parts)
            
            logger.info(f"📝 Built conversation context: {len(recent_messages)} messages")
            return conversation_context
            
        except Exception as e:
            logger.error(f"❌ Failed to build conversation context: {e}")
            return "No conversation history available."
    
    def _generate_llm_response(self, user_message: str, medical_context: str, conversation_context: str) -> Dict:
        """Step 3: Generate response using LLM with medical knowledge"""
        try:
            # Create comprehensive prompt for the LLM
            system_prompt = """You are an experienced, caring medical doctor providing virtual consultations to university students. 

Your role:
- Ask thoughtful follow-up questions like a real doctor would
- Provide medical guidance based on symptoms and medical knowledge
- Be empathetic and professional
- Assess urgency appropriately
- Give clear next steps

Always respond in this JSON format:
{
    "message": "Your caring doctor response here",
    "follow_up_questions": ["Question 1?", "Question 2?"],
    "reasoning": "Brief medical reasoning for your assessment"
}
"""
            
            user_prompt = f"""
Patient says: "{user_message}"

Relevant medical knowledge:
{medical_context}

Previous conversation:
{conversation_context}

Please respond as a caring doctor would, asking appropriate follow-up questions and providing medical guidance.
"""
            
            # Try OpenAI API call with proper error handling
            if self.openai_client is None:
                raise Exception("OpenAI client not available")
                
            try:
                if hasattr(self.openai_client, 'ChatCompletion'):
                    # Older OpenAI API (v0.x)
                    response = self.openai_client.ChatCompletion.create(  # type: ignore
                        model="gpt-3.5-turbo",
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        temperature=0.7,
                        max_tokens=500
                    )
                    llm_text = response.choices[0].message.content  # type: ignore
                elif hasattr(self.openai_client, 'chat'):
                    # Newer OpenAI API (v1.x)
                    response = self.openai_client.chat.completions.create(  # type: ignore
                        model="gpt-3.5-turbo",
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        temperature=0.7,
                        max_tokens=500
                    )
                    llm_text = response.choices[0].message.content  # type: ignore
                else:
                    # OpenAI client structure not recognized
                    raise Exception("OpenAI API structure not recognized")
            except AttributeError as e:
                # OpenAI client structure not as expected, fallback
                raise Exception(f"OpenAI API structure error: {e}")
            
            # Parse LLM response
            try:
                # Try to parse as JSON
                parsed_response = json.loads(llm_text)
                return parsed_response
            except json.JSONDecodeError:
                # Fallback if not valid JSON
                return {
                    "message": llm_text,
                    "follow_up_questions": ["How are you feeling now?", "Any other symptoms?"],
                    "reasoning": "Generated from LLM response"
                }
                
        except Exception as e:
            logger.error(f"❌ LLM generation failed: {e}")
            return self._generate_fallback_response(user_message, medical_context, conversation_context)
    
    def _generate_fallback_response(self, user_message: str, medical_context: str, conversation_context: Optional[str] = None) -> Dict:
        """Context-aware fallback response when LLM is not available"""
        message_lower = user_message.lower()
        
        # Check if this is part of an ongoing conversation
        is_ongoing_conversation = conversation_context and "Patient:" in conversation_context and len(conversation_context) > 50
        
        # Use medical_context for emergency detection if available
        context_lower = medical_context.lower() if medical_context else ""
        
        # Handle greetings (only if it's the start of conversation)
        if any(word in message_lower for word in ["hi", "hello", "hey"]) and not is_ongoing_conversation:
            message = "Hello! I'm here to help with your health concerns. What symptoms or health issues would you like to discuss?"
            questions = ["What symptoms are you experiencing?", "How are you feeling today?"]
        
        # Handle follow-up responses about timing/duration
        elif any(timing in message_lower for timing in ["started", "ago", "hours", "days", "weeks", "began", "since"]):
            if is_ongoing_conversation:
                message = f"Thank you for that timing information - {user_message}. Now, on a scale of 1 to 10, with 10 being the worst pain you can imagine, how would you rate the intensity of your symptoms?"
                questions = []  # No quick replies - wait for their answer
            else:
                message = f"I understand this started {user_message}. Can you describe the main symptoms you're experiencing in detail?"
                questions = []
        
        # Handle pain scale responses
        elif any(scale in message_lower for scale in ["out of 10", "scale", "rate", "/10", "pain level"]) or any(str(i) in user_message for i in range(1, 11)):
            if is_ongoing_conversation:
                message = f"I understand you're rating this as {user_message}. That helps me assess the severity. Now, have you tried any treatments, medications, or remedies so far to help with this?"
                questions = []  # Wait for their answer about treatments
            else:
                message = f"Thank you for that severity rating. Can you tell me more about what specific symptoms you're experiencing?"
                questions = []
        
        # Handle treatment/medication responses
        elif any(treatment in message_lower for treatment in ["tried", "taken", "medication", "treatment", "nothing", "haven't"]):
            if is_ongoing_conversation:
                message = f"I understand about the treatments - {user_message}. Now, are there any other symptoms you're experiencing along with this, or anything that makes it feel better or worse?"
                questions = []  # Wait for their answer about additional symptoms/triggers
            else:
                message = f"Thank you for sharing that treatment information. Can you describe your main symptoms in detail?"
                questions = []
        
        # Handle common symptoms (initial presentation)
        elif any(symptom in message_lower for symptom in ["fever", "headache", "pain", "nausea", "urinating", "burning", "ache"]):
            if is_ongoing_conversation:
                message = f"I understand you're also experiencing {user_message}. That's important additional information. Can you tell me how long you've been having this particular symptom?"
                questions = []  # Ask one question at a time
            else:
                message = f"I understand you're experiencing {user_message}. To help me assess your situation properly, when did this start?"
                questions = []  # Start with timing question first
        
        # Handle emergency keywords
        elif any(emergency in message_lower or emergency in context_lower for emergency in ["chest pain", "can't breathe", "emergency", "severe"]):
            message = "Based on what you've described, this sounds like it could be serious. I recommend seeking immediate medical attention."
            questions = ["Are you able to get to a hospital or emergency room right now?"]
        
        # Context-aware default response
        else:
            if is_ongoing_conversation:
                # Try to determine what information we might still need
                message_count = conversation_context.count("Patient:") if conversation_context else 0
                if message_count <= 2:
                    message = f"Thank you for that information: '{user_message}'. To complete my assessment, is there anything else about your symptoms that you think I should know?"
                else:
                    message = f"Thank you for providing that additional information. Based on everything you've told me, let me provide you with my assessment and recommendations."
                questions = []  # Let user provide final details or wait for assessment
            else:
                message = f"I understand you mentioned: '{user_message}'. Can you tell me more details about what you're experiencing?"
                questions = []
        
        return {
            "message": message,
            "follow_up_questions": questions,
            "reasoning": "Generated using medical context analysis and conversation-aware symptom recognition"
        }
    
    def _assess_urgency_intelligent(self, user_message: str, medical_context: str) -> str:
        """Intelligent urgency assessment using medical context"""
        message_lower = user_message.lower()
        context_lower = medical_context.lower()
        
        # Emergency keywords
        emergency_terms = ["chest pain", "can't breathe", "severe bleeding", "unconscious", "emergency"]
        if any(term in message_lower or term in context_lower for term in emergency_terms):
            return "emergency"
        
        # High urgency keywords
        high_terms = ["severe pain", "high fever", "vomiting blood", "difficulty breathing"]
        if any(term in message_lower or term in context_lower for term in high_terms):
            return "high"
        
        # Medium urgency keywords
        medium_terms = ["fever", "pain", "nausea", "headache"]
        if any(term in message_lower for term in medium_terms):
            return "medium"
        
        return "low"
    
    def _calculate_confidence_intelligent(self, medical_context: str, conversation_context: str) -> float:
        """Calculate confidence based on available information"""
        confidence = 0.3  # Base confidence
        
        # Increase confidence based on medical context quality
        if len(medical_context) > 100:
            confidence += 0.2
        
        if "medical" in medical_context.lower() or "symptoms" in medical_context.lower():
            confidence += 0.1
        
        # Increase confidence based on conversation depth
        if "Patient:" in conversation_context and len(conversation_context) > 50:
            confidence += 0.2
        
        return min(confidence, 0.8)  # Cap at 80%
    
    def _generate_error_response(self) -> DoctorResponse:
        """Generate response when there's an error"""
        return DoctorResponse(
            message="I apologize, but I'm having trouble processing your request right now. If this is a medical emergency, please seek immediate medical attention or call emergency services.",
            follow_up_questions=["Is this a medical emergency?"],
            urgency_assessment="high",
            requires_immediate_care=True,
            confidence_level=0.0
        )
    
    def get_session_summary(self, session_id: str) -> Dict:
        """Get session summary for analytics"""
        if session_id not in self.sessions:
            return {"error": f"Session not found: {session_id}"}
        
        session = self.sessions[session_id]
        
        return {
            "session_id": session_id,
            "user_id": session.user_id,
            "message_count": len(session.messages),
            "duration_minutes": (session.last_interaction - session.created_at).total_seconds() / 60,
            "is_active": session.is_active,
            "last_urgency": session.messages[-1].medical_context.get("urgency", "unknown") if session.messages and session.messages[-1].medical_context else "unknown"
        }
    
    def get_all_sessions_for_user(self, user_id: str) -> List[Dict]:
        """Get all sessions for a specific user"""
        user_sessions = []
        for session_id, session in self.sessions.items():
            if session.user_id == user_id:
                user_sessions.append({
                    "session_id": session_id,
                    "created_at": session.created_at.isoformat(),
                    "last_interaction": session.last_interaction.isoformat(),
                    "message_count": len(session.messages),
                    "is_active": session.is_active,
                    "duration_minutes": (session.last_interaction - session.created_at).total_seconds() / 60
                })
        return user_sessions
    
    def resume_or_create_session(self, user_id: str, message: str) -> DoctorResponse:
        """Resume most recent session or create new one"""
        # Find most recent active session for user
        recent_session = None
        most_recent_time = None
        
        for session_id, session in self.sessions.items():
            if session.user_id == user_id and session.is_active:
                if most_recent_time is None or session.last_interaction > most_recent_time:
                    most_recent_time = session.last_interaction
                    recent_session = session_id
        
        # If recent session exists and was active within last 2 hours, resume it
        if recent_session and most_recent_time:
            time_since_last = (datetime.now() - most_recent_time).total_seconds() / 3600
            if time_since_last <= 2:  # 2 hours
                logger.info(f"🔄 Resuming existing session: {recent_session}")
                return self.continue_conversation(recent_session, message)
        
        # Otherwise create new session
        logger.info(f"🆕 Creating new session for user: {user_id}")
        return self.start_conversation(user_id, message)
    
    def list_all_sessions(self) -> Dict:
        """List all sessions for debugging"""
        return {
            "total_sessions": len(self.sessions),
            "active_sessions": len([s for s in self.sessions.values() if s.is_active]),
            "sessions": [
                {
                    "session_id": sid,
                    "user_id": session.user_id,
                    "created_at": session.created_at.isoformat(),
                    "last_interaction": session.last_interaction.isoformat(),
                    "message_count": len(session.messages),
                    "is_active": session.is_active
                }
                for sid, session in self.sessions.items()
            ]
        }

# Global intelligent doctor instance
intelligent_doctor = IntelligentDoctor()