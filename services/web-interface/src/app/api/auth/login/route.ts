import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'aria-secret-key-for-umat-students-2024'
);

// Role-based authentication for students and doctors
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, doctor_id, password, role } = body;

    // Validate required fields and role
    if (!role || (role !== 'student' && role !== 'doctor')) {
      return NextResponse.json(
        { error: 'Valid role (student or doctor) is required' },
        { status: 400 }
      );
    }

    if (role === 'student' && !student_id) {
      return NextResponse.json(
        { error: 'Student ID is required for student login' },
        { status: 400 }
      );
    }

    if (role === 'doctor' && !doctor_id) {
      return NextResponse.json(
        { error: 'Doctor ID is required for doctor login' },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Find user in database
    let user;
    if (role === 'student' && student_id) {
      user = await User.findOne({ student_id: student_id.toUpperCase(), role: 'student' });
    } else if (role === 'doctor' && doctor_id) {
      user = await User.findOne({ doctor_id: doctor_id, role: 'doctor' });
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found. Please register first.' },
        { status: 404 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    // Create user info for JWT
    const userInfo = {
      id: user.student_id || user.doctor_id,
      name: user.name,
      role: user.role,
      ...(user.student_id && { student_id: user.student_id }),
      ...(user.doctor_id && { doctor_id: user.doctor_id }),
      institution: user.institution,
      email: user.email
    };

    // Generate JWT token
    const token = await new SignJWT(userInfo)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h') // Token valid for 24 hours
      .sign(JWT_SECRET);

    // Create response with authentication data
    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      user: userInfo
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

