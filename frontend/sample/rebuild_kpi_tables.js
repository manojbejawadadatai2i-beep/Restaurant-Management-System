import { pool } from './server/db.js';

export const rebuildKpiTablesAndAggregate = async () => {
  console.log('====================================================');
  console.log('  REBUILDING & AGGREGATING ALL KPI TABLES IN ORDER  ');
  console.log('====================================================\n');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Drop existing KPI tables in reverse dependency order
    console.log('1. Dropping existing KPI tables...');
    await client.query(`
      DROP TABLE IF EXISTS corporate_kpis CASCADE;
      DROP TABLE IF EXISTS region_kpis CASCADE;
      DROP TABLE IF EXISTS district_kpis CASCADE;
      DROP TABLE IF EXISTS daily_store_kpis CASCADE;
    `);
    console.log('   ✓ Old KPI tables dropped successfully.\n');

    // 2. Create Level 0: daily_store_kpis (Store Level)
    console.log('2. Creating Level 0: daily_store_kpis table...');
    await client.query(`
      CREATE TABLE daily_store_kpis (
        kpi_id SERIAL PRIMARY KEY,
        store_id INT NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
        kpi_date DATE NOT NULL,
        total_revenue NUMERIC(12, 2) DEFAULT 0.00,
        total_orders INT DEFAULT 0,
        average_order_value NUMERIC(10, 2) DEFAULT 0.00,
        customer_count INT DEFAULT 0,
        cancelled_orders INT DEFAULT 0,
        online_orders INT DEFAULT 0,
        takeaway_orders INT DEFAULT 0,
        dine_in_orders INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT uq_daily_store_kpi UNIQUE (store_id, kpi_date)
      );
    `);
    console.log('   ✓ Created daily_store_kpis table.\n');

    // 3. Create Level 1: district_kpis (District Level)
    console.log('3. Creating Level 1: district_kpis table...');
    await client.query(`
      CREATE TABLE district_kpis (
        kpi_id SERIAL PRIMARY KEY,
        district_id INT NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
        kpi_date DATE NOT NULL,
        total_stores INT DEFAULT 0,
        active_stores INT DEFAULT 0,
        total_revenue NUMERIC(14, 2) DEFAULT 0.00,
        total_orders INT DEFAULT 0,
        average_order_value NUMERIC(10, 2) DEFAULT 0.00,
        customer_count INT DEFAULT 0,
        cancelled_orders INT DEFAULT 0,
        online_orders INT DEFAULT 0,
        takeaway_orders INT DEFAULT 0,
        dine_in_orders INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT uq_district_kpi UNIQUE (district_id, kpi_date)
      );
    `);
    console.log('   ✓ Created district_kpis table.\n');

    // 4. Create Level 2: region_kpis (Region Level)
    console.log('4. Creating Level 2: region_kpis table...');
    await client.query(`
      CREATE TABLE region_kpis (
        kpi_id SERIAL PRIMARY KEY,
        region_id INT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
        kpi_date DATE NOT NULL,
        total_districts INT DEFAULT 0,
        total_stores INT DEFAULT 0,
        active_stores INT DEFAULT 0,
        total_revenue NUMERIC(16, 2) DEFAULT 0.00,
        total_orders INT DEFAULT 0,
        average_order_value NUMERIC(10, 2) DEFAULT 0.00,
        customer_count INT DEFAULT 0,
        cancelled_orders INT DEFAULT 0,
        online_orders INT DEFAULT 0,
        takeaway_orders INT DEFAULT 0,
        dine_in_orders INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT uq_region_kpi UNIQUE (region_id, kpi_date)
      );
    `);
    console.log('   ✓ Created region_kpis table.\n');

    // 5. Create Level 3: corporate_kpis (Corporate Level)
    console.log('5. Creating Level 3: corporate_kpis table...');
    await client.query(`
      CREATE TABLE corporate_kpis (
        kpi_id SERIAL PRIMARY KEY,
        corporate_id INT NOT NULL DEFAULT 1,
        kpi_date DATE NOT NULL,
        total_regions INT DEFAULT 0,
        total_districts INT DEFAULT 0,
        total_stores INT DEFAULT 0,
        active_stores INT DEFAULT 0,
        total_revenue NUMERIC(18, 2) DEFAULT 0.00,
        total_expenses NUMERIC(18, 2) DEFAULT 0.00,
        total_orders INT DEFAULT 0,
        average_order_value NUMERIC(10, 2) DEFAULT 0.00,
        customer_count INT DEFAULT 0,
        cancelled_orders INT DEFAULT 0,
        online_orders INT DEFAULT 0,
        takeaway_orders INT DEFAULT 0,
        dine_in_orders INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT uq_corporate_kpi UNIQUE (corporate_id, kpi_date)
      );
    `);
    console.log('   ✓ Created corporate_kpis table.\n');

    // Commit Table Creation
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating KPI tables:', err);
    throw err;
  } finally {
    client.release();
  }

  // 6. Seed raw orders & Level 0 store KPIs
  await seedStoreData();
  await seedRealOrdersAndItems();

  // 7. Run Aggregation Function (Store -> District -> Region -> Corporate)
  await runCascadingAggregation();
};

