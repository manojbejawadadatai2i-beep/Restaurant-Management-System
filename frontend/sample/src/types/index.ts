export interface User {
  id: number;
  username: string;
  role: string;
  assigned_store_id: number | null;
  store_name: string | null;
  assigned_district_id: number | null;
  district_name: string | null;
  assigned_region_id: number | null;
  region_name: string | null;
  email?: string | null;
  password?: string | null;
  token?: string;
  requires_password_change?: boolean;
  is_new_user?: boolean;
  login_method?: string;
}

export interface DBRegion {
  id: number;
  name: string;
}

export interface DBDistrict {
  id: number;
  name: string;
  region_id: number;
}

export interface DBStore {
  id: number;
  name: string;
  district_id: number;
  region_id: number;
}

export interface DBUser {
  id: number;
  username: string;
  role: 'Store Manager' | 'District Manager' | 'Regional Manager' | 'Corporate Administrator' | 'Administrator';
  assigned_store_id: number | null;
  assigned_district_id: number | null;
  assigned_region_id: number | null;
}

export interface DBMenuItem {
  id: number;
  name: string;
  price: number;
  category: string;
}

export interface DBOrder {
  id: number;
  store_id: number;
  customer_name: string;
  total_amount: number;
  status: 'Completed' | 'Cancelled' | 'Pending';
  created_at: string;
}

export interface DBOrderItem {
  id: number;
  order_id: number;
  menu_item_id: number;
  quantity: number;
  price: number;
}

// Summary analytical metrics for the dashboard
export interface DashboardMetrics {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  totalMenuItems: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  avgOrderValue: number;
  cancellationRate: number;
}

// Revenue Trend structure for Recharts Line Chart
export interface RevenueTrendPoint {
  name: string;
  revenue: number;
  profit: number;
}

// Peak Hours structure for Recharts Bar Chart
export interface PeakHoursPoint {
  name: string; // e.g. "7 AM"
  Completed: number;
  Cancelled: number;
}

// Top Selling Items aggregated row
export interface TopSellingItem {
  name: string;
  category: string;
  sold: number;
  revenue: number;
}

// Recent Orders with Store Names
export interface RecentOrderRow {
  id: number;
  store_name: string;
  customer_name: string;
  total_amount: number;
  status: 'Completed' | 'Cancelled' | 'Pending';
  created_at: string;
  items_summary: string;
}

export interface ScopeDirectory {
  regions: number;
  districts: number;
  stores: number;
}

export interface StaffMember {
  username: string;
  role: string;
  assignment_name: string;
}

export interface ScopeTableRow {
  store_id: number;
  store_name: string;
  district_id: number;
  district_name: string;
  region_id: number;
  region_name: string;
  total_revenue: number;
  total_orders: number;
}

// Main API Dashboard Response
export interface DashboardResponse {
  role: string;
  scopeName: string;
  metrics: DashboardMetrics;
  scopeDirectory: ScopeDirectory;
  scopeTable?: ScopeTableRow[];
  staff: StaffMember[];
  revenueTrend: RevenueTrendPoint[];
  peakHours: PeakHoursPoint[];
  topSelling: TopSellingItem[];
  recentOrders: RecentOrderRow[];
}

// Role and Permission definitions
export type UserRole = 
  | 'Corporate Administrator'
  | 'Administrator'
  | 'Store Manager'
  | 'District Manager'
  | 'Regional Manager';

export type Permission = 
  | 'view:user-management'
  | 'view:system-health'
  | 'view:scope-filters'
  | 'view:dashboard'
  | 'view:reports';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  'Corporate Administrator': ['view:scope-filters', 'view:dashboard', 'view:reports'],
  'Administrator': ['view:user-management', 'view:scope-filters'],
  'Regional Manager': ['view:dashboard', 'view:reports'],
  'District Manager': ['view:dashboard', 'view:reports'],
  'Store Manager': ['view:dashboard', 'view:reports'],
};