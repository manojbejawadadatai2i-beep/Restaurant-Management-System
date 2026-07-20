import React, { forwardRef } from 'react';

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, placeholder, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full bg-slate-50/50 dark:bg-slate-955 border text-xs md:text-sm text-slate-850 dark:text-slate-100 rounded-xl px-3.5 py-2.5 transition-all outline-none ${
            error
              ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/30'
              : 'border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-slate-800 dark:focus:border-blue-500'
          } ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide leading-none mt-0.5">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
