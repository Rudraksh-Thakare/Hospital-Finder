const { query } = require('./src/db');
async function test() {
  try {
    const r1 = await query('SELECT COUNT(*) FROM "User"');
    console.log(r1.rows);
    const r3 = await query('SELECT COUNT(*) FROM "User" WHERE role = $1', ['PATIENT']);
    console.log(r3.rows);
    const r4 = await query('SELECT COUNT(*) FROM "Hospital" WHERE verified = false');
    console.log(r4.rows);
  } catch(e) {
    console.error('INNER ERROR:', e);
  }
}
test();
