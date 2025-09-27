'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/layout/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs-simple';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Clock, 
  Stethoscope, 
  FileText, 
  Pill, 
  AlertTriangle,
  Phone,
  Mail,
  Heart,
  Activity,
  Shield,
  MessageSquare,
  Bot,
  CheckCircle,
  Save,
  Edit,
  History
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/lib/auth/auth-context';

interface AppointmentDetails {
  appointment: {
    id: string;
    date: string;
    time: string;
    type: string;
    status: string;
    urgency_level: string;
    notes?: string;
    medical_notes?: string;
    prescription?: string;
    next_steps?: string;
    symptoms?: string[];
    doctor_name: string;
    doctor_id?: string;
    patient_id: string;
    consultation_id?: string;
    created_from_consultation: boolean;
    patient?: {
      name: string;
      student_id: string;
      email: string;
      phone: string;
      dateOfBirth?: string;
      bloodType?: string;
      allergies?: string[];
      emergencyContact?: {
        name: string;
        relationship: string;
        phone: string;
      };
      chronicConditions?: string[];
      currentMedications?: string[];
    };
  };
  consultation?: {
    session_id?: string;
    
    // Symptom Analysis
    symptoms: string[];
    symptom_duration?: string;
    symptom_severity?: 'mild' | 'moderate' | 'severe';
    symptom_onset?: string;
    
    // Medical Assessment
    diagnosis_summary: string;
    primary_concern?: string;
    differential_diagnosis?: string[];
    urgency_level: string;
    requires_immediate_care: boolean;
    confidence_score: number;
    medical_reasoning: string;
    
    // Clinical Information
    vital_signs?: {
      temperature?: string;
      blood_pressure?: string;
      heart_rate?: string;
      respiratory_rate?: string;
    };
    reported_pain_level?: number;
    
    // Medical History Context
    relevant_medical_history?: string[];
    current_medications_mentioned?: string[];
    allergies_mentioned?: string[];
    family_history_relevant?: string[];
    
    // Assessment and Plan
    recommended_actions: string[];
    suggested_tests?: string[];
    red_flags?: string[];
    when_to_seek_immediate_care?: string[];
    
    // Appointment Context
    appointment_recommended?: boolean;
    appointment_urgency?: 'routine' | 'urgent' | 'emergent';
    pre_appointment_instructions?: string[];
    
    // RAG and Knowledge Base
    knowledge_base_references?: string[];
    clinical_guidelines_used?: string[];
    rag_context?: any;
    
    // Session Management
    status?: string;
    duration_minutes?: number;
    follow_up_required?: boolean;
    consultation_completeness?: number;
    createdAt?: string;
    messages?: Array<{
      role: string;
      content: string;
      timestamp: string;
    }>;
  };
  appointment_history: Array<{
    id: string;
    date: string;
    time: string;
    type: string;
    status: string;
    doctor_name: string;
    medical_notes?: string;
  }>;
}

