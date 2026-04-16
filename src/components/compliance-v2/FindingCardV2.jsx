import React, { useState } from 'react';
import { XCircle, ShieldAlert, AlertTriangle, Info, ChevronDown, ChevronUp, Database, Shield, Clock, FileText, ArrowRight, Lightbulb, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SEVERITY = {
  BLOQUEANTE: { color: 'bg-red-900 text-white', border: 'border-red-900', bg: 'bg-red-50', icon: XCircle, text: 'text-red-900', label: 'Bloqueante', impact: 'Impede qualquer aprovação — caso NÃO pode prosseguir.' },
  CRITICAL: { color: 'bg-red-100 text-red-700', border: 'border-red-300', bg: 'bg-red-50', icon: XCircle, text: 'text-red-700', label: 'Crítico', impact: 'Risco muito alto — exige ação corretiva imediata.' },
  HIGH: { color: 'bg-orange-100 text-orange-700', border: 'border-orange-300', bg: 'bg-orange-50', icon: ShieldAlert, text: 'text-orange-700', label: 'Alto', impact: 'Análise manual aprofundada necessária.' },
  MEDIUM: { color: 'bg-amber-100 text-amber-700', border: 'border-amber-300', bg: 'bg-amber-50', icon: AlertTriangle, text: 'text-amber-700', label: 'Médio', impact: 'Ponto de atenção, não impede aprovação isoladamente.' },
  LOW: { color: 'bg-blue-100 text-blue-700', border: 'border-blue-200', bg: 'bg-blue-50/50', icon: Info, text: 'text-blue-700', label: 'Baixo', impact: 'Observação menor, sem impacto significativo.' },
  INFO: { color: 'bg-gray-100 text-gray-600', border: 'border-gray-200', bg: 'bg-gray-50/50', icon: Info, text: 'text-gray-600', label: 'Info', impact: 'Apenas para registro e documentação.' },
};

const FONTE_EXPLAIN = {
  BigDataCorp: 'Bureau de dados — Receita Federal, Tribunais, Serasa, CEIS/CNEP',
  CAF: 'Verificação de identidade e antifraude — biometria, documentos',
  SENTINEL: 'Análise qualitativa por inteligência artificial',
  Questionário: 'Respostas do merchant no questionário de compliance',
};

export default function FindingCardV2({ finding }) {
  const [open, setOpen] = useState(false);
  const cfg = SEVERITY[finding.severidade] || SEVERITY.INFO;
  const Icon = cfg.icon;
  const hasMore = finding.evidencia || finding.recomendacao || finding.secao_questionario;

  // Parse evidencia into bullet points if it contains separators
  const evidenceBullets = (finding.evidencia || '').split(/[;•\n]/).map(s => s.trim()).filter(Boolean);
  const recomBullets = (finding.recomendacao || '').split(/[;•\n]/).map(s => s.trim()).filter(Boolean);

  return (
    <div className={`rounded-xl border-2 ${cfg.border} overflow-hidden ${cfg.bg}`}>
      <div className="p-5">
        <div className="flex items-start gap-4">
          <div className={`p-2 rounded-xl ${cfg.color} flex-shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            {/* Title + badges */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <h4 className="text-sm font-bold text-[var(--pagsmile-blue)]">{finding.titulo}</h4>
              <Badge className={`${cfg.color} text-[10px] border-0`}>{cfg.label}</Badge>
              {finding.deducao_pontos > 0 && (
                <Badge className="bg-red-100 text-red-700 text-[10px] border-0 font-bold flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />+{finding.deducao_pontos} pts no score
                </Badge>
              )}
            </div>

            {/* Description - formatted */}
            {finding.descricao && (
              <div className="mb-3 text-xs text-[var(--pagsmile-blue)]/75 leading-relaxed">
                {finding.descricao.split(/\.\s+/).filter(Boolean).map((sentence, i) => (
                  <p key={i} className="mb-1">{sentence.endsWith('.') ? sentence : sentence + '.'}</p>
                ))}
              </div>
            )}

            {/* Impact explanation */}
            <div className={`flex items-start gap-2 p-2.5 rounded-lg bg-white/60 border border-white/80 mb-3`}>
              <ArrowRight className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${cfg.text}`} />
              <p className={`text-[11px] ${cfg.text} font-medium leading-relaxed`}>{cfg.impact}</p>
            </div>

            {/* Source badges */}
            <div className="flex flex-wrap gap-2 items-center">
              {finding.fonte_externa && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/70 border border-slate-200 text-[10px]">
                  <Database className="w-3 h-3 text-[var(--pagsmile-blue)]/40" />
                  <span className="font-bold text-[var(--pagsmile-blue)]/70">{finding.fonte_externa}</span>
                  {FONTE_EXPLAIN[finding.fonte_externa] && (
                    <span className="text-[var(--pagsmile-blue)]/40">— {FONTE_EXPLAIN[finding.fonte_externa]}</span>
                  )}
                </div>
              )}
              {finding.fase && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/70 border border-slate-200 text-[10px] text-[var(--pagsmile-blue)]/40">
                  <Shield className="w-3 h-3" /> Fase {finding.fase}
                </div>
              )}
              {finding.data_identificacao && (
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/70 border border-slate-200 text-[10px] text-[var(--pagsmile-blue)]/40">
                  <Clock className="w-3 h-3" />
                  {new Date(finding.data_identificacao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable evidence + recommendation */}
      {hasMore && (
        <>
          <button
            onClick={() => setOpen(!open)}
            className={`w-full flex items-center justify-center gap-2 py-2.5 text-[11px] font-semibold border-t-2 ${cfg.border} ${cfg.text} hover:bg-white/40 transition-colors`}
          >
            {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {open ? 'Ocultar detalhes' : 'Ver evidência, impacto e recomendação'}
          </button>

          {open && (
            <div className="px-5 pb-5 space-y-4">
              {finding.secao_questionario && (
                <div className="flex items-start gap-3 p-3.5 bg-white rounded-xl border border-slate-200">
                  <FileText className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--pagsmile-blue)]/40" />
                  <div>
                    <p className="text-[10px] font-bold text-[var(--pagsmile-blue)]/50 uppercase tracking-wider mb-0.5">Seção do Questionário</p>
                    <p className="text-xs text-[var(--pagsmile-blue)]/70">{finding.secao_questionario}</p>
                  </div>
                </div>
              )}

              {evidenceBullets.length > 0 && (
                <div className="p-4 bg-white rounded-xl border border-slate-200">
                  <p className="text-[10px] font-bold text-[var(--pagsmile-blue)]/60 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" /> Evidência — O Que Foi Encontrado
                  </p>
                  <ul className="space-y-1.5">
                    {evidenceBullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[var(--pagsmile-blue)]/75 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--pagsmile-blue)]/30 flex-shrink-0 mt-1.5" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {recomBullets.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5" /> Ação Recomendada
                  </p>
                  <ul className="space-y-1.5">
                    {recomBullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-blue-700/80 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}