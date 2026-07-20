import { pool } from './server/db.js';

async function verifyLivePostgres() {
  console.log('===========================================================');
  console.log('   LIVE POSTGRESQL DATABASE VERIFICATION (restaurant_portal)');
  console.log('===========================================================\n');

  const tables = ['daily_store_kpis', 'district_kpis', 'region_kpis', 'corporate_kpis'];

  for (const tbl of tables) {
    const countRes = await pool.query(`SELECT count(*) FROM ${tbl}`);
    const revRes = await pool.query(`SELECT SUM(total_revenue) as rev, SUM(total_orders) as orders FROM ${tbl}`);
    const sampleRes = await pool.query(`SELECT * FROM ${tbl} ORDER BY kpi_date DESC LIMIT 1`);

    console.log(`📌 TABLE: ${tbl}`);
    console.log(`   • Total Rows in PostgreSQL: ${countRes.rows[0].count}`);
    console.log(`   • Aggregated Total Revenue: ₹${parseFloat(revRes.rows[0].rev || 0).toLocaleString('en-IN')}`);
    console.log(`   • Aggregated Total Orders : ${revRes.rows[0].orders}`);
    if (sampleRes.rows.length > 0) {
      console.log(`   • Latest Record Sample    : ID ${sampleRes.rows[0].kpi_id || sampleRes.rows[0].id} | Date ${sampleRes.rows[0].kpi_date.toISOString().split('T')[0]} | Rev ₹${sampleRes.rows[0].total_revenue}`);
    }
    console.log('-----------------------------------------------------------');
  }

  await pool.end();
}

verifyLivePostgres();
