import React from 'react';
import { Shield, AlertOctagon, Minus, Plus, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * [V5.2 Fase 6.5.3] Bloco que destaca a DIFERENÇA entre bloqueios ativos V4 vs V5.2.
 *
 * Lógica:
 *  - "Apenas V4" → bloqueio que SUMIU na V5.2 (V5.2 foi mais leniente OU sistema diferente)
 *  - "Apenas V5.2" → bloqueio NOVO descoberto pela V5.2 (ex: B-FIN-1 do Patch Financeiro)
 *  - "Mantido" → bloqueio presente em ambos (preocupação confirmada)
 *
 * Não tenta decidir qual está "certo" — apenas mostra a divergência para o analista.
 */
export default function ComparatorBlockagesDiff({ v4Blocks = [], v5_2Blocks = [] }) {
  const v4Set = new Set(v4Blocks);
  const v5Set = new Set(v5_2Blocks);

  const onlyV4 = v4Blocks.filter((b) => !v5Set.has(b));
  const onlyV5 = v5_2Blocks.filter((b) => !v4Set.has(b));
  const shared = v4Blocks.filter((b) => v5Set.has(b));

  const noneInBoth = v4Blocks.length === 0 && v5_2Blocks.length === 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
          <AlertOctagon className="w-4 h-4 text-red-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#0A0A0A]">Bloqueios ativos — diferença</h3>
          <p className="text-[11px] text-[#0A0A0A]/55">
            Comparação entre os bloqueios detectados em cada framework
          </p>
        </div>
      </div>

      {noneInBoth ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
          <Check className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
          <p className="text-sm font-semibold text-emerald-800">Nenhum bloqueio em ambos os frameworks</p>
          <p className="text-[11px] text-emerald-700 mt-0.5">Caso convergiu em "limpo" V4 e V5.2.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Shared / mantidos */}
          <BlockSection
            title="Mantidos (V4 ∩ V5.2)"
            description="Bloqueios confirmados pelos dois frameworks — preocupação real"
            blocks={shared}
            icon={Shield}
            tone="amber"
            emptyLabel="Nenhum bloqueio comum"
          />

          {/* Only V5.2 */}
          <BlockSection
            title="Novos na V5.2 (não estavam na V4)"
            description="V5.2 descobriu bloqueios que o V4 não enxergava (ex: Patch Financeiro, PLD/FT expandido)"
            blocks={onlyV5}
            icon={Plus}
            tone="green"
            emptyLabel="V5.2 não adicionou nenhum bloqueio"
          />

          {/* Only V4 */}
          <BlockSection
            title="Removidos pela V5.2 (existiam na V4)"
            description="V5.2 não disparou esses bloqueios — pode ser melhor tier-awareness ou regra removida/reformulada"
            blocks={onlyV4}
            icon={Minus}
            tone="blue"
            emptyLabel="V5.2 manteve todos os bloqueios da V4"
          />
        </div>
      )}
    </div>
  );
}

function BlockSection({ title, description, blocks, icon: Icon, tone, emptyLabel }) {
  const toneClasses = {
    amber: {
      header: 'bg-amber-50 border-amber-200',
      title: 'text-amber-900',
      desc: 'text-amber-700',
      icon: 'text-amber-600',
      badge: 'bg-amber-100 text-amber-800 border border-amber-200',
    },
    green: {
      header: 'bg-emerald-50 border-emerald-200',
      title: 'text-emerald-900',
      desc: 'text-emerald-700',
      icon: 'text-emerald-600',
      badge: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    },
    blue: {
      header: 'bg-blue-50 border-blue-200',
      title: 'text-blue-900',
      desc: 'text-blue-700',
      icon: 'text-blue-600',
      badge: 'bg-blue-100 text-blue-800 border border-blue-200',
    },
  };
  const t = toneClasses[tone] || toneClasses.amber;

  return (
    <div className={`border rounded-xl p-3 ${t.header}`}>
      <div className="flex items-start gap-2 mb-2">
        <Icon className={`w-4 h-4 mt-0.5 ${t.icon}`} />
        <div className="flex-1">
          <p className={`text-xs font-bold ${t.title}`}>
            {title} <span className="font-normal opacity-70">({blocks.length})</span>
          </p>
          <p className={`text-[10px] mt-0.5 ${t.desc}`}>{description}</p>
        </div>
      </div>
      {blocks.length === 0 ? (
        <p className={`text-[11px] italic ${t.desc} pl-6`}>{emptyLabel}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5 pl-6">
          {blocks.map((b) => (
            <Badge key={b} className={`${t.badge} text-[10px] font-mono`}>
              {b}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}