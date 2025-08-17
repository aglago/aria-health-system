'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Stethoscope, FileText, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/lib/auth/auth-context';

interface MedicalRecord {
  id: string;
  date: Date;
  type: 'consultation' | 'symptom_report' | 'appointment' | 'emergency';
  title: string;
  description: string;
  diagnosis?: string;
  treatment?: string;
  doctor?: string;
  severity: 'low' | 'medium' | 'high';
  status: 'completed' | 'pending' | 'follow_up_required';
}

interface StudentInfo {
  id: string;
  name: string;
  dateOfBirth: string;
  bloodType: string;
  allergies: string[];
  emergencyContact: string;
}

export default function MedicalHistory({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  // Redirect if not authenticated
  if (!user) {
    router.push('/role-selection');
    return null;
  }

  // Check if user has permission to view this medical history
  const canViewHistory = user.role === 'doctor' || (user.role === 'student' && user.student_id === studentId);
  
  if (!canViewHistory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <Navbar />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-8">
              You don't have permission to view this medical history.
            </p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Mock student information
  const studentInfo: StudentInfo = {
    id: studentId,
    name: studentId === 'UEB/123/24' ? 'John Smith' : 
          studentId === 'UEC/456/24' ? 'Sarah Johnson' :
          studentId === 'UEP/789/24' ? 'Michael Chen' :
          studentId === 'UEB/111/24' ? 'Emma Davis' :
          studentId === 'UEC/222/24' ? 'David Wilson' : 'Student',
    dateOfBirth: '2000-05-15',
    bloodType: 'O+',
    allergies: ['Penicillin', 'Shellfish'],
    emergencyContact: '+233 24 123 4567'
  };

  // Mock medical records
  const medicalRecords: MedicalRecord[] = [
    {
      id: '1',
      date: new Date('2024-01-15'),
      type: 'symptom_report',
      title: 'Persistent Headaches',
      description: 'Student reported severe headaches lasting 3 days, accompanied by dizziness and light sensitivity.',
      diagnosis: 'Tension headaches, possibly stress-related',
      treatment: 'Rest, hydration, stress management techniques recommended',
      doctor: 'Dr. Smith',
      severity: 'high',
      status: 'follow_up_required'
    },
    {
      id: '2',
      date: new Date('2024-01-10'),
      type: 'consultation',
      title: 'Routine Health Check',
      description: 'Annual health screening and wellness assessment.',
      diagnosis: 'Overall good health',
      treatment: 'Continue healthy lifestyle, recommended vitamins',
      doctor: 'Dr. Johnson',
      severity: 'low',
      status: 'completed'
    },
    {
      id: '3',
      date: new Date('2024-01-05'),
      type: 'appointment',
      title: 'Vaccination Update',
      description: 'Annual flu vaccination and health consultation.',
      diagnosis: 'Vaccination completed successfully',
      treatment: 'Monitor for any adverse reactions',
      doctor: 'Nurse Williams',
      severity: 'low',
      status: 'completed'
    },
    {
      id: '4',
      date: new Date('2023-12-20'),
      type: 'emergency',
      title: 'Allergic Reaction',
      description: 'Emergency visit due to allergic reaction after eating shellfish.',
      diagnosis: 'Allergic reaction to shellfish',
      treatment: 'Antihistamines, epinephrine administered',
      doctor: 'Dr. Emergency',
      severity: 'high',
      status: 'completed'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'follow_up_required': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'consultation': return <Stethoscope className="w-4 h-4" />;
      case 'symptom_report': return <AlertTriangle className="w-4 h-4" />;
      case 'appointment': return <Calendar className="w-4 h-4" />;
      case 'emergency': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Medical History</h1>
              <p className="text-muted-foreground">{studentInfo.name} ({studentId})</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Patient Information */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="text-foreground">{studentInfo.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Student ID</label>
                    <p className="text-foreground">{studentInfo.id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                    <p className="text-foreground">{studentInfo.dateOfBirth}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Blood Type</label>
                    <p className="text-foreground">{studentInfo.bloodType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Known Allergies</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {studentInfo.allergies.map((allergy, index) => (
                        <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Emergency Contact</label>
                    <p className="text-foreground">{studentInfo.emergencyContact}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Health Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Records</span>
                    <span className="font-medium">{medicalRecords.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">High Priority</span>
                    <span className="font-medium text-red-600">
                      {medicalRecords.filter(r => r.severity === 'high').length}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Follow-ups Required</span>
                    <span className="font-medium text-orange-600">
                      {medicalRecords.filter(r => r.status === 'follow_up_required').length}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Medical Records */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Medical Records</CardTitle>
                  <CardDescription>
                    Complete medical history and consultation records
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {medicalRecords.map((record) => (
                      <Card key={record.id} className="border-l-4 border-l-primary">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              {getTypeIcon(record.type)}
                              <div>
                                <CardTitle className="text-lg">{record.title}</CardTitle>
                                <CardDescription className="flex items-center gap-2 mt-1">
                                  <Calendar className="w-3 h-3" />
                                  {format(record.date, 'MMM dd, yyyy')}
                                  {record.doctor && (
                                    <>
                                      <span>•</span>
                                      <span>{record.doctor}</span>
                                    </>
                                  )}
                                </CardDescription>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Badge className={getSeverityColor(record.severity)}>
                                {record.severity}
                              </Badge>
                              <Badge className={getStatusColor(record.status)}>
                                {record.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                              <p className="text-sm">{record.description}</p>
                            </div>
                            {record.diagnosis && (
                              <div>
                                <h4 className="font-medium text-sm text-muted-foreground mb-1">Diagnosis</h4>
                                <p className="text-sm">{record.diagnosis}</p>
                              </div>
                            )}
                            {record.treatment && (
                              <div>
                                <h4 className="font-medium text-sm text-muted-foreground mb-1">Treatment</h4>
                                <p className="text-sm">{record.treatment}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}