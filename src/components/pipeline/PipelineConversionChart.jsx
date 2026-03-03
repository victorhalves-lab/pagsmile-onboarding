import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp } from 'lucide-react';

const STAGES = [
  { key: 'novo', label: 'Novos', statuses: ['questionario_preenchido', 'analisado_priscila'], color: '#6B7280' },
  { key: 'contato', label: 'Contato', statuses: ['em_contato_comercial'], color: '#F59E0B' },
  { key: 'proposta', label: 'Proposta', statuses: ['proposta_enviada'], color: '#3B82F6' },
  { key: 'aceita', label: 'Aceita', statuses: ['proposta_aceita'], color: '#10B981' },
  { key: 'kyc', label: 'KYC', statuses: ['kyc_iniciado', 'kyc_aprovado', 'kyc_revisao_manual'], color: '#8B5CF6' },
  { key: 'ativado', label: 'Ativado', statuses: ['ativado'], color: '#059669' },
];

export default function PipelineConversionChart({ leads }) {
  const data = useMemo(() => {
    return STAGES.map(stage => ({
      name: stage.label,
      count: leads.filter(l => stage.statuses.includes(l.status)).length,
      tpv: leads.filter(l => stage.statuses.includes(l.status)).reduce((s, l) => s + (l.tpvMensal || 0), 0),
      color: stage.color,
    }));
  }, [leads]);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-lg p-2 shadow-lg text-xs">
        <p className="font-medium text-[var(--pagsmile-blue)]">{d.name}</p>
        <p>{d.count} leads</p>
        <p className="text-[var(--pagsmile-green)]">TPV: R$ {(d.tpv / 1000).toFixed(0)}k</p>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[var(--pagsmile-green)]" />
          Funil de Conversão
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#002443' }} />
            <YAxis tick={{ fontSize: 10, fill: '#002443' }} allowDecimals={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}