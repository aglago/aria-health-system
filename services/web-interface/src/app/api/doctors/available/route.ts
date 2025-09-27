import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const specialization = searchParams.get('specialization');

    // Build query for doctors
    const query: Record<string, unknown> = { role: 'doctor' };
    
    if (specialization && specialization !== 'any') {
      query.specialization = specialization;
    }

    // Fetch available doctors
    const doctors = await User.find(query)
      .select('name doctor_id specialization email phone institution')
      .sort({ name: 1 })
      .lean();

    // Transform doctor data for assignment
    const availableDoctors = doctors.map(doctor => ({
      id: doctor._id.toString(),
      doctor_id: doctor.doctor_id,
      name: doctor.name,
      specialization: doctor.specialization || 'general-practitioner',
      email: doctor.email,
      phone: doctor.phone,
      institution: doctor.institution,
      display_name: `${doctor.name} ${doctor.specialization ? `(${doctor.specialization.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())})` : ''}`
    }));

    console.log('👩‍⚕️ Available doctors fetched:', {
      total_doctors: availableDoctors.length,
      specializations: [...new Set(availableDoctors.map(d => d.specialization))],
      requested_specialization: specialization
    });

    return NextResponse.json({ 
      doctors: availableDoctors,
      total: availableDoctors.length 
    });

  } catch (error) {
    console.error('Error fetching available doctors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available doctors' },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use GET to fetch available doctors.' },
    { status: 405 }
  );
}