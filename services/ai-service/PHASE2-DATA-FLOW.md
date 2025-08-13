# ARIA Phase 2 Data Flow Documentation

Complete data flow analysis for Phase 2: Core ML + Conversational Doctor AI

## **System Architecture Overview**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway   │    │   AI Service    │
│   (Web/Mobile)  │────│   (Next.js)     │────│   (FastAPI)     │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                │              ┌─────────────────┐
                                │              │   ML Engine     │
                                │              │ ml_medical_ai   │
                                │              └─────────────────┘
                                │                       │
                                │              ┌─────────────────┐
                                │              │ Intelligent     │
                                │              │ Doctor Service  │
                                │              └─────────────────┘
                                │                       │
                                │              ┌─────────────────┐
                                └──────────────│  RAG Service    │
                                               │ Medical KB      │
                                               └─────────────────┘
```

## **Phase 2 Data Flow Scenarios**

### **1. ML-Based Symptom Analysis Flow**

#### **Endpoint:** `POST /analyze-advanced`

**Location:** `src/main.py:95-150`

```
┌─ REQUEST FLOW ──────────────────────────────────────────────────────┐
│                                                                     │
│ 1. Client Request                                                   │
│    POST /analyze-advanced                                           │
│    {                                                                │
│      "symptoms": "fever headache nausea",                          │
│      "user_id": "student123",                                      │
│      "medical_context": {"age": 20, "gender": "M"}                 │
│    }                                                                │
│    Location: src/main.py:95                                        │
│                                                                     │
│ 2. Input Validation                                                 │
│    - FastAPI validates AdvancedAnalysisRequest model               │
│    - Checks required fields: symptoms, user_id                     │
│    Location: src/main.py:97-99                                     │
│                                                                     │
│ 3. RAG Medical Context Retrieval                                   │
│    rag_service.get_enhanced_context(request.symptoms)       │
│    Location: src/main.py:104                                       │
│    ├─ Calls: src/services/rag_service.py:111                      │
│    ├─ Uses: TF-IDF vectorization on medical knowledge             │
│    ├─ Searches: src/data/knowledge_base/*.json files              │
│    └─ Returns: Enhanced medical context string                     │
│                                                                     │
│ 4. ML Medical Analysis                                              │
│    ml_medical_ai.analyze_symptoms_ml(symptoms, medical_context)    │
│    Location: src/main.py:106-110                                   │
│    ├─ Calls: src/models/ml_medical_ai.py:193                      │
│    ├─ Process: TF-IDF symptom vectorization                       │
│    ├─ Process: Condition similarity calculation                    │
│    ├─ Process: Confidence scoring                                  │
│    └─ Returns: MLDiagnosis object                                  │
│                                                                     │
│ 5. Response Assembly                                                │
│    - Convert MLDiagnosis to AdvancedHealthResponse                │
│    - Add cultural considerations for Ghana                          │
│    - Generate conversation_id with timestamp                       │
│    Location: src/main.py:115-141                                   │
│                                                                     │
│ 6. Client Response                                                  │
│    {                                                                │
│      "primary_diagnosis": "malaria",                              │
│      "confidence": 0.85,                                          │
│      "urgency_level": "high",                                     │
│      "differential_diagnoses": [...],                             │
│      "cultural_considerations": ["🇬🇭 Ghana conditions..."]       │
│    }                                                                │
└─────────────────────────────────────────────────────────────────────┘
```

**Exact File Locations & Line Numbers:**
- **Entry Point:** `src/main.py:95` - `analyze_symptoms_advanced()`
- **RAG Call:** `src/main.py:104` → `src/services/rag_service.py:111`
- **ML Analysis:** `src/main.py:106` → `src/models/ml_medical_ai.py:193`
- **Response Assembly:** `src/main.py:115-141`

---

### **2. Conversational Doctor AI Flow - Starting Conversation**

#### **Endpoint:** `POST /doctor/start`

**Location:** `src/main.py:186-217`

```
┌─ DOCTOR CONVERSATION START FLOW ───────────────────────────────────┐
│                                                                     │
│ 1. Client Request                                                   │
│    POST /doctor/start                                               │
│    {                                                                │
│      "user_id": "student123",                                      │
│      "message": "Hello doctor, I have been feeling unwell"         │
│    }                                                                │
│    Location: src/main.py:186                                       │
│                                                                     │
│ 2. Request Validation                                               │
│    - Validate DoctorStartRequest model                             │
│    - Check required fields: user_id, message                       │
│    Location: src/main.py:189-191                                   │
│                                                                     │
│ 3. Intelligent Doctor Service Call                                 │
│    intelligent_doctor.start_conversation(user_id, message)         │
│    Location: src/main.py:194                                       │
│    ├─ Calls: src/models/intelligent_doctor.py:69                  │
│    ├─ Creates: New ConversationSession with session_id            │
│    ├─ Stores: User message in session.messages[]                  │
│    └─ Calls: _generate_intelligent_response()                      │
│                                                                     │
│ 4. Chain of Reasoning Process                                      │
│    _generate_intelligent_response(session, message)                │
│    Location: src/models/intelligent_doctor.py:143                  │
│                                                                     │
│    ┌─ STEP 1: RAG Medical Knowledge ─────────────────────────────┐ │
│    │ _get_medical_context(current_message)                      │ │
│    │ Location: src/models/intelligent_doctor.py:184             │ │
│    │ ├─ Calls: rag_service.get_enhanced_context()               │ │
│    │ ├─ Searches: Medical knowledge for user symptoms          │ │
│    │ └─ Returns: Relevant medical text chunks                   │ │
│    └─────────────────────────────────────────────────────────────┘ │
│                                                                     │
│    ┌─ STEP 2: Conversation Context ───────────────────────────────┐ │
│    │ _build_conversation_context(session)                       │ │
│    │ Location: src/models/intelligent_doctor.py:197             │ │
│    │ ├─ Extracts: Last 6 messages from session                 │ │
│    │ ├─ Formats: "Patient: message" / "Doctor: response"       │ │
│    │ └─ Returns: Conversation history string                    │ │
│    └─────────────────────────────────────────────────────────────┘ │
│                                                                     │
│    ┌─ STEP 3: LLM Response Generation ────────────────────────────┐ │
│    │ if openai_client available:                                │ │
│    │   _generate_llm_response()                                 │ │
│    │   Location: src/models/intelligent_doctor.py:220          │ │
│    │   ├─ Creates: System prompt as caring doctor              │ │
│    │   ├─ Includes: Medical context + conversation history     │ │
│    │   ├─ Calls: OpenAI ChatCompletion API                     │ │
│    │   └─ Returns: JSON with message + follow_up_questions     │ │
│    │ else:                                                      │ │
│    │   _generate_fallback_response()                           │ │
│    │   Location: src/models/intelligent_doctor.py:282          │ │
│    │   ├─ Pattern matches: Common symptoms/greetings           │ │
│    │   ├─ Uses: Medical context for informed responses         │ │
│    │   └─ Returns: Structured response with questions          │ │
│    └─────────────────────────────────────────────────────────────┘ │
│                                                                     │
│    ┌─ STEP 4: Assessment & Confidence ────────────────────────────┐ │
│    │ _assess_urgency_intelligent() + _calculate_confidence()    │ │
│    │ Location: src/models/intelligent_doctor.py:346 + 368      │ │
│    │ ├─ Analyzes: Emergency keywords, severity indicators      │ │
│    │ ├─ Considers: Medical context quality and depth           │ │
│    │ └─ Returns: Urgency level (low/medium/high/emergency)     │ │
│    └─────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ 5. Session Storage                                                  │
│    - Store doctor response in session.messages[]                   │
│    - Update session.last_interaction timestamp                     │
│    Location: src/models/intelligent_doctor.py:94-104              │
│                                                                     │
│ 6. Response Assembly                                                │
│    - Generate unique session_id with timestamp                     │
│    - Create DoctorResponseModel with all response data            │
│    Location: src/main.py:197-209                                   │
│                                                                     │
│ 7. Client Response                                                  │
│    {                                                                │
│      "session_id": "student123_1640000000",                       │
│      "doctor_response": "Hello! I understand you're not feeling...",│
│      "follow_up_questions": ["What symptoms are you having?"],     │
│      "urgency_level": "low",                                       │
│      "confidence": 0.6,                                           │
│      "medical_reasoning": "Initial assessment based on..."         │
│    }                                                                │
└─────────────────────────────────────────────────────────────────────┘
```

**Exact File Locations & Line Numbers:**
- **Entry Point:** `src/main.py:186` - `start_doctor_conversation()`
- **Service Call:** `src/main.py:194` → `src/models/intelligent_doctor.py:69`
- **Chain of Reasoning:** `src/models/intelligent_doctor.py:143`
- **RAG Integration:** `src/models/intelligent_doctor.py:184` → `src/services/rag_service.py:111`
- **LLM Generation:** `src/models/intelligent_doctor.py:220` (with OpenAI) or `282` (fallback)
- **Session Storage:** In-memory at `src/models/intelligent_doctor.py:52`

---

### **3. Conversational Doctor AI Flow - Continuing Conversation**

#### **Endpoint:** `POST /doctor/continue`

**Location:** `src/main.py:219-250`

```
┌─ DOCTOR CONVERSATION CONTINUE FLOW ────────────────────────────────┐
│                                                                     │
│ 1. Client Request                                                   │
│    POST /doctor/continue                                            │
│    {                                                                │
│      "session_id": "student123_1640000000",                       │
│      "message": "The headache started yesterday and it's getting worse"│
│    }                                                                │
│    Location: src/main.py:219                                       │
│                                                                     │
│ 2. Session Validation                                               │
│    - Validate DoctorContinueRequest model                          │
│    - Check session exists in intelligent_doctor.sessions           │
│    Location: src/main.py:224 → src/models/intelligent_doctor.py:111│
│                                                                     │
│ 3. Session Context Retrieval                                       │
│    session = self.sessions[session_id]                             │
│    Location: src/models/intelligent_doctor.py:114                  │
│    ├─ Retrieves: Full conversation history                         │
│    ├─ Retrieves: Previous medical assessments                      │
│    └─ Updates: last_interaction timestamp                          │
│                                                                     │
│ 4. Message Addition                                                 │
│    - Add new user message to session.messages[]                    │
│    - Include timestamp and role="user"                             │
│    Location: src/models/intelligent_doctor.py:118-123              │
│                                                                     │
│ 5. Enhanced Chain of Reasoning (with conversation context)         │
│    _generate_intelligent_response(session, user_message)           │
│    Location: src/models/intelligent_doctor.py:126                  │
│                                                                     │
│    ┌─ ENHANCED STEP 2: Rich Conversation Context ─────────────────┐ │
│    │ _build_conversation_context(session)                       │ │
│    │ NOW includes:                                               │ │
│    │ - Previous symptoms: "headache"                            │ │
│    │ - Previous doctor responses                                │ │
│    │ - Progression: "started yesterday → getting worse"         │ │
│    │ - Medical context from previous exchanges                  │ │
│    │ Location: src/models/intelligent_doctor.py:197             │ │
│    └─────────────────────────────────────────────────────────────┘ │
│                                                                     │
│    ┌─ ENHANCED STEP 3: Context-Aware LLM Generation ─────────────┐ │
│    │ LLM now receives:                                           │ │
│    │ - Current message: "headache getting worse"                │ │
│    │ - Medical context: Headache-related knowledge              │ │
│    │ - Previous conversation:                                   │ │
│    │   "Patient: I'm not feeling well"                         │ │
│    │   "Doctor: What symptoms are you having?"                 │ │
│    │   "Patient: headache started yesterday..."                │ │
│    │ - Result: More informed, contextual response              │ │
│    │ Location: src/models/intelligent_doctor.py:220             │ │
│    └─────────────────────────────────────────────────────────────┘ │
│                                                                     │
│    ┌─ ENHANCED STEP 4: Progressive Assessment ───────────────────┐ │
│    │ Urgency may escalate based on:                             │ │
│    │ - Symptom progression ("getting worse")                    │ │
│    │ - Duration ("since yesterday")                             │ │
│    │ - Previous context                                         │ │
│    │ Location: src/models/intelligent_doctor.py:346             │ │
│    └─────────────────────────────────────────────────────────────┘ │
│                                                                     │
│ 6. Session Update                                                   │
│    - Add doctor's new response to session.messages[]              │
│    - Update medical_context with new assessment                    │
│    Location: src/models/intelligent_doctor.py:129-138              │
│                                                                     │
│ 7. Contextual Response                                              │
│    {                                                                │
│      "session_id": "student123_1640000000",                       │
│      "doctor_response": "I see your headache has worsened since...",│
│      "follow_up_questions": [                                      │
│        "On a scale 1-10, how severe is the pain now?",           │
│        "Any nausea or sensitivity to light?"                      │
│      ],                                                            │
│      "urgency_level": "medium",  // Escalated from previous "low" │
│      "confidence": 0.75          // Higher due to conversation context │
│    }                                                                │
└─────────────────────────────────────────────────────────────────────┘
```

**Key Differences from Starting Conversation:**
- **Session Lookup:** Uses existing session instead of creating new one
- **Rich Context:** Previous messages provide conversation history
- **Progressive Assessment:** Urgency and confidence evolve with context
- **Memory Continuity:** Each response builds on previous exchanges

---

### **4. Session Management & Memory Architecture**

#### **In-Memory Session Storage**

**Location:** `src/models/intelligent_doctor.py:52`

```python
self.sessions: Dict[str, ConversationSession] = {}

# Session Structure Example:
{
  "student123_1640000000": {
    "session_id": "student123_1640000000",
    "user_id": "student123",
    "messages": [
      {
        "role": "user",
        "message": "Hello doctor, I have a headache",
        "timestamp": "2024-01-01T10:00:00Z",
        "medical_context": None
      },
      {
        "role": "doctor", 
        "message": "I understand you have a headache. When did it start?",
        "timestamp": "2024-01-01T10:00:15Z",
        "medical_context": {
          "urgency": "low",
          "confidence": 0.6
        }
      },
      {
        "role": "user",
        "message": "It started yesterday and it's getting worse", 
        "timestamp": "2024-01-01T10:01:00Z",
        "medical_context": None
      },
      {
        "role": "doctor",
        "message": "Since it's worsening, let me ask more questions...",
        "timestamp": "2024-01-01T10:01:10Z", 
        "medical_context": {
          "urgency": "medium",  // Escalated
          "confidence": 0.75    // Increased
        }
      }
    ],
    "created_at": "2024-01-01T10:00:00Z",
    "last_interaction": "2024-01-01T10:01:10Z",
    "is_active": true
  }
}
```

---

### **5. RAG Knowledge Integration Points**

#### **RAG Service Integration**

**Location:** `src/services/rag_service.py`

```
┌─ RAG KNOWLEDGE RETRIEVAL FLOW ─────────────────────────────────────┐
│                                                                     │
│ 1. Knowledge Base Loading                                           │
│    _load_knowledge_bases()                                          │
│    Location: src/services/rag_service.py:25                        │
│    ├─ Scans: src/data/knowledge_base/*.json files                  │
│    ├─ Loads: Medical textbook chunks                               │
│    └─ Stores: In self.chunks[] array                               │
│                                                                     │
│ 2. TF-IDF Vectorization                                            │
│    _create_vectors()                                                │
│    Location: src/services/rag_service.py:66                        │
│    ├─ Uses: scikit-learn TfidfVectorizer                           │
│    ├─ Creates: Document vectors from medical text                  │
│    └─ Stores: In self.document_vectors                             │
│                                                                     │
│ 3. Similarity Search                                               │
│    search_similar_content(query, top_k=3)                          │
│    Location: src/services/rag_service.py:77                        │
│    ├─ Vectorizes: User query using same TF-IDF model              │
│    ├─ Calculates: Cosine similarity with document vectors         │
│    ├─ Returns: Top-k most similar medical knowledge chunks         │
│    └─ Filters: Only results above 0.1 similarity threshold        │
│                                                                     │
│ 4. Context Enhancement                                              │
│    get_enhanced_context(query, top_k=3)                           │
│    Location: src/services/rag_service.py:111                       │
│    ├─ Gets: Similar content from step 3                           │
│    ├─ Formats: As numbered medical references                      │
│    └─ Returns: Enhanced context string for LLM/fallback           │
│                                                                     │
│ Integration Points:                                                 │
│ ├─ ML Analysis: src/main.py:104                                   │
│ ├─ Doctor Start: src/models/intelligent_doctor.py:188             │
│ └─ Doctor Continue: src/models/intelligent_doctor.py:188           │
└─────────────────────────────────────────────────────────────────────┘
```

---

### **6. Error Handling & Fallback Mechanisms**

#### **Multi-Layer Fallback System**

```
┌─ ERROR HANDLING & FALLBACKS ───────────────────────────────────────┐
│                                                                     │
│ Layer 1: OpenAI LLM (Primary)                                      │
│ ├─ Location: src/models/intelligent_doctor.py:220                  │
│ ├─ Handles: Full conversational AI with medical reasoning          │
│ └─ Fallback Trigger: API key missing, network error, rate limit    │
│                                                                     │
│ Layer 2: Rule-Based Intelligent Fallback (Secondary)              │
│ ├─ Location: src/models/intelligent_doctor.py:282                  │
│ ├─ Uses: Pattern matching + RAG medical context                    │
│ ├─ Handles: Common symptoms, greetings, emergency detection        │
│ └─ Fallback Trigger: LLM unavailable                               │
│                                                                     │
│ Layer 3: Emergency Safety Response (Final)                         │
│ ├─ Location: src/models/intelligent_doctor.py:385                  │
│ ├─ Always: Recommends seeking medical attention                    │
│ └─ Trigger: All other systems fail                                 │
│                                                                     │
│ Error Flow:                                                         │
│ 1. Try OpenAI LLM → If fails:                                     │
│ 2. Try Intelligent Fallback + RAG → If fails:                     │
│ 3. Return Emergency Safety Response                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## **Phase 2 Data Storage & Memory**

### **Current Storage (Development)**
- **Type:** In-memory Python dictionaries
- **Location:** `src/models/intelligent_doctor.py:52`
- **Persistence:** Lost on service restart
- **Scalability:** Single instance only

### **Production Recommendations**
- **Redis:** For session persistence and multi-instance support
- **MongoDB:** For conversation history and analytics
- **Vector Database:** For enhanced RAG (Pinecone, Weaviate)

## **Performance & Scalability Considerations**

### **Current Bottlenecks**
1. **In-memory sessions:** Limited to single instance
2. **TF-IDF computation:** Recalculated on each RAG query  
3. **OpenAI API calls:** Rate limited, network dependent

### **Optimization Opportunities**
1. **Session externalization:** Move to Redis
2. **Vector caching:** Pre-compute and cache TF-IDF vectors
3. **Async processing:** Use FastAPI async features
4. **Connection pooling:** For external service calls

This Phase 2 architecture provides a robust foundation with clear separation of concerns, comprehensive error handling, and production-ready patterns for conversational AI in healthcare.