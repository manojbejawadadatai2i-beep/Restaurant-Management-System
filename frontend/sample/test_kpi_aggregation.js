import { pool } from './server/db.js';

export const aggregateAllKpis = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Aggregate daily_store_kpis -> district_kpis
    const res1 = await client.query(`
      INSERT INTO district_kpis (
        district_id,
        kpi_date,
        total_stores,
        active_stores,
        total_revenue,
        total_orders,
        average_order_value,
        customer_count,
        cancelled_orders,
        created_at,
        updated_at
      )
      SELECT 
        s.district_id,
        k.kpi_date,
        COUNT(DISTINCT s.id) AS total_stores,
        COUNT(DISTINCT CASE WHEN k.total_orders > 0 THEN s.id END) AS active_stores,
        COALESCE(SUM(k.total_revenue), 0) AS total_revenue,
        COALESCE(SUM(k.total_orders), 0) AS total_orders,
        CASE 
          WHEN COALESCE(SUM(k.total_orders), 0) > 0 
          THEN ROUND(COALESCE(SUM(k.total_revenue), 0) / SUM(k.total_orders), 2)
          ELSE 0 
        END AS average_order_value,
        COALESCE(SUM(k.customer_count), 0) AS customer_count,
        COALESCE(SUM(k.cancelled_orders), 0) AS cancelled_orders,
        NOW() AS created_at,
        NOW() AS updated_at
      FROM daily_store_kpis k
      JOIN stores s ON k.store_id = s.id
      WHERE s.district_id IS NOT NULL
      GROUP BY s.district_id, k.kpi_date
      ON CONFLICT (district_id, kpi_date) DO UPDATE SET
        total_stores = EXCLUDED.total_stores,
        active_stores = EXCLUDED.active_stores,
        total_revenue = EXCLUDED.total_revenue,
        total_orders = EXCLUDED.total_orders,
        average_order_value = EXCLUDED.average_order_value,
        customer_count = EXCLUDED.customer_count,
        cancelled_orders = EXCLUDED.cancelled_orders,
        updated_at = NOW();
    `);

    // 2. Aggregate district_kpis -> region_kpis
    const res2 = await client.query(`
      INSERT INTO region_kpis (
        region_id,
        kpi_date,
        total_districts,
        total_stores,
        active_stores,
        total_revenue,
        total_orders,
        average_order_value,
        customer_count,
        cancelled_orders,
        created_at,
        updated_at
      )
      SELECT 
        d.region_id,
        dk.kpi_date,
        COUNT(DISTINCT d.id) AS total_districts,
        COALESCE(SUM(dk.total_stores), 0) AS total_stores,
        COALESCE(SUM(dk.active_stores), 0) AS active_stores,
        COALESCE(SUM(dk.total_revenue), 0) AS total_revenue,
        COALESCE(SUM(dk.total_orders), 0) AS total_orders,
        CASE 
          WHEN COALESCE(SUM(dk.total_orders), 0) > 0 
          THEN ROUND(COALESCE(SUM(dk.total_revenue), 0) / SUM(dk.total_orders), 2)
          ELSE 0 
        END AS average_order_value,
        COALESCE(SUM(dk.customer_count), 0) AS customer_count,
        COALESCE(SUM(dk.cancelled_orders), 0) AS cancelled_orders,
        NOW() AS created_at,
        NOW() AS updated_at
      FROM district_kpis dk
      JOIN districts d ON dk.district_id = d.id
      WHERE d.region_id IS NOT NULL
      GROUP BY d.region_id, dk.kpi_date
      ON CONFLICT (region_id, kpi_date) DO UPDATE SET
        total_districts = EXCLUDED.total_districts,
        total_stores = EXCLUDED.total_stores,
        active_stores = EXCLUDED.active_stores,
        total_revenue = EXCLUDED.total_revenue,
        total_orders = EXCLUDED.total_orders,
        average_order_value = EXCLUDED.average_order_value,
        customer_count = EXCLUDED.customer_count,
        cancelled_orders = EXCLUDED.cancelled_orders,
        updated_at = NOW();
    `);

    // 3. Aggregate region_kpis -> corporate_kpis
    const res3 = await client.query(`
      INSERT INTO corporate_kpis (
        corporate_id,
        kpi_date,
        total_regions,
        total_districts,
        total_stores,
        active_stores,
        total_revenue,
        total_expenses,
        total_orders,
        average_order_value,
        customer_count,
        cancelled_orders,
        created_at,
        updated_at
      )
      SELECT 
        1 AS corporate_id,
        rk.kpi_date,
        COUNT(DISTINCT rk.region_id) AS total_regions,
        COALESCE(SUM(rk.total_districts), 0) AS total_districts,
        COALESCE(SUM(rk.total_stores), 0) AS total_stores,
        COALESCE(SUM(rk.active_stores), 0) AS active_stores,
        COALESCE(SUM(rk.total_revenue), 0) AS total_revenue,
        ROUND(COALESCE(SUM(rk.total_revenue), 0) * 0.58, 2) AS total_expenses,
        COALESCE(SUM(rk.total_orders), 0) AS total_orders,
        CASE 
          WHEN COALESCE(SUM(rk.total_orders), 0) > 0 
          THEN ROUND(COALESCE(SUM(rk.total_revenue), 0) / SUM(rk.total_orders), 2)
          ELSE 0 
        END AS average_order_value,
        COALESCE(SUM(rk.customer_count), 0) AS customer_count,
        COALESCE(SUM(rk.cancelled_orders), 0) AS cancelled_orders,
        NOW() AS created_at,
        NOW() AS updated_at
      FROM region_kpis rk
      GROUP BY rk.kpi_date
      ON CONFLICT (corporate_id, kpi_date) DO UPDATE SET
        total_regions = EXCLUDED.total_regions,
        total_districts = EXCLUDED.total_districts,
        total_stores = EXCLUDED.total_stores,
        active_stores = EXCLUDED.active_stores,
        total_revenue = EXCLUDED.total_revenue,
        total_expenses = EXCLUDED.total_expenses,
        total_orders = EXCLUDED.total_orders,
        average_order_value = EXCLUDED.average_order_value,
        customer_count = EXCLUDED.customer_count,
        cancelled_orders = EXCLUDED.cancelled_orders,
        updated_at = NOW();
    `);

    await client.query('COMMIT');
    console.log(`✓ Aggregation pipeline executed successfully.`);
    console.log(`  - District KPIs updated: ${res1.rowCount} rows`);
    console.log(`  - Region KPIs updated: ${res2.rowCount} rows`);
    console.log(`  - Corporate KPIs updated: ${res3.rowCount} rows`);
    return { success: true };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error executing KPI aggregation pipeline:', err);
    throw err;
  } finally {
    client.release();
  }
};

if (process.argv[1] && process.argv[1].includes('test_kpi_aggregation')) {
  (async () => {
    await aggregateAllKpis();
    await pool.end();
  })();
}
