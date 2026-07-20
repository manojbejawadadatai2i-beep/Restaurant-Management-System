import React from 'react';

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {}

export const Table: React.FC<TableProps> = ({ children, className = '', ...props }) => {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className={`w-full text-left border-collapse ${className}`} {...props}>{children}</table>
    </div>
  );
};

interface TableHeaderProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableHeader: React.FC<TableHeaderProps> = ({ children, className = '', ...props }) => {
  return <thead className={`bg-slate-50/75 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 ${className}`} {...props}>{children}</thead>;
};

interface TableBodyProps extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const TableBody: React.FC<TableBodyProps> = ({ children, className = '', ...props }) => {
  return <tbody className={`divide-y divide-slate-50 dark:divide-slate-800/40 ${className}`} {...props}>{children}</tbody>;
};

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {}

export const TableRow: React.FC<TableRowProps> = ({ children, className = '', ...props }) => {
  return <tr className={`hover:bg-slate-50/30 dark:hover:bg-slate-850/20 transition-colors ${className}`} {...props}>{children}</tr>;
};

interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {}

export const TableHead: React.FC<TableHeadProps> = ({ children, className = '', ...props }) => {
  return (
    <th className={`px-5 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-550 uppercase tracking-widest ${className}`} {...props}>
      {children}
    </th>
  );
};

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {}

export const TableCell: React.FC<TableCellProps> = ({ children, className = '', ...props }) => {
  return <td className={`px-5 py-3 text-xs md:text-sm text-slate-750 dark:text-slate-300 font-medium ${className}`} {...props}>{children}</td>;
};
