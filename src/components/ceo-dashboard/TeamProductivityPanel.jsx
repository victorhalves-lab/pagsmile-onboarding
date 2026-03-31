import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Activity, Clock, Zap, AlertTriangle, TrendingUp, ChevronDown, ChevronUp, Users } from 'lucide-react';

const RANK_COLORS = ['#2bc196', '#36706c', '#002443', '#64748b', '#94a3b8'];

function ProductivityBar({ label, value, max, unit, color }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-[#002443]/50 w-20 truncate text-right">{label}</span>
      <div className="flex-1 h-2 bg-[#002443]/5 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold text-[#002443] w-14 text-right">{value}{unit}</span>
    </div>
  );
}

export default function TeamProductivityPanel({ sellers, leads, allProposals }) {
  const [expanded, setExpanded] = useState(false);

  // ── Compute productivity metrics per seller ──
  const productivity = React.useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

    return sellers.map(seller => {
      const sellerLeads = leads.filter(l => (l.commercialAgentId || l.created_by) === seller.id);
      const sellerLeadsThisMonth = sellerLeads.filter(l => new Date(l.created_date) >= thisMonthStart);
      const sellerLeadsLastMonth = sellerLeads.filter(l => {
        const d = new Date(l.created_date);
        return d >= lastMonthStart && d < thisMonthStart;
      });

      // Leads parados (>7 dias sem interação, não finalizados)
      const staleLeads = sellerLeads.filter(l => {
        if (['ativado', 'perdido', 'proposta_recusada'].includes(l.status)) return false;
        const d = l.lastInteractionDate || l.updated_date || l.created_date;
        return d && (now - new Date(d)) / 86400000 > 7;
      }).length;

      // Tempo médio até primeira proposta (dias)
      const leadsWithProposal = sellerLeads.filter(l => l.currentProposalId && l.created_date);
      let avgDaysToProposal = null;
      if (leadsWithProposal.length > 0) {
        const sellerProposals = allProposals.filter(p => p.responsavelId === seller.id);
        const proposalMap = {};
        sellerProposals.forEach(p => { if (p.leadId) proposalMap[p.leadId] = p; });
        
        let totalDays = 0, count = 0;
        leadsWithProposal.forEach(l => {
          const prop = proposalMap[l.id];
          if (prop?.created_date && l.created_date) {
            totalDays += (new Date(prop.created_date) - new Date(l.created_date)) / 86400000;
            count++;
          }
        });
        avgDaysToProposal = count > 0 ? (totalDays / count).toFixed(1) : null;
      }

      // Velocidade de conversão (dias lead criado → ativado)
      const activatedLeads = sellerLeads.filter(l => l.status === 'ativado');
      let avgConversionDays = null;
      if (activatedLeads.length > 0) {
        const totalDays = activatedLeads.reduce((s, l) => {
          const upd = l.lastInteractionDate || l.updated_date;
          return s + (new Date(upd) - new Date(l.created_date)) / 86400000;
        }, 0);
        avgConversionDays = (totalDays / activatedLeads.length).toFixed(0);
      }

      // Propostas este mês
      const sellerProposalsThisMonth = allProposals.filter(p => 
        p.responsavelId === seller.id && new Date(p.created_date) >= thisMonthStart
      ).length;

      // Taxa de follow-up (leads que saíram de questionario_preenchido)
      const totalInitial = sellerLeads.filter(l => true).length; // todos
      const progressed = sellerLeads.filter(l => l.status !== 'questionario_preenchido').length;
      const followUpRate = totalInitial > 0 ? ((progressed / totalInitial) * 100).toFixed(0) : 0;

      // Crescimento mês a mês
      const growthPct = sellerLeadsLastMonth.length > 0
        ? (((sellerLeadsThisMonth.length - sellerLeadsLastMonth.length) / sellerLeadsLastMonth.length) * 100).toFixed(0)
        : sellerLeadsThisMonth.length > 0 ? '+100' : '0';

      return {
        ...seller,
        staleLeads,
        avgDaysToProposal: avgDaysToProposal !== null ? `${avgDaysToProposal}d` : '-',
        avgDaysToProposalNum: avgDaysToProposal !== null ? parseFloat(avgDaysToProposal) : 999,
        avgConversionDays: avgConversionDays !== null ? `${avgConversionDays}d` : '-',
        avgConversionDaysNum: avgConversionDays !== null ? parseInt(avgConversionDays) : 999,
        proposalsThisMonth: sellerProposalsThisMonth,
        leadsThisMonth: sellerLeadsThisMonth.length,
        followUpRate: parseInt(followUpRate),
        growthPct: parseInt(growthPct),
      };
    }).sort((a, b) => b.leadsActivated - a.leadsActivated);
  }, [sellers, leads, allProposals]);

  // ── Team averages ──
  const teamAvg = React.useMemo(() => {
    if (productivity.length === 0) return null;
    const withProposal = productivity.filter(p => p.avgDaysToProposalNum < 999);
    const withConversion = productivity.filter(p => p.avgConversionDaysNum < 999);
    return {
      avgStale: (productivity.reduce((s, p) => s + p.staleLeads, 0) / productivity.length).toFixed(1),
      avgDaysToProposal: withProposal.length > 0
        ? (withProposal.reduce((s, p) => s + p.avgDaysToProposalNum, 0) / withProposal.length).toFixed(1) + 'd'
        : '-',
      avgConversionDays: withConversion.length > 0
        ? (withConversion.reduce((s, p) => s + p.avgConversionDaysNum, 0) / withConversion.length).toFixed(0) + 'd'
        : '-',
      avgFollowUp: (productivity.reduce((s, p) => s + p.followUpRate, 0) / productivity.length).toFixed(0),
      totalLeadsThisMonth: productivity.reduce((s, p) => s + p.leadsThisMonth, 0),
      totalProposalsThisMonth: productivity.reduce((s, p) => s + p.proposalsThisMonth, 0),
    };
  }, [productivity]);

  // ── Chart data: leads this month per seller ──
  const chartData = productivity
    .filter(p => p.leadsThisMonth > 0 || p.proposalsThisMonth > 0)
    .slice(0, 8)
    .map(p => ({
      name: (p.name || '').split(' ')[0] || '?',
      leads: p.leadsThisMonth,
      propostas: p.proposalsThisMonth,
      ativados: p.leadsActivated,
    }));

  if (productivity.length === 0) return null;

  const displayList = expanded ? productivity : productivity.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-[#002443]/5 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-[#002443]/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2bc196] to-[#002443] flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#002443]">Produtividade do Time</h3>
              <p className="text-[10px] text-[#002443]/40">Métricas de velocidade, follow-up e eficiência</p>
            </div>
          </div>
        </div>
      </div>

      {/* Team Averages */}
      {teamAvg && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-px bg-[#002443]/5">
          {[
            { label: 'Leads/Mês', value: teamAvg.totalLeadsThisMonth, icon: Users, color: '#002443' },
            { label: 'Propostas/Mês', value: teamAvg.totalProposalsThisMonth, icon: Zap, color: '#36706c' },
            { label: 'Tempo p/ Proposta', value: teamAvg.avgDaysToProposal, icon: Clock, color: '#eab308' },
            { label: 'Tempo Conversão', value: teamAvg.avgConversionDays, icon: TrendingUp, color: '#2bc196' },
            { label: 'Follow-up', value: `${teamAvg.avgFollowUp}%`, icon: Activity, color: '#3b82f6' },
            { label: 'Leads Parados', value: teamAvg.avgStale, icon: AlertTriangle, color: '#ef4444' },
          ].map(item => (
            <div key={item.label} className="bg-white p-3 text-center">
              <item.icon className="w-3.5 h-3.5 mx-auto mb-1" style={{ color: item.color }} />
              <p className="text-lg font-extrabold text-[#002443]">{item.value}</p>
              <p className="text-[9px] text-[#002443]/30 font-bold uppercase tracking-wider">{item.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Chart: Volume por vendedor este mês */}
      {chartData.length > 0 && (
        <div className="p-5 border-b border-[#002443]/5">
          <p className="text-[10px] font-bold text-[#002443]/30 uppercase tracking-wider mb-3">Volume Este Mês por Vendedor</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: -10, right: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#002443" strokeOpacity={0.05} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#002443' }} />
                <YAxis tick={{ fontSize: 10, fill: '#002443' }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid rgba(0,36,67,0.1)', fontSize: 11 }} />
                <Bar dataKey="leads" name="Leads" fill="#002443" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="propostas" name="Propostas" fill="#36706c" radius={[4, 4, 0, 0]} barSize={16} />
                <Bar dataKey="ativados" name="Ativados" fill="#2bc196" radius={[4, 4, 0, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Individual Productivity Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f4f4f4]/50">
              <th className="text-left px-5 py-2.5 text-[9px] font-bold text-[#002443]/40 uppercase tracking-wider">Vendedor</th>
              <th className="text-center px-2 py-2.5 text-[9px] font-bold text-[#002443]/40 uppercase tracking-wider">Leads/Mês</th>
              <th className="text-center px-2 py-2.5 text-[9px] font-bold text-[#002443]/40 uppercase tracking-wider">Prop./Mês</th>
              <th className="text-center px-2 py-2.5 text-[9px] font-bold text-[#002443]/40 uppercase tracking-wider">Tempo → Prop.</th>
              <th className="text-center px-2 py-2.5 text-[9px] font-bold text-[#002443]/40 uppercase tracking-wider">Tempo → Ativ.</th>
              <th className="text-center px-2 py-2.5 text-[9px] font-bold text-[#002443]/40 uppercase tracking-wider">Follow-up</th>
              <th className="text-center px-2 py-2.5 text-[9px] font-bold text-[#002443]/40 uppercase tracking-wider">Parados</th>
              <th className="text-center px-2 py-2.5 text-[9px] font-bold text-[#002443]/40 uppercase tracking-wider">Crescimento</th>
            </tr>
          </thead>
          <tbody>
            {displayList.map((p, idx) => (
              <tr key={p.id} className="border-t border-[#002443]/5 hover:bg-[#2bc196]/[0.02] transition-colors">
                <td className="px-5 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ backgroundColor: RANK_COLORS[idx] || '#94a3b8' }}>
                      {idx + 1}
                    </div>
                    <span className="text-xs font-semibold text-[#002443] truncate max-w-[100px]">{p.name}</span>
                  </div>
                </td>
                <td className="text-center px-2 py-2.5">
                  <span className="text-xs font-bold text-[#002443]">{p.leadsThisMonth}</span>
                </td>
                <td className="text-center px-2 py-2.5">
                  <span className="text-xs font-bold text-[#36706c]">{p.proposalsThisMonth}</span>
                </td>
                <td className="text-center px-2 py-2.5">
                  <Badge className={`text-[10px] border-0 ${
                    p.avgDaysToProposalNum <= 3 ? 'bg-[#2bc196]/10 text-[#2bc196]' :
                    p.avgDaysToProposalNum <= 7 ? 'bg-yellow-50 text-yellow-700' :
                    p.avgDaysToProposalNum < 999 ? 'bg-red-50 text-red-500' :
                    'bg-slate-50 text-slate-400'
                  }`}>{p.avgDaysToProposal}</Badge>
                </td>
                <td className="text-center px-2 py-2.5">
                  <Badge className={`text-[10px] border-0 ${
                    p.avgConversionDaysNum <= 15 ? 'bg-[#2bc196]/10 text-[#2bc196]' :
                    p.avgConversionDaysNum <= 30 ? 'bg-yellow-50 text-yellow-700' :
                    p.avgConversionDaysNum < 999 ? 'bg-red-50 text-red-500' :
                    'bg-slate-50 text-slate-400'
                  }`}>{p.avgConversionDays}</Badge>
                </td>
                <td className="text-center px-2 py-2.5">
                  <Badge className={`text-[10px] border-0 ${
                    p.followUpRate >= 70 ? 'bg-[#2bc196]/10 text-[#2bc196]' :
                    p.followUpRate >= 40 ? 'bg-yellow-50 text-yellow-700' :
                    'bg-red-50 text-red-500'
                  }`}>{p.followUpRate}%</Badge>
                </td>
                <td className="text-center px-2 py-2.5">
                  {p.staleLeads > 0 ? (
                    <span className="text-xs font-bold text-red-500 flex items-center justify-center gap-0.5">
                      <AlertTriangle className="w-3 h-3" /> {p.staleLeads}
                    </span>
                  ) : (
                    <span className="text-xs text-[#2bc196]">0</span>
                  )}
                </td>
                <td className="text-center px-2 py-2.5">
                  <span className={`text-[10px] font-bold ${p.growthPct > 0 ? 'text-[#2bc196]' : p.growthPct < 0 ? 'text-red-500' : 'text-[#002443]/30'}`}>
                    {p.growthPct > 0 ? '+' : ''}{p.growthPct}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expand/Collapse */}
      {productivity.length > 5 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full py-2.5 text-xs font-bold text-[#002443]/40 hover:text-[#2bc196] transition-colors flex items-center justify-center gap-1 border-t border-[#002443]/5"
        >
          {expanded ? <><ChevronUp className="w-3.5 h-3.5" /> Mostrar menos</> : <><ChevronDown className="w-3.5 h-3.5" /> Mostrar todos ({productivity.length})</>}
        </button>
      )}
    </div>
  );
}