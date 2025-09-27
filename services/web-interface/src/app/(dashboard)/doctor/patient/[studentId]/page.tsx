'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  Stethoscope, 
  AlertTriangle, 
  Phone, 
  Mail, 
  User, 
  Heart,
  Activity,
  Plus,
  Edit,
  MessageCircle,
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

interface PatientInfo {
  id: string;
  name: string;
  student_id: string;
  dateOfBirth: string;
  bloodType: string;
  allergies: string[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  chronicConditions: string[];
  currentMedications: string[];
  insuranceInfo?: string;
  lastVisit: Date;
}

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const { studentId } = use(params);
  const router = useRouter();
  const { user, loading } = useAuth();
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'vitals' | 'medications'>('overview');
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch patient data and medical records
  const fetchPatientData = async () => {
    try {
      // Fetch medical records for this patient
      const recordsResponse = await fetch(`/api/medical-records?patient_id=${studentId}&limit=100`, {
        credentials: 'include'
      });

      if (recordsResponse.ok) {
        const recordsData = await recordsResponse.json();
        
        if (recordsData.records && recordsData.records.length > 0) {
          // Convert API medical records to component format
          const convertedRecords: MedicalRecord[] = recordsData.records.map((record: any) => ({
            id: record._id,
            date: new Date(record.record_date || record.visit_date),
            type: record.record_type || 'consultation',
            title: record.chief_complaint || 'Medical Record',
            description: record.history_of_present_illness || record.assessment_notes || 'No description available',
            symptoms: record.symptoms_reported_to_aria || [],
            diagnosis: record.final_diagnosis,
            treatment: record.treatment_plan,
            medications: record.medications_prescribed?.map((med: any) => 
              `${med.medication_name} ${med.dosage} ${med.frequency}`
            ) || [],
            doctor: record.doctor_name || record.doctor?.name || 'Unknown Doctor',
            severity: record.severity_level || 'low',
            status: record.status === 'signed' ? 'completed' : record.status || 'pending',
            notes: record.doctor_notes || record.follow_up_instructions,
            vitals: record.vital_signs ? {
              bloodPressure: record.vital_signs.blood_pressure,
              heartRate: record.vital_signs.heart_rate,
              temperature: record.vital_signs.temperature,
              weight: record.vital_signs.weight,
              height: record.vital_signs.height
            } : undefined
          }));

          setMedicalRecords(convertedRecords);

          // Create patient info from first record
          const firstRecord = recordsData.records[0];
          const patient: PatientInfo = {
            id: studentId,
            name: firstRecord.patient?.name || 'Unknown Patient',
            student_id: studentId,
            dateOfBirth: firstRecord.patient?.date_of_birth || 'Unknown',
            bloodType: firstRecord.patient?.blood_type || 'Unknown',
            allergies: firstRecord.patient?.allergies || [],
            emergencyContact: firstRecord.patient?.emergency_contact || {
              name: 'Unknown',
              relationship: 'Unknown',
              phone: 'Unknown'
            },
            chronicConditions: firstRecord.patient?.chronic_conditions || [],
            currentMedications: firstRecord.patient?.current_medications || [],
            insuranceInfo: firstRecord.patient?.insurance_info || 'UMaT Student Health Insurance',
            lastVisit: new Date(firstRecord.record_date || firstRecord.visit_date)
          };

          setPatientInfo(patient);
        } else {
          // No medical records found - create basic patient info
          setPatientInfo({
            id: studentId,
            name: 'Unknown Patient',
            student_id: studentId,
            dateOfBirth: 'Unknown',
            bloodType: 'Unknown',
            allergies: [],
            emergencyContact: {
              name: 'Unknown',
              relationship: 'Unknown',
              phone: 'Unknown'
            },
            chronicConditions: [],
            currentMedications: [],
            insuranceInfo: 'UMaT Student Health Insurance',
            lastVisit: new Date()
          });
          setMedicalRecords([]);
        }
      } else {
        console.error('Failed to fetch medical records:', recordsResponse.status);
        setMedicalRecords([]);
      }
    } catch (error) {
      console.error('Error fetching patient data:', error);
      setMedicalRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'doctor') {
      fetchPatientData();
    }
  }, [user, studentId]);

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
          <p className="text-muted-foreground">Loading patient data...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'doctor') {
    return null;
  }

  if (!patientInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Patient not found</p>
          <Button variant="outline" onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

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

  const handleAddNote = () => {
    if (newNote.trim()) {
      // In a real app, this would save to the database
      alert(`Note added: ${newNote}`);
      setNewNote('');
      setIsAddingNote(false);
    }
  };

  const exportPatientData = () => {
    alert('Patient data exported successfully!');
  };

  const printPatientRecord = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
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
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">Patient Medical Record</h1>
              <p className="text-muted-foreground">{patientInfo.name} ({patientInfo.student_id})</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportPatientData}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={printPatientRecord}>
                <Printer className="w-4 h-4 mr-2" />
                Print
              </Button>
              <Button size="sm" onClick={() => setIsAddingNote(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Note
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="border-b border-border mb-8">
            <nav className="flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: User },
                { id: 'records', label: 'Medical Records', icon: FileText },
                { id: 'vitals', label: 'Vital Signs', icon: Activity },
                { id: 'medications', label: 'Medications', icon: Heart }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Patient Information */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Patient Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="text-foreground">{patientInfo.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Student ID</label>
                    <p className="text-foreground">{patientInfo.student_id}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date of Birth</label>
                    <p className="text-foreground">{patientInfo.dateOfBirth}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Blood Type</label>
                    <p className="text-foreground">{patientInfo.bloodType}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Insurance</label>
                    <p className="text-foreground">{patientInfo.insuranceInfo}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Last Visit</label>
                    <p className="text-foreground">{format(patientInfo.lastVisit, 'PPP')}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact & Allergies */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Medical Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Emergency Contact */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Emergency Contact
                    </h3>
                    <div className="bg-muted p-4 rounded-lg">
                      <p className="font-medium">{patientInfo.emergencyContact.name}</p>
                      <p className="text-sm text-muted-foreground">{patientInfo.emergencyContact.relationship}</p>
                      <p className="text-sm text-muted-foreground">{patientInfo.emergencyContact.phone}</p>
                    </div>
                  </div>

                  {/* Allergies */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      Known Allergies
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {patientInfo.allergies.map((allergy, index) => (
                        <Badge key={index} variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Chronic Conditions */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Chronic Conditions
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {patientInfo.chronicConditions.map((condition, index) => (
                        <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Current Medications */}
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Heart className="w-4 h-4" />
                      Current Medications
                    </h3>
                    <div className="space-y-2">
                      {patientInfo.currentMedications.map((medication, index) => (
                        <div key={index} className="bg-muted p-2 rounded text-sm">
                          {medication}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'records' && (
            <div className="space-y-6">
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
              ))}
            </div>
          )}

          {activeTab === 'vitals' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {medicalRecords.filter(r => r.vitals).map((record) => (
                <Card key={record.id}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">{format(record.date, 'MMM dd, yyyy')}</CardTitle>
                    <CardDescription className="text-xs">{record.doctor}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {record.vitals?.bloodPressure && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Blood Pressure</span>
                        <span className="text-sm font-medium">{record.vitals.bloodPressure}</span>
                      </div>
                    )}
                    {record.vitals?.heartRate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Heart Rate</span>
                        <span className="text-sm font-medium">{record.vitals.heartRate} bpm</span>
                      </div>
                    )}
                    {record.vitals?.temperature && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Temperature</span>
                        <span className="text-sm font-medium">{record.vitals.temperature}°C</span>
                      </div>
                    )}
                    {record.vitals?.weight && (
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Weight</span>
                        <span className="text-sm font-medium">{record.vitals.weight} kg</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'medications' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Medications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {patientInfo.currentMedications.map((medication, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="font-medium">{medication}</span>
                        <Badge variant="outline" className="bg-green-50 text-green-700">Active</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Medication History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {medicalRecords.filter(r => r.medications && r.medications.length > 0).map((record) => (
                      <div key={record.id} className="border-l-2 border-primary pl-4">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{format(record.date, 'MMM dd, yyyy')}</h4>
                          <Badge variant="outline">{record.doctor}</Badge>
                        </div>
                        <div className="space-y-1">
                          {record.medications?.map((medication, index) => (
                            <div key={index} className="text-sm bg-muted p-2 rounded">
                              {medication}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Add Note Modal */}
      <Dialog open={isAddingNote} onOpenChange={setIsAddingNote}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Medical Note</DialogTitle>
            <DialogDescription>
              Add a new note to {patientInfo.name}'s medical record
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="note">Note</Label>
              <textarea 
                id="note"
                placeholder="Enter your medical note here..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={4}
                className="w-full mt-1 p-2 border border-input rounded-md bg-background"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsAddingNote(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddNote}
              disabled={!newNote.trim()}
            >
              Add Note
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}