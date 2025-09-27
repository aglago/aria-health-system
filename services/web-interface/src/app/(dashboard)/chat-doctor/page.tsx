'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Send, Bot, User, AlertTriangle, Phone, Heart, Activity, Clock, CheckCircle2, Calendar } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

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

export default function DoctorChat() {
  const { user, loading: authLoading } = useAuth();
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

  // Update welcome message with user's name
  useEffect(() => {
    if (user) {
      setMessages(prev => prev.map(msg => 
        msg.id === '1' ? {
          ...msg,
          content: `Hello ${user.name || user.student_id}! I'm Dr. ARIA, your intelligent medical AI assistant. I'm here to have a natural conversation with you about your health concerns.\n\n🩺 **How I work:**\n• I ask follow-up questions like a real doctor would\n• I remember our entire conversation for better understanding\n• I use medical knowledge from textbooks and research\n• I provide clear reasoning behind my medical assessments\n• I'm specially trained on Ghana-specific health conditions\n\n**What's bringing you in today? Please describe any symptoms or health concerns you're experiencing.**`
        } : msg
      ));
    }
  }, [user]);

  // Handle authentication redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/role-selection');
    }
  }, [user, authLoading, router]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Return null if not authenticated (redirect will happen in useEffect)
  if (!user) {
    return null;
  }

  // Save consultation to database when completed
  const saveConsultationToDatabase = async (data: DoctorResponse, sessionId: string, messages: DoctorMessage[]) => {
    try {
      const response = await fetch('/api/consultations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          session_id: sessionId,
          symptoms: messages.find(m => m.sender === 'user')?.content || '',
          diagnosis: data.doctor_response,
          recommendations: data.doctor_response,
          urgency_level: data.urgency_level,
          confidence: data.confidence,
          medical_reasoning: data.medical_reasoning,
          messages: messages.map(m => ({
            content: m.content,
            sender: m.sender,
            timestamp: m.timestamp
          }))
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Consultation saved to database:', result);
      } else {
        console.error('❌ Failed to save consultation:', await response.text());
      }
    } catch (error) {
      console.error('❌ Error saving consultation to database:', error);
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
          user_id: user?.student_id || user?.id || 'anonymous',
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

      // Set consultation completion flag when appointment booking becomes available
      if (data.show_appointment_button && user) {
        localStorage.setItem(`consultation_${user.student_id || user.id}`, JSON.stringify({
          date: new Date().toISOString(),
          sessionId: sessionId || data.session_id,
          completed: true
        }));
        
        // Save consultation to database
        await saveConsultationToDatabase(data, sessionId || data.session_id, [...messages, doctorMessage]);
      }

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
            student_id: user?.student_id || user?.id,
            email: user?.student_id ? `${user.student_id}@umat.edu.gh` : user?.id ? `${user.id}@umat.edu.gh` : undefined
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

        // Trigger a global event to refresh appointments page if it's open
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('appointmentBooked', {
            detail: { appointment: confirmation.booking_details }
          }));
        }
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
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Navbar />
      
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Bot className="text-white" size={24} />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-foreground">Dr. ARIA</h1>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <Activity size={12} className="mr-1" />
                    AI Doctor
                  </Badge>
                  {sessionId && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <Clock size={12} className="mr-1" />
                      Session Active
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">
                  Intelligent Medical Conversation • Available 24/7 • Personalized for {user?.name || user?.student_id}
                </p>
              </div>
            </div>
          </div>

          {/* Chat Card */}
          <Card className="h-[75vh] flex flex-col">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-primary" />
                Medical Consultation
              </CardTitle>
              <CardDescription>
                Have a natural conversation with Dr. ARIA about your health concerns. Ask questions, describe symptoms, and get medical guidance.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <Card className={`w-full max-w-[85%] shadow-sm break-words ${
                    message.sender === 'user'
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border'
                  }`}>
                  <CardContent className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    {message.sender === 'user' ? (
                      <User size={16} className="text-primary-foreground" />
                    ) : (
                      <Bot size={16} className="text-primary" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                    {message.urgency === 'emergency' && (
                      <AlertTriangle size={16} className="text-destructive" />
                    )}
                    {/* {message.confidence && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {(message.confidence * 100).toFixed(0)}% confidence
                      </span>
                    )} */}
                  </div>
                  
                  <div className="prose prose-sm max-w-none overflow-hidden">
                    <div className="whitespace-pre-wrap text-foreground leading-relaxed break-words">{message.content}</div>
                  </div>
                  
                  {/* Medical Reasoning */}
                  {/* {message.medical_reasoning && (
                    <Card className="mt-4 bg-blue-50/50 border-blue-200 overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 size={16} className="text-blue-600" />
                          <h4 className="font-semibold text-blue-900">Medical Analysis</h4>
                        </div>
                        <p className="text-blue-800 leading-relaxed break-words">{message.medical_reasoning}</p>
                      </CardContent>
                    </Card>
                  )} */}
                  
                  {/* Follow-up Questions */}
                  {/* {message.follow_up_questions && message.follow_up_questions.length > 0 && (
                    <Card className="mt-4 bg-amber-50/50 border-amber-200 overflow-hidden">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-amber-900 mb-3">Additional Questions to Consider:</h4>
                        <div className="space-y-2">
                          {message.follow_up_questions.map((question, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <span className="text-amber-600 mt-1 font-bold flex-shrink-0">•</span>
                              <span className="text-amber-800 leading-relaxed break-words">{question}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )} */}
                  
                  {/* Emergency Alert */}
                  {message.requires_immediate_care && (
                    <Card className="mt-4 bg-red-50 border-red-200 border-l-4 border-l-red-500 overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle size={16} className="text-red-600 flex-shrink-0" />
                          <h4 className="font-bold text-red-900 break-words">⚠️ Requires Immediate Medical Attention</h4>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-red-800">
                          <Phone size={14} className="flex-shrink-0 mt-0.5" />
                          <span className="break-words">
                            <strong>UMaT Health Center:</strong> +233-312-022-242 | <strong>Emergency:</strong> 193
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Schedule Appointment Button */}
                  {message.show_appointment_button && sessionId && (
                    <Card className="mt-4 bg-green-50 border-green-200 overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar size={16} className="text-green-600 flex-shrink-0" />
                              <strong className="text-green-800">Ready to Schedule</strong>
                            </div>
                            <p className="text-green-700 text-sm break-words">
                              Your consultation is complete. Schedule an appointment with a doctor for proper evaluation.
                            </p>
                          </div>
                          <Button
                            onClick={() => handleScheduleAppointment(sessionId)}
                            disabled={appointmentLoading}
                            className="bg-green-600 hover:bg-green-700 flex items-center gap-2 text-sm flex-shrink-0"
                          >
                            {appointmentLoading ? (
                              <>
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                Booking...
                              </>
                            ) : (
                              <>
                                <Calendar size={16} />
                                Schedule Appointment
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Choice Buttons - Proceed vs Add Info */}
                  {message.show_choice_buttons && sessionId && (
                    <Card className="mt-4 bg-blue-50 border-blue-200 overflow-hidden">
                      <CardContent className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2 mb-4">
                          <CheckCircle2 size={16} className="text-blue-600 flex-shrink-0" />
                          <strong className="text-blue-800">What would you like to do?</strong>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                          <Button
                            onClick={() => handleUserChoice('proceed')}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 flex items-center gap-2 text-sm"
                          >
                            <CheckCircle2 size={16} />
                            Proceed with Assessment
                          </Button>
                          <Button
                            onClick={() => handleUserChoice('add_info')}
                            disabled={loading}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Send size={16} />
                            Add More Information
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  </CardContent>
                </Card>
              </div>
            ))}
            
                {loading && (
                  <div className="flex justify-start">
                    <Card className="bg-muted border-muted-foreground/20">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2">
                          <Bot size={16} className="text-primary" />
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                          </div>
                          <span className="text-sm text-muted-foreground">Dr. ARIA is thinking...</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input Area */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Tell me more about your symptoms..."
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                    disabled={loading}
                    className="flex-1 p-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={loading || !input.trim()}
                    className="px-6 py-3 flex items-center gap-2"
                  >
                    <Send size={18} />
                    Send
                  </Button>
                </div>
                
                <div className="mt-3 text-xs text-muted-foreground text-center">
                  <p>🩺 Dr. ARIA uses conversation memory and medical knowledge to provide personalized guidance.</p>
                  <p>This is AI-powered medical assistance and not a replacement for professional medical care.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Appointment Booking Dialog */}
      <Dialog open={showAppointmentModal} onOpenChange={setShowAppointmentModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="text-primary" size={24} />
              Book Your Appointment
            </DialogTitle>
            <DialogDescription>
              Schedule an appointment based on your consultation with Dr. ARIA
            </DialogDescription>
          </DialogHeader>

          {/* Assessment Summary */}
          {/* {assessmentSummary && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Medical Assessment Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p><strong>Severity Score:</strong> {assessmentSummary.severity_score}/100</p>
                  <p><strong>Priority Level:</strong> {assessmentSummary.priority_level?.replace('_', ' ').toUpperCase()}</p>
                  <p><strong>Recommended Care:</strong> {assessmentSummary.severity_level?.toUpperCase()}</p>
                </div>
              </CardContent>
            </Card>
          )} */}

          {/* Available Times */}
          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Available Appointment Times</h3>
              
            {appointmentTimes.length === 0 ? (
              <Card className="p-8 text-center">
                <Calendar className="mx-auto text-muted-foreground mb-4" size={48} />
                <p className="text-muted-foreground">No appointment times available</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {appointmentTimes.map((time, index) => (
                  <Card
                    key={index}
                    onClick={() => setSelectedAppointment(time)}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      selectedAppointment === time
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-foreground">
                            {time.time}
                          </div>
                          {time.doctor && (
                            <div className="text-sm text-muted-foreground">
                              Dr. {time.doctor}
                            </div>
                          )}
                          {time.room && (
                            <div className="text-xs text-muted-foreground">
                              Room {time.room}
                            </div>
                          )}
                          {time.type && (
                            <div className="text-xs mt-1">
                              <Badge variant={
                                time.type === 'emergency' ? 'destructive' :
                                time.type === 'same_day' ? 'secondary' :
                                time.type === 'urgent' ? 'outline' :
                                'default'
                              } className="text-xs">
                                {time.type.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                          )}
                        </div>
                        {selectedAppointment === time && (
                          <CheckCircle2 className="text-primary" size={24} />
                        )}
                      </div>
                      {time.note && (
                        <div className="mt-2 text-sm text-destructive font-medium">
                          {time.note}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowAppointmentModal(false);
                setSelectedAppointment(null);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBookSelectedAppointment}
              disabled={!selectedAppointment || appointmentLoading}
              className="flex items-center gap-2"
            >
              {appointmentLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  Booking...
                </>
              ) : (
                <>
                  <Calendar size={16} />
                  Book Appointment
                </>
              )}
            </Button>
          </div>
          
          {selectedAppointment && (
            <Card className="mt-4">
              <CardContent className="p-3">
                <div className="text-sm">
                  <strong>Selected:</strong> {selectedAppointment.time}
                  {selectedAppointment.doctor && ` with Dr. ${selectedAppointment.doctor}`}
                  {selectedAppointment.room && ` in Room ${selectedAppointment.room}`}
                </div>
              </CardContent>
            </Card>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}