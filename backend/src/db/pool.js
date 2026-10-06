const { Pool } = require('pg');
const { databaseUrl } = require('../config/env');
const pool = new Pool({ connectionString: databaseUrl });

async function tx(fn) {
  const c = await pool.connect();
  try {
    await c.query('BEGIN');
    const result = await fn(c);
    await c.query('COMMIT');
    return result;
  } catch (e) {
    await c.query('ROLLBACK');
    throw e;
  } finally {
    c.release();
  }
}

module.exports = { pool, query: (text, params) => pool.query(text, params), tx };