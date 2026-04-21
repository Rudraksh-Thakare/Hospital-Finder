const { pool } = require('./src/db');

async function migrateDynamicSlots() {
  console.log('Adding dynamic slot columns to Hospital table...');
  try {
    await pool.query(`
      ALTER TABLE "Hospital" 
      ADD COLUMN IF NOT EXISTS "openingTime" TIME DEFAULT '09:00:00',
      ADD COLUMN IF NOT EXISTS "closingTime" TIME DEFAULT '17:00:00',
      ADD COLUMN IF NOT EXISTS "slotDuration" INTEGER DEFAULT 60,
      ADD COLUMN IF NOT EXISTS "slotCapacity" INTEGER DEFAULT 5
    `);
    console.log('Successfully added slot configuration columns.');
  } catch (err) {
    console.error('Error adding columns:', err);
  } finally {
    pool.end();
  }
}

migrateDynamicSlots();
