import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 text-slate-400 dark:text-slate-500 flex items-center justify-center pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full bg-slate-50/50 dark:bg-slate-950 border text-xs md:text-sm text-slate-850 dark:text-slate-100 rounded-xl px-3.5 py-2.5 transition-all outline-none placeholder-slate-400 dark:placeholder-slate-550 ${
              leftIcon ? 'pl-10' : ''
            } ${
              error
                ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500/30'
                : 'border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 dark:border-slate-800 dark:focus:border-blue-500'
            } ${className}`}
            {...props}
          />
        </div>
        {error && (
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide leading-none mt-0.5">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
