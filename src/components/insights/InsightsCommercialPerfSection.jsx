import React from 'react';
import StatCard from './StatCard';
import ChartCard from './ChartCard';
import DonutChart from './DonutChart';
import HorizontalBarList from './HorizontalBarList';
import MinMaxMedianTable from './MinMaxMedianTable';
import { calcStats, formatNumber } from './insightsUtils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { Clock, GitBranch, ThumbsDown, Sparkles, Timer } from 'lucide-react';

const TT = { borderRadius: 12, border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)', padding: '8px 14px', fontSize: 12 };

export default function InsightsCommercialPerfSection({ leads, proposals, pixProposals }) {
  const allProposals = [...proposals, ...pixProposals];
  const current = allProposals.filter(p => p.isCurrentVersion !== false);

  // Origem da proposta
  const origemMap = {};
  current.forEach(p => { origemMap[p.origem || 'manual'] = (origemMap[p.origem || 'manual'] || 0) + 1; });
  const origemData = Object.entries(origemMap).map(([name, value]) => ({
    name: name === 'manual' ? 'Manual' : name === 'priscila_automatica' ? 'IA Automática' : name === 'priscila_assistida' ? 'IA Assistida' : name,
    value
  }));

  // Versões até aceite
  const accepted = current.filter(p => p.status === 'aceita');
  const versionStats = calcStats(accepted.map(p => p.version || 1));

  // Tempo: envio → aceite (em dias)
  const temposAceite = accepted.filter(p => p.sentDate && p.acceptedDate).map(p => {
    const sent = new Date(p.sentDate);
    const acc = new Date(p.acceptedDate);
    return (acc - sent) / (1000 * 60 * 60 * 24);
  }).filter(t => t >= 0 && t < 365);
  const tempoStats = calcStats(temposAceite);

  // Tempo: lead criado → proposta enviada (Map p/ evitar O(n²))
  const leadById = new Map(leads.map(l => [l.id, l]));
  const tempoLeadToProp = [];
  current.filter(p => p.sentDate).forEach(p => {
    const lead = leadById.get(p.leadId);
    if (!lead?.created_date) return;
    const leadDate = new Date(lead.created_date);
    const sentDate = new Date(p.sentDate);
    const days = (sentDate - leadDate) / (1000 * 60 * 60 * 24);
    if (days >= 0 && days < 365) tempoLeadToProp.push(days);
  });
  const tempoLeadStats = calcStats(tempoLeadToProp);

  // Motivos de recusa
  const recusaMap = {};
  const rejected = current.filter(p => p.status === 'recusada');
  rejected.forEach(p => {
    const reason = p.rejectedReason || 'Não informado';
    recusaMap[reason] = (recusaMap[reason] || 0) + 1;
  });
  const recusaData = Object.entries(recusaMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));

  // Win rate por origem
  const winByOrigem = {};
  current.forEach(p => {
    const origem = p.origem || 'manual';
    if (!winByOrigem[origem]) winByOrigem[origem] = { sent: 0, won: 0 };
    if (['enviada', 'visualizada', 'aceita', 'recusada', 'contraproposta'].includes(p.status)) winByOrigem[origem].sent++;
    if (p.status === 'aceita') winByOrigem[origem].won++;
  });
  const winByOrigemData = Object.entries(winByOrigem).filter(([_, d]) => d.sent > 0).map(([origem, d]) => ({
    name: origem === 'manual' ? 'Manual' : origem === 'priscila_automatica' ? 'IA Auto' : 'IA Assist.',
    'Win Rate (%)': Math.round((d.won / d.sent) * 100),
    Enviadas: d.sent,
    Aceitas: d.won,
  }));

  // Cohort por mês (leads)
  const cohortMap = {};
  leads.forEach(l => {
    const d = new Date(l.created_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!cohortMap[key]) cohortMap[key] = { total: 0, converted: 0 };
    cohortMap[key].total++;
    if (['proposta_aceita', 'kyc_iniciado', 'kyc_aprovado', 'ativado'].includes(l.status)) cohortMap[key].converted++;
  });
  const cohortData = Object.entries(cohortMap).sort().map(([month, d]) => ({
    name: month,
    'Leads': d.total,
    'Convertidos': d.converted,
    'Conv. %': d.total > 0 ? Math.round((d.converted / d.total) * 100) : 0,
  }));

  // Aging de leads
  const now = new Date();
  const agingBuckets = { '< 7 dias': 0, '7-15 dias': 0, '15-30 dias': 0, '30-60 dias': 0, '60+ dias': 0 };
  const activeStatuses = ['questionario_preenchido', 'analisado_priscila', 'em_contato_comercial', 'proposta_enviada'];
  leads.filter(l => activeStatuses.includes(l.status)).forEach(l => {
    const days = (now - new Date(l.created_date)) / (1000 * 60 * 60 * 24);
    if (days < 7) agingBuckets['< 7 dias']++;
    else if (days < 15) agingBuckets['7-15 dias']++;
    else if (days < 30) agingBuckets['15-30 dias']++;
    else if (days < 60) agingBuckets['30-60 dias']++;
    else agingBuckets['60+ dias']++;
  });
  const agingData = Object.entries(agingBuckets).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6 mt-2">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Tempo Med. Aceite" value={`${tempoStats.median.toFixed(0)}d`} subtitle={`Max: ${tempoStats.max.toFixed(0)}d`} icon={Clock} />
        <StatCard label="Lead → Proposta" value={`${tempoLeadStats.median.toFixed(0)}d`} subtitle="Mediana" icon={Timer} />
        <StatCard label="Versões p/ Aceite" value={versionStats.median.toFixed(1)} subtitle={`Max: ${versionStats.max}`} icon={GitBranch} />
        <StatCard label="Recusas" value={rejected.length} subtitle={recusaData[0]?.name || '-'} icon={ThumbsDown} accentColor="#ef4444" />
        <StatCard label="Propostas IA" value={origemMap.priscila_automatica || 0} subtitle={`${origemMap.priscila_assistida || 0} assistidas`} icon={Sparkles} />
      </div>

      <MinMaxMedianTable
        title="Pipeline Velocity — Mín / Mediana / Média / Máx"
        rows={[
          { label: 'Envio → Aceite (dias)', stats: tempoStats },
          { label: 'Lead → Proposta (dias)', stats: tempoLeadStats },
          { label: 'Versões até Aceite', stats: versionStats },
        ].filter(r => r.stats.count > 0)}
        formatter={v => v?.toFixed(1)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {origemData.length > 0 && <DonutChart title="Origem das Propostas" data={origemData} colorMap={{ Manual: '#002443', 'IA Automática': '#2bc196', 'IA Assistida': '#5cf7cf' }} />}
        {recusaData.length > 0 && <HorizontalBarList title="Motivos de Recusa" data={recusaData} color="#ef4444" />}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {winByOrigemData.length > 0 && (
          <ChartCard title="Win Rate por Origem" subtitle="IA vs Manual">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={winByOrigemData} barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#002443' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} unit="%" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={TT} />
                <Bar dataKey="Win Rate (%)" fill="#2bc196" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        )}

        {agingData.some(d => d.value > 0) && <HorizontalBarList title="Aging de Leads Ativos" data={agingData} color="#f59e0b" />}
      </div>

      {cohortData.length > 1 && (
        <ChartCard title="Cohort Mensal — Leads vs Convertidos" subtitle="Tendência de captação e conversão">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={cohortData}>
              <defs>
                <linearGradient id="cohortFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#002443" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#002443" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TT} />
              <Area type="monotone" dataKey="Leads" stroke="#002443" fill="url(#cohortFill)" strokeWidth={2} dot={{ r: 3, fill: '#002443', stroke: '#fff', strokeWidth: 2 }} />
              <Area type="monotone" dataKey="Convertidos" stroke="#2bc196" fill="transparent" strokeWidth={2} dot={{ r: 3, fill: '#2bc196', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}