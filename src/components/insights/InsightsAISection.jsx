import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, RefreshCw, Brain, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';

export default function InsightsAISection({ leads, proposals, cases, complianceScores, merchants }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);
    const statusCounts = {};
    leads.forEach(l => { statusCounts[l.status || 'N/A'] = (statusCounts[l.status || 'N/A'] || 0) + 1; });
    const bizCounts = {};
    leads.forEach(l => { bizCounts[l.businessSubCategory || 'N/A'] = (bizCounts[l.businessSubCategory || 'N/A'] || 0) + 1; });
    const riskCounts = {};
    leads.forEach(l => { riskCounts[l.priscilaRiskLevel || 'N/A'] = (riskCounts[l.priscilaRiskLevel || 'N/A'] || 0) + 1; });
    const proposalStatus = {};
    proposals.forEach(p => { proposalStatus[p.status || 'N/A'] = (proposalStatus[p.status || 'N/A'] || 0) + 1; });
    const compStatus = {};
    cases.forEach(c => { compStatus[c.status || 'N/A'] = (compStatus[c.status || 'N/A'] || 0) + 1; });
    const tpvValues = leads.filter(l => l.tpvMensal).map(l => l.tpvMensal);
    const tpvTotal = tpvValues.reduce((s, v) => s + v, 0);
    const tpvMedian = tpvValues.length > 0 ? tpvValues.sort((a, b) => a - b)[Math.floor(tpvValues.length / 2)] : 0;
    const ticketValues = leads.filter(l => l.ticketMedio).map(l => l.ticketMedio);
    const ticketMedian = ticketValues.length > 0 ? ticketValues.sort((a, b) => a - b)[Math.floor(ticketValues.length / 2)] : 0;
    const sentinelRecs = {};
    complianceScores.forEach(s => { sentinelRecs[s.recomendacao_final || 'N/A'] = (sentinelRecs[s.recomendacao_final || 'N/A'] || 0) + 1; });
    const redFlagsAll = {};
    cases.forEach(c => (c.redFlags || []).forEach(f => { redFlagsAll[f] = (redFlagsAll[f] || 0) + 1; }));
    const topFlags = Object.entries(redFlagsAll).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const merchantApproved = merchants.filter(m => m.onboardingStatus === 'Aprovado').length;
    const merchantRejected = merchants.filter(m => m.onboardingStatus === 'Recusado').length;
    const introLeads = {};
    leads.forEach(l => { if (l.introducerName) introLeads[l.introducerName] = (introLeads[l.introducerName] || 0) + 1; });
    const topIntros = Object.entries(introLeads).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const summary = `DADOS CONSOLIDADOS:
LEADS (${leads.length}): Status: ${JSON.stringify(statusCounts)} | Tipo: ${JSON.stringify(bizCounts)} | Risco: ${JSON.stringify(riskCounts)} | TPV total: R$${tpvTotal.toLocaleString('pt-BR')} | TPV mediano: R$${tpvMedian.toLocaleString('pt-BR')} | Ticket mediano: R$${ticketMedian.toLocaleString('pt-BR')} | Introducers: ${topIntros.map(([n, c]) => `${n}:${c}`).join(', ') || 'nenhum'}
PROPOSTAS (${proposals.length}): ${JSON.stringify(proposalStatus)}
COMPLIANCE (${cases.length}): ${JSON.stringify(compStatus)} | SENTINEL: ${JSON.stringify(sentinelRecs)} | Flags: ${topFlags.map(([f, c]) => `"${f}":${c}x`).join(', ') || '-'}
MERCHANTS (${merchants.length}): Aprovados:${merchantApproved} Recusados:${merchantRejected}`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um analista de dados sênior de uma empresa de pagamentos. Analise os dados e gere insights estratégicos em PORTUGUÊS.\n\n${summary}\n\nGere JSON: trends(3-5 strings), risks(3-5 strings), opportunities(3-5 strings), executive_summary(3-4 parágrafos detalhados), recommendations(3-5 strings)`,
      response_json_schema: {
        type: "object",
        properties: {
          trends: { type: "array", items: { type: "string" } },
          risks: { type: "array", items: { type: "string" } },
          opportunities: { type: "array", items: { type: "string" } },
          executive_summary: { type: "string" },
          recommendations: { type: "array", items: { type: "string" } },
        }
      }
    });
    setInsights(result);
    setLoading(false);
  };

  if (!insights && !loading) {
    return (
      <div className="mt-2">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-50 via-white to-[#2bc196]/5 border border-slate-100 p-16 text-center">
          <div className="absolute top-8 right-12 w-40 h-40 bg-[#2bc196]/10 rounded-full blur-[60px] pointer-events-none" />
          <div className="relative z-10">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#2bc196] to-[#002443] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#2bc196]/20">
              <Brain className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-extrabold text-[#002443] mb-2">Insights Gerados por IA</h3>
            <p className="text-sm text-[#002443]/40 mb-8 max-w-lg mx-auto leading-relaxed">
              Análise inteligente de <span className="font-bold text-[#002443]/60">{leads.length} leads</span>, <span className="font-bold text-[#002443]/60">{proposals.length} propostas</span> e <span className="font-bold text-[#002443]/60">{cases.length} casos</span> para extrair tendências, riscos e oportunidades estratégicas.
            </p>
            <Button onClick={generateInsights} size="lg" className="gap-2.5 px-8 rounded-xl shadow-lg shadow-[#2bc196]/25 hover:shadow-xl hover:shadow-[#2bc196]/30 transition-all">
              <Sparkles className="w-5 h-5" />
              Gerar Insights com IA
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-2">
        <div className="rounded-3xl bg-white border border-slate-100 p-16 text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-2xl bg-[#2bc196]/10 animate-ping" />
            <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-[#2bc196] to-[#002443] flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-white" />
            </div>
          </div>
          <p className="text-sm text-[#002443]/50 font-medium">Processando dados e gerando insights...</p>
        </div>
      </div>
    );
  }

  const cards = [
    { title: 'Tendências', icon: TrendingUp, color: '#3b82f6', bg: 'bg-blue-50', items: insights.trends || [], marker: '→' },
    { title: 'Riscos & Alertas', icon: AlertTriangle, color: '#ef4444', bg: 'bg-red-50', items: insights.risks || [], marker: '⚠' },
    { title: 'Oportunidades', icon: Lightbulb, color: '#2bc196', bg: 'bg-emerald-50', items: insights.opportunities || [], marker: '✦' },
  ];

  return (
    <div className="space-y-6 mt-2">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={generateInsights} className="gap-1.5 text-xs rounded-xl border-slate-200">
          <RefreshCw className="w-3.5 h-3.5" /> Regenerar
        </Button>
      </div>

      {/* Executive Summary */}
      <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-100 p-8">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#2bc196] to-[#002443]" />
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2bc196] to-[#002443] flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[#002443]">Resumo Executivo</h3>
            <p className="text-[10px] text-[#002443]/30 font-medium uppercase tracking-wider">Gerado por IA</p>
          </div>
        </div>
        <div className="prose prose-sm max-w-none text-[#002443]/70 leading-relaxed">
          <ReactMarkdown>{insights.executive_summary}</ReactMarkdown>
        </div>
      </div>

      {/* Three columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((card, ci) => (
          <div key={ci} className="rounded-2xl bg-white border border-slate-100 p-6 hover:shadow-lg hover:shadow-slate-100/50 transition-all duration-300">
            <div className="flex items-center gap-2.5 mb-4">
              <div className={`w-9 h-9 rounded-xl ${card.bg} flex items-center justify-center`}>
                <card.icon className="w-4.5 h-4.5" style={{ color: card.color }} />
              </div>
              <h3 className="text-sm font-extrabold text-[#002443]">{card.title}</h3>
            </div>
            <ul className="space-y-3">
              {card.items.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-xs text-[#002443]/60 leading-relaxed">
                  <span className="font-bold mt-0.5 flex-shrink-0" style={{ color: card.color }}>{card.marker}</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      <div className="rounded-2xl bg-white border border-slate-100 p-6">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-9 h-9 rounded-xl bg-[#2bc196]/10 flex items-center justify-center">
            <Sparkles className="w-4.5 h-4.5 text-[#2bc196]" />
          </div>
          <h3 className="text-sm font-extrabold text-[#002443]">Recomendações Estratégicas</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(insights.recommendations || []).map((r, i) => (
            <div key={i} className="flex gap-3 p-4 bg-gradient-to-r from-slate-50 to-white rounded-xl border border-slate-50 hover:border-[#2bc196]/20 transition-colors duration-200">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2bc196] to-[#36706c] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-[10px] font-extrabold">{i + 1}</span>
              </div>
              <p className="text-xs text-[#002443]/60 leading-relaxed">{r}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}