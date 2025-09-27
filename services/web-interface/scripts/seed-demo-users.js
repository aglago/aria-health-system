/**
 * Demo Users Seeding Script for UMaT ARIA Health System
 * Creates realistic demo users for presentation purposes
 */

const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aria-health-system';

const demoUsers = [
  // Demo Students
  {
    student_id: 'BS424100620',
    name: 'Kwame Asante',
    email: 'kwame.asante@student.umat.edu.gh',
    password: 'demo2024',
    role: 'student',
    institution: 'University of Mines and Technology',
    program: 'Computer Science and Engineering',
    level: '400',
    phone: '+233-24-123-4567',
    date_of_birth: '2002-03-15',
    emergency_contact: {
      name: 'Ama Asante',
      relationship: 'Mother',
      phone: '+233-20-765-4321'
    }
  },
  {
    student_id: 'FOE456888102',
    name: 'Esi Osei',
    email: 'esi.osei@student.umat.edu.gh',
    password: 'demo2024',
    role: 'student',
    institution: 'University of Mines and Technology',
    program: 'Mining Engineering',
    level: '300',
    phone: '+233-24-987-6543',
    date_of_birth: '2003-07-22',
    emergency_contact: {
      name: 'Kofi Osei',
      relationship: 'Father',
      phone: '+233-24-345-6789'
    }
  },
  {
    student_id: 'ENG202011045',
    name: 'Yaw Boateng',
    email: 'yaw.boateng@student.umat.edu.gh',
    password: 'demo2024',
    role: 'student',
    institution: 'University of Mines and Technology',
    program: 'Electrical Engineering',
    level: '200',
    phone: '+233-55-234-5678',
    date_of_birth: '2004-11-08',
    emergency_contact: {
      name: 'Akosua Boateng',
      relationship: 'Mother',
      phone: '+233-24-567-8901'
    }
  },
  
  // Additional Students
  {
    student_id: 'GEO789123456',
    name: 'Akosua Adjei',
    email: 'akosua.adjei@student.umat.edu.gh',
    password: 'demo2024',
    role: 'student',
    institution: 'University of Mines and Technology',
    program: 'Geomatic Engineering',
    level: '400',
    phone: '+233-24-789-1234',
    date_of_birth: '2002-05-18',
    emergency_contact: {
      name: 'Kwame Adjei',
      relationship: 'Father',
      phone: '+233-24-987-6543'
    }
  },
  {
    student_id: 'MET321654987',
    name: 'Kofi Mensah',
    email: 'kofi.mensah@student.umat.edu.gh',
    password: 'demo2024',
    role: 'student',
    institution: 'University of Mines and Technology',
    program: 'Metallurgical Engineering',
    level: '300',
    phone: '+233-55-321-6549',
    date_of_birth: '2003-09-12',
    emergency_contact: {
      name: 'Ama Mensah',
      relationship: 'Mother',
      phone: '+233-20-654-3210'
    }
  },
  {
    student_id: 'PET147258369',
    name: 'Ama Darko',
    email: 'ama.darko@student.umat.edu.gh',
    password: 'demo2024',
    role: 'student',
    institution: 'University of Mines and Technology',
    program: 'Petroleum Engineering',
    level: '200',
    phone: '+233-24-147-2583',
    date_of_birth: '2004-02-28',
    emergency_contact: {
      name: 'Yaw Darko',
      relationship: 'Father',
      phone: '+233-24-369-2581'
    }
  },
  {
    student_id: 'CIV963852741',
    name: 'Kwadwo Nyong',
    email: 'kwadwo.nyong@student.umat.edu.gh',
    password: 'demo2024',
    role: 'student',
    institution: 'University of Mines and Technology',
    program: 'Civil Engineering',
    level: '400',
    phone: '+233-26-963-8527',
    date_of_birth: '2002-08-15',
    emergency_contact: {
      name: 'Efua Nyong',
      relationship: 'Mother',
      phone: '+233-24-741-9638'
    }
  },
  {
    student_id: 'CHE159357486',
    name: 'Akua Frimpong',
    email: 'akua.frimpong@student.umat.edu.gh',
    password: 'demo2024',
    role: 'student',
    institution: 'University of Mines and Technology',
    program: 'Chemical Engineering',
    level: '300',
    phone: '+233-55-159-3574',
    date_of_birth: '2003-12-03',
    emergency_contact: {
      name: 'Kofi Frimpong',
      relationship: 'Father',
      phone: '+233-20-486-1593'
    }
  },
  {
    student_id: 'ENV486231759',
    name: 'Nana Owusu',
    email: 'nana.owusu@student.umat.edu.gh',
    password: 'demo2024',
    role: 'student',
    institution: 'University of Mines and Technology',
    program: 'Environmental Engineering',
    level: '200',
    phone: '+233-24-486-2317',
    date_of_birth: '2004-06-20',
    emergency_contact: {
      name: 'Adwoa Owusu',
      relationship: 'Mother',
      phone: '+233-26-759-4862'
    }
  },
  {
    student_id: 'AGR753951426',
    name: 'Efua Asare',
    email: 'efua.asare@student.umat.edu.gh',
    password: 'demo2024',
    role: 'student',
    institution: 'University of Mines and Technology',
    program: 'Agricultural Engineering',
    level: '400',
    phone: '+233-55-753-9514',
    date_of_birth: '2002-01-14',
    emergency_contact: {
      name: 'Kwame Asare',
      relationship: 'Father',
      phone: '+233-24-426-7539'
    }
  },
  {
    student_id: 'ELE852741963',
    name: 'Kojo Antwi',
    email: 'kojo.antwi@student.umat.edu.gh',
    password: 'demo2024',
    role: 'student',
    institution: 'University of Mines and Technology',
    program: 'Electrical Engineering',
    level: '300',
    phone: '+233-26-852-7419',
    date_of_birth: '2003-04-07',
    emergency_contact: {
      name: 'Ama Antwi',
      relationship: 'Mother',
      phone: '+233-55-963-8527'
    }
  },
  {
    student_id: 'MEC741852963',
    name: 'Abena Kusi',
    email: 'abena.kusi@student.umat.edu.gh',
    password: 'demo2024',
    role: 'student',
    institution: 'University of Mines and Technology',
    program: 'Mechanical Engineering',
    level: '200',
    phone: '+233-24-741-8529',
    date_of_birth: '2004-10-25',
    emergency_contact: {
      name: 'Yaw Kusi',
      relationship: 'Father',
      phone: '+233-20-963-7418'
    }
  },
  {
    student_id: 'MIN369258147',
    name: 'Yaa Bonsu',
    email: 'yaa.bonsu@student.umat.edu.gh',
    password: 'demo2024',
    role: 'student',
    institution: 'University of Mines and Technology',
    program: 'Mining Engineering',
    level: '400',
    phone: '+233-55-369-2581',
    date_of_birth: '2002-07-11',
    emergency_contact: {
      name: 'Kwaku Bonsu',
      relationship: 'Father',
      phone: '+233-24-147-3692'
    }
  },

  // Demo Doctors
  {
    doctor_id: 'UMAT-DOC-001',
    name: 'Dr. Akosua Mensah',
    email: 'akosua.mensah@umat.edu.gh',
    password: 'demo2024',
    role: 'doctor',
    institution: 'University of Mines and Technology',
    specialization: 'general-practitioner',
    license_number: 'GMA-12345',
    phone: '+233-30-200-1001',
    years_experience: 8,
    department: 'UMaT Health Center',
    office_location: 'Health Center Block A, Room 101'
  },
  {
    doctor_id: 'UMAT-DOC-002',
    name: 'Dr. Kwaku Adjei',
    email: 'kwaku.adjei@umat.edu.gh',
    password: 'demo2024',
    role: 'doctor',
    institution: 'University of Mines and Technology',
    specialization: 'internal-medicine',
    license_number: 'GMA-67890',
    phone: '+233-30-200-1002',
    years_experience: 12,
    department: 'UMaT Health Center',
    office_location: 'Health Center Block A, Room 102'
  },
  {
    doctor_id: 'UMAT-DOC-003',
    name: 'Dr. Abena Frimpong',
    email: 'abena.frimpong@umat.edu.gh',
    password: 'demo2024',
    role: 'doctor',
    institution: 'University of Mines and Technology',
    specialization: 'psychiatrist',
    license_number: 'GMA-54321',
    phone: '+233-30-200-1003',
    years_experience: 6,
    department: 'UMaT Health Center - Mental Health',
    office_location: 'Health Center Block B, Room 201'
  }
];

