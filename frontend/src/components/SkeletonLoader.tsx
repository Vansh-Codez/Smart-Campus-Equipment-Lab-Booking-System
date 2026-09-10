import React from 'react';

export const CardSkeleton: React.FC = () => {
  return (
    <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 p-5 animate-pulse flex flex-col space-y-4">
      <div className="h-40 bg-slate-800 rounded-xl w-full" />
      <div className="h-5 bg-slate-800 rounded w-3/4" />
      <div className="h-3 bg-slate-800 rounded w-1/2" />
      <div className="flex gap-2 pt-2">
        <div className="h-6 bg-slate-800 rounded-full w-20" />
        <div className="h-6 bg-slate-800 rounded-full w-24" />
      </div>
      <div className="h-9 bg-slate-800 rounded-xl w-full mt-auto" />
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="rounded-xl border border-slate-800 overflow-hidden animate-pulse">
      <div className="h-11 bg-slate-800/80 border-b border-slate-800" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 border-b border-slate-800/50 bg-slate-900/40 px-4 flex items-center justify-between">
          <div className="h-4 bg-slate-800 rounded w-1/4" />
          <div className="h-4 bg-slate-800 rounded w-1/6" />
          <div className="h-4 bg-slate-800 rounded w-1/5" />
          <div className="h-8 bg-slate-800 rounded w-24" />
        </div>
      ))}
    </div>
  );
};
