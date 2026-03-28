import React from 'react';

export default function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`rounded-2xl bg-white border border-slate-100 p-5 hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#002443]">{title}</h3>
          {subtitle && <p className="text-[10px] text-[#002443]/30 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}