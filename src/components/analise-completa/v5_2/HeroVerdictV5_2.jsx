import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, ShieldAlert, Eye, XCircle, ShieldOff } from 'lucide-react';
import Term from '@/components/v5_2/glossary/Term';
import TermBlock from '@/components/v5_2/glossary/TermBlock';

/**
 * [V5.2 Fase 6.4-B] Hero Verdict — Camada 1 da nova tela DOC6.
 * Decisão em destaque (48px), causa principal, chips de bloqueios.
 * Sticky compacto preparado mas renderiza inline por simplicidade nesta fase.
 */

const DECISION_CONFIG = {
  cat_1_auto_approve: {
    label: 'APROVADO',
    sub: 'Auto-aprovado',
    Icon: CheckCircle2,
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
    iconBg: 'bg-emerald-100',
  },
  cat_2_conditional: {
    label: 'APROVADO C/ CONDIÇÕES',
    sub: 'Condicional',
    Icon: AlertTriangle,
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    iconBg: 'bg-blue-100',
  },
  cat_3_manual_review: {
    label: 'REVISÃO MANUAL',
    sub: 'Aguarda decisão humana',
    Icon: Eye,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    iconBg: 'bg-amber-100',
  },
  cat_4_block: {
    label: 'RECUSADO',
    sub: 'Bloqueio direto',
    Icon: XCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    iconBg: 'bg-red-100',
  },
  cat_5_intensive_monitoring: {
    label: 'MONITORAMENTO INTENSIVO',
    sub: 'Aprovado com cap + reserve',
    Icon: ShieldAlert,
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    iconBg: 'bg-purple-100',
  },
};

const DEFAULT_CONFIG = {
  label: 'EM ANÁLISE',
  sub: 'Score V5.2 calculado',
  Icon: ShieldOff,
  bg: 'bg-slate-50',
  border: 'border-slate-200',
  text: 'text-slate-700',
  iconBg: 'bg-slate-100',
};

/**
 * Extrai a causa principal (DOC6 §2.6.1): bloqueio crítico > escalação > padrão.
 */
function getCausaPrincipal({ bloqueios, score, escalation }) {
  if (Array.isArray(bloqueios) && bloqueios.length > 0) {
    return `Bloqueio ativo: ${bloqueios[0]}${bloqueios.length > 1 ? ` (+${bloqueios.length - 1})` : ''}`;
  }
  if (escalation) return `Escalação SENTINEL — ${escalation}`;
  if (score != null) return `Score V5.2 = ${score}`;
  return 'Análise em andamento';
}

export default function HeroVerdictV5_2({ latestCase, latestScore }) {
  const categoria = latestCase?.categoria_decisao_v5_2 || latestScore?.categoria_decisao_v5_1;
  const config = DECISION_CONFIG[categoria] || DEFAULT_CONFIG;
  const { Icon } = config;

  const score = latestScore?.score_v5_1_final ?? latestCase?.risk_score_v5_1;
  const subfaixa = latestCase?.subfaixa_tier_aware || latestScore?.subfaixa_tier_aware;
  const tier = latestCase?.tier;
  const segmento = latestCase?.segmento_v5_1;
  const bloqueios = latestCase?.bloqueiosAtivos || latestScore?.bloqueios_v5_1_ativos || [];
  const escalation = latestScore?.escalation_justification;

  const causa = getCausaPrincipal({ bloqueios, score, escalation });

  return (
    <Card className={`border-2 ${config.border} ${config.bg}`}>
      <CardContent className="py-5 px-6">
        <div className="flex items-start gap-5 flex-wrap">
          {/* Icon 64x64 */}
          <div className={`w-16 h-16 rounded-2xl ${config.iconBg} flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-8 h-8 ${config.text}`} />
          </div>

          {/* Main */}
          <div className="flex-1 min-w-[280px]">
            <p className={`text-[10px] uppercase tracking-widest font-bold ${config.text}/70 mb-1`}>
              Veredicto V5.2
            </p>
            <h1 className={`text-3xl md:text-4xl font-bold ${config.text} leading-tight`}>
              {config.label}
            </h1>
            <p className="text-sm text-[#0A0A0A]/70 mt-1">{causa}</p>

            {/* Tier + Segmento + Subfaixa — com glossário inline */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {tier && (
                <Term code={tier} inline className="text-[10px] font-mono border border-current/20 rounded px-2 py-0.5">
                  {tier.toUpperCase()}
                </Term>
              )}
              {segmento && (
                <Badge variant="outline" className="text-[10px]">
                  {segmento.replace(/_/g, ' ')}
                </Badge>
              )}
              {subfaixa && (
                <Badge variant="outline" className="text-[10px] font-mono bg-white">
                  {subfaixa}
                </Badge>
              )}
            </div>
          </div>

          {/* Score */}
          {score != null && (
            <div className="text-right flex-shrink-0">
              <p className="text-[10px] uppercase tracking-widest font-bold text-[#0A0A0A]/40 mb-1">
                <Term code="framework_version" inline>Score V5.2</Term>
              </p>
              <p className={`text-5xl font-bold font-mono ${config.text}`}>{score}</p>
              <p className="text-[10px] text-[#0A0A0A]/40 font-mono">
                {tier === 'tier_3' ? '/ 999' : '/ 850'}
              </p>
            </div>
          )}
        </div>

        {/* Chips de bloqueios ativos — com glossário inline em cada B-* conhecido */}
        {bloqueios.length > 0 && (
          <div className="mt-4 pt-4 border-t border-current/10">
            <p className="text-[10px] uppercase font-semibold text-[#0A0A0A]/50 mb-2">
              <Term code="bloqueio_absoluto" inline>Bloqueios ativos</Term> ({bloqueios.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {bloqueios.slice(0, 8).map((b) => (
                <TermBlock
                  key={b}
                  blockCode={b}
                  inline
                  className="bg-red-100 text-red-700 border border-red-200 text-[10px] font-mono px-2 py-0.5 rounded"
                >
                  {b}
                </TermBlock>
              ))}
              {bloqueios.length > 8 && (
                <Badge variant="outline" className="text-[10px]">
                  +{bloqueios.length - 8}
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}