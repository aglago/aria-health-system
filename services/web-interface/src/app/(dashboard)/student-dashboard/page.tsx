'use client';

import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, MessageCircle, Calendar as CalendarIcon, BarChart3 } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

export default function StudentDashboard() {
  const router = useRouter();
  const { user } = useAuth();

  // Redirect if not authenticated or not a student
  if (!user || user.role !== 'student') {
    router.push('/role-selection');
    return null;
  }


  // Check if user has completed consultation
  const checkConsultationRequired = () => {
    const lastConsultation = localStorage.getItem(`consultation_${user?.student_id}`);
    
    if (!lastConsultation) {
      return false;
    }
    
    const consultation = JSON.parse(lastConsultation);
    const consultationDate = new Date(consultation.date);
    const daysSinceConsultation = Math.floor((new Date().getTime() - consultationDate.getTime()) / (1000 * 3600 * 24));
    
    // Consultation is valid for 30 days
    return daysSinceConsultation <= 30;
  };

  const hasValidConsultation = checkConsultationRequired();

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
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
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

          {/* Dashboard Grid */}
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

          {/* Quick Stats Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary mb-2">3</div>
                <p className="text-muted-foreground">Upcoming Appointments</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary mb-2">12</div>
                <p className="text-muted-foreground">Health Records</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="text-3xl font-bold text-primary mb-2">98%</div>
                <p className="text-muted-foreground">Health Score</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}