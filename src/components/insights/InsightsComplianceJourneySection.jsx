import React from 'react';
import StatCard from './StatCard';
import DonutChart from './DonutChart';
import HorizontalBarList from './HorizontalBarList';
import ChartCard from './ChartCard';
import { calcStats, formatNumber } from './insightsUtils';
import { Route, Clock, CheckCircle2, XCircle, BarChart3, Layers } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import moment from 'moment';

const TT = { borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', padding: '8px 14px', fontSize: 12 };

const MODEL_LABELS = {
  ComplianceGatewayV4: 'Gateway v4',
  ComplianceMarketplaceV4: 'Marketplace v4',
  CompliancePlataformaVerticalV4: 'Plat. Vertical v4',
  ComplianceEcommerceV4: 'E-commerce v4',
  ComplianceInfoprodutosV4: 'Infoprodutos v4',
  ComplianceEducacaoV4: 'Educação v4',
  ComplianceSaaSV4: 'SaaS v4',
  ComplianceMerchantLinkV4: 'Merchant Link v4',
  ComplianceMPEV4: 'MPE v4',
  ComplianceDropshippingV4: 'Dropshipping v4',
  merchant: 'Merchant v1',
  gateway: 'Gateway v1',
  marketplace: 'Marketplace v1',
  pix: 'PIX',
  lite: 'Lite',
  saas: 'SaaS v1',
  ecommerce: 'E-commerce v1',
};

export default function InsightsComplianceJourneySection({ sessions }) {
  if (!sessions || sessions.length === 0) {
    return (
      <div className="rounded-3xl bg-white border border-slate-100 p-12 text-center mt-2">
        <Route className="w-10 h-10 mx-auto text-[#002443]/20 mb-3" />
        <p className="text-sm text-[#002443]/50">Nenhuma sessão de compliance registrada ainda.</p>
        <p className="text-xs text-[#002443]/30 mt-1">As sessões aparecem quando clientes iniciam o questionário de compliance.</p>
      </div>
    );
  }

  // Status distribution
  const statusMap = {};
  sessions.forEach(s => { statusMap[s.status || 'active'] = (statusMap[s.status || 'active'] || 0) + 1; });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));
  const statusColors = { active: '#f59e0b', completed: '#2bc196', expired: '#ef4444' };

  // Phase distribution
  const phaseMap = {};
  sessions.forEach(s => { phaseMap[s.currentPhase || 'questionnaire'] = (phaseMap[s.currentPhase || 'questionnaire'] || 0) + 1; });
  const phaseData = Object.entries(phaseMap).map(([name, value]) => ({
    name: name === 'questionnaire' ? 'Questionário' : name === 'documents' ? 'Documentos' : name === 'completed' ? 'Concluído' : name,
    value
  }));
  const phaseColors = { 'Questionário': '#002443', 'Documentos': '#f59e0b', 'Concluído': '#2bc196' };

  // Model distribution
  const modelMap = {};
  sessions.forEach(s => {
    const label = MODEL_LABELS[s.templateModel] || s.templateModel || 'N/A';
    modelMap[label] = (modelMap[label] || 0) + 1;
  });
  const modelData = Object.entries(modelMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));

  // Completion rate by model
  const completionByModel = {};
  sessions.forEach(s => {
    const label = MODEL_LABELS[s.templateModel] || s.templateModel || 'N/A';
    if (!completionByModel[label]) completionByModel[label] = { total: 0, completed: 0 };
    completionByModel[label].total++;
    if (s.status === 'completed' || s.currentPhase === 'completed') {
      completionByModel[label].completed++;
    }
  });
  const completionData = Object.entries(completionByModel)
    .filter(([_, d]) => d.total >= 1)
    .map(([name, d]) => ({
      name,
      'Concluídos': d.completed,
      'Abandonados': d.total - d.completed,
      rate: d.total > 0 ? Math.round((d.completed / d.total) * 100) : 0,
    }))
    .sort((a, b) => b.rate - a.rate);

  // Step dropout (what step are people abandoning?)
  const activeSteps = [];
  sessions.forEach(s => {
    if (s.status !== 'completed' && s.currentPhase !== 'completed' && s.currentStep) {
      activeSteps.push(s.currentStep);
    }
  });
  const stepMap = {};
  activeSteps.forEach(step => {
    const label = `Etapa ${step}`;
    stepMap[label] = (stepMap[label] || 0) + 1;
  });
  const stepDropoutData = Object.entries(stepMap).sort((a, b) => {
    const numA = parseInt(a[0].replace('Etapa ', ''));
    const numB = parseInt(b[0].replace('Etapa ', ''));
    return numA - numB;
  }).map(([name, value]) => ({ name, value }));

  // Time to complete (created_date → lastAccessDate)
  const completionTimes = [];
  sessions.forEach(s => {
    if ((s.status === 'completed' || s.currentPhase === 'completed') && s.created_date && s.lastAccessDate) {
      const mins = moment(s.lastAccessDate).diff(moment(s.created_date), 'minutes');
      if (mins >= 0 && mins < 10080) { // max 7 days
        completionTimes.push(mins);
      }
    }
  });
  const timeStats = calcStats(completionTimes);

  // Flow type distribution
  const flowMap = {};
  sessions.forEach(s => { flowMap[s.flowType || 'N/A'] = (flowMap[s.flowType || 'N/A'] || 0) + 1; });
  const flowData = Object.entries(flowMap).map(([name, value]) => ({ name, value }));

  // KPIs
  const totalSessions = sessions.length;
  const completed = sessions.filter(s => s.status === 'completed' || s.currentPhase === 'completed').length;
  const abandoned = sessions.filter(s => s.status === 'active' && s.currentPhase !== 'completed').length;
  const completionRate = totalSessions > 0 ? ((completed / totalSessions) * 100).toFixed(1) : 0;
  const avgTimeFormatted = timeStats.count > 0
    ? (timeStats.median >= 60 ? `${(timeStats.median / 60).toFixed(1)}h` : `${Math.round(timeStats.median)}min`)
    : '-';

  return (
    <div className="space-y-6 mt-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Sessões" value={totalSessions} subtitle={`${Object.keys(modelMap).length} modelos`} icon={Layers} />
        <StatCard label="Taxa Conclusão" value={`${completionRate}%`} subtitle={`${completed} concluídos`} icon={CheckCircle2} accentColor="#2bc196" />
        <StatCard label="Abandonados" value={abandoned} subtitle={`${totalSessions > 0 ? ((abandoned / totalSessions) * 100).toFixed(0) : 0}% do total`} icon={XCircle} accentColor="#ef4444" />
        <StatCard label="Tempo Mediano" value={avgTimeFormatted} subtitle={`${timeStats.count} sessões medidas`} icon={Clock} />
      </div>

      {/* Status + Fase + Modelo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DonutChart title="Status da Sessão" data={statusData} colorMap={statusColors} />
        <DonutChart title="Fase Atual (Abandono)" data={phaseData} colorMap={phaseColors} />
        <DonutChart title="Tipo de Fluxo" data={flowData} />
      </div>

      {/* Modelo de compliance */}
      {modelData.length > 0 && (
        <HorizontalBarList title="Volume por Modelo de Compliance" data={modelData} />
      )}

      {/* Completion by model */}
      {completionData.length > 1 && (
        <ChartCard title="Conversão por Modelo" subtitle="Concluídos vs Abandonados por vertical">
          <ResponsiveContainer width="100%" height={Math.max(200, completionData.length * 40)}>
            <BarChart data={completionData} layout="vertical" barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#002443' }} width={130} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT} />
              <Bar dataKey="Concluídos" stackId="a" fill="#2bc196" radius={[0, 0, 0, 0]} />
              <Bar dataKey="Abandonados" stackId="a" fill="#ef4444" opacity={0.3} radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {/* Step dropout */}
      {stepDropoutData.length > 0 && (
        <ChartCard title="Etapa de Abandono" subtitle="Em qual etapa do questionário os clientes param?">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stepDropoutData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#002443' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT} />
              <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Sessões paradas" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}