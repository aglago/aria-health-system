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

export default function StudentSignIn() {
  const router = useRouter();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    student_id: '',
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
      if (!formData.student_id || !formData.password) {
        throw new Error('Student ID and password are required');
      }

      // Attempt login
      await login({
        student_id: formData.student_id,
        password: formData.password,
        role: 'student'
      });

      // Redirect to student dashboard
      router.push('/student-dashboard');
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
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
              Student Sign In
            </h1>
          </div>
          <p className="text-muted-foreground">
            Welcome back! Sign in to access your health services
          </p>
        </div>

        {/* Sign In Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In to Your Account</CardTitle>
            <CardDescription>
              Enter your UMaT student credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student_id">Student ID</Label>
                <Input
                  id="student_id"
                  name="student_id"
                  placeholder="e.g., UEB/123/24"
                  value={formData.student_id}
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
                Don't have an account yet?
              </p>
              <Link href="/student-signup">
                <Button variant="outline" className="w-full">
                  Create New Account
                </Button>
              </Link>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                For demo purposes, you can use:
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