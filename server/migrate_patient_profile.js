const { pool } = require('./src/db');

async function migrate() {
  console.log('Running patient profile migration...');
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "PatientProfile" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER UNIQUE NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        age INTEGER,
        gender VARCHAR(50),
        "bloodGroup" VARCHAR(10),
        phone VARCHAR(50),
        address TEXT,
        "emergencyContact" VARCHAR(100),
        "medicalNotes" TEXT
      )
    `);
    console.log('Created PatientProfile table.');

    console.log('Migration successful!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    pool.end();
  }
}

migrate();
