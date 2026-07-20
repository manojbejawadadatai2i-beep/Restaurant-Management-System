import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5174'
  ],
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'none';");
  next();
});

const query = async (text, params) => {
  try {
    return await pool.query(text, params);
  } catch (err) {
    console.error('Database query error:', err.message, '\nQuery:', text);
    throw new Error('Internal Database Error');
  }
};

// 1. Get all users for mock login / role switcher
app.get('/api/users', async (req, res) => {
  try {
    const result = await query(`
      SELECT u.id, u.username, u.role, 
             u.assigned_store_id, s.name as store_name,
             u.assigned_district_id, d.name as district_name,
             u.assigned_region_id, r.name as region_name
      FROM users u
      LEFT JOIN stores s ON u.assigned_store_id = s.id
      LEFT JOIN districts d ON u.assigned_district_id = d.id
      LEFT JOIN regions r ON u.assigned_region_id = r.id
      ORDER BY u.id ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
});

// Create user (User Management)
app.post('/api/users', async (req, res) => {
  const {
    username,
    email,
    password,
    role,
    assigned_store_id,
    assigned_district_id,
    assigned_region_id,
    addNewStore,
    newStoreName,
    newStoreId
  } = req.body;

  if (!username || !role) {
    return res.status(400).json({ error: 'Username and role are required' });
  }

  try {
    if (email) {
      const existingEmail = await query('SELECT id FROM users WHERE email = $1', [email]);
      if (existingEmail.rows.length > 0) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }

    const existingUsername = await query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUsername.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    let finalStoreId = assigned_store_id ? parseInt(assigned_store_id, 10) : null;

    if (addNewStore) {
      if (!newStoreName || !newStoreId) {
        return res.status(400).json({ error: 'New Store Name and ID are required' });
      }
      const storeIdInt = parseInt(newStoreId, 10);
      if (isNaN(storeIdInt)) {
        return res.status(400).json({ error: 'New Store ID must be a number' });
      }

      const existingStoreId = await query('SELECT id FROM stores WHERE id = $1', [storeIdInt]);
      if (existingStoreId.rows.length > 0) {
        return res.status(400).json({ error: 'Store ID already exists' });
      }

      const existingStoreName = await query('SELECT id FROM stores WHERE name = $1', [newStoreName]);
      if (existingStoreName.rows.length > 0) {
        return res.status(400).json({ error: 'Store name already exists' });
      }

      if (!assigned_district_id || !assigned_region_id) {
        return res.status(400).json({ error: 'Region and District are required to create a new store' });
      }

      await query(`
        INSERT INTO stores (id, name, district_id, region_id) 
        VALUES ($1, $2, $3, $4)
      `, [
        storeIdInt,
        newStoreName,
        parseInt(assigned_district_id, 10),
        parseInt(assigned_region_id, 10)
      ]);

      await query(`
        SELECT setval('stores_id_seq', COALESCE((SELECT MAX(id)+1 FROM stores), 1), false)
      `);

      finalStoreId = storeIdInt;
    }

    const result = await query(`
      INSERT INTO users (username, email, password, role, assigned_store_id, assigned_district_id, assigned_region_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [
      username,
      email || null,
      password || null,
      role,
      finalStoreId,
      assigned_district_id ? parseInt(assigned_district_id, 10) : null,
      assigned_region_id ? parseInt(assigned_region_id, 10) : null
    ]);

    res.json({ success: true, message: 'User added successfully', userId: result.rows[0].id });
  } catch (err) {
    console.error('Failed to add user:', err);
    res.status(500).json({ error: 'Failed to add user' });
  }
});

// Create/Update user assignments (User Management)
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { role, assigned_store_id, assigned_district_id, assigned_region_id } = req.body;

  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    await query(`
      UPDATE users 
      SET role = $1, 
          assigned_store_id = $2, 
          assigned_district_id = $3, 
          assigned_region_id = $4
      WHERE id = $5
    `, [
      role,
      assigned_store_id ? parseInt(assigned_store_id, 10) : null,
      assigned_district_id ? parseInt(assigned_district_id, 10) : null,
      assigned_region_id ? parseInt(assigned_region_id, 10) : null,
      userId
    ]);
    res.json({ success: true, message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Delete user (User Management)
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    const userRes = await query('SELECT role FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userRes.rows[0].role === 'Corporate Administrator') {
      return res.status(403).json({ error: 'Corporate Administrator cannot be deleted' });
    }

    await query('DELETE FROM users WHERE id = $1', [userId]);
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});


// 2. Fetch metadata for Corporate / Admin selectors
app.get('/api/meta', async (req, res) => {
  try {
    const regions = await query('SELECT id, name FROM regions ORDER BY id');
    const districts = await query('SELECT id, name, region_id FROM districts ORDER BY id');
    const stores = await query('SELECT id, name, district_id, region_id FROM stores ORDER BY id');
    res.json({
      regions: regions.rows,
      districts: districts.rows,
      stores: stores.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve meta data' });
  }
});

// Helper to resolve user scope for reports and dashboard
const resolveUserScope = async (userId) => {
  if (!userId) throw new Error('userId is required');
  const userRes = await query('SELECT * FROM users WHERE id = $1', [parseInt(userId, 10)]);
  if (userRes.rows.length === 0) {
    throw new Error('User not found');
  }
  const user = userRes.rows[0];
  const { role, assigned_store_id, assigned_district_id, assigned_region_id } = user;

  let storeIdsFilter = [];
  let isFiltered = false;

  if (role === 'Store Manager') {
    if (!assigned_store_id) {
      storeIdsFilter = [-1];
    } else {
      storeIdsFilter = [assigned_store_id];
    }
    isFiltered = true;
  } else if (role === 'District Manager') {
    if (!assigned_district_id) {
      storeIdsFilter = [-1];
    } else {
      const storesRes = await query('SELECT id FROM stores WHERE district_id = $1', [assigned_district_id]);
      storeIdsFilter = storesRes.rows.map(s => s.id);
    }
    isFiltered = true;
  } else if (role === 'Regional Manager') {
    if (!assigned_region_id) {
      storeIdsFilter = [-1];
    } else {
      const storesRes = await query('SELECT id FROM stores WHERE region_id = $1', [assigned_region_id]);
      storeIdsFilter = storesRes.rows.map(s => s.id);
    }
    isFiltered = true;
  }
  return { isFiltered, storeIdsFilter, role };
};

// 3. Main Dashboard Data Endpoint with RBAC and Scope Filtering
app.get('/api/dashboard', async (req, res) => {
  const { userId, filterRegionId, filterDistrictId, filterStoreId, hourFilter } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const userRes = await query('SELECT * FROM users WHERE id = $1', [parseInt(userId, 10)]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const user = userRes.rows[0];
    const { role, assigned_store_id, assigned_district_id, assigned_region_id } = user;

    let scopeType = 'corporate';
    let scopeId = null;
    let scopeName = 'All Stores';

    if (role === 'Store Manager') {
      scopeType = 'store';
      scopeId = assigned_store_id;
    } else if (role === 'District Manager') {
      scopeType = 'district';
      scopeId = assigned_district_id;
    } else if (role === 'Regional Manager') {
      scopeType = 'region';
      scopeId = assigned_region_id;
    } else {
      if (filterStoreId) {
        scopeType = 'store';
        scopeId = parseInt(filterStoreId, 10);
      } else if (filterDistrictId) {
        scopeType = 'district';
        scopeId = parseInt(filterDistrictId, 10);
      } else if (filterRegionId) {
        scopeType = 'region';
        scopeId = parseInt(filterRegionId, 10);
      }
    }

    let regionsCount = 0;
    let districtsCount = 0;
    let storesCount = 0;
    let storeIdsList = [];

    if (scopeType === 'store') {
      const storeRes = await query('SELECT s.name, s.district_id, s.region_id FROM stores s WHERE s.id = $1', [scopeId]);
      if (storeRes.rows.length > 0) {
        scopeName = storeRes.rows[0].name;
      }
      regionsCount = 1;
      districtsCount = 1;
      storesCount = 1;
      storeIdsList = [scopeId];
    } else if (scopeType === 'district') {
      const distRes = await query('SELECT name FROM districts WHERE id = $1', [scopeId]);
      if (distRes.rows.length > 0) {
        scopeName = distRes.rows[0].name;
      }
      const storesRes = await query('SELECT id FROM stores WHERE district_id = $1', [scopeId]);
      storeIdsList = storesRes.rows.map(s => s.id);
      regionsCount = 1;
      districtsCount = 1;
      storesCount = storeIdsList.length;
    } else if (scopeType === 'region') {
      const regRes = await query('SELECT name FROM regions WHERE id = $1', [scopeId]);
      if (regRes.rows.length > 0) {
        scopeName = regRes.rows[0].name;
      }
      const distsRes = await query('SELECT id FROM districts WHERE region_id = $1', [scopeId]);
      const storesRes = await query('SELECT id FROM stores WHERE region_id = $1', [scopeId]);
      storeIdsList = storesRes.rows.map(s => s.id);
      regionsCount = 1;
      districtsCount = distsRes.rows.length;
      storesCount = storesRes.rows.length;
    } else {
      scopeName = 'All Stores';
      const regs = await query('SELECT COUNT(*) as count FROM regions');
      const dists = await query('SELECT COUNT(*) as count FROM districts');
      const strs = await query('SELECT COUNT(*) as count FROM stores');
      regionsCount = parseInt(regs.rows[0].count, 10);
      districtsCount = parseInt(dists.rows[0].count, 10);
      storesCount = parseInt(strs.rows[0].count, 10);

      const storesRes = await query('SELECT id FROM stores');
      storeIdsList = storesRes.rows.map(s => s.id);
    }

    let totalRevenue = 0;
    let totalOrders = 0;
    let averageOrderValue = 0;
    let customerCount = 0;
    let cancelledOrders = 0;
    let trendRows = [];

    const latestDateRes = await query('SELECT MAX(kpi_date) as max_date FROM region_kpis');
    const latestDate = latestDateRes.rows[0].max_date || new Date('2026-07-10');

    if (scopeType === 'store') {
      const kpis = await query('SELECT * FROM daily_store_kpis WHERE store_id = $1 ORDER BY kpi_date ASC', [scopeId]);
      trendRows = kpis.rows;
      const latestKpi = kpis.rows.find(k => k.kpi_date.toISOString().split('T')[0] === latestDate.toISOString().split('T')[0]) || kpis.rows[kpis.rows.length - 1];
      if (latestKpi) {
        totalRevenue = parseFloat(latestKpi.total_revenue);
        totalOrders = latestKpi.total_orders;
        averageOrderValue = parseFloat(latestKpi.average_order_value);
        customerCount = latestKpi.customer_count;
        cancelledOrders = latestKpi.cancelled_orders;
      }
    } else if (scopeType === 'district') {
      const kpis = await query('SELECT * FROM district_kpis WHERE district_id = $1 ORDER BY kpi_date ASC', [scopeId]);
      trendRows = kpis.rows;
      const latestKpi = kpis.rows.find(k => k.kpi_date.toISOString().split('T')[0] === latestDate.toISOString().split('T')[0]) || kpis.rows[kpis.rows.length - 1];
      if (latestKpi) {
        totalRevenue = parseFloat(latestKpi.total_revenue);
        totalOrders = latestKpi.total_orders;
        averageOrderValue = parseFloat(latestKpi.average_order_value);
        customerCount = latestKpi.customer_count;
        cancelledOrders = latestKpi.cancelled_orders;
      }
    } else if (scopeType === 'region') {
      const kpis = await query('SELECT * FROM region_kpis WHERE region_id = $1 ORDER BY kpi_date ASC', [scopeId]);
      trendRows = kpis.rows;
      const latestKpi = kpis.rows.find(k => k.kpi_date.toISOString().split('T')[0] === latestDate.toISOString().split('T')[0]) || kpis.rows[kpis.rows.length - 1];
      if (latestKpi) {
        totalRevenue = parseFloat(latestKpi.total_revenue);
        totalOrders = latestKpi.total_orders;
        averageOrderValue = parseFloat(latestKpi.average_order_value);
        customerCount = latestKpi.customer_count;
        cancelledOrders = latestKpi.cancelled_orders;
      }
    } else {
      const kpis = await query(`
        SELECT kpi_date, 
               SUM(total_revenue) as total_revenue, 
               SUM(total_orders) as total_orders, 
               SUM(customer_count) as customer_count, 
               SUM(cancelled_orders) as cancelled_orders
        FROM region_kpis 
        GROUP BY kpi_date 
        ORDER BY kpi_date ASC
      `);
      trendRows = kpis.rows;
      const latestKpi = kpis.rows.find(k => k.kpi_date.toISOString().split('T')[0] === latestDate.toISOString().split('T')[0]) || kpis.rows[kpis.rows.length - 1];
      if (latestKpi) {
        totalRevenue = parseFloat(latestKpi.total_revenue);
        totalOrders = parseInt(latestKpi.total_orders, 10);
        customerCount = parseInt(latestKpi.customer_count, 10);
        cancelledOrders = parseInt(latestKpi.cancelled_orders, 10);
        averageOrderValue = totalOrders > 0 ? parseFloat((totalRevenue / totalOrders).toFixed(2)) : 0;
      }
    }

    let hourFactor = 1.0;
    if (hourFilter === '7-9') hourFactor = 0.30;
    else if (hourFilter === '9-12') hourFactor = 0.10;
    else if (hourFilter === '12-15') hourFactor = 0.35;
    else if (hourFilter === '15-18') hourFactor = 0.25;

    totalRevenue = totalRevenue * hourFactor;
    totalOrders = Math.round(totalOrders * hourFactor);
    customerCount = Math.round(customerCount * hourFactor);
    cancelledOrders = Math.round(cancelledOrders * hourFactor);
    averageOrderValue = totalOrders > 0 ? parseFloat((totalRevenue / totalOrders).toFixed(2)) : 0;

    const totalCost = parseFloat((totalRevenue * 0.58).toFixed(2));
    const totalProfit = parseFloat((totalRevenue - totalCost).toFixed(2));
    const profitMargin = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;
    const cancellationRate = totalOrders > 0 ? Math.round((cancelledOrders / totalOrders) * 100) : 0;

    const menuCountRes = await query('SELECT COUNT(*) as total FROM menu_items');
    const totalMenuItems = parseInt(menuCountRes.rows[0].total, 10);

    const hourlyDistribution = [
      { hour: '7 AM', share: 0.13 },
      { hour: '8 AM', share: 0.17 },
      { hour: '1 PM', share: 0.28 },
      { hour: '2 PM', share: 0.22 },
      { hour: '4 PM', share: 0.20 }
    ];

    const revenueTrendData = hourlyDistribution.map(item => {
      const rev = parseFloat((totalRevenue * item.share).toFixed(2));
      const cost = parseFloat((rev * 0.58).toFixed(2));
      return {
        name: item.hour,
        revenue: rev,
        profit: parseFloat((rev - cost).toFixed(2))
      };
    });

    const isAll = !hourFilter || hourFilter === 'All';
    const peakHoursData = [
      { name: '7 AM', Completed: (isAll || hourFilter === '7-9') ? Math.round(totalOrders * (hourFilter === '7-9' ? 0.43 : 0.13)) : 0, Cancelled: (isAll || hourFilter === '7-9') ? Math.round(cancelledOrders * (hourFilter === '7-9' ? 0.4 : 0.1)) : 0 },
      { name: '8 AM', Completed: (isAll || hourFilter === '7-9') ? Math.round(totalOrders * (hourFilter === '7-9' ? 0.57 : 0.17)) : 0, Cancelled: (isAll || hourFilter === '7-9') ? Math.round(cancelledOrders * (hourFilter === '7-9' ? 0.6 : 0.15)) : 0 },
      { name: '1 PM', Completed: (isAll || hourFilter === '12-15') ? Math.round(totalOrders * (hourFilter === '12-15' ? 0.56 : 0.28)) : 0, Cancelled: (isAll || hourFilter === '12-15') ? Math.round(cancelledOrders * (hourFilter === '12-15' ? 0.55 : 0.3)) : 0 },
      { name: '2 PM', Completed: (isAll || hourFilter === '12-15') ? Math.round(totalOrders * (hourFilter === '12-15' ? 0.44 : 0.22)) : 0, Cancelled: (isAll || hourFilter === '12-15') ? Math.round(cancelledOrders * (hourFilter === '12-15' ? 0.45 : 0.25)) : 0 },
      { name: '4 PM', Completed: (isAll || hourFilter === '15-18') ? Math.round(totalOrders * (hourFilter === '15-18' ? 1.0 : 0.2)) : 0, Cancelled: (isAll || hourFilter === '15-18') ? Math.round(cancelledOrders * (hourFilter === '15-18' ? 1.0 : 0.2)) : 0 }
    ];

    let compSum = peakHoursData.reduce((acc, h) => acc + h.Completed, 0);
    let diff = (totalOrders - cancelledOrders) - compSum;
    if (diff !== 0 && peakHoursData.some(h => h.Completed > 0)) {
      const activeIdx = peakHoursData.findIndex(h => h.Completed > 0);
      if (activeIdx !== -1) peakHoursData[activeIdx].Completed += diff;
    }

    const topSellingRes = [
      { name: 'Seafood Platter', category: 'Mains', sold: Math.round(totalOrders * 0.2), revenue: parseFloat((totalRevenue * 0.3).toFixed(2)) },
      { name: 'Garlic Butter Lobster', category: 'Mains', sold: Math.round(totalOrders * 0.15), revenue: parseFloat((totalRevenue * 0.25).toFixed(2)) },
      { name: 'Grilled Salmon', category: 'Mains', sold: Math.round(totalOrders * 0.25), revenue: parseFloat((totalRevenue * 0.2).toFixed(2)) },
      { name: 'Crispy Calamari', category: 'Appetizers', sold: Math.round(totalOrders * 0.25), revenue: parseFloat((totalRevenue * 0.15).toFixed(2)) },
      { name: 'Chocolate Lava Cake', category: 'Desserts', sold: Math.round(totalOrders * 0.15), revenue: parseFloat((totalRevenue * 0.1).toFixed(2)) }
    ];

    let staffRes;
    if (scopeType === 'store') {
      staffRes = await query(`
        SELECT u.username, u.role, s.name as assignment_name
        FROM users u
        JOIN stores s ON u.assigned_store_id = s.id
        WHERE u.assigned_store_id = $1
        ORDER BY u.role, u.username
      `, [scopeId]);
    } else if (scopeType === 'district') {
      staffRes = await query(`
        SELECT u.username, u.role, COALESCE(s.name, d.name) as assignment_name
        FROM users u
        LEFT JOIN stores s ON u.assigned_store_id = s.id
        LEFT JOIN districts d ON u.assigned_district_id = d.id
        WHERE u.assigned_district_id = $1 OR s.district_id = $1
        ORDER BY u.role, u.username
      `, [scopeId]);
    } else if (scopeType === 'region') {
      staffRes = await query(`
        SELECT u.username, u.role, COALESCE(s.name, d.name, r.name) as assignment_name
        FROM users u
        LEFT JOIN stores s ON u.assigned_store_id = s.id
        LEFT JOIN districts d ON u.assigned_district_id = d.id
        LEFT JOIN regions r ON u.assigned_region_id = r.id
        WHERE u.assigned_region_id = $1 OR d.region_id = $1 OR s.region_id = $1
        ORDER BY u.role, u.username
      `, [scopeId]);
    } else {
      staffRes = await query(`
        SELECT u.username, u.role, COALESCE(s.name, d.name, r.name, 'System-Wide') as assignment_name
        FROM users u
        LEFT JOIN stores s ON u.assigned_store_id = s.id
        LEFT JOIN districts d ON u.assigned_district_id = d.id
        LEFT JOIN regions r ON u.assigned_region_id = r.id
        ORDER BY u.role, u.username
      `);
    }

    let recentOrdersRes;
    if (scopeType === 'store') {
      recentOrdersRes = await query(`
        SELECT o.id, s.name as store_name, o.customer_name, o.total_amount, o.status, o.created_at,
               (SELECT string_agg(mi.name || ' x' || oi.quantity, ', ') 
                FROM order_items oi 
                JOIN menu_items mi ON oi.menu_item_id = mi.id 
                WHERE oi.order_id = o.id) as items_summary
        FROM orders o
        JOIN stores s ON o.store_id = s.id
        WHERE o.store_id = $1
        ORDER BY o.created_at DESC
        LIMIT 5
      `, [scopeId]);
    } else if (scopeType === 'district') {
      recentOrdersRes = await query(`
        SELECT o.id, s.name as store_name, o.customer_name, o.total_amount, o.status, o.created_at,
               (SELECT string_agg(mi.name || ' x' || oi.quantity, ', ') 
                FROM order_items oi 
                JOIN menu_items mi ON oi.menu_item_id = mi.id 
                WHERE oi.order_id = o.id) as items_summary
        FROM orders o
        JOIN stores s ON o.store_id = s.id
        WHERE s.district_id = $1
        ORDER BY o.created_at DESC
        LIMIT 5
      `, [scopeId]);
    } else if (scopeType === 'region') {
      recentOrdersRes = await query(`
        SELECT o.id, s.name as store_name, o.customer_name, o.total_amount, o.status, o.created_at,
               (SELECT string_agg(mi.name || ' x' || oi.quantity, ', ') 
                FROM order_items oi 
                JOIN menu_items mi ON oi.menu_item_id = mi.id 
                WHERE oi.order_id = o.id) as items_summary
        FROM orders o
        JOIN stores s ON o.store_id = s.id
        WHERE s.region_id = $1
        ORDER BY o.created_at DESC
        LIMIT 5
      `, [scopeId]);
    } else {
      recentOrdersRes = await query(`
        SELECT o.id, s.name as store_name, o.customer_name, o.total_amount, o.status, o.created_at,
               (SELECT string_agg(mi.name || ' x' || oi.quantity, ', ') 
                FROM order_items oi 
                JOIN menu_items mi ON oi.menu_item_id = mi.id 
                WHERE oi.order_id = o.id) as items_summary
        FROM orders o
        JOIN stores s ON o.store_id = s.id
        ORDER BY o.created_at DESC
        LIMIT 5
      `);
    }

    res.json({
      role,
      scopeName,
      metrics: {
        totalOrders,
        totalRevenue,
        totalCustomers: customerCount,
        totalMenuItems,
        totalCost,
        totalProfit,
        profitMargin,
        avgOrderValue: averageOrderValue,
        cancellationRate
      },
      scopeDirectory: {
        regions: regionsCount,
        districts: districtsCount,
        stores: storesCount
      },
      staff: staffRes.rows,
      revenueTrend: revenueTrendData,
      peakHours: peakHoursData,
      topSelling: topSellingRes,
      recentOrders: recentOrdersRes.rows
    });

  } catch (err) {
    console.error('Failed to retrieve dashboard data:', err);
    res.status(500).json({ error: 'Failed to retrieve dashboard data' });
  }
});

// 3b. Reports Endpoint - Sales by Store
app.get('/api/reports/sales-by-store', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const { isFiltered, storeIdsFilter } = await resolveUserScope(userId);

    let sql = `
      SELECT s.id, s.name as store_name, d.name as district_name, r.name as region_name,
             COALESCE(k.total_orders, 0) as total_orders,
             COALESCE(k.total_revenue, 0) as total_revenue,
             COALESCE(k.average_order_value, 0) as avg_order_value
      FROM stores s
      LEFT JOIN districts d ON s.district_id = d.id
      LEFT JOIN regions r ON s.region_id = r.id
      LEFT JOIN daily_store_kpis k ON s.id = k.store_id AND k.kpi_date = (SELECT MAX(kpi_date) FROM daily_store_kpis)
    `;
    const params = [];
    if (isFiltered) {
      sql += ` WHERE s.id = ANY($1) `;
      params.push(storeIdsFilter);
    }
    sql += ` ORDER BY total_revenue DESC `;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve sales-by-store report' });
  }
});

// 3c. Reports Endpoint - Sales by Category
app.get('/api/reports/sales-by-category', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const { isFiltered, storeIdsFilter } = await resolveUserScope(userId);

    let totalRevenue = 0;
    const latestDateRes = await query('SELECT MAX(kpi_date) as max_date FROM daily_store_kpis');
    const latestDate = latestDateRes.rows[0].max_date || new Date('2026-07-10');

    if (isFiltered) {
      const revRes = await query(`
        SELECT SUM(total_revenue) as total 
        FROM daily_store_kpis 
        WHERE store_id = ANY($1) AND kpi_date = $2
      `, [storeIdsFilter, latestDate]);
      totalRevenue = parseFloat(revRes.rows[0].total || 0);
    } else {
      const revRes = await query(`
        SELECT SUM(total_revenue) as total 
        FROM region_kpis 
        WHERE kpi_date = $1
      `, [latestDate]);
      totalRevenue = parseFloat(revRes.rows[0].total || 0);
    }

    const categories = [
      { category: 'Mains', items_sold: Math.round(totalRevenue * 0.0008), total_revenue: parseFloat((totalRevenue * 0.55).toFixed(2)) },
      { category: 'Appetizers', items_sold: Math.round(totalRevenue * 0.001), total_revenue: parseFloat((totalRevenue * 0.20).toFixed(2)) },
      { category: 'Desserts', items_sold: Math.round(totalRevenue * 0.0006), total_revenue: parseFloat((totalRevenue * 0.12).toFixed(2)) },
      { category: 'Soups', items_sold: Math.round(totalRevenue * 0.0005), total_revenue: parseFloat((totalRevenue * 0.08).toFixed(2)) },
      { category: 'Beverages', items_sold: Math.round(totalRevenue * 0.0004), total_revenue: parseFloat((totalRevenue * 0.05).toFixed(2)) }
    ];

    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve sales-by-category report' });
  }
});

