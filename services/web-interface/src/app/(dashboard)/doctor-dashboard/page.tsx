'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, MessageCircle, AlertTriangle, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/lib/auth/auth-context';

interface FlaggedCase {
  id: string;
  studentId: string;
  studentName: string;
  symptomSummary: string;
  dateFlagged: Date;
  severity: 'low' | 'medium' | 'high';
}

export default function DoctorDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<FlaggedCase | null>(null);
  const [contactMessage, setContactMessage] = useState('');

  // Redirect if not authenticated or not a doctor
  if (!user || user.role !== 'doctor') {
    router.push('/role-selection');
    return null;
  }

  // Mock data for flagged cases
  const flaggedCases: FlaggedCase[] = [
    {
      id: '1',
      studentId: 'UEB/123/24',
      studentName: 'John Smith',
      symptomSummary: 'Persistent headaches, dizziness, reported during health check-up',
      dateFlagged: new Date('2024-01-15'),
      severity: 'high'
    },
    {
      id: '2',
      studentId: 'UEC/456/24',
      studentName: 'Sarah Johnson',
      symptomSummary: 'Chronic fatigue, sleep issues, difficulty concentrating',
      dateFlagged: new Date('2024-01-14'),
      severity: 'medium'
    },
    {
      id: '3',
      studentId: 'UEP/789/24',
      studentName: 'Michael Chen',
      symptomSummary: 'Allergic reaction symptoms, skin rash, respiratory issues',
      dateFlagged: new Date('2024-01-13'),
      severity: 'high'
    },
    {
      id: '4',
      studentId: 'UEB/111/24',
      studentName: 'Emma Davis',
      symptomSummary: 'Anxiety symptoms, stress-related complaints, panic attacks',
      dateFlagged: new Date('2024-01-12'),
      severity: 'medium'
    },
    {
      id: '5',
      studentId: 'UEC/222/24',
      studentName: 'David Wilson',
      symptomSummary: 'Digestive issues, stomach pain, nausea',
      dateFlagged: new Date('2024-01-11'),
      severity: 'low'
    }
  ];

  const handleContactStudent = (student: FlaggedCase) => {
    setSelectedStudent(student);
    setIsContactModalOpen(true);
  };

  const handleSendMessage = () => {
    if (selectedStudent && contactMessage.trim()) {
      alert(`Message sent to ${selectedStudent.studentName}: ${contactMessage}`);
      setContactMessage('');
      setIsContactModalOpen(false);
      setSelectedStudent(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Welcome, {user.name}
            </h1>
            <p className="text-lg text-muted-foreground">
              Review flagged cases and manage patient care
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Doctor ID: {user.doctor_id}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Cases</p>
                    <p className="text-3xl font-bold text-foreground">{flaggedCases.length}</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">High Priority</p>
                    <p className="text-3xl font-bold text-red-600">
                      {flaggedCases.filter(c => c.severity === 'high').length}
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
                    <p className="text-sm font-medium text-muted-foreground">Medium Priority</p>
                    <p className="text-3xl font-bold text-orange-600">
                      {flaggedCases.filter(c => c.severity === 'medium').length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Low Priority</p>
                    <p className="text-3xl font-bold text-green-600">
                      {flaggedCases.filter(c => c.severity === 'low').length}
                    </p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Appointments */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Today's Appointments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { time: '9:00 AM', patient: 'John Smith (UEB/123/24)', type: 'Follow-up', room: 'Room 201' },
                  { time: '10:30 AM', patient: 'Sarah Johnson (UEC/456/24)', type: 'General Consultation', room: 'Room 201' },
                  { time: '2:00 PM', patient: 'Michael Chen (UEP/789/24)', type: 'Emergency Follow-up', room: 'Room 203' },
                  { time: '3:30 PM', patient: 'Emma Davis (UEB/111/24)', type: 'Mental Health', room: 'Room 202' },
                  { time: '4:00 PM', patient: 'David Wilson (UEC/222/24)', type: 'General Check-up', room: 'Room 201' }
                ].map((appointment, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-blue-600">{appointment.time}</span>
                        <span className="text-xs text-muted-foreground">{appointment.room}</span>
                      </div>
                      <h3 className="font-medium text-sm mb-1">{appointment.patient}</h3>
                      <p className="text-xs text-muted-foreground">{appointment.type}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Quick Actions */}
              <div className="mt-6 flex gap-4">
                <Button variant="outline" size="sm">
                  <Calendar className="w-4 h-4 mr-2" />
                  View Full Schedule
                </Button>
                <Button variant="outline" size="sm">
                  <Clock className="w-4 h-4 mr-2" />
                  Reschedule Appointment
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Flagged Cases Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Flagged Cases</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <div className="min-w-full">
                  <div className="grid grid-cols-5 gap-4 font-medium text-sm text-muted-foreground border-b pb-2 mb-4">
                    <div>Student Name</div>
                    <div>Symptom Summary</div>
                    <div>Date Flagged</div>
                    <div>Severity</div>
                    <div>Actions</div>
                  </div>
                  {flaggedCases.map((case_) => (
                    <div key={case_.id} className="grid grid-cols-5 gap-4 py-3 border-b border-border items-center">
                      <div className="font-medium">{case_.studentName}</div>
                      <div className="max-w-xs">
                        <div className="truncate text-sm" title={case_.symptomSummary}>
                          {case_.symptomSummary}
                        </div>
                      </div>
                      <div className="text-sm">{format(case_.dateFlagged, 'MMM dd, yyyy')}</div>
                      <div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getSeverityColor(case_.severity)}`}>
                          {case_.severity}
                        </span>
                      </div>
                      <div>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.push(`/doctor/patient/${case_.studentId}`)}
                            className="flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View History
                          </Button>
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => handleContactStudent(case_)}
                            className="flex items-center gap-1"
                          >
                            <MessageCircle className="h-4 w-4" />
                            Contact
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Contact Student Modal */}
      <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Contact Student</DialogTitle>
            <DialogDescription>
              Send a message to {selectedStudent?.studentName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="message">Message</Label>
              <textarea 
                id="message"
                placeholder="Type your message here..."
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                rows={4}
                className="w-full mt-1 p-2 border border-input rounded-md bg-background"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsContactModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendMessage}
              disabled={!contactMessage.trim()}
            >
              Send Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}