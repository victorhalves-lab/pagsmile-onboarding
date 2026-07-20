import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, MapPin, Globe, Smartphone, ChevronDown, ChevronUp, Calendar, Hash } from 'lucide-react';

const EVENT_LABELS = {
  compliance_submit:       'Submissão do questionário',
  compliance_case_update:  'Atualização do caso',
  document_upload:         'Upload de documento',
  caf_verify:              'Verificação CAF',
  proposal_action:         'Ação em proposta',
  questionnaire_save:      'Auto-save do questionário',
};

const EVENT_COLORS = {
  compliance_submit:       'bg-blue-100 text-blue-700',
  compliance_case_update:  'bg-purple-100 text-purple-700',
  document_upload:         'bg-emerald-100 text-emerald-700',
  caf_verify:              'bg-violet-100 text-violet-700',
  proposal_action:         'bg-amber-100 text-amber-700',
  questionnaire_save:      'bg-slate-100 text-slate-700',
};

function TrailItem({ trail }) {
  const [expanded, setExpanded] = useState(false);
  const date = new Date(trail.serverTimestamp || trail.created_date);
  const label = EVENT_LABELS[trail.eventType] || trail.eventType;
  const color = EVENT_COLORS[trail.eventType] || 'bg-gray-100 text-gray-700';
  const hasGeo = trail.country || trail.region || trail.city;

  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-start justify-between p-3 text-left hover:bg-slate-50/50 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={`text-[10px] ${color}`}>{label}</Badge>
            {trail.action && <Badge variant="outline" className="text-[10px]">{trail.action}</Badge>}
            {hasGeo && (
              <span className="text-[10px] text-[var(--pinbank-blue)]/50 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {[trail.city, trail.region, trail.country].filter(Boolean).join(', ')}
              </span>
            )}
          </div>
          <p className="text-[10px] text-[var(--pinbank-blue)]/40 mt-1 flex items-center gap-2 flex-wrap">
            <Calendar className="w-3 h-3" />
            {date.toLocaleString('pt-BR')}
            {trail.ipHash && <span className="flex items-center gap-1"><Hash className="w-3 h-3" />IP: {trail.ipHash.slice(0, 12)}…</span>}
          </p>
        </div>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
      </button>
      {expanded && (
        <div className="border-t border-slate-100 p-3 space-y-2 text-xs">
          {trail.userAgent && (
            <div className="flex items-start gap-2 p-2 bg-slate-50 rounded">
              <Smartphone className="w-3.5 h-3.5 text-[var(--pinbank-blue)]/40 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] text-[var(--pinbank-blue)]/50">User Agent</p>
                <p className="text-[11px] text-[var(--pinbank-blue)]/80 break-all">{trail.userAgent}</p>
              </div>
            </div>
          )}
          {trail.timezone && (
            <div className="flex items-center gap-2 p-2 bg-slate-50 rounded">
              <Globe className="w-3.5 h-3.5 text-[var(--pinbank-blue)]/40" />
              <span className="text-[10px] text-[var(--pinbank-blue)]/50">Timezone:</span>
              <span className="text-[11px] text-[var(--pinbank-blue)]/80">{trail.timezone}</span>
            </div>
          )}
          {trail.referer && (
            <div className="p-2 bg-slate-50 rounded">
              <p className="text-[10px] text-[var(--pinbank-blue)]/50 mb-0.5">Referer</p>
              <p className="text-[11px] text-[var(--pinbank-blue)]/80 break-all">{trail.referer}</p>
            </div>
          )}
          {trail.linkCode && (
            <div className="p-2 bg-slate-50 rounded">
              <p className="text-[10px] text-[var(--pinbank-blue)]/50">Link Code: <span className="font-semibold text-[var(--pinbank-blue)]">{trail.linkCode}</span></p>
            </div>
          )}
          {trail.metadata && Object.keys(trail.metadata).length > 0 && (
            <details className="p-2 bg-slate-900 rounded">
              <summary className="text-[10px] text-slate-400 cursor-pointer">Metadata</summary>
              <pre className="text-[10px] text-green-300 mt-2 overflow-auto max-h-[200px] font-mono">
                {JSON.stringify(trail.metadata, null, 2)}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export default function CadastroAuditoriaTab({ merchantId, allCaseIds = [], allProposalIds = [] }) {
  // Buscar AccessTrails por merchantId e por cada caseId
  const { data: byMerchant = [] } = useQuery({
    queryKey: ['cadastro-trails-merchant', merchantId],
    queryFn: () => base44.entities.AccessTrail.filter({ merchantId }),
    enabled: !!merchantId,
  });

  const { data: byCases = [] } = useQuery({
    queryKey: ['cadastro-trails-cases', allCaseIds],
    queryFn: async () => {
      if (!allCaseIds.length) return [];
      const results = await Promise.all(allCaseIds.map(id => base44.entities.AccessTrail.filter({ onboardingCaseId: id })));
      return results.flat();
    },
    enabled: allCaseIds.length > 0,
  });

  const { data: byProposals = [] } = useQuery({
    queryKey: ['cadastro-trails-proposals', allProposalIds],
    queryFn: async () => {
      if (!allProposalIds.length) return [];
      const results = await Promise.all(allProposalIds.map(id => base44.entities.AccessTrail.filter({ proposalId: id })));
      return results.flat();
    },
    enabled: allProposalIds.length > 0,
  });

  // Dedupe & sort
  const trails = useMemo(() => {
    const map = new Map();
    [...byMerchant, ...byCases, ...byProposals].forEach(t => map.set(t.id, t));
    return Array.from(map.values()).sort((a, b) =>
      new Date(b.serverTimestamp || b.created_date) - new Date(a.serverTimestamp || a.created_date)
    );
  }, [byMerchant, byCases, byProposals]);

  if (!trails.length) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-10 text-center mt-4">
        <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-[var(--pinbank-blue)]/20" />
        <p className="text-sm text-[var(--pinbank-blue)]/50">Nenhum registro de auditoria de acesso (LGPD)</p>
      </div>
    );
  }

  // Agrupa por tipo de evento
  const grouped = trails.reduce((acc, t) => {
    acc[t.eventType] = (acc[t.eventType] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-3 mt-4">
      <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-4">
        <p className="text-xs text-[var(--pinbank-blue)]/50 mb-2">Trilha de acessos (IP, geolocalização, user-agent) — auditoria LGPD</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(grouped).map(([k, v]) => (
            <Badge key={k} className={`text-[10px] ${EVENT_COLORS[k] || 'bg-gray-100 text-gray-700'}`}>
              {EVENT_LABELS[k] || k}: {v}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {trails.slice(0, 100).map(t => (
          <TrailItem key={t.id} trail={t} />
        ))}
        {trails.length > 100 && (
          <p className="text-[10px] text-[var(--pinbank-blue)]/40 text-center pt-2">
            Mostrando 100 de {trails.length} registros
          </p>
        )}
      </div>
    </div>
  );
}