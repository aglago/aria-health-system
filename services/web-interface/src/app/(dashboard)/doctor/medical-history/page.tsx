'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, User, Calendar, AlertTriangle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/lib/auth/auth-context';

interface Patient {
  id: string;
  name: string;
  student_id: string;
  lastVisit: Date;
  totalRecords: number;
  recentDiagnosis: string;
  severity: 'low' | 'medium' | 'high';
  status: 'active' | 'resolved' | 'monitoring';
}

export default function DoctorMedicalHistory() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // Redirect if not authenticated or not a doctor
  if (!user || user.role !== 'doctor') {
    router.push('/role-selection');
    return null;
  }

  // Mock patient data
  const patients: Patient[] = [
    {
      id: '1',
      name: 'John Smith',
      student_id: 'UEB/123/24',
      lastVisit: new Date('2024-01-15'),
      totalRecords: 8,
      recentDiagnosis: 'Tension headaches, stress-related',
      severity: 'high',
      status: 'monitoring'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      student_id: 'UEC/456/24',
      lastVisit: new Date('2024-01-14'),
      totalRecords: 5,
      recentDiagnosis: 'Chronic fatigue syndrome',
      severity: 'medium',
      status: 'active'
    },
    {
      id: '3',
      name: 'Michael Chen',
      student_id: 'UEP/789/24',
      lastVisit: new Date('2024-01-13'),
      totalRecords: 12,
      recentDiagnosis: 'Allergic reaction to shellfish',
      severity: 'high',
      status: 'resolved'
    },
    {
      id: '4',
      name: 'Emma Davis',
      student_id: 'UEB/111/24',
      lastVisit: new Date('2024-01-12'),
      totalRecords: 6,
      recentDiagnosis: 'Anxiety disorder, panic attacks',
      severity: 'medium',
      status: 'active'
    },
    {
      id: '5',
      name: 'David Wilson',
      student_id: 'UEC/222/24',
      lastVisit: new Date('2024-01-11'),
      totalRecords: 3,
      recentDiagnosis: 'Digestive issues, IBS symptoms',
      severity: 'low',
      status: 'monitoring'
    },
    {
      id: '6',
      name: 'Lisa Parker',
      student_id: 'UEB/333/24',
      lastVisit: new Date('2024-01-10'),
      totalRecords: 4,
      recentDiagnosis: 'Upper respiratory infection',
      severity: 'low',
      status: 'resolved'
    }
  ];

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.recentDiagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'monitoring': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewHistory = (student_id: string) => {
    router.push(`/doctor/patient/${student_id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Patient Medical Records</h1>
            <p className="text-muted-foreground">
              Access and review complete medical histories for all patients
            </p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by name, student ID, or diagnosis..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Export Records
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                    <p className="text-3xl font-bold text-foreground">{patients.length}</p>
                  </div>
                  <User className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Cases</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {patients.filter(p => p.status === 'active').length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                    <p className="text-3xl font-bold text-red-600">
                      {patients.filter(p => p.severity === 'high').length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                    <p className="text-3xl font-bold text-foreground">
                      {patients.reduce((sum, p) => sum + p.totalRecords, 0)}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Patient Records Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredPatients.map((patient) => (
              <Card key={patient.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{patient.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <User className="w-3 h-3" />
                        {patient.student_id}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getSeverityColor(patient.severity)}>
                        {patient.severity}
                      </Badge>
                      <Badge className={getStatusColor(patient.status)}>
                        {patient.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Recent Diagnosis</h4>
                      <p className="text-sm">{patient.recentDiagnosis}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(patient.lastVisit, 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {patient.totalRecords} records
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => handleViewHistory(patient.student_id)}
                      className="w-full mt-4"
                      variant="outline"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Full History
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No results message */}
          {filteredPatients.length === 0 && searchTerm && (
            <Card className="mt-8">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No patients found</h3>
                  <p className="text-muted-foreground">
                    No patients match your search criteria. Try adjusting your search terms.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}