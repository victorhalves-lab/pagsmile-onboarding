import React from 'react';
import { Rocket } from 'lucide-react';

/**
 * [V5.2 Fase 6.1] Filtro reutilizável de framework_version.
 *
 * Renderiza 3 chips: Todos / V4 / V5.2 BETA.
 * Independente de Select/SelectContent (ainda mais compacto em barras de filtro).
 *
 * Props:
 *   - value: 'all' | 'v4.0' | 'v5.2'
 *   - onChange: (next) => void
 *   - counts: opcional { all, v4, v52 } para mostrar contadores
 */
export default function FrameworkVersionFilter({ value, onChange, counts }) {
  const options = [
    { key: 'all', label: 'Todos', count: counts?.all },
    { key: 'v4.0', label: 'V4', count: counts?.v4 },
    { key: 'v5.2', label: 'V5.2 BETA', icon: Rocket, count: counts?.v52, highlight: true },
  ];
  return (
    <div className="flex items-center gap-1 bg-white border border-[#0A0A0A]/10 rounded-lg p-0.5">
      {options.map((opt) => {
        const active = value === opt.key;
        const Icon = opt.icon;
        return (
          <button
            key={opt.key}
            onClick={() => onChange(opt.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              active
                ? opt.highlight
                  ? 'bg-[#1356E2]/15 text-[#E84B1C]'
                  : 'bg-[#0A0A0A] text-white'
                : 'text-[#0A0A0A]/55 hover:text-[#0A0A0A] hover:bg-[#0A0A0A]/5'
            }`}
            title={opt.highlight ? 'Framework V5.2 — Tier-aware (BETA)' : opt.label}
          >
            {Icon && <Icon className="w-3 h-3" />}
            <span>{opt.label}</span>
            {opt.count != null && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-[#0A0A0A]/8'}`}>
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Badge minúsculo "V5.2" para colocar em cards/rows quando framework_version === 'v5.2'.
 */
export function V5_2Badge({ frameworkVersion, className = '' }) {
  if (frameworkVersion !== 'v5.2') return null;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#1356E2]/15 text-[#E84B1C] text-[9px] font-bold uppercase tracking-wide ${className}`} title="Framework V5.2 — Tier-aware (BETA)">
      <Rocket className="w-2.5 h-2.5" />
      V5.2
    </span>
  );
}