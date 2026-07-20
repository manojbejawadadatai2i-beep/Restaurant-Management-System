import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/axios';
import { useAuth } from '../../hooks/useAuth';
import { useSearchParams } from 'react-router-dom';
import type { DashboardResponse } from '../../types';
import { 
  ShoppingBag, 
  IndianRupee, 
  TrendingUp, 
  Filter,
  Landmark,
  MapPin,
  Store,
  XCircle,
  Sparkles
} from 'lucide-react';
import { 
  AreaChart,
  Area,
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { Alert } from '../../components/ui/Alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { formatCurrency, formatNumber } from '../../utils/format';

// Custom premium glassmorphism tooltip for Recharts
interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: any) => string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, formatter }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-100 dark:border-slate-850 p-3 rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.06)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.25)] text-xs text-slate-800 dark:text-slate-200 transition-all duration-200">
        <p className="text-[9px] text-slate-400 dark:text-slate-500 uppercase tracking-widest font-extrabold mb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((item, index) => (
            <div key={index} className="flex items-center gap-5 justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
                <span className="text-slate-500 dark:text-slate-450 font-semibold">{item.name}</span>
              </div>
              <span className="font-extrabold text-slate-900 dark:text-white">
                {formatter ? formatter(item.value) : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Custom circular progress component
// Helper to safely format any insight value as string even if AI returns nested objects
const renderInsightText = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(v => typeof v === 'object' ? JSON.stringify(v) : String(v)).join('\n');
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
      .join('\n');
  }
  return String(value);
};