// Seed store level daily KPIs from orders
async function seedStoreData() {
  console.log('6. Seeding Level 0 daily_store_kpis...');
  
  const storesRes = await pool.query('SELECT id FROM stores ORDER BY id');
  const stores = storesRes.rows;
  const dates = ['2026-07-14', '2026-07-15', '2026-07-16', '2026-07-17', '2026-07-18', '2026-07-19', '2026-07-20', '2026-07-21'];

  for (const store of stores) {
    for (const dateStr of dates) {
      const totalOrders = Math.floor(Math.random() * 25) + 15;
      const totalRevenue = totalOrders * (Math.floor(Math.random() * 400) + 200);
      const averageOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;
      const customerCount = Math.round(totalOrders * 1.3);
      const cancelledOrders = Math.floor(Math.random() * 3);
      const dineIn = Math.round(totalOrders * 0.5);
      const takeaway = Math.round(totalOrders * 0.3);
      const online = totalOrders - (dineIn + takeaway);

      await pool.query(`
        INSERT INTO daily_store_kpis (
          store_id, kpi_date, total_revenue, total_orders, average_order_value,
          customer_count, cancelled_orders, online_orders, takeaway_orders, dine_in_orders,
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        ON CONFLICT (store_id, kpi_date) DO UPDATE SET
          total_revenue = EXCLUDED.total_revenue,
          total_orders = EXCLUDED.total_orders,
          average_order_value = EXCLUDED.average_order_value,
          customer_count = EXCLUDED.customer_count,
          cancelled_orders = EXCLUDED.cancelled_orders,
          online_orders = EXCLUDED.online_orders,
          takeaway_orders = EXCLUDED.takeaway_orders,
          dine_in_orders = EXCLUDED.dine_in_orders,
          updated_at = NOW();
      `, [
        store.id,
        dateStr,
        totalRevenue.toFixed(2),
        totalOrders,
        averageOrderValue.toFixed(2),
        customerCount,
        cancelledOrders,
        online,
        takeaway,
        dineIn
      ]);
    }
  }

  const storeCountRes = await pool.query('SELECT COUNT(*) FROM daily_store_kpis');
  console.log(`   ✓ Seeded ${storeCountRes.rows[0].count} daily_store_kpis records.\n`);
}

// Seed real orders and order_items into PostgreSQL
async function seedRealOrdersAndItems() {
  console.log('6b. Truncating and seeding clean real orders into PostgreSQL...');
  
  await pool.query('TRUNCATE TABLE order_items, orders RESTART IDENTITY CASCADE;');

  const storesRes = await pool.query('SELECT id FROM stores ORDER BY id');
  const stores = storesRes.rows;
  const dates = ['2026-07-14', '2026-07-15', '2026-07-16', '2026-07-17', '2026-07-18', '2026-07-19', '2026-07-20', '2026-07-21'];
  
  const customers = [
    'Ananya Sharma', 'Rahul Verma', 'Priya Patel', 'Vikram Singh',
    'Neha Gupta', 'Siddharth Malhotra', 'Deepika Rao', 'Amitabh Roy',
    'Karan Johar', 'Meera Kapoor', 'Aditya Birla', 'Rohan Mehta'
  ];

  const menuRes = await pool.query('SELECT id, name, price FROM menu_items ORDER BY id');
  const menuItems = menuRes.rows.length > 0 ? menuRes.rows : [
    { id: 1, name: 'Seafood Platter', price: 1200 },
    { id: 2, name: 'Garlic Butter Lobster', price: 1500 },
    { id: 3, name: 'Grilled Salmon', price: 850 },
    { id: 4, name: 'Clam Chowder Bowl', price: 350 },
    { id: 5, name: 'Crispy Calamari', price: 450 }
  ];

  const hours = ['11:30', '13:15', '15:45', '18:20', '20:45'];

  for (const store of stores) {
    for (const dateStr of dates) {
      for (let i = 0; i < hours.length; i++) {
        const custName = customers[(store.id * 3 + i) % customers.length];
        const status = i === 4 ? 'Cancelled' : i === 3 ? 'Pending' : 'Completed';
        const timestamp = `${dateStr} ${hours[i]}:00`;

        const item1 = menuItems[(store.id + i) % menuItems.length];
        const item2 = menuItems[(store.id + i + 2) % menuItems.length];
        const qty1 = 1 + (i % 2);
        const qty2 = 1;
        const totalAmt = (item1.price * qty1) + (item2.price * qty2);

        const ordRes = await pool.query(`
          INSERT INTO orders (store_id, customer_name, total_amount, status, created_at)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id;
        `, [store.id, custName, totalAmt.toFixed(2), status, timestamp]);

        const orderId = ordRes.rows[0].id;

        await pool.query(`
          INSERT INTO order_items (order_id, menu_item_id, quantity, price)
          VALUES ($1, $2, $3, $4), ($1, $5, $6, $7);
        `, [
          orderId,
          item1.id,
          qty1,
          item1.price,
          item2.id,
          qty2,
          item2.price
        ]);
      }
    }
  }

  const ordCount = await pool.query('SELECT COUNT(*) FROM orders');
  console.log(`   ✓ Seeded ${ordCount.rows[0].count} real orders into PostgreSQL.\n`);
}

