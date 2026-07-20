import React, { useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { TrendingUp, Shield, Users, Building2, Clock, CheckCircle2, XCircle, AlertTriangle, BarChart3 } from 'lucide-react';
import { segmentLabel } from '@/lib/segmentLabels';

const COLORS = {
  'Aprovado': '#22c55e',
  'Manual': '#f59e0b',
  'Pendente': '#94a3b8',
  'Em Análise': '#3b82f6',
  'Recusado': '#ef4444',
};

const PIE_COLORS = ['#22c55e', '#f59e0b', '#94a3b8', '#3b82f6', '#ef4444'];

function ChartCard({ title, icon: Icon, children }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-5">
      <h3 className="text-sm font-semibold text-[var(--pinbank-blue)] mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 text-[var(--pinbank-blue)]" />
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function CadastroDashboard({ merchants, cases, leads }) {
  const sellers = useMemo(() => merchants.filter(m => !m.isSubseller), [merchants]);
  const subsellers = useMemo(() => merchants.filter(m => m.isSubseller), [merchants]);

  // Status distribution
  const statusData = useMemo(() => {
    const counts = {};
    sellers.forEach(m => {
      const s = m.onboardingStatus || 'Pendente';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [sellers]);

  // Type distribution
  const typeData = useMemo(() => {
    const pf = sellers.filter(m => m.type === 'PF').length;
    const pj = sellers.filter(m => m.type === 'PJ').length;
    return [{ name: 'PJ', value: pj }, { name: 'PF', value: pf }];
  }, [sellers]);

  // Monthly trend (last 6 months)
  const trendData = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      months.push({ key, label, novos: 0, aprovados: 0, recusados: 0 });
    }
    sellers.forEach(m => {
      const d = new Date(m.created_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const mo = months.find(mo => mo.key === key);
      if (mo) {
        mo.novos++;
        if (m.onboardingStatus === 'Aprovado') mo.aprovados++;
        if (m.onboardingStatus === 'Recusado') mo.recusados++;
      }
    });
    return months;
  }, [sellers]);

  // Segment distribution from leads
  const segmentData = useMemo(() => {
    const counts = {};
    leads.forEach(l => {
      if (l.businessSubCategory) {
        const seg = segmentLabel(l.businessSubCategory);
        counts[seg] = (counts[seg] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [leads]);

  // Risk score distribution from cases
  const riskData = useMemo(() => {
    const buckets = [
      { name: '0-100', range: [0, 100], count: 0 },
      { name: '101-300', range: [101, 300], count: 0 },
      { name: '301-500', range: [301, 500], count: 0 },
      { name: '501-700', range: [501, 700], count: 0 },
      { name: '700+', range: [701, 9999], count: 0 },
    ];
    cases.forEach(c => {
      const score = c.riskScoreV4;
      if (score != null) {
        const b = buckets.find(b => score >= b.range[0] && score <= b.range[1]);
        if (b) b.count++;
      }
    });
    return buckets.map(b => ({ name: b.name, value: b.count }));
  }, [cases]);

  // KPIs
  const approvalRate = sellers.length > 0
    ? ((sellers.filter(m => m.onboardingStatus === 'Aprovado').length / sellers.length) * 100).toFixed(1)
    : 0;

  const avgProcessingDays = useMemo(() => {
    const completed = cases.filter(c => c.finalDecisionDate && c.created_date);
    if (!completed.length) return '—';
    const avg = completed.reduce((sum, c) => {
      return sum + (new Date(c.finalDecisionDate) - new Date(c.created_date)) / (1000 * 60 * 60 * 24);
    }, 0) / completed.length;
    return avg.toFixed(1);
  }, [cases]);

  return (
    <div className="space-y-6">
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard icon={CheckCircle2} label="Taxa de Aprovação" value={`${approvalRate}%`} color="text-green-600" bg="bg-green-50" />
        <KPICard icon={Clock} label="Tempo Médio (dias)" value={avgProcessingDays} color="text-blue-600" bg="bg-blue-50" />
        <KPICard icon={Building2} label="Total Sellers" value={sellers.length} color="text-[var(--pinbank-blue)]" bg="bg-blue-50" />
        <KPICard icon={Users} label="Total Subsellers" value={subsellers.length} color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Distribuição por Status" icon={Shield}>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={COLORS[entry.name] || PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Tendência Mensal (Últimos 6 meses)" icon={TrendingUp}>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="novos" stroke="#3b82f6" strokeWidth={2} name="Novos" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="aprovados" stroke="#22c55e" strokeWidth={2} name="Aprovados" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="recusados" stroke="#ef4444" strokeWidth={2} name="Recusados" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Segmentos de Negócio" icon={Building2}>
          {segmentData.length === 0 ? (
            <p className="text-sm text-[var(--pinbank-blue)]/40 text-center py-8">Sem dados de segmento</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={segmentData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#1356E2" radius={[0, 4, 4, 0]} name="Leads" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Distribuição de Risk Score V4" icon={AlertTriangle}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={riskData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" name="Casos" radius={[4, 4, 0, 0]}>
                {riskData.map((entry, i) => {
                  const colors = ['#22c55e', '#84cc16', '#f59e0b', '#f97316', '#ef4444'];
                  return <Cell key={i} fill={colors[i]} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ChartCard title="PF vs PJ" icon={Users}>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={typeData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                <Cell fill="#3b82f6" />
                <Cell fill="#a855f7" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Top stats */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-5">
          <h3 className="text-sm font-semibold text-[var(--pinbank-blue)] mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[var(--pinbank-blue)]" />
            Resumo Rápido
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(COLORS).map(([status, color]) => {
              const count = sellers.filter(m => m.onboardingStatus === status).length;
              return (
                <div key={status} className="text-center p-3 rounded-lg" style={{ backgroundColor: `${color}10` }}>
                  <p className="text-2xl font-bold" style={{ color }}>{count}</p>
                  <p className="text-[10px] text-[var(--pinbank-blue)]/50">{status}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPICard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-xl font-bold text-[var(--pinbank-blue)]">{value}</p>
        <p className="text-[10px] text-[var(--pinbank-blue)]/50">{label}</p>
      </div>
    </div>
  );
}