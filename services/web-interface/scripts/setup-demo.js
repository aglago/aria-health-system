/**
 * Complete Demo Setup Script for UMaT ARIA Health System
 * Sets up all demo users and sample data for presentation
 */

const { seedDemoUsers } = require('./seed-demo-users');
const { seedDemoData } = require('./seed-demo-data');

async function setupDemo() {
  try {
    console.log('🚀 Setting up complete demo environment...\n');
    
    // Step 1: Create demo users
    console.log('👥 Step 1: Creating demo users...');
    await seedDemoUsers();
    
    console.log('\n📊 Step 2: Creating demo data...');
    await seedDemoData();
    
    console.log('\n🎉 DEMO SETUP COMPLETE!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎭 Demo Credentials (password: demo2024):');
    console.log('  📚 Students:');
    console.log('    • BS424100620 - Kwame Asante (Computer Science)');
    console.log('    • FOE456888102 - Esi Osei (Mining Engineering)');
    console.log('    • ENG202011045 - Yaw Boateng (Electrical Engineering)');
    console.log('  👩‍⚕️ Doctors:');
    console.log('    • UMAT-DOC-001 - Dr. Akosua Mensah (General Practitioner)');
    console.log('    • UMAT-DOC-002 - Dr. Kwaku Adjei (Internal Medicine)');
    console.log('    • UMAT-DOC-003 - Dr. Abena Frimpong (Psychiatrist)');
    
    console.log('\n🎯 Your presentation system is ready!');
    console.log('   1. Start the application: npm run dev');
    console.log('   2. Go to role selection page');
    console.log('   3. Use "Demo Student Login" or "Demo Doctor Login"');
    console.log('   4. Explore the rich demo data!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
  } catch (error) {
    console.error('❌ Demo setup failed:', error);
    process.exit(1);
  }
}

setupDemo();