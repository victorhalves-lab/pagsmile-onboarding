import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertOctagon, CheckCircle2, Clock, Zap, Database } from 'lucide-react';

const SUBFAIXA_CONFIG = {
  '1A': { label: 'VERDE EXPRESS', color: 'bg-emerald-500', textColor: 'text-emerald-700', bgLight: 'bg-emerald-50', border: 'border-emerald-200' },
  '1B': { label: 'VERDE', color: 'bg-emerald-400', textColor: 'text-emerald-600', bgLight: 'bg-emerald-50', border: 'border-emerald-200' },
  '2A': { label: 'AZUL LEVE', color: 'bg-blue-400', textColor: 'text-blue-700', bgLight: 'bg-blue-50', border: 'border-blue-200' },
  '2B': { label: 'AZUL', color: 'bg-blue-500', textColor: 'text-blue-700', bgLight: 'bg-blue-50', border: 'border-blue-200' },
  '3A': { label: 'AMARELO', color: 'bg-amber-400', textColor: 'text-amber-700', bgLight: 'bg-amber-50', border: 'border-amber-200' },
  '3B': { label: 'LARANJA', color: 'bg-orange-500', textColor: 'text-orange-700', bgLight: 'bg-orange-50', border: 'border-orange-200' },
  '4': { label: 'VERMELHO', color: 'bg-red-500', textColor: 'text-red-700', bgLight: 'bg-red-50', border: 'border-red-200' },
  '5': { label: 'BLOQUEIO', color: 'bg-red-700', textColor: 'text-red-800', bgLight: 'bg-red-50', border: 'border-red-300' },
};

