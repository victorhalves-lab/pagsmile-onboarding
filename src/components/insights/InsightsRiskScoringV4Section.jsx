import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';
import { Shield, AlertTriangle, TrendingUp, Activity, Lock, Gauge, ListChecks, BarChart3, Users } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatCard from './StatCard';
import RiskCasesTable from './RiskCasesTable';
import RiskDecisionCharts from './RiskDecisionCharts';
import RiskClientsList from './RiskClientsList';

const SUBFAIXA_COLORS = {
  '1A': '#22c55e', '1B': '#4ade80',
  '2A': '#3b82f6', '2B': '#60a5fa',
  '3A': '#eab308', '3B': '#facc15',
  '4': '#f97316',
  '5': '#ef4444',
};

const SUBFAIXA_NAMES = {
  '1A': 'Verde Express', '1B': 'Verde Padrão',
  '2A': 'Azul Leve', '2B': 'Azul Padrão',
  '3A': 'Amarelo', '3B': 'Amarelo Reforçado',
  '4': 'Laranja (Manual)',
  '5': 'Vermelho (Bloqueio)',
};

const MONIT_LEVELS = ['PADRAO', 'REFORÇADO_LEVE', 'REFORÇADO', 'INTENSO', 'INTENSO_PLUS', 'MAXIMO'];

