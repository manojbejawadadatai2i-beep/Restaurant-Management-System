import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/axios';
import { HeartPulse, Database, Activity, RefreshCw, Settings as SettingsIcon, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';

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

export const Settings: React.FC = () => {
  const { currentUser, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'diagnostics'>('profile');
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [healthError, setHealthError] = useState(false);

  const fetchHealth = useCallback(async () => {
    setHealthLoading(true);
    setHealthError(false);
    try {
      const response = await api.get('/api/health');
      setHealthData(response.data);
    } catch (err) {
      setHealthError(true);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'diagnostics' && hasPermission('view:system-health')) {
      fetchHealth();
    }
  }, [activeTab, hasPermission, fetchHealth]);


  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs}h ${mins}m ${secs}s`;
  };

  const showHealthTab = hasPermission('view:system-health');

  return (
    <div className="space-y-6">
      
      {/* Header Title */}
      <Card>
        <CardHeader className="border-b-0 pb-0 mb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 flex items-center justify-center">
              <SettingsIcon size={20} />
            </div>
            <div>
              <CardTitle>Portal Settings & Configuration</CardTitle>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Manage user preferences and review system logs</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-100 dark:border-slate-800 pb-px">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-xs md:text-sm font-bold tracking-wide transition-all border-b-2 ${
            activeTab === 'profile'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          User Profile
        </button>
        {showHealthTab && (
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`px-4 py-2 text-xs md:text-sm font-bold tracking-wide transition-all border-b-2 ${
              activeTab === 'diagnostics'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            System Diagnostics
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left: profile overview */}
            <Card className="md:col-span-1 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-2xl shadow-md mx-auto mb-4 border border-blue-200 dark:border-blue-900">
                {currentUser ? currentUser.username[0].toUpperCase() : 'U'}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{currentUser?.username}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 bg-slate-50 dark:bg-slate-950/40 py-1 rounded-md inline-block px-3">
                {currentUser?.role}
              </p>
              
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-left space-y-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider mb-1">Email Address</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-350">{currentUser?.email || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider mb-1">Assigned Scope Boundary</span>
                  <span className="font-semibold text-slate-700 dark:text-slate-350">
                    {currentUser?.store_name || currentUser?.district_name || currentUser?.region_name || 'System-Wide Access'}
                  </span>
                </div>
              </div>
            </Card>

            {/* Right: Preferences */}
            <Card className="md:col-span-2 space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-50 dark:border-slate-800/50 pb-2 mb-4">Security Credentials</h3>
                <Alert variant="info">
                  This system is configured using database mock credentials. Password changes or session keys are managed under standard environment policies.
                </Alert>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 border-b border-slate-50 dark:border-slate-800/50 pb-2 mb-4">System Scope Privileges</h3>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
                  <ShieldCheck className="text-emerald-500 mt-0.5 flex-shrink-0" size={18} />
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 dark:text-slate-200">Active Permissions Policy</h5>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Your role designation has permissions to access resources linked within your visual sidebar. Scope boundaries are filtered dynamically at the database level.
                    </p>
                  </div>
                </div>
              </div>
            </Card>

          </div>
        )}

        {activeTab === 'diagnostics' && showHealthTab && (
          <Card>
            <CardHeader className="pt-0">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <HeartPulse size={20} className="text-orange-500" />
                  <CardTitle className="text-xs uppercase tracking-widest">Diagnostics Monitor</CardTitle>
                </div>
                <Button
                  onClick={fetchHealth}
                  isLoading={healthLoading}
                  variant="outline"
                  size="sm"
                >
                  <RefreshCw size={14} className={healthLoading ? 'animate-spin' : ''} />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {healthError ? (
                <Alert variant="error" title="Diagnostics Fetch Error">
                  Failed to fetch system diagnostics. Check if the server is running.
                </Alert>
              ) : healthData ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                  
                  {/* Card 1: System Status */}
                  <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="text-emerald-500" size={16} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">System Status</span>
                    </div>
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{healthData.status}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">Vite Client + Express API</p>
                  </div>

                  {/* Card 2: Database Status */}
                  <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="text-orange-500" size={16} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">PostgreSQL Link</span>
                    </div>
                    <p className={`text-lg font-bold ${healthData.database === 'Connected' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {healthData.database}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">Active Pool Connection</p>
                  </div>

                  {/* Card 3: Uptime */}
                  <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                      <RefreshCw className="text-blue-500" size={16} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Uptime</span>
                    </div>
                    <p className="text-lg font-bold text-slate-850 dark:text-slate-200">{formatUptime(healthData.uptime)}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-semibold">Node runtime process</p>
                  </div>

                  {/* Card 4: Memory Usage */}
                  <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="text-purple-500" size={16} />
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Memory Heap</span>
                    </div>
                    <p className="text-lg font-bold text-slate-850 dark:text-slate-200 truncate">{healthData.memory.heapUsed} / {healthData.memory.heapTotal}</p>
                    <p className="text-[10px] text-slate-450 mt-1 font-semibold">RSS allocated: {healthData.memory.rss}</p>
                  </div>

                </div>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs font-semibold uppercase tracking-wider">Gathering system stats...</div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
};