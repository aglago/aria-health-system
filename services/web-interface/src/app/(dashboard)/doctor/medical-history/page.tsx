'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, User, Calendar, AlertTriangle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/lib/auth/auth-context';

interface MedicalRecord {
  id: string;
  patient_id: string;
  patient_name: string;
  visit_date: Date;
  doctor_name: string;
  final_diagnosis: string;
  chief_complaint: string;
  treatment_plan: string;
  medications_prescribed: any[];
  follow_up_required: boolean;
  record_type: string;
  severity: 'low' | 'medium' | 'high';
}

export default function DoctorMedicalHistory() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch individual medical records (not patient summaries)
  const fetchMedicalRecords = async () => {
    try {
      const response = await fetch('/api/medical-records?limit=100', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.records && Array.isArray(data.records)) {
          const formattedRecords: MedicalRecord[] = data.records.map((record: any) => ({
            id: record._id || record.id,
            patient_id: record.patient_id,
            patient_name: record.patient?.name || 'Unknown Patient',
            visit_date: new Date(record.record_date || record.visit_date),
            doctor_name: record.doctor_name || record.doctor?.name || 'Unknown Doctor',
            final_diagnosis: record.final_diagnosis || 'No diagnosis recorded',
            chief_complaint: record.chief_complaint || 'Not specified',
            treatment_plan: record.treatment_plan || 'No treatment plan',
            medications_prescribed: record.medications_prescribed || [],
            follow_up_required: record.follow_up_required || false,
            record_type: record.record_type || 'consultation',
            severity: record.urgency_level === 'high' ? 'high' : 
                     record.urgency_level === 'medium' ? 'medium' : 'low'
          }));

          setMedicalRecords(formattedRecords.sort((a, b) => 
            b.visit_date.getTime() - a.visit_date.getTime()
          ));
        } else {
          setMedicalRecords([]);
        }
      } else {
        console.error('Failed to fetch medical records:', response.statusText);
        setMedicalRecords([]);
      }
    } catch (error) {
      console.error('Error fetching medical records:', error);
      setMedicalRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'doctor') {
      fetchMedicalRecords();
    }
  }, [user]);

  // Redirect if not authenticated or not a doctor - only on client side
  useEffect(() => {
    if (!loading && (!user || user.role !== 'doctor')) {
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

  if (!user || user.role !== 'doctor') {
    return null;
  }

  // Filter medical records based on search term
  const filteredRecords = medicalRecords.filter(record =>
    record.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.final_diagnosis.toLowerCase().includes(searchTerm.toLowerCase())
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
      
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Medical Records</h1>
            <p className="text-muted-foreground">
              Individual visit documentation - review specific medical encounters and appointment records
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
                    <p className="text-sm font-medium text-muted-foreground">Medical Records</p>
                    <p className="text-3xl font-bold text-foreground">{medicalRecords.length}</p>
                  </div>
                  <User className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Recent Records</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {medicalRecords.filter(r => r.follow_up_required).length}
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
                      {medicalRecords.filter(r => r.severity === 'high').length}
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
                    <p className="text-sm font-medium text-muted-foreground">Unique Patients</p>
                    <p className="text-3xl font-bold text-foreground">
                      {new Set(medicalRecords.map(r => r.patient_id)).size}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Patient Records Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredRecords.map((record) => (
              <Card key={record.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{record.patient_name}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <User className="w-3 h-3" />
                        {record.patient_id}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getSeverityColor(record.severity)}>
                        {record.severity}
                      </Badge>
                      <Badge variant="outline">
                        {record.record_type}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Diagnosis</h4>
                      <p className="text-sm font-medium">{record.final_diagnosis}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Chief Complaint</h4>
                      <p className="text-sm text-muted-foreground">{record.chief_complaint}</p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(record.visit_date, 'MMM dd, yyyy')}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {record.doctor_name}
                      </div>
                    </div>
                    
                    <Button 
                      onClick={() => router.push(`/doctor/medical-record/${record.id}`)}
                      className="w-full mt-4"
                      variant="outline"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Medical Record
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No results message */}
          {filteredRecords.length === 0 && searchTerm && (
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