import React from 'react';
import MinMaxMedianTable from './MinMaxMedianTable';
import { calcStats, formatPercent, formatCurrency } from './insightsUtils';
import { Card } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

export default function InsightsRatesSection({ leads }) {
  // Extract expected rates from leads
  const rateFields = leads.map(l => l.expectedRates).filter(Boolean);
  
  // Also extract from questionnaireData for leads that have raw fields
  const allMdr1x = [], allMdr2a6 = [], allMdr7a12 = [], allAntecipacao = [];
  const allFee = [], allAntifraude = [], allTaxa3ds = [], allPixValues = [];

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
    // Also try to get from questionnaireData raw fields
    const qd = l.questionnaireData;
    if (qd) {
      // Look for rate-like fields in questionnaire data (common IDs for rates)
      Object.values(qd).forEach(v => {
        // skip non-numeric 
      });
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
    <div className="space-y-5 mt-4">
      {!hasData ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-[#002443]/50">Nenhum lead possui dados de taxas esperadas preenchidos ainda.</p>
          <p className="text-xs text-[#002443]/30 mt-1">Os dados aparecerão conforme os questionários forem respondidos.</p>
        </Card>
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
            <Card className="p-4">
              <h3 className="text-sm font-bold text-[#002443] mb-3">Distribuição das Taxas MDR Esperadas</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Legend />
                  <Bar dataKey="min" fill="#94a3b8" name="Mínimo" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="mediana" fill="#2bc196" name="Mediana" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="max" fill="#002443" name="Máximo" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </>
      )}
    </div>
  );
}