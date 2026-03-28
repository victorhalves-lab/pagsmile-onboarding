import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Sector } from 'recharts';

const FALLBACK = ['#2bc196', '#002443', '#36706c', '#5cf7cf', '#94a3b8', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

function renderActiveShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius - 2} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.9} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 8} outerRadius={outerRadius + 12} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.3} />
      <text x={cx} y={cy - 8} textAnchor="middle" fill="#002443" fontSize={16} fontWeight={800}>{value}</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#002443" fontSize={10} opacity={0.5}>{`${(percent * 100).toFixed(0)}%`}</text>
    </g>
  );
}

export default function DonutChart({ title, data, colorMap = {}, height = 240 }) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-2xl overflow-hidden bg-white border border-slate-100 p-5 hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-[#002443]">{title}</h3>
        <span className="text-[10px] font-bold text-[#002443]/30 bg-slate-50 px-2 py-0.5 rounded-full">{total}</span>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={3}
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
            contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', padding: '8px 14px', fontSize: 12 }}
            formatter={(val, name) => [`${val} (${total > 0 ? ((val / total) * 100).toFixed(1) : 0}%)`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-1">
        {data.map((entry, i) => (
          <button
            key={i}
            className="flex items-center gap-1.5 group cursor-pointer"
            onMouseEnter={() => setActiveIndex(i)}
            onMouseLeave={() => setActiveIndex(-1)}
          >
            <div className="w-2.5 h-2.5 rounded-sm transition-transform duration-200 group-hover:scale-125" style={{ backgroundColor: colorMap[entry.name] || FALLBACK[i % FALLBACK.length] }} />
            <span className="text-[10px] text-[#002443]/50 group-hover:text-[#002443] transition-colors font-medium">{entry.name}</span>
            <span className="text-[10px] font-bold text-[#002443]/30">{entry.value}</span>
          </button>
        ))}
      </div>
    </div>
  );
}