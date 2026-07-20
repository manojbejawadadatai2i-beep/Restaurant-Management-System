import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  Bot, 
  Sparkles, 
  TrendingUp, 
  ArrowRight, 
  Search, 
  X, 
  ShieldCheck, 
  Users, 
  LayoutDashboard, 
  ChevronRight,
  Store,
  MapPin,
  Building,
  Mail,
  Lock,
  Loader2,
  AlertCircle
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { users, login, loginGoogle } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'admin' | 'manager'>('admin');
  const [searchQuery, setSearchQuery] = useState('');

  // Form States
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Filter users into Admins and Managers for the Autofill quick selector
  const admins = users.filter(u => u.role === 'Corporate Administrator' || u.role === 'Administrator');
  const managers = users.filter(u => u.role === 'Regional Manager' || u.role === 'District Manager' || u.role === 'Store Manager');

  // Filter managers based on query
  const filteredManagers = managers.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.store_name && u.store_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.district_name && u.district_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.region_name && u.region_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Load Google Client library dynamically
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Configure Google Login Callback globally so that Google Identity Services can trigger it
  useEffect(() => {
    (window as any).handleGoogleCredentialResponse = async (response: any) => {
      const idToken = response.credential;
      setLoginLoading(true);
      setErrorMsg('');
      try {
        await loginGoogle(idToken);
        setDrawerOpen(false);
      } catch (err: any) {
        setErrorMsg(err.response?.data?.detail || 'Google authentication failed. Is the user registered in PostgreSQL?');
      } finally {
        setLoginLoading(false);
      }
    };

    return () => {
      delete (window as any).handleGoogleCredentialResponse;
    };
  }, [loginGoogle]);

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    setLoginLoading(true);
    setErrorMsg('');
    try {
      await login(emailInput, passwordInput);
      setDrawerOpen(false);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Autofill details helper
  const handleAutofill = (email: string) => {
    setEmailInput(email);
    // Autofill plaintext fallback which matches $2b$12$PLACEHOLDER_HASH in seeded database users
    setPasswordInput('$2b$12$PLACEHOLDER_HASH');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 transition-colors duration-300 relative overflow-hidden flex flex-col justify-between">
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-orange-400/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Landing Page Header */}
      <header className="w-full max-w-7xl mx-auto px-6 h-20 flex items-center justify-between z-10 relative">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/10">
            <Bot size={22} className="animate-pulse" />
          </div>
          <div>
            <h1 className="font-extrabold text-base tracking-tight leading-none text-slate-900 dark:text-white flex items-center gap-1">
              Ocean View
              <Sparkles size={12} className="text-amber-500 fill-amber-500" />
            </h1>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Portal & AI</span>
          </div>
        </div>

        <Button 
          variant="primary" 
          onClick={() => {
            setErrorMsg('');
            setDrawerOpen(true);
          }}
          className="shadow-lg shadow-orange-500/15 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold"
        >
          Portal Login <ChevronRight size={16} />
        </Button>
      </header>

      {/* Main Hero & Features Section */}
      <main className="w-full max-w-7xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center gap-12 z-10 relative">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20 text-xs font-semibold uppercase tracking-wider">
            <Sparkles size={12} className="fill-orange-500" /> Powered by Llama 3 & PostgreSQL
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1]">
            Next-Generation <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">Decision Support</span> for Modern Dining Groups
          </h2>
          <p className="text-base text-slate-550 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Consolidate sales data, track active menu performance, monitor team assignments, and consult our real-time AI Insights Assistant to optimize dining operations.
          </p>
        </div>

        {/* Features Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <Card hoverable className="flex flex-col justify-between border-slate-100/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
            <div>
              <div className="p-3 w-fit rounded-xl bg-orange-50 dark:bg-orange-950/30 text-orange-500 mb-5">
                <LayoutDashboard size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-850 dark:text-white mb-2">Role-Based Dashboards</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Automatically switches view scopes for Corporate Admins, Regional Managers, District Managers, and Store Managers with strict permission boundaries.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-orange-500 mt-6 cursor-pointer hover:underline" onClick={() => setDrawerOpen(true)}>
              Access Dashboards <ArrowRight size={12} />
            </div>
          </Card>

          <Card hoverable className="flex flex-col justify-between border-slate-100/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
            <div>
              <div className="p-3 w-fit rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-500 mb-5">
                <Bot size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-850 dark:text-white mb-2">AI Insights Agent</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Consult a native Groq-powered AI chatbot to query database trends, menu demand, and generate customized business recommendations instantly.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-blue-500 mt-6 cursor-pointer hover:underline" onClick={() => setDrawerOpen(true)}>
              Consult AI Assistant <ArrowRight size={12} />
            </div>
          </Card>

          <Card hoverable className="flex flex-col justify-between border-slate-100/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md">
            <div>
              <div className="p-3 w-fit rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-500 mb-5">
                <TrendingUp size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-850 dark:text-white mb-2">Real-Time Data</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Connects directly to your PostgreSQL database. Track sales margins, peak order intervals, employee assignments, and revenue reports live.
              </p>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-500 mt-6 cursor-pointer hover:underline" onClick={() => setDrawerOpen(true)}>
              View Database Scope <ArrowRight size={12} />
            </div>
          </Card>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-slate-100 dark:border-slate-800 bg-white/20 dark:bg-transparent text-center z-10 relative">
        <p className="text-[10px] text-slate-400 dark:text-slate-500">&copy; {new Date().getFullYear()} Ocean View Restaurant Portal. All rights reserved.</p>
      </footer>

      {/* Sliding Login Drawer Overlay */}
      {drawerOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Sliding Drawer Panel */}
      <div className={`fixed inset-y-0 right-0 z-50 w-full sm:w-[410px] bg-white dark:bg-slate-900 border-l border-slate-100 dark:border-slate-800 shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col justify-between ${
        drawerOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-5">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                Portal Workspace
                <Sparkles size={14} className="text-amber-500 fill-amber-500" />
              </h3>
              <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">Authentication Portal</p>
            </div>
            <button 
              onClick={() => setDrawerOpen(false)} 
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Credentials Login Form */}
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-405 dark:text-slate-400 uppercase tracking-wider block">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="name@restaurant.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder-slate-400 dark:placeholder-slate-500"
                />
                <Mail size={14} className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-405 dark:text-slate-400 uppercase tracking-wider block">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-805 text-slate-800 dark:text-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-505 transition-all placeholder-slate-400 dark:placeholder-slate-500"
                />
                <Lock size={14} className="absolute left-3.5 top-3.5 text-slate-400 dark:text-slate-500" />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loginLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-2.5 rounded-xl shadow-md shadow-orange-500/10 text-xs md:text-sm"
            >
              {loginLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* OAuth Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Or login with</span>
            <div className="flex-1 h-px bg-slate-100 dark:bg-slate-800"></div>
          </div>

          {/* Google Sign-in Container */}
          <div className="flex justify-center w-full min-h-[40px]">
            <div 
              id="g_id_onload"
              data-client_id="292370442272-doiknq371kpbrkekkv1vfcq11hur3me7.apps.googleusercontent.com"
              data-callback="handleGoogleCredentialResponse"
              data-auto_prompt="false"
            ></div>
            <div className="g_id_signin w-full" data-type="standard" data-shape="rectangular" data-theme="outline" data-size="large" data-logo_alignment="left" data-width="360"></div>
          </div>

          {/* Quick Profile Autofill section */}
          <div className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4 flex-1 flex flex-col min-h-0 gap-3">
            <div>
              <h4 className="text-[11px] font-bold text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Users size={12} className="text-orange-500" /> Quick Autofill Profiles
              </h4>
              <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">Click a role to load its seeded demo credentials</p>
            </div>

            {/* Toggle Tabs (Admin / Manager) */}
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  setSearchQuery('');
                }}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                  activeTab === 'admin' 
                    ? 'bg-white dark:bg-slate-800 text-orange-500 dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('manager');
                  setSearchQuery('');
                }}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 ${
                  activeTab === 'manager' 
                    ? 'bg-white dark:bg-slate-800 text-orange-500 dark:text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                Manager
              </button>
            </div>

            {/* Search bar for Managers */}
            {activeTab === 'manager' && (
              <div className="relative flex-shrink-0">
                <input
                  type="text"
                  placeholder="Search managers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-805 text-slate-800 dark:text-slate-200 rounded-xl pl-9 pr-4 py-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-505 transition-all placeholder-slate-400 dark:placeholder-slate-500"
                />
                <Search size={12} className="absolute left-3.5 top-2.5 text-slate-400 dark:text-slate-500" />
              </div>
            )}

            {/* List of Accounts */}
            <div className="overflow-y-auto flex-1 max-h-[170px] pr-1 space-y-2">
              {activeTab === 'admin' ? (
                admins.length === 0 ? (
                  <div className="text-center py-4 text-[10px] text-slate-400 dark:text-slate-500">Loading administrators...</div>
                ) : (
                  admins.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleAutofill(u.email || '')}
                      className="w-full text-left p-3 rounded-xl border border-slate-100 hover:border-orange-500 dark:border-slate-800 dark:hover:border-orange-500 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-orange-50/20 dark:hover:bg-orange-950/10 transition-all flex items-start gap-2.5 group"
                    >
                      <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-950/50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-colors flex-shrink-0">
                        <ShieldCheck size={14} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-[11px] font-bold text-slate-900 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors">
                          {u.username}
                        </h4>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate">{u.email}</p>
                      </div>
                    </button>
                  ))
                )
              ) : (
                // Manager Tab
                filteredManagers.length === 0 ? (
                  <div className="text-center py-4 text-[10px] text-slate-400 dark:text-slate-500">
                    {searchQuery ? 'No matching managers found.' : 'Loading manager accounts...'}
                  </div>
                ) : (
                  filteredManagers.map(u => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleAutofill(u.email || '')}
                      className="w-full text-left p-2.5 rounded-xl border border-slate-100 hover:border-orange-500 dark:border-slate-800 dark:hover:border-orange-500 bg-slate-50/50 dark:bg-slate-950/20 hover:bg-orange-50/20 dark:hover:bg-orange-950/10 transition-all flex items-start gap-2.5 group"
                    >
                      <div className="p-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors flex-shrink-0">
                        <Users size={12} />
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="text-[11px] font-bold text-slate-900 dark:text-white group-hover:text-orange-500 dark:group-hover:text-orange-400 transition-colors truncate">
                          {u.username}
                        </h4>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-medium truncate leading-tight">{u.email}</p>
                        
                        {/* Manager Scoped Details */}
                        {u.store_name && (
                          <p className="text-[8px] text-slate-400 dark:text-slate-500 mt-0.5 leading-none flex items-center gap-0.5 font-medium truncate">
                            <Store size={8} className="text-emerald-500" /> {u.store_name}
                          </p>
                        )}
                        {u.district_name && (
                          <p className="text-[8px] text-slate-400 dark:text-slate-500 mt-0.5 leading-none flex items-center gap-0.5 font-medium truncate">
                            <MapPin size={8} className="text-indigo-500" /> {u.district_name}
                          </p>
                        )}
                        {u.region_name && (
                          <p className="text-[8px] text-slate-400 dark:text-slate-500 mt-0.5 leading-none flex items-center gap-0.5 font-medium truncate">
                            <Building size={8} className="text-blue-500" /> {u.region_name}
                          </p>
                        )}
                      </div>
                    </button>
                  ))
                )
              )}
            </div>
          </div>
        </div>

        {/* Drawer footer details */}
        <div className="p-6 bg-slate-50/50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800 text-[9px] text-slate-400 dark:text-slate-500 text-center">
          Note: Click any quick-autofill profile to load its database email and mock plaintext password hash.
        </div>
      </div>

    </div>
  );
};
export default LandingPage;
