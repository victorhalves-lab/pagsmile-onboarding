import React from 'react';
import { AlertTriangle, Info, ShieldAlert, CheckCircle } from 'lucide-react';

/**
 * Exibe alertas inline baseados em validações cruzadas de compliance.
 * Recebe a lista de alertas computados pelo useComplianceFlags hook.
 * Alertas são informativos (não bloqueiam) — dados são salvos para análise interna.
 */
export default function ComplianceFieldAlerts({ alerts = [] }) {
  if (!alerts || alerts.length === 0) return null;

  const severityConfig = {
    INFO: { icon: Info, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', iconColor: 'text-blue-500' },
    LOW: { icon: Info, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', iconColor: 'text-amber-500' },
    MEDIUM: { icon: AlertTriangle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-800', iconColor: 'text-amber-600' },
    HIGH: { icon: ShieldAlert, bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', iconColor: 'text-orange-600' },
    CRITICAL: { icon: ShieldAlert, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', iconColor: 'text-red-600' },
  };

  return (
    <div className="space-y-1.5 mt-1.5">
      {alerts.map((alert, idx) => {
        const config = severityConfig[alert.severity] || severityConfig.INFO;
        const Icon = config.icon;
        return (
          <div key={idx} className={`flex items-start gap-2 px-3 py-2 rounded-lg border ${config.bg} ${config.border}`}>
            <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${config.iconColor}`} />
            <p className={`text-xs ${config.text}`}>{alert.message}</p>
          </div>
        );
      })}
    </div>
  );
}