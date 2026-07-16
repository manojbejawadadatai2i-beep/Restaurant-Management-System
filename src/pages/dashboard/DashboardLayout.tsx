import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../hooks/useRBAC';
import type { DashboardResponse } from '../../types/dashboard';
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
const CircularProgress: React.FC<{ percent: number; label: string; trackClass: string; strokeColor: string }> = ({ 
  percent, 
  label, 
  trackClass,
  strokeColor 
}) => {
  const radius = 28;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-2 flex-1">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          {/* Background track */}
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className={`${trackClass} transition-colors`}
          />
          {/* Progress circle */}
          <circle
            cx="32"
            cy="32"
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-in-out"
          />
        </svg>
        <span className="absolute text-xs font-bold text-slate-800 dark:text-slate-200">{percent}%</span>
      </div>
      <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-2 uppercase tracking-wider text-center">{label}</span>
    </div>
  );
};

export const DashboardLayout: React.FC = () => {
  const { currentUser } = useAuth();
  const { hasPermission } = useRBAC();
  
  // Scoping filters (for Admins / Corporate Admins)
  const [regions, setRegions] = useState<{ id: number; name: string }[]>([]);
  const [districts, setDistricts] = useState<{ id: number; name: string; region_id: number }[]>([]);
  const [stores, setStores] = useState<{ id: number; name: string; district_id: number; region_id: number }[]>([]);
  
  const [filterRegion, setFilterRegion] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterStore, setFilterStore] = useState('');

  // AI Insights State
  const [aiInsights, setAiInsights] = useState<{
    executive_summary: string;
    key_business_insights: string;
    alerts: string;
    possible_reasons: string;
    business_recommendations: string;
  } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);

  // Fetch filter metadata
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5001/api/meta');
        setRegions(response.data.regions);
        setDistricts(response.data.districts);
        setStores(response.data.stores);
      } catch (err) {
        console.error('Failed to load filter metadata', err);
      }
    };
    fetchFilters();
  }, [currentUser]);

  // Primary TanStack Query: Fetch dashboard analytics with active filters and 3-second polling
  const { data, isLoading, isError } = useQuery<DashboardResponse>({
    queryKey: ['dashboardData', currentUser?.id, filterRegion, filterDistrict, filterStore],
    queryFn: async () => {
      if (!currentUser) throw new Error('No user authenticated');
      const response = await axios.get('http://127.0.0.1:5001/api/dashboard', {
        params: {
          userId: currentUser.id,
          filterRegionId: filterRegion || undefined,
          filterDistrictId: filterDistrict || undefined,
          filterStoreId: filterStore || undefined
        }
      });
      return response.data;
    },
    enabled: !!currentUser,
    refetchInterval: 3000 // Automatically poll every 3 seconds to catch PostgreSQL updates!
  });

  // Fetch AI Insights whenever metrics data changes
  useEffect(() => {
    if (!data?.metrics) return;

    const fetchInsights = async () => {
      setAiLoading(true);
      setAiError(false);
      try {
        const response = await axios.post('http://127.0.0.1:8000/generate-insights', {
          total_revenue: data.metrics.totalRevenue,
          total_orders: data.metrics.totalOrders,
          average_order_value: data.metrics.avgOrderValue,
          customer_count: data.metrics.totalCustomers,
          cancelled_orders: Math.round((data.metrics.cancellationRate * data.metrics.totalOrders) / 100),
          total_expenses: data.metrics.totalCost || 0
        });

        if (response.data.status === 'success') {
          setAiInsights(response.data.insights);
        } else {
          setAiError(true);
        }
      } catch (err) {
        console.error('Failed to fetch AI insights:', err);
        setAiError(true);
      } finally {
        setAiLoading(false);
      }
    };

    fetchInsights();
  }, [data, currentUser]);

  // Reset dependent filters when parent changes
  const handleRegionChange = (val: string) => {
    setFilterRegion(val);
    setFilterDistrict('');
    setFilterStore('');
  };

  const handleDistrictChange = (val: string) => {
    setFilterDistrict(val);
    setFilterStore('');
  };

  // Filter lists based on hierarchy selection
  const visibleDistricts = filterRegion 
    ? districts.filter(d => d.region_id === parseInt(filterRegion, 10))
    : districts;

  const visibleStores = filterStore 
    ? stores 
    : filterDistrict 
      ? stores.filter(s => s.district_id === parseInt(filterDistrict, 10))
      : filterRegion 
        ? stores.filter(s => s.region_id === parseInt(filterRegion, 10))
        : stores;

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
      <div className="bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm">
        <h3 className="text-red-600 dark:text-red-400 font-bold text-base mb-2">Database Connection Error</h3>
        <p className="text-xs text-red-550 dark:text-red-300 leading-relaxed">
          Unable to fetch real-time metrics. Please verify that your Node.js API server is running on port 5001 and your database is accessible.
        </p>
      </div>
    );
  }

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-8 pb-10">
      
      {/* 1. Header with Title & Date controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-850 dark:text-white tracking-tight flex items-center gap-2">
            <span>Welcome back, {currentUser?.username.split(' ')[0]}</span>
            <span className="text-sm px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-500 font-semibold">
              {data.scopeName}
            </span>
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Restaurant operations, sales volume, and order analytics.
          </p>
        </div>
      </div>

      {/* 2. Regional / Store Selectors (Corporate / Administrator view only) */}
      {showSelectors && (
        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 rounded-2xl p-4 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-wrap items-center gap-4 transition-colors">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <Filter size={12} className="text-blue-500" /> Filter Scope
          </div>

          <div className="flex flex-wrap gap-3 flex-1 min-w-[280px]">
            {/* Region Dropdown */}
            <div className="flex-1 min-w-[130px]">
              <select
                value={filterRegion}
                onChange={(e) => handleRegionChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
              >
                <option value="">All Regions</option>
                {regions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>

            {/* District Dropdown */}
            <div className="flex-1 min-w-[130px]">
              <select
                value={filterDistrict}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
              >
                <option value="">All Districts</option>
                {visibleDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>

            {/* Store Dropdown */}
            <div className="flex-1 min-w-[130px]">
              <select
                value={filterStore}
                onChange={(e) => setFilterStore(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-700 dark:text-slate-300 focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-all"
              >
                <option value="">All Stores</option>
                {visibleStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
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
              className="text-[10px] uppercase tracking-wider font-bold text-red-500 hover:text-red-650 transition-colors px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {/* 3. Summary Metrics Cards (Grid of 6) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Total Orders */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-200">
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
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-2">{data.metrics.totalOrders}</h3>
          </div>
        </div>

        {/* Card 2: Total Revenue */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-200">
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
        </div>

        {/* Card 3: Total Expenses */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-200">
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
        </div>

        {/* Card 4: Net Profit */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-200">
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
            <h3 className="text-3xl font-extrabold text-slate-850 dark:text-white tracking-tight mt-2">{formatCurrency(data.metrics.totalProfit)}</h3>
          </div>
        </div>

        {/* Card 5: Average Order Value (AOV) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-200">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-500">
              <TrendingUp size={24} />
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/40 px-2.5 py-1 rounded-md">
              <span>AOV</span>
            </div>
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Avg Order Value</span>
            <h3 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight mt-2">{formatCurrency(data.metrics.avgOrderValue)}</h3>
          </div>
        </div>

        {/* Card 6: Cancellation Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100/80 dark:border-slate-800/80 rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between hover:translate-y-[-2px] transition-all duration-200">
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
        </div>

      </div>

      {/* 4. Row 2: Circular Progress charts & Smooth Blue/Green Gradient Area Line Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Widget: Circular progress charts (Figma minimalist design) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest">Operational & Financial</h2>
              <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">94% Health</span>
            </div>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-6 leading-relaxed">
              Performance indicators across order fulfilment, margins, and kitchen efficiency.
            </p>
          </div>
          
          <div className="flex items-center justify-around gap-2 my-2">
            <CircularProgress 
              percent={92} 
              label="Fulfillment" 
              trackClass="text-slate-100 dark:text-slate-800"
              strokeColor="#3b82f6"
            />
            <CircularProgress 
              percent={data.metrics.profitMargin} 
              label="Profit Margin" 
              trackClass="text-slate-100 dark:text-slate-800"
              strokeColor="#10b981"
            />
            <CircularProgress 
              percent={88} 
              label="Kitchen" 
              trackClass="text-slate-100 dark:text-slate-800"
              strokeColor="#f59e0b"
            />
          </div>

          <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50 flex justify-between items-center text-[10px] text-slate-400">
            <span>Last calculated: 3s ago</span>
            <button className="text-blue-500 hover:underline font-bold">Details</button>
          </div>
        </div>

        {/* Right Widget: Smooth Blue Gradient Area Line Chart (2/3 width) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-100/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
              <h2 className="text-xs font-bold text-slate-850 dark:text-white uppercase tracking-widest">Financial Performance</h2>
            </div>
            {/* Custom Chart Legend */}
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
        </div>

      </div>

      {/* 5. Row 3: Multi-Line Graph */}
      <div className="w-full">
        
        {/* Multi-Line Graph: Completed vs Cancelled orders */}
        <div className="bg-white dark:bg-slate-900 border border-slate-100/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              <h2 className="text-xs font-bold text-slate-855 dark:text-white uppercase tracking-widest">Order Status Analytics</h2>
            </div>
            
            {/* Custom Legend */}
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
        </div>

      </div>

      {/* 5. Scope Directory */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs font-bold text-slate-850 dark:text-white uppercase tracking-widest">Scope Directory</h2>
          <span className="text-[10px] text-blue-500 font-bold bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded-md">Metadata</span>
        </div>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-6 leading-relaxed">
          Count of operational assets linked to the active filtering boundary.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-2">
          {/* Regions count */}
          <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 p-4 rounded-xl text-center">
            <div className="mx-auto w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-500 flex items-center justify-center mb-2">
              <Landmark size={16} />
            </div>
            <div className="text-xl font-extrabold text-slate-800 dark:text-white">{data.scopeDirectory.regions}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Regions</div>
          </div>

          {/* Districts count */}
          <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 p-4 rounded-xl text-center">
            <div className="mx-auto w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center mb-2">
              <MapPin size={16} />
            </div>
            <div className="text-xl font-extrabold text-slate-800 dark:text-white">{data.scopeDirectory.districts}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Districts</div>
          </div>

          {/* Stores count */}
          <div className="bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 p-4 rounded-xl text-center">
            <div className="mx-auto w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center mb-2">
              <Store size={16} />
            </div>
            <div className="text-xl font-extrabold text-slate-800 dark:text-white">{data.scopeDirectory.stores}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">Stores</div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50 text-[10px] text-slate-400">
          Active Store Directory Boundaries
        </div>
      </div>

      {/* 6. Bottom Section: AI Insights */}
      <div className="bg-white dark:bg-slate-900 border border-slate-100/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.015)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-4 bg-violet-500 rounded-full"></span>
            <h2 className="text-xs font-bold text-slate-855 dark:text-white uppercase tracking-widest flex items-center gap-2">
              <Sparkles size={14} className="text-violet-500" /> AI Insights Summary
            </h2>
          </div>
          <span className="text-[9px] font-bold text-violet-500 bg-violet-50 dark:bg-violet-950/20 px-2 py-0.5 rounded-md">
            {aiInsights ? '5' : '0'} Insights
          </span>
        </div>

        <div className="mt-2 space-y-4">
          {aiLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">AI Agent analyzing metrics...</p>
            </div>
          ) : aiError ? (
            <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl p-4 text-center">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                AI Agent Service is not running on port 8000.
              </p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                Once your friend starts the FastAPI service, this dashboard will automatically load live AI Insights here.
              </p>
            </div>
          ) : aiInsights ? (
            <div className="space-y-3.5">
              {/* Executive Summary */}
              <div className="p-3.5 rounded-xl bg-violet-50/40 dark:bg-violet-950/10 border border-violet-100/50 dark:border-violet-900/20">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 mb-1">Executive Summary</h4>
                <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-medium">
                  {aiInsights.executive_summary}
                </p>
              </div>

              {/* Key Insights & Recommendations Split */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-105 dark:border-slate-800/80">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Key Insights</h4>
                  <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-medium">
                    {aiInsights.key_business_insights}
                  </p>
                </div>
                
                <div className="p-3.5 rounded-xl bg-emerald-50/30 dark:bg-emerald-950/10 border border-emerald-100/50 dark:border-emerald-900/20">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1.5">Recommendations</h4>
                  <p className="text-xs text-slate-650 dark:text-emerald-350 leading-relaxed font-medium">
                    {aiInsights.business_recommendations}
                  </p>
                </div>
              </div>

              {/* Alerts & Possible Reasons */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-amber-50/30 dark:bg-amber-950/10 border border-amber-100/50 dark:border-amber-900/20">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1.5">Alerts</h4>
                  <p className="text-xs text-slate-650 dark:text-amber-350 leading-relaxed font-medium">
                    {aiInsights.alerts}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-105 dark:border-slate-800/80">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Possible Reasons</h4>
                  <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-medium">
                    {aiInsights.possible_reasons}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl py-12 text-center text-slate-400 dark:text-slate-500">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-450 dark:text-slate-400">No Insights yet</span>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                Metrics data must be available to generate real-time AI Insights.
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
