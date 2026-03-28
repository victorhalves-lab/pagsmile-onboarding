import React from 'react';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import HorizontalBarList from './HorizontalBarList';
import { calcStats, formatCurrency, formatPercent } from './insightsUtils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';
import { Handshake, DollarSign, TrendingUp, BarChart3, Percent, Layers, Star } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

const TT = { borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', padding: '8px 14px', fontSize: 12 };
const COLORS = ['#002443', '#2bc196', '#36706c', '#5cf7cf', '#94a3b8', '#f59e0b', '#8b5cf6', '#ef4444'];

export default function InsightsPartnerSection({ partners, proposals, pixProposals, leads }) {
  const { t } = useTranslation();
  const allProposals = [...(proposals || []), ...(pixProposals || [])];
  const currentProposals = allProposals.filter(p => p.isCurrentVersion !== false);

  // ── Partner usage in proposals ──
  const partnerUsage = {};
  currentProposals.forEach(p => {
    const name = p.chosenPartnerName || t('ip.unassigned');
    if (!partnerUsage[name]) partnerUsage[name] = { total: 0, accepted: 0, revenue: 0, cost: 0, margin: 0, statuses: {} };
    partnerUsage[name].total++;
    const st = p.status || 'rascunho';
    partnerUsage[name].statuses[st] = (partnerUsage[name].statuses[st] || 0) + 1;
    if (st === 'aceita') {
      partnerUsage[name].accepted++;
      partnerUsage[name].revenue += (p.estimatedRevenue || 0);
      partnerUsage[name].cost += (p.estimatedCost || 0);
      partnerUsage[name].margin += (p.estimatedMargin || 0);
    }
  });

  // ── Partner MDR analysis ──
  const partnerMDRs = {};
  partners.forEach(p => {
    if (!p.mdrByMcc || p.mdrByMcc.length === 0) return;
    const allRates = [];
    p.mdrByMcc.forEach(mccEntry => {
      if (!mccEntry.rates) return;
      Object.values(mccEntry.rates).forEach(bandeira => {
        if (bandeira.avista) allRates.push(bandeira.avista);
        if (bandeira.de2a6x) allRates.push(bandeira.de2a6x);
        if (bandeira.de7a12x) allRates.push(bandeira.de7a12x);
      });
    });
    if (allRates.length > 0) {
      partnerMDRs[p.name] = calcStats(allRates);
    }
  });

  // ── MCC coverage per partner ──
  const mccCoverage = partners.map(p => ({
    name: p.name,
    mccs: p.mdrByMcc?.length || 0,
    isActive: p.isActive !== false,
    isPrincipal: !!p.isPrincipal,
    hasFees: !!(p.transactionFee || p.antifraudCost || p.threeDSCost),
  }));

  // ── Fee comparison ──
  const feeComparison = partners
    .filter(p => p.isActive !== false)
    .map(p => ({
      name: p.name?.length > 18 ? p.name.substring(0, 18) + '…' : p.name,
      [t('ip.transaction_fee')]: p.transactionFee || 0,
      [t('ip.antifraud')]: p.antifraudCost || 0,
      '3DS': p.threeDSCost || 0,
    }))
    .filter(p => p[t('ip.transaction_fee')] > 0 || p[t('ip.antifraud')] > 0 || p['3DS'] > 0);

  // ── Stats ──
  const totalPartners = partners.length;
  const activePartners = partners.filter(p => p.isActive !== false).length;
  const principalPartner = partners.find(p => p.isPrincipal);
  const proposalsWithPartner = currentProposals.filter(p => p.chosenPartnerName).length;
  const totalAcceptedRevenue = Object.values(partnerUsage).reduce((s, d) => s + d.revenue, 0);

  // ── Pie: proposals distribution ──
  const pieData = Object.entries(partnerUsage)
    .filter(([_, d]) => d.total > 0)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 8)
    .map(([name, d]) => ({ name: name?.length > 20 ? name.substring(0, 20) + '…' : name, value: d.total }));

  // ── Bar: acceptance rate ──
  const acceptanceData = Object.entries(partnerUsage)
    .filter(([_, d]) => d.total >= 2)
    .map(([name, d]) => ({
      name: name?.length > 15 ? name.substring(0, 15) + '…' : name,
      [t('ip.proposals')]: d.total,
      [t('ip.accepted')]: d.accepted,
      [t('ip.rate')]: d.total > 0 ? Math.round((d.accepted / d.total) * 100) : 0,
    }))
    .sort((a, b) => b[t('ip.rate')] - a[t('ip.rate')]);

  // ── MDR bar chart ──
  const mdrBarData = Object.entries(partnerMDRs)
    .sort((a, b) => a[1].median - b[1].median)
    .map(([name, stats]) => ({
      name: name?.length > 15 ? name.substring(0, 15) + '…' : name,
      [t('ip.minimum')]: stats.min,
      [t('ip.median')]: stats.median,
      [t('ip.maximum')]: stats.max,
    }));

  // ── Revenue by partner (horizontal bar) ──
  const revenueByPartner = Object.entries(partnerUsage)
    .filter(([_, d]) => d.revenue > 0)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 10)
    .map(([name, d]) => ({ name, value: Math.round(d.revenue / 1000) }));

  if (totalPartners === 0) {
    return (
      <div className="rounded-3xl bg-white border border-slate-100 p-12 text-center mt-2">
        <Handshake className="w-10 h-10 text-[#002443]/15 mx-auto mb-3" />
        <p className="text-sm text-[#002443]/50">{t('ip.no_partners')}</p>
        <p className="text-xs text-[#002443]/30 mt-1">{t('ip.no_partners_hint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-2">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label={t('ip.total_partners')} value={totalPartners} subtitle={`${activePartners} ${t('ip.active')}`} icon={Handshake} />
        <StatCard label={t('ip.principal')} value={principalPartner?.name || '—'} subtitle={t('ip.main_partner')} icon={Star} accentColor="#f59e0b" />
        <StatCard label={t('ip.proposals_with_partner')} value={proposalsWithPartner} subtitle={`${currentProposals.length > 0 ? Math.round((proposalsWithPartner / currentProposals.length) * 100) : 0}% ${t('ip.of_total')}`} icon={BarChart3} />
        <StatCard label={t('ip.accepted_revenue')} value={formatCurrency(totalAcceptedRevenue)} subtitle={t('ip.from_accepted')} icon={DollarSign} accentColor="#2bc196" />
        <StatCard label={t('ip.mccs_covered')} value={mccCoverage.reduce((s, p) => s + p.mccs, 0)} subtitle={t('ip.across_partners')} icon={Layers} />
      </div>

      {/* Row 1: Pie + Acceptance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {pieData.length > 0 && (
          <ChartCard title={t('ip.proposal_distribution')} subtitle={t('ip.proposal_distribution_sub')}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} innerRadius={55} dataKey="value" paddingAngle={3} strokeWidth={0}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={TT} formatter={(v) => `${v} ${t('ip.proposals').toLowerCase()}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {acceptanceData.length > 0 && (
          <ChartCard title={t('ip.acceptance_by_partner')} subtitle={t('ip.acceptance_by_partner_sub')}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={acceptanceData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#002443' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TT} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey={t('ip.proposals')} fill="#002443" radius={[8, 8, 0, 0]} />
                <Bar dataKey={t('ip.accepted')} fill="#2bc196" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Row 2: MDR + Fees */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {mdrBarData.length > 0 && (
          <ChartCard title={t('ip.mdr_comparison')} subtitle={t('ip.mdr_comparison_sub')}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={mdrBarData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#002443' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={TT} formatter={v => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey={t('ip.minimum')} fill="#5cf7cf" radius={[8, 8, 0, 0]} />
                <Bar dataKey={t('ip.median')} fill="#002443" radius={[8, 8, 0, 0]} />
                <Bar dataKey={t('ip.maximum')} fill="#94a3b8" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {feeComparison.length > 0 && (
          <ChartCard title={t('ip.fee_comparison')} subtitle={t('ip.fee_comparison_sub')}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={feeComparison} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#002443' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
                <Tooltip contentStyle={TT} formatter={v => `R$ ${v.toFixed(2)}`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey={t('ip.transaction_fee')} fill="#002443" radius={[8, 8, 0, 0]} />
                <Bar dataKey={t('ip.antifraud')} fill="#2bc196" radius={[8, 8, 0, 0]} />
                <Bar dataKey="3DS" fill="#36706c" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>

      {/* Revenue by partner */}
      {revenueByPartner.length > 0 && (
        <HorizontalBarList title={t('ip.revenue_by_partner')} data={revenueByPartner} />
      )}

      {/* Partner detail table */}
      <div className="rounded-2xl bg-white border border-slate-100 p-5 overflow-x-auto">
        <h3 className="text-sm font-bold text-[#002443] mb-4">{t('ip.partner_overview')}</h3>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-100">
              {[t('ip.col_partner'), t('ip.col_status'), t('ip.col_model'), t('ip.col_mccs'), t('ip.col_fee'), t('ip.col_antifraud'), t('ip.col_antecipacao'), t('ip.col_proposals'), t('ip.col_revenue')].map((h, i) => (
                <th key={i} className={`text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider pb-3 pr-4 ${i >= 3 ? 'text-right' : ''}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {partners.map((p, i) => {
              const usage = partnerUsage[p.name] || { total: 0, accepted: 0, revenue: 0 };
              return (
                <tr key={i} className="border-b border-slate-50 hover:bg-[#2bc196]/[0.02] transition-colors">
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-[#002443]">{p.name}</span>
                      {p.isPrincipal && <span className="text-[8px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">{t('ip.principal_badge')}</span>}
                    </div>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.isActive !== false ? 'bg-[#2bc196]/10 text-[#2bc196]' : 'bg-red-50 text-red-400'}`}>
                      {p.isActive !== false ? t('ip.active') : t('ip.inactive')}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 text-[10px] text-[#002443]/50">{p.modelo || '—'}</td>
                  <td className="py-2.5 pr-4 text-xs text-[#002443] text-right font-bold">{p.mdrByMcc?.length || 0}</td>
                  <td className="py-2.5 pr-4 text-xs text-[#002443] text-right">{p.transactionFee ? `R$${p.transactionFee.toFixed(2)}` : '—'}</td>
                  <td className="py-2.5 pr-4 text-xs text-[#002443] text-right">{p.antifraudCost ? `R$${p.antifraudCost.toFixed(2)}` : '—'}</td>
                  <td className="py-2.5 pr-4 text-xs text-[#002443] text-right">{p.percentualAntecipacao ? `${p.percentualAntecipacao}%` : '—'}</td>
                  <td className="py-2.5 pr-4 text-xs font-bold text-[#002443] text-right">{usage.total}</td>
                  <td className="py-2.5 text-xs font-bold text-[#2bc196] text-right">{usage.revenue > 0 ? formatCurrency(usage.revenue) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}