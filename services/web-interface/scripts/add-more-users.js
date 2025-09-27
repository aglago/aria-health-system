/**
 * Add More Users to Database
 * Creates additional students and doctors for comprehensive demo
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aria-health-system';

// Additional students for UMaT
const additionalStudents = [
  {
    student_id: 'GEO789123456',
    name: 'Akosua Adjei',
    email: 'akosua.adjei@student.umat.edu.gh',
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
  }
];

// Additional doctors
const additionalDoctors = [
  {
    doctor_id: 'UMAT-DOC-006',
    name: 'Dr. Nana Agyei',
    email: 'nana.agyei@umat.edu.gh',
    role: 'doctor',
    institution: 'University of Mines and Technology',
    specialization: 'orthopedic-surgery',
    license_number: 'GMA-006-2018',
    years_experience: 8,
    phone: '+233-24-111-6666',
    department: 'Orthopedics'
  },
  {
    doctor_id: 'UMAT-DOC-007',
    name: 'Dr. Kwesi Boateng',
    email: 'kwesi.boateng@umat.edu.gh',
    role: 'doctor',
    institution: 'University of Mines and Technology',
    specialization: 'dermatology',
    license_number: 'GMA-007-2017',
    years_experience: 9,
    phone: '+233-26-222-7777',
    department: 'Dermatology'
  },
  {
    doctor_id: 'UMAT-DOC-008',
    name: 'Dr. Adjoa Asante',
    email: 'adjoa.asante@umat.edu.gh',
    role: 'doctor',
    institution: 'University of Mines and Technology',
    specialization: 'ophthalmology',
    license_number: 'GMA-008-2019',
    years_experience: 6,
    phone: '+233-55-333-8888',
    department: 'Ophthalmology'
  }
];

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

async function addMoreUsers() {
  try {
    // Import User model
    const User = require('../src/models/User').default;
    
    console.log('👥 Adding additional students...');
    
    // Hash password for all users
    const hashedPassword = await bcrypt.hash('demo2024', 12);
    
    // Add students
    for (const studentData of additionalStudents) {
      const existingStudent = await User.findOne({ student_id: studentData.student_id });
      if (!existingStudent) {
        const student = new User({
          ...studentData,
          password: hashedPassword
        });
        await student.save();
        console.log(`✅ Added student: ${studentData.name} (${studentData.student_id})`);
      } else {
        console.log(`⚠️ Student already exists: ${studentData.name} (${studentData.student_id})`);
      }
    }
    
    console.log('👩‍⚕️ Adding additional doctors...');
    
    // Add doctors
    for (const doctorData of additionalDoctors) {
      const existingDoctor = await User.findOne({ doctor_id: doctorData.doctor_id });
      if (!existingDoctor) {
        const doctor = new User({
          ...doctorData,
          password: hashedPassword
        });
        await doctor.save();
        console.log(`✅ Added doctor: ${doctorData.name} (${doctorData.doctor_id})`);
      } else {
        console.log(`⚠️ Doctor already exists: ${doctorData.name} (${doctorData.doctor_id})`);
      }
    }
    
    console.log('📊 User statistics:');
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    console.log(`   📚 Total students: ${totalStudents}`);
    console.log(`   👩‍⚕️ Total doctors: ${totalDoctors}`);
    
    console.log('✅ Additional users added successfully!');
    
  } catch (error) {
    console.error('❌ Error adding users:', error);
    throw error;
  }
}

async function runUserAddition() {
  try {
    await connectToDatabase();
    await addMoreUsers();
    console.log('🎉 User addition completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ User addition failed:', error);
    process.exit(1);
  }
}

// Export for use in other scripts
module.exports = { addMoreUsers };

// Run if executed directly
if (require.main === module) {
  runUserAddition();
}