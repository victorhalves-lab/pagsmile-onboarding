import React from 'react';
import { Card } from '@/components/ui/card';
import StatCard from './StatCard';
import { TrendingUp, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
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
  const sourceMap = {};
  leads.forEach(l => {
    const src = l.origemLead || l.introducerName || 'Orgânico';
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
    <div className="space-y-5 mt-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Taxa de Aceite" value={`${acceptRate}%`} subtitle={`${accepted} de ${currentProposals.length}`} icon={CheckCircle2} />
        <StatCard label="Tempo Médio Aceite" value={`${avgAcceptDays} dias`} subtitle={`${acceptTimes.length} propostas aceitas`} icon={Clock} />
        <StatCard label="Propostas em Aberto" value={sent} subtitle="Enviadas/Visualizadas" icon={TrendingUp} />
        <StatCard label="Recusadas" value={rejected} subtitle={`${currentProposals.length > 0 ? (rejected / currentProposals.length * 100).toFixed(1) : 0}% do total`} icon={XCircle} color="text-red-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-4">
          <h3 className="text-sm font-bold text-[#002443] mb-3">Funil de Status dos Leads</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
              <Tooltip />
              <Bar dataKey="count" fill="#2bc196" radius={[0, 4, 4, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-4">
          <h3 className="text-sm font-bold text-[#002443] mb-3">Origem dos Leads</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sourceData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={120} />
              <Tooltip />
              <Bar dataKey="count" fill="#002443" radius={[0, 4, 4, 0]} name="Leads" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {Object.keys(introducerMap).length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-bold text-[#002443] mb-3">Performance por Introducer</h3>
          <div className="space-y-2">
            {Object.entries(introducerMap).sort((a, b) => b[1].total - a[1].total).map(([name, data], i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <span className="text-sm font-medium">{name}</span>
                <div className="flex items-center gap-4 text-xs">
                  <span><span className="text-[#002443]/50">Leads: </span><span className="font-bold">{data.total}</span></span>
                  <span><span className="text-[#002443]/50">Convertidos: </span><span className="font-bold text-[#2bc196]">{data.converted}</span></span>
                  <span><span className="text-[#002443]/50">Conv: </span><span className="font-bold">{(data.converted / data.total * 100).toFixed(0)}%</span></span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}