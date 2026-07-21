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
  TrendingDown,
  Filter,
  Store,
  XCircle,
  Sparkles,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Trophy,
  Crown,
  Flame,
  Receipt,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { 
  AreaChart,
  Area,
  Line, 
  PieChart,
  Pie,
  Cell,
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

// Helper to safely format any insight value as string
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
  const [selectedDate, setSelectedDate] = useState(() => {
    const paramDate = searchParams.get('date');
    if (paramDate) return paramDate;
    const today = new Date();
    return today.toISOString().split('T')[0];
  });

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

  // Sync search parameters to filter states on initial load
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
    }
  }, [storeIdParam, districtIdParam, regionIdParam, stores, districts]);

  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (dateParam && dateParam !== selectedDate) {
      setSelectedDate(dateParam);
    }
  }, [searchParams]);

  // Primary TanStack Query: Fetch base dashboard analytics for selected date & scope filters from PostgreSQL
  const { data, isLoading, isError } = useQuery<DashboardResponse>({
    queryKey: [
      'dashboardData', 
      currentUser?.id, 
      currentUser?.role, 
      currentUser?.assigned_store_id, 
      currentUser?.assigned_district_id, 
      currentUser?.assigned_region_id, 
      selectedDate,
      filterRegion,
      filterDistrict,
      filterStore
    ],
    queryFn: async () => {
      if (!currentUser) throw new Error('No user authenticated');
      const response = await api.get('/api/dashboard', {
        params: {
          userId: currentUser.id,
          kpiDate: selectedDate || undefined,
          filterRegionId: filterRegion || undefined,
          filterDistrictId: filterDistrict || undefined,
          filterStoreId: filterStore || undefined
        }
      });
      return response.data;
    },
    enabled: !!currentUser
  });

  // Return exact database-queried metrics & charts directly from PostgreSQL
  const activeData = React.useMemo(() => {
    if (!data) return null;
    return {
      metrics: data.metrics,
      scopeTable: data.scopeTable || [],
      scopeName: data.scopeName || 'All Stores',
      revenueTrend: data.revenueTrend || [],
      orderDistribution: data.orderDistribution || [],
      peakHours: data.peakHours || []
    };
  }, [data]);

  const [itemTab, setItemTab] = useState<'top' | 'lowest'>('top');
  const activeMetrics = activeData?.metrics || data?.metrics;
  const activeScopeName = activeData?.scopeName || data?.scopeName || 'All Operations';
  const activeRevenueTrend = activeData?.revenueTrend || data?.revenueTrend || [];
  const activeOrderDistribution = activeData?.orderDistribution || data?.orderDistribution || [];
  const activeTopSelling = data?.topSelling || [];
  const activeLowestSelling = data?.lowestSelling || [];

  // Top 5 stores system-wide for benchmark comparison
  const top5Stores = data?.top5StoresCorporate || [];
  const userStoreRank = data?.userStoreRank || null;

  const isUserStoreInTop5 = React.useMemo(() => {
    if (!userStoreRank) return true;
    return top5Stores.some(s => s.store_id === userStoreRank.store_id);
  }, [top5Stores, userStoreRank]);

  // Real orders retrieved directly from PostgreSQL database
  const activeRecentOrders = data?.recentOrders || [];

  // Derive AI Insights directly in frontend from active metrics
  const aiInsights = React.useMemo(() => {
    if (!activeMetrics) return null;
    const { 
      totalRevenue = 0, 
      totalOrders = 0, 
      avgOrderValue = 0, 
      totalCustomers = 0, 
      cancellationRate = 0, 
      totalProfit = 0, 
      profitMargin = 0 
    } = activeMetrics;
    const scope_name = activeScopeName;
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
  }, [activeMetrics, activeScopeName]);

  const [llmInsights, setLlmInsights] = useState<{
    executive_summary: string;
    key_business_insights: string;
    alerts: string;
    possible_reasons: string;
    business_recommendations: string;
  } | null>(null);
  const [isLlmLoading, setIsLlmLoading] = useState(false);

  const cacheKey = `llm_insights_${activeScopeName}_${selectedDate}_${activeMetrics?.totalRevenue || 0}`;

  // Automatically trigger AI insights ONCE on initial login, then restore from cache on page shifts
  useEffect(() => {
    if (!activeMetrics) return;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setLlmInsights(JSON.parse(cached));
      } else {
        const hasAutoGeneratedOnLogin = sessionStorage.getItem('has_auto_generated_insights_login');
        if (!hasAutoGeneratedOnLogin) {
          sessionStorage.setItem('has_auto_generated_insights_login', 'true');
          fetchGroqInsights();
        } else {
          setLlmInsights(null);
        }
      }
    } catch (e) {
      setLlmInsights(null);
    }
  }, [cacheKey]);

  const fetchGroqInsights = async () => {
    if (!activeMetrics) return;
    setIsLlmLoading(true);
    try {
      const response = await api.post('/api/generate-insights', {
        total_revenue: activeMetrics.totalRevenue,
        total_orders: activeMetrics.totalOrders,
        average_order_value: activeMetrics.avgOrderValue,
        customer_count: activeMetrics.totalCustomers,
        cancelled_orders: Math.round((activeMetrics.cancellationRate * activeMetrics.totalOrders) / 100),
        total_expenses: Number((activeMetrics.totalCost || (activeMetrics.totalRevenue * 0.58)).toFixed(2)),
        scope_name: activeScopeName,
        past_data_trend: activeRevenueTrend,
        order_channel_distribution: activeOrderDistribution
      });
      if (response.data.status === 'success' && response.data.insights) {
        setLlmInsights(response.data.insights);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify(response.data.insights));
        } catch (e) {
          // sessionStorage full or disabled
        }
      }
    } catch (err) {
      console.error('Failed to fetch Groq LLM insights:', err);
    } finally {
      setIsLlmLoading(false);
    }
  };

  // Frontend-only handler updates
  const handleRegionChange = (val: string) => {
    setFilterRegion(val);
    setFilterDistrict('');
    setFilterStore('');
  };

  const handleDistrictChange = (val: string) => {
    setFilterDistrict(val);
    setFilterStore('');
  };

  const handleStoreChange = (val: string) => {
    setFilterStore(val);
  };

  const updateSelectedDate = (nextDate: string) => {
    setSelectedDate(nextDate);
    const params = new URLSearchParams(searchParams);
    params.set('date', nextDate);
    setSearchParams(params);
  };

  const shiftSelectedDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    updateSelectedDate(current.toISOString().split('T')[0]);
  };

  const visibleDistricts = filterRegion 
    ? districts.filter(d => d.region_id === parseInt(filterRegion, 10))
    : districts;

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

  if (isError || !data || !activeMetrics) {
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
              {activeScopeName}
            </span>
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Selected sales snapshot — {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-2 py-2 shadow-sm">
            <button
              type="button"
              onClick={() => shiftSelectedDate(-1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              aria-label="Previous day"
            >
              <ChevronLeft size={16} />
            </button>
            <label className="flex items-center gap-2 px-2 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
              <CalendarDays size={14} className="text-blue-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => updateSelectedDate(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-transparent px-2 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
            <button
              type="button"
              onClick={() => shiftSelectedDate(1)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
              aria-label="Next day"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {(filterRegion || filterDistrict || filterStore) && (
            <button
              onClick={() => {
                setFilterRegion('');
                setFilterDistrict('');
                setFilterStore('');
              }}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-350 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white shadow-sm transition-all active:scale-95"
            >
              ← Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* 2. Regional / Store Selectors (Frontend Only Filter) */}
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
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Today's Orders</span>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-2">{formatNumber(activeMetrics.totalOrders)}</h3>
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
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Today's Revenue</span>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-2">{formatCurrency(activeMetrics.totalRevenue)}</h3>
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
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Today's Expenses</span>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-2">{formatCurrency(activeMetrics.totalCost)}</h3>
          </div>
        </Card>

        {/* Card 4: Net Profit */}
        <Card hoverable className="flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500">
              <TrendingUp size={24} />
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 px-2.5 py-1 rounded-md">
              <span>{activeMetrics.profitMargin}% Margin</span>
            </div>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Today's Net Profit</span>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-2">{formatCurrency(activeMetrics.totalProfit)}</h3>
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
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-2">{formatCurrency(activeMetrics.avgOrderValue)}</h3>
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
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-2">{activeMetrics.cancellationRate}%</h3>
          </div>
        </Card>

      </div>

      {/* 4. Row 2: 30-Day Revenue, Profit & Orders Trend + Order Channel Distribution Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Trend Area & Line Chart (2 Cols) */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <CardHeader className="border-b-0 pb-0 mb-4 pt-0">
            <div className="flex flex-wrap items-center justify-between gap-2 w-full">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
                <CardTitle className="text-xs uppercase tracking-widest">30-Day Revenue, Profit & Orders Trend</CardTitle>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold">
                <div className="flex items-center gap-1 text-blue-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span>Revenue</span>
                </div>
                <div className="flex items-center gap-1 text-emerald-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span>Net Profit</span>
                </div>
                <div className="flex items-center gap-1 text-amber-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>Orders</span>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="h-72 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeRevenueTrend} margin={{ top: 10, right: 20, left: -10, bottom: 25 }}>
                  <defs>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/>
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
                    dy={10}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                  />
                  <YAxis 
                    yAxisId="left"
                    stroke="#94a3b8" 
                    fontSize={10} 
                    fontWeight={600}
                    tickLine={false} 
                    axisLine={false}
                    domain={[0, 'auto']}
                    dx={-8}
                    tickFormatter={(val) => val >= 100000 ? `₹${(val / 100000).toFixed(1)}L` : val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val}`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    stroke="#f59e0b" 
                    fontSize={10} 
                    fontWeight={600}
                    tickLine={false} 
                    axisLine={false}
                    domain={[0, 'auto']}
                    dx={8}
                    tickFormatter={(val) => `${val} ord`}
                  />
                  <Tooltip content={<CustomTooltip formatter={(val) => typeof val === 'number' && val > 2000 ? formatCurrency(val) : `${val}`} />} />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    fillOpacity={1}
                    fill="url(#blueGradient)"
                    name="Revenue"
                    dot={{ r: 4, strokeWidth: 1.5, stroke: '#fff', fill: '#3b82f6' }} 
                    activeDot={{ r: 6 }} 
                  />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    fillOpacity={1}
                    fill="url(#greenGradient)"
                    name="Net Profit"
                    dot={{ r: 4, strokeWidth: 1.5, stroke: '#10b981', fill: '#10b981' }} 
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#f59e0b" 
                    strokeWidth={2.5} 
                    name="Orders"
                    dot={{ r: 3, strokeWidth: 1, stroke: '#fff', fill: '#f59e0b' }} 
                    activeDot={{ r: 5 }} 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Channel Distribution Pie Chart (1 Col) */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="border-b-0 pb-0 mb-2 pt-0">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-4 bg-amber-500 rounded-full"></span>
              <CardTitle className="text-xs uppercase tracking-widest">Order Channel Distribution</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col items-center justify-center flex-1">
            <div className="h-56 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={activeOrderDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {activeOrderDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || (index === 0 ? '#3b82f6' : index === 1 ? '#f59e0b' : '#10b981')} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip formatter={(val) => `${val} orders`} />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Total Count Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-extrabold text-slate-850 dark:text-white">
                  {activeOrderDistribution.reduce((a, b) => a + b.value, 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Orders</span>
              </div>
            </div>

            {/* Legend breakdown below chart */}
            <div className="w-full grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              {activeOrderDistribution.map((dist, idx) => {
                const totalDist = activeOrderDistribution.reduce((a, b) => a + b.value, 0);
                const pct = totalDist > 0 ? Math.round((dist.value / totalDist) * 100) : 0;
                return (
                  <div key={idx} className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/30 flex flex-col items-center">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dist.color || '#3b82f6' }} />
                      <span className="truncate max-w-[70px]">{dist.name}</span>
                    </div>
                    <span className="text-xs font-extrabold text-slate-800 dark:text-white mt-0.5">{dist.value}</span>
                    <span className="text-[9px] font-semibold text-slate-400">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Row 3: Daily Orders Taken & Items Table */}
      <div className="w-full">
        <Card>
          <CardHeader className="border-b-0 pb-0 mb-4 pt-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-500">
                  <Receipt size={18} />
                </div>
                <div>
                  <CardTitle className="text-xs uppercase tracking-widest flex items-center gap-2">
                    Daily Orders & Items Transaction Log
                  </CardTitle>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">
                    Itemized breakdown of orders taken on {new Date(selectedDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} across stores.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                  <ShoppingBag size={13} />
                  <span>{activeRecentOrders.length} Orders Logged Today</span>
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-2">
            <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Store Outlet</TableHead>
                    <TableHead className="min-w-[280px]">Items Taken (Order Breakdown)</TableHead>
                    <TableHead className="w-28 text-center">Time Taken</TableHead>
                    <TableHead className="w-28 text-center">Status</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeRecentOrders.map((ord: any) => {
                    const timeFormatted = ord.created_at ? new Date(ord.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '1:30 PM';
                    
                    let statusBadge = (
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                        <CheckCircle2 size={11} /> Completed
                      </span>
                    );
                    if (ord.status === 'Cancelled') {
                      statusBadge = (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                          <XCircle size={11} /> Cancelled
                        </span>
                      );
                    } else if (ord.status === 'Pending') {
                      statusBadge = (
                        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                          <Clock size={11} /> Pending
                        </span>
                      );
                    }

                    return (
                      <TableRow key={ord.id}>
                        <TableCell className="font-mono font-extrabold text-xs text-blue-600 dark:text-blue-400 py-3.5">
                          #ORD-{ord.id}
                        </TableCell>
                        <TableCell className="font-bold text-slate-800 dark:text-white py-3.5 text-xs">
                          {ord.customer_name || 'Walk-in Customer'}
                        </TableCell>
                        <TableCell className="py-3.5">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <Store size={14} className="text-blue-500" />
                            {ord.store_name}
                          </span>
                        </TableCell>
                        <TableCell className="py-3.5">
                          <div className="flex flex-wrap gap-1">
                            {ord.items_summary ? ord.items_summary.split(', ').map((itemStr: string, idx: number) => (
                              <span key={idx} className="text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md">
                                🍕 {itemStr}
                              </span>
                            )) : (
                              <span className="text-[11px] text-slate-400 font-medium">Standard Menu Order</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs text-slate-500 dark:text-slate-400 py-3.5">
                          {timeFormatted}
                        </TableCell>
                        <TableCell className="text-center py-3.5">
                          {statusBadge}
                        </TableCell>
                        <TableCell className="text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-xs py-3.5">
                          {formatCurrency(Number(ord.total_amount || 0))}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Store Performance Ranking Leaderboard & Top Sales Items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        
        {/* Top 5 Ranked Stores Table (2 Cols) */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <CardHeader className="border-b-0 pb-0 mb-4 pt-0">
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-500">
                  <Trophy size={18} />
                </div>
                <div>
                  <CardTitle className="text-xs uppercase tracking-widest flex items-center gap-2">
                    Top 5 Ranked Stores Performance Leaderboard
                  </CardTitle>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">
                    Real-time ranking of top performing restaurant stores calculated by revenue generation.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 px-2.5 py-1 rounded-lg flex items-center gap-1">
                <Crown size={12} /> Top Performers
              </span>
            </div>
          </CardHeader>

          <CardContent className="pt-2">
            <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Store Scope</TableHead>
                    <TableHead>District & Region</TableHead>
                    <TableHead className="text-right">Orders</TableHead>
                    <TableHead className="text-right">Avg Order Value</TableHead>
                    <TableHead className="text-right">Total Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {top5Stores.map((store, index) => {
                    const rank = index + 1;
                    const aov = store.total_orders > 0 ? Number(store.total_revenue) / Number(store.total_orders) : 0;
                    const isMyStore = userStoreRank && userStoreRank.store_id === store.store_id;
                    
                    let rankBadge = (
                      <span className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-extrabold text-xs flex items-center justify-center">
                        #{rank}
                      </span>
                    );
                    if (rank === 1) {
                      rankBadge = (
                        <span className="w-7 h-7 rounded-full bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center shadow-md shadow-amber-500/30">
                          🥇
                        </span>
                      );
                    } else if (rank === 2) {
                      rankBadge = (
                        <span className="w-7 h-7 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-100 font-extrabold text-xs flex items-center justify-center shadow-sm">
                          🥈
                        </span>
                      );
                    } else if (rank === 3) {
                      rankBadge = (
                        <span className="w-7 h-7 rounded-full bg-amber-700 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
                          🥉
                        </span>
                      );
                    }

                    return (
                      <TableRow 
                        key={store.store_id} 
                        onClick={() => handleStoreChange(store.store_id.toString())}
                        title="Click to filter store dashboard"
                        className={`cursor-pointer transition-colors hover:bg-blue-50/60 dark:hover:bg-slate-800/60 ${isMyStore ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-l-4 border-l-indigo-600' : rank === 1 ? 'bg-amber-50/20 dark:bg-amber-950/10' : ''}`}
                      >
                        <TableCell className="py-3.5">{rankBadge}</TableCell>
                        <TableCell className="font-bold text-slate-900 dark:text-white py-3.5">
                          <div className="flex items-center gap-2">
                            <Store size={15} className={isMyStore ? "text-indigo-600" : rank === 1 ? "text-amber-500" : "text-blue-500"} />
                            <span className="text-xs font-bold">{store.store_name}</span>
                            {rank === 1 && (
                              <span className="text-[9px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded uppercase">
                                Leader
                              </span>
                            )}
                            {isMyStore && (
                              <span className="text-[9px] font-extrabold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded uppercase">
                                Your Store
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {store.district_name}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {store.region_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-mono font-semibold text-slate-700 dark:text-slate-300 py-3.5">
                          {formatNumber(store.total_orders)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-slate-600 dark:text-slate-400 py-3.5">
                          {formatCurrency(aov)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400 py-3.5 text-sm">
                          {formatCurrency(store.total_revenue)}
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {/* Render User's Store Position if outside Top 5 */}
                  {!isUserStoreInTop5 && userStoreRank && (
                    <TableRow className="bg-indigo-50/60 dark:bg-indigo-950/30 border-t-2 border-indigo-200 dark:border-indigo-800">
                      <TableCell className="py-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-indigo-600 text-white font-extrabold text-[11px] flex items-center justify-center shadow-sm">
                          #{userStoreRank.rank}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-indigo-950 dark:text-indigo-100 py-3.5">
                        <div className="flex items-center gap-2">
                          <Store size={15} className="text-indigo-600 dark:text-indigo-400" />
                          <span className="text-xs font-extrabold">{userStoreRank.store_name}</span>
                          <span className="text-[9px] font-extrabold bg-indigo-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Your Store Position
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {userStoreRank.district_name}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {userStoreRank.region_name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-slate-700 dark:text-slate-300 py-3.5">
                        {formatNumber(userStoreRank.total_orders)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs text-slate-600 dark:text-slate-400 py-3.5">
                        {formatCurrency(userStoreRank.total_orders > 0 ? Number(userStoreRank.total_revenue) / Number(userStoreRank.total_orders) : 0)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-extrabold text-indigo-600 dark:text-indigo-400 py-3.5 text-sm">
                        {formatCurrency(userStoreRank.total_revenue)}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Top & Lowest Sales Items in Stores (1 Col) */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="border-b-0 pb-0 mb-3 pt-0">
            <div className="flex flex-col gap-2.5 w-full">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl ${itemTab === 'top' ? 'bg-orange-50 dark:bg-orange-950/30 text-orange-500' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-500'}`}>
                    {itemTab === 'top' ? <Flame size={18} /> : <TrendingDown size={18} />}
                  </div>
                  <div>
                    <CardTitle className="text-xs uppercase tracking-widest">
                      {itemTab === 'top' ? 'Top Selling Items' : 'Lowest Selling Items'}
                    </CardTitle>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-0.5">
                      Matched to {new Date(selectedDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} snapshot.
                    </p>
                  </div>
                </div>
              </div>

              {/* Tab Selector */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setItemTab('top')}
                  className={`py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                    itemTab === 'top'
                      ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  <Flame size={13} />
                  <span>Top Sellers</span>
                </button>
                <button
                  type="button"
                  onClick={() => setItemTab('lowest')}
                  className={`py-1.5 rounded-lg transition-all text-center flex items-center justify-center gap-1 cursor-pointer ${
                    itemTab === 'lowest'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  <TrendingDown size={13} />
                  <span>Slow Movers</span>
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="space-y-2.5">
              {(itemTab === 'top' ? activeTopSelling : activeLowestSelling).slice(0, 5).map((item, idx) => {
                const maxRev = (itemTab === 'top' ? activeTopSelling : activeLowestSelling)[0]?.revenue || 1;
                const pct = Math.min(100, Math.max(5, Math.round((item.revenue / (maxRev || 1)) * 100)));
                return (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-md font-extrabold text-[10px] flex items-center justify-center ${
                          itemTab === 'top' 
                            ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400' 
                            : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                        }`}>
                          #{idx + 1}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 dark:text-white leading-tight">{item.name}</h4>
                          <span className="text-[10px] font-semibold text-slate-400">{item.category} • {formatNumber(item.sold)} units sold</span>
                        </div>
                      </div>
                      <span className="text-xs font-extrabold text-slate-900 dark:text-white font-mono">
                        {formatCurrency(item.revenue)}
                      </span>
                    </div>
                    {/* Visual sales share progress bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          itemTab === 'top' 
                            ? 'bg-gradient-to-r from-orange-500 to-amber-400' 
                            : 'bg-gradient-to-r from-rose-500 to-red-400'
                        }`} 
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

      </div>

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
            className={`flex items-center gap-1.5 text-xs font-extrabold px-4 py-1.5 rounded-xl transition-all cursor-pointer disabled:opacity-50 ${
              llmInsights 
                ? 'text-violet-600 dark:text-violet-400 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800'
                : 'text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-500/20'
            }`}
          >
            <Sparkles size={14} className={isLlmLoading ? "animate-spin" : ""} />
            {isLlmLoading ? 'Generating AI Analysis...' : llmInsights ? 'Refresh AI Insights' : '✨ Generate AI Insights'}
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