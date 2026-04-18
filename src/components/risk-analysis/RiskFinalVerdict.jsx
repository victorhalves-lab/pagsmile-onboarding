import React, { useState } from 'react';
import { Eye, FileQuestion, FileText, Lightbulb, Bookmark, ChevronDown, ChevronUp, Brain, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import SentinelTextFormatter from '../compliance/SentinelTextFormatter';
import SentinelDocumentRenderer from './SentinelDocumentRenderer';
import FindingsWithFallback from './FindingsWithFallback';

function Section({ icon: Icon, title, iconBg, iconColor, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[#002443]/8 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${iconBg}`}><Icon className={`w-4 h-4 ${iconColor}`} /></div>
          <span className="text-sm font-bold text-[#002443]">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[#002443]/30" /> : <ChevronDown className="w-4 h-4 text-[#002443]/30" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-[#002443]/5">{children}</div>}
    </div>
  );
}

export default function RiskFinalVerdict({ complianceScore, onboardingCase }) {
  if (!complianceScore) return null;

  const isManualReview = (complianceScore.recomendacao_final || '').includes('Manual') || (complianceScore.recomendacao_final || '').includes('Condições');
  const hasFindings = complianceScore.total_findings > 0;

  return (
    <div className="bg-white rounded-2xl border border-[#002443]/8 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-[#002443] via-[#2bc196] to-[#5cf7cf]" />
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#002443] to-[#2bc196]">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#002443]">Parecer SENTINEL — Análise Qualitativa</h3>
            <p className="text-[10px] text-[#002443]/40">
              O SENTINEL analisa dados de 3 fontes (Questionário + BDC + CAF) e sugere condições. NÃO tem poder de recusa.
              {complianceScore.versao_agente && <> • {complianceScore.versao_agente}</>}
            </p>
          </div>
        </div>

        {/* Parecer Final */}
        {complianceScore.parecer_final && (
          <div className="p-4 bg-[#002443]/[0.03] rounded-xl border border-[#002443]/8">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-[#002443]/60" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#002443]/50">Parecer Final</span>
            </div>
            <SentinelTextFormatter text={complianceScore.parecer_final} />
          </div>
        )}

        {/* Conditions */}
        {complianceScore.condicoes_aprovacao && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Bookmark className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-bold text-amber-800">Condições Sugeridas pelo SENTINEL</span>
            </div>
            <p className="text-xs text-amber-600/80 mb-2">Estas condições foram sugeridas pela IA para mitigar os pontos de atenção identificados.</p>
            <SentinelTextFormatter text={complianceScore.condicoes_aprovacao} />
          </div>
        )}

        {/* Findings — com drill-down detalhado e fallback garantido */}
        {hasFindings && (
          <Section icon={Search} title={`Findings (${complianceScore.total_findings})`} iconBg="bg-indigo-50" iconColor="text-indigo-600" defaultOpen={true}>
            <div className="mt-3">
              <FindingsWithFallback complianceScore={complianceScore} />
            </div>
          </Section>
        )}

        {/* Suggested Questions */}
        {complianceScore.perguntas_sugeridas?.length > 0 && (
          <Section icon={FileQuestion} title={`Perguntas Sugeridas (${complianceScore.perguntas_sugeridas.length})`} iconBg="bg-blue-50" iconColor="text-blue-600" defaultOpen={isManualReview}>
            <ul className="mt-3 space-y-2">
              {complianceScore.perguntas_sugeridas.map((p, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-blue-700 leading-relaxed">
                  <span className="text-blue-400 font-bold text-xs mt-0.5">{i + 1}.</span>
                  {p}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Suggested Documents */}
        {complianceScore.documentos_adicionais_sugeridos?.length > 0 && (
          <Section icon={FileText} title="Documentos Adicionais Sugeridos" iconBg="bg-purple-50" iconColor="text-purple-600" defaultOpen={true}>
            <ul className="mt-3 space-y-1.5">
              {complianceScore.documentos_adicionais_sugeridos.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-purple-700 leading-relaxed">
                  <FileText className="w-3.5 h-3.5 text-purple-500 mt-0.5 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Manual review recommendations */}
        {complianceScore.recomendacoes_revisao_manual && (
          <Section icon={Lightbulb} title="Recomendações para o Analista" iconBg="bg-orange-50" iconColor="text-orange-600" defaultOpen={isManualReview}>
            <div className="mt-3">
              <SentinelTextFormatter text={complianceScore.recomendacoes_revisao_manual} />
            </div>
          </Section>
        )}

        {/* Full analysis — navigable document with TOC + section cards */}
        {complianceScore.analise_completa_ia && (
          <Section icon={Brain} title="Análise Completa SENTINEL" iconBg="bg-[#002443]/5" iconColor="text-[#002443]/60" defaultOpen={true}>
            <div className="mt-3">
              <SentinelDocumentRenderer text={complianceScore.analise_completa_ia} />
            </div>
          </Section>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap gap-4 text-[10px] text-[#002443]/40 pt-2 border-t border-[#002443]/5">
          {complianceScore.versao_agente && <span>Agent: {complianceScore.versao_agente}</span>}
          {complianceScore.framework_version && <span>Framework: {complianceScore.framework_version}</span>}
          {complianceScore.data_analise_fase_1 && <span>Fase 1: {new Date(complianceScore.data_analise_fase_1).toLocaleDateString('pt-BR')}</span>}
          {complianceScore.data_analise_fase_2 && <span>Fase 2: {new Date(complianceScore.data_analise_fase_2).toLocaleDateString('pt-BR')}</span>}
          {complianceScore.data_analise_fase_3 && <span>Fase 3: {new Date(complianceScore.data_analise_fase_3).toLocaleDateString('pt-BR')}</span>}
        </div>
      </div>
    </div>
  );
}