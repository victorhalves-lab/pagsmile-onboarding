import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Brain,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  FileQuestion,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Eye,
  Gauge
} from 'lucide-react';

export default function IAAnalysisPanel({ complianceScore, onboardingCase }) {
  const [expandedAnalysis, setExpandedAnalysis] = useState(false);

  if (!complianceScore) {
    return (
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 text-center">
        <Brain className="w-12 h-12 mx-auto text-slate-300 mb-4" />
        <p className="text-[var(--pagsmile-blue)]/70 font-medium">Análise da IA não disponível</p>
        <p className="text-sm text-[var(--pagsmile-blue)]/50 mt-1">O caso ainda não foi analisado pela IA</p>
      </div>
    );
  }

  const getDecisionColor = (decision) => {
    switch (decision) {
      case 'Aprovado': return 'bg-green-50 border-green-200';
      case 'Aprovado com Condições': return 'bg-yellow-50 border-yellow-200';
      case 'Revisão Manual': return 'bg-orange-50 border-orange-200';
      case 'Recusado': return 'bg-red-50 border-red-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  const getDecisionIcon = (decision) => {
    switch (decision) {
      case 'Aprovado': return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case 'Aprovado com Condições': return <AlertTriangle className="w-6 h-6 text-yellow-600" />;
      case 'Revisão Manual': return <AlertTriangle className="w-6 h-6 text-orange-600" />;
      case 'Recusado': return <XCircle className="w-6 h-6 text-red-600" />;
      default: return <Brain className="w-6 h-6 text-slate-600" />;
    }
  };

  const isManualReview = complianceScore.recomendacao_final === 'Revisão Manual';

  return (
    <div className="space-y-6">
      {/* Header da Análise */}
      <div className={`rounded-xl border p-6 ${getDecisionColor(complianceScore.recomendacao_final)}`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${
            complianceScore.recomendacao_final === 'Aprovado' ? 'bg-green-100' :
            complianceScore.recomendacao_final === 'Aprovado com Condições' ? 'bg-yellow-100' :
            complianceScore.recomendacao_final === 'Revisão Manual' ? 'bg-orange-100' : 'bg-red-100'
          }`}>
            {getDecisionIcon(complianceScore.recomendacao_final)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-bold text-lg text-[var(--pagsmile-blue)]">
                Recomendação da IA: {complianceScore.recomendacao_final}
              </h3>
              {complianceScore.nivel_confianca_ia && (
                <Badge variant="outline" className="gap-1">
                  <Gauge className="w-3 h-3" />
                  {complianceScore.nivel_confianca_ia}% confiança
                </Badge>
              )}
            </div>
            
            {/* Sumário Executivo */}
            {complianceScore.sumario_executivo && (
              <p className="text-[var(--pagsmile-blue)]/80 font-medium mb-4">
                {complianceScore.sumario_executivo}
              </p>
            )}

            {/* Scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-xs text-[var(--pagsmile-blue)]/60 font-semibold">Score Questionário</p>
                <p className="text-xl font-bold text-[var(--pagsmile-blue)]">{complianceScore.score_questionario || '-'}</p>
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-xs text-[var(--pagsmile-blue)]/60 font-semibold">Score Validação Externa</p>
                <p className="text-xl font-bold text-[var(--pagsmile-blue)]">{complianceScore.score_validacao_externa || '-'}</p>
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-xs text-[var(--pagsmile-blue)]/60 font-semibold">Bônus Consistência</p>
                <p className="text-xl font-bold text-[var(--pagsmile-blue)]">{complianceScore.bonus_consistencia || '-'}</p>
              </div>
              <div className="bg-white/60 rounded-lg p-3">
                <p className="text-xs text-[var(--pagsmile-blue)]/60 font-semibold">Score Geral</p>
                <p className="text-2xl font-bold text-[var(--pagsmile-blue)]">{complianceScore.score_geral_composto || '-'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recomendações para Revisão Manual */}
      {isManualReview && complianceScore.recomendacoes_revisao_manual && (
        <Alert className="bg-orange-50 border-orange-200">
          <Lightbulb className="h-5 w-5 text-orange-600" />
          <AlertDescription>
            <p className="font-bold text-orange-800 mb-2">Recomendações para Análise Manual</p>
            <p className="text-orange-700 whitespace-pre-wrap">{complianceScore.recomendacoes_revisao_manual}</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Perguntas Sugeridas */}
      {isManualReview && complianceScore.perguntas_sugeridas?.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileQuestion className="w-5 h-5 text-blue-600" />
            <h4 className="font-bold text-blue-800">Perguntas Sugeridas para Investigação</h4>
          </div>
          <ul className="space-y-2">
            {complianceScore.perguntas_sugeridas.map((pergunta, idx) => (
              <li key={idx} className="flex items-start gap-2 text-blue-700">
                <span className="text-blue-500 font-bold">{idx + 1}.</span>
                {pergunta}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Documentos Adicionais Sugeridos */}
      {isManualReview && complianceScore.documentos_adicionais_sugeridos?.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-5 h-5 text-purple-600" />
            <h4 className="font-bold text-purple-800">Documentos Adicionais Sugeridos</h4>
          </div>
          <ul className="space-y-2">
            {complianceScore.documentos_adicionais_sugeridos.map((doc, idx) => (
              <li key={idx} className="flex items-start gap-2 text-purple-700">
                <CheckCircle2 className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                {doc}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pontos Positivos e de Atenção */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Pontos Positivos */}
        {complianceScore.pontos_positivos?.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <ThumbsUp className="w-5 h-5 text-green-600" />
              <h4 className="font-bold text-green-800">Pontos Positivos</h4>
            </div>
            <ul className="space-y-2">
              {complianceScore.pontos_positivos.map((ponto, idx) => (
                <li key={idx} className="flex items-start gap-2 text-green-700 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  {ponto}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pontos de Atenção */}
        {complianceScore.pontos_atencao?.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              <h4 className="font-bold text-yellow-800">Pontos de Atenção</h4>
            </div>
            <ul className="space-y-2">
              {complianceScore.pontos_atencao.map((ponto, idx) => (
                <li key={idx} className="flex items-start gap-2 text-yellow-700 text-sm">
                  <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                  {ponto}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Red Flags */}
      {complianceScore.red_flags?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-5 h-5 text-red-600" />
            <h4 className="font-bold text-red-800">Red Flags Identificados</h4>
          </div>
          <ul className="space-y-2">
            {complianceScore.red_flags.map((flag, idx) => (
              <li key={idx} className="flex items-start gap-2 text-red-700">
                <ThumbsDown className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Análise Completa (Expansível) */}
      {complianceScore.analise_completa_ia && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setExpandedAnalysis(!expandedAnalysis)}
            className="w-full flex items-center justify-between p-5 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Brain className="w-5 h-5 text-[var(--pagsmile-green)]" />
              <h4 className="font-bold text-[var(--pagsmile-blue)]">Análise Completa da IA</h4>
            </div>
            {expandedAnalysis ? (
              <ChevronUp className="w-5 h-5 text-[var(--pagsmile-blue)]/50" />
            ) : (
              <ChevronDown className="w-5 h-5 text-[var(--pagsmile-blue)]/50" />
            )}
          </button>
          
          {expandedAnalysis && (
            <div className="px-5 pb-5 border-t border-slate-100">
              <div className="mt-4 prose prose-sm max-w-none text-[var(--pagsmile-blue)]/80">
                <div className="whitespace-pre-wrap bg-slate-50 p-4 rounded-lg text-sm leading-relaxed">
                  {complianceScore.analise_completa_ia}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Parecer Final */}
      {complianceScore.parecer_final && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Eye className="w-5 h-5 text-[var(--pagsmile-blue)]" />
            <h4 className="font-bold text-[var(--pagsmile-blue)]">Parecer Final</h4>
          </div>
          <p className="text-[var(--pagsmile-blue)]/80 whitespace-pre-wrap">{complianceScore.parecer_final}</p>
        </div>
      )}

      {/* Condições de Aprovação */}
      {complianceScore.condicoes_aprovacao && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <AlertDescription>
            <p className="font-bold text-yellow-800 mb-1">Condições para Aprovação</p>
            <p className="text-yellow-700">{complianceScore.condicoes_aprovacao}</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Findings */}
      {complianceScore.total_findings > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h4 className="font-bold text-[var(--pagsmile-blue)] mb-3">
            Findings Identificados ({complianceScore.total_findings})
          </h4>
          {complianceScore.findings_por_severidade && (
            <div className="flex gap-3 flex-wrap">
              {Object.entries(complianceScore.findings_por_severidade).map(([severity, count]) => (
                <Badge 
                  key={severity}
                  className={
                    severity === 'CRITICAL' || severity === 'BLOQUEANTE' ? 'bg-red-100 text-red-800' :
                    severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                    severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    severity === 'LOW' ? 'bg-blue-100 text-blue-800' :
                    'bg-slate-100 text-slate-800'
                  }
                >
                  {severity}: {count}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Metadados */}
      <div className="flex flex-wrap gap-4 text-xs text-[var(--pagsmile-blue)]/60">
        {complianceScore.versao_agente && (
          <span>Versão do Agente: {complianceScore.versao_agente}</span>
        )}
        {complianceScore.data_analise_fase_3 && (
          <span>Análise em: {new Date(complianceScore.data_analise_fase_3).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
          })}</span>
        )}
      </div>
    </div>
  );
}