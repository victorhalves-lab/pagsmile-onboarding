import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Brain, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp,
  Lightbulb, FileQuestion, FileText, ThumbsUp, ThumbsDown, Eye, Gauge,
  Target, List, Bookmark, Flag, Search
} from 'lucide-react';
import SentinelTextFormatter from '../compliance/SentinelTextFormatter';
import FindingsExplainer from '../compliance/FindingsExplainer';

function SectionCard({ icon: Icon, title, iconBg, iconColor, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-50/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 rounded-lg ${iconBg}`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          <span className="text-sm font-bold text-[#002443]">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[#002443]/30" /> : <ChevronDown className="w-4 h-4 text-[#002443]/30" />}
      </button>
      {open && <div className="px-4 pb-4 border-t border-slate-100">{children}</div>}
    </div>
  );
}

export default function UnifiedIAAnalysis({ complianceScore, onboardingCase }) {
  const [expandedFullAnalysis, setExpandedFullAnalysis] = useState(false);

  if (!complianceScore) {
    return (
      <div className="bg-white rounded-2xl border border-[#002443]/8 p-8 text-center">
        <Brain className="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <p className="text-sm font-semibold text-[#002443]/60">Análise IA SENTINEL não disponível</p>
        <p className="text-xs text-[#002443]/40 mt-1">Execute o scoring para gerar análise profunda com findings, red flags e recomendações.</p>
      </div>
    );
  }

  const isManualReview = complianceScore.recomendacao_final === 'Revisão Manual';
  const hasRedFlags = complianceScore.red_flags?.length > 0;
  const hasPositives = complianceScore.pontos_positivos?.length > 0;
  const hasAttention = complianceScore.pontos_atencao?.length > 0;
  const hasFindings = complianceScore.total_findings > 0;
  const hasVariables = complianceScore.variaveis_aplicadas && Object.keys(complianceScore.variaveis_aplicadas).length > 0;

  return (
    <div className="bg-white rounded-2xl border border-[#002443]/8 overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-[#002443] via-[#2bc196] to-[#5cf7cf]" />
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#002443] to-[#2bc196]">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#002443]">Análise IA SENTINEL — Profunda</h3>
            <p className="text-xs text-[#002443]/40">
              Insights, findings, red flags, pontos positivos e recomendações detalhadas
              {complianceScore.versao_agente && <> • Agent {complianceScore.versao_agente}</>}
            </p>
          </div>
        </div>

        {/* Sumário Executivo */}
        {complianceScore.sumario_executivo && (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-[#002443]/50" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#002443]/50">Sumário Executivo</span>
            </div>
            <SentinelTextFormatter text={complianceScore.sumario_executivo} />
          </div>
        )}

        {/* Red Flags — Sempre visível se existir */}
        {hasRedFlags && (
          <SectionCard icon={Flag} title={`Red Flags Identificados (${complianceScore.red_flags.length})`} iconBg="bg-red-50" iconColor="text-red-600" defaultOpen={true}>
            <div className="mt-3 space-y-2">
              {complianceScore.red_flags.map((flag, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-red-50/50 rounded-lg border border-red-100">
                  <ThumbsDown className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-red-800 font-medium">{flag}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Pontos Positivos + Pontos de Atenção lado a lado */}
        {(hasPositives || hasAttention) && (
          <div className="grid md:grid-cols-2 gap-4">
            {hasPositives && (
              <SectionCard icon={ThumbsUp} title={`Pontos Positivos (${complianceScore.pontos_positivos.length})`} iconBg="bg-emerald-50" iconColor="text-emerald-600" defaultOpen={true}>
                <ul className="mt-3 space-y-1.5">
                  {complianceScore.pontos_positivos.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}
            {hasAttention && (
              <SectionCard icon={AlertTriangle} title={`Pontos de Atenção (${complianceScore.pontos_atencao.length})`} iconBg="bg-amber-50" iconColor="text-amber-600" defaultOpen={true}>
                <ul className="mt-3 space-y-1.5">
                  {complianceScore.pontos_atencao.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-amber-700">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
              </SectionCard>
            )}
          </div>
        )}

        {/* Findings por Severidade — com explicação e drill-down */}
        {hasFindings && (
          <SectionCard icon={Search} title={`Findings Identificados (${complianceScore.total_findings})`} iconBg="bg-indigo-50" iconColor="text-indigo-600" defaultOpen={true}>
            <div className="mt-3">
              <FindingsExplainer
                complianceScoreId={complianceScore.id}
                findingsBySeverity={complianceScore.findings_por_severidade}
              />
            </div>
          </SectionCard>
        )}

        {/* Variáveis V01-V60 aplicadas */}
        {hasVariables && (
          <SectionCard icon={List} title="Variáveis de Risco Aplicadas" iconBg="bg-purple-50" iconColor="text-purple-600" defaultOpen={false}>
            <div className="mt-3 space-y-1">
              {complianceScore.variaveis_negativas?.length > 0 && (
                <div className="mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-red-500 mb-1.5">Penalizadoras (+pontos = mais risco)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {complianceScore.variaveis_negativas.map((v, i) => (
                      <Badge key={i} className="bg-red-50 text-red-700 border-red-200 border text-[10px] font-mono">{v}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {complianceScore.variaveis_positivas?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 mb-1.5">Redutoras (−pontos = menos risco)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {complianceScore.variaveis_positivas.map((v, i) => (
                      <Badge key={i} className="bg-emerald-50 text-emerald-700 border-emerald-200 border text-[10px] font-mono">{v}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* Recomendações para Revisão Manual */}
        {isManualReview && complianceScore.recomendacoes_revisao_manual && (
          <SectionCard icon={Lightbulb} title="Recomendações para o Analista" iconBg="bg-orange-50" iconColor="text-orange-600" defaultOpen={true}>
            <div className="mt-3">
              <SentinelTextFormatter text={complianceScore.recomendacoes_revisao_manual} />
            </div>
          </SectionCard>
        )}

        {/* Perguntas Sugeridas */}
        {isManualReview && complianceScore.perguntas_sugeridas?.length > 0 && (
          <SectionCard icon={FileQuestion} title={`Perguntas Sugeridas (${complianceScore.perguntas_sugeridas.length})`} iconBg="bg-blue-50" iconColor="text-blue-600" defaultOpen={true}>
            <ul className="mt-3 space-y-2">
              {complianceScore.perguntas_sugeridas.map((p, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-blue-700">
                  <span className="text-blue-400 font-bold text-xs mt-0.5">{i + 1}.</span>
                  {p}
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {/* Documentos Adicionais Sugeridos */}
        {isManualReview && complianceScore.documentos_adicionais_sugeridos?.length > 0 && (
          <SectionCard icon={FileText} title="Documentos Adicionais Sugeridos" iconBg="bg-purple-50" iconColor="text-purple-600" defaultOpen={false}>
            <ul className="mt-3 space-y-1.5">
              {complianceScore.documentos_adicionais_sugeridos.map((d, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-purple-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 mt-0.5 shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          </SectionCard>
        )}

        {/* Condições de Aprovação */}
        {complianceScore.condicoes_aprovacao && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Bookmark className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-bold text-amber-800">Condições para Aprovação</span>
            </div>
            <SentinelTextFormatter text={complianceScore.condicoes_aprovacao} />
          </div>
        )}

        {/* Parecer Final */}
        {complianceScore.parecer_final && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-[#002443]/60" />
              <span className="text-sm font-bold text-[#002443]">Parecer Final SENTINEL</span>
            </div>
            <SentinelTextFormatter text={complianceScore.parecer_final} />
          </div>
        )}

        {/* Análise Completa (expansível) */}
        {complianceScore.analise_completa_ia && (
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedFullAnalysis(!expandedFullAnalysis)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-[#002443]/5">
                  <Brain className="w-4 h-4 text-[#002443]/60" />
                </div>
                <span className="text-sm font-bold text-[#002443]">Análise Completa da IA (texto integral)</span>
              </div>
              {expandedFullAnalysis ? <ChevronUp className="w-4 h-4 text-[#002443]/30" /> : <ChevronDown className="w-4 h-4 text-[#002443]/30" />}
            </button>
            {expandedFullAnalysis && (
              <div className="px-4 pb-4 border-t border-slate-100">
                <div className="mt-3 bg-slate-50 p-4 rounded-lg max-h-[600px] overflow-y-auto">
                  <SentinelTextFormatter text={complianceScore.analise_completa_ia} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Metadados */}
        <div className="flex flex-wrap gap-4 text-[10px] text-[#002443]/40 pt-2 border-t border-slate-100">
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