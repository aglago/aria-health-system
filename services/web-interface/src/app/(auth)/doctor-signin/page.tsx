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

export default function DoctorSignIn() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    doctor_id: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate form
      if (!formData.doctor_id || !formData.password) {
        throw new Error('Doctor ID and password are required');
      }

      // Attempt login
      await login({
        doctor_id: formData.doctor_id,
        password: formData.password,
        role: 'doctor'
      });

      // Redirect to doctor dashboard
      router.push('/doctor-dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
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
              Doctor Sign In
            </h1>
          </div>
          <p className="text-muted-foreground">
            Access the medical professional dashboard
          </p>
        </div>

        {/* Sign In Form */}
        <Card>
          <CardHeader>
            <CardTitle>Welcome Back, Doctor</CardTitle>
            <CardDescription>
              Sign in to review patient cases and manage care
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doctor_id">Doctor ID</Label>
                <Input
                  id="doctor_id"
                  name="doctor_id"
                  placeholder="e.g., DR001"
                  value={formData.doctor_id}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
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
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Demo doctor credentials:
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>DR001 : doctor123</div>
                <div>DR002 : medical456</div>
                <div>ADMIN : admin123</div>
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