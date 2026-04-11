import React, { useState } from 'react';
import { ChevronDown, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ComplianceVariablesDetail({ score }) {
  const [expanded, setExpanded] = useState(false);
  const hasVars = score.variaveis_positivas?.length > 0 || score.variaveis_negativas?.length > 0 || (score.variaveis_aplicadas && Object.keys(score.variaveis_aplicadas).length > 0);
  
  if (!hasVars) return null;

  const appliedVars = score.variaveis_aplicadas || {};
  const varKeys = Object.keys(appliedVars).sort();
  const activeVars = varKeys.filter(k => appliedVars[k]?.ativa);
  const positiveVars = varKeys.filter(k => appliedVars[k]?.ativa && (appliedVars[k]?.pontos || 0) < 0);
  const negativeVars = varKeys.filter(k => appliedVars[k]?.ativa && (appliedVars[k]?.pontos || 0) > 0);
  const neutralVars = varKeys.filter(k => appliedVars[k]?.ativa && (appliedVars[k]?.pontos || 0) === 0);

  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-5">
      <button 
        onClick={() => setExpanded(!expanded)} 
        className="w-full flex items-center justify-between text-sm font-semibold text-[var(--pagsmile-blue)]"
      >
        <span className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[var(--pagsmile-green)]" />
          Variáveis de Risco Detalhadas
          {varKeys.length > 0 && (
            <Badge variant="outline" className="text-[10px] ml-1">{activeVars.length} ativas de {varKeys.length}</Badge>
          )}
        </span>
        {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {/* Summary always visible */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        {score.variaveis_positivas?.length > 0 && (
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs font-semibold text-green-700 mb-1.5 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> Redutoras ({score.variaveis_positivas.length})
            </p>
            <ul className="space-y-1">
              {score.variaveis_positivas.map((v, i) => (
                <li key={i} className="text-[11px] text-green-700/80 flex items-start gap-1.5">
                  <span className="text-green-500 flex-shrink-0">↓</span>
                  {v}
                </li>
              ))}
            </ul>
          </div>
        )}
        {score.variaveis_negativas?.length > 0 && (
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-xs font-semibold text-red-700 mb-1.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Penalizadoras ({score.variaveis_negativas.length})
            </p>
            <ul className="space-y-1">
              {score.variaveis_negativas.map((v, i) => (
                <li key={i} className="text-[11px] text-red-700/80 flex items-start gap-1.5">
                  <span className="text-red-500 flex-shrink-0">↑</span>
                  {v}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Detailed view */}
      {expanded && varKeys.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-xs text-[var(--pagsmile-blue)]/50 mb-3">Detalhamento completo de todas as variáveis avaliadas (V01-V60):</p>
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {varKeys.map(key => {
              const v = appliedVars[key];
              const pts = v?.pontos ?? 0;
              const isActive = v?.ativa;
              const isPositive = pts < 0;
              const isNeutral = pts === 0;
              return (
                <div key={key} className={`flex items-center gap-3 p-2 rounded-lg text-xs ${!isActive ? 'bg-gray-50 opacity-50' : isPositive ? 'bg-green-50' : isNeutral ? 'bg-gray-50' : 'bg-red-50'}`}>
                  <div className="w-12 flex-shrink-0">
                    <span className="font-mono font-bold text-[var(--pagsmile-blue)]">{key}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[var(--pagsmile-blue)]/70 truncate block">{v?.desc || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isActive ? (
                      <Badge className={`text-[10px] ${isPositive ? 'bg-green-100 text-green-700' : isNeutral ? 'bg-gray-100 text-gray-600' : 'bg-red-100 text-red-700'}`}>
                        {isPositive ? '' : '+'}{pts}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-gray-400">inativa</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}