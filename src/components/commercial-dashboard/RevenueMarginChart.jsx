import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';

function formatBRL(value) {
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
  return `R$ ${value.toFixed(0)}`;
}

export default function RevenueMarginChart({ proposals, leads }) {
  // Calculate estimated revenue/cost/margin per month from all proposals with rates
  const data = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        name: d.toLocaleString('pt-BR', { month: 'short' }).replace('.', ''),
        month: d.getMonth(),
        year: d.getFullYear(),
      });
    }

    return months.map(({ name, month, year }) => {
      // Get proposals from this month that have revenue data
      const monthProposals = proposals.filter(p => {
        const cd = new Date(p.acceptedDate || p.created_date);
        return cd.getMonth() === month && cd.getFullYear() === year;
      });

      // Try explicit fields first
      let receita = monthProposals.reduce((s, p) => s + (p.estimatedRevenue || 0), 0);
      let custo = monthProposals.reduce((s, p) => s + (p.estimatedCost || 0), 0);
      let margem = monthProposals.reduce((s, p) => s + (p.estimatedMargin || 0), 0);

      // If no explicit data, estimate from rates & TPV
      if (receita === 0) {
        monthProposals.forEach(p => {
          const lead = leads.find(l => l.id === p.leadId);
          const tpv = lead?.tpvMensal || 0;
          if (tpv > 0 && p.rates?.cartao?.visa?.avista) {
            const avgMdr = p.rates.cartao.visa.avista || 3;
            const estReceita = tpv * (avgMdr / 100);
            const estCusto = estReceita * 0.55; // ~55% cost ratio estimate
            receita += estReceita;
            custo += estCusto;
            margem += (estReceita - estCusto);
          }
        });
      }

      return { name, receita: Math.round(receita), custo: Math.round(custo), margem: Math.round(margem) };
    });
  }, [proposals, leads]);

  const hasData = data.some(d => d.receita > 0 || d.custo > 0);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-[#1356E2]" />
        <h3 className="font-bold text-[#0A0A0A]">Receita vs Custo vs Margem</h3>
      </div>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center h-[240px] text-center px-4">
          <TrendingUp className="w-10 h-10 text-[#0A0A0A]/10 mb-3" />
          <p className="text-sm text-[#0A0A0A]/40 font-medium">Sem dados de rentabilidade calculados</p>
          <p className="text-xs text-[#0A0A0A]/30 mt-1">Os dados aparecem quando propostas aceitas possuem TPV e taxas definidas</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
            <YAxis tick={{ fontSize: 12 }} stroke="#94a3b8" tickFormatter={formatBRL} />
            <Tooltip
              formatter={(value, name) => [formatBRL(value), name]}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11, paddingTop: '10px' }} />
            <Bar dataKey="receita" name="Receita" fill="#1356E2" radius={[4, 4, 0, 0]} />
            <Bar dataKey="custo" name="Custo" fill="#ef4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="margem" name="Margem" fill="#E84B1C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}