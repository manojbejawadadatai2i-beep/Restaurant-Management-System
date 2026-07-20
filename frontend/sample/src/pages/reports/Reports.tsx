import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../utils/axios';
import { useAuth } from '../../hooks/useAuth';
import { 
  FileText, 
  Download, 
  Search
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { formatCurrency } from '../../utils/format';

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
      const res = await api.get('/api/reports/sales-by-store', {
        params: { userId: currentUser?.id }
      });
      return res.data;
    },
    enabled: !!currentUser,
    refetchInterval: 3000
  });

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

  const filteredStoreData = storeData
    ? storeData.filter(item => 
        item.store_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.district_name && item.district_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.region_name && item.region_name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  return (
    <div className="space-y-6">
      {/* 1. Header Card */}
      <Card>
        <CardHeader className="border-b-0 pb-0 mb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-500 flex items-center justify-center">
              <FileText size={20} />
            </div>
            <div>
              <CardTitle>Reports Register</CardTitle>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Query and export live data aggregates from PostgreSQL</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 2. Search and Download Action Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white dark:bg-slate-900/60 p-4 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
        <div className="relative w-full sm:flex-1">
          <Input
            type="text"
            placeholder="Search store, district, or region..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
        
        <Button
          onClick={handleExportCSV}
          disabled={isLoading || isError}
          leftIcon={<Download size={15} />}
          className="w-full sm:w-auto"
        >
          Export CSV
        </Button>
      </div>

      {/* 3. Table Container */}
      <div>
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Loading Postgres Report data...</p>
          </div>
        )}

        {isError && (
          <Alert variant="error" title="Failed to Retrieve Report">
            Verify backend connectivity. Ensure tables are seeded and PORT is active.
          </Alert>
        )}

        {!isLoading && !isError && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store ID</TableHead>
                <TableHead>Store Name</TableHead>
                <TableHead>District</TableHead>
                <TableHead className="text-center">Total Orders</TableHead>
                <TableHead className="text-right">Avg Order Value</TableHead>
                <TableHead className="text-right">Total Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStoreData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-semibold text-slate-500 dark:text-slate-400">#{item.id}</TableCell>
                  <TableCell className="font-bold text-slate-900 dark:text-white">{item.store_name}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-semibold">{item.district_name || 'N/A'}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-550 block">{item.region_name || 'N/A'}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-center">{item.total_orders}</TableCell>
                  <TableCell className="font-semibold text-right">{formatCurrency(parseFloat(item.avg_order_value))}</TableCell>
                  <TableCell className="font-bold text-orange-600 dark:text-orange-400 text-right">{formatCurrency(parseFloat(item.total_revenue))}</TableCell>
                </TableRow>
              ))}
              {filteredStoreData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-slate-400 font-semibold">No stores found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};
