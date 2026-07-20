import React from 'react';
import MinMaxMedianTable from './MinMaxMedianTable';
import { calcStats, formatPercent } from './insightsUtils';
import ChartCard from './ChartCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const chartTooltipStyle = { borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', padding: '8px 14px', fontSize: 12 };

export default function InsightsProposalRatesSection({ proposals }) {
  // Only current versions
  const current = proposals.filter(p => p.isCurrentVersion !== false);

  const visaAvista = [], visa2a6 = [], visa7a12 = [], visa13a21 = [];
  const mcAvista = [], mc2a6 = [], mc7a12 = [], mc13a21 = [];
  const allAntifraude = [], allFee = [], allTaxa3ds = [], allSetup = [];
  const allAntecipacao = [], allRavTaxa = [], allPixValues = [], allBoleto = [];
  const allDebitoVisa = [], allDebitoMc = [];

  current.forEach(p => {
    const r = p.rates;
    if (!r) return;
    
    // Visa
    const v = r.cartao?.visa;
    if (v) {
      if (v.avista) visaAvista.push(v.avista);
      if (v.de2a6x) visa2a6.push(v.de2a6x);
      if (v.de7a12x) visa7a12.push(v.de7a12x);
      if (v.de13a21x) visa13a21.push(v.de13a21x);
    }
    // MC
    const m = r.cartao?.mastercard;
    if (m) {
      if (m.avista) mcAvista.push(m.avista);
      if (m.de2a6x) mc2a6.push(m.de2a6x);
      if (m.de7a12x) mc7a12.push(m.de7a12x);
      if (m.de13a21x) mc13a21.push(m.de13a21x);
    }
    // Débito
    if (r.debito?.visa) allDebitoVisa.push(r.debito.visa);
    if (r.debito?.mastercard) allDebitoMc.push(r.debito.mastercard);

    // Others
    if (r.antifraude) allAntifraude.push(r.antifraude);
    if (r.feeTransacao) allFee.push(r.feeTransacao);
    if (r.taxa3ds) allTaxa3ds.push(r.taxa3ds);
    if (r.setup) allSetup.push(r.setup);
    if (r.percentualAntecipacao) allAntecipacao.push(r.percentualAntecipacao);
    if (r.rav?.taxa) allRavTaxa.push(r.rav.taxa);
    if (r.pix?.valor) allPixValues.push(r.pix.valor);
    if (r.boleto) allBoleto.push(r.boleto);
  });

  const visaRows = [
    { label: 'Visa À Vista (%)', stats: calcStats(visaAvista) },
    { label: 'Visa 2-6x (%)', stats: calcStats(visa2a6) },
    { label: 'Visa 7-12x (%)', stats: calcStats(visa7a12) },
    { label: 'Visa 13-21x (%)', stats: calcStats(visa13a21) },
  ].filter(r => r.stats.count > 0);

  const mcRows = [
    { label: 'MC À Vista (%)', stats: calcStats(mcAvista) },
    { label: 'MC 2-6x (%)', stats: calcStats(mc2a6) },
    { label: 'MC 7-12x (%)', stats: calcStats(mc7a12) },
    { label: 'MC 13-21x (%)', stats: calcStats(mc13a21) },
  ].filter(r => r.stats.count > 0);

  const debitRows = [
    { label: 'Débito Visa (%)', stats: calcStats(allDebitoVisa) },
    { label: 'Débito MC (%)', stats: calcStats(allDebitoMc) },
  ].filter(r => r.stats.count > 0);

  const feeRows = [
    { label: 'Antifraude (R$)', stats: calcStats(allAntifraude) },
    { label: 'Fee Transação (R$)', stats: calcStats(allFee) },
    { label: 'Taxa 3DS (R$)', stats: calcStats(allTaxa3ds) },
    { label: 'Setup (R$)', stats: calcStats(allSetup) },
    { label: 'Boleto (R$)', stats: calcStats(allBoleto) },
    { label: 'PIX (valor)', stats: calcStats(allPixValues) },
    { label: 'RAV/Antecipação Taxa (%)', stats: calcStats(allRavTaxa) },
    { label: 'Antecipação Percentual (%)', stats: calcStats(allAntecipacao) },
  ].filter(r => r.stats.count > 0);

  // Comparison chart Visa vs MC
  const compData = ['À Vista', '2-6x', '7-12x', '13-21x'].map((label, i) => ({
    name: label,
    visa: [visaAvista, visa2a6, visa7a12, visa13a21][i].length > 0 ? calcStats([visaAvista, visa2a6, visa7a12, visa13a21][i]).median : 0,
    mastercard: [mcAvista, mc2a6, mc7a12, mc13a21][i].length > 0 ? calcStats([mcAvista, mc2a6, mc7a12, mc13a21][i]).median : 0,
  }));

  return (
    <div className="space-y-6 mt-2">
      <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 border border-slate-100">
        <div className="w-2 h-2 rounded-full bg-[#1356E2]" />
        <span className="text-[11px] font-bold text-[#0A0A0A]/50">{current.length} propostas (versão atual) analisadas</span>
      </div>

      {visaRows.length > 0 && (
        <MinMaxMedianTable title="MDR Crédito Visa — Propostas Enviadas" rows={visaRows} formatter={formatPercent} />
      )}
      {mcRows.length > 0 && (
        <MinMaxMedianTable title="MDR Crédito Mastercard — Propostas Enviadas" rows={mcRows} formatter={formatPercent} />
      )}
      {debitRows.length > 0 && (
        <MinMaxMedianTable title="Taxas de Débito — Propostas Enviadas" rows={debitRows} formatter={formatPercent} />
      )}
      {feeRows.length > 0 && (
        <MinMaxMedianTable title="Fees, Custos & Antecipação — Propostas Enviadas" rows={feeRows} formatter={(v) => typeof v === 'number' ? v.toFixed(2) : v} />
      )}

      {compData.some(d => d.visa > 0 || d.mastercard > 0) && (
        <ChartCard title="Mediana MDR Crédito: Visa vs Mastercard">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={compData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#0A0A0A' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} unit="%" axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="visa" fill="#1a1f71" name="Visa" radius={[8, 8, 0, 0]} />
              <Bar dataKey="mastercard" fill="#eb001b" name="Mastercard" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}