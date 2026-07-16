import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { 
  FileText, 
  Download, 
  Search, 
  AlertCircle
} from 'lucide-react';

interface StoreReportItem {
  id: number;
  store_name: string;
  district_name: string;
  region_name: string;
  total_orders: string;
  total_revenue: string;
  avg_order_value: string;
}

export const Reports: React.FC = () => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Fetch Sales-by-Store report
  const { 
    data: storeData, 
    isLoading, 
    isError 
  } = useQuery<StoreReportItem[]>({
    queryKey: ['reportStore', currentUser?.id],
    queryFn: async () => {
      const res = await axios.get('http://127.0.0.1:5001/api/reports/sales-by-store', {
        params: { userId: currentUser?.id }
      });
      return res.data;
    },
    enabled: !!currentUser,
    refetchInterval: 3000
  });

  const formatCurrency = (val: string | number) => {
    const num = typeof val === 'string' ? parseFloat(val) : val;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(num);
  };

  const handleExportCSV = () => {
    if (!storeData) return;
    
    const filename = 'store_performance_report.csv';
    const headers = ['Store ID', 'Store Name', 'District', 'Region', 'Total Orders', 'Total Revenue (INR)', 'Avg Order Value (INR)'];
    const rows = storeData.map(item => [
      item.id.toString(),
      item.store_name,
      item.district_name || 'N/A',
      item.region_name || 'N/A',
      item.total_orders,
      parseFloat(item.total_revenue).toFixed(2),
      parseFloat(item.avg_order_value).toFixed(2)
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header with Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <FileText size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Reports Register</h2>
            <p className="text-xs text-slate-550 dark:text-slate-400">Query and export live data aggregates from PostgreSQL</p>
          </div>
        </div>
      </div>

      {/* 2. Search and Download Action Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-slate-900/60 p-4 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
        <div className="relative w-full sm:flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search store, district, or region..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>
        
        <button
          onClick={handleExportCSV}
          disabled={isLoading || isError}
          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold flex items-center justify-center gap-2 active:scale-98 transition-all border border-slate-850 shadow-md"
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      {/* 3. Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-md transition-colors">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50/20 dark:bg-slate-950/5">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-450">Loading Postgres Report data...</p>
          </div>
        )}

        {isError && (
          <div className="p-8 text-center bg-red-50/50 dark:bg-red-950/10 flex flex-col items-center justify-center">
            <AlertCircle className="text-red-500 mb-2" size={32} />
            <h4 className="text-sm font-bold text-red-800 dark:text-red-400">Failed to Retrieve Report</h4>
            <p className="text-xs text-red-650 dark:text-red-300 mt-1">
              Verify backend connectivity. Ensure tables are seeded and PORT is active.
            </p>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="overflow-x-auto">
            {/* Store Performance Report */}
            {storeData && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                    <th className="px-6 py-4 text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Store ID</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">Store Name</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider">District</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider text-center">Total Orders</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider text-right">Avg Order Value</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider text-right">Total Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {storeData
                    .filter(item => 
                      item.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      (item.district_name && item.district_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                      (item.region_name && item.region_name.toLowerCase().includes(searchTerm.toLowerCase()))
                    )
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-500 dark:text-slate-400">#{item.id}</td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-900 dark:text-white">{item.store_name}</td>
                        <td className="px-6 py-4 text-sm text-slate-550 dark:text-slate-400">
                          <span className="block font-medium">{item.district_name || 'N/A'}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-550 block">{item.region_name || 'N/A'}</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-350 text-center">{item.total_orders}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-750 dark:text-slate-355 text-right">{formatCurrency(item.avg_order_value)}</td>
                        <td className="px-6 py-4 text-sm font-bold text-orange-600 dark:text-orange-400 text-right">{formatCurrency(item.total_revenue)}</td>
                      </tr>
                    ))}
                  {storeData.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-sm text-slate-400">No stores found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
