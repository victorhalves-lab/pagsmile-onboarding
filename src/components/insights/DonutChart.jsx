import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';

const FALLBACK = ['#2bc196', '#002443', '#36706c', '#5cf7cf', '#94a3b8', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

function renderActiveShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, percent, value } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 2} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.85} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 15} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.15} />
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#002443" fontSize={18} fontWeight={800} letterSpacing="-0.02em">{value}</text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="#002443" fontSize={10} opacity={0.35} fontWeight={600}>{`${(percent * 100).toFixed(0)}%`}</text>
    </g>
  );
}

export default function DonutChart({ title, data, colorMap = {}, height = 240 }) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm border border-white/60 p-5 transition-all duration-500 hover:shadow-[0_8px_40px_-12px_rgba(0,36,67,0.1)]">
      {/* Hover glow */}
      <div className="absolute -bottom-8 -right-8 w-20 h-20 bg-[#2bc196]/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-[13px] font-bold text-[#002443] tracking-tight">{title}</h3>
          <span className="text-[10px] font-bold text-[#002443]/20 bg-[#002443]/[0.03] px-2.5 py-1 rounded-lg tabular-nums">{total}</span>
        </div>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={78}
              paddingAngle={4}
              activeIndex={activeIndex >= 0 ? activeIndex : undefined}
              activeShape={activeIndex >= 0 ? renderActiveShape : undefined}
              onMouseEnter={(_, i) => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(-1)}
              strokeWidth={0}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={colorMap[entry.name] || FALLBACK[i % FALLBACK.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ borderRadius: 16, border: 'none', boxShadow: '0 12px 40px rgba(0,0,0,0.08)', padding: '10px 16px', fontSize: 12, backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.95)' }}
              formatter={(val, name) => [`${val} (${total > 0 ? ((val / total) * 100).toFixed(1) : 0}%)`, name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1">
          {data.map((entry, i) => (
            <button
              key={i}
              className="flex items-center gap-1.5 group/legend cursor-pointer"
              onMouseEnter={() => setActiveIndex(i)}
              onMouseLeave={() => setActiveIndex(-1)}
            >
              <div className="w-2 h-2 rounded-full transition-transform duration-300 group-hover/legend:scale-150" style={{ backgroundColor: colorMap[entry.name] || FALLBACK[i % FALLBACK.length] }} />
              <span className="text-[10px] text-[#002443]/40 group-hover/legend:text-[#002443] transition-colors font-medium">{entry.name}</span>
              <span className="text-[10px] font-bold text-[#002443]/20 tabular-nums">{entry.value}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}