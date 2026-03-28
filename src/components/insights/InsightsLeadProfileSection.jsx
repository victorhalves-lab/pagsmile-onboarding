import React from 'react';
import { Card } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { calcStats, formatNumber } from './insightsUtils';
import MinMaxMedianTable from './MinMaxMedianTable';
import StatCard from './StatCard';
import { Users, TrendingUp, MapPin, Briefcase, UserCheck } from 'lucide-react';
import HorizontalBarList from './HorizontalBarList';
import DonutChart from './DonutChart';

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
  leads.forEach(l => { if (l.mcc) mccMap[l.mcc] = (mccMap[l.mcc] || 0) + 1; });
  const mccData = Object.entries(mccMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));

  // Risk level distribution
  const riskMap = {};
  leads.forEach(l => {
    const risk = l.priscilaRiskLevel || 'N/A';
    riskMap[risk] = (riskMap[risk] || 0) + 1;
  });
  const riskData = Object.entries(riskMap).map(([name, value]) => ({ name, value }));
  const riskColors = { BAIXO: '#2bc196', MEDIO: '#f59e0b', ALTO: '#ef4444', CRITICO: '#7c2d12', EM_ANALISE: '#94a3b8' };

  // Lead Qualifier Level
  const qualLevelMap = {};
  leads.forEach(l => { qualLevelMap[l.leadQualifierLevel || 'PENDENTE'] = (qualLevelMap[l.leadQualifierLevel || 'PENDENTE'] || 0) + 1; });
  const qualLevelData = Object.entries(qualLevelMap).map(([name, value]) => ({ name, value }));
  const qualColors = { EXCELENTE: '#2bc196', BOM: '#36706c', REGULAR: '#f59e0b', FRACO: '#ef4444', INSUFICIENTE: '#7c2d12', PENDENTE: '#94a3b8' };

  // IA Decision
  const iaDecMap = {};
  leads.forEach(l => { iaDecMap[l.iaDecision || 'PENDENTE'] = (iaDecMap[l.iaDecision || 'PENDENTE'] || 0) + 1; });
  const iaDecData = Object.entries(iaDecMap).map(([name, value]) => ({ name, value }));
  const iaColors = { AUTO_APROVAR: '#2bc196', REVISAO_MANUAL: '#f59e0b', REJEITAR: '#ef4444', PENDENTE: '#94a3b8' };

  // IA Priority
  const priorMap = {};
  leads.forEach(l => { if (l.iaPriority) priorMap[l.iaPriority] = (priorMap[l.iaPriority] || 0) + 1; });
  const priorData = Object.entries(priorMap).map(([name, value]) => ({ name, value }));

  // Origem do lead
  const origemMap = {};
  leads.forEach(l => { origemMap[l.origemLead || 'Direto'] = (origemMap[l.origemLead || 'Direto'] || 0) + 1; });
  const origemData = Object.entries(origemMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));

  // Introducer distribution
  const introMap = {};
  leads.forEach(l => { if (l.introducerName) introMap[l.introducerName] = (introMap[l.introducerName] || 0) + 1; });
  const introData = Object.entries(introMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name, value]) => ({ name, value }));

  // Growth expectation
  const growthMap = {};
  leads.forEach(l => { if (l.expectativaCrescimento) growthMap[l.expectativaCrescimento] = (growthMap[l.expectativaCrescimento] || 0) + 1; });
  const growthData = Object.entries(growthMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

  // Status distribution
  const statusMap = {};
  leads.forEach(l => { statusMap[l.status || 'N/A'] = (statusMap[l.status || 'N/A'] || 0) + 1; });
  const statusData = Object.entries(statusMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

  // Scores
  const qualScores = calcStats(leads.map(l => l.leadQualifierScore));
  const riskScores = calcStats(leads.map(l => l.priscilaQualityScore));
  const iaRiskScores = calcStats(leads.map(l => l.iaRiskScore));

  const withIntroducer = leads.filter(l => l.introducerName).length;

  return (
    <div className="space-y-6 mt-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total Leads" value={leads.length} icon={Users} />
        <StatCard label="Com Introducer" value={withIntroducer} subtitle={`${leads.length > 0 ? ((withIntroducer / leads.length) * 100).toFixed(0) : 0}% do total`} icon={UserCheck} />
        <StatCard label="Qualifier Mediano" value={formatNumber(qualScores.median)} subtitle={`${qualScores.count} avaliados`} icon={TrendingUp} />
        <StatCard label="Risk Score IA Med." value={formatNumber(iaRiskScores.median)} subtitle={`Max: ${formatNumber(iaRiskScores.max)}`} icon={TrendingUp} />
        <StatCard label="MCCs Distintos" value={Object.keys(mccMap).length} icon={Briefcase} />
      </div>

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

      {/* Donut charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DonutChart title="Tipo de Negócio" data={bizData} />
        <DonutChart title="Nível de Risco" data={riskData} colorMap={riskColors} />
        <DonutChart title="Qualificação" data={qualLevelData} colorMap={qualColors} />
        <DonutChart title="Decisão IA" data={iaDecData} colorMap={iaColors} />
      </div>

      {/* Bar charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HorizontalBarList title="Status no Funil" data={statusData} />
        <HorizontalBarList title="Top MCCs" data={mccData} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HorizontalBarList title="Origem dos Leads" data={origemData} />
        {introData.length > 0 && <HorizontalBarList title="Top Introducers" data={introData} />}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {growthData.length > 0 && <HorizontalBarList title="Expectativa de Crescimento" data={growthData} />}
        {priorData.length > 0 && <DonutChart title="Prioridade IA" data={priorData} colorMap={{ URGENTE: '#ef4444', ALTA: '#f59e0b', MEDIA: '#94a3b8', BAIXA: '#2bc196' }} />}
      </div>
    </div>
  );
}