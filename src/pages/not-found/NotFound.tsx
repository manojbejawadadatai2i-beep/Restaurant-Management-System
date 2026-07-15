import React from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, ArrowLeft } from 'lucide-react';

export const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 flex items-center justify-center mb-6 border border-amber-100 dark:border-amber-900/30">
        <HelpCircle size={32} />
      </div>
      <h1 className="text-2xl font-black text-slate-855 dark:text-white tracking-tight mb-2">
        Page Not Found
      </h1>
      <p className="text-sm text-slate-400 dark:text-slate-500 max-w-md leading-relaxed mb-8">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 font-semibold text-xs transition-all shadow-md active:scale-95"
      >
        <ArrowLeft size={14} /> Back to Dashboard
      </Link>
    </div>
  );
};
