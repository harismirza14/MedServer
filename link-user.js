const db = require('./src/models');
const bcrypt = require('bcrypt');

async function linkUsers() {
  try {
    const sequelize = db.sequelize;

    // 1. Find patients without user_id
    const patientsWithoutUser = await sequelize.query(`
      SELECT patient_id, name, email, dob, address, gender, phone_number, password_hash
      FROM patients
      WHERE user_id IS NULL
    `, { type: sequelize.QueryTypes.SELECT });

    console.log(`Found ${patientsWithoutUser.length} patients without user_id.`);

    for (const p of patientsWithoutUser) {
      // Use existing email if available, else generate one
      const email = p.email || `${p.patient_id}@system.local`;
      // Use existing password_hash if available, else create a default hash (for "password")
      let passwordHash = p.password_hash;
      if (!passwordHash) {
        passwordHash = await bcrypt.hash('password', 10);
      }
      // Insert user
      const [user] = await sequelize.query(`
        INSERT INTO users (email, password_hash, name, phone_number, role, dob, address, gender)
        VALUES (:email, :passwordHash, :name, :phoneNumber, 'patient', :dob, :address, :gender)
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
        RETURNING user_id
      `, {
        replacements: {
          email,
          passwordHash,
          name: p.name,
          phoneNumber: p.phone_number || null,
          dob: p.dob || null,
          address: p.address || null,
          gender: p.gender || null,
        },
        type: sequelize.QueryTypes.SELECT,
      });

      // Update patient with user_id
      await sequelize.query(`
        UPDATE patients SET user_id = :userId WHERE patient_id = :patientId
      `, {
        replacements: { userId: user.user_id, patientId: p.patient_id },
      });
      console.log(`Linked patient ${p.patient_id} with user ${user.user_id}`);
    }

    // 2. Find prescribers without user_id
    const prescribersWithoutUser = await sequelize.query(`
      SELECT prescriber_id, name, email, dob, address, gender, phone_number, password_hash
      FROM prescribers
      WHERE user_id IS NULL
    `, { type: sequelize.QueryTypes.SELECT });

    console.log(`Found ${prescribersWithoutUser.length} prescribers without user_id.`);

    for (const p of prescribersWithoutUser) {
      const email = p.email || `doc${p.prescriber_id}@system.local`;
      let passwordHash = p.password_hash;
      if (!passwordHash) {
        passwordHash = await bcrypt.hash('password', 10);
      }
      const [user] = await sequelize.query(`
        INSERT INTO users (email, password_hash, name, phone_number, role, dob, address, gender)
        VALUES (:email, :passwordHash, :name, :phoneNumber, 'doctor', :dob, :address, :gender)
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
        RETURNING user_id
      `, {
        replacements: {
          email,
          passwordHash,
          name: p.name,
          phoneNumber: p.phone_number || null,
          dob: p.dob || null,
          address: p.address || null,
          gender: p.gender || null,
        },
        type: sequelize.QueryTypes.SELECT,
      });

      await sequelize.query(`
        UPDATE prescribers SET user_id = :userId WHERE prescriber_id = :prescriberId
      `, {
        replacements: { userId: user.user_id, prescriberId: p.prescriber_id },
      });
      console.log(`Linked prescriber ${p.prescriber_id} with user ${user.user_id}`);
    }

    console.log('✅ All missing users created and linked.');
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await db.sequelize.close();
  }
}

linkUsers();