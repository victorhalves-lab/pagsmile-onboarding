import React from 'react';
import { Card } from '@/components/ui/card';
import StatCard from './StatCard';
import MinMaxMedianTable from './MinMaxMedianTable';
import DonutChart from './DonutChart';
import HorizontalBarList from './HorizontalBarList';
import { calcStats, formatNumber } from './insightsUtils';
import { Shield, AlertTriangle, CheckCircle2, Clock, FileText, Users, Building2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function InsightsComplianceSection({ cases, complianceScores, merchants, documents, questionnaireResponses }) {
  return (
    <div className="space-y-5 mt-4">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full h-auto bg-white border">
          <TabsTrigger value="overview" className="text-xs py-2">Visão Geral</TabsTrigger>
          <TabsTrigger value="sentinel" className="text-xs py-2">Scores SENTINEL</TabsTrigger>
          <TabsTrigger value="merchants" className="text-xs py-2">Perfil Merchants</TabsTrigger>
          <TabsTrigger value="questionnaire" className="text-xs py-2">Respostas</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs py-2">Documentos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview"><OverviewTab cases={cases} complianceScores={complianceScores} /></TabsContent>
        <TabsContent value="sentinel"><SentinelTab complianceScores={complianceScores} /></TabsContent>
        <TabsContent value="merchants"><MerchantsTab merchants={merchants} /></TabsContent>
        <TabsContent value="questionnaire"><QuestionnaireTab responses={questionnaireResponses} /></TabsContent>
        <TabsContent value="documents"><DocumentsTab documents={documents} /></TabsContent>
      </Tabs>
    </div>
  );
}

function OverviewTab({ cases, complianceScores }) {
  const statusMap = {};
  cases.forEach(c => { statusMap[c.status || 'N/A'] = (statusMap[c.status || 'N/A'] || 0) + 1; });
  const iaMap = {};
  cases.forEach(c => { iaMap[c.iaDecision || 'N/A'] = (iaMap[c.iaDecision || 'N/A'] || 0) + 1; });
  const priorMap = {};
  cases.forEach(c => { priorMap[c.priority || 'medium'] = (priorMap[c.priority || 'medium'] || 0) + 1; });

  const riskScoreStats = calcStats(cases.map(c => c.riskScore));
  const totalCases = cases.length;
  const approved = statusMap['Aprovado'] || 0;
  const rejected = statusMap['Recusado'] || 0;
  const manual = statusMap['Manual'] || 0;
  const approvalRate = totalCases > 0 ? ((approved / totalCases) * 100).toFixed(1) : 0;
  const subsellerCount = cases.filter(c => c.isSubsellerCase).length;

  // Red flags
  const flagMap = {};
  cases.forEach(c => (c.redFlags || []).forEach(f => { flagMap[f.substring(0, 80)] = (flagMap[f.substring(0, 80)] || 0) + 1; }));
  const topFlags = Object.entries(flagMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-5 mt-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total Casos" value={totalCases} subtitle={`${subsellerCount} subsellers`} icon={Shield} />
        <StatCard label="Taxa Aprovação" value={`${approvalRate}%`} subtitle={`${approved} aprovados`} icon={CheckCircle2} />
        <StatCard label="Recusados" value={rejected} subtitle={`${totalCases > 0 ? ((rejected / totalCases) * 100).toFixed(1) : 0}%`} icon={AlertTriangle} color="text-red-500" />
        <StatCard label="Rev. Manual" value={manual} subtitle={`${totalCases > 0 ? ((manual / totalCases) * 100).toFixed(1) : 0}%`} icon={Clock} />
        <StatCard label="Risk Score Med." value={formatNumber(riskScoreStats.median)} icon={AlertTriangle} />
      </div>

      <MinMaxMedianTable
        title="Risk Score — Mín / Mediana / Média / Máx"
        rows={[{ label: 'Risk Score (0-100)', stats: riskScoreStats }].filter(r => r.stats.count > 0)}
        formatter={formatNumber}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DonutChart title="Status" data={Object.entries(statusMap).map(([n, v]) => ({ name: n, value: v }))} colorMap={{ Aprovado: '#2bc196', Recusado: '#ef4444', Manual: '#f59e0b', Pendente: '#94a3b8', 'Em Processamento': '#002443', 'Docs Solicitados': '#8b5cf6' }} />
        <DonutChart title="Decisão IA" data={Object.entries(iaMap).map(([n, v]) => ({ name: n, value: v }))} colorMap={{ Aprovado: '#2bc196', Recusado: '#ef4444', Manual: '#f59e0b' }} />
        <DonutChart title="Prioridade" data={Object.entries(priorMap).map(([n, v]) => ({ name: n, value: v }))} colorMap={{ low: '#2bc196', medium: '#f59e0b', high: '#ef4444', critical: '#7c2d12' }} />
      </div>

      {topFlags.length > 0 && <HorizontalBarList title="Top Red Flags" data={topFlags} color="#ef4444" />}
    </div>
  );
}

function SentinelTab({ complianceScores }) {
  if (!complianceScores.length) return <Card className="p-8 text-center"><p className="text-sm text-[#002443]/50">Nenhum score SENTINEL disponível.</p></Card>;

  // V4 = fonte de verdade atual (score_final 0-849, 3 camadas).
  // Legado SQ/SVE/SGC são preservados, mas só aparecem se realmente houver dados.
  const sfStats = calcStats(complianceScores.map(s => s.score_final));
  const c1Stats = calcStats(complianceScores.map(s => s.score_base_segmento));
  const c2Stats = calcStats(complianceScores.map(s => s.score_variaveis));
  const c3Stats = calcStats(complianceScores.map(s => s.score_enriquecimento));
  const sqStats = calcStats(complianceScores.map(s => s.score_questionario));
  const sveStats = calcStats(complianceScores.map(s => s.score_validacao_externa));
  const sgcStats = calcStats(complianceScores.map(s => s.score_geral_composto));
  const bonusStats = calcStats(complianceScores.map(s => s.bonus_consistencia));
  const confidenceStats = calcStats(complianceScores.map(s => s.nivel_confianca_ia));
  const findingsStats = calcStats(complianceScores.map(s => s.total_findings));

  // Recomendação: usa recomendacao_final, com fallback p/ subfaixa
  const SUBFAIXA_TO_DECISION = {
    '1A': 'Aprovado', '1B': 'Aprovado',
    '2A': 'Aprovado', '2B': 'Aprovado',
    '3A': 'Aprovado com Condições', '3B': 'Aprovado com Condições',
    '4': 'Revisão Manual', '5': 'Recusado',
  };
  const recMap = {};
  complianceScores.forEach(s => {
    const r = s.recomendacao_final || SUBFAIXA_TO_DECISION[s.subfaixa] || 'Pendente';
    recMap[r] = (recMap[r] || 0) + 1;
  });

  // Subfaixa distribution (V4)
  const subfaixaMap = {};
  complianceScores.forEach(s => { if (s.subfaixa) subfaixaMap[s.subfaixa] = (subfaixaMap[s.subfaixa] || 0) + 1; });

  const sevTotals = {};
  complianceScores.forEach(s => { Object.entries(s.findings_por_severidade || {}).forEach(([k, v]) => { sevTotals[k] = (sevTotals[k] || 0) + v; }); });

  const f1 = complianceScores.filter(s => s.fase_1_completa).length;
  const f2 = complianceScores.filter(s => s.fase_2_completa).length;
  const f3 = complianceScores.filter(s => s.fase_3_completa).length;

  return (
    <div className="space-y-5 mt-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Análises" value={complianceScores.length} subtitle={`F1: ${f1} | F2: ${f2} | F3: ${f3}`} icon={Shield} />
        <StatCard label="Score Final Med. (V4)" value={formatNumber(sfStats.median)} subtitle={`Min: ${formatNumber(sfStats.min)} / Max: ${formatNumber(sfStats.max)} / 849`} icon={Shield} />
        <StatCard label="Confiança IA" value={`${confidenceStats.median}%`} icon={CheckCircle2} />
        <StatCard label="Findings Média" value={formatNumber(findingsStats.avg)} subtitle={`Max: ${formatNumber(findingsStats.max)}`} icon={AlertTriangle} />
      </div>

      <MinMaxMedianTable
        title="Scores SENTINEL — V4 + Legado (apenas com dados)"
        rows={[
          { label: 'Score Final V4 (0-849)', stats: sfStats },
          { label: 'C1 - Base Segmento', stats: c1Stats },
          { label: 'C2 - Variáveis', stats: c2Stats },
          { label: 'C3 - Enriquecimento', stats: c3Stats },
          { label: 'Score Questionário [LEGADO]', stats: sqStats },
          { label: 'Score Validação Externa [LEGADO]', stats: sveStats },
          { label: 'Score Geral Composto [LEGADO]', stats: sgcStats },
          { label: 'Bônus Consistência [LEGADO]', stats: bonusStats },
          { label: 'Confiança IA (0-100)', stats: confidenceStats },
          { label: 'Total Findings', stats: findingsStats },
        ].filter(r => r.stats.count > 0)}
        formatter={formatNumber}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DonutChart title="Recomendação (V4 + Sentinel)" data={Object.entries(recMap).map(([n, v]) => ({ name: n, value: v }))} colorMap={{ Aprovado: '#2bc196', 'Aprovado com Condições': '#36706c', 'Revisão Manual': '#f59e0b', Recusado: '#ef4444', Pendente: '#94a3b8' }} />
        {Object.keys(subfaixaMap).length > 0 && (
          <DonutChart title="Subfaixa V4" data={Object.entries(subfaixaMap).sort(([a],[b]) => a.localeCompare(b)).map(([n, v]) => ({ name: n, value: v }))} colorMap={{ '1A': '#22c55e', '1B': '#4ade80', '2A': '#3b82f6', '2B': '#60a5fa', '3A': '#eab308', '3B': '#facc15', '4': '#f97316', '5': '#ef4444' }} />
        )}
        {Object.keys(sevTotals).length > 0 && <DonutChart title="Findings por Severidade" data={Object.entries(sevTotals).map(([n, v]) => ({ name: n, value: v }))} colorMap={{ critico: '#ef4444', alto: '#f59e0b', medio: '#94a3b8', baixo: '#2bc196', info: '#64748b' }} />}
      </div>
    </div>
  );
}

function MerchantsTab({ merchants }) {
  if (!merchants.length) return <Card className="p-8 text-center"><p className="text-sm text-[#002443]/50">Nenhum merchant.</p></Card>;

  const typeMap = {};
  merchants.forEach(m => { typeMap[m.type || 'N/A'] = (typeMap[m.type || 'N/A'] || 0) + 1; });
  const statusMap = {};
  merchants.forEach(m => { statusMap[m.onboardingStatus || 'N/A'] = (statusMap[m.onboardingStatus || 'N/A'] || 0) + 1; });
  const payMap = {};
  merchants.forEach(m => (m.paymentServices || []).forEach(p => { payMap[p] = (payMap[p] || 0) + 1; }));
  const riskStats = calcStats(merchants.map(m => m.riskScore));
  const subCount = merchants.filter(m => m.isSubseller).length;

  return (
    <div className="space-y-5 mt-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Merchants" value={merchants.length} subtitle={`${subCount} subsellers`} icon={Building2} />
        <StatCard label="PJ / PF" value={`${typeMap['PJ'] || 0} / ${typeMap['PF'] || 0}`} icon={Users} />
        <StatCard label="Risk Score Med." value={formatNumber(riskStats.median)} icon={AlertTriangle} />
        <StatCard label="Aprovados" value={statusMap['Aprovado'] || 0} subtitle={`${statusMap['Recusado'] || 0} recusados`} icon={CheckCircle2} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DonutChart title="Tipo" data={Object.entries(typeMap).map(([n, v]) => ({ name: n === 'PJ' ? 'Pessoa Jurídica' : n === 'PF' ? 'Pessoa Física' : n, value: v }))} />
        <DonutChart title="Status Onboarding" data={Object.entries(statusMap).map(([n, v]) => ({ name: n, value: v }))} colorMap={{ Aprovado: '#2bc196', Recusado: '#ef4444', Manual: '#f59e0b', Pendente: '#94a3b8' }} />
        <DonutChart title="Serviços" data={Object.entries(payMap).map(([n, v]) => ({ name: n, value: v }))} />
      </div>
    </div>
  );
}

function QuestionnaireTab({ responses }) {
  if (!responses.length) return <Card className="p-8 text-center"><p className="text-sm text-[#002443]/50">Nenhuma resposta.</p></Card>;

  const questionMap = {};
  responses.forEach(r => {
    const qt = r.questionText || r.questionId || 'N/A';
    if (!questionMap[qt]) questionMap[qt] = { count: 0, values: [], type: r.questionType };
    questionMap[qt].count++;
    const val = r.valueText || (r.valueArray?.length ? r.valueArray.join(', ') : null) || (r.valueBoolean != null ? String(r.valueBoolean) : null) || (r.valueNumber != null ? String(r.valueNumber) : null);
    if (val) questionMap[qt].values.push(val);
  });

  const uniqueCases = new Set(responses.map(r => r.onboardingCaseId)).size;

  // Key compliance distributions
  const keyIds = ['modeloNegocio', 'canaisVenda', 'tipoEmpresa', 'segmento', 'servicosPagamento', 'modeloClientes'];
  const keyData = keyIds.map(qId => {
    const matches = responses.filter(r => r.questionId === qId);
    if (!matches.length) return null;
    const optMap = {};
    matches.forEach(r => {
      const val = r.valueText || (r.valueArray?.length ? r.valueArray.join(', ') : '');
      val.split(',').map(s => s.trim()).filter(Boolean).forEach(opt => { optMap[opt] = (optMap[opt] || 0) + 1; });
    });
    return {
      title: matches[0].questionText || qId,
      data: Object.entries(optMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value })),
    };
  }).filter(Boolean);

  // SELECT/MULTI_SELECT distributions
  const selectQuestions = Object.entries(questionMap)
    .filter(([_, d]) => ['SELECT', 'MULTI_SELECT'].includes(d.type) && d.values.length > 2)
    .map(([question, d]) => {
      const optMap = {};
      d.values.forEach(v => { v.split(',').map(s => s.trim()).filter(Boolean).forEach(opt => { optMap[opt] = (optMap[opt] || 0) + 1; }); });
      return { title: question, data: Object.entries(optMap).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value]) => ({ name, value })) };
    })
    .filter(q => q.data.length > 1)
    .slice(0, 12);

  return (
    <div className="space-y-5 mt-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Respostas" value={responses.length} icon={FileText} />
        <StatCard label="Casos" value={uniqueCases} icon={Shield} />
        <StatCard label="Perguntas Únicas" value={Object.keys(questionMap).length} icon={FileText} />
      </div>

      {keyData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {keyData.map((kd, i) => <HorizontalBarList key={i} title={kd.title} data={kd.data} />)}
        </div>
      )}

      {selectQuestions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectQuestions.map((sq, i) => <HorizontalBarList key={i} title={sq.title} data={sq.data} color="#002443" />)}
        </div>
      )}
    </div>
  );
}

