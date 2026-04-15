import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronUp, AlertOctagon, BarChart3, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import BdcSectionInterpreter, { BlockInterpreter } from './BdcSectionInterpreter';
import { SECTION_EXPLANATIONS } from './BdcExplanations';

const SECTION_ICONS = {
  identity: '🏢', owners: '👥', digital: '🌐', compliance: '⚖️',
  reputation: '📰', financial: '💰', evolution: '📈', esg: '🌱',
  contacts: '📞', employeesKyc: '👔', sectorial: '🏭', assets: '🔧',
  creditRisk: '💳',
};

const SECTION_ORDER = ['compliance', 'creditRisk', 'owners', 'identity', 'reputation', 'digital', 'financial', 'evolution', 'esg', 'contacts', 'employeesKyc', 'sectorial', 'assets'];

export default function BdcV4AnalysisPanel({ latestScore }) {
  const [expandedSection, setExpandedSection] = useState(null);
  const [showAllSections, setShowAllSections] = useState(false);

  const sections = latestScore?.variaveis_aplicadas || {};
  const blocks = latestScore?.bloqueios_ativos || [];
  const scoring = {
    base: latestScore?.score_base_segmento,
    variables: latestScore?.score_variaveis,
    enrichment: latestScore?.score_enriquecimento,
    final: latestScore?.score_final,
    subfaixa: latestScore?.subfaixa,
    subfaixaNome: latestScore?.subfaixa_nome,
  };

  const sectionKeys = SECTION_ORDER.filter(k => sections[k]?.items?.length > 0);
  const displayedSections = showAllSections ? sectionKeys : sectionKeys.slice(0, 6);

  if (!latestScore?.variaveis_aplicadas) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-8 text-center">
        <Shield className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <p className="text-sm text-[var(--pagsmile-blue)]/50 font-medium">Análise V4 não disponível</p>
        <p className="text-xs text-[var(--pagsmile-blue)]/30 mt-1">O enriquecimento BDC e scoring V4 ainda não foram executados.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-50/50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--pagsmile-blue)]">Análise de Risco V4 — Visão Microscópica</h2>
              <p className="text-xs text-[var(--pagsmile-blue)]/40">Cada item analisado com explicação didática, base regulatória e impacto no score</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-[var(--pagsmile-blue)] text-white text-xs">Score: {scoring.final}/849</Badge>
            <Badge className={`text-xs border-0 ${getSubfaixaColor(scoring.subfaixa)}`}>{scoring.subfaixa} — {scoring.subfaixaNome}</Badge>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Score Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ScoreCard label="Base Segmento" value={scoring.base} desc="Score inicial baseado no tipo de negócio" />
          <ScoreCard label="Variáveis" value={scoring.variables} desc="Ajuste por dados declarados" />
          <ScoreCard label="Enriquecimento" value={scoring.enrichment} desc="Ajuste por dados BDC verificados" />
          <ScoreCard label="Score Final" value={scoring.final} desc="0 = melhor, 849 = pior" highlight />
        </div>

        {/* Blocks */}
        {blocks.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-red-700 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4" />
              Bloqueios Ativos ({blocks.length})
            </h3>
            <div className="p-3 bg-red-50/50 rounded-lg border border-red-200 text-xs text-red-700/70 mb-3">
              Bloqueios são condições que forçam o score para 850 (máximo risco) independentemente dos demais indicadores.
              Qualquer bloqueio ativo impede a aprovação automática.
            </div>
            {blocks.map((b, i) => {
              const code = typeof b === 'string' ? b.split('_')[0] : b.code;
              const label = typeof b === 'string' ? b.replace(/^B\d+_/, '') : b.label;
              return <BlockInterpreter key={i} block={{ code, label, severity: 'BLOQUEIO', detail: typeof b === 'string' ? b : b.detail || '' }} />;
            })}
          </div>
        )}

        {/* Sections */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[var(--pagsmile-blue)] flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Análise por Dimensão ({sectionKeys.length} dimensões, {sectionKeys.reduce((s, k) => s + (sections[k]?.items?.length || 0), 0)} itens)
            </h3>
          </div>

          {displayedSections.map(key => {
            const section = sections[key];
            const info = SECTION_EXPLANATIONS[key] || { title: key };
            const isExpanded = expandedSection === key;
            const itemCount = section?.items?.length || 0;
            const criticalCount = section?.items?.filter(i => i.risk === 'CRITICO').length || 0;
            const highCount = section?.items?.filter(i => i.risk === 'ALTO').length || 0;
            const score = section?.score || 0;

            return (
              <div key={key} className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedSection(isExpanded ? null : key)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-slate-50/50 transition-colors text-left"
                >
                  <span className="text-lg">{SECTION_ICONS[key] || '📊'}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-bold text-[var(--pagsmile-blue)]">{info.title || key}</span>
                    <p className="text-[10px] text-[var(--pagsmile-blue)]/40">{itemCount} itens analisados</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {criticalCount > 0 && <Badge className="bg-red-100 text-red-700 text-[10px] border-0">{criticalCount} crítico</Badge>}
                    {highCount > 0 && <Badge className="bg-orange-100 text-orange-700 text-[10px] border-0">{highCount} alto</Badge>}
                    {score > 0 && <Badge variant="outline" className="text-[10px]">+{score} pts</Badge>}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-slate-100 p-4">
                    <BdcSectionInterpreter sectionKey={key} sectionData={section} />
                  </div>
                )}
              </div>
            );
          })}

          {sectionKeys.length > 6 && !showAllSections && (
            <button onClick={() => setShowAllSections(true)} className="w-full py-3 text-center text-xs text-indigo-600 hover:text-indigo-800 font-medium border border-dashed border-indigo-200 rounded-xl hover:bg-indigo-50/50 transition-colors">
              Mostrar mais {sectionKeys.length - 6} dimensões
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ label, value, desc, highlight }) {
  return (
    <div className={`p-3 rounded-xl border ${highlight ? 'bg-[var(--pagsmile-blue)] border-[var(--pagsmile-blue)]' : 'bg-white border-slate-200'}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-wide ${highlight ? 'text-white/60' : 'text-[var(--pagsmile-blue)]/40'}`}>{label}</p>
      <p className={`text-xl font-black mt-0.5 ${highlight ? 'text-white' : 'text-[var(--pagsmile-blue)]'}`}>{value ?? '—'}</p>
      <p className={`text-[9px] mt-0.5 ${highlight ? 'text-white/50' : 'text-[var(--pagsmile-blue)]/30'}`}>{desc}</p>
    </div>
  );
}

function getSubfaixaColor(subfaixa) {
  const colors = {
    '1A': 'bg-green-100 text-green-700', '1B': 'bg-green-100 text-green-700',
    '2A': 'bg-blue-100 text-blue-700', '2B': 'bg-blue-100 text-blue-700',
    '3A': 'bg-yellow-100 text-yellow-700', '3B': 'bg-orange-100 text-orange-700',
    '4': 'bg-red-100 text-red-700', '5': 'bg-red-200 text-red-800',
  };
  return colors[subfaixa] || 'bg-slate-100 text-slate-600';
}