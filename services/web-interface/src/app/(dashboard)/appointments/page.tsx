'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarIcon, Clock, User, Stethoscope, Plus, Bot } from 'lucide-react';
import Link from 'next/link';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import { useAuth } from '@/lib/auth/auth-context';

interface Appointment {
  id: string;
  date: Date;
  time: string;
  doctor: string;
  type: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export default function Appointments() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [appointmentType, setAppointmentType] = useState('');
  const [notes, setNotes] = useState('');

  // Redirect if not authenticated
  if (!user) {
    router.push('/role-selection');
    return null;
  }

  // Mock existing appointments
  const appointments: Appointment[] = [
    {
      id: '1',
      date: addDays(new Date(), 2),
      time: '10:00 AM',
      doctor: 'Dr. Smith',
      type: 'General Consultation',
      status: 'scheduled',
      notes: 'Follow-up for headaches'
    },
    {
      id: '2',
      date: addDays(new Date(), 5),
      time: '2:30 PM',
      doctor: 'Dr. Johnson',
      type: 'Health Check-up',
      status: 'scheduled'
    },
    {
      id: '3',
      date: addDays(new Date(), -3),
      time: '11:00 AM',
      doctor: 'Dr. Williams',
      type: 'Emergency Consultation',
      status: 'completed',
      notes: 'Allergic reaction treatment'
    }
  ];

  // Mock available time slots
  const timeSlots: TimeSlot[] = [
    { time: '9:00 AM', available: true },
    { time: '9:30 AM', available: false },
    { time: '10:00 AM', available: true },
    { time: '10:30 AM', available: true },
    { time: '11:00 AM', available: false },
    { time: '11:30 AM', available: true },
    { time: '2:00 PM', available: true },
    { time: '2:30 PM', available: true },
    { time: '3:00 PM', available: false },
    { time: '3:30 PM', available: true },
    { time: '4:00 PM', available: true },
    { time: '4:30 PM', available: true }
  ];

  const checkConsultationRequired = () => {
    // Check if user has completed a consultation with Dr. ARIA
    const lastConsultation = localStorage.getItem(`consultation_${user?.id}`);
    
    if (!lastConsultation) {
      return false;
    }
    
    const consultation = JSON.parse(lastConsultation);
    const consultationDate = new Date(consultation.date);
    const daysSinceConsultation = Math.floor((new Date().getTime() - consultationDate.getTime()) / (1000 * 3600 * 24));
    
    // Consultation is valid for 30 days
    return daysSinceConsultation <= 30;
  };

  const handleBookAppointment = () => {
    if (!selectedDate || !selectedTime || !appointmentType) {
      alert('Please select date, time, and appointment type');
      return;
    }

    if (!checkConsultationRequired()) {
      alert('You must complete a consultation with Dr. ARIA before booking an appointment. Please visit the Health Bot first.');
      setIsBookingModalOpen(false);
      router.push('/chat-doctor');
      return;
    }

    // Mock booking logic
    alert(`Appointment booked for ${format(selectedDate, 'PPP')} at ${selectedTime}`);
    setIsBookingModalOpen(false);
    setSelectedDate(undefined);
    setSelectedTime('');
    setAppointmentType('');
    setNotes('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isTomorrow(date)) return 'Tomorrow';
    return format(date, 'MMM dd, yyyy');
  };

  const upcomingAppointments = appointments.filter(apt => apt.status === 'scheduled');
  const pastAppointments = appointments.filter(apt => apt.status === 'completed');
  const hasValidConsultation = checkConsultationRequired();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Appointments</h1>
              <p className="text-muted-foreground">Manage your healthcare appointments</p>
            </div>
            <Button 
              onClick={() => setIsBookingModalOpen(true)}
              className="flex items-center gap-2"
              disabled={!hasValidConsultation}
            >
              <Plus className="w-4 h-4" />
              Book Appointment
            </Button>
          </div>

          {/* Consultation Requirement Notice */}
          {!hasValidConsultation && (
            <div className="mb-8">
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-6 h-6 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-amber-800 mb-2">
                        Consultation Required
                      </h3>
                      <p className="text-amber-700 mb-4">
                        Before booking an appointment with a doctor, you must first complete a consultation with Dr. ARIA, 
                        our AI health assistant. This helps us understand your symptoms and schedule the most appropriate care.
                      </p>
                      <Link href="/chat-doctor">
                        <Button className="bg-amber-600 hover:bg-amber-700 text-white">
                          <Bot className="w-4 h-4 mr-2" />
                          Start Consultation with Dr. ARIA
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                    <p className="text-3xl font-bold text-foreground">{upcomingAppointments.length}</p>
                  </div>
                  <CalendarIcon className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">This Month</p>
                    <p className="text-3xl font-bold text-foreground">5</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Completed</p>
                    <p className="text-3xl font-bold text-foreground">{pastAppointments.length}</p>
                  </div>
                  <Stethoscope className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Appointments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5" />
                  Upcoming Appointments
                </CardTitle>
                <CardDescription>
                  Your scheduled healthcare appointments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map((appointment) => (
                      <div key={appointment.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium">{appointment.type}</h3>
                            <p className="text-sm text-muted-foreground">{appointment.doctor}</p>
                          </div>
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            {getDateLabel(appointment.date)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {appointment.time}
                          </div>
                        </div>
                        {appointment.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No upcoming appointments</p>
                      <Button 
                        onClick={() => setIsBookingModalOpen(true)}
                        className="mt-4"
                        variant="outline"
                      >
                        Book your first appointment
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Past Appointments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Past Appointments
                </CardTitle>
                <CardDescription>
                  Your completed appointment history
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pastAppointments.length > 0 ? (
                    pastAppointments.map((appointment) => (
                      <div key={appointment.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-medium">{appointment.type}</h3>
                            <p className="text-sm text-muted-foreground">{appointment.doctor}</p>
                          </div>
                          <Badge className={getStatusColor(appointment.status)}>
                            {appointment.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-3 h-3" />
                            {format(appointment.date, 'MMM dd, yyyy')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {appointment.time}
                          </div>
                        </div>
                        {appointment.notes && (
                          <p className="text-sm text-muted-foreground mt-2 italic">
                            {appointment.notes}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No past appointments</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Book Appointment Modal */}
      <Dialog open={isBookingModalOpen} onOpenChange={setIsBookingModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Book New Appointment</DialogTitle>
            <DialogDescription>
              Select a date and time for your appointment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Calendar */}
            <div>
              <Label className="text-sm font-medium">Select Date</Label>
              <div className="mt-2">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  className="rounded-md border"
                />
              </div>
            </div>

            {/* Time Slots */}
            {selectedDate && (
              <div>
                <Label className="text-sm font-medium">Available Times</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {timeSlots.map((slot) => (
                    <Button
                      key={slot.time}
                      variant={selectedTime === slot.time ? "default" : "outline"}
                      size="sm"
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.time)}
                      className="text-xs"
                    >
                      {slot.time}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Appointment Type */}
            <div>
              <Label htmlFor="appointmentType">Appointment Type</Label>
              <Input
                id="appointmentType"
                placeholder="e.g., General Consultation, Health Check-up"
                value={appointmentType}
                onChange={(e) => setAppointmentType(e.target.value)}
              />
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                placeholder="Any specific concerns or symptoms..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full mt-1 p-2 border border-input rounded-md bg-background"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsBookingModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBookAppointment}
              disabled={!selectedDate || !selectedTime || !appointmentType}
            >
              Book Appointment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}