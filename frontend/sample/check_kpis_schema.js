import { pool } from './server/db.js';

async function checkSchemas() {
  for (const tbl of ['daily_store_kpis', 'district_kpis', 'region_kpis', 'corporate_kpis']) {
    const cols = await pool.query('SELECT column_name FROM information_schema.columns WHERE table_name = $1', [tbl]);
    console.log(`Table: ${tbl}`);
    console.log(cols.rows.map(r => r.column_name));
    console.log('-------------------');
  }
  await pool.end();
}

checkSchemas();
