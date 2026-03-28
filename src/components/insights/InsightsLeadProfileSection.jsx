import React from 'react';
import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { calcStats, formatNumber } from './insightsUtils';
import MinMaxMedianTable from './MinMaxMedianTable';

const COLORS = ['#2bc196', '#002443', '#36706c', '#5cf7cf', '#94a3b8', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function InsightsLeadProfileSection({ leads }) {
  // Business sub category
  const bizMap = {};
  leads.forEach(l => {
    const cat = l.businessSubCategory || 'N/A';
    bizMap[cat] = (bizMap[cat] || 0) + 1;
  });
  const bizData = Object.entries(bizMap).map(([name, value]) => ({
    name: name === 'MERCHAN' ? 'Merchant' : name === 'GATEWAY' ? 'Gateway' : name === 'MARKETPLACE' ? 'Marketplace' : name,
    value,
  }));

  // MCC distribution
  const mccMap = {};
  leads.forEach(l => {
    if (l.mcc) mccMap[l.mcc] = (mccMap[l.mcc] || 0) + 1;
  });
  const mccData = Object.entries(mccMap).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Risk level distribution
  const riskMap = {};
  leads.forEach(l => {
    const risk = l.priscilaRiskLevel || l.iaDecision || 'N/A';
    riskMap[risk] = (riskMap[risk] || 0) + 1;
  });
  const riskData = Object.entries(riskMap).map(([name, value]) => ({ name, value }));

  // Lead Qualifier Score
  const qualScores = calcStats(leads.map(l => l.leadQualifierScore));
  const riskScores = calcStats(leads.map(l => l.priscilaQualityScore));
  const iaRiskScores = calcStats(leads.map(l => l.iaRiskScore));

  // Growth expectation
  const growthMap = {};
  leads.forEach(l => {
    if (l.expectativaCrescimento) growthMap[l.expectativaCrescimento] = (growthMap[l.expectativaCrescimento] || 0) + 1;
  });
  const growthData = Object.entries(growthMap).map(([name, value]) => ({ name, value }));

  // Lead Qualifier Level distribution
  const qualLevelMap = {};
  leads.forEach(l => {
    const level = l.leadQualifierLevel || 'PENDENTE';
    qualLevelMap[level] = (qualLevelMap[level] || 0) + 1;
  });
  const qualLevelData = Object.entries(qualLevelMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-5 mt-4">
      {/* Scores table */}
      <MinMaxMedianTable
        title="Scores de Qualificação e Risco — Mín / Mediana / Média / Máx"
        rows={[
          { label: 'Lead Qualifier Score (0-100)', stats: qualScores },
          { label: 'PRISCILA Quality Score (0-100)', stats: riskScores },
          { label: 'IA Risk Score (0-100)', stats: iaRiskScores },
        ].filter(r => r.stats.count > 0)}
        formatter={formatNumber}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Business type pie */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-[#002443] mb-3">Tipo de Negócio</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={bizData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {bizData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Risk level pie */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-[#002443] mb-3">Nível de Risco (PRISCILA)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={riskData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {riskData.map((entry, i) => {
                  const colorMap = { BAIXO: '#2bc196', MEDIO: '#f59e0b', ALTO: '#ef4444', CRITICO: '#7c2d12', EM_ANALISE: '#94a3b8' };
                  return <Cell key={i} fill={colorMap[entry.name] || COLORS[i % COLORS.length]} />;
                })}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Lead Qualifier Level */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-[#002443] mb-3">Qualificação do Lead</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={qualLevelData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {qualLevelData.map((entry, i) => {
                  const colorMap = { EXCELENTE: '#2bc196', BOM: '#36706c', REGULAR: '#f59e0b', FRACO: '#ef4444', INSUFICIENTE: '#7c2d12', PENDENTE: '#94a3b8' };
                  return <Cell key={i} fill={colorMap[entry.name] || COLORS[i % COLORS.length]} />;
                })}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Top MCCs */}
        {mccData.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-bold text-[#002443] mb-3">Top 10 MCCs</h3>
            <div className="space-y-2">
              {mccData.map(([mcc, count], i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                  <span className="text-xs font-mono font-medium">{mcc}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-[#2bc196] rounded-full" style={{ width: `${(count / mccData[0][1]) * 100}%` }} />
                    </div>
                    <span className="text-xs font-bold w-6 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Growth expectations */}
        {growthData.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-bold text-[#002443] mb-3">Expectativa de Crescimento</h3>
            <div className="space-y-2">
              {growthData.sort((a, b) => b.value - a.value).map((d, i) => (
                <div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
                  <span className="text-xs font-medium">{d.name}</span>
                  <span className="text-xs font-bold">{d.value} leads</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}