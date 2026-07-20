import React from 'react';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import { TrendingUp, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const chartTooltipStyle = { borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', padding: '8px 14px', fontSize: 12 };
import moment from 'moment';

export default function InsightsFunnelSection({ leads, proposals, cases }) {
  // Status distribution
  const statusMap = {};
  leads.forEach(l => {
    const s = l.status || 'N/A';
    statusMap[s] = (statusMap[s] || 0) + 1;
  });

  const statusLabels = {
    questionario_preenchido: 'Quest. Preenchido',
    analisado_priscila: 'Analisado',
    em_contato_comercial: 'Em Contato',
    proposta_enviada: 'Proposta Enviada',
    proposta_aceita: 'Proposta Aceita',
    proposta_recusada: 'Proposta Recusada',
    kyc_iniciado: 'KYC Iniciado',
    kyc_aprovado: 'KYC Aprovado',
    ativado: 'Ativado',
    perdido: 'Perdido',
  };

  const funnelData = Object.entries(statusLabels).map(([key, label]) => ({
    name: label,
    count: statusMap[key] || 0,
  }));

  // Proposal stats
  const currentProposals = proposals.filter(p => p.isCurrentVersion !== false);
  const accepted = currentProposals.filter(p => p.status === 'aceita').length;
  const rejected = currentProposals.filter(p => p.status === 'recusada').length;
  const sent = currentProposals.filter(p => ['enviada', 'visualizada'].includes(p.status)).length;
  const acceptRate = currentProposals.length > 0 ? (accepted / currentProposals.length * 100).toFixed(1) : 0;

  // Avg time to accept
  const acceptTimes = currentProposals.filter(p => p.acceptedDate && p.created_date).map(p => {
    return moment(p.acceptedDate).diff(moment(p.created_date), 'days');
  }).filter(d => d >= 0);
  const avgAcceptDays = acceptTimes.length > 0 ? (acceptTimes.reduce((s, v) => s + v, 0) / acceptTimes.length).toFixed(1) : '-';

  // Lead source distribution
  const ORIGEM_LABELS = {
    questionario_leads_pagsmile_v5: 'Lead V5 (Pin Bank)',
    lead_pix_v4: 'PIX V4',
    landing_page: 'Landing Page',
    introducer_landing: 'Landing Introducer',
    standard_proposal: 'Proposta Padrão',
    fechamento_landing: 'Fechamento LP',
    questionario_simplificado: 'Quest. Simplificado',
  };
  const sourceMap = {};
  leads.forEach(l => {
    const raw = l.origemLead || l.questionnaireData?.origem || (l.introducerName ? `Introducer: ${l.introducerName}` : 'Orgânico');
    const src = ORIGEM_LABELS[raw] || raw;
    sourceMap[src] = (sourceMap[src] || 0) + 1;
  });
  const sourceData = Object.entries(sourceMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, count]) => ({ name: name || 'Orgânico', count }));

  // Introducer performance
  const introducerMap = {};
  leads.forEach(l => {
    if (l.introducerName) {
      if (!introducerMap[l.introducerName]) introducerMap[l.introducerName] = { total: 0, converted: 0 };
      introducerMap[l.introducerName].total++;
      if (['proposta_aceita', 'kyc_aprovado', 'ativado'].includes(l.status)) {
        introducerMap[l.introducerName].converted++;
      }
    }
  });

  return (
    <div className="space-y-6 mt-2">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Taxa de Aceite" value={`${acceptRate}%`} subtitle={`${accepted} de ${currentProposals.length}`} icon={CheckCircle2} />
        <StatCard label="Tempo Médio Aceite" value={`${avgAcceptDays} dias`} subtitle={`${acceptTimes.length} propostas aceitas`} icon={Clock} />
        <StatCard label="Propostas em Aberto" value={sent} subtitle="Enviadas/Visualizadas" icon={TrendingUp} />
        <StatCard label="Recusadas" value={rejected} subtitle={`${currentProposals.length > 0 ? (rejected / currentProposals.length * 100).toFixed(1) : 0}% do total`} icon={XCircle} color="text-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Funil de Status dos Leads">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={funnelData} layout="vertical" barCategoryGap="20%">
              <defs>
                <linearGradient id="funnelGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#1356E2" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#1356E2" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#0A0A0A' }} width={130} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="count" fill="url(#funnelGrad)" radius={[0, 8, 8, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Origem dos Leads">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={sourceData} layout="vertical" barCategoryGap="20%">
              <defs>
                <linearGradient id="sourceGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#0A0A0A" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#0A0A0A" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#0A0A0A' }} width={130} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={chartTooltipStyle} />
              <Bar dataKey="count" fill="url(#sourceGrad)" radius={[0, 8, 8, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {Object.keys(introducerMap).length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-[#0A0A0A] mb-4">Performance por Introducer</h3>
          <div className="space-y-2.5">
            {Object.entries(introducerMap).sort((a, b) => b[1].total - a[1].total).map(([name, data], i) => {
              const convRate = (data.converted / data.total * 100).toFixed(0);
              return (
                <div key={i} className="group flex items-center justify-between p-3.5 bg-slate-50/50 rounded-xl border border-transparent hover:border-[#1356E2]/10 hover:bg-[#1356E2]/[0.02] transition-all duration-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#0A0A0A]/5 flex items-center justify-center">
                      <span className="text-[10px] font-extrabold text-[#0A0A0A]/40">{i + 1}</span>
                    </div>
                    <span className="text-xs font-semibold text-[#0A0A0A]">{name}</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px]">
                    <span className="text-[#0A0A0A]/40">Leads: <span className="font-bold text-[#0A0A0A]">{data.total}</span></span>
                    <span className="text-[#0A0A0A]/40">Conv: <span className="font-bold text-[#1356E2]">{data.converted}</span></span>
                    <div className="flex items-center gap-1.5 bg-[#1356E2]/10 rounded-full px-2.5 py-0.5">
                      <span className="text-[10px] font-extrabold text-[#1356E2]">{convRate}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}