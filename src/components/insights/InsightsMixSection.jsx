import React from 'react';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import DonutChart from './DonutChart';
import HorizontalBarList from './HorizontalBarList';
import { calcStats, formatPercent } from './insightsUtils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { CreditCard, Banknote, QrCode, Layers } from 'lucide-react';

const TT = { borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', padding: '8px 14px', fontSize: 12 };

export default function InsightsMixSection({ leads }) {
  const creditPcts = [], pixPcts = [], boletoPcts = [];
  const visaPcts = [], masterPcts = [], eloOutrasPcts = [];
  const vistaPcts = [], parc26Pcts = [], parc712Pcts = [];

  leads.forEach(l => {
    const qd = l.questionnaireData || {};
    Object.entries(qd).forEach(([key, val]) => {
      const num = parseFloat(val);
      if (isNaN(num) || num < 0 || num > 100) return;
      const k = (key + '').toLowerCase();
      // TPV Distribution
      if (k.includes('cartão de crédito') && k.includes('%')) creditPcts.push(num);
      else if (k.includes('pix') && k.includes('%') && !k.includes('med') && !k.includes('taxa')) pixPcts.push(num);
      else if (k.includes('boleto') && k.includes('%')) boletoPcts.push(num);
      // Bandeira Distribution
      else if (k.includes('visa') && k.includes('%')) visaPcts.push(num);
      else if (k.includes('mastercard') && k.includes('%')) masterPcts.push(num);
      else if (k.includes('elo') && k.includes('%') && (k.includes('bandeira') || k.includes('amex'))) eloOutrasPcts.push(num);
      // Parcelamento
      else if (k.includes('à vista') && k.includes('%') && k.includes('parcelamento')) vistaPcts.push(num);
      else if (k.includes('2') && k.includes('6') && k.includes('%')) parc26Pcts.push(num);
      else if (k.includes('7') && k.includes('12') && k.includes('%')) parc712Pcts.push(num);
    });
  });

  // Also check raw Question IDs from V1
  const V1_IDS = {
    cartao: '69a5cd22afab70a7ca2184e9', pix: '69a5cd22afab70a7ca2184ea', boleto: '69a5cd22afab70a7ca2184eb',
    visa: '69a5cd22afab70a7ca2184ec', master: '69a5cd22afab70a7ca2184ed', eloOutras: '69a5cd22afab70a7ca2184ee',
    vista: '69a5cd22afab70a7ca2184ef', parc26: '69a5cd22afab70a7ca2184f0', parc712: '69a5cd22afab70a7ca2184f1',
  };
  leads.forEach(l => {
    const qd = l.questionnaireData || {};
    const p = (id) => { const v = parseFloat(qd[id]); return (!isNaN(v) && v >= 0 && v <= 100) ? v : null; };
    const v1c = p(V1_IDS.cartao); if (v1c !== null && !creditPcts.includes(v1c)) creditPcts.push(v1c);
    const v1p = p(V1_IDS.pix); if (v1p !== null && !pixPcts.includes(v1p)) pixPcts.push(v1p);
    const v1b = p(V1_IDS.boleto); if (v1b !== null && !boletoPcts.includes(v1b)) boletoPcts.push(v1b);
    const v1v = p(V1_IDS.visa); if (v1v !== null && !visaPcts.includes(v1v)) visaPcts.push(v1v);
    const v1m = p(V1_IDS.master); if (v1m !== null && !masterPcts.includes(v1m)) masterPcts.push(v1m);
    const v1e = p(V1_IDS.eloOutras); if (v1e !== null && !eloOutrasPcts.includes(v1e)) eloOutrasPcts.push(v1e);
    const v1vi = p(V1_IDS.vista); if (v1vi !== null && !vistaPcts.includes(v1vi)) vistaPcts.push(v1vi);
    const v1p26 = p(V1_IDS.parc26); if (v1p26 !== null && !parc26Pcts.includes(v1p26)) parc26Pcts.push(v1p26);
    const v1p712 = p(V1_IDS.parc712); if (v1p712 !== null && !parc712Pcts.includes(v1p712)) parc712Pcts.push(v1p712);
  });

  const creditStats = calcStats(creditPcts);
  const pixStats = calcStats(pixPcts);
  const boletoStats = calcStats(boletoPcts);

  const tpvMixData = [
    { name: 'Cartão', value: Math.round(creditStats.median) || 0 },
    { name: 'PIX', value: Math.round(pixStats.median) || 0 },
    { name: 'Boleto', value: Math.round(boletoStats.median) || 0 },
  ].filter(d => d.value > 0);

  const bandeiraMixData = [
    { name: 'Visa', value: Math.round(calcStats(visaPcts).median) || 0 },
    { name: 'Mastercard', value: Math.round(calcStats(masterPcts).median) || 0 },
    { name: 'Elo/Amex/Outras', value: Math.round(calcStats(eloOutrasPcts).median) || 0 },
  ].filter(d => d.value > 0);

  const parcMixData = [
    { name: 'À Vista (1x)', value: Math.round(calcStats(vistaPcts).median) || 0 },
    { name: '2x a 6x', value: Math.round(calcStats(parc26Pcts).median) || 0 },
    { name: '7x a 12x', value: Math.round(calcStats(parc712Pcts).median) || 0 },
  ].filter(d => d.value > 0);

  // Mix por segmento
  const segMix = {};
  leads.forEach(l => {
    const seg = l.businessSubCategory || 'N/A';
    const qd = l.questionnaireData || {};
    if (!segMix[seg]) segMix[seg] = { credit: [], pix: [], boleto: [] };
    const pc = parseFloat(qd[V1_IDS.cartao]); if (!isNaN(pc) && pc >= 0) segMix[seg].credit.push(pc);
    const pp = parseFloat(qd[V1_IDS.pix]); if (!isNaN(pp) && pp >= 0) segMix[seg].pix.push(pp);
    const pb = parseFloat(qd[V1_IDS.boleto]); if (!isNaN(pb) && pb >= 0) segMix[seg].boleto.push(pb);
  });
  const segLabel = s => s === 'MERCHAN' ? 'Merchant' : s === 'GATEWAY' ? 'Gateway' : s === 'MARKETPLACE' ? 'Marketplace' : s;
  const segBarData = Object.entries(segMix).filter(([_, d]) => d.credit.length > 0).map(([seg, d]) => ({
    name: segLabel(seg),
    'Cartão': Math.round(calcStats(d.credit).median),
    'PIX': Math.round(calcStats(d.pix).median),
    'Boleto': Math.round(calcStats(d.boleto).median),
  }));

  const hasData = tpvMixData.length > 0 || bandeiraMixData.length > 0 || parcMixData.length > 0;

  if (!hasData) {
    return (
      <div className="rounded-3xl bg-white border border-slate-100 p-12 text-center mt-2">
        <p className="text-sm text-[#0A0A0A]/50">Nenhum lead possui dados de mix de pagamento preenchidos ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="% Cartão Med." value={`${creditStats.median}%`} subtitle={`${creditStats.count} leads`} icon={CreditCard} />
        <StatCard label="% PIX Med." value={`${pixStats.median}%`} subtitle={`${pixStats.count} leads`} icon={QrCode} />
        <StatCard label="% Boleto Med." value={`${boletoStats.median}%`} subtitle={`${boletoStats.count} leads`} icon={Banknote} />
        <StatCard label="Leads com Mix" value={creditStats.count} icon={Layers} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tpvMixData.length > 0 && <DonutChart title="Mix TPV (Mediana %)" data={tpvMixData} colorMap={{ Cartão: '#0A0A0A', PIX: '#1356E2', Boleto: '#f59e0b' }} />}
        {bandeiraMixData.length > 0 && <DonutChart title="Mix Bandeiras (Mediana %)" data={bandeiraMixData} colorMap={{ Visa: '#1a1f71', Mastercard: '#eb001b', 'Elo/Amex/Outras': '#94a3b8' }} />}
        {parcMixData.length > 0 && <DonutChart title="Mix Parcelamento (Mediana %)" data={parcMixData} colorMap={{ 'À Vista (1x)': '#1356E2', '2x a 6x': '#0A0A0A', '7x a 12x': '#f59e0b' }} />}
      </div>

      {segBarData.length > 1 && (
        <ChartCard title="Mix de Pagamento por Segmento" subtitle="Mediana % por método">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={segBarData} barCategoryGap="25%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#0A0A0A' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} unit="%" axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT} formatter={v => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Cartão" fill="#0A0A0A" radius={[8, 8, 0, 0]} />
              <Bar dataKey="PIX" fill="#1356E2" radius={[8, 8, 0, 0]} />
              <Bar dataKey="Boleto" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}