async function seedDemoUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🌱 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db();
    const usersCollection = db.collection('users');
    
    console.log('🔐 Hashing passwords...');
    
    // Hash passwords for all users
    for (const user of demoUsers) {
      user.password = await bcrypt.hash(user.password, 12);
      user.createdAt = new Date();
      user.updatedAt = new Date();
    }
    
    console.log('🗑️ Clearing existing demo users...');
    
    // Remove existing demo users
    const demoStudentIds = demoUsers.filter(u => u.role === 'student').map(u => u.student_id);
    const demoDoctorIds = demoUsers.filter(u => u.role === 'doctor').map(u => u.doctor_id);
    
    await usersCollection.deleteMany({
      $or: [
        { student_id: { $in: demoStudentIds } },
        { doctor_id: { $in: demoDoctorIds } }
      ]
    });
    
    console.log('👥 Inserting demo users...');
    
    // Insert demo users
    const result = await usersCollection.insertMany(demoUsers);
    
    console.log('✅ Demo users seeded successfully!');
    console.log(`📊 Inserted ${result.insertedCount} users:`);
    
    console.log('\n📚 Demo Students:');
    demoUsers.filter(u => u.role === 'student').forEach(student => {
      console.log(`  • ${student.name} (${student.student_id}) - ${student.program}`);
    });
    
    console.log('\n👩‍⚕️ Demo Doctors:');
    demoUsers.filter(u => u.role === 'doctor').forEach(doctor => {
      console.log(`  • ${doctor.name} (${doctor.doctor_id}) - ${doctor.specialization}`);
    });
    
    console.log('\n🔑 Demo Credentials:');
    console.log('Password for all demo accounts: demo2024');
    
    console.log('\n🎯 Ready for presentation!');
    
  } catch (error) {
    console.error('❌ Error seeding demo users:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeder
if (require.main === module) {
  seedDemoUsers();
}

module.exports = { seedDemoUsers, demoUsers };