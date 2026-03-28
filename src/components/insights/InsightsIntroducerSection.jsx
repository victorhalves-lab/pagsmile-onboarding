import React from 'react';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import HorizontalBarList from './HorizontalBarList';
import { calcStats, formatCurrency, formatNumber } from './insightsUtils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { UserPlus, Trophy, TrendingUp, DollarSign } from 'lucide-react';

const TT = { borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', padding: '8px 14px', fontSize: 12 };

export default function InsightsIntroducerSection({ leads, proposals }) {
  const introducerMap = {};
  leads.forEach(l => {
    const name = l.introducerName;
    if (!name) return;
    if (!introducerMap[name]) introducerMap[name] = { total: 0, converted: 0, tpvTotal: 0, scores: [], statuses: {} };
    introducerMap[name].total++;
    if (l.tpvMensal > 0) introducerMap[name].tpvTotal += l.tpvMensal;
    if (l.leadQualifierScore > 0) introducerMap[name].scores.push(l.leadQualifierScore);
    const st = l.status || 'N/A';
    introducerMap[name].statuses[st] = (introducerMap[name].statuses[st] || 0) + 1;
    if (['proposta_aceita', 'kyc_iniciado', 'kyc_aprovado', 'ativado'].includes(st)) {
      introducerMap[name].converted++;
    }
  });

  // Proposals per introducer
  const proposalsByIntroducer = {};
  proposals.forEach(p => {
    if (p.status !== 'aceita') return;
    const lead = leads.find(l => l.id === p.leadId);
    if (lead?.introducerName) {
      proposalsByIntroducer[lead.introducerName] = (proposalsByIntroducer[lead.introducerName] || 0) + 1;
    }
  });

  const totalWithIntroducer = leads.filter(l => l.introducerName).length;
  const totalIntroducers = Object.keys(introducerMap).length;

  // Ranking composto: score = (volume * 0.3) + (conversion * 0.3) + (quality * 0.2) + (tpv * 0.2)
  const maxTotal = Math.max(...Object.values(introducerMap).map(d => d.total), 1);
  const maxTPV = Math.max(...Object.values(introducerMap).map(d => d.tpvTotal), 1);
  
  const ranking = Object.entries(introducerMap).map(([name, data]) => {
    const convRate = data.total > 0 ? data.converted / data.total : 0;
    const avgScore = calcStats(data.scores).median;
    const compositeScore = (
      (data.total / maxTotal) * 30 +
      convRate * 30 +
      (avgScore / 100) * 20 +
      (data.tpvTotal / maxTPV) * 20
    );
    return {
      name,
      total: data.total,
      converted: data.converted,
      convRate: (convRate * 100).toFixed(0),
      tpvTotal: data.tpvTotal,
      avgScore: avgScore.toFixed(0),
      compositeScore: compositeScore.toFixed(1),
      proposalsAccepted: proposalsByIntroducer[name] || 0,
    };
  }).sort((a, b) => b.compositeScore - a.compositeScore);

  const barData = ranking.slice(0, 10).map(r => ({
    name: r.name.length > 15 ? r.name.substring(0, 15) + '…' : r.name,
    Leads: r.total,
    Convertidos: r.converted,
  }));

  const tpvData = ranking.filter(r => r.tpvTotal > 0).slice(0, 10).map(r => ({
    name: r.name, value: Math.round(r.tpvTotal / 1000),
  }));

  const avgQuality = calcStats(Object.values(introducerMap).flatMap(d => d.scores));

  return (
    <div className="space-y-6 mt-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Introducers Ativos" value={totalIntroducers} icon={UserPlus} />
        <StatCard label="Leads via Introducer" value={totalWithIntroducer} subtitle={`${leads.length > 0 ? ((totalWithIntroducer / leads.length) * 100).toFixed(0) : 0}% do total`} icon={TrendingUp} />
        <StatCard label="Qualidade Mediana" value={`${avgQuality.median}/100`} subtitle="Lead Qualifier Score" icon={Trophy} />
        <StatCard label="TPV Potencial Total" value={formatCurrency(Object.values(introducerMap).reduce((s, d) => s + d.tpvTotal, 0))} icon={DollarSign} />
      </div>

      {barData.length > 0 && (
        <ChartCard title="Volume e Conversão por Introducer" subtitle="Top 10 por score composto">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={barData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#002443' }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Leads" fill="#002443" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Convertidos" fill="#2bc196" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Ranking Table */}
      {ranking.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-100 p-5 overflow-x-auto">
          <h3 className="text-sm font-bold text-[#002443] mb-4">Ranking Composto de Introducers</h3>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider pb-3 pr-4">#</th>
                <th className="text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider pb-3 pr-4">Introducer</th>
                <th className="text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider pb-3 pr-4 text-right">Leads</th>
                <th className="text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider pb-3 pr-4 text-right">Conv.</th>
                <th className="text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider pb-3 pr-4 text-right">Conv. %</th>
                <th className="text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider pb-3 pr-4 text-right">TPV Potencial</th>
                <th className="text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider pb-3 pr-4 text-right">Qualidade</th>
                <th className="text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider pb-3 text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((r, i) => (
                <tr key={i} className="border-b border-slate-50 hover:bg-[#2bc196]/[0.02] transition-colors">
                  <td className="py-2.5 pr-4"><span className="text-[10px] font-extrabold text-[#002443]/30">{i + 1}</span></td>
                  <td className="py-2.5 pr-4 text-xs font-semibold text-[#002443]">{r.name}</td>
                  <td className="py-2.5 pr-4 text-xs font-bold text-[#002443] text-right">{r.total}</td>
                  <td className="py-2.5 pr-4 text-xs font-bold text-[#2bc196] text-right">{r.converted}</td>
                  <td className="py-2.5 pr-4 text-right">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${parseFloat(r.convRate) >= 50 ? 'bg-[#2bc196]/10 text-[#2bc196]' : parseFloat(r.convRate) >= 25 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-500'}`}>{r.convRate}%</span>
                  </td>
                  <td className="py-2.5 pr-4 text-xs text-[#002443] text-right">{formatCurrency(r.tpvTotal)}</td>
                  <td className="py-2.5 pr-4 text-xs text-[#002443] text-right">{r.avgScore}</td>
                  <td className="py-2.5 text-right"><span className="text-xs font-extrabold text-[#002443]">{r.compositeScore}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tpvData.length > 0 && (
        <HorizontalBarList title="TPV Potencial por Introducer (K)" data={tpvData} />
      )}
    </div>
  );
}