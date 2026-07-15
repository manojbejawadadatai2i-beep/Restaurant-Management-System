import { pool } from './server/db.js';

async function check() {
  try {
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('TABLES IN DB:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    pool.end();
  }
}

check();
