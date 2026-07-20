import { pool } from './db.js';

const seedDatabase = async () => {
  console.log('Seeding database started...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Drop existing tables
    await client.query(`
      DROP TABLE IF EXISTS daily_store_kpis CASCADE;
      DROP TABLE IF EXISTS district_kpis CASCADE;
      DROP TABLE IF EXISTS region_kpis CASCADE;
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS menu_items CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS stores CASCADE;
      DROP TABLE IF EXISTS districts CASCADE;
      DROP TABLE IF EXISTS regions CASCADE;
      DROP TABLE IF EXISTS roles CASCADE;
      DROP TABLE IF EXISTS corporates CASCADE;
    `);

    // 2. Create tables
    await client.query(`
      CREATE TABLE regions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      );

      CREATE TABLE districts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        region_id INT REFERENCES regions(id) ON DELETE CASCADE
      );

      CREATE TABLE stores (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        district_id INT REFERENCES districts(id) ON DELETE CASCADE,
        region_id INT REFERENCES regions(id) ON DELETE CASCADE
      );

      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL UNIQUE,
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        role VARCHAR(50) NOT NULL, -- 'Store Manager', 'District Manager', 'Regional Manager', 'Corporate Administrator', 'Administrator'
        assigned_store_id INT REFERENCES stores(id) ON DELETE SET NULL,
        assigned_district_id INT REFERENCES districts(id) ON DELETE SET NULL,
        assigned_region_id INT REFERENCES regions(id) ON DELETE SET NULL
      );

      CREATE TABLE menu_items (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        price DECIMAL(10, 2) NOT NULL,
        cost DECIMAL(10, 2) NOT NULL,
        category VARCHAR(100) NOT NULL
      );

      CREATE TABLE orders (
        id SERIAL PRIMARY KEY,
        store_id INT REFERENCES stores(id) ON DELETE CASCADE,
        customer_name VARCHAR(100) NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(50) NOT NULL, -- 'Completed', 'Cancelled', 'Pending'
        created_at TIMESTAMP NOT NULL
      );

      CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id INT REFERENCES orders(id) ON DELETE CASCADE,
        menu_item_id INT REFERENCES menu_items(id) ON DELETE CASCADE,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL
      );

      CREATE TABLE daily_store_kpis (
        kpi_id SERIAL PRIMARY KEY,
        store_id INT REFERENCES stores(id) ON DELETE CASCADE,
        kpi_date DATE NOT NULL,
        total_revenue DECIMAL(10, 2) NOT NULL,
        total_orders INT NOT NULL,
        average_order_value DECIMAL(10, 2) NOT NULL,
        customer_count INT NOT NULL,
        cancelled_orders INT NOT NULL,
        online_orders INT NOT NULL,
        takeaway_orders INT NOT NULL,
        dine_in_orders INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(store_id, kpi_date)
      );

      CREATE TABLE district_kpis (
        kpi_id SERIAL PRIMARY KEY,
        district_id INT REFERENCES districts(id) ON DELETE CASCADE,
        kpi_date DATE NOT NULL,
        total_stores INT NOT NULL,
        active_stores INT NOT NULL,
        total_revenue DECIMAL(10, 2) NOT NULL,
        total_orders INT NOT NULL,
        average_order_value DECIMAL(10, 2) NOT NULL,
        customer_count INT NOT NULL,
        cancelled_orders INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(district_id, kpi_date)
      );

      CREATE TABLE region_kpis (
        kpi_id SERIAL PRIMARY KEY,
        region_id INT REFERENCES regions(id) ON DELETE CASCADE,
        kpi_date DATE NOT NULL,
        total_districts INT NOT NULL,
        total_stores INT NOT NULL,
        active_stores INT NOT NULL,
        total_revenue DECIMAL(10, 2) NOT NULL,
        total_orders INT NOT NULL,
        average_order_value DECIMAL(10, 2) NOT NULL,
        customer_count INT NOT NULL,
        cancelled_orders INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(region_id, kpi_date)
      );
    `);

    console.log('Tables created successfully.');

    // 3. Insert Regions (North, South, East)
    const regions = ['North Region', 'South Region', 'East Region'];
    for (const reg of regions) {
      await client.query('INSERT INTO regions (name) VALUES ($1)', [reg]);
    }

    // 4. Insert Districts (District A to I)
    // A, B, C -> North (1)
    // D, E, F -> South (2)
    // G, H, I -> East (3)
    const districts = [
      { name: 'District A', region_id: 1 },
      { name: 'District B', region_id: 1 },
      { name: 'District C', region_id: 1 },
      { name: 'District D', region_id: 2 },
      { name: 'District E', region_id: 2 },
      { name: 'District F', region_id: 2 },
      { name: 'District G', region_id: 3 },
      { name: 'District H', region_id: 3 },
      { name: 'District I', region_id: 3 }
    ];
    for (const dist of districts) {
      await client.query('INSERT INTO districts (name, region_id) VALUES ($1, $2)', [dist.name, dist.region_id]);
    }

    // 5. Insert Stores (Store 1 to 18, 2 per district)
    for (let i = 1; i <= 18; i++) {
      const districtId = Math.ceil(i / 2);
      const regionId = Math.ceil(districtId / 3);
      await client.query('INSERT INTO stores (name, district_id, region_id) VALUES ($1, $2, $3)', [`Store ${i}`, districtId, regionId]);
    }

    // 6. Insert Users
    const getEmail = (name) => name.toLowerCase().replace(/ /g, '_') + '@restaurant.com';
    const defaultPassword = 'password123';

    // Corporate Admin (Corporate Administrator)
    await client.query(`
      INSERT INTO users (username, email, password, role, assigned_store_id, assigned_district_id, assigned_region_id) 
      VALUES ('Corporate Admin', $1, $2, 'Corporate Administrator', NULL, NULL, NULL)
    `, [getEmail('Corporate Admin'), defaultPassword]);

    // System Administrator (Administrator)
    await client.query(`
      INSERT INTO users (username, email, password, role, assigned_store_id, assigned_district_id, assigned_region_id) 
      VALUES ('System Admin', $1, $2, 'Administrator', NULL, NULL, NULL)
    `, [getEmail('System Admin'), defaultPassword]);

    // Region Managers
    const regionManagers = [
      { username: 'North Region Manager', region_id: 1 },
      { username: 'South Region Manager', region_id: 2 },
      { username: 'East Region Manager', region_id: 3 }
    ];
    for (const rm of regionManagers) {
      await client.query(`
        INSERT INTO users (username, email, password, role, assigned_store_id, assigned_district_id, assigned_region_id) 
        VALUES ($1, $2, $3, 'Regional Manager', NULL, NULL, $4)
      `, [rm.username, getEmail(rm.username), defaultPassword, rm.region_id]);
    }

    // District Managers (A to I)
    const districtLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    for (let i = 1; i <= 9; i++) {
      const name = `District ${districtLetters[i - 1]} Manager`;
      await client.query(`
        INSERT INTO users (username, email, password, role, assigned_store_id, assigned_district_id, assigned_region_id) 
        VALUES ($1, $2, $3, 'District Manager', NULL, $4, NULL)
      `, [name, getEmail(name), defaultPassword, i]);
    }

    // Store Managers (1 to 18)
    for (let i = 1; i <= 18; i++) {
      const name = `Store Manager ${i}`;
      await client.query(`
        INSERT INTO users (username, email, password, role, assigned_store_id, assigned_district_id, assigned_region_id) 
        VALUES ($1, $2, $3, 'Store Manager', $4, NULL, NULL)
      `, [name, getEmail(name), defaultPassword, i]);
    }

    // 7. Insert Menu Items
    const menuResult = await client.query(`
      INSERT INTO menu_items (name, price, cost, category) VALUES 
      ('Seafood Platter', 1200.00, 700.00, 'Mains'),
      ('Garlic Butter Lobster', 1500.00, 900.00, 'Mains'),
      ('Grilled Salmon', 850.00, 500.00, 'Mains'),
      ('Clam Chowder Bowl', 350.00, 180.00, 'Soups'),
      ('Crispy Calamari', 450.00, 220.00, 'Appetizers'),
      ('Shrimp Cocktail', 500.00, 260.00, 'Appetizers'),
      ('Caesar Salad', 300.00, 120.00, 'Salads'),
      ('Fries with Truffle Mayo', 250.00, 90.00, 'Sides'),
      ('Chocolate Lava Cake', 300.00, 140.00, 'Desserts'),
      ('Key Lime Pie', 250.00, 110.00, 'Desserts'),
      ('Fresh Coconut Water', 150.00, 40.00, 'Beverages'),
      ('Ocean Blue Mocktail', 200.00, 70.00, 'Beverages')
      RETURNING *;
    `);

    // 8. Seed Store KPIs (Store 1 to 18)
    const baseRevenues = [
      130000, 100000, 145000, 88000, 165000, 115000, 
      95000, 125000, 105000, 150000, 120000, 110000,
      135000, 122000, 140000, 118000, 128000, 132000
    ];
    
    for (let i = 1; i <= 18; i++) {
      const baseRev = baseRevenues[i - 1];
      // Day 1: July 9
      const rev1 = baseRev;
      const ord1 = Math.round(rev1 / 285);
      const cust1 = Math.round(ord1 * 1.1);
      const canc1 = Math.round(ord1 * 0.02);
      const online1 = Math.round(ord1 * 0.4);
      const take1 = Math.round(ord1 * 0.3);
      const dine1 = ord1 - online1 - take1;
      
      await client.query(`
        INSERT INTO daily_store_kpis 
        (store_id, kpi_date, total_revenue, total_orders, average_order_value, customer_count, cancelled_orders, online_orders, takeaway_orders, dine_in_orders) 
        VALUES 
        ($1, '2026-07-09', $2, $3, $4, $5, $6, $7, $8, $9)
      `, [i, rev1, ord1, (rev1 / ord1).toFixed(2), cust1, canc1, online1, take1, dine1]);

      // Day 2: July 10
      const rev2 = Math.round(baseRev * 1.05); // 5% growth
      const ord2 = Math.round(rev2 / 283);
      const cust2 = Math.round(ord2 * 1.1);
      const canc2 = Math.round(ord2 * 0.025);
      const online2 = Math.round(ord2 * 0.42);
      const take2 = Math.round(ord2 * 0.28);
      const dine2 = ord2 - online2 - take2;

      await client.query(`
        INSERT INTO daily_store_kpis 
        (store_id, kpi_date, total_revenue, total_orders, average_order_value, customer_count, cancelled_orders, online_orders, takeaway_orders, dine_in_orders) 
        VALUES 
        ($1, '2026-07-10', $2, $3, $4, $5, $6, $7, $8, $9)
      `, [i, rev2, ord2, (rev2 / ord2).toFixed(2), cust2, canc2, online2, take2, dine2]);
    }

    // 9. Seed District KPIs (District A to I)
    const baseDistrictRevenues = [
      230000, 233000, 280000, 220000, 255000, 230000,
      257000, 258000, 260000
    ];
    for (let i = 1; i <= 9; i++) {
      const baseRev = baseDistrictRevenues[i - 1];
      const storesCount = 2; // 2 stores per district
      
      // Day 1
      const rev1 = baseRev;
      const ord1 = Math.round(rev1 / 285);
      const cust1 = Math.round(ord1 * 1.1);
      const canc1 = Math.round(ord1 * 0.02);
      await client.query(`
        INSERT INTO district_kpis 
        (district_id, kpi_date, total_stores, active_stores, total_revenue, total_orders, average_order_value, customer_count, cancelled_orders) 
        VALUES 
        ($1, '2026-07-09', $2, $2, $3, $4, $5, $6, $7)
      `, [i, storesCount, rev1, ord1, (rev1 / ord1).toFixed(2), cust1, canc1]);

      // Day 2
      const rev2 = Math.round(baseRev * 1.05);
      const ord2 = Math.round(rev2 / 283);
      const cust2 = Math.round(ord2 * 1.1);
      const canc2 = Math.round(ord2 * 0.025);
      await client.query(`
        INSERT INTO district_kpis 
        (district_id, kpi_date, total_stores, active_stores, total_revenue, total_orders, average_order_value, customer_count, cancelled_orders) 
        VALUES 
        ($1, '2026-07-10', $2, $2, $3, $4, $5, $6, $7)
      `, [i, storesCount, rev2, ord2, (rev2 / ord2).toFixed(2), cust2, canc2]);
    }

    // 10. Seed Region KPIs (North, South, East)
    const baseRegionRevenues = [
      743000, 705000, 775000
    ];
    const regionStores = [6, 6, 6]; // 6 stores per region in our seed
    const regionDistricts = [3, 3, 3]; // 3 districts per region
    for (let i = 1; i <= 3; i++) {
      const baseRev = baseRegionRevenues[i - 1];
      
      // Day 1
      const rev1 = baseRev;
      const ord1 = Math.round(rev1 / 285);
      const cust1 = Math.round(ord1 * 1.1);
      const canc1 = Math.round(ord1 * 0.02);
      await client.query(`
        INSERT INTO region_kpis 
        (region_id, kpi_date, total_districts, total_stores, active_stores, total_revenue, total_orders, average_order_value, customer_count, cancelled_orders) 
        VALUES 
        ($1, '2026-07-09', $2, $3, $3, $4, $5, $6, $7, $8)
      `, [i, regionDistricts[i - 1], regionStores[i - 1], rev1, ord1, (rev1 / ord1).toFixed(2), cust1, canc1]);

      // Day 2
      const rev2 = Math.round(baseRev * 1.05);
      const ord2 = Math.round(rev2 / 283);
      const cust2 = Math.round(ord2 * 1.1);
      const canc2 = Math.round(ord2 * 0.025);
      await client.query(`
        INSERT INTO region_kpis 
        (region_id, kpi_date, total_districts, total_stores, active_stores, total_revenue, total_orders, average_order_value, customer_count, cancelled_orders) 
        VALUES 
        ($1, '2026-07-10', $2, $3, $3, $4, $5, $6, $7, $8)
      `, [i, regionDistricts[i - 1], regionStores[i - 1], rev2, ord2, (rev2 / ord2).toFixed(2), cust2, canc2]);
    }

    // 11. Seed orders & order_items for recent order details
    const customersList = ['John Doe', 'Alice Smith', 'Bob Johnson', 'Emily Davis', 'Michael Brown', 'Sophia Wilson', 'Daniel Taylor', 'Olivia Thomas'];
    for (let i = 1; i <= 18; i++) {
      const cust = customersList[i % customersList.length];
      const amount = baseRevenues[i - 1] * 0.005; // 0.5% of store revenue as a single order
      const status = i % 5 === 0 ? 'Cancelled' : 'Completed';
      
      const orderRes = await client.query(`
        INSERT INTO orders (store_id, customer_name, total_amount, status, created_at) 
        VALUES ($1, $2, $3, $4, '2026-07-10 13:00:00') 
        RETURNING id;
      `, [i, cust, amount.toFixed(2), status]);
      const orderId = orderRes.rows[0].id;
      
      const menuItemId = amount > 500 ? 1 : 5; // 1: Seafood Platter, 5: Crispy Calamari
      const itemPrice = amount;
      await client.query(`
        INSERT INTO order_items (order_id, menu_item_id, quantity, price) 
        VALUES ($1, $2, 1, $3);
      `, [orderId, menuItemId, itemPrice.toFixed(2)]);
    }

    await client.query('COMMIT');
    console.log('Database seeded successfully!');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding database:', error);
  } finally {
    client.release();
  }
};

seedDatabase().then(() => pool.end());