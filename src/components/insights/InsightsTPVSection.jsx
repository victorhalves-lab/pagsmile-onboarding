import React from 'react';
import { DollarSign, Hash, Receipt } from 'lucide-react';
import StatCard from './StatCard';
import MinMaxMedianTable from './MinMaxMedianTable';
import ChartCard from './ChartCard';
import { calcStats, formatCurrency, formatNumber } from './insightsUtils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';

const chartTooltipStyle = { borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', padding: '8px 14px', fontSize: 12 };

export default function InsightsTPVSection({ leads }) {
  const tpvStats = calcStats(leads.map(l => l.tpvMensal));
  const ticketStats = calcStats(leads.map(l => l.ticketMedio));
  const txStats = calcStats(leads.map(l => l.transacoesMes));

  const bySegment = {};
  leads.forEach(l => {
    const seg = l.businessSubCategory || 'N/A';
    if (!bySegment[seg]) bySegment[seg] = { tpvs: [], tickets: [], txs: [] };
    if (l.tpvMensal) bySegment[seg].tpvs.push(l.tpvMensal);
    if (l.ticketMedio) bySegment[seg].tickets.push(l.ticketMedio);
    if (l.transacoesMes) bySegment[seg].txs.push(l.transacoesMes);
  });
  const segLabel = (s) => s === 'MERCHAN' ? 'Merchant' : s === 'GATEWAY' ? 'Gateway' : s === 'MARKETPLACE' ? 'Marketplace' : s;
  const segmentBarData = Object.entries(bySegment).map(([seg, d]) => ({
    name: segLabel(seg),
    'TPV Médio': Math.round(calcStats(d.tpvs).avg),
    'Ticket Médio': Math.round(calcStats(d.tickets).avg),
  }));

  const ranges = [
    { label: '< 50K', min: 0, max: 50000 },
    { label: '50K-200K', min: 50000, max: 200000 },
    { label: '200K-500K', min: 200000, max: 500000 },
    { label: '500K-1M', min: 500000, max: 1000000 },
    { label: '1M-5M', min: 1000000, max: 5000000 },
    { label: '> 5M', min: 5000000, max: Infinity },
  ];
  const tpvDistribution = ranges.map(r => ({
    name: r.label,
    Leads: leads.filter(l => l.tpvMensal >= r.min && l.tpvMensal < r.max).length,
  }));

  const timeline = {};
  leads.forEach(l => {
    if (!l.tpvMensal) return;
    const d = new Date(l.created_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!timeline[key]) timeline[key] = { tpvTotal: 0, count: 0 };
    timeline[key].tpvTotal += l.tpvMensal;
    timeline[key].count++;
  });
  const timelineData = Object.entries(timeline).sort().map(([month, d]) => ({
    name: month, 'TPV Acumulado': d.tpvTotal,
  }));

  const ticketRanges = [
    { label: '< R$50', min: 0, max: 50 },
    { label: 'R$50-200', min: 50, max: 200 },
    { label: 'R$200-500', min: 200, max: 500 },
    { label: 'R$500-1K', min: 500, max: 1000 },
    { label: '> R$1K', min: 1000, max: Infinity },
  ];
  const ticketDist = ticketRanges.map(r => ({
    name: r.label,
    Leads: leads.filter(l => l.ticketMedio >= r.min && l.ticketMedio < r.max).length,
  }));

  return (
    <div className="space-y-6 mt-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="TPV Total Potencial" value={formatCurrency(tpvStats.total)} subtitle={`${tpvStats.count} leads com TPV`} icon={DollarSign} />
        <StatCard label="TPV Mediano" value={formatCurrency(tpvStats.median)} subtitle={`Média: ${formatCurrency(tpvStats.avg)}`} icon={DollarSign} />
        <StatCard label="Ticket Médio Med." value={formatCurrency(ticketStats.median)} subtitle={`Max: ${formatCurrency(ticketStats.max)}`} icon={Receipt} />
        <StatCard label="Transações/Mês Med." value={formatNumber(txStats.median)} subtitle={`Max: ${formatNumber(txStats.max)}`} icon={Hash} />
      </div>

      <MinMaxMedianTable
        title="TPV, Ticket Médio e Transações — Mín / Mediana / Média / Máx"
        rows={[
          { label: 'TPV Mensal (R$)', stats: tpvStats },
          { label: 'Ticket Médio (R$)', stats: ticketStats },
          { label: 'Transações/Mês', stats: txStats },
        ]}
        formatter={formatNumber}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Distribuição de TPV Mensal" subtitle={`${tpvStats.count} leads`}>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={tpvDistribution} barCategoryGap="25%">
              <defs>
                <linearGradient id="tpvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2bc196" />
                  <stop offset="100%" stopColor="#2bc196" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#002443' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="Leads" fill="url(#tpvGrad)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Distribuição de Ticket Médio">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ticketDist} barCategoryGap="25%">
              <defs>
                <linearGradient id="ticketGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#002443" />
                  <stop offset="100%" stopColor="#002443" stopOpacity={0.4} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#002443' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="Leads" fill="url(#ticketGrad)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="TPV Médio por Segmento">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={segmentBarData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#002443' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(val) => formatCurrency(val)} />
              <Bar dataKey="TPV Médio" fill="#2bc196" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Ticket Médio" fill="#002443" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {timelineData.length > 1 && (
          <ChartCard title="TPV Potencial ao Longo do Tempo">
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={timelineData}>
                <defs>
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2bc196" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#2bc196" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip contentStyle={chartTooltipStyle} formatter={(val) => formatCurrency(val)} />
                <Area type="monotone" dataKey="TPV Acumulado" stroke="#2bc196" fill="url(#areaGrad)" strokeWidth={2.5} dot={{ r: 4, fill: '#2bc196', stroke: '#fff', strokeWidth: 2 }} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        )}
      </div>
    </div>
  );
}