import React from 'react';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import DonutChart from './DonutChart';
import HorizontalBarList from './HorizontalBarList';
import { calcStats, formatNumber, formatCurrency } from './insightsUtils';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ZAxis, Cell } from 'recharts';
import { ShieldAlert, AlertTriangle, Skull, TrendingUp } from 'lucide-react';

const TT = { borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', padding: '8px 14px', fontSize: 12 };

export default function InsightsRiskPortfolioSection({ leads, complianceScores, cases }) {
  // PLD/Compliance flags from questionnaireData
  const pldQuestions = [
    { key: 'comp_q1', label: 'Sócios em listas de sanções' },
    { key: 'comp_q2', label: 'Vínculos com países sancionados' },
    { key: 'comp_q3', label: 'Controle por entidade sancionada' },
    { key: 'comp_q4', label: 'Investigação criminal (12m)' },
    { key: 'comp_q5', label: 'Contas encerradas compliance' },
    { key: 'comp_q6', label: 'Opera com criptomoedas' },
    { key: 'comp_q7', label: 'Jogos/apostas/cassino' },
    { key: 'comp_q8', label: 'Atividade proibida/ilegal' },
    { key: 'comp_q9', label: 'Atividade alto risco' },
    { key: 'comp_q10', label: 'PEP (Pessoa Politicamente Exposta)' },
    { key: 'comp_q11', label: 'Paraísos fiscais' },
  ];

  // Count "Sim" per PLD question across all cases
  const pldCounts = {};
  let totalCasesWithPLD = 0;
  cases.forEach(c => {
    // Try to find matching lead for questionnaire data
    const lead = leads.find(l => l.onboardingCaseId === c.id);
    const qd = lead?.questionnaireData || {};
    let hasPLD = false;
    pldQuestions.forEach(pq => {
      if (qd[pq.key] === true || qd[pq.key] === 'true') {
        pldCounts[pq.label] = (pldCounts[pq.label] || 0) + 1;
        hasPLD = true;
      }
    });
    if (hasPLD) totalCasesWithPLD++;
  });
  const pldData = Object.entries(pldCounts).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

  // Chargeback/Estorno from compliance questionnaire data
  const chargebackMap = {};
  const estornoMap = {};
  const reembolsoMap = {};
  leads.forEach(l => {
    const qd = l.questionnaireData || {};
    Object.entries(qd).forEach(([key, val]) => {
      if (typeof val !== 'string') return;
      const k = key.toLowerCase();
      if (k.includes('chargeback')) chargebackMap[val] = (chargebackMap[val] || 0) + 1;
      if (k.includes('estorno')) estornoMap[val] = (estornoMap[val] || 0) + 1;
      if (k.includes('reembolso') && k.includes('taxa')) reembolsoMap[val] = (reembolsoMap[val] || 0) + 1;
    });
  });

  // Risk-Reward Matrix: TPV vs Risk Score
  const matrixData = leads.filter(l => l.tpvMensal > 0 && (l.iaRiskScore > 0 || l.priscilaQualityScore > 0)).map(l => ({
    x: l.tpvMensal,
    y: l.iaRiskScore || (100 - (l.priscilaQualityScore || 50)),
    name: l.companyName || l.fullName || 'Lead',
    segment: l.businessSubCategory || 'N/A',
  }));

  // Quadrant counts
  const medianTPV = calcStats(matrixData.map(d => d.x)).median;
  const medianRisk = calcStats(matrixData.map(d => d.y)).median;
  const diamonds = matrixData.filter(d => d.x >= medianTPV && d.y <= medianRisk).length;
  const alerts = matrixData.filter(d => d.x >= medianTPV && d.y > medianRisk).length;
  const quickWins = matrixData.filter(d => d.x < medianTPV && d.y <= medianRisk).length;
  const lowPriority = matrixData.filter(d => d.x < medianTPV && d.y > medianRisk).length;

  // Red flags from cases
  const flagMap = {};
  cases.forEach(c => (c.redFlags || []).forEach(f => { flagMap[f.substring(0, 60)] = (flagMap[f.substring(0, 60)] || 0) + 1; }));
  const topFlags = Object.entries(flagMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));

  // Risk classification
  const riskClassMap = {};
  complianceScores.forEach(s => { riskClassMap[s.classificacao_geral || 'N/A'] = (riskClassMap[s.classificacao_geral || 'N/A'] || 0) + 1; });
  const riskClassData = Object.entries(riskClassMap).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6 mt-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Diamantes" value={diamonds} subtitle="Alto TPV + Baixo Risco" icon={TrendingUp} accentColor="#1356E2" />
        <StatCard label="Alertas" value={alerts} subtitle="Alto TPV + Alto Risco" icon={AlertTriangle} accentColor="#ef4444" />
        <StatCard label="Quick Wins" value={quickWins} subtitle="Baixo TPV + Baixo Risco" icon={TrendingUp} accentColor="#f59e0b" />
        <StatCard label="Flags PLD" value={pldData.length > 0 ? pldData.reduce((s, d) => s + d.value, 0) : 0} subtitle={`${totalCasesWithPLD} casos`} icon={Skull} accentColor="#ef4444" />
      </div>

      {matrixData.length > 3 && (
        <ChartCard title="Matriz Risk-Reward" subtitle="TPV Mensal vs Score de Risco — cada ponto = 1 lead">
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" dataKey="x" name="TPV" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} label={{ value: 'TPV Mensal (R$)', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }} />
              <YAxis type="number" dataKey="y" name="Risco" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} label={{ value: 'Risco', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#94a3b8' }} />
              <ZAxis range={[40, 120]} />
              <Tooltip contentStyle={TT} formatter={(val, name) => name === 'TPV' ? formatCurrency(val) : val} />
              <Scatter data={matrixData}>
                {matrixData.map((entry, i) => (
                  <Cell key={i} fill={entry.x >= medianTPV && entry.y <= medianRisk ? '#1356E2' : entry.x >= medianTPV ? '#ef4444' : entry.y <= medianRisk ? '#f59e0b' : '#94a3b8'} opacity={0.7} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pldData.length > 0 && <HorizontalBarList title="Mapa de Calor PLD — Flags 'Sim'" data={pldData} color="#ef4444" />}
        {topFlags.length > 0 && <HorizontalBarList title="Top Red Flags (Compliance)" data={topFlags} color="#f59e0b" />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {riskClassData.length > 0 && <DonutChart title="Classificação de Risco" data={riskClassData} colorMap={{ BAIXO: '#1356E2', MÉDIO: '#f59e0b', ALTO: '#ef4444', CRÍTICO: '#7c2d12' }} />}
        {Object.keys(chargebackMap).length > 0 && <DonutChart title="Faixa de Chargeback" data={Object.entries(chargebackMap).map(([n, v]) => ({ name: n, value: v }))} />}
        {Object.keys(estornoMap).length > 0 && <DonutChart title="Faixa de Estornos" data={Object.entries(estornoMap).map(([n, v]) => ({ name: n, value: v }))} />}
      </div>
    </div>
  );
}