import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * BDCDataConfidence — Shows which datasets returned data and which came empty,
 * so the analyst knows if the analysis is partial.
 */

const CORE_DATASETS = {
  identity: { label: 'Dados Cadastrais', required: true, desc: 'Razão social, CNPJ, situação, fundação' },
  owners: { label: 'Quadro Societário', required: true, desc: 'Sócios, participação, qualificação' },
  digital: { label: 'Presença Digital', required: false, desc: 'Domínios, passagens, atividade online' },
  compliance: { label: 'Compliance / PLD', required: true, desc: 'Sanções, PEP, processos, dívida ativa' },
  reputation: { label: 'Reputação / Mídia', required: false, desc: 'Notícias, avaliações, Reclame Aqui' },
  financial: { label: 'Financeiro / Mercado', required: false, desc: 'BCB, CVM, grupo econômico, MCC' },
};

export default function BDCDataConfidence({ analysis }) {
  if (!analysis?.sections) return null;

  const sections = analysis.sections;
  const results = Object.entries(CORE_DATASETS).map(([key, config]) => {
    const section = sections[key];
    const hasData = section?.items && section.items.length > 0;
    const itemCount = section?.items?.length || 0;
    return { key, ...config, hasData, itemCount };
  });

  const withData = results.filter(r => r.hasData).length;
  const total = results.length;
  const confidencePercent = Math.round((withData / total) * 100);
  const requiredMissing = results.filter(r => r.required && !r.hasData);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-bold text-[#002443]">📊 Score de Confiança dos Dados</h4>
          <p className="text-[10px] text-[#002443]/40">
            Indica quais fontes de dados retornaram informações. Quanto mais fontes, mais confiável a análise.
          </p>
        </div>
        <div className="text-right">
          <span className={`text-2xl font-black ${
            confidencePercent >= 80 ? 'text-green-600' : 
            confidencePercent >= 50 ? 'text-amber-600' : 'text-red-600'
          }`}>
            {confidencePercent}%
          </span>
          <p className="text-[10px] text-[#002443]/40">cobertura</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full mb-4 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            confidencePercent >= 80 ? 'bg-green-500' : 
            confidencePercent >= 50 ? 'bg-amber-500' : 'bg-red-500'
          }`}
          style={{ width: `${confidencePercent}%` }}
        />
      </div>

      {/* Warning for required missing */}
      {requiredMissing.length > 0 && (
        <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] font-semibold text-amber-700">
              {requiredMissing.length} fonte(s) crítica(s) sem dados
            </p>
            <p className="text-[10px] text-amber-600/70">
              {requiredMissing.map(r => r.label).join(', ')} — A análise pode estar incompleta.
            </p>
          </div>
        </div>
      )}

      {/* Dataset grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {results.map(r => (
          <div 
            key={r.key} 
            className={`rounded-lg p-2.5 border ${
              r.hasData ? 'bg-green-50/50 border-green-200' : 'bg-slate-50 border-slate-200 opacity-60'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              {r.hasData 
                ? <CheckCircle2 className="w-3 h-3 text-green-600" /> 
                : <XCircle className="w-3 h-3 text-slate-400" />
              }
              <span className="text-[11px] font-semibold text-[#002443]">{r.label}</span>
              {r.required && <Badge className="bg-blue-100 text-blue-600 text-[8px] px-1 h-3.5">obrigatório</Badge>}
            </div>
            <p className="text-[9px] text-[#002443]/40 ml-4.5">{r.desc}</p>
            {r.hasData && (
              <p className="text-[9px] text-green-600 font-medium ml-4.5">{r.itemCount} item(ns)</p>
            )}
          </div>
        ))}
      </div>

      {/* Info about datasets queried */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-[10px] text-[#002443]/40">
        <Database className="w-3 h-3" />
        <span>
          {analysis.datasetsQueried || '?'} datasets consultados na BDC • 
          Grupo: {analysis.datasetGroup || 'N/D'} • 
          Modelo: {analysis.templateModel || 'N/D'}
        </span>
      </div>
    </div>
  );
}