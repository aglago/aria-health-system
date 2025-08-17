"""
Medical Severity Scoring System
Analyzes patient symptoms and conversation context to calculate severity scores
and priority levels for doctor scheduling.
"""

import re
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class SeverityLevel(Enum):
    LOW = "low"
    MEDIUM = "medium" 
    HIGH = "high"
    EMERGENCY = "emergency"

class PriorityLevel(Enum):
    ROUTINE = "routine"          # Schedule within 1-2 weeks
    URGENT = "urgent"            # Schedule within 1-3 days
    HIGH_PRIORITY = "high_priority"  # Schedule within 24 hours
    EMERGENCY = "emergency"      # Immediate attention required

@dataclass
class SeverityAssessment:
    """Complete severity assessment result"""
    severity_score: int  # 0-100
    severity_level: SeverityLevel
    priority_level: PriorityLevel
    risk_factors: List[str]
    possible_conditions: List[str]
    emergency_indicators: List[str]
    recommended_timeframe: str
    clinical_reasoning: str
    doctor_briefing: Dict

@dataclass
class SymptomAnalysis:
    """Individual symptom analysis"""
    symptom: str
    severity_contribution: int  # 0-25
    risk_level: str
    medical_significance: str

class MedicalSeverityScorer:
    """
    Advanced medical severity scoring system for UMaT Health Services
    """
    
    def __init__(self):
        """Initialize severity scorer with medical knowledge"""
        self._load_severity_rules()
        self._load_condition_mappings()
        
    def _load_severity_rules(self):
        """Load medical severity scoring rules"""
        self.severity_rules = {
            # Pain severity scoring
            "pain_levels": {
                "mild": {"score": 5, "keywords": ["1", "2", "3", "mild", "slight"]},
                "moderate": {"score": 15, "keywords": ["4", "5", "6", "moderate"]},
                "severe": {"score": 25, "keywords": ["7", "8", "severe", "intense"]},
                "extreme": {"score": 40, "keywords": ["9", "10", "unbearable", "worst"]}
            },
            
            # Duration scoring
            "duration_scoring": {
                "acute": {"score": 20, "patterns": [r"(\d+)\s*(minute|hour)s?", r"just\s+started", r"sudden"]},
                "subacute": {"score": 15, "patterns": [r"(\d+)\s*days?", r"few\s+days", r"this\s+week"]},
                "chronic": {"score": 10, "patterns": [r"(\d+)\s*(week|month)s?", r"long\s+time", r"months?"]}
            },
            
            # Symptom severity by body system
            "symptom_severity": {
                # Urinary/Renal (High priority due to infection risk)
                "urinary": {
                    "keywords": ["urinating", "urination", "pee", "bladder", "kidney"],
                    "base_score": 20,
                    "risk_factors": ["infection", "kidney_damage", "sepsis_risk"]
                },
                
                # Cardiac (Emergency potential)
                "cardiac": {
                    "keywords": ["chest pain", "heart", "palpitation", "shortness of breath"],
                    "base_score": 35,
                    "risk_factors": ["heart_attack", "arrhythmia", "cardiac_emergency"]
                },
                
                # Respiratory (Emergency potential)
                "respiratory": {
                    "keywords": ["breathing", "cough", "shortness", "wheeze", "chest"],
                    "base_score": 30,
                    "risk_factors": ["asthma", "pneumonia", "respiratory_failure"]
                },
                
                # Neurological (Emergency potential)
                "neurological": {
                    "keywords": ["headache", "dizzy", "confusion", "seizure", "weakness"],
                    "base_score": 25,
                    "risk_factors": ["stroke", "meningitis", "brain_injury"]
                },
                
                # Gastrointestinal
                "gastrointestinal": {
                    "keywords": ["nausea", "vomit", "diarrhea", "stomach", "abdominal"],
                    "base_score": 15,
                    "risk_factors": ["dehydration", "infection", "bleeding"]
                },
                
                # Musculoskeletal
                "musculoskeletal": {
                    "keywords": ["joint", "muscle", "back", "neck", "sprain"],
                    "base_score": 10,
                    "risk_factors": ["chronic_pain", "mobility_issues"]
                }
            },
            
            # Emergency indicators (Immediate red flags)
            "emergency_indicators": {
                "chest_pain": {"score": 50, "timeframe": "immediate"},
                "difficulty_breathing": {"score": 50, "timeframe": "immediate"}, 
                "severe_bleeding": {"score": 45, "timeframe": "immediate"},
                "loss_of_consciousness": {"score": 50, "timeframe": "immediate"},
                "severe_headache": {"score": 40, "timeframe": "immediate"},
                "high_fever": {"score": 35, "timeframe": "within_2_hours"},
                "severe_abdominal_pain": {"score": 35, "timeframe": "within_4_hours"}
            }
        }
    
    def _load_condition_mappings(self):
        """Load condition mappings for Ghana-specific health issues"""
        self.condition_mappings = {
            "urinary_symptoms": {
                "conditions": ["Urinary Tract Infection (UTI)", "Kidney Stones", "Bladder Infection", "Prostatitis"],
                "ghana_prevalence": ["UTI - Very Common", "Kidney Stones - Moderate", "Dehydration-related - High"],
                "risk_factors": ["Poor sanitation", "Inadequate water intake", "Tropical climate dehydration"]
            },
            
            "respiratory_symptoms": {
                "conditions": ["Upper Respiratory Infection", "Pneumonia", "Asthma", "TB screening needed"],
                "ghana_prevalence": ["Respiratory infections - High", "TB - Screening required", "Dust-related - Common"],
                "risk_factors": ["Dust exposure", "Seasonal changes", "Indoor air pollution"]
            },
            
            "gastrointestinal_symptoms": {
                "conditions": ["Food poisoning", "Gastroenteritis", "Dehydration", "Parasitic infection"],
                "ghana_prevalence": ["Food/waterborne illness - High", "Dehydration - Very common", "Parasites - Moderate"],
                "risk_factors": ["Water quality", "Food safety", "Tropical parasites"]
            },
            
            "fever_symptoms": {
                "conditions": ["Malaria", "Typhoid fever", "Viral infection", "Bacterial infection"],
                "ghana_prevalence": ["Malaria - Very High", "Typhoid - High", "Seasonal infections - Common"],
                "risk_factors": ["Mosquito exposure", "Water/food contamination", "Endemic diseases"]
            }
        }
    
    def analyze_conversation(self, conversation_messages: List[Dict], medical_context: str = "") -> SeverityAssessment:
        """
        Analyze complete conversation to generate severity assessment
        """
        try:
            logger.info("🔬 Starting comprehensive medical severity analysis")
            
            # Extract key medical information
            symptoms = self._extract_symptoms(conversation_messages)
            pain_level = self._extract_pain_level(conversation_messages)
            duration = self._extract_duration(conversation_messages)
            treatments_tried = self._extract_treatments(conversation_messages)
            
            # Calculate severity components
            symptom_score = self._score_symptoms(symptoms)
            pain_score = self._score_pain_level(pain_level)
            duration_score = self._score_duration(duration)
            emergency_score = self._check_emergency_indicators(conversation_messages)
            
            # Calculate total severity score
            total_score = min(100, symptom_score + pain_score + duration_score + emergency_score)
            
            # Determine levels
            severity_level = self._determine_severity_level(total_score, emergency_score)
            priority_level = self._determine_priority_level(total_score, emergency_score, duration)
            
            # Generate clinical assessment
            risk_factors = self._identify_risk_factors(symptoms, medical_context)
            possible_conditions = self._suggest_conditions(symptoms)
            emergency_indicators = self._get_emergency_indicators(conversation_messages)
            
            # Generate doctor briefing
            doctor_briefing = self._generate_doctor_briefing(
                conversation_messages, symptoms, pain_level, duration, 
                treatments_tried, total_score, possible_conditions
            )
            
            assessment = SeverityAssessment(
                severity_score=total_score,
                severity_level=severity_level,
                priority_level=priority_level,
                risk_factors=risk_factors,
                possible_conditions=possible_conditions,
                emergency_indicators=emergency_indicators,
                recommended_timeframe=self._get_recommended_timeframe(priority_level),
                clinical_reasoning=self._generate_clinical_reasoning(
                    symptom_score, pain_score, duration_score, emergency_score, symptoms
                ),
                doctor_briefing=doctor_briefing
            )
            
            logger.info(f"🎯 Severity assessment complete: {total_score}/100 ({severity_level.value})")
            return assessment
            
        except Exception as e:
            logger.error(f"❌ Error in severity analysis: {e}")
            return self._generate_safe_fallback_assessment()
    
    def _extract_symptoms(self, messages: List[Dict]) -> List[str]:
        """Extract reported symptoms from conversation"""
        symptoms = []
        symptom_keywords = [
            "pain", "ache", "hurt", "sore", "burning", "stinging",
            "nausea", "vomit", "fever", "cough", "headache", "dizzy",
            "urinating", "urination", "frequency", "blood", "discharge",
            "breathing", "shortness", "chest", "heart", "palpitation"
        ]
        
        for message in messages:
            if message.get("role") == "user":
                content = message.get("message", "").lower()
                for keyword in symptom_keywords:
                    if keyword in content:
                        symptoms.append(keyword)
        
        return list(set(symptoms))  # Remove duplicates
    
    def _extract_pain_level(self, messages: List[Dict]) -> Optional[int]:
        """Extract pain level from 1-10 scale"""
        pain_patterns = [
            r"(\d+)\s*(?:out\s*of\s*)?(?:10|ten)",
            r"(?:pain|severity).*?(\d+)",
            r"(\d+)(?:/10|\s*out\s*of\s*10)"
        ]
        
        for message in messages:
            if message.get("role") == "user":
                content = message.get("message", "").lower()
                for pattern in pain_patterns:
                    match = re.search(pattern, content)
                    if match:
                        try:
                            level = int(match.group(1))
                            if 1 <= level <= 10:
                                return level
                        except ValueError:
                            continue
        return None
    
    def _extract_duration(self, messages: List[Dict]) -> Optional[str]:
        """Extract symptom duration from conversation"""
        duration_patterns = [
            r"(\d+)\s*(minute|hour|day|week|month)s?",
            r"(few|several)\s*(hour|day|week)s?",
            r"since\s+(yesterday|morning|afternoon)",
            r"started\s+(yesterday|today|this\s+morning)"
        ]
        
        for message in messages:
            if message.get("role") == "user":
                content = message.get("message", "").lower()
                for pattern in duration_patterns:
                    match = re.search(pattern, content)
                    if match:
                        return match.group(0)
        return None
    
    def _extract_treatments(self, messages: List[Dict]) -> List[str]:
        """Extract treatments tried from conversation"""
        treatments = []
        treatment_keywords = [
            "ibuprofen", "paracetamol", "aspirin", "tylenol", 
            "rest", "water", "tea", "medication", "pills", "tablets"
        ]
        
        for message in messages:
            if message.get("role") == "user":
                content = message.get("message", "").lower()
                for keyword in treatment_keywords:
                    if keyword in content:
                        treatments.append(keyword)
        
        return treatments
    
    def _score_symptoms(self, symptoms: List[str]) -> int:
        """Score symptoms based on medical significance"""
        total_score = 0
        
        for symptom in symptoms:
            for system, data in self.severity_rules["symptom_severity"].items():
                if any(keyword in symptom for keyword in data["keywords"]):
                    total_score += data["base_score"]
                    break
        
        return min(40, total_score)  # Cap at 40 points for symptoms
    
    def _score_pain_level(self, pain_level: Optional[int]) -> int:
        """Score pain level contribution"""
        if not pain_level:
            return 0
        
        if pain_level <= 3:
            return 5
        elif pain_level <= 6:
            return 15
        elif pain_level <= 8:
            return 25
        else:
            return 35
    
    def _score_duration(self, duration: Optional[str]) -> int:
        """Score based on symptom duration"""
        if not duration:
            return 5  # Unknown duration gets moderate score
        
        duration_lower = duration.lower()
        
        # Acute (hours) - Higher urgency
        if any(word in duration_lower for word in ["hour", "minute", "sudden", "just started"]):
            return 20
        
        # Subacute (days) - Moderate urgency  
        if any(word in duration_lower for word in ["day", "yesterday", "today"]):
            return 15
        
        # Chronic (weeks/months) - Lower urgency but needs attention
        if any(word in duration_lower for word in ["week", "month"]):
            return 10
        
        return 10
    
    def _check_emergency_indicators(self, messages: List[Dict]) -> int:
        """Check for emergency red flags"""
        emergency_score = 0
        
        for message in messages:
            if message.get("role") == "user":
                content = message.get("message", "").lower()
                
                for indicator, data in self.severity_rules["emergency_indicators"].items():
                    if indicator.replace("_", " ") in content:
                        emergency_score = max(emergency_score, data["score"])
        
        return emergency_score
    
    def _determine_severity_level(self, total_score: int, emergency_score: int) -> SeverityLevel:
        """Determine severity level from score"""
        if emergency_score >= 40:
            return SeverityLevel.EMERGENCY
        elif total_score >= 70:
            return SeverityLevel.HIGH  
        elif total_score >= 40:
            return SeverityLevel.MEDIUM
        else:
            return SeverityLevel.LOW
    
    def _determine_priority_level(self, total_score: int, emergency_score: int, duration: Optional[str]) -> PriorityLevel:
        """Determine scheduling priority"""
        if emergency_score >= 40:
            return PriorityLevel.EMERGENCY
        elif total_score >= 70:
            return PriorityLevel.HIGH_PRIORITY
        elif total_score >= 40:
            return PriorityLevel.URGENT
        else:
            return PriorityLevel.ROUTINE
    
    def _identify_risk_factors(self, symptoms: List[str], medical_context: str) -> List[str]:
        """Identify medical risk factors"""
        risk_factors = []
        
        # Check symptom-based risk factors
        for symptom in symptoms:
            for system, data in self.severity_rules["symptom_severity"].items():
                if any(keyword in symptom for keyword in data["keywords"]):
                    risk_factors.extend(data["risk_factors"])
        
        # Ghana-specific risk factors
        if any("urinary" in s for s in symptoms):
            risk_factors.extend(["Tropical climate dehydration", "Water quality concerns"])
        
        if any("respiratory" in s or "cough" in s for s in symptoms):
            risk_factors.extend(["Dust exposure", "Seasonal respiratory infections"])
        
        return list(set(risk_factors))
    
    def _suggest_conditions(self, symptoms: List[str]) -> List[str]:
        """Suggest possible medical conditions"""
        conditions = []
        
        if any("urinating" in s or "urination" in s for s in symptoms):
            conditions.extend(["Urinary Tract Infection (UTI)", "Kidney stones", "Bladder infection"])
        
        if any("chest" in s or "heart" in s for s in symptoms):
            conditions.extend(["Cardiac evaluation needed", "Chest pain workup"])
        
        if any("headache" in s for s in symptoms):
            conditions.extend(["Tension headache", "Migraine", "Secondary headache - further evaluation"])
        
        return conditions[:5]  # Limit to top 5
    
    def _get_emergency_indicators(self, messages: List[Dict]) -> List[str]:
        """Get list of emergency indicators found"""
        indicators = []
        
        for message in messages:
            if message.get("role") == "user":
                content = message.get("message", "").lower()
                
                for indicator in self.severity_rules["emergency_indicators"]:
                    if indicator.replace("_", " ") in content:
                        indicators.append(indicator.replace("_", " ").title())
        
        return indicators
    
    def _get_recommended_timeframe(self, priority: PriorityLevel) -> str:
        """Get recommended appointment timeframe"""
        timeframes = {
            PriorityLevel.EMERGENCY: "Immediate attention required - Go to emergency room",
            PriorityLevel.HIGH_PRIORITY: "Schedule within 24 hours",
            PriorityLevel.URGENT: "Schedule within 1-3 days", 
            PriorityLevel.ROUTINE: "Schedule within 1-2 weeks"
        }
        return timeframes.get(priority, "Schedule as soon as possible")
    
    def _generate_clinical_reasoning(self, symptom_score: int, pain_score: int, 
                                   duration_score: int, emergency_score: int, symptoms: List[str]) -> str:
        """Generate clinical reasoning explanation"""
        reasoning_parts = []
        
        if symptom_score > 20:
            reasoning_parts.append(f"Symptom profile ({', '.join(symptoms[:3])}) indicates significant medical concern")
        
        if pain_score > 20:
            reasoning_parts.append("Reported pain level suggests moderate to severe discomfort requiring evaluation")
        
        if duration_score > 15:
            reasoning_parts.append("Timeline suggests acute condition requiring prompt attention")
        
        if emergency_score > 0:
            reasoning_parts.append("Emergency indicators present - elevated priority status")
        
        if not reasoning_parts:
            reasoning_parts.append("Standard medical evaluation recommended based on reported symptoms")
        
        return ". ".join(reasoning_parts) + "."
    
    def _generate_doctor_briefing(self, messages: List[Dict], symptoms: List[str], 
                                pain_level: Optional[int], duration: Optional[str],
                                treatments: List[str], severity_score: int, 
                                conditions: List[str]) -> Dict:
        """Generate comprehensive doctor briefing"""
        return {
            "patient_summary": {
                "chief_complaint": self._extract_chief_complaint(messages),
                "symptom_profile": symptoms,
                "pain_assessment": f"{pain_level}/10" if pain_level else "Not specified",
                "duration": duration or "Not specified",
                "treatments_attempted": treatments if treatments else ["None reported"],
                "severity_score": f"{severity_score}/100"
            },
            
            "clinical_assessment": {
                "primary_concerns": conditions[:3] if conditions else ["General evaluation needed"],
                "risk_stratification": self._get_risk_stratification(severity_score),
                "recommended_workup": self._suggest_workup(symptoms),
                "ghana_specific_considerations": self._get_ghana_considerations(symptoms)
            },
            
            "conversation_transcript": self._format_conversation_for_doctor(messages),
            
            "ai_analysis": {
                "confidence_level": "High" if severity_score > 50 else "Moderate",
                "analysis_timestamp": datetime.now().isoformat(),
                "system_version": "ARIA Medical AI v2.0"
            }
        }
    
    def _extract_chief_complaint(self, messages: List[Dict]) -> str:
        """Extract the main patient complaint"""
        for message in messages:
            if message.get("role") == "user":
                content = message.get("message", "").strip()
                if len(content) > 10 and not content.lower().startswith(("hi", "hello", "hey")):
                    return content[:100] + "..." if len(content) > 100 else content
        return "Patient seeking medical consultation"
    
    def _get_risk_stratification(self, score: int) -> str:
        """Get risk stratification level"""
        if score >= 70:
            return "High risk - Requires prompt evaluation and potential intervention"
        elif score >= 40:
            return "Moderate risk - Standard evaluation with appropriate urgency"
        else:
            return "Low risk - Routine evaluation and monitoring"
    
    def _suggest_workup(self, symptoms: List[str]) -> List[str]:
        """Suggest diagnostic workup based on symptoms"""
        workup = ["Complete history and physical examination"]
        
        if any("urinating" in s for s in symptoms):
            workup.extend(["Urinalysis", "Urine culture if indicated", "Basic metabolic panel"])
        
        if any("chest" in s or "heart" in s for s in symptoms):
            workup.extend(["ECG", "Chest X-ray", "Cardiac enzymes if indicated"])
        
        if any("headache" in s for s in symptoms):
            workup.extend(["Neurological examination", "Blood pressure check", "Consider imaging if red flags"])
        
        return workup
    
    def _get_ghana_considerations(self, symptoms: List[str]) -> List[str]:
        """Get Ghana-specific medical considerations"""
        considerations = []
        
        if any("fever" in s for s in symptoms):
            considerations.extend(["Screen for malaria", "Consider typhoid fever", "Assess for endemic diseases"])
        
        if any("urinating" in s for s in symptoms):
            considerations.extend(["Assess hydration status", "Consider water quality factors"])
        
        if any("respiratory" in s or "cough" in s for s in symptoms):
            considerations.extend(["TB screening if indicated", "Consider dust/environmental factors"])
        
        return considerations if considerations else ["Standard clinical evaluation appropriate"]
    
    def _format_conversation_for_doctor(self, messages: List[Dict]) -> List[Dict]:
        """Format conversation transcript for doctor review"""
        formatted = []
        for message in messages:
            formatted.append({
                "speaker": "Patient" if message.get("role") == "user" else "AI Assistant",
                "message": message.get("message", ""),
                "timestamp": message.get("timestamp", datetime.now().isoformat())
            })
        return formatted
    
    def _generate_safe_fallback_assessment(self) -> SeverityAssessment:
        """Generate safe fallback assessment for errors"""
        return SeverityAssessment(
            severity_score=50,
            severity_level=SeverityLevel.MEDIUM,
            priority_level=PriorityLevel.URGENT,
            risk_factors=["Unable to complete full assessment"],
            possible_conditions=["Requires clinical evaluation"],
            emergency_indicators=[],
            recommended_timeframe="Schedule within 1-3 days",
            clinical_reasoning="System unable to complete full assessment. Clinical evaluation recommended for safety.",
            doctor_briefing={
                "patient_summary": {"chief_complaint": "Medical consultation requested"},
                "clinical_assessment": {"primary_concerns": ["Clinical evaluation needed"]},
                "conversation_transcript": [],
                "ai_analysis": {"confidence_level": "Low - System error"}
            }
        )

# Global severity scorer instance
medical_severity_scorer = MedicalSeverityScorer()