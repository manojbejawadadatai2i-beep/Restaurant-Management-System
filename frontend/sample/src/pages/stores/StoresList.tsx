import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/axios';
import { Store, MapPin, Landmark, ArrowRight, ShieldCheck, Search, X, Building2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';

interface DBRegion {
  id: number;
  name: string;
}

interface DBDistrict {
  id: number;
  name: string;
  region_id: number;
}

interface DBStore {
  id: number;
  name: string;
  district_id: number;
  region_id: number;
  city: string;
  store_code: string;
}

export const StoresList: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [regions, setRegions] = useState<DBRegion[]>([]);
  const [districts, setDistricts] = useState<DBDistrict[]>([]);
  const [stores, setStores] = useState<DBStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const response = await api.get('/api/meta');
        setRegions(response.data.regions);
        setDistricts(response.data.districts);
        setStores(response.data.stores);
      } catch (err) {
        console.error('Failed to fetch store metadata', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchMetadata();
  }, []);

  const getDistrictName = (districtId: number) => {
    return districts.find(d => d.id === districtId)?.name || 'Unknown District';
  };

  const getRegionName = (regionId: number) => {
    return regions.find(r => r.id === regionId)?.name || 'Unknown Region';
  };

  // Filter stores according to logged in user's scoped permissions & search query
  const scopedStores = useMemo(() => {
    return stores.filter(s => {
      if (!currentUser) return false;
      
      if (currentUser.role === 'Corporate Administrator' || currentUser.role === 'Administrator') {
        return true;
      }
      if (currentUser.role === 'Regional Manager') {
        return s.region_id === currentUser.assigned_region_id;
      }
      if (currentUser.role === 'District Manager') {
        return s.district_id === currentUser.assigned_district_id;
      }
      if (currentUser.role === 'Store Manager') {
        return s.id === currentUser.assigned_store_id;
      }
      return false;
    });
  }, [stores, currentUser]);

  const filteredStores = useMemo(() => {
    if (!searchQuery.trim()) return scopedStores;
    const q = searchQuery.toLowerCase().trim();
    return scopedStores.filter(s => {
      const distName = getDistrictName(s.district_id).toLowerCase();
      const regName = getRegionName(s.region_id).toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.store_code && s.store_code.toLowerCase().includes(q)) ||
        (s.city && s.city.toLowerCase().includes(q)) ||
        distName.includes(q) ||
        regName.includes(q)
      );
    });
  }, [scopedStores, searchQuery, districts, regions]);

  const handleStoreClick = (storeId: number) => {
    navigate(`/dashboard?storeId=${storeId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest animate-pulse">
          Loading Scoped Assets...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="error" title="Metadata Load Error">
        Failed to fetch corporate hierarchy. Please try again.
      </Alert>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Controls */}
      <Card>
        <CardHeader className="border-b-0 pb-2">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 flex items-center justify-center flex-shrink-0">
                <Store size={20} />
              </div>
              <div>
                <CardTitle className="text-base font-extrabold text-slate-900 dark:text-white">
                  Asset & Store Scope Directory
                </CardTitle>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
                  Authorized Outlets: {filteredStores.length} of {scopedStores.length}
                </p>
              </div>
            </div>

            {/* Search Input Box */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Search size={15} />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stores by name, code, city, district, or region..."
                className="w-full pl-9 pr-8 py-2 rounded-xl text-xs font-semibold bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Select any store row below to launch its metrics dashboard. Use the search bar to filter by store name, location, or district.
          </p>
        </CardContent>
      </Card>

      {/* Row List Container with Custom Scroll Bar */}
      <Card className="p-0 overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Building2 size={13} className="text-indigo-500" /> Authorized Store Directory
          </span>
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
            {filteredStores.length} Rows
          </span>
        </div>

        {filteredStores.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Store size={32} className="mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              No matching stores found for "{searchQuery}".
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-2 text-xs font-bold text-indigo-500 hover:underline"
            >
              Clear Search Query
            </button>
          </div>
        ) : (
          /* Fixed height scrollable container for rows */
          <div className="max-h-[520px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 pr-1">
            {filteredStores.map(store => (
              <div
                key={store.id}
                onClick={() => handleStoreClick(store.id)}
                className="group p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-all cursor-pointer select-none"
              >
                {/* Store Info & Code */}
                <div className="flex items-center gap-3.5 min-w-[240px]">
                  <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
                    <Store size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {store.name}
                      </h4>
                      <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase">
                        {store.store_code || `STR-${store.id}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 mt-0.5">
                      <MapPin size={11} className="text-slate-400" />
                      <span>{store.city || 'Unknown City'}</span>
                    </div>
                  </div>
                </div>

                {/* Scope Hierarchy Badges */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-350 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                    <MapPin size={12} className="text-indigo-400" />
                    <span className="text-[10px] font-bold uppercase text-slate-400">District:</span>
                    <span className="font-bold text-xs">{getDistrictName(store.district_id)}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-350 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                    <Landmark size={12} className="text-purple-400" />
                    <span className="text-[10px] font-bold uppercase text-slate-400">Region:</span>
                    <span className="font-bold text-xs">{getRegionName(store.region_id)}</span>
                  </div>
                </div>

                {/* Right Action Trigger */}
                <div className="flex items-center gap-2 justify-end sm:justify-start">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <ShieldCheck size={12} className="text-indigo-500" /> Authorized
                  </span>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                    View Dashboard <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default StoresList;
