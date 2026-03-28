import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, RefreshCw, Brain, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ReactMarkdown from 'react-markdown';

export default function InsightsAISection({ leads, proposals, cases, complianceScores, merchants }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateInsights = async () => {
    setLoading(true);

    // Prepare summary data for IA
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

    const summary = `
DADOS CONSOLIDADOS DA OPERAÇÃO:

LEADS (${leads.length} total):
- Status: ${JSON.stringify(statusCounts)}
- Tipo de negócio: ${JSON.stringify(bizCounts)}
- Nível de risco PRISCILA: ${JSON.stringify(riskCounts)}
- TPV total potencial: R$ ${tpvTotal.toLocaleString('pt-BR')} | TPV mediano: R$ ${tpvMedian.toLocaleString('pt-BR')}
- Ticket médio mediano: R$ ${ticketMedian.toLocaleString('pt-BR')}
- Top Introducers: ${topIntros.map(([n, c]) => `${n}: ${c}`).join(', ') || 'nenhum'}

PROPOSTAS (${proposals.length} total):
- Status: ${JSON.stringify(proposalStatus)}

COMPLIANCE (${cases.length} casos):
- Status: ${JSON.stringify(compStatus)}
- SENTINEL recomendações: ${JSON.stringify(sentinelRecs)}
- Top Red Flags: ${topFlags.map(([f, c]) => `"${f}": ${c}x`).join(', ') || 'nenhum'}

MERCHANTS (${merchants.length} total):
- Aprovados: ${merchantApproved} | Recusados: ${merchantRejected}
`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt: `Você é um analista de dados sênior de uma empresa de pagamentos (adquirente/subadquirente). Analise os dados abaixo e gere insights estratégicos acionáveis em PORTUGUÊS.

${summary}

Gere exatamente esta estrutura JSON:
- trends: array de 3-5 tendências observadas nos dados (string curta cada)
- risks: array de 3-5 riscos ou alertas identificados (string curta cada)
- opportunities: array de 3-5 oportunidades de negócio identificadas (string curta cada)  
- executive_summary: texto de 3-4 parágrafos com análise executiva detalhada, incluindo números e percentuais
- recommendations: array de 3-5 recomendações concretas para a equipe (string cada)`,
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
      <div className="mt-4">
        <Card className="p-12 text-center bg-gradient-to-br from-[#002443]/[0.03] to-[#2bc196]/[0.05]">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2bc196] to-[#002443] flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-lg font-bold text-[#002443] mb-2">Insights Gerados por IA</h3>
          <p className="text-sm text-[#002443]/50 mb-6 max-w-md mx-auto">
            A IA analisará todos os {leads.length} leads, {proposals.length} propostas, {cases.length} casos de compliance e {merchants.length} merchants para extrair tendências, riscos e oportunidades.
          </p>
          <Button onClick={generateInsights} className="gap-2">
            <Sparkles className="w-4 h-4" />
            Gerar Insights com IA
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mt-4">
        <Card className="p-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#2bc196] mx-auto mb-3" />
          <p className="text-sm text-[#002443]/60">Analisando dados e gerando insights...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 mt-4">
      {/* Refresh */}
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={generateInsights} className="gap-1.5 text-xs">
          <RefreshCw className="w-3.5 h-3.5" /> Regenerar
        </Button>
      </div>

      {/* Executive Summary */}
      <Card className="p-6 border-l-4 border-l-[#2bc196]">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-[#2bc196]" />
          <h3 className="text-base font-bold text-[#002443]">Resumo Executivo</h3>
        </div>
        <div className="prose prose-sm max-w-none text-[#002443]/80">
          <ReactMarkdown>{insights.executive_summary}</ReactMarkdown>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Trends */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-sm font-bold text-[#002443]">Tendências</h3>
          </div>
          <ul className="space-y-2">
            {(insights.trends || []).map((t, i) => (
              <li key={i} className="flex gap-2 text-xs text-[#002443]/70">
                <span className="text-blue-500 font-bold mt-0.5">→</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Risks */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
            <h3 className="text-sm font-bold text-[#002443]">Riscos & Alertas</h3>
          </div>
          <ul className="space-y-2">
            {(insights.risks || []).map((r, i) => (
              <li key={i} className="flex gap-2 text-xs text-[#002443]/70">
                <span className="text-red-500 font-bold mt-0.5">⚠</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Card>

        {/* Opportunities */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-[#002443]">Oportunidades</h3>
          </div>
          <ul className="space-y-2">
            {(insights.opportunities || []).map((o, i) => (
              <li key={i} className="flex gap-2 text-xs text-[#002443]/70">
                <span className="text-emerald-500 font-bold mt-0.5">✦</span>
                <span>{o}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-[#2bc196]" />
          <h3 className="text-sm font-bold text-[#002443]">Recomendações Estratégicas</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(insights.recommendations || []).map((r, i) => (
            <div key={i} className="flex gap-3 p-3 bg-slate-50 rounded-xl">
              <div className="w-6 h-6 rounded-full bg-[#2bc196] flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-[10px] font-bold">{i + 1}</span>
              </div>
              <p className="text-xs text-[#002443]/70 leading-relaxed">{r}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}