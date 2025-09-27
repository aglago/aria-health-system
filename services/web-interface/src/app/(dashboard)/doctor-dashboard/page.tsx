'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Eye, MessageCircle, AlertTriangle, Calendar, Clock, User, FileText, Pill, ArrowRight, Phone, Mail, Stethoscope, TrendingUp, Activity, Users, Plus, MoreHorizontal, Star, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/lib/auth/auth-context';

interface FlaggedCase {
  id: string;
  studentId: string;
  studentName: string;
  symptomSummary: string;
  dateFlagged: Date;
  severity: 'low' | 'medium' | 'high';
}

interface ActiveCase {
  id: string;
  studentId: string;
  studentName: string;
  diagnosis: string;
  lastVisit: Date;
  nextAppointment?: Date;
  status: 'monitoring' | 'treatment' | 'follow-up' | 'critical';
  priority: 'low' | 'medium' | 'high';
}

interface Appointment {
  id: string;
  date: Date | string;
  time: string;
  patient_id: string;
  doctor_name: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  urgency_level?: 'low' | 'medium' | 'high' | 'emergency';
  patient?: {
    name: string;
    student_id: string;
    email?: string;
  };
}

export default function DoctorDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<FlaggedCase | null>(null);
  const [contactMessage, setContactMessage] = useState('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [flaggedCases, setFlaggedCases] = useState<FlaggedCase[]>([]);
  const [activeCases, setActiveCases] = useState<ActiveCase[]>([]);
  const [overviewStats, setOverviewStats] = useState({
    totalPatients: 0,
    totalConsultations: 0,
    totalMedicalRecords: 0,
    totalAppointments: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Redirect if not authenticated or not a doctor
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/role-selection');
      } else if (user.role !== 'doctor') {
        router.push('/role-selection');
      }
    }
  }, [user, loading, router]);

  // Fetch appointments and consultation data
  useEffect(() => {
    const fetchData = async () => {
      if (!user || user.role !== 'doctor') return;

      try {
        // Fetch all data in parallel
        const [
          appointmentsResponse,
          allConsultationsResponse,
          medicalRecordsResponse,
          patientFilesResponse,
          consultationsResponse
        ] = await Promise.all([
          fetch('/api/appointments?limit=100', { credentials: 'include' }),
          fetch('/api/consultations?limit=500', { credentials: 'include' }),
          fetch('/api/medical-records?limit=500', { credentials: 'include' }),
          fetch('/api/patient-files?limit=100', { credentials: 'include' }),
          fetch('/api/consultations/flagged', { credentials: 'include' })
        ]);

        // Process appointments
        let appointmentsData = null;
        if (appointmentsResponse.ok) {
          appointmentsData = await appointmentsResponse.json();
          setAppointments(appointmentsData.appointments || []);
        }

        // Process flagged consultations
        if (consultationsResponse.ok) {
          const consultationsData = await consultationsResponse.json();
          setFlaggedCases(consultationsData.flaggedCases || []);
        }

        // We'll process medical records data once and use it for both active cases and stats
        let medicalRecordsData = null;

        // Calculate overview statistics with debugging
        let totalConsultations = 0;
        let totalMedicalRecords = 0;
        let totalPatients = 0;
        
        console.log('🔍 Dashboard API Responses:', {
          appointmentsOk: appointmentsResponse.ok,
          appointmentsStatus: appointmentsResponse.status,
          consultationsOk: allConsultationsResponse.ok,
          consultationsStatus: allConsultationsResponse.status,
          medicalRecordsOk: medicalRecordsResponse.ok,
          medicalRecordsStatus: medicalRecordsResponse.status,
          patientFilesOk: patientFilesResponse.ok,
          patientFilesStatus: patientFilesResponse.status
        });
        
        // Consultations processing with better error handling
        if (allConsultationsResponse.ok) {
          try {
            const consultationsData = await allConsultationsResponse.json();
            console.log('📞 Raw consultations response:', consultationsData);
            
            // Handle different possible response structures
            if (consultationsData.consultations && Array.isArray(consultationsData.consultations)) {
              totalConsultations = consultationsData.consultations.length;
            } else if (Array.isArray(consultationsData)) {
              totalConsultations = consultationsData.length;
            } else {
              console.warn('⚠️ Unexpected consultations data structure:', consultationsData);
              totalConsultations = 0;
            }
            
            console.log('📞 Processed consultations count:', totalConsultations);
          } catch (error) {
            console.error('❌ Error parsing consultations JSON:', error);
            totalConsultations = 0;
          }
        } else {
          const errorText = await allConsultationsResponse.text().catch(() => 'Failed to read error');
          console.log('❌ Consultations API failed:', allConsultationsResponse.status, allConsultationsResponse.statusText, errorText);
        }
        
        // Medical records processing - read JSON once and use for both stats and active cases
        if (medicalRecordsResponse.ok) {
          try {
            medicalRecordsData = await medicalRecordsResponse.json();
            console.log('📋 Raw medical records response:', medicalRecordsData);
            
            if (medicalRecordsData.records && Array.isArray(medicalRecordsData.records)) {
              totalMedicalRecords = medicalRecordsData.records.length;
            } else if (Array.isArray(medicalRecordsData)) {
              totalMedicalRecords = medicalRecordsData.length;
            } else {
              console.warn('⚠️ Unexpected medical records data structure:', medicalRecordsData);
              totalMedicalRecords = 0;
            }
            
            console.log('📋 Processed medical records count:', totalMedicalRecords);
          } catch (error) {
            console.error('❌ Error parsing medical records JSON:', error);
            totalMedicalRecords = 0;
          }
        } else {
          const errorText = await medicalRecordsResponse.text().catch(() => 'Failed to read error');
          console.log('❌ Medical records API failed:', medicalRecordsResponse.status, medicalRecordsResponse.statusText, errorText);
        }
        
        // Patient files processing with better error handling
        if (patientFilesResponse.ok) {
          try {
            const patientsData = await patientFilesResponse.json();
            console.log('👥 Raw patient files response:', patientsData);
            
            if (patientsData.patientFiles && Array.isArray(patientsData.patientFiles)) {
              totalPatients = patientsData.patientFiles.length;
            } else if (Array.isArray(patientsData)) {
              totalPatients = patientsData.length;
            } else {
              console.warn('⚠️ Unexpected patient files data structure:', patientsData);
              totalPatients = 0;
            }
            
            console.log('👥 Processed patient files count:', totalPatients);
          } catch (error) {
            console.error('❌ Error parsing patient files JSON:', error);
            totalPatients = 0;
          }
        } else {
          const errorText = await patientFilesResponse.text().catch(() => 'Failed to read error');
          console.log('❌ Patient files API failed:', patientFilesResponse.status, patientFilesResponse.statusText, errorText);
        }

        // Process appointments count with better logging
        let appointmentsCount = 0;
        if (appointmentsData) {
          if (appointmentsData.appointments && Array.isArray(appointmentsData.appointments)) {
            appointmentsCount = appointmentsData.appointments.length;
          } else if (Array.isArray(appointmentsData)) {
            appointmentsCount = appointmentsData.length;
          } else {
            console.warn('⚠️ Unexpected appointments data structure:', appointmentsData);
          }
        }
        
        console.log('📅 Processed appointments count:', appointmentsCount);

        // Set overview stats
        const finalStats = {
          totalPatients,
          totalConsultations, 
          totalMedicalRecords,
          totalAppointments: appointmentsCount
        };
        
        console.log('📊 Final dashboard stats:', finalStats);
        setOverviewStats(finalStats);

        // Process active cases from medical records data (if available)
        if (medicalRecordsData) {
          const records = medicalRecordsData.records || (Array.isArray(medicalRecordsData) ? medicalRecordsData : []);
          
          // Create active cases from recent medical records that need follow-up
          const activePatientCases: ActiveCase[] = records
            .filter((record: any) => 
              record.follow_up_required || 
              record.status === 'active' || 
              record.urgency_level === 'high' ||
              record.urgency_level === 'medium'
            )
            .slice(0, 6) // Show max 6 active cases
            .map((record: any) => ({
              id: record._id || record.id,
              studentId: record.patient_id,
              studentName: record.patient?.name || 'Unknown Patient',
              diagnosis: record.final_diagnosis || record.chief_complaint || 'Ongoing care',
              lastVisit: new Date(record.record_date || record.visit_date),
              nextAppointment: record.next_appointment_date ? new Date(record.next_appointment_date) : undefined,
              status: record.follow_up_required ? 'follow-up' : 
                     record.urgency_level === 'high' ? 'critical' :
                     record.status === 'active' ? 'monitoring' : 'treatment',
              priority: record.urgency_level === 'high' || record.urgency_level === 'emergency' ? 'high' :
                       record.urgency_level === 'medium' ? 'medium' : 'low'
            }));
          
          console.log('🏥 Active cases processed:', activePatientCases.length);
          setActiveCases(activePatientCases);
        }

      } catch (error) {
        console.error('Error fetching doctor dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (!user) {
    return null;
  }

  const handleContactStudent = (student: FlaggedCase) => {
    setSelectedStudent(student);
    setIsContactModalOpen(true);
  };

  const handleSendMessage = () => {
    if (selectedStudent && contactMessage.trim()) {
      alert(`Message sent to ${selectedStudent.studentName}: ${contactMessage}`);
      setContactMessage('');
      setIsContactModalOpen(false);
      setSelectedStudent(null);
    }
  };

  const handleAppointmentClick = async (appointment: Appointment) => {
    // Navigate to the dedicated appointment details page
    router.push(`/appointments/${appointment.id}`);
  };


  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Modern Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                      Welcome back, Dr. {user.name.split(' ').pop()}
                    </h1>
                    <p className="text-gray-600 flex items-center gap-2">
                      <Stethoscope className="w-4 h-4" />
                      {user.specialization || 'General Practitioner'} • ID: {user.doctor_id}
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Schedule
                </Button>
                <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700">
                  <Plus className="w-4 h-4" />
                  New Patient
                </Button>
              </div>
            </div>
            <div className="mt-4 py-4 bg-white/70 border-b border-white/50">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Today:</span> {format(new Date(), 'EEEE, MMMM do, yyyy')} • 
                <span className="ml-2 text-green-600 font-medium">System Status: All services operational</span>
              </p>
            </div>
          </div>

          {/* Modern Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 hover:shadow-lg transition-all duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <p className="text-sm font-medium text-blue-700">Total Patients</p>
                    </div>
                    <p className="text-3xl font-bold text-blue-900">
                      {isLoading ? '...' : overviewStats.totalPatients}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-xs text-green-600 font-medium">+12% this month</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200/50 hover:shadow-lg transition-all duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <p className="text-sm font-medium text-emerald-700">AI Consultations</p>
                    </div>
                    <p className="text-3xl font-bold text-emerald-900">
                      {isLoading ? '...' : overviewStats.totalConsultations}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <Activity className="w-3 h-3 text-emerald-500" />
                      <span className="text-xs text-emerald-600 font-medium">24/7 available</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 hover:shadow-lg transition-all duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <p className="text-sm font-medium text-purple-700">Medical Records</p>
                    </div>
                    <p className="text-3xl font-bold text-purple-900">
                      {isLoading ? '...' : overviewStats.totalMedicalRecords}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs text-purple-600 font-medium">Digitally secured</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center">
                    <FileText className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50 hover:shadow-lg transition-all duration-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <p className="text-sm font-medium text-orange-700">Appointments</p>
                    </div>
                    <p className="text-3xl font-bold text-orange-900">
                      {isLoading ? '...' : overviewStats.totalAppointments}
                    </p>
                    <div className="flex items-center gap-1 mt-2">
                      <MapPin className="w-3 h-3 text-orange-500" />
                      <span className="text-xs text-orange-600 font-medium">UMaT Health Center</span>
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-orange-500/10 rounded-full flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Flagged Cases Overview - Only show if there are flagged cases */}
          {flaggedCases.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="border-red-200 bg-red-50/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">High Priority Cases</p>
                      <p className="text-2xl font-bold text-red-600">
                        {flaggedCases.filter(c => c.severity === 'high').length}
                      </p>
                    </div>
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-orange-200 bg-orange-50/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Medium Priority Cases</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {flaggedCases.filter(c => c.severity === 'medium').length}
                      </p>
                    </div>
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-yellow-200 bg-yellow-50/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Low Priority Cases</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        {flaggedCases.filter(c => c.severity === 'low').length}
                      </p>
                    </div>
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Upcoming Appointments */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-bold">
                  {(() => {
                    const todayAppointments = appointments.filter(apt => {
                      const aptDate = new Date(apt.date);
                      const today = new Date();
                      return aptDate.toDateString() === today.toDateString() && apt.status === 'scheduled';
                    });
                    
                    if (todayAppointments.length > 0) {
                      return "Today's Appointments";
                    }
                    
                    const upcomingAppointments = appointments.filter(apt => {
                      const aptDate = new Date(apt.date);
                      const today = new Date();
                      return aptDate > today && apt.status === 'scheduled';
                    });
                    
                    return upcomingAppointments.length > 0 ? "Upcoming Appointments" : "Appointments";
                  })()}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {appointments.filter(apt => apt.status === 'scheduled').length} scheduled
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Loading appointments...</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(() => {
                    // First, try to show today's appointments
                    const todayAppointments = appointments.filter(apt => {
                      const aptDate = new Date(apt.date);
                      const today = new Date();
                      return aptDate.toDateString() === today.toDateString() && apt.status === 'scheduled';
                    });
                    
                    // If no appointments today, show next 3 upcoming appointments
                    const appointmentsToShow = todayAppointments.length > 0 
                      ? todayAppointments
                      : appointments
                          .filter(apt => {
                            const aptDate = new Date(apt.date);
                            const today = new Date();
                            return aptDate > today && apt.status === 'scheduled';
                          })
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .slice(0, 3);
                    
                    return appointmentsToShow.map((appointment) => (
                      <Card 
                        key={appointment.id} 
                        className={`border-l-4 cursor-pointer hover:shadow-md transition-shadow duration-200 ${
                        appointment.urgency_level === 'high' || appointment.urgency_level === 'emergency'
                          ? 'border-l-red-500'
                          : appointment.urgency_level === 'medium'
                          ? 'border-l-orange-500'
                          : 'border-l-blue-500'
                      }`}
                        onClick={() => handleAppointmentClick(appointment)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-bold text-blue-600">{appointment.time}</span>
                            <div className="text-right">
                              <span className="text-xs text-muted-foreground block">Health Center</span>
                              {(() => {
                                const aptDate = new Date(appointment.date);
                                const today = new Date();
                                const isToday = aptDate.toDateString() === today.toDateString();
                                const isTomorrow = aptDate.toDateString() === new Date(today.getTime() + 24 * 60 * 60 * 1000).toDateString();
                                
                                if (isToday) return <span className="text-xs font-medium text-green-600">Today</span>;
                                if (isTomorrow) return <span className="text-xs font-medium text-blue-600">Tomorrow</span>;
                                return <span className="text-xs text-muted-foreground">{format(aptDate, 'MMM dd')}</span>;
                              })()}
                            </div>
                          </div>
                          <h3 className="font-medium text-sm mb-1">
                            {appointment.patient?.name || 'Unknown'} ({appointment.patient?.student_id || appointment.patient_id})
                          </h3>
                          <p className="text-xs text-muted-foreground">{appointment.type}</p>
                          {appointment.urgency_level && (
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-2 ${
                              appointment.urgency_level === 'high' || appointment.urgency_level === 'emergency'
                                ? 'bg-red-100 text-red-800'
                                : appointment.urgency_level === 'medium'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {appointment.urgency_level.toUpperCase()}
                            </span>
                          )}
                        </CardContent>
                      </Card>
                    ));
                  })()}
                  
                  {/* Empty State */}
                  {(() => {
                    const todayAppointments = appointments.filter(apt => {
                      const aptDate = new Date(apt.date);
                      const today = new Date();
                      return aptDate.toDateString() === today.toDateString() && apt.status === 'scheduled';
                    });
                    
                    const upcomingAppointments = appointments.filter(apt => {
                      const aptDate = new Date(apt.date);
                      const today = new Date();
                      return aptDate > today && apt.status === 'scheduled';
                    });
                    
                    if (todayAppointments.length === 0 && upcomingAppointments.length === 0 && !isLoading) {
                      return (
                        <div className="col-span-full text-center py-8">
                          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground font-medium mb-2">No appointments scheduled</p>
                          <p className="text-sm text-muted-foreground">Your schedule is currently clear</p>
                        </div>
                      );
                    }
                    
                    return null;
                  })()}
                </div>
              )}
              
              {/* Smart Actions */}
              <div className="mt-6 flex gap-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/appointments')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  View Full Schedule
                </Button>
                {(() => {
                  const todayAppointments = appointments.filter(apt => {
                    const aptDate = new Date(apt.date);
                    const today = new Date();
                    return aptDate.toDateString() === today.toDateString() && apt.status === 'scheduled';
                  });
                  
                  const upcomingAppointments = appointments.filter(apt => {
                    const aptDate = new Date(apt.date);
                    const today = new Date();
                    return aptDate > today && apt.status === 'scheduled';
                  });
                  
                  if (todayAppointments.length === 0 && upcomingAppointments.length > 0) {
                    return (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => router.push('/appointments')}
                        className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        View {upcomingAppointments.length} Upcoming
                      </Button>
                    );
                  }
                  
                  return (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => router.push('/appointments?action=reschedule')}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Reschedule Appointment
                    </Button>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Active Cases - Only show when there are active cases */}
          {activeCases.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Active Cases</CardTitle>
                <CardDescription>
                  {activeCases.length} patient{activeCases.length !== 1 ? 's' : ''} under ongoing care or requiring follow-up
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeCases.map((activeCase) => (
                    <Card 
                      key={activeCase.id} 
                      className={`cursor-pointer hover:shadow-md transition-shadow duration-200 border-l-4 ${
                        activeCase.priority === 'high' ? 'border-l-red-500 bg-red-50/30' :
                        activeCase.priority === 'medium' ? 'border-l-orange-500 bg-orange-50/30' :
                        'border-l-blue-500 bg-blue-50/30'
                      }`}
                      onClick={() => router.push(`/doctor/patient/${activeCase.studentId}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-base mb-1">{activeCase.studentName}</h3>
                            <p className="text-sm text-muted-foreground">ID: {activeCase.studentId}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge 
                              variant="outline" 
                              className={
                                activeCase.priority === 'high' ? 'bg-red-100 text-red-800 border-red-200' :
                                activeCase.priority === 'medium' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                'bg-blue-100 text-blue-800 border-blue-200'
                              }
                            >
                              {activeCase.priority.toUpperCase()}
                            </Badge>
                            <Badge 
                              variant="secondary" 
                              className={
                                activeCase.status === 'critical' ? 'bg-red-100 text-red-700' :
                                activeCase.status === 'follow-up' ? 'bg-yellow-100 text-yellow-700' :
                                activeCase.status === 'monitoring' ? 'bg-blue-100 text-blue-700' :
                                'bg-green-100 text-green-700'
                              }
                            >
                              {activeCase.status.replace('-', ' ').toUpperCase()}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div>
                            <p className="text-xs text-muted-foreground font-medium">Current Diagnosis</p>
                            <p className="text-sm font-medium line-clamp-2" title={activeCase.diagnosis}>
                              {activeCase.diagnosis}
                            </p>
                          </div>

                          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Last visit: {format(activeCase.lastVisit, 'MMM dd, yyyy')}
                            </div>
                            {activeCase.nextAppointment && (
                              <div className="flex items-center gap-1 text-blue-600">
                                <Calendar className="w-3 h-3" />
                                Next: {format(activeCase.nextAppointment, 'MMM dd')}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex items-center text-xs text-primary">
                            <Stethoscope className="w-3 h-3 mr-1" />
                            Click to view patient details
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Quick Action */}
                <div className="mt-6">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push('/doctor/patients')}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    View All Patients
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Flagged Cases Table - Only show when there are flagged cases */}
          {flaggedCases.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold">Flagged Cases</CardTitle>
                <CardDescription>
                  {flaggedCases.length} case{flaggedCases.length !== 1 ? 's' : ''} requiring medical attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <div className="min-w-full">
                    <div className="grid grid-cols-5 gap-4 font-medium text-sm text-muted-foreground border-b pb-2 mb-4">
                      <div>Student Name</div>
                      <div>Symptom Summary</div>
                      <div>Date Flagged</div>
                      <div>Severity</div>
                      <div>Actions</div>
                    </div>
                    {flaggedCases.map((case_) => (
                      <div key={case_.id} className="grid grid-cols-5 gap-4 py-3 border-b border-border items-center">
                        <div className="font-medium">{case_.studentName}</div>
                        <div className="max-w-xs">
                          <div className="truncate text-sm" title={case_.symptomSummary}>
                            {case_.symptomSummary}
                          </div>
                        </div>
                        <div className="text-sm">{format(case_.dateFlagged, 'MMM dd, yyyy')}</div>
                        <div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getSeverityColor(case_.severity)}`}>
                            {case_.severity}
                          </span>
                        </div>
                        <div>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => router.push(`/doctor/patient/${case_.studentId}`)}
                              className="flex items-center gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              View History
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleContactStudent(case_)}
                              className="flex items-center gap-1"
                            >
                              <MessageCircle className="h-4 w-4" />
                              Contact
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Contact Student Modal */}
      <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Student</DialogTitle>
            <DialogDescription>
              Send a message to {selectedStudent?.studentName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="message">Message</Label>
              <textarea 
                id="message"
                placeholder="Type your message here..."
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={4}
                className="w-full mt-1 p-2 border border-input rounded-md bg-background"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsContactModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendMessage}
              disabled={!contactMessage.trim()}
            >
              Send Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}