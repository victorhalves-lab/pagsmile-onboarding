import React from 'react';
import MinMaxMedianTable from './MinMaxMedianTable';
import { calcStats, formatPercent, formatCurrency } from './insightsUtils';
import ChartCard from './ChartCard';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const chartTooltipStyle = { borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', padding: '8px 14px', fontSize: 12 };

export default function InsightsRatesSection({ leads }) {
  // Extract expected rates from leads
  const rateFields = leads.map(l => l.expectedRates).filter(Boolean);
  
  // Also extract from questionnaireData for leads that have raw fields
  const allMdr1x = [], allMdr2a6 = [], allMdr7a12 = [], allAntecipacao = [];
  const allFee = [], allAntifraude = [], allTaxa3ds = [], allPixValues = [];

  const pushNum = (bucket, raw) => {
    const n = parseFloat(raw);
    if (!isNaN(n) && n > 0 && n < 100) bucket.push(n);
  };
  // Parser de PIX: aceita "0,3-0,5%" → 0.4, "0.5%" → 0.5
  const parsePixRange = (raw) => {
    if (typeof raw !== 'string') return parseFloat(raw);
    const clean = raw.replace(/%/g, '').replace(/,/g, '.').trim();
    const parts = clean.split('-').map(p => parseFloat(p.trim())).filter(n => !isNaN(n));
    if (parts.length === 2) return (parts[0] + parts[1]) / 2;
    return parts[0];
  };

  leads.forEach(l => {
    const r = l.expectedRates;
    if (r) {
      if (r.mdr1x) allMdr1x.push(r.mdr1x);
      if (r.mdr2a6x) allMdr2a6.push(r.mdr2a6x);
      if (r.mdr7a12x) allMdr7a12.push(r.mdr7a12x);
      if (r.antecipacao) allAntecipacao.push(r.antecipacao);
      if (r.feeTransacao) allFee.push(r.feeTransacao);
      if (r.antifraude) allAntifraude.push(r.antifraude);
      if (r.taxa3ds) allTaxa3ds.push(r.taxa3ds);
      if (r.pix?.valor) allPixValues.push(r.pix.valor);
    }
    // Fallback: questionnaireData (lead V5, lead PIX V4) — usado quando expectedRates é null
    const qd = l.questionnaireData;
    if (qd) {
      const ta = qd.taxasAtuais || qd.taxas_atuais || {};
      pushNum(allMdr1x, ta.avista ?? ta.mdr1x);
      pushNum(allMdr2a6, ta.de2a6x ?? ta.mdr2a6x);
      pushNum(allMdr7a12, ta.de7a12x ?? ta.mdr7a12x);
      pushNum(allAntecipacao, ta.antecipacao);
      pushNum(allFee, ta.feeTransacao);
      pushNum(allAntifraude, ta.antifraude);
      // PIX vem como faixa em string: "0,3-0,5%"
      if (qd.medPix) {
        const pixVal = parsePixRange(qd.medPix);
        if (!isNaN(pixVal) && pixVal > 0) allPixValues.push(pixVal);
      }
    }
  });

  const mdrRows = [
    { label: 'MDR Crédito 1x (%)', stats: calcStats(allMdr1x) },
    { label: 'MDR Crédito 2-6x (%)', stats: calcStats(allMdr2a6) },
    { label: 'MDR Crédito 7-12x (%)', stats: calcStats(allMdr7a12) },
    { label: 'Antecipação (%)', stats: calcStats(allAntecipacao) },
  ];

  const feeRows = [
    { label: 'Fee Transação (R$)', stats: calcStats(allFee) },
    { label: 'Antifraude (R$)', stats: calcStats(allAntifraude) },
    { label: 'Taxa 3DS (R$)', stats: calcStats(allTaxa3ds) },
    { label: 'PIX (valor)', stats: calcStats(allPixValues) },
  ];

  const hasData = mdrRows.some(r => r.stats.count > 0) || feeRows.some(r => r.stats.count > 0);

  // Comparison chart: what leads expect
  const comparisonData = mdrRows.filter(r => r.stats.count > 0).map(r => ({
    name: r.label.replace(' (%)', ''),
    min: r.stats.min,
    mediana: r.stats.median,
    max: r.stats.max,
  }));

  return (
    <div className="space-y-6 mt-2">
      {!hasData ? (
        <div className="rounded-3xl bg-white border border-slate-100 p-12 text-center">
          <p className="text-sm text-[#002443]/50">Nenhum lead possui dados de taxas esperadas preenchidos ainda.</p>
          <p className="text-xs text-[#002443]/30 mt-1">Os dados aparecerão conforme os questionários forem respondidos.</p>
        </div>
      ) : (
        <>
          <MinMaxMedianTable
            title="Taxas MDR Esperadas pelos Leads — Mín / Mediana / Média / Máx"
            rows={mdrRows.filter(r => r.stats.count > 0)}
            formatter={formatPercent}
          />

          <MinMaxMedianTable
            title="Fees & Custos Esperados pelos Leads — Mín / Mediana / Média / Máx"
            rows={feeRows.filter(r => r.stats.count > 0)}
            formatter={(v) => `R$ ${v.toFixed(2)}`}
          />

          {comparisonData.length > 0 && (
            <ChartCard title="Distribuição das Taxas MDR Esperadas">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={comparisonData} barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#002443' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} unit="%" axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => `${v}%`} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="min" fill="#94a3b8" name="Mínimo" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="mediana" fill="#2bc196" name="Mediana" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="max" fill="#002443" name="Máximo" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}
        </>
      )}
    </div>
  );
}