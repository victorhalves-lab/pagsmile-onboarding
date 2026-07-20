import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  Activity, Clock, Zap, AlertTriangle, TrendingUp, ChevronDown, ChevronUp,
  Users, Link2, MousePointer, FileCheck, FileText, Send, CheckCircle,
  XCircle, Shield, Stamp, Eye, Target
} from 'lucide-react';

const RANK_COLORS = ['#1356E2', '#E84B1C', '#0A0A0A', '#64748b', '#94a3b8'];
const formatCompact = (v) => {
  if (!v) return 'R$ 0';
  if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}K`;
  return `R$ ${v.toFixed(0)}`;
};

function MetricCell({ value, color, warn, suffix = '' }) {
  return (
    <td className="text-center px-1.5 py-2">
      <span className={`text-[11px] font-bold ${color || 'text-[#0A0A0A]'} ${warn ? 'text-red-500' : ''}`}>
        {value}{suffix}
      </span>
    </td>
  );
}

function BadgeCell({ value, thresholds }) {
  // thresholds = [{ max, bg, text }] sorted ascending
  let style = 'bg-slate-50 text-slate-400';
  if (value !== null && value !== undefined && value !== '-') {
    for (const t of thresholds) {
      if (value <= t.max) { style = `${t.bg} ${t.text}`; break; }
    }
  }
  return (
    <td className="text-center px-1.5 py-2">
      <Badge className={`text-[10px] border-0 ${style}`}>{value === null || value === undefined ? '-' : value}</Badge>
    </td>
  );
}

export default function TeamProductivityPanel({ sellers, leads, allProposals, onboardingLinks, cases, contracts, standardProposals, pixProposals }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);

  const ACCEPTED_VIA_STANDARD = new Set(['kyc_iniciado', 'kyc_aprovado', 'kyc_revisao_manual', 'proposta_aceita', 'ativado']);
  const isStandardAcceptance = (l) =>
    ACCEPTED_VIA_STANDARD.has(l.status) &&
    !l.currentProposalId &&
    (l.origemLead === 'proposta_padrao_fechamento' || l.questionnaireData?.origemFechamento === 'proposta_padrao' || l.questionnaireData?.taxasAceitas);

  const resolveSellerKey = (l) => {
    if (l.commercialAgentId) return l.commercialAgentId;
    if (l.commercialAgentName) return `name:${l.commercialAgentName}`;
    if (l.created_by && l.created_by !== 'anonymous') return l.created_by;
    return '_unassigned';
  };

  const productivity = useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const allLinks = onboardingLinks || [];
    const allCases = cases || [];
    const allContracts = contracts || [];
    const allStdProposals = standardProposals || [];
    const allPixProps = pixProposals || [];

    return sellers.map(seller => {
      const sid = seller.id;

      // ── LEADS ── (match by commercialAgentId, name-based key, or created_by)
      const sellerLeads = leads.filter(l => resolveSellerKey(l) === sid);
      const sellerLeadsThisMonth = sellerLeads.filter(l => new Date(l.created_date) >= thisMonthStart);
      const sellerLeadsLastMonth = sellerLeads.filter(l => {
        const d = new Date(l.created_date);
        return d >= lastMonthStart && d < thisMonthStart;
      });

      // Leads por status (funil granular)
      const byStatus = {};
      sellerLeads.forEach(l => { byStatus[l.status] = (byStatus[l.status] || 0) + 1; });

      const leadsQuestionario = byStatus['questionario_preenchido'] || 0;
      const leadsAnalisado = byStatus['analisado_priscila'] || 0;
      const leadsEmContato = byStatus['em_contato_comercial'] || 0;
      const leadsPropostaEnviada = byStatus['proposta_enviada'] || 0;
      const leadsPropostaAceita = byStatus['proposta_aceita'] || 0;
      const leadsKYC = (byStatus['kyc_iniciado'] || 0) + (byStatus['kyc_aprovado'] || 0) + (byStatus['kyc_revisao_manual'] || 0);
      const leadsAtivado = byStatus['ativado'] || 0;
      const leadsPerdido = (byStatus['perdido'] || 0) + (byStatus['proposta_recusada'] || 0);

      // ── LINKS ENVIADOS ──
      const sellerLinks = allLinks.filter(lk => lk.commercialAgentId === sid || lk.created_by === sid);
      const linksCreated = sellerLinks.length;
      const totalClicks = sellerLinks.reduce((s, lk) => s + (lk.clickCount || 0), 0);
      const totalSubmissions = sellerLinks.reduce((s, lk) => s + (lk.submissionCount || 0), 0);
      const totalCompleted = sellerLinks.reduce((s, lk) => s + (lk.completedCount || 0), 0);

      // ── PROPOSTAS (todas) ──
      const sellerProposals = allProposals.filter(p => p.responsavelId === sid || p.created_by === sid);
      const proposalsCreated = sellerProposals.length;
      const proposalsDraft = sellerProposals.filter(p => p.status === 'rascunho').length;

      // Count standard proposal acceptances from leads (Gap 2+4)
      const stdAcceptedFromLeads = sellerLeads.filter(l => isStandardAcceptance(l)).length;

      const proposalsSent = sellerProposals.filter(p => ['enviada', 'visualizada', 'aceita', 'recusada', 'contraproposta', 'expirada'].includes(p.status)).length + stdAcceptedFromLeads;
      const proposalsViewed = sellerProposals.filter(p => ['visualizada', 'aceita', 'recusada', 'contraproposta'].includes(p.status)).length + stdAcceptedFromLeads;
      const proposalsAccepted = sellerProposals.filter(p => p.status === 'aceita').length + stdAcceptedFromLeads;
      const proposalsRejected = sellerProposals.filter(p => p.status === 'recusada').length;
      const proposalsCounterOffer = sellerProposals.filter(p => p.status === 'contraproposta').length;
      const proposalAcceptRate = proposalsSent > 0 ? ((proposalsAccepted / proposalsSent) * 100).toFixed(0) : null;
      const proposalViewRate = proposalsSent > 0 ? ((proposalsViewed / proposalsSent) * 100).toFixed(0) : null;

      // ── STANDARD PROPOSALS ──
      const sellerStdProps = allStdProposals.filter(p => p.responsavelId === sid || p.created_by === sid);
      const stdProposalsCount = sellerStdProps.length;

      // ── PIX PROPOSALS ──
      const sellerPixProps = allPixProps.filter(p => p.responsavelId === sid || p.created_by === sid);
      const pixProposalsCount = sellerPixProps.length;

      // ── COMPLIANCE/CASES ──
      const sellerCases = allCases.filter(c => c.commercialAgentId === sid);
      const casesTotal = sellerCases.length;
      const casesApproved = sellerCases.filter(c => c.status === 'Aprovado').length;
      const casesManual = sellerCases.filter(c => c.status === 'Manual').length;
      const casesRejected = sellerCases.filter(c => c.status === 'Recusado').length;
      const casesPending = sellerCases.filter(c => ['Pendente', 'Em Processamento'].includes(c.status)).length;

      // ── CONTRACTS ──
      const sellerContracts = allContracts.filter(c => c.responsavelId === sid || c.created_by === sid);
      const contractsCreated = sellerContracts.length;
      const contractsSent = sellerContracts.filter(c => c.status === 'sent').length;
      const contractsSigned = sellerContracts.filter(c => c.status === 'signed').length;

      // ── TIMING ──
      // Tempo médio lead → proposta
      let avgDaysToProposal = null;
      const proposalMap = {};
      sellerProposals.forEach(p => { if (p.leadId && p.created_date) { if (!proposalMap[p.leadId] || new Date(p.created_date) < new Date(proposalMap[p.leadId])) proposalMap[p.leadId] = p.created_date; } });
      const leadsWithProp = sellerLeads.filter(l => proposalMap[l.id]);
      if (leadsWithProp.length > 0) {
        const sum = leadsWithProp.reduce((s, l) => s + (new Date(proposalMap[l.id]) - new Date(l.created_date)) / 86400000, 0);
        avgDaysToProposal = parseFloat((sum / leadsWithProp.length).toFixed(1));
      }

      // Tempo médio lead → ativação
      let avgConversionDays = null;
      const activatedLeads = sellerLeads.filter(l => l.status === 'ativado');
      if (activatedLeads.length > 0) {
        const sum = activatedLeads.reduce((s, l) => s + (new Date(l.lastInteractionDate || l.updated_date) - new Date(l.created_date)) / 86400000, 0);
        avgConversionDays = parseInt((sum / activatedLeads.length).toFixed(0));
      }

      // Leads parados (>7 dias sem update, não final)
      const staleLeads = sellerLeads.filter(l => {
        if (['ativado', 'perdido', 'proposta_recusada'].includes(l.status)) return false;
        const d = l.lastInteractionDate || l.updated_date || l.created_date;
        return d && (now - new Date(d)) / 86400000 > 7;
      }).length;

      // Follow-up rate
      const followUpRate = sellerLeads.length > 0
        ? parseInt(((sellerLeads.filter(l => l.status !== 'questionario_preenchido').length) / sellerLeads.length * 100).toFixed(0))
        : 0;

      // Conversion rate (lead → ativado)
      const conversionRate = sellerLeads.length > 0 ? ((leadsAtivado / sellerLeads.length) * 100).toFixed(1) : null;
      const lossRate = sellerLeads.length > 0 ? ((leadsPerdido / sellerLeads.length) * 100).toFixed(1) : null;

      // TPV pipeline — use proposal minimoGarantido (including proposals without lead)
      // 1) TPV from leads with linked proposals
      const proposalTpvLookup = {};
      sellerProposals.forEach(p => {
        if (!p.leadId) return;
        const tpv = p.rates?.minimoGarantido?.mes3 || p.rates?.minimoGarantido?.mes2 || p.rates?.minimoGarantido?.mes1 || 0;
        if (tpv > (proposalTpvLookup[p.leadId] || 0)) proposalTpvLookup[p.leadId] = tpv;
      });
      const getSellerLeadTpv = (l) => proposalTpvLookup[l.id] || l.tpvMensal || 0;
      const tpvFromLeads = sellerLeads.filter(l => !['perdido', 'proposta_recusada'].includes(l.status)).reduce((s, l) => s + getSellerLeadTpv(l), 0);

      // 2) TPV from accepted proposals without leadId (orphan proposals)
      const leadIdsWithTpv = new Set(Object.keys(proposalTpvLookup));
      const tpvFromOrphanProposals = sellerProposals
        .filter(p => p.status === 'aceita' && (!p.leadId || !leadIdsWithTpv.has(p.leadId)))
        .reduce((s, p) => s + (p.rates?.minimoGarantido?.mes3 || p.rates?.minimoGarantido?.mes2 || p.rates?.minimoGarantido?.mes1 || 0), 0);

      const tpvPipeline = tpvFromLeads + tpvFromOrphanProposals;

      // Ticket médio
      const leadsWithTicket = sellerLeads.filter(l => l.ticketMedio > 0);
      const avgTicket = leadsWithTicket.length > 0 ? leadsWithTicket.reduce((s, l) => s + l.ticketMedio, 0) / leadsWithTicket.length : 0;

      // Lead qualifier score médio
      const leadsWithScore = sellerLeads.filter(l => l.leadQualifierScore > 0);
      const avgQualScore = leadsWithScore.length > 0 ? (leadsWithScore.reduce((s, l) => s + l.leadQualifierScore, 0) / leadsWithScore.length).toFixed(0) : null;

      // Growth MoM
      const growthPct = sellerLeadsLastMonth.length > 0
        ? parseInt((((sellerLeadsThisMonth.length - sellerLeadsLastMonth.length) / sellerLeadsLastMonth.length) * 100).toFixed(0))
        : sellerLeadsThisMonth.length > 0 ? 100 : 0;

      return {
        ...seller,
        // Leads funnel
        leadsQuestionario, leadsAnalisado, leadsEmContato, leadsPropostaEnviada,
        leadsPropostaAceita, leadsKYC, leadsAtivado, leadsPerdido,
        leadsThisMonth: sellerLeadsThisMonth.length,
        // Links
        linksCreated, totalClicks, totalSubmissions, totalCompleted,
        // Proposals
        proposalsCreated, proposalsDraft, proposalsSent, proposalsViewed,
        proposalsAccepted, proposalsRejected, proposalsCounterOffer,
        proposalAcceptRate, proposalViewRate,
        stdProposalsCount, pixProposalsCount,
        // Compliance
        casesTotal, casesApproved, casesManual, casesRejected, casesPending,
        // Contracts
        contractsCreated, contractsSent, contractsSigned,
        // Timing
        avgDaysToProposal, avgConversionDays, staleLeads, followUpRate,
        // Rates
        conversionRate, lossRate,
        // Financial
        tpvPipeline, avgTicket, avgQualScore,
        growthPct,
      };
    }).sort((a, b) => b.leadsActivated - a.leadsActivated);
  }, [sellers, leads, allProposals, onboardingLinks, cases, contracts, standardProposals, pixProposals]);

  // ── Team totals ──
  const teamTotals = useMemo(() => {
    if (productivity.length === 0) return null;
    const sum = (key) => productivity.reduce((s, p) => s + (p[key] || 0), 0);
    const avgNum = (key) => { const vals = productivity.filter(p => p[key] !== null && p[key] !== undefined); return vals.length > 0 ? (vals.reduce((s, p) => s + p[key], 0) / vals.length) : null; };
    return {
      leads: sum('totalLeads'),
      leadsMonth: sum('leadsThisMonth'),
      links: sum('linksCreated'),
      clicks: sum('totalClicks'),
      submissions: sum('totalSubmissions'),
      proposals: sum('proposalsCreated'),
      sent: sum('proposalsSent'),
      viewed: sum('proposalsViewed'),
      accepted: sum('proposalsAccepted'),
      rejected: sum('proposalsRejected'),
      cases: sum('casesTotal'),
      casesApproved: sum('casesApproved'),
      contracts: sum('contractsCreated'),
      signed: sum('contractsSigned'),
      activated: sum('leadsAtivado'),
      lost: sum('leadsPerdido'),
      stale: sum('staleLeads'),
      avgDaysToProposal: avgNum('avgDaysToProposal'),
      avgConversionDays: avgNum('avgConversionDays'),
    };
  }, [productivity]);

  // Chart data
  const chartData = useMemo(() => {
    return productivity.slice(0, 10).map(p => ({
      name: (p.name || '').split(' ')[0] || '?',
      leads: p.totalLeads,
      propostas: p.proposalsSent,
      aceitas: p.proposalsAccepted,
      ativados: p.leadsAtivado,
      contratos: p.contractsSigned,
    }));
  }, [productivity]);

  if (productivity.length === 0) return null;

  const displayList = expanded ? productivity : productivity.slice(0, 5);
  const detail = selectedSeller ? productivity.find(p => p.id === selectedSeller) : null;

  return (
    <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[#0A0A0A]/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1356E2] to-[#0A0A0A] flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0A0A0A]">Produtividade Completa do Time</h3>
            <p className="text-[10px] text-[#0A0A0A]/40">Funil granular, links, propostas, compliance, contratos — por pessoa</p>
          </div>
        </div>
      </div>

      {/* Team Summary Cards */}
      {teamTotals && (
        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-10 gap-px bg-[#0A0A0A]/5">
          {[
            { label: 'Leads', value: teamTotals.leads, icon: Users, color: '#0A0A0A' },
            { label: 'Links', value: teamTotals.links, icon: Link2, color: '#E84B1C' },
            { label: 'Cliques', value: teamTotals.clicks, icon: MousePointer, color: '#6366f1' },
            { label: 'Preench.', value: teamTotals.submissions, icon: FileCheck, color: '#8b5cf6' },
            { label: 'Prop. Env.', value: teamTotals.sent, icon: Send, color: '#eab308' },
            { label: 'Prop. Aceitas', value: teamTotals.accepted, icon: CheckCircle, color: '#22c55e' },
            { label: 'Compliance', value: teamTotals.cases, icon: Shield, color: '#3b82f6' },
            { label: 'Contratos', value: teamTotals.contracts, icon: Stamp, color: '#0A0A0A' },
            { label: 'Ativados', value: teamTotals.activated, icon: Target, color: '#1356E2' },
            { label: 'Parados', value: teamTotals.stale, icon: AlertTriangle, color: '#ef4444' },
          ].map(item => (
            <div key={item.label} className="bg-white p-2.5 text-center">
              <item.icon className="w-3 h-3 mx-auto mb-0.5" style={{ color: item.color }} />
              <p className="text-base font-extrabold text-[#0A0A0A]">{item.value}</p>
              <p className="text-[8px] text-[#0A0A0A]/30 font-bold uppercase tracking-wider leading-tight">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="p-5 border-b border-[#0A0A0A]/5">
          <p className="text-[10px] font-bold text-[#0A0A0A]/30 uppercase tracking-wider mb-3">Funil Comparativo por Vendedor</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: -15, right: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0A0A0A" strokeOpacity={0.05} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#0A0A0A' }} />
                <YAxis tick={{ fontSize: 10, fill: '#0A0A0A' }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,36,67,0.1)', fontSize: 11 }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="leads" name="Leads" fill="#0A0A0A" radius={[3, 3, 0, 0]} barSize={10} />
                <Bar dataKey="propostas" name="Prop. Env." fill="#eab308" radius={[3, 3, 0, 0]} barSize={10} />
                <Bar dataKey="aceitas" name="Aceitas" fill="#22c55e" radius={[3, 3, 0, 0]} barSize={10} />
                <Bar dataKey="ativados" name="Ativados" fill="#1356E2" radius={[3, 3, 0, 0]} barSize={10} />
                <Bar dataKey="contratos" name="Contratos" fill="#6366f1" radius={[3, 3, 0, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Full Metrics Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-center">
          <thead>
            <tr className="bg-[#0A0A0A]/[0.03]">
              <th className="text-left px-4 py-2 text-[8px] font-bold text-[#0A0A0A]/40 uppercase tracking-wider sticky left-0 bg-[#f9fafb] z-10">Vendedor</th>
              {/* Links */}
              <th colSpan={4} className="px-1 py-1 text-[8px] font-bold text-indigo-400 uppercase tracking-wider border-l border-[#0A0A0A]/5">Links & Captação</th>
              {/* Propostas */}
              <th colSpan={5} className="px-1 py-1 text-[8px] font-bold text-yellow-600 uppercase tracking-wider border-l border-[#0A0A0A]/5">Propostas</th>
              {/* Compliance */}
              <th colSpan={3} className="px-1 py-1 text-[8px] font-bold text-blue-500 uppercase tracking-wider border-l border-[#0A0A0A]/5">Compliance</th>
              {/* Contratos */}
              <th colSpan={2} className="px-1 py-1 text-[8px] font-bold text-[#0A0A0A]/50 uppercase tracking-wider border-l border-[#0A0A0A]/5">Contratos</th>
              {/* Resultado */}
              <th colSpan={4} className="px-1 py-1 text-[8px] font-bold text-[#1356E2] uppercase tracking-wider border-l border-[#0A0A0A]/5">Resultado</th>
              {/* Timing */}
              <th colSpan={3} className="px-1 py-1 text-[8px] font-bold text-red-400 uppercase tracking-wider border-l border-[#0A0A0A]/5">Velocidade</th>
            </tr>
            <tr className="bg-[#f4f4f4]/50 border-t border-[#0A0A0A]/5">
              <th className="text-left px-4 py-1.5 text-[8px] font-bold text-[#0A0A0A]/30 uppercase sticky left-0 bg-[#f9fafb] z-10"></th>
              {/* Links */}
              <th className="px-1 py-1.5 text-[8px] font-bold text-[#0A0A0A]/30 uppercase border-l border-[#0A0A0A]/5">Links</th>
              <th className="px-1 py-1.5 text-[8px] font-bold text-[#0A0A0A]/30 uppercase">Cliques</th>
              <th className="px-1 py-1.5 text-[8px] font-bold text-[#0A0A0A]/30 uppercase">Preench.</th>
              <th className="px-1 py-1.5 text-[8px] font-bold text-[#0A0A0A]/30 uppercase">Complet.</th>
              {/* Propostas */}
              <th className="px-1 py-1.5 text-[8px] font-bold text-[#0A0A0A]/30 uppercase border-l border-[#0A0A0A]/5">Criadas</th>
              <th className="px-1 py-1.5 text-[8px] font-bold text-[#0A0A0A]/30 uppercase">Enviadas</th>
              <th className="px-1 py-1.5 text-[8px] font-bold text-[#0A0A0A]/30 uppercase">Visualiz.</th>
              <th className="px-1 py-1.5 text-[8px] font-bold text-[#0A0A0A]/30 uppercase">Aceitas</th>
              <th className="px-1 py-1.5 text-[8px] font-bold text-[#0A0A0A]/30 uppercase">% Aceite</th>
              {/* Compliance */}
              <th className="px-1 py-1.5 text-[8px] font-bold text-[#0A0A0A]/30 uppercase border-l border-[#0A0A0A]/5">Cases</th>
              <th className="px-1 py-1.5 text-[8px] font-bold text-[#0A0A0A]/30 uppercase">Aprovados</th>
              <th className="px-1 py-1.5 text-[8px] font-bold text-[#0A0A0A]/30 uppercase">Pendentes</th>
              {/* Contratos */}
              <th className="px-1 py-1.5 text-[8px] font-bold text-[#0A0A0A]/30 uppercase border-l border-[#0A0A0A]/5">Criados</th>
              <th className="px-1 py-1.5 text-[8px] font-bold text-[#0A0A0A]/30 uppercase">Assinados</th>
              {/* Resultado */}
              <th className="px-1 py-1.5 text-[8px] font-bold text-[#0A0A0A]/30 uppercase border-l border-[#0A0A0A]/5">Ativados</th>
              <th className="px-1 py-1.5 text-[8px] font-bold text-[#0A0A0A]/30 uppercase">Perdidos</th>
              <th className="px-1 py-1.5 text-[8px] font-bold text-[#0A0A0A]/30 uppercase">% Conv.</th>
              <th className="px-1 py-1.5 text-[8px] font-bold text-[#0A0A0A]/30 uppercase">TPV Pipe</th>
              {/* Timing */}
              <th className="px-1 py-1.5 text-[8px] font-bold text-[#0A0A0A]/30 uppercase border-l border-[#0A0A0A]/5">→ Prop.</th>
              <th className="px-1 py-1.5 text-[8px] font-bold text-[#0A0A0A]/30 uppercase">→ Ativ.</th>
              <th className="px-1 py-1.5 text-[8px] font-bold text-[#0A0A0A]/30 uppercase">Parados</th>
            </tr>
          </thead>
          <tbody>
            {displayList.map((p, idx) => (
              <tr
                key={p.id}
                className={`border-t border-[#0A0A0A]/5 hover:bg-[#1356E2]/[0.02] transition-colors cursor-pointer ${selectedSeller === p.id ? 'bg-[#1356E2]/5' : ''}`}
                onClick={() => setSelectedSeller(selectedSeller === p.id ? null : p.id)}
              >
                <td className="text-left px-4 py-2 sticky left-0 bg-white z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0" style={{ backgroundColor: RANK_COLORS[idx] || '#94a3b8' }}>
                      {idx + 1}
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-[#0A0A0A] truncate block max-w-[90px]">{p.name}</span>
                      <span className={`text-[8px] font-bold ${p.growthPct > 0 ? 'text-[#1356E2]' : p.growthPct < 0 ? 'text-red-500' : 'text-[#0A0A0A]/20'}`}>
                        {p.growthPct > 0 ? '↑' : p.growthPct < 0 ? '↓' : '='}{Math.abs(p.growthPct)}% MoM
                      </span>
                    </div>
                  </div>
                </td>
                {/* Links */}
                <MetricCell value={p.linksCreated} color="text-indigo-600" />
                <MetricCell value={p.totalClicks} color="text-indigo-500" />
                <MetricCell value={p.totalSubmissions} color="text-indigo-500" />
                <MetricCell value={p.totalCompleted} color="text-indigo-500" />
                {/* Propostas */}
                <MetricCell value={p.proposalsCreated} />
                <MetricCell value={p.proposalsSent} color="text-yellow-600" />
                <MetricCell value={p.proposalsViewed} color="text-orange-500" />
                <MetricCell value={p.proposalsAccepted} color="text-green-600" />
                <BadgeCell
                  value={p.proposalAcceptRate !== null ? `${p.proposalAcceptRate}%` : '-'}
                  thresholds={[
                    { max: 30, bg: 'bg-red-50', text: 'text-red-500' },
                    { max: 60, bg: 'bg-yellow-50', text: 'text-yellow-700' },
                    { max: 200, bg: 'bg-green-50', text: 'text-green-700' },
                  ]}
                />
                {/* Compliance */}
                <MetricCell value={p.casesTotal} color="text-blue-600" />
                <MetricCell value={p.casesApproved} color="text-green-600" />
                <MetricCell value={p.casesPending} color={p.casesPending > 0 ? 'text-amber-600' : 'text-[#0A0A0A]/30'} />
                {/* Contracts */}
                <MetricCell value={p.contractsCreated} />
                <MetricCell value={p.contractsSigned} color="text-[#1356E2]" />
                {/* Result */}
                <MetricCell value={p.leadsAtivado} color="text-[#1356E2]" />
                <MetricCell value={p.leadsPerdido} color={p.leadsPerdido > 0 ? 'text-red-500' : 'text-[#0A0A0A]/30'} />
                <BadgeCell
                  value={p.conversionRate !== null ? `${p.conversionRate}%` : '-'}
                  thresholds={[
                    { max: 10, bg: 'bg-red-50', text: 'text-red-500' },
                    { max: 25, bg: 'bg-yellow-50', text: 'text-yellow-700' },
                    { max: 200, bg: 'bg-green-50', text: 'text-green-700' },
                  ]}
                />
                <td className="text-center px-1.5 py-2">
                  <span className="text-[10px] font-bold text-[#0A0A0A]">{formatCompact(p.tpvPipeline)}</span>
                </td>
                {/* Timing */}
                <BadgeCell
                  value={p.avgDaysToProposal !== null ? `${p.avgDaysToProposal}d` : '-'}
                  thresholds={[
                    { max: 3, bg: 'bg-green-50', text: 'text-green-700' },
                    { max: 7, bg: 'bg-yellow-50', text: 'text-yellow-700' },
                    { max: 9999, bg: 'bg-red-50', text: 'text-red-500' },
                  ]}
                />
                <BadgeCell
                  value={p.avgConversionDays !== null ? `${p.avgConversionDays}d` : '-'}
                  thresholds={[
                    { max: 15, bg: 'bg-green-50', text: 'text-green-700' },
                    { max: 30, bg: 'bg-yellow-50', text: 'text-yellow-700' },
                    { max: 9999, bg: 'bg-red-50', text: 'text-red-500' },
                  ]}
                />
                <td className="text-center px-1.5 py-2">
                  {p.staleLeads > 0 ? (
                    <span className="text-[11px] font-bold text-red-500 flex items-center justify-center gap-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" /> {p.staleLeads}
                    </span>
                  ) : <span className="text-[11px] text-[#1356E2]">0</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expanded Detail Card */}
      {detail && (
        <div className="border-t border-[#0A0A0A]/5 p-5 bg-[#f4f4f4]/50">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-full bg-[#1356E2] flex items-center justify-center text-white text-xs font-bold">
              {(detail.name || '?')[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-[#0A0A0A]">{detail.name}</p>
              <p className="text-[10px] text-[#0A0A0A]/40">Detalhe completo do funil individual</p>
            </div>
          </div>

          {/* Mini funnel */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
            {[
              { label: 'Questionário', value: detail.leadsQuestionario, color: '#94a3b8' },
              { label: 'Analisado IA', value: detail.leadsAnalisado, color: '#6366f1' },
              { label: 'Em Contato', value: detail.leadsEmContato, color: '#3b82f6' },
              { label: 'Prop. Enviada', value: detail.leadsPropostaEnviada, color: '#eab308' },
              { label: 'Prop. Aceita', value: detail.leadsPropostaAceita, color: '#22c55e' },
              { label: 'KYC', value: detail.leadsKYC, color: '#8b5cf6' },
              { label: 'Ativado', value: detail.leadsAtivado, color: '#1356E2' },
              { label: 'Perdido', value: detail.leadsPerdido, color: '#ef4444' },
            ].map(item => (
              <div key={item.label} className="bg-white rounded-xl p-2.5 text-center border border-[#0A0A0A]/5">
                <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ backgroundColor: item.color }} />
                <p className="text-lg font-extrabold text-[#0A0A0A]">{item.value}</p>
                <p className="text-[8px] text-[#0A0A0A]/30 font-bold uppercase">{item.label}</p>
              </div>
            ))}
          </div>

          {/* Extra details */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-3 border border-[#0A0A0A]/5">
              <p className="text-[9px] text-[#0A0A0A]/30 font-bold uppercase mb-1">Propostas</p>
              <p className="text-xs"><span className="text-[#0A0A0A]/50">Rascunho:</span> <span className="font-bold">{detail.proposalsDraft}</span></p>
              <p className="text-xs"><span className="text-[#0A0A0A]/50">Contrapropostas:</span> <span className="font-bold">{detail.proposalsCounterOffer}</span></p>
              <p className="text-xs"><span className="text-[#0A0A0A]/50">Recusadas:</span> <span className="font-bold text-red-500">{detail.proposalsRejected}</span></p>
              <p className="text-xs"><span className="text-[#0A0A0A]/50">Padrão:</span> <span className="font-bold">{detail.stdProposalsCount}</span></p>
              <p className="text-xs"><span className="text-[#0A0A0A]/50">Pix:</span> <span className="font-bold">{detail.pixProposalsCount}</span></p>
              <p className="text-xs mt-1"><span className="text-[#0A0A0A]/50">% Visualiz.:</span> <span className="font-bold">{detail.proposalViewRate || '-'}%</span></p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-[#0A0A0A]/5">
              <p className="text-[9px] text-[#0A0A0A]/30 font-bold uppercase mb-1">Compliance</p>
              <p className="text-xs"><span className="text-[#0A0A0A]/50">Manual:</span> <span className="font-bold text-amber-600">{detail.casesManual}</span></p>
              <p className="text-xs"><span className="text-[#0A0A0A]/50">Recusados:</span> <span className="font-bold text-red-500">{detail.casesRejected}</span></p>
              <p className="text-xs"><span className="text-[#0A0A0A]/50">Aprovados:</span> <span className="font-bold text-green-600">{detail.casesApproved}</span></p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-[#0A0A0A]/5">
              <p className="text-[9px] text-[#0A0A0A]/30 font-bold uppercase mb-1">Contratos</p>
              <p className="text-xs"><span className="text-[#0A0A0A]/50">Enviados:</span> <span className="font-bold">{detail.contractsSent}</span></p>
              <p className="text-xs"><span className="text-[#0A0A0A]/50">Assinados:</span> <span className="font-bold text-[#1356E2]">{detail.contractsSigned}</span></p>
            </div>
            <div className="bg-white rounded-xl p-3 border border-[#0A0A0A]/5">
              <p className="text-[9px] text-[#0A0A0A]/30 font-bold uppercase mb-1">Qualidade</p>
              <p className="text-xs"><span className="text-[#0A0A0A]/50">Score Médio IA:</span> <span className="font-bold">{detail.avgQualScore || '-'}</span></p>
              <p className="text-xs"><span className="text-[#0A0A0A]/50">Follow-up:</span> <span className="font-bold">{detail.followUpRate}%</span></p>
              <p className="text-xs"><span className="text-[#0A0A0A]/50">Ticket Médio:</span> <span className="font-bold">{formatCompact(detail.avgTicket)}</span></p>
              <p className="text-xs"><span className="text-[#0A0A0A]/50">% Perda:</span> <span className="font-bold text-red-500">{detail.lossRate || '-'}%</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Expand */}
      {productivity.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2.5 text-xs font-bold text-[#0A0A0A]/40 hover:text-[#1356E2] transition-colors flex items-center justify-center gap-1 border-t border-[#0A0A0A]/5"
        >
          {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Mostrar menos</> : <><ChevronDown className="w-3.5 h-3.5" /> Mostrar todos ({productivity.length})</>}
        </button>
      )}
    </div>
  );
}