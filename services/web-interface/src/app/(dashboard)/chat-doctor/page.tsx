'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Bot, User, AlertTriangle, Phone, Heart, ArrowLeft, Activity, Clock, CheckCircle2 } from 'lucide-react';

interface DoctorMessage {
  id: string;
  content: string;
  sender: 'user' | 'doctor';
  timestamp: Date;
  urgency?: 'low' | 'medium' | 'high' | 'emergency';
  confidence?: number;
  medical_reasoning?: string;
  follow_up_questions?: string[];
  requires_immediate_care?: boolean;
}

interface DoctorResponse {
  session_id: string;
  doctor_response: string;
  follow_up_questions: string[];
  urgency_level: string;
  requires_immediate_care: boolean;
  confidence: number;
  medical_reasoning: string;
  timestamp: string;
}

interface UserData {
  student_id: string;
  name: string;
  institution: string;
}

export default function DoctorChat() {
  const [messages, setMessages] = useState<DoctorMessage[]>([
    {
      id: '1',
      content: "Hello! I'm Dr. ARIA, your intelligent medical AI assistant. I'm here to have a natural conversation with you about your health concerns, just like you would with a real doctor.\n\n🩺 **What makes me different:**\n• I ask follow-up questions to understand your condition better\n• I remember our entire conversation for context\n• I use medical knowledge from textbooks and journals\n• I provide reasoning behind my medical assessments\n• I'm trained on Ghana-specific health conditions\n\n**Please tell me what's bringing you in today. What symptoms or health concerns are you experiencing?**",
      sender: 'doctor',
      timestamp: new Date()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [user, setUser] = useState<UserData | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Check authentication on component mount
  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const response = await fetch('/api/auth/verify');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        
        // Update welcome message with user's name
        setMessages(prev => prev.map(msg => 
          msg.id === '1' ? {
            ...msg,
            content: `Hello ${data.user.name || data.user.student_id}! I'm Dr. ARIA, your intelligent medical AI assistant. I'm here to have a natural conversation with you about your health concerns.\n\n🩺 **How I work:**\n• I ask follow-up questions like a real doctor would\n• I remember our entire conversation for better understanding\n• I use medical knowledge from textbooks and research\n• I provide clear reasoning behind my medical assessments\n• I'm specially trained on Ghana-specific health conditions\n\n**What's bringing you in today? Please describe any symptoms or health concerns you're experiencing.**`
          } : msg
        ));
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      router.push('/login');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage: DoctorMessage = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setLoading(true);

    try {
      let apiEndpoint = '';
      let requestBody = {};

      if (!sessionId) {
        // Start new conversation
        apiEndpoint = '/api/aria/doctor/start';
        requestBody = {
          user_id: user?.student_id || 'anonymous',
          message: currentInput
        };
      } else {
        // Continue existing conversation
        apiEndpoint = '/api/aria/doctor/continue';
        requestBody = {
          session_id: sessionId,
          message: currentInput
        };
      }

      console.log('🩺 Calling doctor chat API:', apiEndpoint, requestBody);
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: DoctorResponse = await response.json();
      
      // Store session ID if this was the first message
      if (!sessionId) {
        setSessionId(data.session_id);
      }
      
      const doctorMessage: DoctorMessage = {
        id: (Date.now() + 1).toString(),
        content: data.doctor_response,
        sender: 'doctor',
        timestamp: new Date(),
        urgency: data.urgency_level as 'low' | 'medium' | 'high' | 'emergency',
        confidence: data.confidence,
        medical_reasoning: data.medical_reasoning,
        follow_up_questions: data.follow_up_questions,
        requires_immediate_care: data.requires_immediate_care
      };
      
      setMessages(prev => [...prev, doctorMessage]);

      // Handle emergency situations
      if (data.requires_immediate_care) {
        handleEmergencyResponse();
      }
      
    } catch (error) {
      console.error('Doctor chat error:', error);
      const errorMessage: DoctorMessage = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble processing your message right now. If this is a medical emergency, please contact UMaT Health Services immediately.\n\n🏥 UMaT Health Center: +233-312-022-242\n🚨 Emergency: 193",
        sender: 'doctor',
        timestamp: new Date(),
        urgency: 'high'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleEmergencyResponse = () => {
    if (typeof window !== 'undefined') {
      const emergencyAlert = confirm(
        "🚨 MEDICAL EMERGENCY DETECTED 🚨\n\n" +
        "Dr. ARIA has detected signs of a possible medical emergency.\n" +
        "You should seek immediate medical attention.\n\n" +
        "Click OK to see emergency contact numbers."
      );
      
      if (emergencyAlert) {
        alert(
          "📞 EMERGENCY CONTACTS:\n\n" +
          "• Ghana National Ambulance: 193\n" +
          "• UMaT Campus Security: +233-312-022-240\n" +
          "• UMaT Health Center: +233-312-022-242\n" +
          "• Police Emergency: 191\n\n" +
          "Get medical help immediately!"
        );
      }
    }
  };
  
  const getUrgencyColor = (urgency?: string) => {
    switch (urgency) {
      case 'emergency': return 'border-red-500 bg-red-50 dark:bg-red-950';
      case 'high': return 'border-orange-500 bg-orange-50 dark:bg-orange-950';
      case 'medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      default: return 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700';
    }
  };


  // Show loading screen while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Heart className="text-white" size={32} />
          </div>
          <p className="text-blue-600 dark:text-blue-300">Loading Dr. ARIA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-indigo-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/')}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Back to ARIA Chat"
            >
              <ArrowLeft size={20} />
            </button>
            
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Bot className="text-white" size={24} />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-blue-900 dark:text-blue-100">Dr. ARIA</h1>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                  Conversational AI
                </span>
              </div>
              <p className="text-blue-600 dark:text-blue-300">Intelligent Medical Conversation</p>
            </div>
            
            <div className="ml-auto flex items-center gap-4">
              {sessionId && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Activity size={16} className="text-green-500" />
                  <span>Session Active</span>
                </div>
              )}
              
              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                <Clock size={16} />
                <span>24/7</span>
              </div>
              
              {user && (
                <div className="text-right">
                  <div className="font-medium text-gray-800 dark:text-gray-200">{user.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{user.student_id}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 h-[75vh] flex flex-col">
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-lg border-2 ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : getUrgencyColor(message.urgency)
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {message.sender === 'user' ? (
                      <User size={16} />
                    ) : (
                      <Bot size={16} className="text-blue-600" />
                    )}
                    <span className="text-xs opacity-70">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                    {message.urgency === 'emergency' && (
                      <AlertTriangle size={16} className="text-red-600" />
                    )}
                    {message.confidence && (
                      <span className="text-xs opacity-70 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {(message.confidence * 100).toFixed(0)}% confidence
                      </span>
                    )}
                  </div>
                  
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                  
                  {/* Medical Reasoning */}
                  {message.medical_reasoning && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded text-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 size={14} className="text-blue-600" />
                        <strong className="text-blue-800 dark:text-blue-200">Medical Reasoning:</strong>
                      </div>
                      <p className="text-blue-700 dark:text-blue-300">{message.medical_reasoning}</p>
                    </div>
                  )}
                  
                  {/* Follow-up Questions - Now displayed as part of doctor's message, not clickable */}
                  {message.follow_up_questions && message.follow_up_questions.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 rounded-r text-sm">
                      <div className="text-blue-800 dark:text-blue-200 space-y-1">
                        {message.follow_up_questions.map((question, index) => (
                          <div key={index} className="flex items-start">
                            <span className="text-blue-600 mr-2">•</span>
                            <span>{question}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Emergency Alert */}
                  {message.requires_immediate_care && (
                    <div className="mt-3 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded text-red-800 dark:text-red-200 text-sm">
                      <div className="flex items-center gap-2">
                        <Phone size={14} />
                        <strong>⚠️ Requires Immediate Medical Attention</strong>
                      </div>
                      <p className="mt-1 text-xs">
                        UMaT Health Center: +233-312-022-242 | Emergency: 193
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg border-2 border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2">
                    <Bot size={16} className="text-blue-600" />
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Dr. ARIA is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell me more about your symptoms..."
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                disabled={loading}
                className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
              <button 
                onClick={handleSendMessage} 
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
              >
                <Send size={18} />
                Send
              </button>
            </div>
            
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
              <p>🩺 Dr. ARIA uses conversation memory and medical knowledge to provide personalized guidance.</p>
              <p>This is AI-powered medical assistance and not a replacement for professional medical care.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}