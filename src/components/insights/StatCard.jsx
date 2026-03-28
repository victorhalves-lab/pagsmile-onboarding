import React from 'react';

export default function StatCard({ label, value, subtitle, icon: Icon, color = 'text-[#002443]', accentColor = '#2bc196' }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-5 transition-all duration-300 hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-0.5">
      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)` }} />
      
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold text-[#002443]/40 uppercase tracking-[0.08em]">{label}</p>
          <p className={`text-2xl font-extrabold mt-1.5 tracking-tight ${color}`}>{value}</p>
          {subtitle && <p className="text-[11px] text-[#002443]/40 mt-1 leading-tight">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110" style={{ background: `${accentColor}12` }}>
            <Icon className="w-5 h-5" style={{ color: accentColor }} />
          </div>
        )}
      </div>
    </div>
  );
}