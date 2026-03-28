import React from 'react';
import { DollarSign, Hash, Receipt, TrendingUp } from 'lucide-react';
import StatCard from './StatCard';
import MinMaxMedianTable from './MinMaxMedianTable';
import { calcStats, formatCurrency, formatNumber } from './insightsUtils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { Card } from '@/components/ui/card';

export default function InsightsTPVSection({ leads }) {
  const tpvStats = calcStats(leads.map(l => l.tpvMensal));
  const ticketStats = calcStats(leads.map(l => l.ticketMedio));
  const txStats = calcStats(leads.map(l => l.transacoesMes));

  // By segment
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
    count: d.tpvs.length,
  }));

  // TPV ranges
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

  // Timeline (by month)
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
    name: month,
    'TPV Acumulado': d.tpvTotal,
    Leads: d.count,
  }));

  // Ticket ranges
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
    <div className="space-y-6 mt-4">
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
        {/* Distribution */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-[#002443] mb-3">Distribuição de TPV Mensal</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={tpvDistribution} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="Leads" fill="#2bc196" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Ticket distribution */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-[#002443] mb-3">Distribuição de Ticket Médio</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={ticketDist} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="Leads" fill="#002443" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Segment comparison */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-[#002443] mb-3">TPV Médio por Segmento</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={segmentBarData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(val) => formatCurrency(val)} />
              <Bar dataKey="TPV Médio" fill="#2bc196" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Ticket Médio" fill="#002443" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Timeline */}
        {timelineData.length > 1 && (
          <Card className="p-4">
            <h3 className="text-sm font-bold text-[#002443] mb-3">TPV Potencial ao Longo do Tempo</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(val) => formatCurrency(val)} />
                <Area type="monotone" dataKey="TPV Acumulado" stroke="#2bc196" fill="#2bc196" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    </div>
  );
}