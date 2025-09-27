'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Clock, Stethoscope, Plus, Bot, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { format, isToday, isTomorrow } from 'date-fns';
import { useAuth } from '@/lib/auth/auth-context';
import MedicalRecordForm from '@/components/forms/MedicalRecordForm';

interface Appointment {
  id: string;
  date: Date | string;
  time: string;
  doctor?: string; // For backward compatibility
  doctor_name?: string; // New field from database
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  patient_id?: string;
  doctor_id?: string;
  consultation_id?: string;
  symptoms?: string[];
  urgency_level?: string;
  created_from_consultation?: boolean;
  patient?: {
    name: string;
    student_id: string;
    email?: string;
  };
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function Appointments() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [appointmentType, setAppointmentType] = useState('');
  const [notes, setNotes] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMedicalRecordFormOpen, setIsMedicalRecordFormOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [consultationData, setConsultationData] = useState<any>(null);
  const [isUpcomingCollapsed, setIsUpcomingCollapsed] = useState(false);
  const [isPastCollapsed, setIsPastCollapsed] = useState(false);

  // Fetch appointments from database
  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/appointments');
      if (response.ok) {
        const data = await response.json();
        setAppointments(data.appointments);
      } else {
        console.error('Failed to fetch appointments:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  // Listen for appointment booking events from Dr. ARIA
  useEffect(() => {
    const handleAppointmentBooked = () => {
      console.log('🔄 Appointment booked event received, refreshing appointments...');
      fetchAppointments();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('appointmentBooked', handleAppointmentBooked);
      return () => window.removeEventListener('appointmentBooked', handleAppointmentBooked);
    }
  }, []);

  // Redirect if not authenticated - only on client side
  useEffect(() => {
    if (!loading && !user) {
      router.push('/role-selection');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }


  // Mock available time slots
  const timeSlots: TimeSlot[] = [
    { time: '9:00 AM', available: true },
    { time: '9:30 AM', available: false },
    { time: '10:00 AM', available: true },
    { time: '10:30 AM', available: true },
    { time: '11:00 AM', available: false },
    { time: '11:30 AM', available: true },
    { time: '2:00 PM', available: true },
    { time: '2:30 PM', available: true },
    { time: '3:00 PM', available: false },
    { time: '3:30 PM', available: true },
    { time: '4:00 PM', available: true },
    { time: '4:30 PM', available: true }
  ];

  const checkConsultationRequired = () => {
    // Check if user has completed a consultation with Dr. ARIA
    const lastConsultation = localStorage.getItem(`consultation_${user?.id}`);
    
    if (!lastConsultation) {
      return false;
    }
    
    const consultation = JSON.parse(lastConsultation);
    const consultationDate = new Date(consultation.date);
    const daysSinceConsultation = Math.floor((new Date().getTime() - consultationDate.getTime()) / (1000 * 3600 * 24));
    
    // Consultation is valid for 30 days
    return daysSinceConsultation <= 30;
  };

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTime || !appointmentType) {
      alert('Please select date, time, and appointment type');
      return;
    }

    if (!checkConsultationRequired()) {
      alert('You must complete a consultation with Dr. ARIA before booking an appointment. Please visit the Health Bot first.');
      setIsBookingModalOpen(false);
      router.push('/chat-doctor');
      return;
    }

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate.toISOString(),
          time: selectedTime,
          type: appointmentType,
          doctor_name: 'Dr. Smith', // Default doctor for now
          notes: notes || undefined,
          urgency_level: 'medium'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Add new appointment to the list
        setAppointments(prev => [...prev, data.appointment]);
        alert(`Appointment booked successfully for ${format(selectedDate, 'PPP')} at ${selectedTime}`);
        setIsBookingModalOpen(false);
        setSelectedDate(undefined);
        setSelectedTime('');
        setAppointmentType('');
        setNotes('');
      } else {
        const errorData = await response.json();
        alert(`Failed to book appointment: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
      alert('Failed to book appointment. Please try again.');
    }
  };

  const getStatusColor = (status: string, isPast = false) => {
    // If it's a scheduled appointment that has passed, it's a missed appointment
    if (status === 'scheduled' && isPast) {
      return 'bg-amber-100 text-amber-800';
    }
    
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no-show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDisplayStatus = (appointment: Appointment) => {
    // If it's a scheduled appointment that has passed, show as "Missed"
    if (appointment.status === 'scheduled' && isAppointmentPast(appointment)) {
      return 'missed';
    }
    return appointment.status;
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM dd, yyyy');
  };

  // Helper function to check if appointment date has passed
  const isAppointmentPast = (appointment: Appointment) => {
    const appointmentDate = new Date(appointment.date);
    const now = new Date();
    
    // If the appointment date is before today, it's definitely past
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const aptDateStart = new Date(appointmentDate);
    aptDateStart.setHours(0, 0, 0, 0);
    
    if (aptDateStart < todayStart) {
      return true; // Past date
    }
    
    if (aptDateStart > todayStart) {
      return false; // Future date
    }
    
    // Same date - check if the time has passed
    if (appointment.time) {
      try {
        // Parse the time string (e.g., "8:00 AM", "12:30 PM")
        const timeMatch = appointment.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const period = timeMatch[3].toUpperCase();
          
          // Convert to 24-hour format
          if (period === 'AM' && hours === 12) {
            hours = 0;
          } else if (period === 'PM' && hours !== 12) {
            hours += 12;
          }
          
          // Create appointment datetime
          const appointmentDateTime = new Date(appointmentDate);
          appointmentDateTime.setHours(hours, minutes, 0, 0);
          
          // Return true if appointment time has passed
          return appointmentDateTime < now;
        }
      } catch (error) {
        console.warn('Error parsing appointment time:', appointment.time, error);
      }
    }
    
    // Fallback: if we can't parse time, only consider date
    return aptDateStart < todayStart;
  };

  // Upcoming appointments: scheduled status AND date is today or future
  const upcomingAppointments = appointments.filter(apt => 
    apt.status === 'scheduled' && !isAppointmentPast(apt)
  );
  
  // Past appointments: completed, cancelled, no-show, OR scheduled but date has passed
  const pastAppointments = appointments.filter(apt => 
    apt.status === 'completed' || 
    apt.status === 'cancelled' || 
    apt.status === 'no-show' ||
    (apt.status === 'scheduled' && isAppointmentPast(apt))
  );
  
  // Calculate appointments this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const thisMonthAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return aptDate.getMonth() === currentMonth && aptDate.getFullYear() === currentYear;
  });
  
  const hasValidConsultation = checkConsultationRequired();

  // Handle medical record creation
  const handleCreateMedicalRecord = async (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    
    // Fetch consultation data if available
    if (appointment.consultation_id) {
      try {
        const response = await fetch(`/api/consultations/debug/${appointment.consultation_id}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setConsultationData({
            symptoms: data.consultation?.symptoms || [],
            primary_concern: data.consultation?.primary_concern || '',
            diagnosis_summary: data.consultation?.diagnosis_summary || ''
          });
        }
      } catch (error) {
        console.error('Error fetching consultation data:', error);
      }
    }
    
    setIsMedicalRecordFormOpen(true);
  };

