import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../hooks/useRBAC';
import axios from 'axios';
import { HeartPulse, Database, Activity, RefreshCw } from 'lucide-react';

interface HealthData {
  status: string;
  database: string;
  uptime: number;
  memory: {
    rss: string;
    heapTotal: string;
    heapUsed: string;
  };
}

export const SiteHealth: React.FC = () => {
  const { currentUser } = useAuth();
  const { hasPermission } = useRBAC();
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await axios.get('http://127.0.0.1:5001/api/health');
      setData(response.data);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasPermission('view:system-health')) {
      fetchHealth();
    }
  }, [currentUser]);

  if (!hasPermission('view:system-health')) {
    return null; // Don't show anything for unauthorized roles
  }

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs}h ${mins}m ${secs}s`;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm transition-colors duration-200">
      
      {/* Title */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-6 bg-orange-500 rounded-full"></span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HeartPulse size={20} className="text-orange-500" /> System Site Health
          </h2>
        </div>
        <button
          onClick={fetchHealth}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-500 dark:text-slate-400 transition-colors"
          title="Refresh Health Status"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {loading && !data ? (
        <div className="text-center py-6 text-slate-400 text-sm">Loading system diagnostics...</div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-4 rounded-xl text-center text-sm">
          Failed to fetch system diagnostics. Check if the server is running.
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          
          {/* Card 1: System Status */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="text-emerald-500" size={18} />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">System Status</span>
            </div>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{data.status}</p>
            <p className="text-xs text-slate-400 mt-1">Vite + Express Backend</p>
          </div>

          {/* Card 2: Database Status */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Database className="text-orange-500" size={18} />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">PostgreSQL</span>
            </div>
            <p className={`text-xl font-bold ${data.database === 'Connected' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
              {data.database}
            </p>
            <p className="text-xs text-slate-400 mt-1">Pool Connection</p>
          </div>

          {/* Card 3: Uptime */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <RefreshCw className="text-blue-500" size={18} />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Server Uptime</span>
            </div>
            <p className="text-xl font-bold text-slate-850 dark:text-slate-200">{formatUptime(data.uptime)}</p>
            <p className="text-xs text-slate-400 mt-1">Node process uptime</p>
          </div>

          {/* Card 4: Memory Usage */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="text-purple-500" size={18} />
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Memory Heap</span>
            </div>
            <p className="text-xl font-bold text-slate-850 dark:text-slate-200">{data.memory.heapUsed} / {data.memory.heapTotal}</p>
            <p className="text-xs text-slate-400 mt-1">RSS: {data.memory.rss}</p>
          </div>

        </div>
      ) : null}

    </div>
  );
};
