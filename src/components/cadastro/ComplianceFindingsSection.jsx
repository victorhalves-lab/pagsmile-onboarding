import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, AlertTriangle, XCircle, Info, ShieldAlert, CheckCircle2, Shield, ArrowRight, Clock, Database, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SEVERITY_CONFIG = {
  BLOQUEANTE: { 
    color: 'bg-black text-white', 
    borderColor: 'border-black', 
    bgLight: 'bg-red-950/5',
    icon: XCircle, 
    label: 'Bloqueante', 
    textColor: 'text-black',
    meaning: 'Impede qualquer aprovação — o caso NÃO pode ser aprovado enquanto este finding existir.',
  },
  CRITICAL: { 
    color: 'bg-red-100 text-red-700', 
    borderColor: 'border-red-300', 
    bgLight: 'bg-red-50',
    icon: XCircle, 
    label: 'Crítico', 
    textColor: 'text-red-700',
    meaning: 'Risco muito alto — normalmente leva a recusa ou exige ação corretiva imediata antes de qualquer aprovação.',
  },
  HIGH: { 
    color: 'bg-orange-100 text-orange-700', 
    borderColor: 'border-orange-300', 
    bgLight: 'bg-orange-50',
    icon: ShieldAlert, 
    label: 'Alto', 
    textColor: 'text-orange-700',
    meaning: 'Risco relevante — exige análise manual aprofundada e pode resultar em condições adicionais.',
  },
  MEDIUM: { 
    color: 'bg-amber-100 text-amber-700', 
    borderColor: 'border-amber-300', 
    bgLight: 'bg-amber-50',
    icon: AlertTriangle, 
    label: 'Médio', 
    textColor: 'text-amber-700',
    meaning: 'Ponto de atenção — deve ser considerado na análise, mas não impede aprovação isoladamente.',
  },
  LOW: { 
    color: 'bg-blue-100 text-blue-700', 
    borderColor: 'border-blue-200', 
    bgLight: 'bg-blue-50/50',
    icon: Info, 
    label: 'Baixo', 
    textColor: 'text-blue-700',
    meaning: 'Observação menor — registrada para transparência, sem impacto significativo na decisão.',
  },
  INFO: { 
    color: 'bg-gray-100 text-gray-600', 
    borderColor: 'border-gray-200', 
    bgLight: 'bg-gray-50/50',
    icon: Info, 
    label: 'Informativo', 
    textColor: 'text-gray-600',
    meaning: 'Apenas para registro e documentação — sem impacto na decisão.',
  },
};

const FONTE_LABELS = {
  'BigDataCorp': 'Dados objetivos de bureau (Receita Federal, Juntas, Tribunais, Serasa, CEIS/CNEP)',
  'CAF': 'Verificação de identidade e antifraude (prova de vida, documentos, biometria)',
  'SENTINEL': 'Análise qualitativa por inteligência artificial',
  'Questionário': 'Respostas do merchant no questionário de compliance',
};

