const { pool } = require('./src/db');

async function migrate() {
  console.log('Running document migration...');
  try {
    // 1. Add shareToken to User
    await pool.query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "shareToken" VARCHAR(255) UNIQUE;`);
    console.log('Added shareToken to User table.');

    // 2. Create MedicalDocument table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "MedicalDocument" (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        "fileUrl" TEXT NOT NULL,
        "fileType" VARCHAR(100),
        "uploadedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Created MedicalDocument table.');

    console.log('Migration successful!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    pool.end();
  }
}

migrate();
