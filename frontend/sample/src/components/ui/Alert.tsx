import React from 'react';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';

interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
}) => {
  const styles = {
    info: 'bg-blue-50/80 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-200',
    success: 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-200',
    warning: 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200',
    error: 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-200',
  };

  const icons = {
    info: <Info size={16} className="text-blue-500 flex-shrink-0" />,
    success: <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />,
    warning: <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />,
    error: <XCircle size={16} className="text-rose-500 flex-shrink-0" />,
  };

  return (
    <div
      className={`flex gap-3 p-4 rounded-xl border backdrop-blur-sm transition-all duration-200 ${styles[variant]} ${className}`}
      role="alert"
    >
      {icons[variant]}
      <div className="flex-1 text-xs md:text-sm">
        {title && <h5 className="font-bold tracking-wide mb-1 uppercase text-[10px] opacity-90">{title}</h5>}
        <div className="font-medium leading-relaxed">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-current opacity-60 hover:opacity-100 p-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-all self-start"
          aria-label="Close alert"
        >
          <XCircle size={16} />
        </button>
      )}
    </div>
  );
};