const { pool } = require('./src/db');

async function migrateAppointmentDetails() {
  console.log('Adding patient detail columns to Appointment table...');
  try {
    await pool.query(`
      ALTER TABLE "Appointment" 
      ADD COLUMN IF NOT EXISTS "patientName" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "contactNumber" VARCHAR(50),
      ADD COLUMN IF NOT EXISTS "age" INTEGER,
      ADD COLUMN IF NOT EXISTS "gender" VARCHAR(20),
      ADD COLUMN IF NOT EXISTS "address" TEXT
    `);
    console.log('Successfully added patient detail columns.');
  } catch (err) {
    console.error('Error adding columns:', err);
  } finally {
    pool.end();
  }
}

migrateAppointmentDetails();
