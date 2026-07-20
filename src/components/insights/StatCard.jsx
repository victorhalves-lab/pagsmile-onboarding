import React from 'react';

export default function StatCard({ label, value, subtitle, icon: Icon, color = 'text-[#0A0A0A]', accentColor = '#1356E2' }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 p-5 transition-all duration-500 hover:shadow-[0_8px_40px_-12px_rgba(0,36,67,0.12)] hover:-translate-y-1">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white to-transparent opacity-80" />
      
      {/* Animated accent glow on hover */}
      <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full opacity-0 group-hover:opacity-20 transition-all duration-700 blur-2xl" style={{ backgroundColor: accentColor }} />
      
      {/* Left accent bar */}
      <div className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full transition-all duration-500 opacity-40 group-hover:opacity-100" style={{ background: `linear-gradient(180deg, ${accentColor}, ${accentColor}40)` }} />
      
      <div className="relative z-10 flex items-start justify-between pl-2">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-semibold text-[#0A0A0A]/35 uppercase tracking-[0.12em] leading-none">{label}</p>
          <p className={`text-[22px] font-extrabold mt-2 tracking-tight leading-none ${color}`}>{value}</p>
          {subtitle && <p className="text-[10px] text-[#0A0A0A]/35 mt-1.5 leading-tight font-medium">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3" style={{ background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}08)` }}>
            <Icon className="w-[18px] h-[18px]" style={{ color: accentColor }} />
          </div>
        )}
      </div>
    </div>
  );
}