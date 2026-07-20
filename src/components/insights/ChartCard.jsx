import React from 'react';

export default function ChartCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 transition-all duration-500 hover:shadow-[0_8px_40px_-12px_rgba(0,36,67,0.1)] ${className}`}>
      {/* Subtle top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#1356E2]/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-[13px] font-bold text-[#0A0A0A] tracking-tight">{title}</h3>
            {subtitle && <p className="text-[10px] text-[#0A0A0A]/30 mt-1 font-medium">{subtitle}</p>}
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-[#1356E2]/40 mt-1.5" />
        </div>
        {children}
      </div>
    </div>
  );
}