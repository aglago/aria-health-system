import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import { signToken } from '@/lib/auth/jwt';

interface RegisterRequest {
  name: string;
  role: 'student' | 'doctor';
  student_id?: string;
  doctor_id?: string;
  password: string;
  email?: string;
  phone?: string;
  institution?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: RegisterRequest = await request.json();
    const { name, role, student_id, doctor_id, password, email, phone, institution } = body;

    // Validate required fields
    if (!name || !role || !password) {
      return NextResponse.json(
        { error: 'Name, role, and password are required' },
        { status: 400 }
      );
    }

    if (role === 'student' && !student_id) {
      return NextResponse.json(
        { error: 'Student ID is required for student registration' },
        { status: 400 }
      );
    }

    if (role === 'doctor' && !doctor_id) {
      return NextResponse.json(
        { error: 'Doctor ID is required for doctor registration' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // Check if user already exists
    let existingUser;
    if (role === 'student' && student_id) {
      existingUser = await User.findOne({ student_id: student_id.toUpperCase() });
    } else if (role === 'doctor' && doctor_id) {
      existingUser = await User.findOne({ doctor_id: doctor_id });
    }

    if (existingUser) {
      return NextResponse.json(
        { error: `${role === 'student' ? 'Student' : 'Doctor'} already registered` },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user object
    const userId = role === 'student' ? student_id?.toUpperCase() : doctor_id;
    const userData = {
      name,
      role,
      password: hashedPassword,
      email,
      phone,
      institution: institution || 'University of Mines and Technology',
      ...(role === 'student' && { student_id: student_id?.toUpperCase() }),
      ...(role === 'doctor' && { doctor_id })
    };

    // Create and save user
    const user = new User(userData);
    await user.save();

    console.log('✅ User registered successfully:', {
      id: userId,
      name: user.name,
      role: user.role,
      institution: user.institution
    });

    // Generate JWT token for immediate login
    const tokenPayload = {
      id: userId!,
      name: user.name,
      role: user.role,
      ...(role === 'student' && { student_id: user.student_id }),
      ...(role === 'doctor' && { doctor_id: user.doctor_id })
    };

    const token = await signToken(tokenPayload);

    // Create response
    const response = NextResponse.json({
      success: true,
      message: `${role === 'student' ? 'Student' : 'Doctor'} registered successfully`,
      user: {
        id: userId,
        name: user.name,
        role: user.role,
        student_id: user.student_id,
        doctor_id: user.doctor_id,
        institution: user.institution,
        email: user.email,
        phone: user.phone
      }
    }, { status: 201 });

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
    console.error('❌ User registration error:', error);
    
    // Handle MongoDB duplicate key errors
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: 'User with this ID already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to register.' },
    { status: 405 }
  );
}