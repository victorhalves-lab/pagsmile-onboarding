import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Globe2, FileText, ClipboardList, DollarSign, TrendingUp, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

/**
 * Dashboard do módulo Global — KPIs em USD + listas recentes.
 * Lê GlobalProposal e GlobalQuestionnaire diretamente do SDK.
 */
export default function GlobalDashboard() {
  const { data: proposals = [], isLoading: lp } = useQuery({
    queryKey: ['globalProposals', 'dashboard'],
    queryFn: () => base44.entities.GlobalProposal.list('-created_date', 200),
    initialData: [],
  });
  const { data: questionnaires = [], isLoading: lq } = useQuery({
    queryKey: ['globalQuestionnaires', 'dashboard'],
    queryFn: () => base44.entities.GlobalQuestionnaire.list('-created_date', 200),
    initialData: [],
  });

  // KPIs
  const totalTpv = questionnaires.reduce((s, q) => s + (Number(q.monthly_tpv) || 0), 0);
  const acceptedProposals = proposals.filter(p => p.status === 'accepted');
  const acceptedTpvUsd = acceptedProposals.reduce((s, p) => {
    const q = questionnaires.find(x => x.id === p.questionnaire_id);
    return s + (Number(q?.monthly_tpv) || 0);
  }, 0);
  const estimatedMrr = acceptedProposals.reduce((s, p) => {
    const q = questionnaires.find(x => x.id === p.questionnaire_id);
    const tpv = Number(q?.monthly_tpv) || 0;
    const rate = (Number(p.markup_percentage) || 0) / 100;
    const fixed = (Number(p.fixed_fee_per_transaction) || 0) * (Number(q?.monthly_transactions) || 0);
    return s + tpv * rate + fixed;
  }, 0);
  const winRate = proposals.length > 0
    ? (acceptedProposals.length / proposals.filter(p => ['accepted', 'rejected'].includes(p.status)).length) * 100
    : 0;

  const formatUsd = v => `$${(v || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  const formatPct = v => `${(v || 0).toFixed(1)}%`;

  const KPI = ({ icon: Icon, label, value, hint, accent = 'bg-[#2bc196]/10 text-[#2bc196]' }) => (
    <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#002443]/50">{label}</span>
        <div className={`p-2 rounded-lg ${accent}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="text-2xl font-bold text-[#002443]">{value}</div>
      {hint && <div className="text-xs text-[#002443]/50 mt-1">{hint}</div>}
    </div>
  );

  const loading = lp || lq;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon={DollarSign} label="TPV Pipeline (USD/mês)" value={loading ? '—' : formatUsd(totalTpv)} hint={`${questionnaires.length} leads`} />
        <KPI icon={CheckCircle2} label="TPV Aceito (USD/mês)" value={loading ? '—' : formatUsd(acceptedTpvUsd)} hint={`${acceptedProposals.length} propostas`} accent="bg-green-100 text-green-700" />
        <KPI icon={TrendingUp} label="MRR Estimado (USD)" value={loading ? '—' : formatUsd(estimatedMrr)} hint="Markup + fee por trx" accent="bg-blue-100 text-blue-700" />
        <KPI icon={Globe2} label="Win Rate" value={loading ? '—' : formatPct(winRate)} hint="Aceitas / decididas" accent="bg-amber-100 text-amber-700" />
      </div>

      {/* Listas recentes */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Propostas recentes */}
        <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm">
          <div className="px-5 py-3 border-b border-[#002443]/5 flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#2bc196]" />
            <h3 className="text-sm font-semibold text-[#002443]">Propostas Recentes</h3>
          </div>
          <div className="divide-y divide-[#002443]/5">
            {proposals.slice(0, 6).map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#002443] truncate">{p.client_name}</div>
                  <div className="text-xs text-[#002443]/50">
                    {p.created_date ? format(new Date(p.created_date), 'dd/MM/yyyy') : '—'} · {formatPct(p.final_rate_percentage)}
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
            {!loading && proposals.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-[#002443]/50">Nenhuma proposta ainda.</div>
            )}
          </div>
        </div>

        {/* Questionários recentes */}
        <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm">
          <div className="px-5 py-3 border-b border-[#002443]/5 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-[#2bc196]" />
            <h3 className="text-sm font-semibold text-[#002443]">Questionários Recentes</h3>
          </div>
          <div className="divide-y divide-[#002443]/5">
            {questionnaires.slice(0, 6).map(q => (
              <div key={q.id} className="px-5 py-3 flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-[#002443] truncate">{q.company_name}</div>
                  <div className="text-xs text-[#002443]/50">
                    {q.created_date ? format(new Date(q.created_date), 'dd/MM/yyyy') : '—'} · {formatUsd(q.monthly_tpv)}
                  </div>
                </div>
                <PipelineBadge status={q.pipeline_status} />
              </div>
            ))}
            {!loading && questionnaires.length === 0 && (
              <div className="px-5 py-8 text-center text-sm text-[#002443]/50">Nenhum questionário ainda.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    sent:             { label: 'Enviada',         bg: 'bg-blue-100 text-blue-700' },
    accepted:         { label: 'Aceita',          bg: 'bg-green-100 text-green-700' },
    counter_proposal: { label: 'Contraproposta',  bg: 'bg-amber-100 text-amber-700' },
    rejected:         { label: 'Recusada',        bg: 'bg-red-100 text-red-700' },
  };
  const it = map[status] || { label: status || '—', bg: 'bg-slate-100 text-slate-700' };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${it.bg}`}>{it.label}</span>;
}

function PipelineBadge({ status }) {
  const map = {
    leads:              { label: 'Lead',              bg: 'bg-slate-100 text-slate-700' },
    proposal_made:      { label: 'Proposta',          bg: 'bg-blue-100 text-blue-700' },
    proposal_accepted:  { label: 'Aceita',            bg: 'bg-green-100 text-green-700' },
    counter_proposal:   { label: 'Contraproposta',    bg: 'bg-amber-100 text-amber-700' },
    proposal_lost:      { label: 'Perdida',           bg: 'bg-red-100 text-red-700' },
  };
  const it = map[status] || { label: status || '—', bg: 'bg-slate-100 text-slate-700' };
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${it.bg}`}>{it.label}</span>;
}