  const handleMedicalRecordSubmit = async (recordData: any) => {
    try {
      const response = await fetch('/api/medical-records', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          appointment_id: selectedAppointment?.id,
          ...recordData
        })
      });

      if (response.ok) {
        alert('Medical record created successfully!');
        setIsMedicalRecordFormOpen(false);
        setSelectedAppointment(null);
        setConsultationData(null);
        // Refresh appointments to reflect updated status
        fetchAppointments();
      } else {
        const errorData = await response.json();
        alert(`Failed to create medical record: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error creating medical record:', error);
      alert('Failed to create medical record. Please try again.');
    }
  };

  const checkMedicalRecordExists = async (appointmentId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/medical-records?appointment_id=${appointmentId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.records && data.records.length > 0;
      }
    } catch (error) {
      console.error('Error checking medical record:', error);
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Navbar />
      
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {user?.role === 'doctor' ? 'Patient Appointments' : 'Appointments'}
              </h1>
              <p className="text-muted-foreground">
                {user?.role === 'doctor' 
                  ? 'View and manage patient appointments and medical records'
                  : 'Manage your healthcare appointments'
                }
              </p>
            </div>
            {user?.role === 'student' && (
              <Button 
                onClick={() => setIsBookingModalOpen(true)}
                className="flex items-center gap-2"
                disabled={!hasValidConsultation}
              >
                <Plus className="w-4 h-4" />
                Book Appointment
              </Button>
            )}
          </div>

          {/* Consultation Requirement Notice - Only for Students */}
          {user?.role === 'student' && !hasValidConsultation && (
            <div className="mb-8">
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-amber-800 mb-2">
                        Consultation Required
                      </h3>
                      <p className="text-amber-700 mb-4">
                        Before booking an appointment with a doctor, you must first complete a consultation with Dr. ARIA, 
                        our AI health assistant. This helps us understand your symptoms and schedule the most appropriate care.
                      </p>
                      <Link href="/chat-doctor">
                        <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                          <Bot className="w-4 h-4 mr-2" />
                          Start Consultation with Dr. ARIA
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                    <p className="text-3xl font-bold text-foreground">{upcomingAppointments.length}</p>
                  </div>
                  <CalendarIcon className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">This Month</p>
                    <p className="text-3xl font-bold text-foreground">{thisMonthAppointments.length}</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="text-3xl font-bold text-foreground">{pastAppointments.length}</p>
                  </div>
                  <Stethoscope className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Appointments */}
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsUpcomingCollapsed(!isUpcomingCollapsed)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    <CardTitle>Upcoming Appointments</CardTitle>
                    <Badge variant="secondary" className="ml-2">
                      {upcomingAppointments.length}
                    </Badge>
                  </div>
                  {isUpcomingCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <CardDescription>
                  Your scheduled healthcare appointments
                </CardDescription>
              </CardHeader>
              {!isUpcomingCollapsed && (
                <CardContent>
                  <div className={`space-y-4 ${upcomingAppointments.length > 3 ? 'max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100' : ''}`}>
                    {isLoading ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Loading appointments...</p>
                      </div>
                    ) : upcomingAppointments.length > 0 ? (
                      upcomingAppointments.map((appointment) => (
                      <div 
                        key={appointment.id} 
                        className={`border rounded-lg p-4 ${
                          user?.role === 'doctor' 
                            ? 'cursor-pointer hover:shadow-md hover:border-primary/50 transition-all duration-200' 
                            : ''
                        }`}
                        onClick={() => {
                          if (user?.role === 'doctor') {
                            router.push(`/appointments/${appointment.id}`);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium">{appointment.type}</h3>
                            {user?.role === 'doctor' ? (
                              <div className="text-sm text-muted-foreground">
                                <p>Patient: {appointment.patient?.name || 'Unknown'}</p>
                                <p>ID: {appointment.patient?.student_id || appointment.patient_id}</p>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">{appointment.doctor_name || appointment.doctor}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={getStatusColor(appointment.status, isAppointmentPast(appointment))}>
                              {getDisplayStatus(appointment)}
                            </Badge>
                            {appointment.urgency_level && (
                              <Badge 
                                variant="outline" 
                                className={
                                  appointment.urgency_level === 'high' || appointment.urgency_level === 'emergency'
                                    ? 'bg-red-100 text-red-800 border-red-200'
                                    : appointment.urgency_level === 'medium'
                                    ? 'bg-orange-100 text-orange-800 border-orange-200'
                                    : 'bg-green-100 text-green-800 border-green-200'
                                }
                              >
                                {appointment.urgency_level.toUpperCase()}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            {getDateLabel(new Date(appointment.date))}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {appointment.time}
                          </div>
                        </div>
                        
                        {/* Show symptoms for doctors */}
                        {user?.role === 'doctor' && appointment.symptoms && appointment.symptoms.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-muted-foreground mb-1">Reported Symptoms:</p>
                            <div className="flex flex-wrap gap-1">
                              {appointment.symptoms.slice(0, 3).map((symptom, index) => (
                                <span key={index} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                  {symptom}
                                </span>
                              ))}
                              {appointment.symptoms.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{appointment.symptoms.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {appointment.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            {appointment.notes}
                          </p>
                        )}
                        
                        {user?.role === 'doctor' && (
                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center text-xs text-primary">
                            <Stethoscope className="w-3 h-3 mr-1" />
                            Click to view detailed patient information
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No upcoming appointments</p>
                      <Button 
                        onClick={() => setIsBookingModalOpen(true)}
                        className="mt-4"
                        variant="outline"
                        disabled={!hasValidConsultation}
                      >
                        Book your first appointment
                      </Button>
                    </div>
                  )}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Past Appointments */}
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setIsPastCollapsed(!isPastCollapsed)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <CardTitle>Past Appointments</CardTitle>
                    <Badge variant="secondary" className="ml-2">
                      {pastAppointments.length}
                    </Badge>
                  </div>
                  {isPastCollapsed ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
                <CardDescription>
                  Your completed appointment history
                </CardDescription>
              </CardHeader>
              {!isPastCollapsed && (
                <CardContent>
                  <div className={`space-y-4 ${pastAppointments.length > 3 ? 'max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100' : ''}`}>
                    {isLoading ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">Loading appointments...</p>
                      </div>
                    ) : pastAppointments.length > 0 ? (
                      pastAppointments.map((appointment) => (
                      <div 
                        key={appointment.id} 
                        className={`border rounded-lg p-4 ${
                          user?.role === 'doctor' 
                            ? 'cursor-pointer hover:shadow-md hover:border-primary/50 transition-all duration-200' 
                            : ''
                        }`}
                        onClick={() => {
                          if (user?.role === 'doctor') {
                            router.push(`/appointments/${appointment.id}`);
                          }
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium">{appointment.type}</h3>
                            {user?.role === 'doctor' ? (
                              <div className="text-sm text-muted-foreground">
                                <p>Patient: {appointment.patient?.name || 'Unknown'}</p>
                                <p>ID: {appointment.patient?.student_id || appointment.patient_id}</p>
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground">{appointment.doctor_name || appointment.doctor}</p>
                            )}
                          </div>
                          <Badge className={getStatusColor(appointment.status, isAppointmentPast(appointment))}>
                            {getDisplayStatus(appointment)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            {format(new Date(appointment.date), 'MMM dd, yyyy')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {appointment.time}
                          </div>
                        </div>
                        {appointment.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            {appointment.notes}
                          </p>
                        )}
                        
                        {user?.role === 'doctor' && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-xs text-primary">
                                <Stethoscope className="w-3 h-3 mr-1" />
                                Click to view patient records
                              </div>
                              {appointment.status === 'completed' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCreateMedicalRecord(appointment);
                                  }}
                                  className="flex items-center gap-1"
                                >
                                  <FileText className="w-3 h-3" />
                                  Create Medical Record
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No past appointments</p>
                    </div>
                  )}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </main>

      {/* Book Appointment Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Book New Appointment</DialogTitle>
            <DialogDescription>
              Select a date and time for your appointment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Calendar */}
            <div>
              <Label className="text-sm font-medium">Select Date</Label>
              <div className="mt-2">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <Label className="text-sm font-medium">Available Times</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={selectedTime === slot.time ? "default" : "outline"}
                      size="sm"
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className="text-xs"
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Appointment Type */}
            <div>
              <Label htmlFor="appointmentType">Appointment Type</Label>
              <Input
                id="appointmentType"
                placeholder="e.g., General Consultation, Health Check-up"
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                placeholder="Any specific concerns or symptoms..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full mt-1 p-2 border border-input rounded-md bg-background"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsBookingModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBookAppointment}
              disabled={!selectedDate || !selectedTime || !appointmentType}
            >
              Book Appointment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Medical Record Form */}
      {selectedAppointment && (
        <MedicalRecordForm
          isOpen={isMedicalRecordFormOpen}
          onClose={() => {
            setIsMedicalRecordFormOpen(false);
            setSelectedAppointment(null);
            setConsultationData(null);
          }}
          appointmentId={selectedAppointment.id}
          patientInfo={{
            name: selectedAppointment.patient?.name || 'Unknown Patient',
            student_id: selectedAppointment.patient?.student_id || selectedAppointment.patient_id || 'Unknown',
            visit_date: format(new Date(selectedAppointment.date), 'PPP')
          }}
          consultationData={consultationData}
          onSubmit={handleMedicalRecordSubmit}
        />
      )}
    </div>
  );
}