export default function BDCScoreHeader({ analysis }) {
  const { scoring, blocks, datasetsQueried, queryDate, elapsedMs, type, templateModel, datasetGroup } = analysis;
  const config = SUBFAIXA_CONFIG[scoring.subfaixa] || SUBFAIXA_CONFIG['4'];
  const hasBlock = blocks.length > 0;
  const pct = Math.min(100, (scoring.finalScore / 849) * 100);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Top bar with gradient */}
      <div className={`h-1.5 ${config.color}`} />
      
      <div className="p-6">
        {/* Title row */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${config.bgLight}`}>
              <Shield className={`w-6 h-6 ${config.textColor}`} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0A0A0A]">Enriquecimento BDC — Big Data Corp</h3>
              <p className="text-xs text-[#0A0A0A]/50 mt-0.5">
                {type === 'PF' ? 'Análise Pessoa Física' : 'Análise Pessoa Jurídica'} • 
                Modelo: <span className="font-medium">{templateModel || 'N/D'}</span> • 
                Grupo: <span className="font-medium">{datasetGroup}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-[#0A0A0A]/40">
            <Database className="w-3 h-3" />
            <span>{datasetsQueried} datasets</span>
            <span>•</span>
            <Clock className="w-3 h-3" />
            <span>{elapsedMs}ms</span>
            {queryDate && <><span>•</span><span>{new Date(queryDate).toLocaleString('pt-BR')}</span></>}
          </div>
        </div>

        {/* Score grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Final score — large */}
          <div className={`col-span-2 lg:col-span-1 p-4 rounded-xl ${config.bgLight} border ${config.border}`}>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#0A0A0A]/50 mb-1">Score Final</p>
            <div className="flex items-baseline gap-1">
              <span className={`text-3xl font-black ${config.textColor}`}>{scoring.finalScore}</span>
              <span className="text-sm text-[#0A0A0A]/30">/849</span>
            </div>
            <div className="w-full h-2 bg-white/60 rounded-full mt-2 overflow-hidden">
              <div className={`h-full rounded-full ${config.color} transition-all duration-1000`} style={{ width: `${pct}%` }} />
            </div>
          </div>

          {/* Subfaixa */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#0A0A0A]/50 mb-1">Subfaixa</p>
            <Badge className={`${config.bgLight} ${config.textColor} ${config.border} border text-sm font-bold px-3 py-1`}>
              {scoring.subfaixa} — {config.label}
            </Badge>
          </div>

          {/* Base score */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#0A0A0A]/50 mb-1">Camada 1 — Base</p>
            <span className="text-2xl font-bold text-[#0A0A0A]">{scoring.baseScore}</span>
            <span className="text-xs text-[#0A0A0A]/40 ml-1">pts</span>
          </div>

          {/* Variables score */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#0A0A0A]/50 mb-1">Camada 2 — Variáveis</p>
            <span className={`text-2xl font-bold ${scoring.variablesScore > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {scoring.variablesScore > 0 ? '+' : ''}{scoring.variablesScore}
            </span>
            <span className="text-xs text-[#0A0A0A]/40 ml-1">pts</span>
          </div>

          {/* Enrichment score */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#0A0A0A]/50 mb-1">Camada 3 — Enriquecimento</p>
            <span className={`text-2xl font-bold ${scoring.enrichmentScore > 0 ? 'text-amber-600' : scoring.enrichmentScore < 0 ? 'text-emerald-600' : 'text-[#0A0A0A]'}`}>
              {scoring.enrichmentScore > 0 ? '+' : ''}{scoring.enrichmentScore}
            </span>
            <span className="text-xs text-[#0A0A0A]/40 ml-1">pts</span>
          </div>
        </div>

        {/* Weighted breakdown — Sprint 3 */}
        {scoring.weightBreakdown && (
          <div className="mb-6">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#0A0A0A]/50 mb-2">Decomposição por Peso (%)</p>
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
              {Object.entries(scoring.weightBreakdown).map(([key, wb]) => (
                <div key={key} className="p-2 rounded-lg bg-slate-50 border border-slate-100 text-center">
                  <p className="text-[9px] text-[#0A0A0A]/40 truncate capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className={`text-sm font-bold ${wb.rawScore > 30 ? 'text-red-600' : wb.rawScore > 10 ? 'text-amber-600' : wb.rawScore > 0 ? 'text-blue-600' : 'text-emerald-600'}`}>
                    {wb.weightedScore > 0 ? '+' : ''}{wb.weightedScore}
                  </p>
                  <p className="text-[8px] text-[#0A0A0A]/30">{wb.weight} × {wb.rawScore}pts</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Blocks alert */}
        {hasBlock && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertOctagon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-800">
                {blocks.length} BLOQUEIO{blocks.length > 1 ? 'S' : ''} ATIVO{blocks.length > 1 ? 'S' : ''} — Score elevado para 850+
              </p>
              <div className="mt-2 space-y-1.5">
                {blocks.map((b, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Badge className="bg-red-100 text-red-700 border-red-300 border text-[10px] font-mono flex-shrink-0">
                      {b.code}
                    </Badge>
                    <div>
                      <span className="text-xs font-semibold text-red-700">{b.label}</span>
                      <p className="text-[11px] text-red-600/80">{b.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick recommendation with explanation */}
        {!hasBlock && (
          <div className={`p-4 rounded-xl ${config.bgLight} border ${config.border}`}>
            <div className="flex items-center gap-2 mb-2">
              {scoring.finalScore <= 200 ? (
                <><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span className="text-xs font-bold text-emerald-700">Recomendação: APROVAÇÃO AUTOMÁTICA</span></>
              ) : scoring.finalScore <= 500 ? (
                <><Zap className="w-4 h-4 text-blue-600" /><span className="text-xs font-bold text-blue-700">Recomendação: APROVAÇÃO COM CONDIÇÕES</span></>
              ) : scoring.finalScore <= 700 ? (
                <><Clock className="w-4 h-4 text-amber-600" /><span className="text-xs font-bold text-amber-700">Recomendação: REVISÃO MANUAL</span></>
              ) : (
                <><AlertOctagon className="w-4 h-4 text-red-600" /><span className="text-xs font-bold text-red-700">Recomendação: RECUSA</span></>
              )}
            </div>
            <p className="text-[11px] text-[#0A0A0A]/60 leading-relaxed">
              {scoring.finalScore <= 200 
                ? 'O score indica baixo risco. Os dados da Big Data Corp não identificaram bloqueios, sanções críticas ou inconsistências graves. Este caso pode ser aprovado automaticamente.'
                : scoring.finalScore <= 500 
                ? 'O score indica risco moderado. Foram encontrados alguns pontos de atenção que devem ser analisados, mas não há bloqueios. Recomenda-se aprovação com condições específicas.'
                : scoring.finalScore <= 700 
                ? 'O score indica risco elevado. Vários pontos de atenção foram identificados. Recomenda-se que um analista revise manualmente este caso antes de tomar uma decisão.'
                : 'O score indica risco muito alto. Foram identificados fatores graves que impedem a aprovação automática. Revisão manual obrigatória.'}
            </p>
            {/* Score legend */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[{range:'0-100', label:'Verde Express', color:'bg-emerald-400'}, {range:'101-200', label:'Verde', color:'bg-emerald-300'}, {range:'201-300', label:'Azul', color:'bg-blue-400'}, {range:'301-500', label:'Amarelo', color:'bg-amber-400'}, {range:'501-700', label:'Laranja', color:'bg-orange-400'}, {range:'701-849', label:'Vermelho', color:'bg-red-500'}].map(s => (
                <span key={s.range} className="flex items-center gap-1 text-[9px] text-[#0A0A0A]/50">
                  <span className={`w-2 h-2 rounded-full ${s.color}`}/> {s.range}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}