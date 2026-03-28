import React from 'react';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import MinMaxMedianTable from './MinMaxMedianTable';
import HorizontalBarList from './HorizontalBarList';
import { calcStats, formatCurrency, formatPercent } from './insightsUtils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Wallet, TrendingUp, DollarSign, Percent } from 'lucide-react';

const TT = { borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', padding: '8px 14px', fontSize: 12 };

export default function InsightsProfitabilitySection({ proposals, partners, pixProposals }) {
  const allProposals = [...proposals, ...pixProposals];
  const current = allProposals.filter(p => p.isCurrentVersion !== false);

  const revenues = [], costs = [], margins = [];
  const marginPcts = [];
  const byPartner = {};

  current.forEach(p => {
    if (p.estimatedRevenue > 0) revenues.push(p.estimatedRevenue);
    if (p.estimatedCost > 0) costs.push(p.estimatedCost);
    if (p.estimatedMargin !== undefined && p.estimatedMargin !== null) margins.push(p.estimatedMargin);
    const pd = p.profitabilityDetails || {};
    if (pd.margemPercentual > 0) marginPcts.push(pd.margemPercentual);

    const pName = p.chosenPartnerName || 'N/A';
    if (!byPartner[pName]) byPartner[pName] = { revenue: 0, cost: 0, margin: 0, count: 0 };
    byPartner[pName].revenue += (p.estimatedRevenue || 0);
    byPartner[pName].cost += (p.estimatedCost || 0);
    byPartner[pName].margin += (p.estimatedMargin || 0);
    byPartner[pName].count++;
  });

  const revenueStats = calcStats(revenues);
  const costStats = calcStats(costs);
  const marginStats = calcStats(margins);
  const marginPctStats = calcStats(marginPcts);

  // Pipeline revenue
  const openStatuses = ['enviada', 'visualizada', 'contraproposta'];
  const pipelineRevenue = current.filter(p => openStatuses.includes(p.status)).reduce((s, p) => s + (p.estimatedRevenue || 0), 0);
  const acceptedRevenue = current.filter(p => p.status === 'aceita').reduce((s, p) => s + (p.estimatedRevenue || 0), 0);

  // Revenue at risk (near expiry)
  const now = new Date();
  const riskRevenue = current.filter(p => {
    if (!['enviada', 'visualizada'].includes(p.status) || !p.validUntil) return false;
    const expiry = new Date(p.validUntil);
    const daysLeft = (expiry - now) / (1000 * 60 * 60 * 24);
    return daysLeft >= 0 && daysLeft <= 7;
  }).reduce((s, p) => s + (p.estimatedRevenue || 0), 0);

  const partnerBarData = Object.entries(byPartner)
    .filter(([_, d]) => d.count > 0 && d.revenue > 0)
    .sort((a, b) => b[1].margin - a[1].margin)
    .slice(0, 10)
    .map(([name, d]) => ({
      name: name.length > 15 ? name.substring(0, 15) + '…' : name,
      Receita: Math.round(d.revenue),
      Custo: Math.round(d.cost),
      Margem: Math.round(d.margin),
    }));

  const hasData = revenues.length > 0 || margins.length > 0;

  if (!hasData) {
    return (
      <div className="rounded-3xl bg-white border border-slate-100 p-12 text-center mt-2">
        <p className="text-sm text-[#002443]/50">Nenhuma proposta com dados de rentabilidade calculados.</p>
        <p className="text-xs text-[#002443]/30 mt-1">Os dados aparecerão quando propostas tiverem cálculos de receita/custo/margem.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-2">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Receita Pipeline" value={formatCurrency(pipelineRevenue)} subtitle="Propostas em aberto" icon={DollarSign} />
        <StatCard label="Receita Realizada" value={formatCurrency(acceptedRevenue)} subtitle="Propostas aceitas" icon={TrendingUp} accentColor="#2bc196" />
        <StatCard label="Revenue at Risk" value={formatCurrency(riskRevenue)} subtitle="Expira em ≤7 dias" icon={DollarSign} accentColor="#ef4444" />
        <StatCard label="Margem Mediana" value={formatCurrency(marginStats.median)} subtitle={`${marginPctStats.median}% med.`} icon={Wallet} />
        <StatCard label="Propostas" value={current.length} subtitle={`${revenues.length} c/ rentab.`} icon={Percent} />
      </div>

      <MinMaxMedianTable
        title="Rentabilidade — Mín / Mediana / Média / Máx"
        rows={[
          { label: 'Receita Estimada (R$/mês)', stats: revenueStats },
          { label: 'Custo Estimado (R$/mês)', stats: costStats },
          { label: 'Margem Estimada (R$/mês)', stats: marginStats },
          { label: 'Margem (%)', stats: marginPctStats },
        ].filter(r => r.stats.count > 0)}
        formatter={v => v?.toFixed(2)}
      />

      {partnerBarData.length > 0 && (
        <ChartCard title="Rentabilidade por Parceiro" subtitle="Receita vs Custo vs Margem (R$)">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={partnerBarData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#002443' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip contentStyle={TT} formatter={v => formatCurrency(v)} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Receita" fill="#002443" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Custo" fill="#94a3b8" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Margem" fill="#2bc196" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}