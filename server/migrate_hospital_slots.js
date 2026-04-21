const { pool } = require('./src/db');

async function migrateHospitalSlots() {
  console.log('Creating HospitalSlot table...');
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "HospitalSlot" (
        id SERIAL PRIMARY KEY,
        "hospitalId" INTEGER NOT NULL REFERENCES "Hospital"(id) ON DELETE CASCADE,
        "slotDate" DATE NOT NULL,
        "slotTime" TIME NOT NULL,
        capacity INTEGER NOT NULL DEFAULT 1,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("hospitalId", "slotDate", "slotTime")
      )
    `);
    console.log('HospitalSlot table created successfully.');
  } catch (err) {
    console.error('Error creating HospitalSlot table:', err);
  } finally {
    pool.end();
  }
}

migrateHospitalSlots();