export default function InsightsRiskScoringV4Section({ complianceScores, cases, merchants }) {
  const v4Scores = useMemo(() =>
    complianceScores.filter(s => s.framework_version === 'v4.0' || s.score_final !== undefined),
    [complianceScores]
  );

  const stats = useMemo(() => {
    if (v4Scores.length === 0) return null;

    // Score médio
    const scores = v4Scores.filter(s => s.score_final != null);
    const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, s) => a + s.score_final, 0) / scores.length) : 0;

    // Distribuição por subfaixa
    const subfaixaDist = {};
    v4Scores.forEach(s => {
      const sf = s.subfaixa || 'N/A';
      subfaixaDist[sf] = (subfaixaDist[sf] || 0) + 1;
    });
    const subfaixaData = Object.entries(subfaixaDist)
      .filter(([k]) => k !== 'N/A')
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([sf, count]) => ({
        name: `${sf} - ${SUBFAIXA_NAMES[sf] || sf}`,
        subfaixa: sf,
        value: count,
        fill: SUBFAIXA_COLORS[sf] || '#94a3b8',
      }));

    // Rolling Reserve médio
    const rrScores = v4Scores.filter(s => s.rolling_reserve_percent != null);
    const avgRR = rrScores.length > 0 ? (rrScores.reduce((a, s) => a + s.rolling_reserve_percent, 0) / rrScores.length).toFixed(1) : 0;

    // Bloqueios mais frequentes
    const blockFreq = {};
    v4Scores.forEach(s => {
      (s.bloqueios_ativos || []).forEach(b => {
        blockFreq[b] = (blockFreq[b] || 0) + 1;
      });
    });
    const topBlocks = Object.entries(blockFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name: name.replace('_', ' '), count }));

    // Monitoramento por nível
    const monitDist = {};
    MONIT_LEVELS.forEach(l => monitDist[l] = 0);
    v4Scores.forEach(s => {
      const lvl = s.monitoramento_nivel || 'PADRAO';
      monitDist[lvl] = (monitDist[lvl] || 0) + 1;
    });
    const monitData = MONIT_LEVELS.map(l => ({
      name: l.replace('_', ' '),
      value: monitDist[l] || 0,
    }));

    // Variáveis mais aplicadas (positivas e negativas)
    const varFreq = {};
    v4Scores.forEach(s => {
      (s.variaveis_positivas || []).forEach(v => { varFreq[v] = (varFreq[v] || { pos: 0, neg: 0 }); varFreq[v].pos++; });
      (s.variaveis_negativas || []).forEach(v => { varFreq[v] = (varFreq[v] || { pos: 0, neg: 0 }); varFreq[v].neg++; });
    });
    const topVars = Object.entries(varFreq)
      .map(([name, { pos, neg }]) => ({ name, pos, neg, total: pos + neg }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);

    // Segmentos
    const segDist = {};
    v4Scores.forEach(s => {
      const seg = s.segmento || 'N/A';
      segDist[seg] = (segDist[seg] || 0) + 1;
    });
    const segData = Object.entries(segDist)
      .filter(([k]) => k !== 'N/A')
      .sort(([, a], [, b]) => b - a)
      .map(([name, count]) => ({ name, count }));

    // Decisões automáticas vs manuais
    const autoCount = v4Scores.filter(s => s.decisao_automatica === true).length;
    const manualCount = v4Scores.filter(s => s.decisao_automatica === false).length;

    // Condições automáticas mais aplicadas
    const condFreq = {};
    v4Scores.forEach(s => {
      (s.condicoes_automaticas || []).forEach(c => {
        condFreq[c] = (condFreq[c] || 0) + 1;
      });
    });
    const topConditions = Object.entries(condFreq)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    // PIX vs Cartão
    const pixCount = v4Scores.filter(s => s.is_pix === true).length;
    const cartaoCount = v4Scores.length - pixCount;

    // Camadas de score
    const avgC1 = scores.length > 0 ? Math.round(scores.reduce((a, s) => a + (s.score_base_segmento || 0), 0) / scores.length) : 0;
    const avgC2 = scores.length > 0 ? Math.round(scores.reduce((a, s) => a + (s.score_variaveis || 0), 0) / scores.length) : 0;
    const avgC3 = scores.length > 0 ? Math.round(scores.reduce((a, s) => a + (s.score_enriquecimento || 0), 0) / scores.length) : 0;

    return {
      total: v4Scores.length, avgScore, subfaixaData, avgRR, topBlocks,
      monitData, topVars, segData, autoCount, manualCount,
      topConditions, pixCount, cartaoCount, avgC1, avgC2, avgC3,
    };
  }, [v4Scores]);

  if (!stats || stats.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="w-12 h-12 text-[#002443]/20 mb-4" />
        <p className="text-sm font-semibold text-[#002443]/50">Nenhum score encontrado</p>
        <p className="text-xs text-[#002443]/30 mt-1">Casos processados com o motor de risco aparecerão aqui</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <StatCard label="Total Scores" value={stats.total} icon={Shield} color="#002443" />
        <StatCard label="Score Médio" value={stats.avgScore} suffix="/1000" icon={Gauge} color={stats.avgScore < 300 ? '#22c55e' : stats.avgScore < 600 ? '#eab308' : '#ef4444'} />
        <StatCard label="Rolling Reserve Médio" value={`${stats.avgRR}%`} icon={Lock} color="#f97316" />
        <StatCard label="Decisão Automática" value={stats.autoCount} suffix={`/${stats.total}`} icon={TrendingUp} color="#2bc196" />
        <StatCard label="Fluxo PIX" value={stats.pixCount} icon={Activity} color="#3b82f6" />
        <StatCard label="Bloqueios Ativos" value={stats.topBlocks.reduce((a, b) => a + b.count, 0)} icon={AlertTriangle} color="#ef4444" />
      </div>

      {/* Tabs: Visão Geral | Decisões | Casos */}
      <Tabs defaultValue="clients" className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-10">
          <TabsTrigger value="clients" className="text-xs font-bold"><Users className="w-3.5 h-3.5 mr-1.5" />Clientes</TabsTrigger>
          <TabsTrigger value="overview" className="text-xs font-bold"><BarChart3 className="w-3.5 h-3.5 mr-1.5" />Visão Geral</TabsTrigger>
          <TabsTrigger value="decisions" className="text-xs font-bold"><TrendingUp className="w-3.5 h-3.5 mr-1.5" />Decisões & Taxas</TabsTrigger>
          <TabsTrigger value="cases" className="text-xs font-bold"><ListChecks className="w-3.5 h-3.5 mr-1.5" />Técnico</TabsTrigger>
        </TabsList>

        <TabsContent value="clients" className="mt-4">
          <RiskClientsList scores={v4Scores} cases={cases} merchants={merchants} />
        </TabsContent>

        <TabsContent value="decisions" className="mt-4">
          <RiskDecisionCharts scores={v4Scores} />
        </TabsContent>

        <TabsContent value="cases" className="mt-4">
          <RiskCasesTable scores={v4Scores} cases={cases} />
        </TabsContent>

        <TabsContent value="overview" className="mt-4 space-y-6">

      {/* Camadas de Score */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Composição Média do Score (3 Camadas)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'C1 - Base Segmento', value: stats.avgC1, color: '#3b82f6', desc: 'Score base do segmento' },
              { label: 'C2 - Variáveis (V01-V53)', value: stats.avgC2, color: '#f97316', desc: 'Soma das variáveis aplicadas' },
              { label: 'C3 - Enriquecimento (E01-E11)', value: stats.avgC3, color: '#8b5cf6', desc: 'Dados externos enriquecidos' },
            ].map((c, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-4 text-center border border-slate-100">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#002443]/40 mb-1">{c.label}</p>
                <p className="text-3xl font-extrabold" style={{ color: c.color }}>{c.value}</p>
                <p className="text-[10px] text-[#002443]/40 mt-1">{c.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 bg-slate-50 rounded-xl p-3 border border-slate-100">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#002443]/70">Score Final Médio = C1 + C2 + C3</span>
              <Badge className="bg-[#002443] text-white border-0 text-sm font-bold">{stats.avgScore} / 1000</Badge>
            </div>
            <div className="mt-2 h-3 rounded-full bg-slate-200 overflow-hidden flex">
              <div className="h-full bg-blue-500" style={{ width: `${(stats.avgC1 / Math.max(stats.avgScore, 1)) * 100}%` }} />
              <div className="h-full bg-orange-500" style={{ width: `${(stats.avgC2 / Math.max(stats.avgScore, 1)) * 100}%` }} />
              <div className="h-full bg-purple-500" style={{ width: `${(stats.avgC3 / Math.max(stats.avgScore, 1)) * 100}%` }} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distribuição por Subfaixa + Monitoramento */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Distribuição por Subfaixa (1A → 5)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.subfaixaData} layout="vertical" margin={{ left: 120 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={115} />
                <Tooltip />
                <Bar dataKey="value" name="Casos" radius={[0, 6, 6, 0]}>
                  {stats.subfaixaData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Nível de Monitoramento</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.monitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" name="Casos" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bloqueios + Segmentos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Bloqueios B01-B10 — Frequência</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topBlocks.length === 0 ? (
              <p className="text-xs text-[#002443]/40 text-center py-8">Nenhum bloqueio ativo registrado</p>
            ) : (
              <div className="space-y-2">
                {stats.topBlocks.map((b, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-[#002443]/60 w-[200px] truncate">{b.name}</span>
                    <div className="flex-1 h-5 bg-red-50 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, (b.count / (stats.topBlocks[0]?.count || 1)) * 100)}%` }} />
                    </div>
                    <span className="text-xs font-bold text-red-600 w-8 text-right">{b.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Distribuição por Segmento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.segData.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-[10px] font-semibold text-[#002443]/60 w-[140px] truncate capitalize">{s.name.replace(/_/g, ' ')}</span>
                  <div className="flex-1 h-5 bg-[#2bc196]/10 rounded-full overflow-hidden">
                    <div className="h-full bg-[#2bc196] rounded-full" style={{ width: `${Math.min(100, (s.count / (stats.segData[0]?.count || 1)) * 100)}%` }} />
                  </div>
                  <span className="text-xs font-bold text-[#002443] w-8 text-right">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Variáveis mais aplicadas */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold">Top 15 Variáveis Mais Aplicadas (Positivas vs Negativas)</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topVars.length === 0 ? (
            <p className="text-xs text-[#002443]/40 text-center py-8">Nenhuma variável registrada</p>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={stats.topVars} layout="vertical" margin={{ left: 100 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={95} />
                <Tooltip />
                <Legend />
                <Bar dataKey="neg" name="Penalizadoras" fill="#ef4444" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="pos" name="Redutoras" fill="#22c55e" stackId="a" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Condições Automáticas */}
      {stats.topConditions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">Condições Automáticas Mais Aplicadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {stats.topConditions.map((c, i) => (
                <div key={i} className="flex items-center gap-3 bg-amber-50 rounded-lg p-3 border border-amber-100">
                  <Badge className="bg-amber-500 text-white border-0 text-[10px] font-bold">{c.count}×</Badge>
                  <span className="text-xs text-[#002443]/70">{c.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

        </TabsContent>
      </Tabs>
    </div>
  );
}