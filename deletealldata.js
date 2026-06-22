const db = require('./src/models');

async function deletealldata() {
  try {
    await db.sequelize.query(`
      TRUNCATE TABLE caretaker;
    `);
    console.log('✅ Cartaker is deleted.');
  } catch (error) {
    console.error('❌ Failed to clear data:', error);
  } finally {
    await db.sequelize.close();
  }
}

deletealldata();