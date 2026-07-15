import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../hooks/useRBAC';
import { 
  LayoutDashboard, 
  Users, 
  HeartPulse, 
  FileText, 
  Utensils
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { currentUser } = useAuth();
  const { hasPermission } = useRBAC();

  const showUserTab = hasPermission('view:user-management');
  const showHealthTab = hasPermission('view:system-health');

  const menuItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50/60 dark:bg-blue-950/20',
      activeColor: 'text-blue-600 dark:text-blue-400 border-blue-500 bg-blue-50/40 dark:bg-blue-950/10'
    },
    {
      path: '/reports',
      label: 'Reports',
      icon: FileText,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-50/60 dark:bg-emerald-950/20',
      activeColor: 'text-emerald-600 dark:text-emerald-400 border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/10'
    },
    ...(showUserTab ? [{
      path: '/users',
      label: 'User Access',
      icon: Users,
      color: 'text-amber-500',
      bgColor: 'bg-amber-50/60 dark:bg-amber-950/20',
      activeColor: 'text-amber-600 dark:text-amber-400 border-amber-500 bg-amber-50/40 dark:bg-amber-950/10'
    }] : []),
    ...(showHealthTab ? [{
      path: '/health',
      label: 'System Health',
      icon: HeartPulse,
      color: 'text-rose-500',
      bgColor: 'bg-rose-50/60 dark:bg-rose-950/20',
      activeColor: 'text-rose-600 dark:text-rose-400 border-rose-500 bg-rose-50/40 dark:bg-rose-950/10'
    }] : [])
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-20 w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col justify-between transition-colors duration-200">
      
      {/* Upper Section */}
      <div className="flex flex-col">
        {/* Brand Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-50 dark:border-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Utensils size={16} strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-base font-extrabold tracking-tight text-slate-850 dark:text-white">
                restaurant
              </span>
              <span className="text-base font-light text-slate-400">
                portal.
              </span>
            </div>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="p-4 space-y-1.5">
          <div className="px-3 mb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Menu Navigation
          </div>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold tracking-wide border-l-2 transition-all duration-200 ${
                    isActive
                      ? `${item.activeColor}`
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg transition-colors ${
                        isActive ? `${item.bgColor} ${item.color}` : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        <Icon size={16} />
                      </div>
                      <span>{item.label}</span>
                    </div>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Lower Section / Account Profile info */}
      <div className="p-4 border-t border-slate-50 dark:border-slate-800/50">
        <div className="bg-slate-50 dark:bg-slate-950/40 rounded-xl p-3.5 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
              {currentUser ? currentUser.username[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-none mb-1">
                {currentUser ? currentUser.username : 'Loading...'}
              </p>
              <p className="text-[10px] font-semibold text-slate-405 dark:text-slate-500 truncate uppercase tracking-wider leading-none">
                {currentUser ? currentUser.role : ''}
              </p>
            </div>
          </div>
          <div className="text-[10px] text-slate-450 dark:text-slate-500 bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-100 dark:border-slate-800 font-medium truncate">
            Scope: {currentUser?.store_name || currentUser?.district_name || currentUser?.region_name || 'System-Wide'}
          </div>
        </div>
      </div>
    </aside>
  );
};
