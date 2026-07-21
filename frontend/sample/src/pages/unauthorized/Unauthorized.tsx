import React from 'react';
import { ShieldAlert } from 'lucide-react';

export const Unauthorized: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center mb-6 border border-red-100 dark:border-red-900/30 animate-pulse">
        <ShieldAlert size={32} />
      </div>
      <h1 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight mb-2">
        Access Restricted
      </h1>
      <p className="text-sm text-slate-400 dark:text-slate-500 max-w-md leading-relaxed">
        You do not have the required permissions to view this resource. If you believe this is an error, please contact the system administrator or switch to a higher access role.
      </p>
    </div>
  );
};