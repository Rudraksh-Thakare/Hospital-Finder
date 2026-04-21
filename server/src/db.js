const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// A helper specifically to make parameterized query logic simpler
const query = (text, params) => pool.query(text, params);

module.exports = {
  pool,
  query,
};
