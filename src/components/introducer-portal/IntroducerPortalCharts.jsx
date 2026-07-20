import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import moment from 'moment';
import { useTranslation } from '@/lib/i18n/LanguageContext';

const STATUS_COLORS = {
  questionario_preenchido: '#3b82f6',
  analisado_priscila: '#8b5cf6',
  em_contato_comercial: '#f59e0b',
  proposta_enviada: '#6366f1',
  proposta_aceita: '#22c55e',
  proposta_recusada: '#ef4444',
  kyc_iniciado: '#06b6d4',
  kyc_aprovado: '#10b981',
  ativado: '#1356E2',
  perdido: '#94a3b8',
};

const STATUS_LABELS = {
  questionario_preenchido: 'Questionário',
  analisado_priscila: 'Análise',
  em_contato_comercial: 'Contato',
  proposta_enviada: 'Proposta Enviada',
  proposta_aceita: 'Aceita',
  proposta_recusada: 'Recusada',
  kyc_iniciado: 'KYC',
  kyc_aprovado: 'KYC OK',
  ativado: 'Ativado',
  perdido: 'Perdido',
};

export default function IntroducerPortalCharts({ leads }) {
  const { t } = useTranslation();

  const STATUS_LABELS_I18N = {
    questionario_preenchido: t('idash.chart_questionario'),
    analisado_priscila: t('idash.chart_analise'),
    em_contato_comercial: t('idash.chart_contato'),
    proposta_enviada: t('idash.chart_prop_enviada'),
    proposta_aceita: t('idash.chart_aceita'),
    proposta_recusada: t('idash.chart_recusada'),
    kyc_iniciado: t('idash.chart_kyc'),
    kyc_aprovado: t('idash.chart_kyc_ok'),
    ativado: t('idash.chart_ativado'),
    perdido: t('idash.chart_perdido'),
  };

  const statusData = useMemo(() => {
    const counts = {};
    leads.forEach(l => {
      const s = l.status || 'questionario_preenchido';
      counts[s] = (counts[s] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count]) => ({
      name: STATUS_LABELS_I18N[status] || STATUS_LABELS[status] || status,
      value: count,
      color: STATUS_COLORS[status] || '#94a3b8',
    }));
  }, [leads]);

  const monthlyData = useMemo(() => {
    const months = {};
    leads.forEach(l => {
      const m = moment(l.created_date).format('MMM/YY');
      months[m] = (months[m] || 0) + 1;
    });
    const sortedKeys = Object.keys(months).sort((a, b) => moment(a, 'MMM/YY').diff(moment(b, 'MMM/YY')));
    return sortedKeys.slice(-6).map(m => ({ mes: m, leads: months[m] }));
  }, [leads]);

  if (leads.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-[#0A0A0A]/5">
        <p className="text-sm text-[#0A0A0A]/40">{t('idash.no_chart_data')}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Pie Chart - Status */}
      <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 p-4">
        <h3 className="text-sm font-bold text-[#0A0A0A] mb-4">{t('idash.status_distribution')}</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={2}>
              {statusData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => [value, 'Leads']} />
            <Legend iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Bar Chart - Monthly */}
      <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 p-4">
        <h3 className="text-sm font-bold text-[#0A0A0A] mb-4">{t('idash.leads_per_month')}</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="mes" tick={{ fontSize: 10, fill: '#0A0A0A' }} />
            <YAxis tick={{ fontSize: 10, fill: '#0A0A0A' }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="leads" fill="#1356E2" radius={[6, 6, 0, 0]} name="Leads" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}