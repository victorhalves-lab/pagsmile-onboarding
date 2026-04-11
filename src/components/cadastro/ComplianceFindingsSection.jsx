import React, { useState } from 'react';
import { Search, ChevronDown, ChevronRight, AlertTriangle, XCircle, Info, ShieldAlert, FileWarning } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SEVERITY_CONFIG = {
  BLOQUEANTE: { color: 'bg-black text-white', borderColor: 'border-black', icon: XCircle, label: 'Bloqueante', textColor: 'text-black' },
  CRITICAL: { color: 'bg-red-100 text-red-700', borderColor: 'border-red-300', icon: XCircle, label: 'Crítico', textColor: 'text-red-700' },
  HIGH: { color: 'bg-orange-100 text-orange-700', borderColor: 'border-orange-300', icon: ShieldAlert, label: 'Alto', textColor: 'text-orange-700' },
  MEDIUM: { color: 'bg-amber-100 text-amber-700', borderColor: 'border-amber-300', icon: AlertTriangle, label: 'Médio', textColor: 'text-amber-700' },
  LOW: { color: 'bg-blue-100 text-blue-700', borderColor: 'border-blue-200', icon: Info, label: 'Baixo', textColor: 'text-blue-700' },
  INFO: { color: 'bg-gray-100 text-gray-600', borderColor: 'border-gray-200', icon: Info, label: 'Info', textColor: 'text-gray-600' },
};

function FindingCard({ finding }) {
  const [expanded, setExpanded] = useState(false);
  const config = SEVERITY_CONFIG[finding.severidade] || SEVERITY_CONFIG.INFO;
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border ${config.borderColor} overflow-hidden`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-3 text-left hover:bg-gray-50 transition-colors"
      >
        <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${config.textColor}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-[var(--pagsmile-blue)]">{finding.titulo}</span>
            <Badge className={`${config.color} text-[10px]`}>{config.label}</Badge>
            {finding.deducao_pontos != null && finding.deducao_pontos > 0 && (
              <span className="text-[10px] font-bold text-red-600">-{finding.deducao_pontos} pts</span>
            )}
            {finding.fase && <Badge variant="outline" className="text-[9px]">Fase {finding.fase}</Badge>}
            {finding.fonte_externa && <Badge variant="outline" className="text-[9px]">{finding.fonte_externa}</Badge>}
          </div>
          {finding.descricao && (
            <p className="text-[11px] text-[var(--pagsmile-blue)]/60 mt-1 line-clamp-2">{finding.descricao}</p>
          )}
        </div>
        {(finding.evidencia || finding.recomendacao) && (
          expanded ? <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        )}
      </button>
      
      {expanded && (finding.evidencia || finding.recomendacao || finding.secao_questionario) && (
        <div className="px-3 pb-3 ml-7 space-y-2">
          {finding.secao_questionario && (
            <div>
              <p className="text-[10px] font-semibold text-[var(--pagsmile-blue)]/50 uppercase tracking-wide">Seção do Questionário</p>
              <p className="text-xs text-[var(--pagsmile-blue)]/70">{finding.secao_questionario}</p>
            </div>
          )}
          {finding.evidencia && (
            <div className="p-2 bg-gray-50 rounded-lg">
              <p className="text-[10px] font-semibold text-[var(--pagsmile-blue)]/50 uppercase tracking-wide mb-1">Evidência</p>
              <p className="text-xs text-[var(--pagsmile-blue)]/70 whitespace-pre-wrap">{finding.evidencia}</p>
            </div>
          )}
          {finding.recomendacao && (
            <div className="p-2 bg-blue-50 rounded-lg">
              <p className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-1">Recomendação</p>
              <p className="text-xs text-blue-700/80 whitespace-pre-wrap">{finding.recomendacao}</p>
            </div>
          )}
          {finding.override_gerado && (
            <Badge className="bg-purple-100 text-purple-700 text-[10px]">Override de decisão gerado</Badge>
          )}
          {finding.data_identificacao && (
            <p className="text-[10px] text-[var(--pagsmile-blue)]/40">Identificado em: {new Date(finding.data_identificacao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ComplianceFindingsSection({ findings, findingsBySeverity }) {
  const [filter, setFilter] = useState('all');

  if (!findings.length) return null;

  const filtered = filter === 'all' ? findings : findings.filter(f => f.severidade === filter);
  const totalDeductions = findings.reduce((sum, f) => sum + (f.deducao_pontos || 0), 0);

  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)] flex items-center gap-2">
          <Search className="w-4 h-4 text-[var(--pagsmile-green)]" />
          Findings Identificados ({findings.length})
        </h3>
        {totalDeductions > 0 && (
          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">
            Total deduções: -{totalDeductions} pts
          </span>
        )}
      </div>

      <p className="text-xs text-[var(--pagsmile-blue)]/50 mb-3">
        Findings são achados específicos detectados durante a análise — cada um com evidência, impacto no score e recomendação de ação.
      </p>

      {/* Severity summary */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilter('all')}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${filter === 'all' ? 'bg-[var(--pagsmile-blue)] text-white border-[var(--pagsmile-blue)]' : 'bg-white text-[var(--pagsmile-blue)]/60 border-gray-200 hover:bg-gray-50'}`}
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
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${filter === key ? `${cfg.color} ${cfg.borderColor}` : `bg-white ${cfg.textColor} ${cfg.borderColor} hover:${cfg.color}`}`}
            >
              {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Findings list */}
      <div className="space-y-2 max-h-[600px] overflow-y-auto">
        {filtered.map(f => <FindingCard key={f.id} finding={f} />)}
      </div>
    </div>
  );
}