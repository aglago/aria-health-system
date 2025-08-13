import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'aria-secret-key-for-umat-students-2024'
);

// Verify authentication token
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token found' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const { payload } = await jwtVerify(token, JWT_SECRET);

    return NextResponse.json({
      success: true,
      user: {
        student_id: payload.student_id,
        name: payload.name,
        institution: payload.institution,
        role: payload.role
      },
      authenticated: true
    });

  } catch (error) {
    console.error('Token verification error:', error);
    
    // Clear invalid token
    const response = NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );

    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    });

    return response;
  }
}

// Support POST requests as well
export async function POST(request: NextRequest) {
  return GET(request);
}