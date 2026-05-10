import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, DollarSign, CheckCircle, XCircle, BarChart3, TrendingUp, Clock, Target, Wallet, ArrowUpRight } from 'lucide-react';
import moment from 'moment';

const formatMoeda = (val) => {
  if (!val) return 'R$ 0';
  if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1)}M`;
  if (val >= 1000) return `R$ ${(val / 1000).toFixed(0)}k`;
  return `R$ ${val.toLocaleString('pt-BR')}`;
};

export default function PipelineMetrics({ leads, proposals = [], dealClosedIds = new Set() }) {
  const metrics = useMemo(() => {
    const total = leads.length;
    const byStatus = {};
    leads.forEach(l => { byStatus[l.status] = (byStatus[l.status] || 0) + 1; });

    // Closed deals from pre-computed set
    const closedLeads = leads.filter(l => dealClosedIds.has(l.id));
    const closedCount = closedLeads.length;

    // Lost
    const perdidos = (byStatus['perdido'] || 0) + (byStatus['proposta_recusada'] || 0);

    // Active pipeline (not closed, not lost)
    const activeLeads = leads.filter(l => !dealClosedIds.has(l.id) && !['perdido', 'proposta_recusada'].includes(l.status));

    // Conversion rate
    const conversionRate = total > 0 ? ((closedCount / total) * 100).toFixed(1) : 0;

    // Build proposal TPV lookup (minimoGarantido > lead.tpvMensal)
    const proposalTpvLookup = {};
    proposals.forEach(p => {
      if (!p.leadId) return;
      const tpv = p.rates?.minimoGarantido?.mes3 || p.rates?.minimoGarantido?.mes2 || p.rates?.minimoGarantido?.mes1 || 0;
      if (tpv > (proposalTpvLookup[p.leadId] || 0)) proposalTpvLookup[p.leadId] = tpv;
    });
    const getLeadTpv = (l) => proposalTpvLookup[l.id] || l.tpvMensal || 0;

    // TPV from accepted proposals without leadId (orphan proposals)
    const orphanAcceptedTpv = proposals
      .filter(p => p.status === 'aceita' && !p.leadId)
      .reduce((s, p) => s + (p.rates?.minimoGarantido?.mes3 || p.rates?.minimoGarantido?.mes2 || p.rates?.minimoGarantido?.mes1 || 0), 0);

    // TPV metrics
    const totalTPV = leads.reduce((s, l) => s + getLeadTpv(l), 0) + orphanAcceptedTpv;
    const tpvFechado = closedLeads.reduce((s, l) => s + getLeadTpv(l), 0) + orphanAcceptedTpv;
    const tpvPipeline = activeLeads.reduce((s, l) => s + getLeadTpv(l), 0);
    const tpvPropostaEnviada = leads.filter(l => l.status === 'proposta_enviada').reduce((s, l) => s + getLeadTpv(l), 0);

    // Real revenue from accepted proposals (using actual rates)
    const proposalMap = {};
    proposals.forEach(p => {
      if (p.leadId && p.status === 'aceita' && p.isCurrentVersion !== false) {
        proposalMap[p.leadId] = p;
      }
    });

    let receitaFechadaReal = 0;
    closedLeads.forEach(l => {
      const prop = proposalMap[l.id];
      if (prop?.rates) {
        // Calculate weighted MDR from card rates
        const r = prop.rates;
        const cardRates = r.cartao || {};
        let sumMdr = 0, countMdr = 0;
        for (const brand of Object.values(cardRates)) {
          if (brand?.avista) { sumMdr += brand.avista; countMdr++; }
        }
        const avgMdr = countMdr > 0 ? sumMdr / countMdr : 2.5;
        const pixRate = r.pix?.tipo === 'percentual' ? (r.pix?.valor || 0) : 0;
        const feePerTx = (r.feeTransacao || 0) + (r.antifraude || 0);
        const txPerMonth = l.transacoesMes || (l.tpvMensal && l.ticketMedio ? l.tpvMensal / l.ticketMedio : 0);

        const revMdr = (l.tpvMensal || 0) * (avgMdr / 100);
        const revPix = (l.tpvMensal || 0) * (pixRate / 100);
        const revFees = txPerMonth * feePerTx;
        receitaFechadaReal += revMdr + revPix + revFees;
      } else {
        receitaFechadaReal += (l.tpvMensal || 0) * 0.025;
      }
    });

    // Estimated revenue from pipeline
    const receitaPipelineEstimada = tpvPipeline * 0.025;

    // Ticket médio dos fechados
    const ticketMedioFechado = closedCount > 0 ? tpvFechado / closedCount : 0;

    // Tempo médio de ciclo (dias entre criação e aceite da proposta)
    let totalCycleDays = 0, cycleCount = 0;
    closedLeads.forEach(l => {
      const prop = proposalMap[l.id];
      if (prop?.acceptedDate && l.created_date) {
        const days = moment(prop.acceptedDate).diff(moment(l.created_date), 'days');
        if (days >= 0) { totalCycleDays += days; cycleCount++; }
      }
    });
    const avgCycleDays = cycleCount > 0 ? Math.round(totalCycleDays / cycleCount) : 0;

    // Em negociação (proposta enviada + proposta aceita sem contrato)
    const emNegociacao = (byStatus['proposta_enviada'] || 0);

    return {
      total, closedCount, perdidos, conversionRate,
      totalTPV, tpvFechado, tpvPipeline, tpvPropostaEnviada,
      receitaFechadaReal, receitaPipelineEstimada,
      ticketMedioFechado, avgCycleDays, emNegociacao,
      activeCount: activeLeads.length,
    };
  }, [leads, proposals, dealClosedIds]);

  const kpis = [
    { label: 'Leads no Funil', value: metrics.total, sub: `${metrics.activeCount} ativos`, icon: Users, iconColor: 'text-blue-500', valueColor: 'text-[var(--pagsmile-blue)]' },
    { label: 'Negócios Fechados', value: metrics.closedCount, sub: `${metrics.conversionRate}% conversão`, icon: CheckCircle, iconColor: 'text-emerald-500', valueColor: 'text-emerald-600' },
    { label: 'TPV Fechado/mês', value: formatMoeda(metrics.tpvFechado), sub: `Anual: ${formatMoeda(metrics.tpvFechado * 12)}`, icon: DollarSign, iconColor: 'text-emerald-600', valueColor: 'text-emerald-700' },
    { label: 'Receita Fechada/mês', value: formatMoeda(metrics.receitaFechadaReal), sub: `Anual: ${formatMoeda(metrics.receitaFechadaReal * 12)}`, icon: Wallet, iconColor: 'text-green-600', valueColor: 'text-green-700' },
    { label: 'TPV Pipeline/mês', value: formatMoeda(metrics.tpvPipeline), sub: `Em negociação: ${formatMoeda(metrics.tpvPropostaEnviada)}`, icon: TrendingUp, iconColor: 'text-blue-500', valueColor: 'text-blue-600' },
    { label: 'Receita Pipeline Est.', value: formatMoeda(metrics.receitaPipelineEstimada), sub: `Anual: ${formatMoeda(metrics.receitaPipelineEstimada * 12)}`, icon: BarChart3, iconColor: 'text-purple-500', valueColor: 'text-purple-600' },
    { label: 'Ticket Médio Fechado', value: formatMoeda(metrics.ticketMedioFechado), sub: 'TPV/mês por negócio', icon: Target, iconColor: 'text-amber-500', valueColor: 'text-amber-600' },
    { label: 'Ciclo Médio', value: metrics.avgCycleDays > 0 ? `${metrics.avgCycleDays}d` : '-', sub: 'Lead → Fechamento', icon: Clock, iconColor: 'text-indigo-500', valueColor: 'text-indigo-600' },
    { label: 'Em Negociação', value: metrics.emNegociacao, sub: `TPV: ${formatMoeda(metrics.tpvPropostaEnviada)}`, icon: ArrowUpRight, iconColor: 'text-orange-500', valueColor: 'text-orange-600' },
    { label: 'Perdidos', value: metrics.perdidos, sub: total => `${metrics.total > 0 ? ((metrics.perdidos / metrics.total) * 100).toFixed(0) : 0}% do total`, icon: XCircle, iconColor: 'text-red-500', valueColor: 'text-red-600' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        const subText = typeof kpi.sub === 'function' ? kpi.sub(metrics.total) : kpi.sub;
        return (
          <Card key={kpi.label} className="rounded-2xl border-[#002443]/5 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${kpi.iconColor}`} />
                <span className="text-[10px] text-[var(--pagsmile-blue)]/60 leading-tight">{kpi.label}</span>
              </div>
              <p className={`text-xl font-bold mt-1 ${kpi.valueColor}`}>{kpi.value}</p>
              {subText && <p className="text-[9px] text-[var(--pagsmile-blue)]/40 mt-0.5">{subText}</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}