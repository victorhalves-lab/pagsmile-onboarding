import React, { useState } from 'react';
import { Eye, FileQuestion, FileText, Lightbulb, Bookmark, ChevronDown, ChevronUp, Brain, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ReactMarkdown from 'react-markdown';

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
            <div className="text-sm text-[#002443]/80 leading-relaxed whitespace-pre-wrap">{complianceScore.parecer_final}</div>
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
            <div className="text-sm text-amber-700 whitespace-pre-wrap leading-relaxed">{complianceScore.condicoes_aprovacao}</div>
          </div>
        )}

        {/* Findings */}
        {hasFindings && (
          <Section icon={Search} title={`Findings (${complianceScore.total_findings})`} iconBg="bg-indigo-50" iconColor="text-indigo-600">
            <div className="mt-3">
              <p className="text-[10px] text-[#002443]/40 mb-3">Findings são achados categorizados por severidade. São informativos, não decisórios.</p>
              {complianceScore.findings_por_severidade && (
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(complianceScore.findings_por_severidade)
                    .sort(([a], [b]) => {
                      const order = { BLOQUEANTE: 0, CRITICAL: 1, critico: 1, HIGH: 2, alto: 2, MEDIUM: 3, medio: 3, LOW: 4, baixo: 4, INFO: 5, info: 5 };
                      return (order[a] ?? 6) - (order[b] ?? 6);
                    })
                    .map(([severity, count]) => {
                      const colors = {
                        CRITICAL: 'bg-red-50 border-red-200 text-red-700', critico: 'bg-red-50 border-red-200 text-red-700',
                        HIGH: 'bg-orange-50 border-orange-200 text-orange-700', alto: 'bg-orange-50 border-orange-200 text-orange-700',
                        MEDIUM: 'bg-amber-50 border-amber-200 text-amber-700', medio: 'bg-amber-50 border-amber-200 text-amber-700',
                        LOW: 'bg-blue-50 border-blue-200 text-blue-700', baixo: 'bg-blue-50 border-blue-200 text-blue-700',
                        INFO: 'bg-slate-50 border-slate-200 text-slate-700', info: 'bg-slate-50 border-slate-200 text-slate-700',
                      };
                      return (
                        <div key={severity} className={`px-3 py-2 rounded-lg border text-center min-w-[70px] ${colors[severity] || 'bg-slate-50 border-slate-200'}`}>
                          <p className="text-lg font-black">{count}</p>
                          <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">{severity}</p>
                        </div>
                      );
                    })}
                </div>
              )}
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
          <Section icon={FileText} title="Documentos Adicionais Sugeridos" iconBg="bg-purple-50" iconColor="text-purple-600">
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
            <p className="mt-3 text-sm text-orange-700 whitespace-pre-wrap leading-relaxed">{complianceScore.recomendacoes_revisao_manual}</p>
          </Section>
        )}

        {/* Full analysis (collapsed) */}
        {complianceScore.analise_completa_ia && (
          <Section icon={Brain} title="Análise Completa SENTINEL (texto integral)" iconBg="bg-[#002443]/5" iconColor="text-[#002443]/60">
            <div className="mt-3 prose prose-sm max-w-none text-[#002443]">
              <ReactMarkdown
                components={{
                  h2: ({ children }) => <h2 className="text-base font-bold text-[#002443] mt-5 mb-2 pb-1.5 border-b border-[#002443]/10">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold text-[#002443] mt-4 mb-1.5">{children}</h3>,
                  p: ({ children }) => <p className="text-[13px] text-[#002443]/80 leading-[1.7] my-1.5">{children}</p>,
                  strong: ({ children }) => <strong className="text-[#002443] font-bold">{children}</strong>,
                  li: ({ children }) => <li className="text-[13px] text-[#002443]/80 leading-[1.7] my-1">{children}</li>,
                  ul: ({ children }) => <ul className="list-disc pl-5 my-2 space-y-0.5">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 my-2 space-y-0.5">{children}</ol>,
                }}
              >
                {complianceScore.analise_completa_ia}
              </ReactMarkdown>
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