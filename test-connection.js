const db = require('./models');

async function testConnection() {
  try {
    const count = await db.Prescription.count();
    console.log(`✅ Connection successful! You have ${count} prescriptions in your database.`);
    
    const prescription = await db.Prescription.findOne({
      include: [db.Patient, db.Medication]
    });
    if (prescription) {
      console.log('✅ Model associations are working correctly. Sample prescription found.');
    } else {
      console.log('⚠️ Database is empty – no prescriptions to test associations.');
    }
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  }
}

async function main() {
  await testConnection();
  console.log('✨ Done.');
}

main();