'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Redirect authenticated users to their dashboard
        if (user.role === 'student') {
          router.push('/student-dashboard');
        } else if (user.role === 'doctor') {
          router.push('/doctor-dashboard');
        }
      } else {
        // Redirect unauthenticated users to role selection
        router.push('/role-selection');
      }
    }
  }, [user, loading, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading Campus Health Assistant...</p>
      </div>
    </div>
  );
}
