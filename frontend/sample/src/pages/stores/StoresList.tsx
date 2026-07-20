import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../utils/axios';
import { Store, MapPin, Landmark, ArrowRight, ShieldCheck } from 'lucide-react';
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

  // Filter stores according to logged in user's scoped permissions
  const filteredStores = stores.filter(s => {
    if (!currentUser) return false;
    
    // Corporate Admin and Administrator can view everything
    if (currentUser.role === 'Corporate Administrator' || currentUser.role === 'Administrator') {
      return true;
    }
    
    // Regional Manager can view stores inside their assigned region
    if (currentUser.role === 'Regional Manager') {
      return s.region_id === currentUser.assigned_region_id;
    }
    
    // District Manager can view stores inside their assigned district
    if (currentUser.role === 'District Manager') {
      return s.district_id === currentUser.assigned_district_id;
    }
    
    // Store Manager can only view their own store
    if (currentUser.role === 'Store Manager') {
      return s.id === currentUser.assigned_store_id;
    }
    
    return false;
  });

  const getDistrictName = (districtId: number) => {
    return districts.find(d => d.id === districtId)?.name || 'Unknown District';
  };

  const getRegionName = (regionId: number) => {
    return regions.find(r => r.id === regionId)?.name || 'Unknown Region';
  };

  const handleStoreClick = (storeId: number) => {
    navigate(`/dashboard?storeId=${storeId}`);
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Upper header */}
      <Card>
        <CardHeader className="border-b-0 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 flex items-center justify-center flex-shrink-0">
              <Store size={20} />
            </div>
            <div>
              <CardTitle>Asset & Store Scope Directory</CardTitle>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                Authorized Stores: {filteredStores.length} of {stores.length}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
            Click on any store below to view its specific operational metrics, order trends, AOV, and expenses. Your view list is strictly restricted based on your role scope security policy.
          </p>
        </CardContent>
      </Card>

      {/* Grid of Stores */}
      {filteredStores.length === 0 ? (
        <div className="text-center py-12 text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
          <p className="text-sm font-semibold">No authorized stores found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStores.map(store => (
            <div
              key={store.id}
              onClick={() => handleStoreClick(store.id)}
              className="group cursor-pointer rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-none hover:shadow-[0_12px_40px_rgba(99,102,241,0.05)] dark:hover:border-indigo-500/50 hover:border-indigo-500/30 transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between overflow-hidden"
            >
              {/* Card Upper */}
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-colors duration-300">
                    <Store size={20} />
                  </div>
                  <span className="text-[9px] font-extrabold px-2.5 py-0.5 rounded-full bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 border border-slate-100/60 dark:border-slate-850 uppercase tracking-widest">
                    {store.store_code || `STR-${store.id}`}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-850 dark:text-white text-sm group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors duration-200 line-clamp-1">
                    {store.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 dark:text-slate-500 mt-1">
                    <MapPin size={12} className="text-slate-400" />
                    <span>{store.city || 'Unknown City'}</span>
                  </div>
                </div>

                {/* Scope Hierarchy metadata */}
                <div className="space-y-2 border-t border-slate-50 dark:border-slate-800/50 pt-4">
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-350">
                    <MapPin size={13} className="text-slate-400" />
                    <span className="font-semibold text-[10px] uppercase text-slate-400 dark:text-slate-500 w-16">District</span>
                    <span className="font-bold truncate">{getDistrictName(store.district_id)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-350">
                    <Landmark size={13} className="text-slate-400" />
                    <span className="font-semibold text-[10px] uppercase text-slate-400 dark:text-slate-500 w-16">Region</span>
                    <span className="font-bold truncate">{getRegionName(store.region_id)}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="bg-slate-50/50 dark:bg-slate-950/20 px-5 py-3 border-t border-slate-50 dark:border-slate-800/40 flex items-center justify-between group-hover:bg-indigo-500/5 dark:group-hover:bg-indigo-500/10 transition-colors duration-300">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-indigo-500" /> Authorized Access
                </span>
                <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400 flex items-center gap-1 group-hover:translate-x-1.5 transition-transform duration-300">
                  Dashboard <ArrowRight size={13} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default StoresList;
