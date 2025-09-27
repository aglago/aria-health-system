'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, User, Calendar, FileText, Eye, Mail, Phone } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/lib/auth/auth-context';

interface Patient {
  id: string;
  name: string;
  student_id: string;
  email?: string;
  phone?: string;
  lastVisit: Date;
  totalRecords: number;
  recentDiagnosis: string;
  status: 'active' | 'resolved' | 'monitoring';
  appointmentCount: number;
}

export default function AllPatientsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all patient files for this doctor
  const fetchPatients = async () => {
    try {
      const response = await fetch('/api/patient-files?limit=100', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.patientFiles && Array.isArray(data.patientFiles)) {
          const formattedPatients: Patient[] = data.patientFiles.map((file: any) => ({
            id: file.patient_id,
            name: file.patient_name,
            student_id: file.patient_id,
            email: file.email,
            phone: file.phone,
            lastVisit: file.last_visit ? new Date(file.last_visit) : new Date(),
            totalRecords: file.total_records || 0,
            recentDiagnosis: file.recent_diagnoses?.length > 0 
              ? file.recent_diagnoses.join(', ') 
              : 'No recent diagnosis',
            status: file.active_status === 'active' ? 'active' : 'resolved',
            appointmentCount: file.total_appointments || 0
          }));

          setPatients(formattedPatients.sort((a, b) => 
            b.lastVisit.getTime() - a.lastVisit.getTime()
          ));
        }
      } else {
        console.error('Failed to fetch patient files:', response.statusText);
        setPatients([]);
      }

    } catch (error) {
      console.error('Error fetching patient files:', error);
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'doctor') {
      fetchPatients();
    }
  }, [user]);

  // Redirect if not authenticated or not a doctor - only on client side
  useEffect(() => {
    if (!loading && (!user || user.role !== 'doctor')) {
      router.push('/role-selection');
    }
  }, [user, loading, router]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading patients...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'doctor') {
    return null;
  }

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.recentDiagnosis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'monitoring': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewPatient = (studentId: string) => {
    router.push(`/doctor/patient/${studentId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Navbar />
      
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Patient Files</h1>
            <p className="text-muted-foreground">
              Comprehensive patient profiles with complete medical history, demographics, and care summaries
            </p>
          </div>

          {/* Search and Stats */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
            {/* Search Bar */}
            <Card className="lg:col-span-2">
              <CardContent className="pt-6">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search by name, student ID, or diagnosis..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Patients</p>
                    <p className="text-2xl font-bold text-foreground">{patients.length}</p>
                  </div>
                  <User className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Cases</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {patients.filter(p => p.status === 'active' || p.status === 'monitoring').length}
                    </p>
                  </div>
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Patients Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPatients.map((patient) => (
              <Card key={patient.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewPatient(patient.student_id)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{patient.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        {patient.student_id}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(patient.status)}>
                      {patient.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Contact Info */}
                  {(patient.email || patient.phone) && (
                    <div className="space-y-1">
                      {patient.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {patient.email}
                        </div>
                      )}
                      {patient.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {patient.phone}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Medical File Summary */}
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Medical File Summary</h4>
                    <p className="text-sm line-clamp-2">{patient.recentDiagnosis}</p>
                  </div>
                  
                  {/* Stats and Date */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground pt-2 border-t">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(patient.lastVisit, 'MMM dd, yyyy')}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {patient.totalRecords} records • {patient.appointmentCount} visits
                      </div>
                    </div>
                  </div>
                  
                  {/* View Button */}
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewPatient(patient.student_id);
                    }}
                    className="w-full mt-3"
                    variant="outline"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Patient File
                  </Button>
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

          {/* Empty state */}
          {patients.length === 0 && !searchTerm && (
            <Card className="mt-8">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No patients yet</h3>
                  <p className="text-muted-foreground">
                    You haven&apos;t seen any patients yet. Patient files will appear here after appointments and consultations.
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