import { pool } from './db.js';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const seedDatabase = async () => {
  console.log('Seeding database started...');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Drop existing tables
    await client.query(`
      DROP TABLE IF EXISTS scopes CASCADE;
      DROP TABLE IF EXISTS corporate_kpis CASCADE;
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
      CREATE TABLE roles (
        id INT PRIMARY KEY,
        role_name VARCHAR(50) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE corporates (
        id INT PRIMARY KEY,
        corporate_code VARCHAR(20) NOT NULL UNIQUE,
        corporate_name VARCHAR(100) NOT NULL UNIQUE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE regions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        region_name VARCHAR(100),
        region_code VARCHAR(20) UNIQUE,
        corporate_id INT REFERENCES corporates(id) ON DELETE SET NULL,
        manager_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE districts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        district_name VARCHAR(100),
        district_code VARCHAR(20) UNIQUE,
        region_id INT REFERENCES regions(id) ON DELETE CASCADE,
        manager_name VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE stores (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        store_name VARCHAR(100),
        store_code VARCHAR(20) UNIQUE,
        city VARCHAR(100) DEFAULT 'Demo City',
        address TEXT,
        manager_name VARCHAR(100),
        opened_on DATE,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        district_id INT REFERENCES districts(id) ON DELETE CASCADE,
        region_id INT REFERENCES regions(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE scopes (
        id SERIAL PRIMARY KEY,
        scope_name VARCHAR(100) NOT NULL,
        scope_type VARCHAR(20) NOT NULL CHECK (scope_type IN ('corporate', 'region', 'district', 'store')),
        parent_scope_id INT REFERENCES scopes(id) ON DELETE CASCADE,
        region_id INT REFERENCES regions(id) ON DELETE CASCADE,
        district_id INT REFERENCES districts(id) ON DELETE CASCADE,
        store_id INT REFERENCES stores(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE,
        full_name VARCHAR(100),
        email VARCHAR(255) UNIQUE,
        password_hash TEXT,
        login_method VARCHAR(50) NOT NULL DEFAULT 'both',
        role VARCHAR(50),
        role_id INT REFERENCES roles(id) ON DELETE SET NULL,
        corporate_id INT REFERENCES corporates(id) ON DELETE SET NULL DEFAULT 1,
        assigned_store_id INT REFERENCES stores(id) ON DELETE SET NULL,
        assigned_district_id INT REFERENCES districts(id) ON DELETE SET NULL,
        assigned_region_id INT REFERENCES regions(id) ON DELETE SET NULL,
        store_id INT REFERENCES stores(id) ON DELETE SET NULL,
        district_id INT REFERENCES districts(id) ON DELETE SET NULL,
        region_id INT REFERENCES regions(id) ON DELETE SET NULL,
        employee_id VARCHAR(20),
        is_active BOOLEAN DEFAULT TRUE,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
        status VARCHAR(50) NOT NULL,
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

      CREATE TABLE corporate_kpis (
        kpi_id SERIAL PRIMARY KEY,
        corporate_id INT REFERENCES corporates(id) ON DELETE CASCADE,
        kpi_date DATE NOT NULL,
        total_regions INT DEFAULT 0,
        total_districts INT DEFAULT 0,
        total_stores INT DEFAULT 0,
        active_stores INT DEFAULT 0,
        total_revenue DECIMAL(15, 2) DEFAULT 0.00,
        total_orders INT DEFAULT 0,
        average_order_value DECIMAL(10, 2) DEFAULT 0.00,
        customer_count INT DEFAULT 0,
        cancelled_orders INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(corporate_id, kpi_date)
      );

      CREATE OR REPLACE FUNCTION sync_user_fields()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.username IS NULL AND NEW.full_name IS NOT NULL THEN
          NEW.username := NEW.full_name;
        ELSIF NEW.full_name IS NULL AND NEW.username IS NOT NULL THEN
          NEW.full_name := NEW.username;
        END IF;

        IF NEW.role IS NULL AND NEW.role_id IS NOT NULL THEN
          SELECT role_name INTO NEW.role FROM roles WHERE id = NEW.role_id;
        ELSIF NEW.role_id IS NULL AND NEW.role IS NOT NULL THEN
          SELECT id INTO NEW.role_id FROM roles WHERE role_name = NEW.role;
        END IF;

        IF NEW.assigned_store_id IS NULL AND NEW.store_id IS NOT NULL THEN
          NEW.assigned_store_id := NEW.store_id;
        ELSIF NEW.store_id IS NULL AND NEW.assigned_store_id IS NOT NULL THEN
          NEW.store_id := NEW.assigned_store_id;
        END IF;

        IF NEW.assigned_district_id IS NULL AND NEW.district_id IS NOT NULL THEN
          NEW.assigned_district_id := NEW.district_id;
        ELSIF NEW.district_id IS NULL AND NEW.assigned_district_id IS NOT NULL THEN
          NEW.district_id := NEW.assigned_district_id;
        END IF;

        IF NEW.assigned_region_id IS NULL AND NEW.region_id IS NOT NULL THEN
          NEW.assigned_region_id := NEW.region_id;
        ELSIF NEW.region_id IS NULL AND NEW.assigned_region_id IS NOT NULL THEN
          NEW.region_id := NEW.assigned_region_id;
        END IF;

        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE TRIGGER trg_sync_user_fields
      BEFORE INSERT OR UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION sync_user_fields();

      CREATE OR REPLACE FUNCTION sync_store_fields()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.name IS NULL AND NEW.store_name IS NOT NULL THEN
          NEW.name := NEW.store_name;
        ELSIF NEW.store_name IS NULL AND NEW.name IS NOT NULL THEN
          NEW.store_name := NEW.name;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE TRIGGER trg_sync_store_fields
      BEFORE INSERT OR UPDATE ON stores
      FOR EACH ROW
      EXECUTE FUNCTION sync_store_fields();

      CREATE OR REPLACE FUNCTION sync_district_fields()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.name IS NULL AND NEW.district_name IS NOT NULL THEN
          NEW.name := NEW.district_name;
        ELSIF NEW.district_name IS NULL AND NEW.name IS NOT NULL THEN
          NEW.district_name := NEW.name;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE TRIGGER trg_sync_district_fields
      BEFORE INSERT OR UPDATE ON districts
      FOR EACH ROW
      EXECUTE FUNCTION sync_district_fields();

      CREATE OR REPLACE FUNCTION sync_region_fields()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.name IS NULL AND NEW.region_name IS NOT NULL THEN
          NEW.name := NEW.region_name;
        ELSIF NEW.region_name IS NULL AND NEW.name IS NOT NULL THEN
          NEW.region_name := NEW.name;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE OR REPLACE TRIGGER trg_sync_region_fields
      BEFORE INSERT OR UPDATE ON regions
      FOR EACH ROW
      EXECUTE FUNCTION sync_region_fields();
    `);

    console.log('Tables created successfully.');

    // 2b. Seed Roles & Corporates
    await client.query(`
      INSERT INTO roles (id, role_name) VALUES
      (1, 'Corporate Administrator'),
      (2, 'Regional Manager'),
      (3, 'District Manager'),
      (4, 'Store Manager'),
      (5, 'Administrator')
      ON CONFLICT (id) DO NOTHING;
    `);
    await client.query(`
      INSERT INTO corporates (id, corporate_code, corporate_name) VALUES
      (1, 'CORP001', 'Ocean View Restaurant Group')
      ON CONFLICT (id) DO NOTHING;
    `);

    // 3. Insert Regions (North, South, East)
    const regions = [
      { name: 'North Region', region_name: 'Andhra Pradesh', region_code: 'REG-AP' },
      { name: 'South Region', region_name: 'Telangana', region_code: 'REG-TG' },
      { name: 'East Region', region_name: 'East Region', region_code: 'REG-ER' }
    ];
    for (const reg of regions) {
      await client.query(
        'INSERT INTO regions (name, region_name, region_code, corporate_id) VALUES ($1, $2, $3, 1)', 
        [reg.name, reg.region_name, reg.region_code]
      );
    }

    // 4. Insert Districts (District A to I)
    const districts = [
      { name: 'District A', code: 'DIST-A', region_id: 1 },
      { name: 'District B', code: 'DIST-B', region_id: 1 },
      { name: 'District C', code: 'DIST-C', region_id: 2 },
      { name: 'District D', code: 'DIST-D', region_id: 1 },
      { name: 'District E', code: 'DIST-E', region_id: 2 },
      { name: 'District F', code: 'DIST-F', region_id: 2 },
      { name: 'District G', code: 'DIST-G', region_id: 3 },
      { name: 'District H', code: 'DIST-H', region_id: 3 },
      { name: 'District I', code: 'DIST-I', region_id: 3 }
    ];
    for (const dist of districts) {
      await client.query(
        'INSERT INTO districts (name, district_name, district_code, region_id) VALUES ($1, $1, $2, $3)', 
        [dist.name, dist.code, dist.region_id]
      );
    }

    // 5. Insert Stores (Store 1 to 18, matching backend mappings for first 10 stores)
    const storeMappings = {
      1: { districtId: 1, regionId: 1 },
      2: { districtId: 3, regionId: 2 },
      3: { districtId: 1, regionId: 1 },
      4: { districtId: 2, regionId: 1 },
      5: { districtId: 2, regionId: 1 },
      6: { districtId: 3, regionId: 2 },
      7: { districtId: 4, regionId: 1 },
      8: { districtId: 4, regionId: 1 },
      9: { districtId: 5, regionId: 2 },
      10: { districtId: 5, regionId: 2 },
      11: { districtId: 6, regionId: 2 },
      12: { districtId: 6, regionId: 2 },
      13: { districtId: 7, regionId: 3 },
      14: { districtId: 7, regionId: 3 },
      15: { districtId: 8, regionId: 3 },
      16: { districtId: 8, regionId: 3 },
      17: { districtId: 9, regionId: 3 },
      18: { districtId: 9, regionId: 3 }
    };

    for (let i = 1; i <= 18; i++) {
      const { districtId, regionId } = storeMappings[i];
      const storeCode = `STR-${String(i).padStart(3, '0')}`;
      await client.query(
        'INSERT INTO stores (name, store_name, store_code, district_id, region_id) VALUES ($1, $1, $2, $3, $4)', 
        [`Store ${i}`, storeCode, districtId, regionId]
      );
    }

    // 5b. Populate Scopes Table
    const corpScopeRes = await client.query(`
      INSERT INTO scopes (scope_name, scope_type) VALUES ('All Operations', 'corporate') RETURNING id
    `);
    const corpScopeId = corpScopeRes.rows[0].id;

    const regionScopeMap = {};
    for (let rId = 1; rId <= 3; rId++) {
      const regName = regions[rId - 1].name;
      const res = await client.query(`
        INSERT INTO scopes (scope_name, scope_type, parent_scope_id, region_id) 
        VALUES ($1, 'region', $2, $3) RETURNING id
      `, [regName, corpScopeId, rId]);
      regionScopeMap[rId] = res.rows[0].id;
    }

    const districtScopeMap = {};
    for (let dId = 1; dId <= 9; dId++) {
      const distName = districts[dId - 1].name;
      const rId = districts[dId - 1].region_id;
      const res = await client.query(`
        INSERT INTO scopes (scope_name, scope_type, parent_scope_id, region_id, district_id) 
        VALUES ($1, 'district', $2, $3, $4) RETURNING id
      `, [distName, regionScopeMap[rId], rId, dId]);
      districtScopeMap[dId] = res.rows[0].id;
    }

    for (let sId = 1; sId <= 18; sId++) {
      const { districtId: dId, regionId: rId } = storeMappings[sId];
      await client.query(`
        INSERT INTO scopes (scope_name, scope_type, parent_scope_id, region_id, district_id, store_id) 
        VALUES ($1, 'store', $2, $3, $4, $5)
      `, [`Store ${sId}`, districtScopeMap[dId], rId, dId, sId]);
    }

    // 6. Insert Users & Export Credentials to CSV
    const getEmail = (name) => name.toLowerCase().replace(/ /g, '_') + '@restaurant.com';
    const getPassword = (username) => {
      const clean = username.replace(/[^a-zA-Z0-9]/g, '');
      return (clean.slice(0, 4) || 'user').toLowerCase() + '@123';
    };

    const userCredentialsList = [];

    let employeeCounter = 1;
    // Helper to insert and log user
    const insertUser = async (username, role, storeId, districtId, regionId) => {
      const email = getEmail(username);
      const pass = getPassword(username);
      const passwordHash = bcrypt.hashSync(pass, 12);
      const roleMap = {
        'Corporate Administrator': 1,
        'Regional Manager': 2,
        'District Manager': 3,
        'Store Manager': 4,
        'Administrator': 5
      };
      const roleId = roleMap[role] || 4;
      const empId = `EMP-${String(employeeCounter++).padStart(3, '0')}`;

      const res = await client.query(`
        INSERT INTO users (
          username, full_name, email, password_hash, role, role_id, 
          assigned_store_id, assigned_district_id, assigned_region_id,
          store_id, district_id, region_id, employee_id, corporate_id, login_method
        ) 
        VALUES ($1, $1, $2, $3, $4, $5, $6, $7, $8, $6, $7, $8, $9, 1, 'both')
        RETURNING id
      `, [username, email, passwordHash, role, roleId, storeId, districtId, regionId, empId]);
      
      userCredentialsList.push({
        id: res.rows[0].id,
        username,
        email,
        password: pass,
        role,
        assigned_store_id: storeId || 'None',
        assigned_district_id: districtId || 'None',
        assigned_region_id: regionId || 'None'
      });
    };

    // Corporate Admin
    await insertUser('Corporate Admin', 'Corporate Administrator', null, null, null);

    // System Administrator
    await insertUser('System Admin', 'Administrator', null, null, null);

    // Region Managers
    const regionManagers = [
      { username: 'North Region Manager', region_id: 1 },
      { username: 'South Region Manager', region_id: 2 },
      { username: 'East Region Manager', region_id: 3 }
    ];
    for (const rm of regionManagers) {
      await insertUser(rm.username, 'Regional Manager', null, null, rm.region_id);
    }

    // District Managers (A to I)
    const districtLetters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
    for (let i = 1; i <= 9; i++) {
      const name = `District ${districtLetters[i - 1]} Manager`;
      await insertUser(name, 'District Manager', null, i, null);
    }

    // Store Managers (1 to 18)
    for (let i = 1; i <= 18; i++) {
      const name = `Store Manager ${i}`;
      await insertUser(name, 'Store Manager', i, null, null);
    }

    // Write CSV Export
    const csvHeader = 'ID,Username,Email,Password,Role,Assigned Store ID,Assigned District ID,Assigned Region ID\n';
    const csvRows = userCredentialsList.map(u => 
      `"${u.id}","${u.username}","${u.email}","${u.password}","${u.role}","${u.assigned_store_id}","${u.assigned_district_id}","${u.assigned_region_id}"`
    ).join('\n');
    const csvContent = csvHeader + csvRows;

    const csvPathProject = path.resolve(process.cwd(), '../../User_Credentials.csv');
    const csvPathArtifacts = 'C:/Users/maddi/.gemini/antigravity-ide/brain/5fd5189b-279a-4de3-8518-8664366b318d/User_Credentials.csv';

    try {
      fs.writeFileSync(csvPathProject, csvContent);
      fs.writeFileSync(csvPathArtifacts, csvContent);
      console.log('User credentials CSV generated at:', csvPathProject);
    } catch (e) {
      console.error('Failed to write CSV file:', e);
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

    // 8. Seed Store KPIs — 30 days ending today
    const baseRevenues = [
      130000, 100000, 145000, 88000, 165000, 115000, 
      95000, 125000, 105000, 150000, 120000, 110000,
      135000, 122000, 140000, 118000, 128000, 132000
    ];

    const NUM_DAYS = 30;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const toDateStr = (d) => d.toISOString().split('T')[0];

    // Daily growth/variation multipliers (slightly different each day, realistic weekday patterns)
    const dayVariation = (dayIndex) => {
      // Day of week effect: Mon-Fri normal, Sat +15%, Sun -10%
      const date = new Date(today);
      date.setDate(today.getDate() - (NUM_DAYS - 1 - dayIndex));
      const dow = date.getDay(); // 0=Sun, 6=Sat
      const weekendFactor = dow === 0 ? 0.90 : dow === 6 ? 1.15 : 1.00;
      // Slight random-but-deterministic variation by day index
      const noise = 1 + (((dayIndex * 7 + 13) % 17) - 8) / 100; // ±8% noise
      return weekendFactor * noise;
    };

    console.log('Generating 30 days of dashboard KPI metrics...');

    for (let storeIdx = 1; storeIdx <= 18; storeIdx++) {
      const baseRev = baseRevenues[storeIdx - 1];
      for (let d = 0; d < NUM_DAYS; d++) {
        const dateObj = new Date(today);
        dateObj.setDate(today.getDate() - (NUM_DAYS - 1 - d));
        const dateStr = toDateStr(dateObj);

        const factor = dayVariation(d);
        const rev = Math.round(baseRev * factor);
        const ord = Math.round(rev / 285);
        const cust = Math.round(ord * 1.1);
        const canc = Math.round(ord * 0.022);
        const online = Math.round(ord * 0.40);
        const take = Math.round(ord * 0.30);
        const dine = ord - online - take;

        await client.query(`
          INSERT INTO daily_store_kpis 
          (store_id, kpi_date, total_revenue, total_orders, average_order_value, customer_count, cancelled_orders, online_orders, takeaway_orders, dine_in_orders) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          ON CONFLICT (store_id, kpi_date) DO UPDATE SET
            total_revenue = EXCLUDED.total_revenue,
            total_orders = EXCLUDED.total_orders,
            average_order_value = EXCLUDED.average_order_value,
            customer_count = EXCLUDED.customer_count,
            cancelled_orders = EXCLUDED.cancelled_orders,
            online_orders = EXCLUDED.online_orders,
            takeaway_orders = EXCLUDED.takeaway_orders,
            dine_in_orders = EXCLUDED.dine_in_orders
        `, [storeIdx, dateStr, rev, ord, (rev / ord).toFixed(2), cust, canc, online, take, dine]);
      }
    }

    // 9. Seed District KPIs — 30 days
    const baseDistrictRevenues = [
      230000, 233000, 280000, 220000, 255000, 230000,
      257000, 258000, 260000
    ];
    for (let distIdx = 1; distIdx <= 9; distIdx++) {
      const baseRev = baseDistrictRevenues[distIdx - 1];
      const storesCount = 2;
      for (let d = 0; d < NUM_DAYS; d++) {
        const dateObj = new Date(today);
        dateObj.setDate(today.getDate() - (NUM_DAYS - 1 - d));
        const dateStr = toDateStr(dateObj);
        const factor = dayVariation(d);
        const rev = Math.round(baseRev * factor);
        const ord = Math.round(rev / 285);
        const cust = Math.round(ord * 1.1);
        const canc = Math.round(ord * 0.022);
        await client.query(`
          INSERT INTO district_kpis 
          (district_id, kpi_date, total_stores, active_stores, total_revenue, total_orders, average_order_value, customer_count, cancelled_orders) 
          VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (district_id, kpi_date) DO UPDATE SET
            total_revenue = EXCLUDED.total_revenue,
            total_orders = EXCLUDED.total_orders,
            average_order_value = EXCLUDED.average_order_value,
            customer_count = EXCLUDED.customer_count,
            cancelled_orders = EXCLUDED.cancelled_orders
        `, [distIdx, dateStr, storesCount, rev, ord, (rev / ord).toFixed(2), cust, canc]);
      }
    }

    // 10. Seed Region KPIs — 30 days
    const baseRegionRevenues = [743000, 705000, 775000];
    const regionStores = [6, 6, 6];
    const regionDistricts = [3, 3, 3];
    for (let regIdx = 1; regIdx <= 3; regIdx++) {
      const baseRev = baseRegionRevenues[regIdx - 1];
      for (let d = 0; d < NUM_DAYS; d++) {
        const dateObj = new Date(today);
        dateObj.setDate(today.getDate() - (NUM_DAYS - 1 - d));
        const dateStr = toDateStr(dateObj);
        const factor = dayVariation(d);
        const rev = Math.round(baseRev * factor);
        const ord = Math.round(rev / 285);
        const cust = Math.round(ord * 1.1);
        const canc = Math.round(ord * 0.022);
        await client.query(`
          INSERT INTO region_kpis 
          (region_id, kpi_date, total_districts, total_stores, active_stores, total_revenue, total_orders, average_order_value, customer_count, cancelled_orders) 
          VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (region_id, kpi_date) DO UPDATE SET
            total_revenue = EXCLUDED.total_revenue,
            total_orders = EXCLUDED.total_orders,
            average_order_value = EXCLUDED.average_order_value,
            customer_count = EXCLUDED.customer_count,
            cancelled_orders = EXCLUDED.cancelled_orders
        `, [regIdx, dateStr, regionDistricts[regIdx - 1], regionStores[regIdx - 1], rev, ord, (rev / ord).toFixed(2), cust, canc]);
      }
    }

    // 11. Seed orders & order_items for recent 30 days
    const customersList = ['John Doe', 'Alice Smith', 'Bob Johnson', 'Emily Davis', 'Michael Brown', 'Sophia Wilson', 'Daniel Taylor', 'Olivia Thomas'];
    for (let storeIdx = 1; storeIdx <= 18; storeIdx++) {
      for (let d = 0; d < NUM_DAYS; d++) {
        const dateObj = new Date(today);
        dateObj.setDate(today.getDate() - (NUM_DAYS - 1 - d));
        const dateStr = `${toDateStr(dateObj)} 13:00:00`;

        const cust = customersList[(storeIdx + d) % customersList.length];
        const amount = baseRevenues[storeIdx - 1] * dayVariation(d) * 0.005;
        const status = (storeIdx + d) % 5 === 0 ? 'Cancelled' : 'Completed';

        const orderRes = await client.query(`
          INSERT INTO orders (store_id, customer_name, total_amount, status, created_at) 
          VALUES ($1, $2, $3, $4, $5) 
          RETURNING id;
        `, [storeIdx, cust, amount.toFixed(2), status, dateStr]);
        const orderId = orderRes.rows[0].id;

        const menuItemId = amount > 500 ? 1 : 5;
        await client.query(`
          INSERT INTO order_items (order_id, menu_item_id, quantity, price) 
          VALUES ($1, $2, 1, $3);
        `, [orderId, menuItemId, amount.toFixed(2)]);
      }
    }

    // 10b. Seed Corporate KPIs — 30 days
    for (let d = 0; d < NUM_DAYS; d++) {
      const dateObj = new Date(today);
      dateObj.setDate(today.getDate() - (NUM_DAYS - 1 - d));
      const dateStr = toDateStr(dateObj);
      const factor = dayVariation(d);
      const rev = Math.round(2223000 * factor);
      const ord = Math.round(7800 * factor);
      const cust = Math.round(8580 * factor);
      const canc = Math.round(156 * factor);
      await client.query(`
        INSERT INTO corporate_kpis 
        (corporate_id, kpi_date, total_regions, total_districts, total_stores, active_stores, total_revenue, total_orders, average_order_value, customer_count, cancelled_orders) 
        VALUES (1, $1, 3, 9, 18, 18, $2, $3, $4, $5, $6)
        ON CONFLICT (corporate_id, kpi_date) DO UPDATE SET
          total_revenue = EXCLUDED.total_revenue,
          total_orders = EXCLUDED.total_orders,
          average_order_value = EXCLUDED.average_order_value,
          customer_count = EXCLUDED.customer_count,
          cancelled_orders = EXCLUDED.cancelled_orders;
      `, [dateStr, rev, ord, (rev / ord).toFixed(2), cust, canc]);
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