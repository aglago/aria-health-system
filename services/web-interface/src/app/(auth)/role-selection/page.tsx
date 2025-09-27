'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, GraduationCap, Stethoscope, UserPlus, LogIn, Play } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

export default function RoleSelection() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleDemoLogin = async (role: 'student' | 'doctor') => {
    setLoading(role);
    try {
      if (role === 'student') {
        await login({
          student_id: 'BS424100620',
          password: 'demo2024',
          name: 'Kwame Asante',
          role: 'student'
        });
        router.push('/student-dashboard');
      } else {
        await login({
          doctor_id: 'UMAT-DOC-001',
          password: 'demo2024',
          name: 'Dr. Akosua Mensah',
          role: 'doctor'
        });
        router.push('/doctor-dashboard');
      }
    } catch (error) {
      console.error('Demo login failed:', error);
      alert('Demo login failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Campus Health Assistant
            </h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Welcome! Please select your role to continue
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Student Card */}
          <Card className="border-2 border-blue-200 bg-blue-50">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-6 rounded-full bg-white w-fit shadow-sm">
                <GraduationCap className="w-12 h-12 text-blue-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                I'm a Student
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="text-base text-muted-foreground mb-6">
                Access health services, chat with our health bot, view your medical history, and schedule appointments
              </CardDescription>
              <ul className="text-sm text-muted-foreground space-y-2 text-left mb-6">
                <li>• Health symptom assessment</li>
                <li>• Medical history tracking</li>
                <li>• Appointment scheduling</li>
                <li>• Health analytics dashboard</li>
              </ul>
              
              <div className="space-y-3">
                <Link href="/student-signup" className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Sign Up as Student
                  </Button>
                </Link>
                
                <Link href="/student-signin" className="block">
                  <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In (Existing Student)
                  </Button>
                </Link>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-blue-600 hover:bg-blue-100"
                  onClick={() => handleDemoLogin('student')}
                  disabled={loading === 'student'}
                >
                  <Play className="w-3 h-3 mr-1" />
                  {loading === 'student' ? 'Signing in...' : 'Demo Student Login'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Doctor Card */}
          <Card className="border-2 border-green-200 bg-green-50">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-6 rounded-full bg-white w-fit shadow-sm">
                <Stethoscope className="w-12 h-12 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-foreground">
                I'm a Doctor
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <CardDescription className="text-base text-muted-foreground mb-6">
                Review flagged cases, manage patient care, and communicate with students
              </CardDescription>
              <ul className="text-sm text-muted-foreground space-y-2 text-left mb-6">
                <li>• Review flagged health cases</li>
                <li>• Patient case management</li>
                <li>• Direct student communication</li>
                <li>• Medical history access</li>
              </ul>
              
              <div className="space-y-3">
                <Link href="/doctor-signin" className="block">
                  <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                    <LogIn className="w-4 h-4 mr-2" />
                    Sign In as Doctor
                  </Button>
                </Link>
                
                <Link href="/doctor-signup" className="block">
                  <Button variant="outline" className="w-full border-green-600 text-green-600 hover:bg-green-50">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Register as Doctor
                  </Button>
                </Link>
                
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-green-600 hover:bg-green-100"
                  onClick={() => handleDemoLogin('doctor')}
                  disabled={loading === 'doctor'}
                >
                  <Play className="w-3 h-3 mr-1" />
                  {loading === 'doctor' ? 'Signing in...' : 'Demo Doctor Login'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Campus Health Assistant - University of Mines and Technology
          </p>
        </div>
      </div>
    </div>
  );
}