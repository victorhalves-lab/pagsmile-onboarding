import React from 'react';
import { DollarSign, Hash, Receipt } from 'lucide-react';
import StatCard from './StatCard';
import MinMaxMedianTable from './MinMaxMedianTable';
import { calcStats, formatCurrency, formatNumber } from './insightsUtils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Card } from '@/components/ui/card';

export default function InsightsTPVSection({ leads }) {
  const tpvStats = calcStats(leads.map(l => l.tpvMensal));
  const ticketStats = calcStats(leads.map(l => l.ticketMedio));
  const txStats = calcStats(leads.map(l => l.transacoesMes));

  // Distribution by segment
  const bySegment = {};
  leads.forEach(l => {
    const seg = l.businessSubCategory || 'N/A';
    if (!bySegment[seg]) bySegment[seg] = { tpvs: [], tickets: [], txs: [] };
    if (l.tpvMensal) bySegment[seg].tpvs.push(l.tpvMensal);
    if (l.ticketMedio) bySegment[seg].tickets.push(l.ticketMedio);
    if (l.transacoesMes) bySegment[seg].txs.push(l.transacoesMes);
  });

  const segmentRows = Object.entries(bySegment).map(([seg, d]) => ({
    segment: seg === 'MERCHAN' ? 'Merchant' : seg === 'GATEWAY' ? 'Gateway' : seg === 'MARKETPLACE' ? 'Marketplace' : seg,
    tpvAvg: calcStats(d.tpvs).avg,
    ticketAvg: calcStats(d.tickets).avg,
    txAvg: calcStats(d.txs).avg,
    count: d.tpvs.length,
  }));

  // TPV ranges for distribution chart
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
    count: leads.filter(l => l.tpvMensal >= r.min && l.tpvMensal < r.max).length,
  }));

  return (
    <div className="space-y-5 mt-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="TPV Total" value={formatCurrency(tpvStats.total)} subtitle={`${tpvStats.count} leads com TPV`} icon={DollarSign} />
        <StatCard label="TPV Mediano" value={formatCurrency(tpvStats.median)} subtitle={`Min: ${formatCurrency(tpvStats.min)}`} icon={DollarSign} />
        <StatCard label="Ticket Médio Mediano" value={formatCurrency(ticketStats.median)} subtitle={`Max: ${formatCurrency(ticketStats.max)}`} icon={Receipt} />
        <StatCard label="Transações/Mês Mediana" value={formatNumber(txStats.median)} subtitle={`Max: ${formatNumber(txStats.max)}`} icon={Hash} />
      </div>

      {/* Table with min/max/median */}
      <MinMaxMedianTable
        title="TPV, Ticket Médio e Transações — Mín / Mediana / Média / Máx"
        rows={[
          { label: 'TPV Mensal (R$)', stats: tpvStats },
          { label: 'Ticket Médio (R$)', stats: ticketStats },
          { label: 'Transações/Mês', stats: txStats },
        ]}
        formatter={formatNumber}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Distribution Chart */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-[#002443] mb-3">Distribuição de TPV Mensal</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tpvDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#2bc196" radius={[4, 4, 0, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* By Segment */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-[#002443] mb-3">Médias por Segmento</h3>
          <div className="space-y-3">
            {segmentRows.map((s, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-semibold">{s.segment}</p>
                  <p className="text-[10px] text-[#002443]/40">{s.count} leads</p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-xs"><span className="text-[#002443]/50">TPV: </span><span className="font-bold">{formatCurrency(s.tpvAvg)}</span></p>
                  <p className="text-xs"><span className="text-[#002443]/50">Ticket: </span><span className="font-bold">{formatCurrency(s.ticketAvg)}</span></p>
                  <p className="text-xs"><span className="text-[#002443]/50">Tx/mês: </span><span className="font-bold">{formatNumber(s.txAvg)}</span></p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}