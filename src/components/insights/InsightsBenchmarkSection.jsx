import React from 'react';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import MinMaxMedianTable from './MinMaxMedianTable';
import HorizontalBarList from './HorizontalBarList';
import DonutChart from './DonutChart';
import { calcStats, formatPercent, formatCurrency } from './insightsUtils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { TrendingDown, Percent, Swords, ArrowDownRight } from 'lucide-react';

const TT = { borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', padding: '8px 14px', fontSize: 12 };

export default function InsightsBenchmarkSection({ leads, proposals }) {
  // 1. Taxas atuais dos clientes (do questionnaireData)
  // Match exato em chaves conhecidas de MDR — evita capturar taxa3ds, taxaForex, taxaSetup, taxasMaquininha, etc.
  const MDR_AVISTA_KEYS = new Set(['mdravista', 'mdr1x', 'mdr_avista', 'mdr_1x', 'taxaavista', 'taxa_avista', 'taxaatual_avista', 'taxaatualavista']);
  const MDR_2A6_KEYS = new Set(['mdr2a6x', 'mdr_2a6x', 'mdrparcelado2a6', 'mdr2a6', 'taxa2a6x', 'taxa_2a6x', 'taxaatual_2a6x']);
  const MDR_7A12_KEYS = new Set(['mdr7a12x', 'mdr_7a12x', 'mdrparcelado7a12', 'mdr7a12', 'taxa7a12x', 'taxa_7a12x', 'taxaatual_7a12x']);
  const PROCESSOR_KEYS = new Set(['processador', 'processadoratual', 'adquirente', 'subadquirente', 'japrocessacom', 'processadoresatuais']);

  const currentRates = { avista: [], de2a6x: [], de7a12x: [] };
  const processorMap = {};

  const pushRate = (bucket, raw) => {
    const num = parseFloat(raw);
    if (isNaN(num) || num <= 0 || num > 50) return;
    bucket.push(num);
  };

  leads.forEach(l => {
    const qd = l.questionnaireData || {};
    Object.entries(qd).forEach(([key, val]) => {
      const k = key.toLowerCase().replace(/[\s-]/g, '');
      if (MDR_AVISTA_KEYS.has(k)) pushRate(currentRates.avista, val);
      else if (MDR_2A6_KEYS.has(k)) pushRate(currentRates.de2a6x, val);
      else if (MDR_7A12_KEYS.has(k)) pushRate(currentRates.de7a12x, val);
      else if (PROCESSOR_KEYS.has(k) && typeof val === 'string' && val.trim()) {
        processorMap[val.trim()] = (processorMap[val.trim()] || 0) + 1;
      }
    });
    // Estrutura aninhada comum: questionnaireData.taxasAtuais
    const ta = qd.taxasAtuais || qd.taxas_atuais;
    if (ta && typeof ta === 'object') {
      pushRate(currentRates.avista, ta.avista ?? ta.mdr1x);
      pushRate(currentRates.de2a6x, ta.de2a6x ?? ta.mdr2a6x);
      pushRate(currentRates.de7a12x, ta.de7a12x ?? ta.mdr7a12x);
    }
  });

  // Taxas esperadas dos leads (campo expectedRates)
  const expectedMdr1x = [], expectedMdr2a6x = [], expectedMdr7a12x = [];
  const expectedAntecipacao = [], expectedFee = [], expectedAntifraude = [];
  leads.forEach(l => {
    const er = l.expectedRates || {};
    if (er.mdr1x > 0) expectedMdr1x.push(er.mdr1x);
    if (er.mdr2a6x > 0) expectedMdr2a6x.push(er.mdr2a6x);
    if (er.mdr7a12x > 0) expectedMdr7a12x.push(er.mdr7a12x);
    if (er.antecipacao > 0) expectedAntecipacao.push(er.antecipacao);
    if (er.feeTransacao > 0) expectedFee.push(er.feeTransacao);
    if (er.antifraude > 0) expectedAntifraude.push(er.antifraude);
  });

  // Taxas propostas (da entidade Proposal)
  const proposedAvista = [], proposedDe2a6x = [], proposedDe7a12x = [];
  const current = proposals.filter(p => p.isCurrentVersion !== false);
  current.forEach(p => {
    const cartao = p.rates?.cartao || {};
    ['visa', 'mastercard', 'elo'].forEach(brand => {
      const b = cartao[brand] || {};
      if (b.avista > 0) proposedAvista.push(b.avista);
      if (b.de2a6x > 0) proposedDe2a6x.push(b.de2a6x);
      if (b.de7a12x > 0) proposedDe7a12x.push(b.de7a12x);
    });
  });

  const expectedStats = calcStats(expectedMdr1x);
  const proposedStats = calcStats(proposedAvista);

  // Comparação: Esperada vs Proposta
  const comparisonData = [
    { name: 'À Vista', esperada: calcStats(expectedMdr1x).median, proposta: calcStats(proposedAvista).median },
    { name: '2-6x', esperada: calcStats(expectedMdr2a6x).median, proposta: calcStats(proposedDe2a6x).median },
    { name: '7-12x', esperada: calcStats(expectedMdr7a12x).median, proposta: calcStats(proposedDe7a12x).median },
  ].filter(d => d.esperada > 0 || d.proposta > 0);

  // Economia média
  const savings = comparisonData.filter(d => d.esperada > 0 && d.proposta > 0).map(d => d.esperada - d.proposta);
  const avgSaving = savings.length > 0 ? savings.reduce((a, b) => a + b, 0) / savings.length : 0;

  // Processador distribution
  const processorData = Object.entries(processorMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));

  // Win rate por status de proposta
  const accepted = current.filter(p => p.status === 'aceita').length;
  const rejected = current.filter(p => p.status === 'recusada').length;
  const sent = current.filter(p => ['enviada', 'visualizada', 'aceita', 'recusada', 'contraproposta'].includes(p.status)).length;
  const winRate = sent > 0 ? ((accepted / sent) * 100).toFixed(1) : 0;

  // Tabela de todas as taxas
  const rateRows = [
    { label: 'MDR À Vista - Esperada (%)', stats: calcStats(expectedMdr1x) },
    { label: 'MDR À Vista - Proposta (%)', stats: calcStats(proposedAvista) },
    { label: 'MDR 2-6x - Esperada (%)', stats: calcStats(expectedMdr2a6x) },
    { label: 'MDR 2-6x - Proposta (%)', stats: calcStats(proposedDe2a6x) },
    { label: 'MDR 7-12x - Esperada (%)', stats: calcStats(expectedMdr7a12x) },
    { label: 'MDR 7-12x - Proposta (%)', stats: calcStats(proposedDe7a12x) },
    { label: 'Antecipação Esperada (%)', stats: calcStats(expectedAntecipacao) },
    { label: 'Fee Transação Esperado (R$)', stats: calcStats(expectedFee) },
    { label: 'Antifraude Esperado (R$)', stats: calcStats(expectedAntifraude) },
  ].filter(r => r.stats.count > 0);

  return (
    <div className="space-y-6 mt-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="MDR Esperado Med." value={`${expectedStats.median}%`} subtitle={`${expectedStats.count} leads`} icon={Percent} />
        <StatCard label="MDR Proposto Med." value={`${proposedStats.median}%`} subtitle={`${proposedStats.count} propostas`} icon={Percent} />
        <StatCard label="Economia Média" value={`${avgSaving.toFixed(2)}pp`} subtitle="Esperada vs Proposta" icon={ArrowDownRight} accentColor={avgSaving > 0 ? '#2bc196' : '#ef4444'} />
        <StatCard label="Win Rate" value={`${winRate}%`} subtitle={`${accepted}/${sent} propostas`} icon={Swords} />
      </div>

      {rateRows.length > 0 && (
        <MinMaxMedianTable title="Benchmark: Taxas Esperadas vs Propostas" rows={rateRows} formatter={v => v?.toFixed(2)} />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {comparisonData.length > 0 && (
          <ChartCard title="Esperada vs Proposta (Mediana MDR)" subtitle="Crédito por faixa de parcelamento">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={comparisonData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#002443' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} unit="%" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TT} formatter={v => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="esperada" fill="#94a3b8" name="Esperada pelo Lead" radius={[8, 8, 0, 0]} />
                <Bar dataKey="proposta" fill="#2bc196" name="Proposta Pagsmile" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {processorData.length > 0 && (
          <HorizontalBarList title="Processador Atual dos Leads" data={processorData} color="#002443" />
        )}
      </div>
    </div>
  );
}