function FindingCard({ finding }) {
  const [expanded, setExpanded] = useState(false);
  const config = SEVERITY_CONFIG[finding.severidade] || SEVERITY_CONFIG.INFO;
  const Icon = config.icon;
  const hasDetails = finding.evidencia || finding.recomendacao || finding.secao_questionario;

  return (
    <div className={`rounded-xl border ${config.borderColor} overflow-hidden ${config.bgLight}`}>
      {/* Main content — always visible */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-1.5 rounded-lg ${config.color} flex-shrink-0 mt-0.5`}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              <span className="text-sm font-bold text-[var(--pinbank-blue)]">{finding.titulo}</span>
              <Badge className={`${config.color} text-[10px] border-0`}>{config.label}</Badge>
              {finding.deducao_pontos != null && finding.deducao_pontos > 0 && (
                <Badge className="bg-red-100 text-red-700 text-[10px] border-0 font-bold">-{finding.deducao_pontos} pts no score</Badge>
              )}
            </div>

            {/* Description — ALWAYS visible, not truncated */}
            {finding.descricao && (
              <p className="text-xs text-[var(--pinbank-blue)]/70 leading-relaxed mb-2">{finding.descricao}</p>
            )}

            {/* Why this severity */}
            <div className="flex items-start gap-1.5 mb-2">
              <ArrowRight className={`w-3 h-3 flex-shrink-0 mt-0.5 ${config.textColor}`} />
              <p className={`text-[11px] ${config.textColor} font-medium leading-relaxed`}>
                {config.meaning}
              </p>
            </div>

            {/* Source and phase — always visible */}
            <div className="flex flex-wrap gap-2 items-center">
              {finding.fonte_externa && (
                <div className="flex items-center gap-1 text-[10px] text-[var(--pinbank-blue)]/50">
                  <Database className="w-3 h-3" />
                  <span className="font-semibold">{finding.fonte_externa}</span>
                  {FONTE_LABELS[finding.fonte_externa] && (
                    <span>— {FONTE_LABELS[finding.fonte_externa]}</span>
                  )}
                </div>
              )}
              {finding.fase && (
                <div className="flex items-center gap-1 text-[10px] text-[var(--pinbank-blue)]/40">
                  <Shield className="w-3 h-3" />
                  Detectado na Fase {finding.fase}
                </div>
              )}
              {finding.data_identificacao && (
                <div className="flex items-center gap-1 text-[10px] text-[var(--pinbank-blue)]/40">
                  <Clock className="w-3 h-3" />
                  {new Date(finding.data_identificacao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
              {finding.override_gerado && (
                <Badge className="bg-purple-100 text-purple-700 text-[9px] border-0">Override de decisão gerado</Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expandable details — Evidence + Recommendation */}
      {hasDetails && (
        <>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-[10px] font-semibold border-t border-dashed text-[var(--pinbank-blue)]/40 hover:text-[var(--pinbank-blue)]/70 hover:bg-white/50 transition-colors"
            style={{ borderColor: 'inherit' }}
          >
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {expanded ? 'Ocultar detalhes' : 'Ver evidência e recomendação'}
          </button>

          {expanded && (
            <div className="px-4 pb-4 space-y-3">
              {finding.secao_questionario && (
                <div className="flex items-start gap-2 p-3 bg-white/80 rounded-lg border border-slate-200">
                  <FileText className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-[var(--pinbank-blue)]/40" />
                  <div>
                    <p className="text-[10px] font-bold text-[var(--pinbank-blue)]/50 uppercase tracking-wide mb-0.5">Seção do Questionário</p>
                    <p className="text-xs text-[var(--pinbank-blue)]/70">{finding.secao_questionario}</p>
                  </div>
                </div>
              )}

              {finding.evidencia && (
                <div className="p-3 bg-white/80 rounded-lg border border-slate-200">
                  <p className="text-[10px] font-bold text-[var(--pinbank-blue)]/50 uppercase tracking-wide mb-1.5">📋 Evidência — O que foi encontrado</p>
                  <p className="text-xs text-[var(--pinbank-blue)]/80 whitespace-pre-wrap leading-relaxed">{finding.evidencia}</p>
                </div>
              )}

              {finding.recomendacao && (
                <div className="p-3 bg-blue-50/80 rounded-lg border border-blue-200">
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide mb-1.5">💡 Ação Recomendada</p>
                  <p className="text-xs text-blue-700/80 whitespace-pre-wrap leading-relaxed">{finding.recomendacao}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ComplianceFindingsSection({ findings, findingsBySeverity }) {
  const [filter, setFilter] = useState('all');

  if (!findings.length) return null;

  const filtered = filter === 'all' ? findings : findings.filter(f => f.severidade === filter);
  const totalDeductions = findings.reduce((sum, f) => sum + (f.deducao_pontos || 0), 0);

  const blockers = findings.filter(f => f.severidade === 'BLOQUEANTE' || f.severidade === 'CRITICAL');
  const warnings = findings.filter(f => f.severidade === 'HIGH' || f.severidade === 'MEDIUM');

  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-rose-50/40 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-100">
              <Search className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--pinbank-blue)]">Findings — Achados da Análise ({findings.length})</h3>
              <p className="text-xs text-[var(--pinbank-blue)]/40">Cada finding é um ponto específico identificado durante a análise de risco, com sua evidência e impacto</p>
            </div>
          </div>
          {totalDeductions > 0 && (
            <Badge className="bg-red-100 text-red-700 text-xs border-0 font-bold">
              Total: -{totalDeductions} pts
            </Badge>
          )}
        </div>
      </div>

      <div className="p-5">
        {/* Explainer — What are findings */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 mb-5">
          <h4 className="text-xs font-bold text-[var(--pinbank-blue)] mb-2">O que são Findings?</h4>
          <p className="text-[11px] text-[var(--pinbank-blue)]/60 leading-relaxed mb-3">
            Findings são <strong>achados específicos</strong> detectados durante a análise de compliance. Cada um representa algo que o sistema encontrou ao verificar os dados do merchant — seja nos dados de bureau (BDC), na verificação de identidade (CAF), ou no questionário preenchido. Eles afetam diretamente o score de risco.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {blockers.length > 0 && (
              <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-center">
                <p className="text-lg font-black text-red-700">{blockers.length}</p>
                <p className="text-[10px] text-red-600 font-medium">Críticos / Bloqueantes</p>
                <p className="text-[9px] text-red-500">Impedem ou dificultam aprovação</p>
              </div>
            )}
            {warnings.length > 0 && (
              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-center">
                <p className="text-lg font-black text-amber-700">{warnings.length}</p>
                <p className="text-[10px] text-amber-600 font-medium">Atenção</p>
                <p className="text-[9px] text-amber-500">Requerem análise manual</p>
              </div>
            )}
            <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-center">
              <p className="text-lg font-black text-blue-700">{findings.length - blockers.length - warnings.length}</p>
              <p className="text-[10px] text-blue-600 font-medium">Baixos / Info</p>
              <p className="text-[9px] text-blue-500">Observações e registros</p>
            </div>
          </div>
        </div>

        {/* Severity filter */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setFilter('all')}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium ${filter === 'all' ? 'bg-[var(--pinbank-blue)] text-white border-[var(--pinbank-blue)]' : 'bg-white text-[var(--pinbank-blue)]/60 border-gray-200 hover:bg-gray-50'}`}
          >
            Todos ({findings.length})
          </button>
          {Object.entries(SEVERITY_CONFIG).map(([key, cfg]) => {
            const count = findingsBySeverity[key] || 0;
            if (count === 0) return null;
            return (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium ${filter === key ? `${cfg.color} ${cfg.borderColor}` : `bg-white ${cfg.textColor} ${cfg.borderColor} hover:opacity-80`}`}
              >
                {cfg.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Findings list */}
        <div className="space-y-3 max-h-[800px] overflow-y-auto">
          {filtered.map(f => <FindingCard key={f.id} finding={f} />)}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-8">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-400" />
            <p className="text-sm text-[var(--pinbank-blue)]/40">Nenhum finding nesta categoria</p>
          </div>
        )}
      </div>
    </div>
  );
}