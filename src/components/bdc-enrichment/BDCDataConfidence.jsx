import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Database, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getDatasetInfo } from '../risk-analysis/datasetGlossary';

/**
 * BDCDataConfidence — Shows which datasets returned data and which came empty,
 * so the analyst knows if the analysis is partial.
 */

const CORE_DATASETS = {
  identity: { label: 'Dados Cadastrais', required: true, desc: 'Razão social, CNPJ, situação, fundação' },
  owners: { label: 'Quadro Societário', required: true, desc: 'Sócios, PEP, sanções, grupo econômico' },
  digital: { label: 'Presença Digital', required: false, desc: 'Domínios, passagens, atividade online' },
  compliance: { label: 'Compliance / PLD', required: true, desc: 'Sanções, processos, dívida ativa, distribuição' },
  reputation: { label: 'Reputação / Mídia', required: false, desc: 'Notícias, avaliações, Reclame Aqui' },
  financial: { label: 'Financeiro / Mercado', required: false, desc: 'BCB, CVM, grupo econômico, MCC, ativos' },
  evolution: { label: 'Evolução Histórica', required: false, desc: 'Capital, funcionários, alterações cadastrais' },
  esg: { label: 'ESG / Lista Suja', required: true, desc: 'Lista Suja MTE, IBAMA, indicadores ESG' },
  contacts: { label: 'Validação Contatos', required: false, desc: 'Telefones, e-mails, endereços validados' },
  employeesKyc: { label: 'KYC Funcionários', required: false, desc: 'PEP e sanções entre funcionários-chave' },
  sectorial: { label: 'Dados Setoriais', required: false, desc: 'ANVISA, CVM, ANS, OAB, CRM, CREA' },
  assets: { label: 'Ativos Patrimoniais', required: false, desc: 'Imóveis, veículos, aeronaves, embarcações' },
};

// Map analise_dimensional keys → core dataset keys
const DIMENSIONAL_TO_CORE = {
  identidade: 'identity',
  socios: 'owners',
  compliance: 'compliance',
  digital: 'digital',
  reputacao: 'reputation',
  financeiro: 'financial',
  biometria: null, // no direct core dataset
};

export default function BDCDataConfidence({ analysis, analiseDimensional }) {
  const hasSections = analysis?.sections && Object.keys(analysis.sections).length > 0;
  const hasDimensional = analiseDimensional && typeof analiseDimensional === 'object' && Object.keys(analiseDimensional).length > 0;

  if (!hasSections && !hasDimensional) return null;

  let results;
  if (hasSections) {
    const sections = analysis.sections;
    results = Object.entries(CORE_DATASETS).map(([key, config]) => {
      const section = sections[key];
      const hasData = section?.items && section.items.length > 0;
      const itemCount = section?.items?.length || 0;
      return { key, ...config, hasData, itemCount };
    });
  } else {
    // Build from analise_dimensional: mark dimensions as "has data" if veredicto !== NAO_DISPONIVEL
    results = Object.entries(CORE_DATASETS).map(([key, config]) => {
      // Find matching dimensional key
      const dimKey = Object.entries(DIMENSIONAL_TO_CORE).find(([, v]) => v === key)?.[0];
      const dimData = dimKey ? analiseDimensional[dimKey] : null;
      const hasData = dimData ? dimData.veredicto !== 'NAO_DISPONIVEL' : false;
      const itemCount = dimData?.findings?.length || 0;
      return { key, ...config, hasData, itemCount };
    });
  }

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

      {/* Cobertura global hint */}
      <div className="mb-3 p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-start gap-2">
        <Info className="w-3 h-3 text-[#002443]/40 shrink-0 mt-0.5" />
        <p className="text-[10px] text-[#002443]/60 leading-relaxed">
          <strong>Cobertura: {withData}/{total} fontes responderam ({confidencePercent}%).</strong>{' '}
          Quanto mais datasets BDC respondem com dados, mais confiável a análise. Datasets vazios podem indicar CNPJ novo ou sem dados históricos. Passe o mouse sobre cada card para ver o que ele traz.
        </p>
      </div>

      {/* Dataset grid with tooltips explaining what each brings */}
      <TooltipProvider delayDuration={200}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {results.map(r => {
            const info = getDatasetInfo(r.key);
            return (
              <Tooltip key={r.key}>
                <TooltipTrigger asChild>
                  <div
                    className={`rounded-lg p-2.5 border cursor-help ${
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
                      <Info className="w-2.5 h-2.5 text-[#002443]/30 ml-auto" />
                    </div>
                    <p className="text-[9px] text-[#002443]/40 ml-4.5">{r.desc}</p>
                    {r.hasData && (
                      <p className="text-[9px] text-green-600 font-medium ml-4.5">{r.itemCount} item(ns)</p>
                    )}
                  </div>
                </TooltipTrigger>
                {info && (
                  <TooltipContent side="top" className="max-w-xs bg-[#002443] text-white border-[#002443]">
                    <p className="text-[11px] font-bold mb-1">{info.label}</p>
                    <p className="text-[10px] text-white/80 leading-relaxed mb-1.5">{info.brings}</p>
                    {info.datasets && (
                      <div className="pt-1 border-t border-white/20">
                        <p className="text-[9px] text-white/50">Datasets BDC:</p>
                        <p className="text-[9px] font-mono text-[#2bc196]">{info.datasets.join(', ')}</p>
                      </div>
                    )}
                  </TooltipContent>
                )}
              </Tooltip>
            );
          })}
        </div>
      </TooltipProvider>

      {/* Info about datasets queried */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-[10px] text-[#002443]/40">
        <Database className="w-3 h-3" />
        <span>
          {analysis?.datasetsQueried || '?'} datasets consultados na BDC • 
          Grupo: {analysis?.datasetGroup || 'N/D'} • 
          Modelo: {analysis?.templateModel || 'N/D'}
          {!hasSections && hasDimensional && ' (dados derivados da análise dimensional SENTINEL)'}
        </span>
      </div>
    </div>
  );
}