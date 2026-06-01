import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RefreshCw, MessageSquare, AlertTriangle, ListChecks, Clock, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, ThumbsUp, ThumbsDown, Bot
} from 'lucide-react';

/**
 * Bloco que cobre lacunas de monitoramento/feedback que NÃO apareciam no Cadastro:
 *  - BdcRetryQueue (re-tentativas de enriquecimento BDC falhas)
 *  - SentinelFeedback (feedback do analista sobre análise do agente)
 *  - ComplianceFinding (findings dimensionais detectados pelo SENTINEL)
 *  - RevalidationSchedule (próximas revalidações agendadas)
 */

function Section({ icon: Icon, title, count, color = 'green', children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const colorMap = {
    green: 'text-[var(--pagsmile-green)]',
    amber: 'text-amber-600',
    rose: 'text-rose-600',
    blue: 'text-blue-600',
  };
  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 px-5 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${colorMap[color]}`} />
          <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)]">{title}</h3>
          {count != null && (
            <Badge className="bg-slate-100 text-[var(--pagsmile-blue)] text-[10px]">{count}</Badge>
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[var(--pagsmile-blue)]/40" /> : <ChevronDown className="w-4 h-4 text-[var(--pagsmile-blue)]/40" />}
      </button>
      {open && <div className="px-5 pb-5 pt-1">{children}</div>}
    </div>
  );
}

const RETRY_STATUS_COLOR = {
  pending: 'bg-amber-100 text-amber-700',
  retrying: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
  success: 'bg-green-100 text-green-700',
  abandoned: 'bg-slate-100 text-slate-600',
};

const SEVERITY_COLOR = {
  CRITICAL: 'bg-red-100 text-red-700',
  HIGH: 'bg-orange-100 text-orange-700',
  MEDIUM: 'bg-amber-100 text-amber-700',
  LOW: 'bg-blue-100 text-blue-700',
  INFO: 'bg-slate-100 text-slate-600',
};

export default function CadastroMonitoringExtendedBlock({ allCaseIds = [], merchantId, merchantDoc }) {
  const cleanDoc = (merchantDoc || '').replace(/\D/g, '');

  // BdcRetryQueue
  const { data: retryQueue = [], isLoading: loadingRetry } = useQuery({
    queryKey: ['cadastro-bdc-retry', allCaseIds],
    queryFn: async () => {
      if (!allCaseIds.length) return [];
      const results = await Promise.all(allCaseIds.map(id => base44.entities.BdcRetryQueue.filter({ onboardingCaseId: id })));
      return results.flat();
    },
    enabled: allCaseIds.length > 0,
  });

  // SentinelFeedback
  const { data: feedbacks = [], isLoading: loadingFeedback } = useQuery({
    queryKey: ['cadastro-sentinel-feedback', allCaseIds],
    queryFn: async () => {
      if (!allCaseIds.length) return [];
      const results = await Promise.all(allCaseIds.map(id => base44.entities.SentinelFeedback.filter({ onboarding_case_id: id })));
      return results.flat().sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: allCaseIds.length > 0,
  });

  // ComplianceFinding
  const { data: findings = [], isLoading: loadingFindings } = useQuery({
    queryKey: ['cadastro-compliance-findings', allCaseIds],
    queryFn: async () => {
      if (!allCaseIds.length) return [];
      const results = await Promise.all(allCaseIds.map(id => base44.entities.ComplianceFinding.filter({ onboarding_case_id: id })));
      return results.flat();
    },
    enabled: allCaseIds.length > 0,
  });

  // RevalidationSchedule
  const { data: revalSchedules = [], isLoading: loadingReval } = useQuery({
    queryKey: ['cadastro-reval-schedule', merchantId, cleanDoc],
    queryFn: async () => {
      const queries = [];
      if (merchantId) queries.push(base44.entities.RevalidationSchedule.filter({ merchantId }));
      if (cleanDoc) queries.push(base44.entities.RevalidationSchedule.filter({ cpfCnpj: cleanDoc }));
      const results = await Promise.all(queries);
      const map = new Map();
      results.flat().forEach(r => map.set(r.id, r));
      return Array.from(map.values()).sort((a, b) => new Date(a.scheduledFor || 0) - new Date(b.scheduledFor || 0));
    },
    enabled: !!merchantId || !!cleanDoc,
  });

  const findingsBySeverity = useMemo(() => {
    const counts = {};
    findings.forEach(f => { counts[f.severity] = (counts[f.severity] || 0) + 1; });
    return counts;
  }, [findings]);

  const loading = loadingRetry || loadingFeedback || loadingFindings || loadingReval;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const hasAnything = retryQueue.length || feedbacks.length || findings.length || revalSchedules.length;
  if (!hasAnything) return null;

  return (
    <div className="space-y-3">
      {/* RevalidationSchedule — próximas revalidações */}
      {revalSchedules.length > 0 && (
        <Section icon={Clock} title="Revalidações Agendadas" count={revalSchedules.length} color="blue">
          <div className="space-y-2">
            {revalSchedules.slice(0, 10).map(r => {
              const due = r.scheduledFor ? new Date(r.scheduledFor) : null;
              const isPast = due && due < new Date();
              return (
                <div key={r.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Badge variant="outline" className="text-[10px]">{r.revalidationType || r.type || 'revalidação'}</Badge>
                    {r.status && <Badge className={`text-[10px] ${r.status === 'completed' ? 'bg-green-100 text-green-700' : r.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100'}`}>{r.status}</Badge>}
                    {r.reason && <span className="text-[var(--pagsmile-blue)]/60 truncate">{r.reason}</span>}
                  </div>
                  <span className={`text-[10px] flex-shrink-0 ${isPast ? 'text-red-600 font-semibold' : 'text-[var(--pagsmile-blue)]/50'}`}>
                    {due ? due.toLocaleDateString('pt-BR') : '—'}
                    {isPast && ' (vencida)'}
                  </span>
                </div>
              );
            })}
            {revalSchedules.length > 10 && (
              <p className="text-[10px] text-[var(--pagsmile-blue)]/40 text-center pt-1">+ {revalSchedules.length - 10} agendamentos</p>
            )}
          </div>
        </Section>
      )}

      {/* BdcRetryQueue — re-tentativas */}
      {retryQueue.length > 0 && (
        <Section icon={RefreshCw} title="Fila de Re-tentativas BDC" count={retryQueue.length} color="amber">
          <div className="space-y-2">
            {retryQueue.map(r => (
              <div key={r.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-xs">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge className={`text-[10px] ${RETRY_STATUS_COLOR[r.status] || 'bg-slate-100'}`}>{r.status || 'pending'}</Badge>
                  {r.dataset && <span className="font-mono text-[10px] text-[var(--pagsmile-blue)]/60">{r.dataset}</span>}
                  {r.attemptCount != null && <span className="text-[var(--pagsmile-blue)]/50">tentativa #{r.attemptCount}</span>}
                  {r.errorMessage && <span className="text-red-600 truncate">{r.errorMessage}</span>}
                </div>
                <span className="text-[10px] text-[var(--pagsmile-blue)]/40 flex-shrink-0">
                  {r.nextRetryAt ? `próxima: ${new Date(r.nextRetryAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}` : new Date(r.created_date).toLocaleDateString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* ComplianceFinding — findings dimensionais */}
      {findings.length > 0 && (
        <Section icon={ListChecks} title="Findings de Compliance (SENTINEL)" count={findings.length} color="rose">
          {/* Resumo por severidade */}
          <div className="flex flex-wrap gap-2 mb-3">
            {Object.entries(findingsBySeverity).map(([sev, n]) => (
              <Badge key={sev} className={`text-[10px] ${SEVERITY_COLOR[sev] || 'bg-slate-100'}`}>
                {sev}: {n}
              </Badge>
            ))}
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {findings.slice(0, 30).map(f => (
              <div key={f.id} className="border border-slate-200 rounded-lg p-3 text-xs">
                <div className="flex items-start gap-2 flex-wrap mb-1">
                  <Badge className={`text-[10px] ${SEVERITY_COLOR[f.severity] || 'bg-slate-100'}`}>{f.severity || 'INFO'}</Badge>
                  {f.dimension && <Badge variant="outline" className="text-[10px]">{f.dimension}</Badge>}
                  {f.source && <Badge variant="outline" className="text-[10px] opacity-70">{f.source}</Badge>}
                  {f.code && <span className="font-mono text-[10px] text-[var(--pagsmile-blue)]/50">{f.code}</span>}
                </div>
                <p className="text-sm text-[var(--pagsmile-blue)] font-semibold">{f.title || f.summary || '—'}</p>
                {f.description && <p className="text-xs text-[var(--pagsmile-blue)]/70 mt-1">{f.description}</p>}
                {f.suggestedAction && (
                  <p className="text-[11px] text-blue-700 mt-1 italic">↳ Ação sugerida: {f.suggestedAction}</p>
                )}
              </div>
            ))}
            {findings.length > 30 && (
              <p className="text-[10px] text-[var(--pagsmile-blue)]/40 text-center pt-2">+ {findings.length - 30} findings adicionais</p>
            )}
          </div>
        </Section>
      )}

      {/* SentinelFeedback — feedback do analista */}
      {feedbacks.length > 0 && (
        <Section icon={Bot} title="Feedback do Analista ao SENTINEL" count={feedbacks.length} color="green">
          <div className="space-y-2">
            {feedbacks.map(fb => {
              const isPositive = fb.feedbackType === 'positive' || fb.agreed === true;
              const isNegative = fb.feedbackType === 'negative' || fb.agreed === false;
              const Icon = isPositive ? ThumbsUp : isNegative ? ThumbsDown : MessageSquare;
              const color = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-blue-600';
              return (
                <div key={fb.id} className="border border-slate-200 rounded-lg p-3 text-xs">
                  <div className="flex items-start gap-2 mb-1">
                    <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[var(--pagsmile-blue)]">{fb.analystEmail || fb.created_by_id || 'Analista'}</span>
                        {fb.category && <Badge variant="outline" className="text-[10px]">{fb.category}</Badge>}
                        {fb.feedbackType && <Badge className={`text-[10px] ${isPositive ? 'bg-green-100 text-green-700' : isNegative ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{fb.feedbackType}</Badge>}
                      </div>
                      {fb.comment && <p className="text-xs text-[var(--pagsmile-blue)]/80 mt-1">{fb.comment}</p>}
                      <p className="text-[10px] text-[var(--pagsmile-blue)]/40 mt-1">
                        {new Date(fb.created_date).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}