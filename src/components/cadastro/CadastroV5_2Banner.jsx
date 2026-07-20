import React from 'react';
import { Rocket, ShieldAlert, ShieldCheck, Layers, Globe, Boxes } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * [V5.2 Fase 5.10] Banner discreto exibido APENAS quando latestCase.framework_version === 'v5.2'.
 *
 * Mostra ao analista, em uma faixa única:
 *  - DNA do caso (framework + transicional?)
 *  - Tier resolvido + Segmento + Morfologia
 *  - Capabilities ativas (chips)
 *  - Categoria de decisão V5.2 (cat_1..cat_5)
 *  - Patch financeiro status
 *  - Bloqueios V5.2 ativos (preview)
 *
 * Casos V4 NÃO renderizam este componente — UI legada permanece intocada.
 */

const TIER_LABELS = {
  tier_1: 'Tier 1',
  tier_2: 'Tier 2',
  tier_3: 'Tier 3',
  subseller_pj: 'Subseller PJ',
  subseller_pf: 'Subseller PF',
};

const CATEGORIA_CONFIG = {
  cat_1_auto_approve: { label: 'Categoria 1 — Auto-aprovação', cls: 'bg-emerald-100 text-emerald-800', Icon: ShieldCheck },
  cat_2_conditional: { label: 'Categoria 2 — Aprovado com Condições', cls: 'bg-teal-100 text-teal-800', Icon: ShieldCheck },
  cat_3_manual_review: { label: 'Categoria 3 — Revisão Manual', cls: 'bg-amber-100 text-amber-800', Icon: ShieldAlert },
  cat_4_block: { label: 'Categoria 4 — Bloqueado', cls: 'bg-red-100 text-red-800', Icon: ShieldAlert },
  cat_5_intensive_monitoring: { label: 'Categoria 5 — Monitoramento Intensivo', cls: 'bg-violet-100 text-violet-800', Icon: ShieldAlert },
};

const PATCH_CONFIG = {
  verde: { label: 'Patch Financeiro · Verde', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  amarelo: { label: 'Patch Financeiro · Amarelo', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  laranja: { label: 'Patch Financeiro · Laranja', cls: 'bg-orange-50 text-orange-700 border-orange-200' },
  vermelho: { label: 'Patch Financeiro · Vermelho', cls: 'bg-red-50 text-red-700 border-red-200' },
  nao_aplicavel: { label: 'Patch Financeiro · N/A', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
};

export default function CadastroV5_2Banner({ latestCase }) {
  if (!latestCase || latestCase.framework_version !== 'v5.2') return null;

  const tier = latestCase.tier;
  const segmento = latestCase.segmento_v5_1;
  const morfologia = latestCase.morfologia;
  const capabilities = Array.isArray(latestCase.capabilities_ativas) ? latestCase.capabilities_ativas : [];
  const categoria = latestCase.categoria_decisao_v5_2;
  const patch = latestCase.patch_financeiro_status;
  const bloqueios = Array.isArray(latestCase.bloqueiosAtivos) ? latestCase.bloqueiosAtivos : [];
  const isTransitional = !!latestCase.is_transitional_case;
  const scoreV52 = latestCase.risk_score_v5_1;

  const catCfg = CATEGORIA_CONFIG[categoria];
  const patchCfg = PATCH_CONFIG[patch];

  return (
    <div className="bg-gradient-to-r from-[#1356E2]/8 via-white to-[#0A0A0A]/4 border border-[#1356E2]/25 rounded-xl p-4">
      {/* Linha 1 — DNA */}
      <div className="flex items-center flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2 pr-3 border-r border-[#0A0A0A]/10">
          <Rocket className="w-4 h-4 text-[#1356E2]" />
          <span className="text-xs font-bold text-[#0A0A0A]">Framework V5.2</span>
          {isTransitional && (
            <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">Transicional</Badge>
          )}
        </div>

        {tier && (
          <Badge className="bg-[#0A0A0A]/8 text-[#0A0A0A] border-0 text-xs">
            <Layers className="w-3 h-3 mr-1" />{TIER_LABELS[tier] || tier}
          </Badge>
        )}
        {segmento && (
          <Badge className="bg-blue-50 text-blue-700 border-0 text-xs">
            <Globe className="w-3 h-3 mr-1" />{segmento}
          </Badge>
        )}
        {morfologia && (
          <Badge variant="outline" className="text-xs">Morfologia {morfologia}</Badge>
        )}
        {scoreV52 != null && (
          <Badge className="bg-[#1356E2]/15 text-[#E84B1C] border-0 text-xs font-mono">
            Score V5.2: {scoreV52}
          </Badge>
        )}
      </div>

      {/* Linha 2 — Decisão + Patch */}
      <div className="flex items-center flex-wrap gap-2 mb-3">
        {catCfg && (
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${catCfg.cls}`}>
            <catCfg.Icon className="w-3.5 h-3.5" />
            {catCfg.label}
          </div>
        )}
        {patchCfg && patch !== 'nao_aplicavel' && (
          <div className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold border ${patchCfg.cls}`}>
            {patchCfg.label}
          </div>
        )}
      </div>

      {/* Linha 3 — Capabilities */}
      {capabilities.length > 0 && (
        <div className="flex items-start gap-2 mb-3">
          <Boxes className="w-3.5 h-3.5 text-[#0A0A0A]/50 mt-1 flex-shrink-0" />
          <div className="flex flex-wrap gap-1.5">
            {capabilities.map((cap) => (
              <span key={cap} className="text-[11px] px-2 py-0.5 rounded-full bg-[#0A0A0A]/6 text-[#0A0A0A]/75 font-mono">
                {cap}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Linha 4 — Bloqueios ativos */}
      {bloqueios.length > 0 && (
        <div className="border-t border-[#0A0A0A]/8 pt-2 mt-2">
          <p className="text-[11px] text-[#0A0A0A]/60 mb-1 font-semibold uppercase tracking-wide">
            Bloqueios V5.2 ativos ({bloqueios.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {bloqueios.slice(0, 8).map((b) => (
              <Badge key={b} className="bg-red-50 text-red-700 border border-red-200 text-[10px] font-mono">
                {b}
              </Badge>
            ))}
            {bloqueios.length > 8 && (
              <span className="text-[10px] text-[#0A0A0A]/50">+{bloqueios.length - 8}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}