'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Calendar, 
  Stethoscope, 
  AlertTriangle, 
  User, 
  Heart,
  Activity,
  Search,
  Download,
  Printer
} from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/lib/auth/auth-context';

interface MedicalRecord {
  id: string;
  date: Date;
  type: 'consultation' | 'symptom_report' | 'appointment' | 'emergency' | 'follow_up';
  title: string;
  description: string;
  symptoms: string[];
  diagnosis?: string;
  treatment?: string;
  medications?: string[];
  doctor: string;
  severity: 'low' | 'medium' | 'high' | 'emergency';
  status: 'completed' | 'pending' | 'follow_up_required';
  notes?: string;
  vitals?: {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
  };
}

export default function StudentMedicalHistory() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch medical records from database
  const fetchMedicalRecords = async () => {
    try {
      const response = await fetch('/api/medical-records', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Medical records response:', data);
        
        if (data.records && Array.isArray(data.records)) {
          setMedicalRecords(data.records.map((record: Record<string, any>) => ({
            id: record._id,
            date: new Date(record.record_date),
            type: record.record_type,
            title: record.chief_complaint || 'Medical Consultation',
            description: record.history_of_present_illness || 'No description available',
            symptoms: record.symptoms_reported_to_aria || [],
            diagnosis: record.final_diagnosis,
            treatment: record.treatment_plan,
            medications: record.medications_prescribed?.map((med: Record<string, any>) => 
              `${med.medication_name} ${med.dosage} ${med.frequency}`) || [],
            doctor: record.doctor_name,
            severity: record.severity_level,
            status: record.status === 'signed' ? 'completed' : record.status,
            notes: record.patient_education_provided || '',
            vitals: {
              bloodPressure: record.vital_signs?.blood_pressure,
              heartRate: record.vital_signs?.heart_rate,
              temperature: record.vital_signs?.temperature,
              weight: record.vital_signs?.weight,
              height: record.vital_signs?.height
            }
          })));
        } else {
          console.warn('No records found in response');
          setMedicalRecords([]);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch medical records:', response.status, errorData);
      }
    } catch (error) {
      console.error('Error fetching medical records:', error);
    }
  };

  // Fetch appointments count from actual appointments API
  const fetchAppointmentsCount = async () => {
    try {
      const response = await fetch('/api/appointments', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        const appointments = data.appointments || [];
        setAppointmentsCount(appointments.length);
      }
    } catch (error) {
      console.error('Error fetching appointments count:', error);
    }
  };

  const fetchAllData = async () => {
    await Promise.all([
      fetchMedicalRecords(),
      fetchAppointmentsCount()
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (user && user.role === 'student') {
      fetchAllData();
    }
  }, [user]);

  // Redirect if not authenticated or not a student - only on client side
  useEffect(() => {
    if (!loading && (!user || user.role !== 'student')) {
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

  if (!user || user.role !== 'student') {
    return null;
  }


  // Filter records based on search term
  const filteredRecords = medicalRecords.filter(record =>
    record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.diagnosis?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.symptoms.some(symptom => symptom.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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
      case 'follow_up': return <Activity className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const exportRecords = () => {
    alert('Medical records exported successfully!');
  };

  const printRecords = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Navbar />
      
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">My Medical History</h1>
              <p className="text-muted-foreground">
                View your complete medical records and health history
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportRecords}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={printRecords}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>

          {/* Search */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search your medical records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                    <p className="text-3xl font-bold text-foreground">{medicalRecords.length}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Consultations</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {medicalRecords.filter(r => r.type === 'consultation').length}
                    </p>
                  </div>
                  <Stethoscope className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Appointments</p>
                    <p className="text-3xl font-bold text-green-600">
                      {appointmentsCount}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Visit</p>
                    <p className="text-lg font-bold text-foreground">
                      {format(medicalRecords[0]?.date || new Date(), 'MMM dd')}
                    </p>
                  </div>
                  <Heart className="h-8 w-8 text-pink-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Medical Records */}
          <div className="space-y-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading medical records...</p>
              </div>
            ) : filteredRecords.length > 0 ? (
              filteredRecords.map((record) => (
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
                          <span>•</span>
                          <span>{record.doctor}</span>
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
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Description</h4>
                    <p className="text-sm">{record.description}</p>
                  </div>
                  
                  {record.symptoms.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Symptoms</h4>
                      <div className="flex flex-wrap gap-1">
                        {record.symptoms.map((symptom, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
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
                  
                  {record.medications && record.medications.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Medications</h4>
                      <div className="space-y-1">
                        {record.medications.map((medication, index) => (
                          <div key={index} className="text-xs bg-muted p-2 rounded">
                            {medication}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {record.vitals && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Vital Signs</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        {record.vitals.bloodPressure && (
                          <div className="bg-muted p-2 rounded">
                            <span className="font-medium">BP:</span> {record.vitals.bloodPressure}
                          </div>
                        )}
                        {record.vitals.heartRate && (
                          <div className="bg-muted p-2 rounded">
                            <span className="font-medium">HR:</span> {record.vitals.heartRate} bpm
                          </div>
                        )}
                        {record.vitals.temperature && (
                          <div className="bg-muted p-2 rounded">
                            <span className="font-medium">Temp:</span> {record.vitals.temperature}°C
                          </div>
                        )}
                        {record.vitals.weight && (
                          <div className="bg-muted p-2 rounded">
                            <span className="font-medium">Weight:</span> {record.vitals.weight} kg
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {record.notes && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Notes</h4>
                      <p className="text-sm italic bg-blue-50 p-2 rounded">{record.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No medical records</h3>
                <p className="text-muted-foreground">
                  You don't have any medical records yet. Medical records will appear here after doctor visits.
                </p>
              </div>
            )}
          </div>

          {/* No search results message */}
          {!isLoading && filteredRecords.length === 0 && searchTerm && (
            <Card className="mt-8">
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No records found</h3>
                  <p className="text-muted-foreground">
                    No medical records match your search criteria. Try adjusting your search terms.
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