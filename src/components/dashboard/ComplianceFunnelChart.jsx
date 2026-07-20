import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { BarChart3 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function ComplianceFunnelChart({ data }) {
  const { t } = useTranslation();
  // Colors mapped by index position since names are now translated
  const colorList = ['#1356E2', '#E84B1C', '#0A0A0A', '#3b82f6', '#f97316'];

  const chartData = data || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-4 h-4 text-[#1356E2]/70" />
        <h3 className="font-bold text-[#1356E2]">{t('chart.compliance_funnel')}</h3>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          layout="vertical"
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} stroke="#94a3b8" />
          <YAxis 
            dataKey="name" 
            type="category" 
            tick={{ fontSize: 12 }} 
            stroke="#94a3b8" 
            width={100}
          />
          <Tooltip 
            formatter={(value) => [value.toLocaleString('pt-BR'), 'Total']}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colorList[index] || '#94a3b8'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}