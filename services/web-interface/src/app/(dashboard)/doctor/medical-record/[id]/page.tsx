'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { use } from 'react';
import Navbar from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText, Calendar, User, Stethoscope, Pill, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/lib/auth/auth-context';

interface MedicalRecordDetail {
  id: string;
  patient_id: string;
  patient_name: string;
  visit_date: Date;
  doctor_name: string;
  final_diagnosis: string;
  chief_complaint: string;
  history_of_present_illness: string;
  physical_examination_findings: string;
  treatment_plan: string;
  medications_prescribed: {
    medication_name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
  }[];
  follow_up_required: boolean;
  follow_up_instructions: string;
  record_type: string;
  vital_signs: {
    blood_pressure?: string;
    heart_rate?: number;
    respiratory_rate?: number;
    temperature?: number;
    weight?: number;
    height?: number;
  };
  patient: {
    name: string;
    student_id: string;
    email: string;
    program: string;
  };
}

interface Params {
  id: string;
}

export default function IndividualMedicalRecord({ params }: { params: Promise<Params> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user, loading } = useAuth();
  const [medicalRecord, setMedicalRecord] = useState<MedicalRecordDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch individual medical record
  const fetchMedicalRecord = async () => {
    try {
      const response = await fetch(`/api/medical-records/${resolvedParams.id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.record) {
          setMedicalRecord({
            ...data.record,
            visit_date: new Date(data.record.record_date || data.record.visit_date)
          });
        }
      } else {
        console.error('Failed to fetch medical record:', response.statusText);
      }

    } catch (error) {
      console.error('Error fetching medical record:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'doctor' && resolvedParams.id) {
      fetchMedicalRecord();
    }
  }, [user, resolvedParams.id]);

  // Redirect if not authenticated
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
          <p className="text-muted-foreground">Loading medical record...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'doctor') {
    return null;
  }

  if (!medicalRecord) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Medical Record Not Found</h1>
            <p className="text-muted-foreground mb-6">The requested medical record could not be found.</p>
            <Button onClick={() => router.push('/doctor/medical-history')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Medical Records
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="outline" 
              onClick={() => router.push('/doctor/medical-history')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Medical Records
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Medical Record</h1>
              <p className="text-muted-foreground">
                Individual visit documentation for {medicalRecord.patient?.name}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Visit Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Visit Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Visit Date</h4>
                      <p className="text-sm">{format(medicalRecord.visit_date, 'MMMM dd, yyyy')}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Record Type</h4>
                      <Badge variant="outline">{medicalRecord.record_type}</Badge>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Doctor</h4>
                      <p className="text-sm">{medicalRecord.doctor_name}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-1">Follow-up Required</h4>
                      <Badge variant={medicalRecord.follow_up_required ? "destructive" : "secondary"}>
                        {medicalRecord.follow_up_required ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Clinical Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="w-5 h-5" />
                    Clinical Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Chief Complaint</h4>
                    <p className="text-sm bg-muted/50 p-3 rounded-md">
                      {medicalRecord.chief_complaint || 'Not specified'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">History of Present Illness</h4>
                    <p className="text-sm bg-muted/50 p-3 rounded-md">
                      {medicalRecord.history_of_present_illness || 'Not documented'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Physical Examination</h4>
                    <p className="text-sm bg-muted/50 p-3 rounded-md">
                      {medicalRecord.physical_examination_findings || 'Not documented'}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Final Diagnosis</h4>
                    <div className="bg-primary/10 p-3 rounded-md">
                      <p className="font-medium text-primary">{medicalRecord.final_diagnosis}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Treatment Plan */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Treatment Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2">Treatment Plan</h4>
                    <p className="text-sm bg-muted/50 p-3 rounded-md">
                      {medicalRecord.treatment_plan || 'No treatment plan documented'}
                    </p>
                  </div>
                  
                  {medicalRecord.follow_up_required && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Follow-up Instructions</h4>
                      <div className="bg-orange-50 border border-orange-200 p-3 rounded-md">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-600 mt-0.5" />
                          <p className="text-sm text-orange-700">
                            {medicalRecord.follow_up_instructions || 'Follow-up required - specific instructions not provided'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Medications */}
              {medicalRecord.medications_prescribed && medicalRecord.medications_prescribed.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Pill className="w-5 h-5" />
                      Prescribed Medications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {medicalRecord.medications_prescribed.map((medication, index) => (
                        <div key={index} className="border border-border rounded-lg p-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <h5 className="font-medium text-primary">{medication.medication_name}</h5>
                              <p className="text-sm text-muted-foreground">{medication.dosage}</p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm"><span className="font-medium">Frequency:</span> {medication.frequency}</p>
                              <p className="text-sm"><span className="font-medium">Duration:</span> {medication.duration}</p>
                              {medication.instructions && (
                                <p className="text-sm"><span className="font-medium">Instructions:</span> {medication.instructions}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Patient Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Name</h4>
                    <p className="text-sm font-medium">{medicalRecord.patient?.name}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Student ID</h4>
                    <p className="text-sm">{medicalRecord.patient?.student_id}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Program</h4>
                    <p className="text-sm">{medicalRecord.patient?.program}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-muted-foreground mb-1">Email</h4>
                    <p className="text-sm text-blue-600">{medicalRecord.patient?.email}</p>
                  </div>
                  
                  <div className="pt-3 border-t">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => router.push(`/doctor/patient/${medicalRecord.patient_id}`)}
                    >
                      View Complete Patient File
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Vital Signs */}
              {medicalRecord.vital_signs && Object.keys(medicalRecord.vital_signs).length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Vital Signs</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {medicalRecord.vital_signs.blood_pressure && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Blood Pressure</h4>
                        <p className="text-sm">{medicalRecord.vital_signs.blood_pressure}</p>
                      </div>
                    )}
                    {medicalRecord.vital_signs.heart_rate && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Heart Rate</h4>
                        <p className="text-sm">{medicalRecord.vital_signs.heart_rate} bpm</p>
                      </div>
                    )}
                    {medicalRecord.vital_signs.temperature && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Temperature</h4>
                        <p className="text-sm">{medicalRecord.vital_signs.temperature}°C</p>
                      </div>
                    )}
                    {medicalRecord.vital_signs.weight && (
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-1">Weight</h4>
                        <p className="text-sm">{medicalRecord.vital_signs.weight} kg</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}