export default function AppointmentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { user, loading } = useAuth();
  const [appointmentDetails, setAppointmentDetails] = useState<AppointmentDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state for medical updates
  const [medicalNotes, setMedicalNotes] = useState('');
  const [prescription, setPrescription] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [appointmentStatus, setAppointmentStatus] = useState('');

  const appointmentId = params.id as string;

  // Fetch appointment details
  useEffect(() => {
    const fetchAppointmentDetails = async () => {
      if (!appointmentId) return;
      
      try {
        const response = await fetch(`/api/appointments/${appointmentId}`);
        if (response.ok) {
          const data = await response.json();
          setAppointmentDetails(data);
          
          // Pre-fill form fields
          setMedicalNotes(data.appointment.medical_notes || '');
          setPrescription(data.appointment.prescription || '');
          setNextSteps(data.appointment.next_steps || '');
          setAppointmentStatus(data.appointment.status || 'scheduled');
        } else {
          console.error('Failed to fetch appointment details');
        }
      } catch (error) {
        console.error('Error fetching appointment details:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (appointmentId && user) {
      fetchAppointmentDetails();
    }
  }, [appointmentId, user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/role-selection');
    }
  }, [user, loading, router]);

  const handleSave = async () => {
    if (!appointmentDetails) return;
    
    setIsSaving(true);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: appointmentStatus,
          medical_notes: medicalNotes,
          prescription: prescription,
          next_steps: nextSteps,
        }),
      });
      
      if (response.ok) {
        // Refresh appointment details
        const updatedResponse = await fetch(`/api/appointments/${appointmentId}`);
        if (updatedResponse.ok) {
          const updatedData = await updatedResponse.json();
          setAppointmentDetails(updatedData);
        }
        
        setIsEditing(false);
        // Success notification could be added here
      } else {
        console.error('Failed to update appointment');
      }
    } catch (error) {
      console.error('Error updating appointment:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case 'emergency':
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no-show':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (!appointmentDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-muted-foreground">Appointment not found</p>
            <Button onClick={() => router.back()} className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const appointment = appointmentDetails.appointment;
  const consultation = appointmentDetails.consultation;
  const history = appointmentDetails.appointment_history;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                onClick={() => router.back()}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Appointment Details</h1>
                <p className="text-muted-foreground">
                  {format(new Date(appointment.date), 'EEEE, MMMM dd, yyyy')} at {appointment.time}
                </p>
              </div>
            </div>
            
            {user?.role === 'doctor' && (
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      disabled={isSaving}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                      <Save className="w-4 h-4 mr-2" />
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Medical Notes
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Status and Urgency Badges */}
          <div className="flex gap-3 mb-8">
            <Badge className={getStatusColor(appointment.status)} variant="outline">
              {appointment.status.toUpperCase()}
            </Badge>
            <Badge className={getUrgencyColor(appointment.urgency_level)} variant="outline">
              <AlertTriangle className="w-3 h-3 mr-1" />
              {appointment.urgency_level?.toUpperCase()} PRIORITY
            </Badge>
            {appointment.created_from_consultation && (
              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                <Bot className="w-3 h-3 mr-1" />
                DR. ARIA CONSULTATION
              </Badge>
            )}
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="medical">Medical Details</TabsTrigger>
              <TabsTrigger value="consultation">Dr. ARIA Report</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Patient Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Patient Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Name</Label>
                        <p className="font-medium">{appointment.patient?.name || 'Unknown'}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Student ID</Label>
                        <p className="font-medium">{appointment.patient?.student_id || appointment.patient_id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{appointment.patient?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{appointment.patient?.phone || 'N/A'}</span>
                      </div>
                    </div>

                    {appointment.patient?.dateOfBirth && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Date of Birth</Label>
                        <p>{format(new Date(appointment.patient.dateOfBirth), 'MMM dd, yyyy')}</p>
                      </div>
                    )}

                    {appointment.patient?.bloodType && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Blood Type</Label>
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span className="font-medium">{appointment.patient.bloodType}</span>
                        </div>
                      </div>
                    )}

                    {appointment.patient?.emergencyContact && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Emergency Contact</Label>
                        <div className="bg-red-50 p-3 rounded-md">
                          <p className="font-medium">{appointment.patient.emergencyContact.name}</p>
                          <p className="text-sm text-gray-600">
                            {appointment.patient.emergencyContact.relationship} • {appointment.patient.emergencyContact.phone}
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Appointment Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-green-600" />
                      Appointment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Date</Label>
                        <p className="font-medium">{format(new Date(appointment.date), 'EEEE, MMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Time</Label>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="font-medium">{appointment.time}</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Type</Label>
                        <p className="font-medium">{appointment.type}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Doctor</Label>
                        <div className="flex items-center gap-2">
                          <Stethoscope className="w-4 h-4 text-blue-400" />
                          <span className="font-medium">{appointment.doctor_name}</span>
                        </div>
                      </div>
                    </div>

                    {appointment.symptoms && appointment.symptoms.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Reported Symptoms</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {appointment.symptoms.map((symptom, index) => (
                            <Badge key={index} variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                              <Activity className="w-3 h-3 mr-1" />
                              {symptom}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {appointment.notes && (
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Initial Notes</Label>
                        <p className="text-sm bg-gray-50 p-3 rounded-md">{appointment.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Medical Alerts */}
              {(appointment.patient?.allergies?.length || appointment.patient?.chronicConditions?.length || appointment.patient?.currentMedications?.length) && (
                <Card className="border-amber-200 bg-amber-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-amber-800">
                      <Shield className="w-5 h-5" />
                      Medical Alerts & Conditions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {appointment.patient.allergies && appointment.patient.allergies.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-amber-700">Allergies</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {appointment.patient.allergies.map((allergy, index) => (
                            <Badge key={index} variant="outline" className="bg-red-100 text-red-800 border-red-200">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {allergy}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {appointment.patient.chronicConditions && appointment.patient.chronicConditions.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-amber-700">Chronic Conditions</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {appointment.patient.chronicConditions.map((condition, index) => (
                            <Badge key={index} variant="outline" className="bg-orange-100 text-orange-800 border-orange-200">
                              {condition}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {appointment.patient.currentMedications && appointment.patient.currentMedications.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium text-amber-700">Current Medications</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {appointment.patient.currentMedications.map((medication, index) => (
                            <Badge key={index} variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                              <Pill className="w-3 h-3 mr-1" />
                              {medication}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Medical Details Tab */}
            <TabsContent value="medical" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      Medical Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        value={medicalNotes}
                        onChange={(e) => setMedicalNotes(e.target.value)}
                        placeholder="Enter medical observations, diagnosis, treatment notes..."
                        rows={8}
                        className="w-full"
                      />
                    ) : (
                      <div className="min-h-[200px] p-3 bg-gray-50 rounded-md">
                        {appointment.medical_notes ? (
                          <p className="whitespace-pre-wrap">{appointment.medical_notes}</p>
                        ) : (
                          <p className="text-gray-500 italic">No medical notes recorded</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Pill className="w-5 h-5 text-green-600" />
                        Prescription
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isEditing ? (
                        <Textarea
                          value={prescription}
                          onChange={(e) => setPrescription(e.target.value)}
                          placeholder="Enter prescribed medications, dosage, and instructions..."
                          rows={4}
                          className="w-full"
                        />
                      ) : (
                        <div className="min-h-[100px] p-3 bg-gray-50 rounded-md">
                          {appointment.prescription ? (
                            <p className="whitespace-pre-wrap">{appointment.prescription}</p>
                          ) : (
                            <p className="text-gray-500 italic">No prescription recorded</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-purple-600" />
                        Next Steps & Follow-up
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {isEditing ? (
                        <Textarea
                          value={nextSteps}
                          onChange={(e) => setNextSteps(e.target.value)}
                          placeholder="Enter follow-up instructions, next appointment recommendations..."
                          rows={4}
                          className="w-full"
                        />
                      ) : (
                        <div className="min-h-[100px] p-3 bg-gray-50 rounded-md">
                          {appointment.next_steps ? (
                            <p className="whitespace-pre-wrap">{appointment.next_steps}</p>
                          ) : (
                            <p className="text-gray-500 italic">No follow-up instructions recorded</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {isEditing && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Status Update</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Label htmlFor="status">Appointment Status</Label>
                        <select
                          id="status"
                          value={appointmentStatus}
                          onChange={(e) => setAppointmentStatus(e.target.value)}
                          className="w-full mt-1 p-2 border border-input rounded-md bg-background"
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                          <option value="no-show">No Show</option>
                        </select>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Dr. ARIA Consultation Tab */}
            <TabsContent value="consultation" className="space-y-6">
              {consultation ? (
                <div className="space-y-6">
                  {/* Overview Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-purple-600 text-base">
                          <Bot className="w-4 h-4" />
                          Assessment
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          <div>
                            <Label className="text-xs text-gray-500">Confidence</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-blue-600 h-1.5 rounded-full" 
                                  style={{ width: `${(consultation.confidence_score || 0) * 100}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium">{Math.round((consultation.confidence_score || 0) * 100)}%</span>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs text-gray-500">Completeness</Label>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-green-600 h-1.5 rounded-full" 
                                  style={{ width: `${consultation.consultation_completeness || 0}%` }}
                                ></div>
                              </div>
                              <span className="text-xs font-medium">{consultation.consultation_completeness || 0}%</span>
                            </div>
                          </div>
                          <div className="flex gap-1 mt-2">
                            <Badge 
                              className={`text-xs ${
                                consultation.urgency_level === 'emergency' || consultation.urgency_level === 'high'
                                  ? 'bg-red-100 text-red-700 border-red-200'
                                  : consultation.urgency_level === 'medium'
                                  ? 'bg-orange-100 text-orange-700 border-orange-200'
                                  : 'bg-green-100 text-green-700 border-green-200'
                              }`}
                              variant="outline"
                            >
                              {consultation.urgency_level?.toUpperCase()}
                            </Badge>
                            {consultation.requires_immediate_care && (
                              <Badge variant="destructive" className="text-xs">
                                URGENT
                              </Badge>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Symptoms Card */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-red-600 text-base">
                          <Activity className="w-4 h-4" />
                          Symptoms ({consultation.symptoms?.length || 0})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {consultation.symptoms && consultation.symptoms.length > 0 ? (
                            <>
                              <div className="flex flex-wrap gap-1">
                                {consultation.symptoms.slice(0, 4).map((symptom, index) => (
                                  <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs px-1.5 py-0.5">
                                    {symptom}
                                  </Badge>
                                ))}
                                {consultation.symptoms.length > 4 && (
                                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">+{consultation.symptoms.length - 4}</Badge>
                                )}
                              </div>
                              {(consultation.symptom_severity || consultation.symptom_duration) && (
                                <div className="text-xs space-y-1">
                                  {consultation.symptom_severity && (
                                    <div>
                                      <span className="text-gray-500">Severity:</span> 
                                      <Badge 
                                        variant="outline" 
                                        className={`ml-1 text-xs ${
                                          consultation.symptom_severity === 'severe' 
                                            ? 'bg-red-100 text-red-700'
                                            : consultation.symptom_severity === 'moderate'
                                            ? 'bg-orange-100 text-orange-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                        }`}
                                      >
                                        {consultation.symptom_severity}
                                      </Badge>
                                    </div>
                                  )}
                                  {consultation.symptom_duration && (
                                    <div>
                                      <span className="text-gray-500">Duration:</span> {consultation.symptom_duration}
                                    </div>
                                  )}
                                </div>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-gray-500">No specific symptoms identified</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Clinical Data Card */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-blue-600 text-base">
                          <Heart className="w-4 h-4" />
                          Clinical Data
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 text-xs">
                          {consultation.vital_signs && Object.keys(consultation.vital_signs).length > 0 ? (
                            <div>
                              <Label className="text-gray-500">Vitals:</Label>
                              <div className="space-y-1 ml-2">
                                {consultation.vital_signs.temperature && (
                                  <div>🌡️ {consultation.vital_signs.temperature}</div>
                                )}
                                {consultation.vital_signs.blood_pressure && (
                                  <div>❤️ {consultation.vital_signs.blood_pressure}</div>
                                )}
                                {consultation.vital_signs.heart_rate && (
                                  <div>💓 {consultation.vital_signs.heart_rate}</div>
                                )}
                              </div>
                            </div>
                          ) : null}
                          {consultation.reported_pain_level !== undefined && (
                            <div>
                              <Label className="text-gray-500">Pain Level:</Label>
                              <Badge variant="outline" className="ml-1 text-xs">
                                {consultation.reported_pain_level}/10
                              </Badge>
                            </div>
                          )}
                          {consultation.primary_concern && (
                            <div>
                              <Label className="text-gray-500">Primary:</Label>
                              <div className="text-xs mt-1 font-medium">{consultation.primary_concern}</div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recommendations Card */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-green-600 text-base">
                          <CheckCircle className="w-4 h-4" />
                          Actions ({consultation.recommended_actions?.length || 0})
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2">
                          {consultation.recommended_actions && consultation.recommended_actions.length > 0 ? (
                            <>
                              <ul className="space-y-1 text-xs">
                                {consultation.recommended_actions.slice(0, 3).map((action, index) => (
                                  <li key={index} className="flex items-start gap-1">
                                    <CheckCircle className="w-2.5 h-2.5 text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-xs leading-tight">{action}</span>
                                  </li>
                                ))}
                                {consultation.recommended_actions.length > 3 && (
                                  <li className="text-xs text-gray-500">+{consultation.recommended_actions.length - 3} more</li>
                                )}
                              </ul>
                            </>
                          ) : (
                            <p className="text-xs text-gray-500">No specific actions recommended</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Comprehensive Medical Analysis */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Primary Assessment */}
                    {(consultation.diagnosis_summary || consultation.primary_concern) && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            Primary Assessment
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {consultation.primary_concern && (
                            <div>
                              <Label className="text-sm font-medium text-blue-700">Primary Concern</Label>
                              <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mt-2">
                                <p className="text-sm font-medium">{consultation.primary_concern}</p>
                              </div>
                            </div>
                          )}
                          {consultation.diagnosis_summary && (
                            <div>
                              <Label className="text-sm font-medium text-blue-700">Diagnostic Summary</Label>
                              <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mt-2">
                                <p className="text-sm leading-relaxed">{consultation.diagnosis_summary}</p>
                              </div>
                            </div>
                          )}
                          {consultation.differential_diagnosis && consultation.differential_diagnosis.length > 0 && (
                            <div>
                              <Label className="text-sm font-medium text-blue-700">Differential Diagnosis</Label>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {consultation.differential_diagnosis.map((diagnosis, index) => (
                                  <Badge key={index} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                                    {diagnosis}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Medical Reasoning & AI Analysis */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-purple-600" />
                          AI Medical Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {consultation.medical_reasoning && (
                          <div>
                            <Label className="text-sm font-medium text-purple-700">Clinical Reasoning</Label>
                            <div className="bg-purple-50 p-3 rounded-md border border-purple-200 mt-2">
                              <p className="text-sm leading-relaxed">{consultation.medical_reasoning}</p>
                            </div>
                          </div>
                        )}
                        {consultation.knowledge_base_references && consultation.knowledge_base_references.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-purple-700">Knowledge Base References</Label>
                            <div className="mt-2 space-y-1">
                              {consultation.knowledge_base_references.map((ref, index) => (
                                <Badge key={index} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs block w-fit">
                                  {ref}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {consultation.clinical_guidelines_used && consultation.clinical_guidelines_used.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-purple-700">Clinical Guidelines</Label>
                            <div className="mt-2 space-y-1">
                              {consultation.clinical_guidelines_used.map((guideline, index) => (
                                <Badge key={index} variant="outline" className="bg-teal-50 text-teal-700 border-teal-200 text-xs block w-fit">
                                  {guideline}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Medical History & Context */}
                  {(consultation.relevant_medical_history?.length || consultation.current_medications_mentioned?.length || consultation.allergies_mentioned?.length || consultation.family_history_relevant?.length) && (
                    <Card className="border-amber-200 bg-amber-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-amber-800">
                          <Shield className="w-5 h-5" />
                          Medical History & Context (Collected by Dr. ARIA)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                        {consultation.relevant_medical_history && consultation.relevant_medical_history.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-amber-700">Medical History</Label>
                            <div className="space-y-1 mt-2">
                              {consultation.relevant_medical_history.map((history, index) => (
                                <Badge key={index} variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-xs block w-fit">
                                  {history}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {consultation.current_medications_mentioned && consultation.current_medications_mentioned.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-amber-700">Current Medications</Label>
                            <div className="space-y-1 mt-2">
                              {consultation.current_medications_mentioned.map((medication, index) => (
                                <Badge key={index} variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs block w-fit">
                                  <Pill className="w-3 h-3 mr-1" />
                                  {medication}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {consultation.allergies_mentioned && consultation.allergies_mentioned.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-amber-700">Mentioned Allergies</Label>
                            <div className="space-y-1 mt-2">
                              {consultation.allergies_mentioned.map((allergy, index) => (
                                <Badge key={index} variant="outline" className="bg-red-100 text-red-800 border-red-300 text-xs block w-fit">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  {allergy}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {consultation.family_history_relevant && consultation.family_history_relevant.length > 0 && (
                          <div>
                            <Label className="text-sm font-medium text-amber-700">Family History</Label>
                            <div className="space-y-1 mt-2">
                              {consultation.family_history_relevant.map((family, index) => (
                                <Badge key={index} variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-xs block w-fit">
                                  {family}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  {/* Recommendations & Tests */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {consultation.suggested_tests && consultation.suggested_tests.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-indigo-600">
                            <FileText className="w-5 h-5" />
                            Suggested Tests
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {consultation.suggested_tests.map((test, index) => (
                              <div key={index} className="flex items-center gap-2 bg-indigo-50 p-2 rounded-md">
                                <CheckCircle className="w-4 h-4 text-indigo-600" />
                                <span className="text-sm">{test}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {consultation.red_flags && consultation.red_flags.length > 0 && (
                      <Card className="border-red-200 bg-red-50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-red-700">
                            <AlertTriangle className="w-5 h-5" />
                            Red Flags
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {consultation.red_flags.map((flag, index) => (
                              <div key={index} className="flex items-start gap-2 bg-red-100 p-2 rounded-md">
                                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-red-800">{flag}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {consultation.when_to_seek_immediate_care && consultation.when_to_seek_immediate_care.length > 0 && (
                      <Card className="border-orange-200 bg-orange-50">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-orange-700">
                            <Shield className="w-5 h-5" />
                            Emergency Instructions
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {consultation.when_to_seek_immediate_care.map((instruction, index) => (
                              <div key={index} className="flex items-start gap-2 bg-orange-100 p-2 rounded-md">
                                <Phone className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-orange-800">{instruction}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Pre-appointment Instructions */}
                  {consultation.pre_appointment_instructions && consultation.pre_appointment_instructions.length > 0 && (
                    <Card className="border-green-200 bg-green-50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-green-700">
                          <CheckCircle className="w-5 h-5" />
                          Pre-Appointment Instructions for Patient
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {consultation.pre_appointment_instructions.map((instruction, index) => (
                            <div key={index} className="flex items-start gap-2 bg-green-100 p-3 rounded-md">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-green-800">{instruction}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Complete Conversation History */}
                  {consultation.messages && consultation.messages.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MessageSquare className="w-5 h-5 text-indigo-600" />
                          Complete Consultation Transcript ({consultation.messages.length} messages)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-96 overflow-y-auto space-y-4">
                          {consultation.messages.map((message, index) => (
                            <div key={index} className={`flex gap-3 ${message.role === 'assistant' ? 'bg-blue-50 p-3 rounded-md' : 'bg-gray-50 p-3 rounded-md'}`}>
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                message.role === 'assistant' 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-gray-600 text-white'
                              }`}>
                                {message.role === 'assistant' ? (
                                  <Bot className="w-4 h-4" />
                                ) : (
                                  <User className="w-4 h-4" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-sm">
                                    {message.role === 'assistant' ? 'Dr. ARIA' : 'Patient'}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {format(new Date(message.timestamp), 'MMM dd, HH:mm')}
                                  </span>
                                </div>
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Session Information */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <History className="w-4 h-4 text-gray-600" />
                          Session Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-xs">
                          {consultation.session_id && (
                            <div>
                              <Label className="text-gray-500">Session ID</Label>
                              <p className="font-mono text-xs bg-gray-100 p-1 rounded">{consultation.session_id}</p>
                            </div>
                          )}
                          {consultation.createdAt && (
                            <div>
                              <Label className="text-gray-500">Started</Label>
                              <p>{format(new Date(consultation.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                            </div>
                          )}
                          <div>
                            <Label className="text-gray-500">Duration</Label>
                            <p>{consultation.duration_minutes ? `${consultation.duration_minutes} minutes` : 'Not recorded'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Shield className="w-4 h-4 text-green-600" />
                          Clinical Flags
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-xs">
                          <div>
                            <Label className="text-gray-500">Follow-up Required</Label>
                            <Badge variant={consultation.follow_up_required ? "default" : "secondary"} className="text-xs">
                              {consultation.follow_up_required ? "YES" : "NO"}
                            </Badge>
                          </div>
                          <div>
                            <Label className="text-gray-500">Appointment Recommended</Label>
                            <Badge variant={consultation.appointment_recommended ? "default" : "secondary"} className="text-xs">
                              {consultation.appointment_recommended ? "YES" : "NO"}
                            </Badge>
                          </div>
                          {consultation.status && (
                            <div>
                              <Label className="text-gray-500">Status</Label>
                              <Badge variant="outline" className="text-xs">
                                {consultation.status.toUpperCase()}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-sm">
                          <Activity className="w-4 h-4 text-blue-600" />
                          Analysis Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-xs">
                          <div>
                            <Label className="text-gray-500">Messages Exchanged</Label>
                            <p className="font-medium">{consultation.messages?.length || 0}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Symptoms Identified</Label>
                            <p className="font-medium">{consultation.symptoms?.length || 0}</p>
                          </div>
                          <div>
                            <Label className="text-gray-500">Recommendations</Label>
                            <p className="font-medium">{consultation.recommended_actions?.length || 0}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Bot className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No Dr. ARIA consultation data available</h3>
                    <p className="text-gray-500">This appointment may have been booked manually or consultation data was not captured.</p>
                    <p className="text-sm text-gray-400 mt-2">Dr. ARIA collects comprehensive medical information including:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-xs">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Activity className="w-3 h-3" />
                        <span>Symptoms Analysis</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Heart className="w-3 h-3" />
                        <span>Vital Signs</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Pill className="w-3 h-3" />
                        <span>Medical History</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <FileText className="w-3 h-3" />
                        <span>AI Recommendations</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-600" />
                    Previous Appointments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {history && history.length > 0 ? (
                    <div className="space-y-4">
                      {history.map((apt) => (
                        <div key={apt.id} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium">{apt.type}</h3>
                                <Badge className={getStatusColor(apt.status)} variant="outline">
                                  {apt.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(new Date(apt.date), 'MMM dd, yyyy')}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {apt.time}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Stethoscope className="w-3 h-3" />
                                  {apt.doctor_name}
                                </div>
                              </div>
                              {apt.medical_notes && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-md">
                                  <Label className="text-xs font-medium text-gray-500">Medical Notes</Label>
                                  <p className="text-sm mt-1">{apt.medical_notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No previous appointments found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}