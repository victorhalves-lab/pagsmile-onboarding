import React from 'react';
import { Shield, TrendingUp, TrendingDown, Lock, Eye, Activity, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ScoreBreakdownExplainer from './ScoreBreakdownExplainer';

const SUBFAIXA_CONFIG = {
  '1A': { label: 'VERDE EXPRESS', color: 'bg-emerald-500', text: 'text-emerald-700', bgLight: 'bg-emerald-50', border: 'border-emerald-200' },
  '1B': { label: 'VERDE', color: 'bg-emerald-400', text: 'text-emerald-600', bgLight: 'bg-emerald-50', border: 'border-emerald-200' },
  '2A': { label: 'AZUL LEVE', color: 'bg-blue-400', text: 'text-blue-700', bgLight: 'bg-blue-50', border: 'border-blue-200' },
  '2B': { label: 'AZUL', color: 'bg-blue-500', text: 'text-blue-700', bgLight: 'bg-blue-50', border: 'border-blue-200' },
  '3A': { label: 'AMARELO', color: 'bg-amber-400', text: 'text-amber-700', bgLight: 'bg-amber-50', border: 'border-amber-200' },
  '3B': { label: 'LARANJA', color: 'bg-orange-500', text: 'text-orange-700', bgLight: 'bg-orange-50', border: 'border-orange-200' },
  '4': { label: 'VERMELHO', color: 'bg-red-500', text: 'text-red-700', bgLight: 'bg-red-50', border: 'border-red-200' },
  '5': { label: 'BLOQUEIO', color: 'bg-red-700', text: 'text-red-800', bgLight: 'bg-red-50', border: 'border-red-300' },
};

const SCALE_ITEMS = [
  { key: '1A', label: '1A', sublabel: 'Verde Express', range: '0-100' },
  { key: '1B', label: '1B', sublabel: 'Verde', range: '101-200' },
  { key: '2A', label: '2A', sublabel: 'Azul Leve', range: '201-300' },
  { key: '2B', label: '2B', sublabel: 'Azul', range: '301-400' },
  { key: '3A', label: '3A', sublabel: 'Amarelo', range: '401-500' },
  { key: '3B', label: '3B', sublabel: 'Laranja', range: '501-600' },
  { key: '4', label: '4', sublabel: 'Vermelho', range: '601-700' },
  { key: '5', label: '5', sublabel: 'Bloqueio', range: '701-849' },
];

export default function RiskScorePanel({ onboardingCase, complianceScore }) {
  const score = onboardingCase?.riskScoreV4;
  const subfaixa = onboardingCase?.subfaixa;
  const cfg = SUBFAIXA_CONFIG[subfaixa] || SUBFAIXA_CONFIG['4'];
  const c1 = complianceScore?.score_base_segmento;
  const c2 = complianceScore?.score_variaveis;
  const c3 = complianceScore?.score_enriquecimento;
  const segmento = complianceScore?.segmento;
  const monitoramento = onboardingCase?.monitoramentoNivel || complianceScore?.monitoramento_nivel;
  const rollingReserve = onboardingCase?.rollingReservePercent || complianceScore?.rolling_reserve_percent || 0;
  const pct = score != null ? Math.min(100, (score / 849) * 100) : 0;

  if (score == null) return null;

  return (
    <div className="bg-white rounded-2xl border border-[#0A0A0A]/8 overflow-hidden">
      <div className={`h-1.5 ${cfg.color}`} />
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${cfg.bgLight}`}>
            <Shield className={`w-5 h-5 ${cfg.text}`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0A0A0A]">Score V4 — Dados Objetivos (BDC + CAF)</h3>
            <p className="text-[10px] text-[#0A0A0A]/40">
              Score calculado por fórmula determinística sobre dados reais da Big Data Corp. Não é opinião de IA.
              {segmento && <> • Segmento: <strong>{segmento}</strong></>}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Score */}
          <div className={`p-5 rounded-xl ${cfg.bgLight} border ${cfg.border}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#0A0A0A]/50 mb-2">Score Final</p>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-4xl font-black ${cfg.text}`}>{score}</span>
              <span className="text-sm text-[#0A0A0A]/30 font-medium">/849</span>
            </div>
            <div className="w-full h-2 bg-white/60 rounded-full mt-3 overflow-hidden">
              <div className={`h-full rounded-full ${cfg.color} transition-all duration-1000`} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[10px] text-[#0A0A0A]/40 mt-1">0 = mínimo risco • 849 = máximo</p>
          </div>

          {/* Classification */}
          <div className="p-5 rounded-xl bg-[#f4f4f4] border border-[#0A0A0A]/5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#0A0A0A]/50 mb-2">Classificação</p>
            <Badge className={`${cfg.bgLight} ${cfg.text} ${cfg.border} border text-base font-black px-4 py-1.5`}>
              {subfaixa} — {cfg.label}
            </Badge>
            <div className="mt-3 space-y-1">
              {monitoramento && (
                <div className="flex items-center gap-1.5 text-xs text-[#0A0A0A]/60">
                  <Eye className="w-3.5 h-3.5 text-[#0A0A0A]/40" />
                  <span>Monitoramento: <strong>{monitoramento}</strong></span>
                </div>
              )}
              {rollingReserve > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-amber-700">
                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Rolling Reserve: <strong>{rollingReserve}%</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Decomposition */}
          <div className="p-5 rounded-xl bg-[#f4f4f4] border border-[#0A0A0A]/5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#0A0A0A]/50 mb-2">Composição</p>
            {c1 != null && (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#0A0A0A]/60">C1 — Base do Segmento</span>
                  <span className="font-bold text-[#0A0A0A]">{c1} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0A0A0A]/60">C2 — Variáveis BDC</span>
                  <span className={`font-bold ${c2 > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{c2 > 0 ? '+' : ''}{c2} pts</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#0A0A0A]/60">C3 — Enriquecimento</span>
                  <span className={`font-bold ${c3 > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{c3 > 0 ? '+' : ''}{c3} pts</span>
                </div>
                <div className="border-t border-[#0A0A0A]/10 pt-1 flex justify-between">
                  <span className="font-bold text-[#0A0A0A]">Total</span>
                  <span className="font-black text-[#0A0A0A]">{score} pts</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scale reference */}
        <div className="flex gap-0.5 rounded-lg overflow-hidden h-6">
          {SCALE_ITEMS.map(item => {
            const itemCfg = SUBFAIXA_CONFIG[item.key];
            const isActive = item.key === subfaixa;
            return (
              <div
                key={item.key}
                className={`flex-1 ${itemCfg.color} flex items-center justify-center text-[8px] font-bold text-white/90 relative ${isActive ? 'ring-2 ring-[#0A0A0A] ring-offset-1 z-10 scale-105' : 'opacity-50'}`}
                title={`${item.sublabel}: ${item.range} pts`}
              >
                {item.label}
              </div>
            );
          })}
        </div>

        {/* Entenda o Score V4 — expansible layer-by-layer breakdown */}
        <ScoreBreakdownExplainer complianceScore={complianceScore} segmento={segmento} />
      </div>
    </div>
  );
}