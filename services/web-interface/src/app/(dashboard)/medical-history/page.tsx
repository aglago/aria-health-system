'use client';

import { useState } from 'react';
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
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

  // Redirect if not authenticated or not a student
  if (!user || user.role !== 'student') {
    router.push('/role-selection');
    return null;
  }

  // Mock medical records for the current student
  const medicalRecords: MedicalRecord[] = [
    {
      id: '1',
      date: new Date('2024-01-15'),
      type: 'consultation',
      title: 'Follow-up: Persistent Headaches',
      description: 'Follow-up consultation for tension headaches. Patient reports improvement with stress management techniques and recommended medications.',
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
      description: 'Routine annual health screening and wellness assessment.',
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
      title: 'Allergic Reaction - Emergency Treatment',
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
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
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
                      {medicalRecords.filter(r => r.type === 'appointment').length}
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
            {filteredRecords.map((record) => (
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

          {/* No results message */}
          {filteredRecords.length === 0 && searchTerm && (
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