'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Heart, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

export default function StudentSignUp() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    student_id: '',
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate form
      if (!formData.student_id || !formData.password) {
        throw new Error('Student ID and password are required');
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      // Register user
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name || 'UMaT Student',
          role: 'student',
          student_id: formData.student_id,
          password: formData.password,
          email: formData.email,
          phone: formData.phone,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Registration failed');
      }

      const data = await response.json();
      
      // Login the user using the auth context (which will set the user state)
      await login({
        student_id: formData.student_id,
        password: formData.password,
        role: 'student'
      });

      // Redirect to student dashboard
      router.push('/student-dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              Student Registration
            </h1>
          </div>
          <p className="text-muted-foreground">
            Create your account to access health services
          </p>
        </div>

        {/* Registration Form */}
        <Card>
          <CardHeader>
            <CardTitle>Join Campus Health Assistant</CardTitle>
            <CardDescription>
              Enter your UMaT student details to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student_id">Student ID</Label>
                <Input
                  id="student_id"
                  name="student_id"
                  placeholder="Enter your UMaT student ID"
                  value={formData.student_id}
                  onChange={handleInputChange}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Enter your official UMaT student ID (format may vary by year/batch)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address (Optional)</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your.email@umat.edu.gh"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (Optional)</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+233 XX XXX XXXX"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                  {error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                For demo purposes, use format UE[A-Z]/XXX/XX or try:
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>UEB/123/24 : student123</div>
                <div>UEC/456/24 : password</div>
                <div>UEP/789/24 : umat2024</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Back to role selection */}
        <div className="mt-6 text-center">
          <Link 
            href="/role-selection" 
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to role selection
          </Link>
        </div>
      </div>
    </div>
  );
}