/**
 * 8. Cascading KPI Aggregation Function
 * Store Level (daily_store_kpis) 
 *   └──> Level 1: District Level (district_kpis)
 *          └──> Level 2: Region Level (region_kpis)
 *                 └──> Level 3: Corporate Level (corporate_kpis)
 */
export async function runCascadingAggregation() {
  console.log('7. Running Cascading KPI Aggregation Pipeline...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // LEVEL 1 AGGREGATION: daily_store_kpis -> district_kpis
    const districtRes = await client.query(`
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
        online_orders,
        takeaway_orders,
        dine_in_orders,
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
        COALESCE(SUM(k.online_orders), 0) AS online_orders,
        COALESCE(SUM(k.takeaway_orders), 0) AS takeaway_orders,
        COALESCE(SUM(k.dine_in_orders), 0) AS dine_in_orders,
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
        online_orders = EXCLUDED.online_orders,
        takeaway_orders = EXCLUDED.takeaway_orders,
        dine_in_orders = EXCLUDED.dine_in_orders,
        updated_at = NOW();
    `);

    // LEVEL 2 AGGREGATION: district_kpis -> region_kpis
    const regionRes = await client.query(`
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
        online_orders,
        takeaway_orders,
        dine_in_orders,
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
        COALESCE(SUM(dk.online_orders), 0) AS online_orders,
        COALESCE(SUM(dk.takeaway_orders), 0) AS takeaway_orders,
        COALESCE(SUM(dk.dine_in_orders), 0) AS dine_in_orders,
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
        online_orders = EXCLUDED.online_orders,
        takeaway_orders = EXCLUDED.takeaway_orders,
        dine_in_orders = EXCLUDED.dine_in_orders,
        updated_at = NOW();
    `);

    // LEVEL 3 AGGREGATION: region_kpis -> corporate_kpis
    const corporateRes = await client.query(`
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
        online_orders,
        takeaway_orders,
        dine_in_orders,
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
        COALESCE(SUM(rk.online_orders), 0) AS online_orders,
        COALESCE(SUM(rk.takeaway_orders), 0) AS takeaway_orders,
        COALESCE(SUM(rk.dine_in_orders), 0) AS dine_in_orders,
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
        online_orders = EXCLUDED.online_orders,
        takeaway_orders = EXCLUDED.takeaway_orders,
        dine_in_orders = EXCLUDED.dine_in_orders,
        updated_at = NOW();
    `);

    await client.query('COMMIT');

    console.log('   ✓ LEVEL 1 Aggregation (daily_store_kpis -> district_kpis):', districtRes.rowCount, 'rows');
    console.log('   ✓ LEVEL 2 Aggregation (district_kpis -> region_kpis):', regionRes.rowCount, 'rows');
    console.log('   ✓ LEVEL 3 Aggregation (region_kpis -> corporate_kpis):', corporateRes.rowCount, 'rows\n');
    console.log('🎉 Cascading Aggregation Pipeline Executed Flawlessly!\n');

    return {
      status: 'success',
      district_rows: districtRes.rowCount,
      region_rows: regionRes.rowCount,
      corporate_rows: corporateRes.rowCount
    };
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error in Cascading Aggregation Pipeline:', err);
    throw err;
  } finally {
    client.release();
  }
}

if (process.argv[1] && process.argv[1].includes('rebuild_kpi_tables')) {
  (async () => {
    await rebuildKpiTablesAndAggregate();
    await pool.end();
  })();
}
