import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import api from '../../utils/axios';
import { useAuth } from '../../hooks/useAuth';
import { 
  Download, 
  CalendarDays,
  Receipt,
  IndianRupee,
  ShoppingBag,
  TrendingUp,
  XCircle,
  CheckCircle2,
  Clock,
  FileSpreadsheet
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { formatCurrency } from '../../utils/format';

interface CustomReportResponse {
  range: { fromDate: string; toDate: string };
  metrics: {
    totalRevenue: number;
    totalOrders: number;
    avgOrderValue: number;
    customerCount: number;
    cancelledOrders: number;
    netProfit: number;
    profitMargin: number;
  };
  kpis: Array<{
    kpi_date: string;
    store_id: number;
    store_name: string;
    district_name: string;
    region_name: string;
    total_revenue: string;
    total_orders: number;
    average_order_value: string;
    customer_count: number;
    cancelled_orders: number;
    dine_in_orders: number;
    takeaway_orders: number;
    online_orders: number;
  }>;
  orders: Array<{
    order_id: number;
    store_id: number;
    store_name: string;
    district_name: string;
    region_name: string;
    customer_name: string;
    total_amount: string;
    status: string;
    created_at: string;
    items_summary: string;
  }>;
}

export const Reports: React.FC = () => {
  const { currentUser } = useAuth();
  const [fromDate, setFromDate] = useState('2026-07-01');
  const [toDate, setToDate] = useState('2026-07-21');
  const [activeTab, setActiveTab] = useState<'kpis' | 'orders'>('kpis');

  // Fetch custom report data based on logged-in user scope & selected date range
  const { 
    data: reportData, 
    isLoading, 
    isError
  } = useQuery<CustomReportResponse>({
    queryKey: ['customReport', currentUser?.id, fromDate, toDate],
    queryFn: async () => {
      const res = await api.get('/api/reports/custom-excel', {
        params: { 
          userId: currentUser?.id,
          fromDate,
          toDate
        }
      });
      return res.data;
    },
    enabled: !!currentUser
  });

  // Export Multi-Sheet Excel (.xlsx) file
  const handleExportExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();

    // 1. KPI Summary Sheet Data
    const kpiSummaryRows = [
      ['RESTAURANT PORTAL - KPI & OPERATIONS AGGREGATION REPORT'],
      [`Date Range: ${fromDate} to ${toDate}`],
      [`Scope: Automatically Resolved for ${currentUser?.email || 'User Session'}`],
      [`Generated On: ${new Date().toLocaleString()}`],
      [],
      ['KPI SUMMARY AGGREGATIONS'],
      ['Metric', 'Value'],
      ['Total Revenue (INR)', reportData.metrics.totalRevenue],
      ['Total Orders', reportData.metrics.totalOrders],
      ['Average Order Value (INR)', reportData.metrics.avgOrderValue.toFixed(2)],
      ['Total Customers Served', reportData.metrics.customerCount],
      ['Cancelled Orders', reportData.metrics.cancelledOrders],
      ['Estimated Net Profit (INR)', reportData.metrics.netProfit.toFixed(2)],
      ['Profit Margin (%)', `${reportData.metrics.profitMargin}%`],
      [],
      ['DAILY STORE KPI BREAKDOWN'],
      ['Date', 'Store ID', 'Store Name', 'District', 'Region', 'Revenue (INR)', 'Orders', 'AOV (INR)', 'Customers', 'Cancelled Orders', 'Dine-In', 'Takeaway', 'Online']
    ];

    reportData.kpis.forEach(k => {
      const kpiDateStr = k.kpi_date ? k.kpi_date.split('T')[0] : '';
      kpiSummaryRows.push([
        kpiDateStr,
        k.store_id.toString(),
        k.store_name,
        k.district_name || 'N/A',
        k.region_name || 'N/A',
        parseFloat(k.total_revenue).toFixed(2),
        k.total_orders.toString(),
        parseFloat(k.average_order_value).toFixed(2),
        k.customer_count.toString(),
        k.cancelled_orders.toString(),
        k.dine_in_orders.toString(),
        k.takeaway_orders.toString(),
        k.online_orders.toString()
      ]);
    });

    const kpiWs = XLSX.utils.aoa_to_sheet(kpiSummaryRows);
    XLSX.utils.book_append_sheet(wb, kpiWs, 'KPI Aggregations');

    // 2. Itemized Orders Log Sheet Data
    const orderRows = [
      ['ITEMIZED ORDERS TRANSACTION LOG'],
      [`Date Range: ${fromDate} to ${toDate}`],
      [`User: ${currentUser?.email || 'User Session'}`],
      [],
      ['Order ID', 'Store Name', 'Customer Name', 'Items Taken (Order Breakdown)', 'Order Timestamp', 'Status', 'Total Amount (INR)']
    ];

    reportData.orders.forEach(o => {
      const dateFormatted = o.created_at ? new Date(o.created_at).toLocaleString('en-IN') : '';
      orderRows.push([
        `#ORD-${o.order_id}`,
        o.store_name,
        o.customer_name || 'Walk-in Customer',
        o.items_summary || 'Standard Order',
        dateFormatted,
        o.status,
        parseFloat(o.total_amount).toFixed(2)
      ]);
    });

    const ordersWs = XLSX.utils.aoa_to_sheet(orderRows);
    XLSX.utils.book_append_sheet(wb, ordersWs, 'Itemized Orders Log');

    // Generate and trigger download
    const filename = `Restaurant_Report_${fromDate}_to_${toDate}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  const metrics = reportData?.metrics;

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <Card>
        <CardHeader className="border-b-0 pb-0 mb-0 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold uppercase tracking-wide">
                  Custom Report & Excel Generator
                </CardTitle>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  Export multi-sheet Excel reports with aggregated KPI metrics & itemized orders.
                </p>
              </div>
            </div>

            <Button
              onClick={handleExportExcel}
              disabled={isLoading || isError || !reportData}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer"
            >
              <Download size={17} />
              <span>Export Excel (.xlsx)</span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* 2. Interactive Date Range Filters */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-4">
        {/* From Date Picker */}
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <CalendarDays size={13} /> From Date
          </label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* To Date Picker */}
        <div className="flex flex-col gap-1 flex-1">
          <label className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <CalendarDays size={13} /> To Date
          </label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-bold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* 3. Live KPI Summary Aggregation Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-100">Total Revenue</span>
              <div className="p-2 rounded-xl bg-white/20">
                <IndianRupee size={18} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black font-mono">{formatCurrency(metrics.totalRevenue)}</h3>
              <p className="text-[10px] text-blue-100 font-semibold mt-1">Aggregated for selected date range</p>
            </div>
          </div>

          {/* Total Orders */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-100">Total Orders</span>
              <div className="p-2 rounded-xl bg-white/20">
                <ShoppingBag size={18} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black font-mono">{metrics.totalOrders.toLocaleString('en-IN')}</h3>
              <p className="text-[10px] text-emerald-100 font-semibold mt-1">Avg Order Value: {formatCurrency(metrics.avgOrderValue)}</p>
            </div>
          </div>

          {/* Net Profit */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-100">Net Profit (42%)</span>
              <div className="p-2 rounded-xl bg-white/20">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black font-mono">{formatCurrency(metrics.netProfit)}</h3>
              <p className="text-[10px] text-amber-100 font-semibold mt-1">Profit Margin: 42.0%</p>
            </div>
          </div>

          {/* Cancelled Orders */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg shadow-rose-500/20 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-100">Cancelled Orders</span>
              <div className="p-2 rounded-xl bg-white/20">
                <XCircle size={18} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-black font-mono">{metrics.cancelledOrders}</h3>
              <p className="text-[10px] text-rose-100 font-semibold mt-1">
                Rate: {metrics.totalOrders > 0 ? ((metrics.cancelledOrders / metrics.totalOrders) * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Tabbed Preview Data Tables */}
      <Card>
        <CardHeader className="border-b-0 pb-0 mb-3 pt-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-bold w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('kpis')}
                className={`py-2 px-4 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'kpis'
                    ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <TrendingUp size={14} />
                <span>Daily KPI Aggregations ({reportData?.kpis.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orders')}
                className={`py-2 px-4 rounded-lg transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeTab === 'orders'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <Receipt size={14} />
                <span>Itemized Orders Log ({reportData?.orders.length || 0})</span>
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                Generating live report aggregations from PostgreSQL...
              </p>
            </div>
          )}

          {isError && (
            <Alert variant="error" title="Failed to Retrieve Report Data">
              Verify backend connectivity and database connection.
            </Alert>
          )}

          {!isLoading && !isError && reportData && (
            <div className="border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
              {activeTab === 'kpis' ? (
                /* KPI Aggregations Table */
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>KPI Date</TableHead>
                      <TableHead>Store Outlet</TableHead>
                      <TableHead>District & Region</TableHead>
                      <TableHead className="text-center">Orders</TableHead>
                      <TableHead className="text-center">Customers</TableHead>
                      <TableHead className="text-right">Avg Order Value</TableHead>
                      <TableHead className="text-right">Total Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.kpis.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-xs font-extrabold text-slate-900 dark:text-white py-3.5">
                          {item.kpi_date ? item.kpi_date.split('T')[0] : 'N/A'}
                        </TableCell>
                        <TableCell className="font-bold text-slate-900 dark:text-white py-3.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold">{item.store_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              {item.district_name}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500">
                              {item.region_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-mono font-semibold text-slate-700 dark:text-slate-300 py-3.5">
                          {item.total_orders}
                        </TableCell>
                        <TableCell className="text-center font-mono text-xs text-slate-600 dark:text-slate-400 py-3.5">
                          {item.customer_count}
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs text-slate-600 dark:text-slate-400 py-3.5">
                          {formatCurrency(parseFloat(item.average_order_value))}
                        </TableCell>
                        <TableCell className="text-right font-mono font-extrabold text-emerald-600 dark:text-emerald-400 text-sm py-3.5">
                          {formatCurrency(parseFloat(item.total_revenue))}
                        </TableCell>
                      </TableRow>
                    ))}
                    {reportData.kpis.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-slate-400 font-semibold">
                          No KPI data found for the selected date range.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              ) : (
                /* Itemized Orders Table */
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Order ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Store Outlet</TableHead>
                      <TableHead className="min-w-[280px]">Items Taken (Order Breakdown)</TableHead>
                      <TableHead className="w-36 text-center">Timestamp</TableHead>
                      <TableHead className="w-28 text-center">Status</TableHead>
                      <TableHead className="text-right">Total Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportData.orders.map((ord) => {
                      const timeFormatted = ord.created_at ? new Date(ord.created_at).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';
                      
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
                        <TableRow key={ord.order_id}>
                          <TableCell className="font-mono font-extrabold text-xs text-blue-600 dark:text-blue-400 py-3.5">
                            #ORD-{ord.order_id}
                          </TableCell>
                          <TableCell className="font-bold text-slate-800 dark:text-white py-3.5 text-xs">
                            {ord.customer_name || 'Walk-in Customer'}
                          </TableCell>
                          <TableCell className="py-3.5">
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
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
                          <TableCell className="text-center font-mono text-[11px] text-slate-500 dark:text-slate-400 py-3.5">
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
                    {reportData.orders.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-slate-400 font-semibold">
                          No order logs found for the selected store and date range.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