// 3d. Reports Endpoint - Detailed Orders List
app.get('/api/reports/orders', async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const { isFiltered, storeIdsFilter } = await resolveUserScope(userId);

    let sql = `
      SELECT o.id, s.name as store_name, o.customer_name, o.total_amount, o.status, o.created_at,
             (
               SELECT string_agg(mi.name || ' (x' || oi.quantity || ')', ', ')
               FROM order_items oi
               JOIN menu_items mi ON oi.menu_item_id = mi.id
               WHERE oi.order_id = o.id
             ) as items_list
      FROM orders o
      JOIN stores s ON o.store_id = s.id
    `;
    const params = [];
    if (isFiltered) {
      sql += ` WHERE o.store_id = ANY($1) `;
      params.push(storeIdsFilter);
    }
    sql += ` ORDER BY o.created_at DESC `;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve detailed orders report' });
  }
});

// 4. Site Health Endpoint (For Administrator role)
app.get('/api/health', async (req, res) => {
  try {
    await query('SELECT 1');
    const memoryUsage = process.memoryUsage();

    res.json({
      status: 'Healthy',
      database: 'Connected',
      uptime: process.uptime(),
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
        heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`
      }
    });
  } catch (err) {
    res.status(500).json({
      status: 'Unhealthy',
      database: 'Disconnected',
      error: 'Database connection failed'
    });
  }
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Express server running on http://127.0.0.1:${PORT}`);
});