function DocumentsTab({ documents }) {
  if (!documents.length) return <Card className="p-8 text-center"><p className="text-sm text-[#002443]/50">Nenhum documento.</p></Card>;

  const statusMap = {};
  documents.forEach(d => { statusMap[d.validationStatus || 'N/A'] = (statusMap[d.validationStatus || 'N/A'] || 0) + 1; });
  // Usa documentTypeId (ID estável) para agrupar; cai em documentName só se faltar typeId
  const typeMap = {};
  documents.forEach(d => {
    const key = d.documentTypeId || d.documentName || 'N/A';
    typeMap[key] = (typeMap[key] || 0) + 1;
  });
  const formatMap = {};
  documents.forEach(d => { formatMap[d.fileType || 'N/A'] = (formatMap[d.fileType || 'N/A'] || 0) + 1; });
  const sizeStats = calcStats(documents.map(d => d.fileSize));
  const uniqueCases = new Set(documents.map(d => d.onboardingCaseId)).size;
  const pending = statusMap['Pendente'] || 0;
  const validated = statusMap['Validado'] || 0;
  const rejected = statusMap['Rejeitado'] || 0;

  return (
    <div className="space-y-5 mt-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Documentos" value={documents.length} subtitle={`${uniqueCases} casos`} icon={FileText} />
        <StatCard label="Pendentes" value={pending} subtitle={`${documents.length > 0 ? ((pending / documents.length) * 100).toFixed(0) : 0}%`} icon={Clock} />
        <StatCard label="Validados" value={validated} icon={CheckCircle2} />
        <StatCard label="Rejeitados" value={rejected} icon={AlertTriangle} color="text-red-500" />
        <StatCard label="Tam. Médio" value={`${(sizeStats.avg / 1024).toFixed(0)} KB`} icon={FileText} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DonutChart title="Status de Validação" data={Object.entries(statusMap).map(([n, v]) => ({ name: n, value: v }))} colorMap={{ Pendente: '#f59e0b', Validado: '#2bc196', Rejeitado: '#ef4444', Erro: '#94a3b8' }} />
        <DonutChart title="Formato" data={Object.entries(formatMap).map(([n, v]) => ({ name: n, value: v }))} />
      </div>

      <HorizontalBarList title="Tipos de Documento" data={Object.entries(typeMap).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }))} />
    </div>
  );
}