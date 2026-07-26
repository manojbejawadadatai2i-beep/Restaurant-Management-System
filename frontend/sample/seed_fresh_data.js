import { pool } from './server/db.js';

async function seedFreshData() {
  console.log('--- Starting PostgreSQL Data Refresh ---');

  try {
    // 1. Clear old data from orders, order_items, daily_store_kpis
    await pool.query('DELETE FROM order_items');
    await pool.query('DELETE FROM orders');
    await pool.query('DELETE FROM daily_store_kpis');

    console.log('✓ Cleared old test orders, order items, and daily KPIs.');

    // 2. Fetch stores & menu items
    const storesRes = await pool.query('SELECT id, name FROM stores ORDER BY id');
    const stores = storesRes.rows;

    const menuRes = await pool.query('SELECT id, name, price, category FROM menu_items ORDER BY id');
    const menuItems = menuRes.rows;

    if (stores.length === 0 || menuItems.length === 0) {
      console.error('Error: No stores or menu items found in PostgreSQL.');
      process.exit(1);
    }

    const customerNames = [
      'Aarav Sharma', 'Priya Patel', 'Rohan Verma', 'Ananya Gupta', 'Vikram Singh',
      'Meera Nair', 'Aditya Joshi', 'Kavya Reddy', 'Siddharth Malhotra', 'Neha Kapoor',
      'Rahul Mehta', 'Sneha Kulkarni', 'Arjun Rao', 'Pooja Iyer', 'Karan Roy',
      'Ishaan Bhatia', 'Riya Sen', 'Devendra Yadav', 'Tanvi Saxena', 'Manish Agarwal',
      'Divya Choudhary', 'Sameer Khan', 'Nisha Thomas', 'Amit Kumar', 'Shruti Das'
    ];

    const getDatesUpToToday = (numDays = 30) => {
      const datesList = [];
      const todayObj = new Date();
      for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date(todayObj);
        d.setDate(todayObj.getDate() - i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        datesList.push(`${yyyy}-${mm}-${dd}`);
      }
      return datesList;
    };

    const dates = getDatesUpToToday(30);

    const hours = [11, 12, 13, 14, 15, 18, 19, 20, 21, 22]; // Peak hours

    let totalOrdersCreated = 0;
    let totalItemsCreated = 0;

    // Track KPI metrics per store per date
    const kpiTracker = {}; // `${storeId}_${dateStr}` -> { rev, count, cancelled, customers }

    // Loop through each store and generate orders per date
    for (const store of stores) {
      for (const dateStr of dates) {
        // Generate between 8 and 18 orders per store per day
        const dailyOrderCount = Math.floor(Math.random() * 10) + 8;
        const key = `${store.id}_${dateStr}`;
        kpiTracker[key] = {
          store_id: store.id,
          date: dateStr,
          total_revenue: 0,
          total_orders: 0,
          cancelled_orders: 0,
          customer_set: new Set()
        };

        for (let i = 0; i < dailyOrderCount; i++) {
          const custName = customerNames[Math.floor(Math.random() * customerNames.length)];
          const hour = hours[Math.floor(Math.random() * hours.length)];
          const minute = Math.floor(Math.random() * 60);
          const second = Math.floor(Math.random() * 60);

          const timestamp = `${dateStr} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;

          // Status: 85% Completed, 10% Cancelled, 5% Pending
          const rand = Math.random();
          let status = 'Completed';
          if (rand > 0.90) status = 'Cancelled';
          else if (rand > 0.85) status = 'Pending';

          // Select 1 to 4 items for this order
          const numItems = Math.floor(Math.random() * 3) + 1;
          let orderTotal = 0;
          const itemsToInsert = [];

          for (let j = 0; j < numItems; j++) {
            const item = menuItems[Math.floor(Math.random() * menuItems.length)];
            const qty = Math.floor(Math.random() * 2) + 1;
            const itemPrice = parseFloat(item.price);
            orderTotal += itemPrice * qty;
            itemsToInsert.push({ menu_item_id: item.id, qty, price: itemPrice });
          }

          // Insert order into PostgreSQL
          const orderRes = await pool.query(`
            INSERT INTO orders (store_id, customer_name, total_amount, status, created_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
          `, [store.id, custName, orderTotal.toFixed(2), status, timestamp]);

          const orderId = orderRes.rows[0].id;
          totalOrdersCreated++;

          // Insert order items
          for (const item of itemsToInsert) {
            await pool.query(`
              INSERT INTO order_items (order_id, menu_item_id, quantity, price)
              VALUES ($1, $2, $3, $4)
            `, [orderId, item.menu_item_id, item.qty, item.price.toFixed(2)]);
            totalItemsCreated++;
          }

          // Track KPI metrics
          kpiTracker[key].total_orders++;
          kpiTracker[key].customer_set.add(custName);
          if (status === 'Completed') {
            kpiTracker[key].total_revenue += orderTotal;
          } else if (status === 'Cancelled') {
            kpiTracker[key].cancelled_orders++;
          }
        }
      }
    }

    console.log(`✓ Inserted ${totalOrdersCreated} realistic orders with ${totalItemsCreated} items.`);

    // 3. Insert daily KPI records into daily_store_kpis
    let kpisInserted = 0;
    for (const key of Object.keys(kpiTracker)) {
      const data = kpiTracker[key];
      const rev = data.total_revenue;
      const orders = data.total_orders;
      const aov = orders > 0 ? (rev / orders) : 0;
      const custCount = data.customer_set.size;
      const canc = data.cancelled_orders;

      const dineIn = Math.round(orders * 0.5);
      const takeaway = Math.round(orders * 0.3);
      const online = orders - (dineIn + takeaway);

      await pool.query(`
        INSERT INTO daily_store_kpis (
          store_id, kpi_date, total_revenue, total_orders, average_order_value,
          customer_count, cancelled_orders, online_orders, takeaway_orders, dine_in_orders,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      `, [
        data.store_id,
        data.date,
        rev.toFixed(2),
        orders,
        aov.toFixed(2),
        custCount,
        canc,
        online,
        takeaway,
        dineIn
      ]);

      kpisInserted++;
    }

    console.log(`✓ Inserted ${kpisInserted} daily KPI aggregated summaries.`);
    console.log('🎉 Data Refresh Complete! PostgreSQL database has fresh live records.');

  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    await pool.end();
  }
}

seedFreshData();
