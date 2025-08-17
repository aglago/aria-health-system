'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Bot, User, AlertTriangle, Phone, Heart, ArrowLeft, Activity, Clock, CheckCircle2, Calendar } from 'lucide-react';

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
  show_appointment_button?: boolean;
  show_choice_buttons?: boolean;
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
  show_appointment_button?: boolean;
  show_choice_buttons?: boolean;
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
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentTimes, setAppointmentTimes] = useState<any[]>([]);
  const [assessmentSummary, setAssessmentSummary] = useState<any>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
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
        requires_immediate_care: data.requires_immediate_care,
        show_appointment_button: data.show_appointment_button,
        show_choice_buttons: data.show_choice_buttons
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

  const handleUserChoice = async (choice: 'proceed' | 'add_info') => {
    if (!sessionId) return;
    
    // Send the choice as a message to continue the conversation
    const choiceMessage = choice === 'proceed' ? 'proceed with assessment' : 'I want to add more information';
    
    // Create user message for the choice
    const userMessage: DoctorMessage = {
      id: Date.now().toString(),
      content: choice === 'proceed' ? 'Proceed with assessment' : 'I want to add more information',
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await fetch('/api/aria/doctor/continue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: choiceMessage
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: DoctorResponse = await response.json();
      
      const doctorMessage: DoctorMessage = {
        id: (Date.now() + 1).toString(),
        content: data.doctor_response,
        sender: 'doctor',
        timestamp: new Date(),
        urgency: data.urgency_level as 'low' | 'medium' | 'high' | 'emergency',
        confidence: data.confidence,
        medical_reasoning: data.medical_reasoning,
        follow_up_questions: data.follow_up_questions,
        requires_immediate_care: data.requires_immediate_care,
        show_appointment_button: data.show_appointment_button,
        show_choice_buttons: data.show_choice_buttons
      };
      
      setMessages(prev => [...prev, doctorMessage]);

      // Handle emergency situations
      if (data.requires_immediate_care) {
        handleEmergencyResponse();
      }
      
    } catch (error) {
      console.error('Choice selection error:', error);
      const errorMessage: DoctorMessage = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble processing your choice right now. Please try again or contact UMaT Health Services if this is urgent.",
        sender: 'doctor',
        timestamp: new Date(),
        urgency: 'high'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSelectedAppointment = async () => {
    if (!selectedAppointment || !sessionId) return;
    
    setAppointmentLoading(true);
    
    try {
      // Book the appointment
      const bookingResponse = await fetch('/api/aria/doctor/book-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          selected_time: selectedAppointment,
          user_contact: {
            student_id: user?.student_id,
            email: user?.student_id ? `${user.student_id}@umat.edu.gh` : undefined
          }
        })
      });
      
      if (!bookingResponse.ok) {
        throw new Error(`Booking failed: ${bookingResponse.status}`);
      }
      
      const bookingData = await bookingResponse.json();
      
      // Show booking confirmation
      const confirmation = bookingData.booking;
      if (confirmation && confirmation.booking_confirmed) {
        const confirmationMessage: DoctorMessage = {
          id: Date.now().toString(),
          content: `✅ **APPOINTMENT BOOKED SUCCESSFULLY!**\n\n📅 **Appointment Details:**\n• **Doctor:** ${confirmation.booking_details.doctor}\n• **Time:** ${confirmation.booking_details.appointment_time}\n• **Location:** ${confirmation.booking_details.location}\n• **Room:** ${confirmation.booking_details.room}\n• **Duration:** ${confirmation.booking_details.duration}\n• **Booking ID:** ${confirmation.booking_details.booking_id}\n\n📋 **What to bring:**\n${confirmation.patient_preparation.bring_items.map((item: string) => `• ${item}`).join('\n')}\n\n📞 **Contact Information:**\n• Health Center: ${confirmation.contact_info.health_center}\n• Emergency: ${confirmation.contact_info.emergency}\n• Appointment Changes: ${confirmation.contact_info.appointment_changes}\n\n**Please arrive 10 minutes early for check-in.**`,
          sender: 'doctor',
          timestamp: new Date(),
          urgency: 'low'
        };
        
        setMessages(prev => [...prev, confirmationMessage]);
        
        // Close modal and reset state
        setShowAppointmentModal(false);
        setSelectedAppointment(null);
        setAppointmentTimes([]);
        setAssessmentSummary(null);
      }
      
    } catch (error) {
      console.error('❌ Appointment booking error:', error);
      
      const errorMessage: DoctorMessage = {
        id: Date.now().toString(),
        content: `❌ **Appointment Booking Failed**\n\nI'm sorry, but there was an issue scheduling your appointment. Please contact UMaT Health Center directly to book your appointment.\n\n📞 **Contact Information:**\n• UMaT Health Center: +233-312-022-242\n• Appointment Booking: +233-312-022-245\n\nThey will be able to assist you with scheduling based on your consultation.`,
        sender: 'doctor',
        timestamp: new Date(),
        urgency: 'medium'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setAppointmentLoading(false);
    }
  };

  const handleScheduleAppointment = async (sessionId: string) => {
    if (!sessionId) return;
    
    setAppointmentLoading(true);
    
    try {
      console.log('📅 Fetching available appointment times for session:', sessionId);
      
      // Get available appointment times (URL encode the session ID)
      const encodedSessionId = encodeURIComponent(sessionId);
      const timesResponse = await fetch(`/api/aria/doctor/available-times/${encodedSessionId}`);
      
      if (!timesResponse.ok) {
        if (timesResponse.status === 404) {
          const errorData = await timesResponse.json();
          
          const sessionExpiredMessage: DoctorMessage = {
            id: Date.now().toString(),
            content: `⚠️ **Session Expired**\n\n${errorData.message || 'Your consultation session has expired.'}\n\n**Options:**\n• Start a new consultation with Dr. ARIA\n• Contact UMaT Health Center directly\n\n📞 **Contact Information:**\n• Health Center: ${errorData.fallback_contact?.health_center || '+233-312-022-242'}\n• Appointment Booking: ${errorData.fallback_contact?.appointment_booking || '+233-312-022-245'}`,
            sender: 'doctor',
            timestamp: new Date(),
            urgency: 'medium'
          };
          
          setMessages(prev => [...prev, sessionExpiredMessage]);
          return;
        }
        
        throw new Error(`Failed to fetch appointment times: ${timesResponse.status}`);
      }
      
      const timesData = await timesResponse.json();
      
      console.log('✅ Available times received:', timesData);
      
      // Set data for modal and show it
      setAppointmentTimes(timesData.available_times);
      setAssessmentSummary(timesData.assessment_summary);
      setShowAppointmentModal(true);
      
    } catch (error) {
      console.error('❌ Appointment booking error:', error);
      
      const errorMessage: DoctorMessage = {
        id: Date.now().toString(),
        content: `❌ **Appointment Booking Failed**\n\nI'm sorry, but there was an issue scheduling your appointment. Please contact UMaT Health Center directly to book your appointment.\n\n📞 **Contact Information:**\n• UMaT Health Center: +233-312-022-242\n• Appointment Booking: +233-312-022-245\n\nThey will be able to assist you with scheduling based on your consultation.`,
        sender: 'doctor',
        timestamp: new Date(),
        urgency: 'medium'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setAppointmentLoading(false);
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
                  
                  {/* Schedule Appointment Button */}
                  {message.show_appointment_button && sessionId && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar size={16} className="text-green-600" />
                            <strong className="text-green-800 dark:text-green-200">Ready to Schedule</strong>
                          </div>
                          <p className="text-green-700 dark:text-green-300 text-sm">
                            Your consultation is complete. Schedule an appointment with a doctor for proper evaluation.
                          </p>
                        </div>
                        <button
                          onClick={() => handleScheduleAppointment(sessionId)}
                          disabled={appointmentLoading}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
                        >
                          {appointmentLoading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Booking...
                            </>
                          ) : (
                            <>
                              <Calendar size={16} />
                              Schedule Appointment
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Choice Buttons - Proceed vs Add Info */}
                  {message.show_choice_buttons && sessionId && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-3">
                          <CheckCircle2 size={16} className="text-blue-600" />
                          <strong className="text-blue-800 dark:text-blue-200">What would you like to do?</strong>
                        </div>
                        <div className="flex gap-3 justify-center">
                          <button
                            onClick={() => handleUserChoice('proceed')}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
                          >
                            <CheckCircle2 size={16} />
                            Proceed with Assessment
                          </button>
                          <button
                            onClick={() => handleUserChoice('add_info')}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm"
                          >
                            <Send size={16} />
                            Add More Information
                          </button>
                        </div>
                      </div>
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

      {/* Modern Appointment Booking Modal */}
      {showAppointmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="text-blue-600" size={24} />
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">Book Your Appointment</h2>
                </div>
                <button
                  onClick={() => {
                    setShowAppointmentModal(false);
                    setSelectedAppointment(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Assessment Summary */}
            {assessmentSummary && (
              <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Medical Assessment Summary</h3>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p><strong>Severity Score:</strong> {assessmentSummary.severity_score}/100</p>
                  <p><strong>Priority Level:</strong> {assessmentSummary.priority_level?.replace('_', ' ').toUpperCase()}</p>
                  <p><strong>Recommended Care:</strong> {assessmentSummary.severity_level?.toUpperCase()}</p>
                </div>
              </div>
            )}

            {/* Available Times */}
            <div className="p-6">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Available Appointment Times</h3>
              
              {appointmentTimes.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-500">No appointment times available</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {appointmentTimes.map((time, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedAppointment(time)}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        selectedAppointment === time
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                          : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-800 dark:text-gray-200">
                            {time.time}
                          </div>
                          {time.doctor && (
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Dr. {time.doctor}
                            </div>
                          )}
                          {time.room && (
                            <div className="text-xs text-gray-500">
                              Room {time.room}
                            </div>
                          )}
                          {time.type && (
                            <div className="text-xs mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                time.type === 'emergency' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                time.type === 'same_day' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                                time.type === 'urgent' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              }`}>
                                {time.type.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        {selectedAppointment === time && (
                          <CheckCircle2 className="text-blue-600" size={24} />
                        )}
                      </div>
                      {time.note && (
                        <div className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                          {time.note}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => {
                    setShowAppointmentModal(false);
                    setSelectedAppointment(null);
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBookSelectedAppointment}
                  disabled={!selectedAppointment || appointmentLoading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {appointmentLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Booking...
                    </>
                  ) : (
                    <>
                      <Calendar size={16} />
                      Book Appointment
                    </>
                  )}
                </button>
              </div>
              
              {selectedAppointment && (
                <div className="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <div className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>Selected:</strong> {selectedAppointment.time}
                    {selectedAppointment.doctor && ` with Dr. ${selectedAppointment.doctor}`}
                    {selectedAppointment.room && ` in Room ${selectedAppointment.room}`}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}