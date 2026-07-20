import React from 'react';
import { ArrowLeftRight, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SEVERITY_CONFIG = {
  INFO: { icon: Info, bg: 'bg-blue-50', text: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  LOW: { icon: Info, bg: 'bg-gray-50', text: 'text-gray-600', badge: 'bg-gray-100 text-gray-700' },
  MEDIUM: { icon: AlertTriangle, bg: 'bg-amber-50', text: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  HIGH: { icon: AlertTriangle, bg: 'bg-orange-50', text: 'text-orange-600', badge: 'bg-orange-100 text-orange-700' },
  CRITICAL: { icon: XCircle, bg: 'bg-red-50', text: 'text-red-600', badge: 'bg-red-100 text-red-700' },
};

export default function ComplianceCrossValidation({ crossValidation }) {
  if (!crossValidation || crossValidation.length === 0) return null;

  const consistent = crossValidation.filter(c => c.consistente).length;
  const inconsistent = crossValidation.filter(c => !c.consistente).length;
  const critical = crossValidation.filter(c => !c.consistente && (c.severidade === 'CRITICAL' || c.severidade === 'HIGH')).length;

  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-[var(--pinbank-blue)] flex items-center gap-2">
          <ArrowLeftRight className="w-4 h-4 text-[var(--pinbank-blue)]" />
          Cross-Validation: Declarado vs Confirmado
        </h3>
        <div className="flex gap-1.5">
          <Badge className="bg-green-100 text-green-700 text-[9px]">
            <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />{consistent} OK
          </Badge>
          {inconsistent > 0 && (
            <Badge className="bg-red-100 text-red-700 text-[9px]">
              <XCircle className="w-2.5 h-2.5 mr-0.5" />{inconsistent} Divergências
            </Badge>
          )}
        </div>
      </div>

      {critical > 0 && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-xs font-semibold text-red-700">⚠️ {critical} divergência(s) crítica(s) detectada(s) entre dados declarados e confirmados</p>
        </div>
      )}

      <div className="space-y-1.5">
        {crossValidation.map((item, i) => {
          const config = SEVERITY_CONFIG[item.severidade] || SEVERITY_CONFIG.INFO;
          const Icon = item.consistente ? CheckCircle2 : config.icon;

          return (
            <div key={i} className={`flex items-start gap-3 p-2.5 rounded-lg ${item.consistente ? 'bg-green-50/50' : config.bg} border ${item.consistente ? 'border-green-100' : 'border-transparent'}`}>
              <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${item.consistente ? 'text-green-500' : config.text}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-[var(--pinbank-blue)]">{item.campo}</span>
                  {!item.consistente && (
                    <Badge className={`text-[9px] ${config.badge}`}>{item.severidade}</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[var(--pinbank-blue)]/40">Declarado: </span>
                    <span className="text-[var(--pinbank-blue)]/70 font-medium">{item.valor_declarado || 'N/D'}</span>
                  </div>
                  <div>
                    <span className="text-[var(--pinbank-blue)]/40">Confirmado: </span>
                    <span className="text-[var(--pinbank-blue)]/70 font-medium">{item.valor_confirmado || 'N/D'}</span>
                  </div>
                </div>
                {item.observacao && (
                  <p className="text-[10px] text-[var(--pinbank-blue)]/50 mt-0.5 italic">{item.observacao}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}