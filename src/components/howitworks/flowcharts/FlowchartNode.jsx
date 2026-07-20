import React from 'react';

// Nó do fluxograma — diferentes formas por tipo
export function StartEndNode({ label, color = 'bg-[#1356E2]' }) {
  return (
    <div className={`${color} text-white px-5 py-2.5 rounded-full text-xs font-bold text-center shadow-md min-w-[140px]`}>
      {label}
    </div>
  );
}

export function ProcessNode({ label, sublabel, color = 'bg-white', borderColor = 'border-[#0A0A0A]/15' }) {
  return (
    <div className={`${color} ${borderColor} border-2 px-4 py-2.5 rounded-xl text-center shadow-sm min-w-[160px] max-w-[220px]`}>
      <p className="text-[11px] font-bold text-[#0A0A0A] leading-tight">{label}</p>
      {sublabel && <p className="text-[9px] text-[#0A0A0A]/50 mt-0.5 leading-tight">{sublabel}</p>}
    </div>
  );
}

export function DecisionNode({ label, sublabel }) {
  return (
    <div className="relative min-w-[140px]">
      <div className="bg-amber-50 border-2 border-amber-300 px-4 py-3 text-center shadow-sm" style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}>
        <p className="text-[10px] font-bold text-amber-800 leading-tight">{label}</p>
      </div>
      {sublabel && <p className="text-[8px] text-amber-600/70 text-center mt-0.5">{sublabel}</p>}
    </div>
  );
}

export function DataNode({ label, sublabel }) {
  return (
    <div className="bg-blue-50 border-2 border-blue-200 px-4 py-2 rounded-lg text-center shadow-sm min-w-[140px] skew-x-[-6deg]">
      <div className="skew-x-[6deg]">
        <p className="text-[10px] font-bold text-blue-800 leading-tight">{label}</p>
        {sublabel && <p className="text-[8px] text-blue-500 mt-0.5">{sublabel}</p>}
      </div>
    </div>
  );
}

export function IANode({ label, sublabel }) {
  return (
    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300 px-4 py-2.5 rounded-2xl text-center shadow-sm min-w-[150px]">
      <p className="text-[10px] font-bold text-purple-800 leading-tight">🤖 {label}</p>
      {sublabel && <p className="text-[8px] text-purple-500 mt-0.5">{sublabel}</p>}
    </div>
  );
}

export function SubprocessNode({ label, items }) {
  return (
    <div className="bg-slate-50 border-2 border-slate-300 border-double px-3 py-2 rounded-lg text-center shadow-sm min-w-[150px]">
      <p className="text-[10px] font-bold text-slate-700 leading-tight">{label}</p>
      {items && (
        <div className="mt-1 space-y-0.5">
          {items.map((item, i) => (
            <p key={i} className="text-[8px] text-slate-500 leading-tight">• {item}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export function Arrow({ direction = 'down', label, color = 'text-[#0A0A0A]/30' }) {
  const arrows = {
    down: '↓',
    right: '→',
    left: '←',
    'down-left': '↙',
    'down-right': '↘',
  };
  return (
    <div className="flex flex-col items-center py-0.5">
      <span className={`text-lg ${color} leading-none`}>{arrows[direction]}</span>
      {label && <span className="text-[8px] text-[#0A0A0A]/40 font-medium -mt-0.5">{label}</span>}
    </div>
  );
}

export function BranchLabel({ label, color = 'text-[#1356E2]' }) {
  return <span className={`text-[8px] font-bold ${color} uppercase tracking-wider`}>{label}</span>;
}

export function ResponsibleBadge({ label, color = 'bg-[#0A0A0A]' }) {
  return (
    <span className={`${color} text-white text-[8px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider`}>
      {label}
    </span>
  );
}