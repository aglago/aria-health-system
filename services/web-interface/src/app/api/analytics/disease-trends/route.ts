import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import connectToDatabase from '@/lib/mongodb';
import MedicalRecord from '@/models/MedicalRecord';
import Consultation from '@/models/Consultation';
import User from '@/models/User';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'aria-secret-key-for-umat-students-2024'
);

// GET /api/analytics/disease-trends - Get disease trends and outbreak detection data
export async function GET(request: NextRequest) {
  try {
    await connectToDatabase();

    // Get authorization token from cookies
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      );
    }
    
    // Verify and decode token
    let decoded: { id: string; role: string };
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      decoded = payload as { id: string; role: string };
      if (!decoded?.id) {
        return NextResponse.json(
          { error: 'Invalid token payload' },
          { status: 401 }
        );
      }
    } catch (error) {
      console.error('JWT verification error:', error);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Get user details - only doctors should access analytics
    // Handle both ObjectId and string doctor IDs (like DR001)
    let user;
    try {
      // Try finding by MongoDB ObjectId first
      user = await User.findById(decoded.id);
    } catch (error) {
      // If ObjectId cast fails, try finding by doctor_id field
      user = await User.findOne({ doctor_id: decoded.id });
    }
    
    if (!user || user.role !== 'doctor') {
      return NextResponse.json(
        { error: 'Only doctors can access analytics data' },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const timeRange = url.searchParams.get('range') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(timeRange));

    // Aggregate medical records for confirmed diagnoses
    const confirmedDiagnoses = await MedicalRecord.aggregate([
      {
        $match: {
          record_date: { $gte: startDate },
          final_diagnosis: { $exists: true, $ne: '' }
        }
      },
      {
        $group: {
          _id: '$final_diagnosis',
          count: { $sum: 1 },
          recent_cases: {
            $push: {
              date: '$record_date',
              patient_id: '$patient_id',
              severity: '$severity_level'
            }
          }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 20
      }
    ]);

    // Aggregate symptoms from both consultations and medical records
    const symptomTrends = await Consultation.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          symptoms: { $exists: true, $not: { $size: 0 } }
        }
      },
      {
        $unwind: '$symptoms'
      },
      {
        $group: {
          _id: '$symptoms',
          count: { $sum: 1 },
          recent_reports: {
            $push: {
              date: '$createdAt',
              patient_id: '$patient_id',
              severity: '$urgency_level'
            }
          }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 15
      }
    ]);

    // Get daily case counts for trend visualization from medical records
    const medicalRecordTrends = await MedicalRecord.aggregate([
      {
        $match: {
          record_date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$record_date'
              }
            }
          },
          medical_records: { $sum: 1 },
          confirmed_diagnoses: {
            $sum: {
              $cond: [
                { $and: [{ $ne: ['$final_diagnosis', null] }, { $ne: ['$final_diagnosis', ''] }] },
                1,
                0
              ]
            }
          }
        }
      }
    ]);

    // Get daily consultation counts to supplement the data
    const consultationTrends = await Consultation.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            }
          },
          consultations: { $sum: 1 }
        }
      }
    ]);

    // Combine medical records and consultations data
    const dailyDataMap = new Map();
    
    // Process medical records
    medicalRecordTrends.forEach(record => {
      const date = record._id.date;
      dailyDataMap.set(date, {
        _id: { date },
        total_cases: record.medical_records,
        confirmed_diagnoses: record.confirmed_diagnoses
      });
    });
    
    // Add consultation data
    consultationTrends.forEach(consultation => {
      const date = consultation._id.date;
      const existing = dailyDataMap.get(date) || { 
        _id: { date }, 
        total_cases: 0, 
        confirmed_diagnoses: 0 
      };
      existing.total_cases += consultation.consultations;
      dailyDataMap.set(date, existing);
    });
    
    // Convert to array and sort
    const dailyTrends = Array.from(dailyDataMap.values()).sort((a, b) => 
      a._id.date.localeCompare(b._id.date)
    );

    // Outbreak detection - look for symptom spikes
    const currentWeek = new Date();
    currentWeek.setDate(currentWeek.getDate() - 7);
    const previousWeek = new Date();
    previousWeek.setDate(previousWeek.getDate() - 14);

    const outbreakAlerts = await Consultation.aggregate([
      {
        $match: {
          createdAt: { $gte: previousWeek }
        }
      },
      {
        $unwind: '$symptoms'
      },
      {
        $group: {
          _id: {
            symptom: '$symptoms',
            week: {
              $cond: [
                { $gte: ['$createdAt', currentWeek] },
                'current',
                'previous'
              ]
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.symptom',
          current_week: {
            $sum: {
              $cond: [{ $eq: ['$_id.week', 'current'] }, '$count', 0]
            }
          },
          previous_week: {
            $sum: {
              $cond: [{ $eq: ['$_id.week', 'previous'] }, '$count', 0]
            }
          }
        }
      },
      {
        $addFields: {
          increase_percentage: {
            $cond: [
              { $gt: ['$previous_week', 0] },
              {
                $multiply: [
                  {
                    $divide: [
                      { $subtract: ['$current_week', '$previous_week'] },
                      '$previous_week'
                    ]
                  },
                  100
                ]
              },
              { $cond: [{ $gt: ['$current_week', 0] }, 100, 0] }
            ]
          }
        }
      },
      {
        $match: {
          $and: [
            { current_week: { $gte: 3 } }, // At least 3 cases this week
            { increase_percentage: { $gte: 50 } } // 50% increase or more
          ]
        }
      },
      {
        $sort: { increase_percentage: -1 }
      }
    ]);

    // Get severity distribution
    const severityDistribution = await MedicalRecord.aggregate([
      {
        $match: {
          record_date: { $gte: startDate },
          severity_level: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$severity_level',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recovery time statistics
    const recoveryStats = await MedicalRecord.aggregate([
      {
        $match: {
          record_date: { $gte: startDate },
          follow_up_required: { $exists: true }
        }
      },
      {
        $group: {
          _id: null,
          total_cases: { $sum: 1 },
          follow_up_required: {
            $sum: { $cond: ['$follow_up_required', 1, 0] }
          },
          resolved_cases: {
            $sum: { $cond: [{ $eq: ['$follow_up_required', false] }, 1, 0] }
          }
        }
      }
    ]);

    // If no real data available, provide mock data for demonstration
    const hasRealData = confirmedDiagnoses.length > 0 || symptomTrends.length > 0 || dailyTrends.length > 0;
    
    if (!hasRealData) {
      // Generate mock data based on time range
      const mockDailyTrends = [];
      const mockConfirmedDiagnoses = [
        { _id: 'Malaria', count: 22, recent_cases: [] },
        { _id: 'Gastroenteritis (Food poisoning)', count: 18, recent_cases: [] },
        { _id: 'Upper Respiratory Tract Infection', count: 15, recent_cases: [] },
        { _id: 'Typhoid Fever', count: 12, recent_cases: [] },
        { _id: 'Stress-related Headaches', count: 11, recent_cases: [] },
        { _id: 'Skin Infections (Fungal)', count: 8, recent_cases: [] },
        { _id: 'Academic Stress & Anxiety', count: 7, recent_cases: [] },
        { _id: 'Urinary Tract Infection', count: 6, recent_cases: [] },
        { _id: 'Heat Exhaustion', count: 5, recent_cases: [] },
        { _id: 'Peptic Ulcer Disease', count: 4, recent_cases: [] }
      ];

      const mockSymptomTrends = [
        { _id: 'Fever', count: 28, recent_reports: [] },
        { _id: 'Headache', count: 25, recent_reports: [] },
        { _id: 'Fatigue/Weakness', count: 22, recent_reports: [] },
        { _id: 'Abdominal pain', count: 19, recent_reports: [] },
        { _id: 'Nausea/Vomiting', count: 16, recent_reports: [] },
        { _id: 'Diarrhea', count: 14, recent_reports: [] },
        { _id: 'Cough', count: 12, recent_reports: [] },
        { _id: 'Body aches/Joint pain', count: 11, recent_reports: [] },
        { _id: 'Loss of appetite', count: 9, recent_reports: [] },
        { _id: 'Skin rash/itching', count: 8, recent_reports: [] },
        { _id: 'Burning urination', count: 6, recent_reports: [] },
        { _id: 'Excessive sweating', count: 5, recent_reports: [] }
      ];

      const mockOutbreakAlerts = [
        {
          _id: 'Malaria-like symptoms',
          current_week: 12,
          previous_week: 4,
          increase_percentage: 200
        },
        {
          _id: 'Food poisoning symptoms',
          current_week: 8,
          previous_week: 3,
          increase_percentage: 167
        },
        {
          _id: 'Typhoid-like symptoms',
          current_week: 6,
          previous_week: 2,
          increase_percentage: 200
        }
      ];

      const mockSeverityDistribution = [
        { _id: 'low', count: 35 },
        { _id: 'medium', count: 18 },
        { _id: 'high', count: 7 },
        { _id: 'emergency', count: 2 }
      ];

      // Generate daily trends for the specified time range with realistic patterns
      let baseTotal = 8; // Base number of total cases
      let baseDiagnoses = 4; // Base number of confirmed diagnoses
      
      for (let i = parseInt(timeRange) - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Create realistic variation with some days having spikes
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const isSpike = Math.random() < 0.15; // 15% chance of a spike day
        
        let totalCases;
        let confirmedDiagnoses;
        
        if (isSpike) {
          // Spike days have significantly more cases
          totalCases = baseTotal + Math.floor(Math.random() * 12) + 5; // +5 to +17 cases
          confirmedDiagnoses = baseDiagnoses + Math.floor(Math.random() * 8) + 2; // +2 to +10 confirmed
        } else if (isWeekend) {
          // Weekends typically have fewer cases
          totalCases = Math.max(1, baseTotal - Math.floor(Math.random() * 4)); // -0 to -4 cases
          confirmedDiagnoses = Math.max(1, baseDiagnoses - Math.floor(Math.random() * 3)); // -0 to -3 confirmed
        } else {
          // Regular weekdays
          totalCases = baseTotal + Math.floor(Math.random() * 6) - 2; // -2 to +4 variation
          confirmedDiagnoses = baseDiagnoses + Math.floor(Math.random() * 4) - 1; // -1 to +3 variation
        }
        
        // Ensure confirmed diagnoses never exceed total cases
        confirmedDiagnoses = Math.min(confirmedDiagnoses, totalCases);
        
        mockDailyTrends.push({
          _id: { date: date.toISOString().split('T')[0] },
          total_cases: Math.max(1, totalCases),
          confirmed_diagnoses: Math.max(1, confirmedDiagnoses)
        });
        
        // Slight drift in base values for more realistic trends
        if (Math.random() < 0.3) {
          baseTotal += Math.random() > 0.5 ? 1 : -1;
          baseTotal = Math.max(3, Math.min(15, baseTotal)); // Keep between 3-15
        }
        if (Math.random() < 0.3) {
          baseDiagnoses += Math.random() > 0.5 ? 1 : -1;
          baseDiagnoses = Math.max(1, Math.min(baseTotal - 1, baseDiagnoses)); // Keep realistic
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          time_range: `${timeRange} days`,
          confirmed_diagnoses: mockConfirmedDiagnoses,
          symptom_trends: mockSymptomTrends,
          daily_trends: mockDailyTrends,
          outbreak_alerts: mockOutbreakAlerts,
          severity_distribution: mockSeverityDistribution,
          recovery_statistics: {
            total_cases: 108,
            follow_up_required: 25,
            resolved_cases: 83
          },
          summary: {
            total_confirmed_cases: 108,
            most_common_diagnosis: 'Malaria',
            most_common_symptom: 'Fever',
            active_outbreak_alerts: 3
          },
          is_mock_data: true
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        time_range: `${timeRange} days`,
        confirmed_diagnoses: confirmedDiagnoses,
        symptom_trends: symptomTrends,
        daily_trends: dailyTrends,
        outbreak_alerts: outbreakAlerts,
        severity_distribution: severityDistribution,
        recovery_statistics: recoveryStats[0] || {
          total_cases: 0,
          follow_up_required: 0,
          resolved_cases: 0
        },
        summary: {
          total_confirmed_cases: confirmedDiagnoses.reduce((sum, d) => sum + d.count, 0),
          most_common_diagnosis: confirmedDiagnoses[0]?._id || 'No data',
          most_common_symptom: symptomTrends[0]?._id || 'No data',
          active_outbreak_alerts: outbreakAlerts.length
        },
        is_mock_data: false
      }
    });

  } catch (error) {
    console.error('❌ Error fetching disease trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch disease trends data' },
      { status: 500 }
    );
  }
}