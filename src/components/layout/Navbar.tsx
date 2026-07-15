import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Sun, 
  Moon, 
  ChevronDown, 
  ShieldAlert
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { users, currentUser, setCurrentUserById } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <header className="sticky top-0 z-10 w-full border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md transition-colors duration-200">
      <div className="px-8 h-16 flex items-center justify-between">
        
        {/* Left: Spacer to keep layout structured */}
        <div className="flex-1 hidden md:block"></div>

        {/* Brand placeholder for small screens where sidebar is hidden/toggleable */}
        <div className="flex md:hidden items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white">
            <span className="text-xs font-black">RP</span>
          </div>
          <span className="text-xs font-bold text-slate-850 dark:text-white">restaurant portal.</span>
        </div>

        {/* Right: Controls & Mock Authentication Swapper */}
        <div className="flex items-center space-x-4">
          
          {/* Dark Mode Toggle - Pastel Violet */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/30 text-violet-500 dark:text-violet-400 hover:bg-violet-100/60 dark:hover:bg-violet-950/60 transition-colors"
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={16} className="text-amber-500" /> : <Moon size={16} />}
          </button>

          {/* Vertical Divider */}
          <span className="w-px h-6 bg-slate-100 dark:bg-slate-800"></span>

          {/* Profile Dropdown & Role Swapper */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {currentUser ? currentUser.username[0].toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block pr-1">
                <p className="text-xs font-bold leading-tight text-slate-850 dark:text-slate-150 flex items-center gap-1">
                  <span>{currentUser ? currentUser.username : 'Loading...'}</span>
                  <ChevronDown size={12} className="text-slate-400" />
                </p>
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">
                  {currentUser ? currentUser.role : ''}
                </p>
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-slate-100/60 dark:divide-slate-800 transition-all duration-200">
                
                {/* Profile Header */}
                <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-950/20 rounded-t-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Signed in as</p>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {currentUser?.username}
                  </p>
                  <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 mt-1">
                    Scope: {currentUser?.store_name || currentUser?.district_name || currentUser?.region_name || 'System-Wide'}
                  </p>
                </div>

                {/* Role Switcher Section */}
                <div className="py-2">
                  <div className="px-4 py-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <ShieldAlert size={12} className="text-red-400" /> Swap Test Roles
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => {
                          setCurrentUserById(user.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 text-xs flex flex-col hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                          currentUser?.id === user.id
                            ? 'bg-blue-50/40 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 font-semibold'
                            : 'text-slate-700 dark:text-slate-350'
                        }`}
                      >
                        <span className="font-bold">{user.username}</span>
                        <span className="text-[10px] text-slate-455 dark:text-slate-500 mt-0.5">
                          {user.role} ({user.store_name || user.district_name || user.region_name || 'All'})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
