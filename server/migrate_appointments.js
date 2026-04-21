const { pool } = require('./src/db');

async function migrateAppointments() {
  console.log('Creating Appointment table...');
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Appointment" (
        id SERIAL PRIMARY KEY,
        "patientId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        "hospitalId" INTEGER NOT NULL REFERENCES "Hospital"(id) ON DELETE CASCADE,
        "appointmentDate" DATE NOT NULL,
        "appointmentTime" TIME NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        reason TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Appointment table created successfully.');
  } catch (err) {
    console.error('Error creating Appointment table:', err);
  } finally {
    pool.end();
  }
}

migrateAppointments();
