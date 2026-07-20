import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Activity, AlertTriangle, AlertCircle, Info, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const SEVERITY_CONFIG = {
  CRITICAL: { color: 'bg-red-50 text-red-700 border-red-200', icon: ShieldAlert, label: 'CRÍTICO' },
  HIGH: { color: 'bg-orange-50 text-orange-700 border-orange-200', icon: AlertTriangle, label: 'ALTO' },
  MEDIUM: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertCircle, label: 'MÉDIO' },
  LOW: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Info, label: 'BAIXO' },
  INFO: { color: 'bg-slate-50 text-slate-600 border-slate-200', icon: Info, label: 'INFO' },
};

const EVENT_TYPE_LABELS = {
  new_sanction: 'Nova sanção',
  new_pep: 'Novo PEP',
  new_lawsuit: 'Novo processo',
  new_criminal_lawsuit: 'Novo processo criminal',
  qsa_change: 'Mudança no QSA',
  capital_change: 'Mudança de capital',
  address_change: 'Mudança de endereço',
  scr_change: 'Mudança no SCR',
  tax_status_change: 'Mudança de situação fiscal',
  owner_death: 'Falecimento de sócio',
  new_government_debt: 'Nova dívida governo',
  media_adverse: 'Mídia adversa',
  license_revoked: 'Licença revogada',
  other: 'Outro',
};

const PROCESSED_STATUS_LABELS = {
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
  processed: { label: 'Processado', color: 'bg-green-100 text-green-700' },
  ignored: { label: 'Ignorado', color: 'bg-slate-100 text-slate-600' },
  error: { label: 'Erro', color: 'bg-red-100 text-red-700' },
};

export default function CadastroMonitoringEventsBlock({ document, onboardingCaseId, merchantId }) {
  const cleanDoc = (document || '').replace(/\D/g, '');

  // Busca eventos pelo documento (mais confiável) + fallback por caseId/merchantId
  const { data: eventsByDoc = [], isLoading } = useQuery({
    queryKey: ['bdc-monitoring-by-doc', cleanDoc],
    queryFn: () => base44.entities.BdcMonitoringEvent.filter({ document: cleanDoc }, '-receivedAt', 50),
    enabled: !!cleanDoc,
  });

  const { data: eventsByCase = [] } = useQuery({
    queryKey: ['bdc-monitoring-by-case', onboardingCaseId],
    queryFn: () => base44.entities.BdcMonitoringEvent.filter({ onboardingCaseId }, '-receivedAt', 50),
    enabled: !!onboardingCaseId,
  });

  // Dedupe por id
  const events = React.useMemo(() => {
    const map = new Map();
    [...eventsByDoc, ...eventsByCase].forEach(e => map.set(e.id, e));
    return Array.from(map.values()).sort((a, b) => new Date(b.receivedAt || b.created_date) - new Date(a.receivedAt || a.created_date));
  }, [eventsByDoc, eventsByCase]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[var(--pinbank-blue)]" />
          <h3 className="text-base font-semibold text-[var(--pinbank-blue)]">Monitoramento Contínuo BDC</h3>
          <Badge variant="outline" className="text-[10px] border-[var(--pinbank-blue)]/30 text-[var(--pinbank-blue)]">Circ. BCB 3.978 Art. 16</Badge>
        </div>
        <Badge className="bg-slate-100 text-slate-700 text-xs">{events.length} evento(s)</Badge>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8 text-sm text-[var(--pinbank-blue)]/50">
          <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-[var(--pinbank-blue)]/40" />
          Nenhum evento de monitoramento recebido para este documento.
          <p className="text-xs mt-1 opacity-70">Eventos chegam via webhook BDC quando há mudança em sanções, QSA, SCR, processos, etc.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map(event => {
            const sev = SEVERITY_CONFIG[event.severity] || SEVERITY_CONFIG.INFO;
            const SevIcon = sev.icon;
            const statusInfo = PROCESSED_STATUS_LABELS[event.processedStatus] || PROCESSED_STATUS_LABELS.pending;
            return (
              <div key={event.id} className={`border rounded-lg p-3 ${sev.color}`}>
                <div className="flex items-start gap-3">
                  <SevIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">{sev.label}</span>
                      <span className="text-xs opacity-70">·</span>
                      <span className="text-xs font-medium">{EVENT_TYPE_LABELS[event.eventType] || event.eventType}</span>
                      <Badge className={`${statusInfo.color} text-[10px]`}>{statusInfo.label}</Badge>
                      {event.datasetSource && (
                        <Badge variant="outline" className="text-[10px] opacity-70">{event.datasetSource}</Badge>
                      )}
                    </div>
                    <p className="text-sm">{event.summary || '—'}</p>
                    {Array.isArray(event.downstreamActions) && event.downstreamActions.length > 0 && (
                      <p className="text-[11px] mt-1 opacity-70">
                        Ações: {event.downstreamActions.join(', ')}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-[10px] opacity-60">
                      <span>Recebido: {new Date(event.receivedAt || event.created_date).toLocaleString('pt-BR')}</span>
                      {event.occurredAt && <span>Ocorrido: {new Date(event.occurredAt).toLocaleString('pt-BR')}</span>}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}