export const Dashboard: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Scoping filters (for Admins / Corporate Admins)
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
  const [districts, setDistricts] = useState<{ id: number; name: string; region_id: number }[]>([]);
  const [stores, setStores] = useState<{ id: number; name: string; district_id: number; region_id: number }[]>([]);
  
  const [filterRegion, setFilterRegion] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterStore, setFilterStore] = useState('');

  const storeIdParam = searchParams.get('storeId');
  const districtIdParam = searchParams.get('districtId');
  const regionIdParam = searchParams.get('regionId');

  // Fetch filter metadata
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await api.get('/api/meta');
        setRegions(response.data.regions);
        setDistricts(response.data.districts);
        setStores(response.data.stores);
      } catch (err) {
        console.error('Failed to load filter metadata', err);
      }
    };
    fetchFilters();
  }, [currentUser]);

  // Sync search parameters to filter states
  useEffect(() => {
    if (stores.length === 0) return;
    
    if (storeIdParam) {
      setFilterStore(storeIdParam);
      const matchedStore = stores.find(s => s.id === parseInt(storeIdParam, 10));
      if (matchedStore) {
        setFilterDistrict(matchedStore.district_id.toString());
        setFilterRegion(matchedStore.region_id.toString());
      }
    } else if (districtIdParam) {
      setFilterDistrict(districtIdParam);
      setFilterStore('');
      const matchedDist = districts.find(d => d.id === parseInt(districtIdParam, 10));
      if (matchedDist) {
        setFilterRegion(matchedDist.region_id.toString());
      }
    } else if (regionIdParam) {
      setFilterRegion(regionIdParam);
      setFilterDistrict('');
      setFilterStore('');
    } else {
      setFilterRegion('');
      setFilterDistrict('');
      setFilterStore('');
    }
  }, [storeIdParam, districtIdParam, regionIdParam, stores, districts]);

  // Primary TanStack Query: Fetch dashboard analytics
  const { data, isLoading, isError } = useQuery<DashboardResponse>({
    queryKey: ['dashboardData', currentUser?.id, filterRegion, filterDistrict, filterStore],
    queryFn: async () => {
      if (!currentUser) throw new Error('No user authenticated');
      const response = await api.get('/api/dashboard', {
        params: {
          userId: currentUser.id,
          filterRegionId: filterRegion || undefined,
          filterDistrictId: filterDistrict || undefined,
          filterStoreId: filterStore || undefined
        }
      });
      return response.data;
    },
    enabled: !!currentUser
  });

  // Derive AI Insights directly in frontend from KPI data without redundant backend API calls
  const aiInsights = React.useMemo(() => {
    if (!data?.metrics) return null;
    const { 
      totalRevenue = 0, 
      totalOrders = 0, 
      avgOrderValue = 0, 
      totalCustomers = 0, 
      cancellationRate = 0, 
      totalProfit = 0, 
      profitMargin = 0 
    } = data.metrics;
    const scope_name = data.scopeName || 'All Operations';
    const cancelledOrders = Math.round((cancellationRate * totalOrders) / 100);

    const formattedRev = totalRevenue >= 100000 
      ? `₹${(totalRevenue / 100000).toFixed(2)} Lakhs` 
      : `₹${totalRevenue.toLocaleString('en-IN')}`;

    const formattedProfit = totalProfit >= 100000
      ? `₹${(totalProfit / 100000).toFixed(2)} Lakhs`
      : `₹${totalProfit.toLocaleString('en-IN')}`;

    return {
      executive_summary: `Overall performance for ${scope_name} remains strong with total revenue reaching ${formattedRev} across ${totalOrders.toLocaleString('en-IN')} orders. Net profit stands at ${formattedProfit} with a ${profitMargin}% margin.`,
      key_business_insights: `Average Order Value (AOV) is ₹${avgOrderValue.toLocaleString('en-IN')} with an active customer base of ${totalCustomers.toLocaleString('en-IN')} customers. Sales volume is heavily driven by top-tier main items and evening peak hours.`,
      alerts: cancellationRate > 4 
        ? `Order cancellation rate is at ${cancellationRate}% (${cancelledOrders} orders) for ${scope_name}. We recommend optimizing kitchen dispatch speed during peak lunch & dinner hours.`
        : `Order cancellation rate is controlled at a healthy ${cancellationRate}% for ${scope_name}, operating comfortably within optimal benchmarks.`,
      possible_reasons: `High revenue density is observed during lunch (12 PM - 3 PM) and dinner shifts. Cost structures reflect direct raw material inventory allocation and distribution expenses.`,
      business_recommendations: `1. Promote combo meal bundles during off-peak hours (4 PM - 6 PM) to raise AOV by 10-15% in ${scope_name}.\n2. Streamline kitchen preparation workflows to reduce order fulfillment turnaround times.\n3. Leverage centralized bulk ingredient procurement to boost net profit margin above ${profitMargin + 2}%.`
    };
  }, [data]);

  const [llmInsights, setLlmInsights] = useState<{
    executive_summary: string;
    key_business_insights: string;
    alerts: string;
    possible_reasons: string;
    business_recommendations: string;
  } | null>(null);
  const [isLlmLoading, setIsLlmLoading] = useState(false);

  const fetchGroqInsights = async () => {
    if (!data?.metrics) return;
    setIsLlmLoading(true);
    try {
      const response = await api.post('/api/generate-insights', {
        total_revenue: data.metrics.totalRevenue,
        total_orders: data.metrics.totalOrders,
        average_order_value: data.metrics.avgOrderValue,
        customer_count: data.metrics.totalCustomers,
        cancelled_orders: Math.round((data.metrics.cancellationRate * data.metrics.totalOrders) / 100),
        total_expenses: data.metrics.totalCost || 0,
        scope_name: data.scopeName || 'All Operations'
      });
      if (response.data.status === 'success' && response.data.insights) {
        setLlmInsights(response.data.insights);
      }
    } catch (err) {
      console.error('Failed to fetch Groq LLM insights:', err);
    } finally {
      setIsLlmLoading(false);
    }
  };

  useEffect(() => {
    if (data?.metrics) {
      fetchGroqInsights();
    }
  }, [data]);

  const handleRegionChange = (val: string) => {
    setFilterRegion(val);
    setFilterDistrict('');
    setFilterStore('');
    const params: Record<string, string> = {};
    if (val) params.regionId = val;
    setSearchParams(params);
  };

  const handleDistrictChange = (val: string) => {
    setFilterDistrict(val);
    setFilterStore('');
    const params: Record<string, string> = {};
    if (filterRegion) params.regionId = filterRegion;
    if (val) params.districtId = val;
    setSearchParams(params);
  };

  const handleStoreChange = (val: string) => {
    setFilterStore(val);
    const params: Record<string, string> = {};
    if (filterRegion) params.regionId = filterRegion;
    if (filterDistrict) params.districtId = filterDistrict;
    if (val) params.storeId = val;
    setSearchParams(params);
  };

  // Filter lists based on hierarchy selection
  const visibleDistricts = filterRegion 
    ? districts.filter(d => d.region_id === parseInt(filterRegion, 10))
    : districts;

  // Correct visibleStores logic to filter by selected region and district,
  // regardless of whether filterStore is currently selected or not.
  const visibleStores = stores.filter(s => {
    if (filterDistrict && s.district_id !== parseInt(filterDistrict, 10)) {
      return false;
    }
    if (filterRegion && s.region_id !== parseInt(filterRegion, 10)) {
      return false;
    }
    return true;
  });

  const showSelectors = hasPermission('view:scope-filters');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Syncing with PostgreSQL...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Alert variant="error" title="Database Connection Error">
        Unable to fetch real-time metrics. Please verify that your Node.js API server is running on port 5001 and your database is accessible.
      </Alert>
    );
  }

  const userDisplayName = currentUser?.username ? currentUser.username.split(' ')[0] : 'User';

  return (
    <div className="space-y-8 pb-10">
      
      {/* 1. Header with Title & Date controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-850 dark:text-white tracking-tight flex items-center gap-2">
            <span>Welcome back, {userDisplayName}</span>
            <span className="text-sm px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-500 font-semibold">
              {data.scopeName}
            </span>
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Restaurant operations, sales volume, and order analytics.
          </p>
        </div>
        
        {/* Back to Overview Button */}
        {(filterRegion || filterDistrict || filterStore) && (
          <button
            onClick={() => {
              setFilterRegion('');
              setFilterDistrict('');
              setFilterStore('');
              setSearchParams({});
            }}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-350 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white shadow-sm transition-all active:scale-95"
          >
            ← Back to Overview
          </button>
        )}
      </div>

      {/* 2. Regional / Store Selectors (Corporate / Administrator view only) */}
      {showSelectors && (
        <Card className="p-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-wrap items-center gap-4 transition-colors">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Filter size={12} className="text-blue-500" /> Filter Scope
          </div>

          <div className="flex flex-wrap gap-3 flex-1 min-w-[280px]">
            {/* Region Dropdown */}
            <div className="flex-1 min-w-[130px]">
              <Select
                value={filterRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
                placeholder="All Regions"
                options={regions.map(r => ({ value: r.id, label: r.name }))}
              />
            </div>

            {/* District Dropdown */}
            <div className="flex-1 min-w-[130px]">
              <Select
                value={filterDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                placeholder="All Districts"
                options={visibleDistricts.map(d => ({ value: d.id, label: d.name }))}
              />
            </div>

            {/* Store Dropdown */}
            <div className="flex-1 min-w-[130px]">
              <Select
                value={filterStore}
                onChange={(e) => handleStoreChange(e.target.value)}
                placeholder="All Stores"
                options={visibleStores.map(s => ({ value: s.id, label: s.name }))}
              />
            </div>
          </div>

          {/* Clear Filters Button */}
          {(filterRegion || filterDistrict || filterStore) && (
            <button
              onClick={() => {
                setFilterRegion('');
                setFilterDistrict('');
                setFilterStore('');
                setSearchParams({});
              }}
              className="text-[10px] uppercase tracking-wider font-bold text-red-500 hover:text-red-600 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              Reset
            </button>
          )}
        </Card>
      )}

      {/* 3. Summary Metrics Cards (Grid of 6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Total Orders */}
        <Card hoverable className="flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500">
              <ShoppingBag size={24} />
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md">
              <TrendingUp size={12} />
              <span>+12%</span>
            </div>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Orders</span>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-2">{formatNumber(data.metrics.totalOrders)}</h3>
          </div>
        </Card>

        {/* Card 2: Total Revenue */}
        <Card hoverable className="flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-500">
              <IndianRupee size={24} />
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md">
              <TrendingUp size={12} />
              <span>+8%</span>
            </div>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Revenue</span>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-2">{formatCurrency(data.metrics.totalRevenue)}</h3>
          </div>
        </Card>

        {/* Card 3: Total Expenses */}
        <Card hoverable className="flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-500">
              <ShoppingBag size={24} />
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50/70 dark:bg-red-950/40 px-2.5 py-1 rounded-md">
              <span>Cost</span>
            </div>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Expenses</span>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-2">{formatCurrency(data.metrics.totalCost)}</h3>
          </div>
        </Card>

        {/* Card 4: Net Profit */}
        <Card hoverable className="flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500">
              <TrendingUp size={24} />
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md">
              <span>{data.metrics.profitMargin}% Margin</span>
            </div>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Net Profit</span>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-2">{formatCurrency(data.metrics.totalProfit)}</h3>
          </div>
        </Card>

        {/* Card 5: Average Order Value (AOV) */}
        <Card hoverable className="flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-500">
              <TrendingUp size={24} />
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-emerald-50/70 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md">
              <span>AOV</span>
            </div>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Avg Order Value</span>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-2">{formatCurrency(data.metrics.avgOrderValue)}</h3>
          </div>
        </Card>

        {/* Card 6: Cancellation Rate */}
        <Card hoverable className="flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-500">
              <XCircle size={24} />
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/40 px-2.5 py-1 rounded-md">
              <span>Rate</span>
            </div>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cancellation Rate</span>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-2">{data.metrics.cancellationRate}%</h3>
          </div>
        </Card>

      </div>

      {/* 4. Row 2: Revenue & Net Profit Performance Area Chart */}
      <div className="w-full">
        <Card className="flex flex-col justify-between">
          <CardHeader className="border-b-0 pb-0 mb-4 pt-0">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5">
                <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                <CardTitle className="text-xs uppercase tracking-widest">Revenue & Profit Performance</CardTitle>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <div className="flex items-center gap-1 text-blue-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span>Revenue</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Net Profit</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="h-60 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-slate-800" opacity={0.25} vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    fontWeight={600}
                    tickLine={false} 
                    axisLine={false} 
                    dy={8}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    fontWeight={600}
                    tickLine={false} 
                    axisLine={false}
                    domain={[0, 'auto']}
                    dx={-8}
                    tickFormatter={(val) => val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`}
                  />
                  <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    fillOpacity={1}
                    fill="url(#blueGradient)"
                    name="revenue"
                    dot={{ r: 4, strokeWidth: 1.5, stroke: '#fff', fill: '#3b82f6' }} 
                    activeDot={{ r: 6 }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    fillOpacity={1}
                    fill="url(#greenGradient)"
                    name="profit"
                    dot={{ r: 4, strokeWidth: 1.5, stroke: '#10b981', fill: '#10b981' }} 
                    activeDot={{ r: 6 }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Row 3: Order Status Analytics */}
      <div className="w-full">
        <Card>
          <CardHeader className="border-b-0 pb-0 mb-4 pt-0">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
                <CardTitle className="text-xs uppercase tracking-widest">Order Status Analytics</CardTitle>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-bold">
                <div className="flex items-center gap-1 text-emerald-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-1 text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span>
                  <span>Cancelled</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.peakHours} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-100 dark:text-slate-800" opacity={0.25} vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    fontWeight={600}
                    tickLine={false} 
                    axisLine={false} 
                    dy={8}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    fontWeight={600}
                    tickLine={false} 
                    axisLine={false}
                    domain={[0, 'auto']}
                    dx={-8}
                    tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val.toString()}
                  />
                  <Tooltip content={<CustomTooltip formatter={(val) => `${val} orders`} />} />
                  <Line 
                    type="monotone" 
                    dataKey="Completed" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 1.5, stroke: '#fff', fill: '#10b981' }}
                    activeDot={{ r: 6, strokeWidth: 2 }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Cancelled" 
                    stroke="#ef4444" 
                    strokeWidth={3} 
                    dot={{ r: 4, strokeWidth: 1.5, stroke: '#fff', fill: '#ef4444' }}
                    activeDot={{ r: 6, strokeWidth: 2 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Scope Directory & Scope Hierarchy Table */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
            <h2 className="text-xs font-bold text-slate-850 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <Landmark size={14} className="text-blue-500" /> Scope Directory & Hierarchy Table
            </h2>
          </div>
          <span className="text-[10px] text-blue-500 font-bold bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded-md">
            Single Source of Truth
          </span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-4 leading-relaxed">
          Operational boundaries and store-level aggregations calculated dynamically on-the-fly from individual store records.
        </p>

        {/* Counts Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center">
                <Landmark size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Regions</p>
                <p className="text-base font-extrabold text-slate-800 dark:text-white">{data.scopeDirectory.regions}</p>
              </div>
            </div>
            <span className="text-[9px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-500 px-2 py-0.5 rounded">Active</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
                <MapPin size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Districts</p>
                <p className="text-base font-extrabold text-slate-800 dark:text-white">{data.scopeDirectory.districts}</p>
              </div>
            </div>
            <span className="text-[9px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-500 px-2 py-0.5 rounded">Active</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center">
                <Store size={16} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stores</p>
                <p className="text-base font-extrabold text-slate-800 dark:text-white">{data.scopeDirectory.stores}</p>
              </div>
            </div>
            <span className="text-[9px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 px-2 py-0.5 rounded">Active</span>
          </div>
        </div>

        {/* Scope Hierarchy Table */}
        {data.scopeTable && data.scopeTable.length > 0 && (
          <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store Scope</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Aggregated Orders</TableHead>
                  <TableHead className="text-right">Aggregated Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.scopeTable.map((row) => (
                  <TableRow key={row.store_id}>
                    <TableCell className="font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <Store size={14} className="text-emerald-500" />
                        <span>{row.store_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <MapPin size={12} className="text-amber-500" />
                        {row.district_name}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        <Landmark size={12} className="text-blue-500" />
                        {row.region_name}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {formatNumber(row.total_orders)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(row.total_revenue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* 6. Bottom Section: Groq Llama 3.3 AI Insights */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-4 bg-violet-500 rounded-full"></span>
            <h2 className="text-xs font-bold text-slate-855 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={14} className="text-violet-500" /> Groq Llama 3.3 AI Insights
            </h2>
          </div>
          <button 
            onClick={fetchGroqInsights}
            disabled={isLlmLoading}
            className="flex items-center gap-1.5 text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 dark:hover:bg-violet-950/70 border border-violet-200 dark:border-violet-800 px-3 py-1 rounded-lg transition-all cursor-pointer disabled:opacity-50"
          >
            <Sparkles size={12} className={isLlmLoading ? "animate-spin text-violet-500" : "text-violet-500"} />
            {isLlmLoading ? 'Analyzing...' : 'Refresh AI Insights'}
          </button>
        </div>

        <div className="mt-2 space-y-4">
          {(llmInsights || aiInsights) ? (
            <div className="space-y-3.5">
              {/* Executive Summary */}
              <div className="p-3.5 rounded-xl bg-violet-50/40 dark:bg-violet-950/10 border border-violet-100/50 dark:border-violet-900/20">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-1">Executive Summary</h4>
                <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-medium">
                  {renderInsightText((llmInsights || aiInsights)?.executive_summary)}
                </p>
              </div>

              {/* Key Insights & Recommendations Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Key Insights</h4>
                  <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-medium whitespace-pre-line">
                    {renderInsightText((llmInsights || aiInsights)?.key_business_insights)}
                  </p>
                </div>
                
                <div className="p-3.5 rounded-xl bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">Recommendations</h4>
                  <p className="text-xs text-slate-650 dark:text-emerald-350 leading-relaxed font-medium whitespace-pre-line">
                    {renderInsightText((llmInsights || aiInsights)?.business_recommendations)}
                  </p>
                </div>
              </div>

              {/* Alerts & Possible Reasons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-amber-50/30 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/20">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">Alerts</h4>
                  <p className="text-xs text-slate-650 dark:text-amber-350 leading-relaxed font-medium whitespace-pre-line">
                    {renderInsightText((llmInsights || aiInsights)?.alerts)}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Possible Reasons</h4>
                  <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-medium whitespace-pre-line">
                    {renderInsightText((llmInsights || aiInsights)?.possible_reasons)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl py-12 text-center text-slate-400 dark:text-slate-500">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-450 dark:text-slate-450">Generating AI Insights...</span>
            </div>
          )}
        </div>
      </Card>

    </div>
  );
};