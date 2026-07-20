import React from 'react';
import { Shield, Rocket } from 'lucide-react';

/**
 * [V5.2 Fase 6.5.2] Seletor de framework version para link de subseller.
 *
 * Aparece como passo 1 do GenerateLinkModal — admin escolhe se o link gera
 * casos no trilho V4 (legado) ou V5.2 (novo, tier-aware).
 *
 * Default: V4 (zero regressão para fluxo atual).
 */
export default function FrameworkVersionPicker({ value, onChange }) {
  const options = [
    {
      key: 'v4.0',
      title: 'Trilho V4 (Atual)',
      description: 'Templates por segmento, score V4 0-849, subfaixas 1A-5. Estável em produção.',
      icon: Shield,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      ringActive: 'ring-blue-500',
    },
    {
      key: 'v5.2',
      title: 'Trilho V5.2 (Novo)',
      description: 'Template único dinâmico tier-aware. Subseller PJ/PF com grau A/B/C, Patch Financeiro, 5 categorias de decisão.',
      icon: Rocket,
      iconBg: 'bg-[#1356E2]/15',
      iconColor: 'text-[#1356E2]',
      ringActive: 'ring-[#1356E2]',
      beta: true,
    },
  ];

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-[#0A0A0A]">Framework de risco do link</p>
        <p className="text-[11px] text-[#0A0A0A]/55 mt-0.5">
          Define qual pipeline analisa os subsellers gerados por este link. O DNA é imutável após criação.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {options.map(opt => {
          const Icon = opt.icon;
          const active = value === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => onChange(opt.key)}
              className={`w-full p-3 border-2 rounded-xl text-left transition-all ${
                active
                  ? `border-current ring-2 ${opt.ringActive} ring-opacity-30 bg-white`
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
              style={active ? { borderColor: opt.key === 'v5.2' ? '#1356E2' : '#3b82f6' } : {}}
            >
              <div className="flex items-start gap-3">
                <div className={`w-9 h-9 rounded-lg ${opt.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-4 h-4 ${opt.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-[#0A0A0A]">{opt.title}</p>
                    {opt.beta && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#1356E2]/15 text-[#1356E2] uppercase tracking-wider">
                        Beta
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#0A0A0A]/60 mt-0.5 leading-snug">{opt.description}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 mt-1 shrink-0 ${
                  active
                    ? (opt.key === 'v5.2' ? 'border-[#1356E2] bg-[#1356E2]' : 'border-blue-500 bg-blue-500')
                    : 'border-slate-300'
                }`}>
                  {active && <div className="w-full h-full rounded-full bg-white scale-50" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}