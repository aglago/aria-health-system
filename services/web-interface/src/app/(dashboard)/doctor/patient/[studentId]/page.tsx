'use client';

import { use, useState } from 'react';
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
  const { user } = useAuth();
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'records' | 'vitals' | 'medications'>('overview');

  // Redirect if not authenticated or not a doctor
  if (!user || user.role !== 'doctor') {
    router.push('/role-selection');
    return null;
  }

  // Mock patient information
  const patientInfo: PatientInfo = {
    id: studentId,
    name: studentId === 'UEB/123/24' ? 'John Smith' : 
          studentId === 'UEC/456/24' ? 'Sarah Johnson' :
          studentId === 'UEP/789/24' ? 'Michael Chen' :
          studentId === 'UEB/111/24' ? 'Emma Davis' :
          studentId === 'UEC/222/24' ? 'David Wilson' : 'Unknown Student',
    student_id: studentId,
    dateOfBirth: '2000-05-15',
    bloodType: 'O+',
    allergies: ['Penicillin', 'Shellfish', 'Pollen'],
    emergencyContact: {
      name: 'Jane Smith',
      relationship: 'Mother',
      phone: '+233 24 123 4567'
    },
    chronicConditions: ['Asthma', 'Hypertension'],
    currentMedications: ['Albuterol Inhaler', 'Lisinopril 10mg'],
    insuranceInfo: 'UMaT Student Health Insurance',
    lastVisit: new Date('2024-01-15')
  };

  // Mock detailed medical records
  const medicalRecords: MedicalRecord[] = [
    {
      id: '1',
      date: new Date('2024-01-15'),
      type: 'consultation',
      title: 'Follow-up: Persistent Headaches',
      description: 'Patient returned for follow-up on tension headaches. Reports improvement with stress management techniques.',
      symptoms: ['Headache', 'Light sensitivity', 'Neck tension'],
      diagnosis: 'Tension-type headaches, improving',
      treatment: 'Continue stress management, increase water intake, ergonomic workspace setup',
      medications: ['Ibuprofen 400mg PRN', 'Magnesium supplement'],
      doctor: 'Dr. Smith',
      severity: 'medium',
      status: 'completed',
      notes: 'Patient showing good improvement. Recommend follow-up in 2 weeks if symptoms persist.',
      vitals: {
        bloodPressure: '120/80',
        heartRate: 72,
        temperature: 36.5,
        weight: 70,
        height: 175
      }
    },
    {
      id: '2',
      date: new Date('2024-01-10'),
      type: 'symptom_report',
      title: 'Initial Consultation: Severe Headaches',
      description: 'Student presented with severe, persistent headaches lasting 3 days. Associated with dizziness and light sensitivity.',
      symptoms: ['Severe headache', 'Dizziness', 'Photophobia', 'Nausea'],
      diagnosis: 'Tension headaches, stress-related',
      treatment: 'Rest, hydration, stress management techniques, ergonomic assessment',
      medications: ['Ibuprofen 400mg TID', 'Relaxation therapy'],
      doctor: 'Dr. Smith',
      severity: 'high',
      status: 'follow_up_required',
      notes: 'Referred to stress counseling. Follow-up in 1 week to assess progress.',
      vitals: {
        bloodPressure: '125/85',
        heartRate: 78,
        temperature: 36.8
      }
    },
    {
      id: '3',
      date: new Date('2024-01-05'),
      type: 'appointment',
      title: 'Annual Health Check-up',
      description: 'Routine annual health screening and wellness assessment for student.',
      symptoms: [],
      diagnosis: 'Overall good health, mild stress indicators',
      treatment: 'Continue healthy lifestyle, stress management recommendations',
      medications: ['Multivitamin daily'],
      doctor: 'Dr. Johnson',
      severity: 'low',
      status: 'completed',
      notes: 'All vital signs normal. Recommend stress management due to academic pressure.',
      vitals: {
        bloodPressure: '118/75',
        heartRate: 68,
        temperature: 36.4,
        weight: 69,
        height: 175
      }
    },
    {
      id: '4',
      date: new Date('2023-12-20'),
      type: 'emergency',
      title: 'Allergic Reaction - Shellfish',
      description: 'Emergency presentation with allergic reaction after consuming shellfish at campus cafeteria.',
      symptoms: ['Hives', 'Swelling', 'Difficulty breathing', 'Rapid pulse'],
      diagnosis: 'Anaphylactic reaction to shellfish',
      treatment: 'Epinephrine, antihistamines, corticosteroids, monitoring',
      medications: ['Epinephrine 0.3mg IM', 'Diphenhydramine 50mg IV', 'Prednisone 40mg'],
      doctor: 'Dr. Emergency',
      severity: 'emergency',
      status: 'completed',
      notes: 'Patient responded well to treatment. Discharged with EpiPen prescription and dietary counseling.',
      vitals: {
        bloodPressure: '140/90',
        heartRate: 110,
        temperature: 37.2
      }
    }
  ];

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