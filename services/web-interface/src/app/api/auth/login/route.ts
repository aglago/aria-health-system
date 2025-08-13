import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'aria-secret-key-for-umat-students-2024'
);

// Simple authentication for UMaT students
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, password, name } = body;

    // Validate required fields
    if (!student_id || !password) {
      return NextResponse.json(
        { error: 'Student ID and password are required' },
        { status: 400 }
      );
    }

    // Basic validation for UMaT student ID format (example: UEB/XXX/XX)
    const studentIdPattern = /^UE[A-Z]\/[0-9]{3}\/[0-9]{2}$/;
    if (!studentIdPattern.test(student_id.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid UMaT student ID format. Expected format: UEX/XXX/XX (e.g., UEB/123/24)' },
        { status: 400 }
      );
    }

    // For demo purposes, we'll accept any valid format with a simple password check
    // In production, this would integrate with UMaT's actual student database
    const isValidCredentials = await validateStudentCredentials(student_id, password);
    
    if (!isValidCredentials) {
      return NextResponse.json(
        { error: 'Invalid student credentials' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await new SignJWT({
      student_id: student_id.toUpperCase(),
      name: name || 'UMaT Student',
      role: 'student',
      institution: 'University of Mines and Technology'
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h') // Token valid for 24 hours
      .sign(JWT_SECRET);

    // Create response with authentication data
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: {
        student_id: student_id.toUpperCase(),
        name: name || 'UMaT Student',
        institution: 'University of Mines and Technology',
        role: 'student'
      }
    });

    // Set HTTP-only cookie for session management
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { error: 'Authentication service error' },
      { status: 500 }
    );
  }
}

// Simplified credential validation for demo
// In production, this would query UMaT's student database
async function validateStudentCredentials(student_id: string, password: string): Promise<boolean> {
  // For demo purposes, we'll accept:
  // - Any valid UMaT student ID format
  // - Password must be at least 6 characters or match student ID
  
  // Demo credentials for testing
  const demoCredentials = [
    { student_id: 'UEB/123/24', password: 'student123' },
    { student_id: 'UEC/456/24', password: 'password' },
    { student_id: 'UEP/789/24', password: 'umat2024' },
  ];

  // Check demo credentials
  const demoMatch = demoCredentials.some(
    cred => cred.student_id === student_id.toUpperCase() && cred.password === password
  );

  if (demoMatch) {
    return true;
  }

  // Fallback: accept any valid format with password >= 6 chars
  if (password.length >= 6) {
    return true;
  }

  return false;
}