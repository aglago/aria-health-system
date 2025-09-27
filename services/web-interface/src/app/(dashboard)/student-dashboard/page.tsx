'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, MessageCircle, Calendar as CalendarIcon, BarChart3, Clock, AlertTriangle, Activity, CheckCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { format } from 'date-fns';

export default function StudentDashboard() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [studentStats, setStudentStats] = useState({
    totalAppointments: 0,
    upcomingAppointments: 0,
    totalConsultations: 0,
    medicalRecords: 0,
    lastConsultation: null as Date | null,
    nextAppointment: null as Date | null
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch student data from database - moved before conditional returns
  useEffect(() => {
    const fetchStudentData = async () => {
      if (!user || user.role !== 'student') return;
      
      try {
        console.log('🎓 Fetching student data for:', user.student_id);
        
        // Fetch student's appointments, consultations, and medical records
        const [appointmentsRes, consultationsRes, medicalRecordsRes] = await Promise.all([
          fetch('/api/appointments', { credentials: 'include' }),
          fetch('/api/consultations', { credentials: 'include' }),
          fetch('/api/medical-records', { credentials: 'include' })
        ]);

        let totalAppointments = 0;
        let upcomingAppointments = 0;
        let nextAppointment = null;
        let recentAppointments = [];

        // Process appointments
        if (appointmentsRes.ok) {
          const appointmentsData = await appointmentsRes.json();
          const appointments = appointmentsData.appointments || [];
          totalAppointments = appointments.length;
          
          const now = new Date();
          const upcoming = appointments.filter((apt: any) => new Date(apt.date) > now);
          upcomingAppointments = upcoming.length;
          
          if (upcoming.length > 0) {
            nextAppointment = new Date(upcoming[0].date);
          }
          
          recentAppointments = appointments.slice(0, 3);
        }

        let totalConsultations = 0;
        let lastConsultation = null;
        let recentConsultations = [];

        // Process consultations with better debugging
        if (consultationsRes.ok) {
          const consultationsData = await consultationsRes.json();
          console.log('🎓 Raw consultations response:', consultationsData);
          
          const consultations = consultationsData.consultations || consultationsData || [];
          totalConsultations = Array.isArray(consultations) ? consultations.length : 0;
          
          console.log('🎓 Processed consultations:', {
            totalFound: totalConsultations,
            firstConsultation: consultations[0] || 'none',
            structure: Array.isArray(consultations) ? 'array' : typeof consultations
          });
          
          if (consultations.length > 0) {
            lastConsultation = new Date(consultations[0].createdAt || consultations[0].created_at || consultations[0].timestamp);
            recentConsultations = consultations.slice(0, 2);
          }
        } else {
          console.log('❌ Consultations API failed:', consultationsRes.status, await consultationsRes.text().catch(() => 'no error text'));
        }

        let medicalRecordsCount = 0;
        let recentRecords = [];

        // Process medical records
        if (medicalRecordsRes.ok) {
          const recordsData = await medicalRecordsRes.json();
          const records = recordsData.records || [];
          medicalRecordsCount = records.length;
          recentRecords = records.slice(0, 2);
        }

        // Update state
        setStudentStats({
          totalAppointments,
          upcomingAppointments,
          totalConsultations,
          medicalRecords: medicalRecordsCount,
          lastConsultation,
          nextAppointment
        });

        // Combine recent activity
        const activity = [
          ...recentAppointments.map((apt: any) => ({
            type: 'appointment',
            title: `Appointment - ${apt.type}`,
            date: new Date(apt.date),
            status: apt.status,
            icon: CalendarIcon
          })),
          ...recentConsultations.map((cons: any) => ({
            type: 'consultation', 
            title: 'Dr. ARIA Consultation',
            date: new Date(cons.createdAt),
            status: 'completed',
            icon: MessageCircle
          })),
          ...recentRecords.map((record: any) => ({
            type: 'medical_record',
            title: record.chief_complaint || 'Medical Record',
            date: new Date(record.record_date),
            status: 'completed',
            icon: FileText
          }))
        ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

        setRecentActivity(activity);

        console.log('🎓 Student data loaded:', {
          totalAppointments,
          upcomingAppointments, 
          totalConsultations,
          medicalRecordsCount,
          activityItems: activity.length
        });

      } catch (error) {
        console.error('Error fetching student data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentData();
  }, [user]);

  // Check if user has completed consultation - use database data instead of localStorage
  const hasValidConsultation = useMemo(() => {
    // If we have consultations from database, allow appointments
    if (studentStats.totalConsultations > 0) {
      return true;
    }
    
    // Fallback to localStorage check (only on client-side)
    if (typeof window !== 'undefined') {
      const lastConsultation = localStorage.getItem(`consultation_${user?.student_id}`);
      if (!lastConsultation) {
        return false;
      }
      
      try {
        const consultation = JSON.parse(lastConsultation);
        const consultationDate = new Date(consultation.date);
        const daysSinceConsultation = Math.floor((new Date().getTime() - consultationDate.getTime()) / (1000 * 3600 * 24));
        
        // Consultation is valid for 30 days
        return daysSinceConsultation <= 30;
      } catch {
        return false;
      }
    }
    
    return false;
  }, [studentStats.totalConsultations, user?.student_id]);

  // Handle loading state
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

  // Redirect if not authenticated or not a student
  if (!user || user.role !== 'student') {
    router.push('/role-selection');
    return null;
  }

  const dashboardItems = [
    {
      title: "View Medical History",
      description: "Access your complete medical records and past appointments",
      icon: FileText,
      action: () => router.push('/medical-history'),
      bgColor: "bg-blue-50 hover:bg-blue-100",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200 hover:border-blue-300"
    },
    {
      title: "Consult Dr. ARIA",
      description: "Advanced AI medical consultation with intelligent symptom analysis",
      icon: MessageCircle,
      action: () => router.push('/chat-doctor'),
      bgColor: "bg-green-50 hover:bg-green-100",
      iconColor: "text-green-600",
      borderColor: "border-green-200 hover:border-green-300"
    },
    {
      title: "Schedule Appointment",
      description: hasValidConsultation 
        ? "Book appointments with healthcare professionals"
        : "Complete consultation with Dr. ARIA first",
      icon: CalendarIcon,
      action: hasValidConsultation 
        ? () => router.push('/appointments')
        : () => router.push('/chat-doctor'),
      bgColor: hasValidConsultation 
        ? "bg-purple-50 hover:bg-purple-100" 
        : "bg-gray-50 hover:bg-gray-100",
      iconColor: hasValidConsultation 
        ? "text-purple-600" 
        : "text-gray-400",
      borderColor: hasValidConsultation 
        ? "border-purple-200 hover:border-purple-300" 
        : "border-gray-200 hover:border-gray-300"
    },
    {
      title: "View Analytics",
      description: "Track your health trends and wellness metrics",
      icon: BarChart3,
      action: () => router.push('/analytics'),
      bgColor: "bg-orange-50 hover:bg-orange-100",
      iconColor: "text-orange-600",
      borderColor: "border-orange-200 hover:border-orange-300"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Navbar />
      
      <main className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Welcome, {user.name}
            </h1>
            <p className="text-lg text-muted-foreground">
              Your health management center
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Student ID: {user.student_id}
            </p>
          </div>

          {/* Real-time Stats from Database - Moved Up */}
          <div className="mb-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="text-center bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center mb-2">
                    <CalendarIcon className="w-6 h-6 text-blue-600 mr-2" />
                    <div className="text-3xl font-bold text-blue-900">
                      {isLoading ? '...' : studentStats.upcomingAppointments}
                    </div>
                  </div>
                  <p className="text-blue-700 font-medium">Upcoming Appointments</p>
                  {studentStats.nextAppointment && (
                    <p className="text-xs text-blue-600 mt-1">
                      Next: {format(studentStats.nextAppointment, 'MMM dd')}
                    </p>
                  )}
                </CardContent>
              </Card>
              
              <Card className="text-center bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center mb-2">
                    <MessageCircle className="w-6 h-6 text-green-600 mr-2" />
                    <div className="text-3xl font-bold text-green-900">
                      {isLoading ? '...' : studentStats.totalConsultations}
                    </div>
                  </div>
                  <p className="text-green-700 font-medium">AI Consultations</p>
                  {studentStats.lastConsultation && (
                    <p className="text-xs text-green-600 mt-1">
                      Last: {format(studentStats.lastConsultation, 'MMM dd')}
                    </p>
                  )}
                </CardContent>
              </Card>
              
              <Card className="text-center bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center mb-2">
                    <FileText className="w-6 h-6 text-purple-600 mr-2" />
                    <div className="text-3xl font-bold text-purple-900">
                      {isLoading ? '...' : studentStats.medicalRecords}
                    </div>
                  </div>
                  <p className="text-purple-700 font-medium">Medical Records</p>
                  <p className="text-xs text-purple-600 mt-1">Complete history</p>
                </CardContent>
              </Card>
              
              <Card className="text-center bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center mb-2">
                    <Activity className="w-6 h-6 text-orange-600 mr-2" />
                    <div className="text-3xl font-bold text-orange-900">
                      {isLoading ? '...' : studentStats.totalAppointments}
                    </div>
                  </div>
                  <p className="text-orange-700 font-medium">Total Appointments</p>
                  <p className="text-xs text-orange-600 mt-1">All time</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Action Cards - Moved Below Stats */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
              {dashboardItems.map((item, index) => {
                const IconComponent = item.icon;
                return (
                  <Card 
                    key={index}
                    className={`h-full transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-pointer border-2 ${item.borderColor} ${item.bgColor}`}
                    onClick={item.action}
                  >
                    <CardHeader className="text-center pb-4">
                      <div className={`mx-auto mb-4 p-6 rounded-full bg-white w-fit shadow-sm`}>
                        <IconComponent className={`w-8 h-8 ${item.iconColor}`} />
                      </div>
                      <CardTitle className="text-xl font-bold text-foreground">
                        {item.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <CardDescription className="text-base text-muted-foreground">
                        {item.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Data Consistency Warning */}
          {studentStats.totalAppointments > 0 && studentStats.totalConsultations === 0 && !isLoading && (
            <div className="mb-8">
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                    <div>
                      <h3 className="font-semibold text-orange-900">Data Inconsistency Notice</h3>
                      <p className="text-sm text-orange-700">
                        You have {studentStats.totalAppointments} appointments but 0 consultations. 
                        Typically, appointments require prior AI consultations. This might be test data.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div className="mt-16">
              <h2 className="text-2xl font-bold text-foreground mb-6">Recent Activity</h2>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {recentActivity.map((activity, index) => {
                      const IconComponent = activity.icon;
                      return (
                        <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            activity.type === 'appointment' ? 'bg-blue-100' :
                            activity.type === 'consultation' ? 'bg-green-100' : 'bg-purple-100'
                          }`}>
                            <IconComponent className={`w-5 h-5 ${
                              activity.type === 'appointment' ? 'text-blue-600' :
                              activity.type === 'consultation' ? 'text-green-600' : 'text-purple-600'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground">{activity.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {format(activity.date, 'MMM dd, yyyy')} at {format(activity.date, 'h:mm a')}
                            </p>
                          </div>
                          <Badge variant={activity.status === 'completed' ? 'default' : 'outline'}>
                            {activity.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}