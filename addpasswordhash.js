const db = require('./models');

async function addpasswordhash() {
  const updates = [
    { table: 'patients', id: 'P1', hash: '$2a$12$ujGabt5jrIQKyJJ7wl4uOexOcLAiQVczu2W56FskhiXTh8qMjhoYy' },
    { table: 'patients', id: 'P2', hash: '$2a$12$bM2UxYUrIK78s2r2lZmgNOFM1mxlKKo2nW62RqCjr1wYCx8kVjHse' },
    { table: 'patients', id: 'P3', hash: '$2a$12$6ltxKzX9DcTNqqCmTWudJOMb5twjvVZu9AewZCQhbEzbsTgiAHHC2' },
    { table: 'patients', id: 'P4', hash: '$2a$12$Vr.3ARvh4m/baOo1NKCBI.d8eI0lk5ZgUWzt9Gxk/vI3JjTMcRtDO' },
    { table: 'prescribers', name: 'Dr. Mohsin Khan', hash: '$2a$12$c4SuVJmKRtk0AJW5WpETJODZ82eCb5WC921llwf53D9Gtc2aWMzxe' },
    { table: 'prescribers', name: 'Dr. ALi Nazam', hash: '$2a$12$BOtYPJ.4.auHaNOmHjZj9evp7c5kqqYJvr3Hg9EPGgZLR5lWVYQOO' },
    { table: 'prescribers', name: 'Dr. Munir Akhtar', hash: '$2a$12$V9OF0uniDyT7o7GW.b91vei/ra3otoLGhmGo0sLDRtfPBDmGecHLS' },
    { table: 'prescribers', name: 'Dr. Jamil Ahmed', hash: '$2a$12$ZTGZY08ZbluBjr3/qgErPerxMCC6qyIn.V6quSzt.d6FOjR1gxGEO' },
  ];

  try {
    for (const upd of updates) {
      let sql;
      if (upd.table === 'patients') {
        sql = `UPDATE patients SET password_hash = '${upd.hash}' WHERE patient_id = '${upd.id}';`;
      } else {
        sql = `UPDATE prescribers SET password_hash = '${upd.hash}' WHERE name = '${upd.name}';`;
      }
      await db.sequelize.query(sql);
      console.log(`✅ Updated ${upd.table} record`);
    }
    console.log('✅ All password hashes updated successfully.');
  } catch (error) {
    console.error('❌ Update failed:', error);
  } finally {
    await db.sequelize.close();
  }
}

addpasswordhash();