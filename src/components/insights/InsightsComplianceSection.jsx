import React from 'react';
import { Card } from '@/components/ui/card';
import StatCard from './StatCard';
import MinMaxMedianTable from './MinMaxMedianTable';
import { calcStats, formatNumber } from './insightsUtils';
import { Shield, AlertTriangle, CheckCircle2, Clock, FileText, Users, Building2 } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const COLORS = ['#2bc196', '#002443', '#f59e0b', '#ef4444', '#94a3b8', '#8b5cf6', '#36706c', '#5cf7cf'];

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

        <TabsContent value="overview">
          <OverviewTab cases={cases} complianceScores={complianceScores} />
        </TabsContent>
        <TabsContent value="sentinel">
          <SentinelTab complianceScores={complianceScores} />
        </TabsContent>
        <TabsContent value="merchants">
          <MerchantsTab merchants={merchants} />
        </TabsContent>
        <TabsContent value="questionnaire">
          <QuestionnaireTab responses={questionnaireResponses} />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsTab documents={documents} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Overview Tab ──
function OverviewTab({ cases, complianceScores }) {
  const statusMap = {};
  cases.forEach(c => { statusMap[c.status || 'N/A'] = (statusMap[c.status || 'N/A'] || 0) + 1; });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  const iaMap = {};
  cases.forEach(c => { iaMap[c.iaDecision || 'N/A'] = (iaMap[c.iaDecision || 'N/A'] || 0) + 1; });
  const iaData = Object.entries(iaMap).map(([name, value]) => ({ name, value }));

  const riskScoreStats = calcStats(cases.map(c => c.riskScore));
  const totalCases = cases.length;
  const approved = statusMap['Aprovado'] || 0;
  const rejected = statusMap['Recusado'] || 0;
  const manual = statusMap['Manual'] || 0;
  const approvalRate = totalCases > 0 ? ((approved / totalCases) * 100).toFixed(1) : 0;

  // Red flags
  const flagMap = {};
  cases.forEach(c => (c.redFlags || []).forEach(f => { const k = f.substring(0, 80); flagMap[k] = (flagMap[k] || 0) + 1; }));
  const topFlags = Object.entries(flagMap).sort((a, b) => b[1] - a[1]).slice(0, 8);

  // Priority
  const priorMap = {};
  cases.forEach(c => { const p = c.priority || 'medium'; priorMap[p] = (priorMap[p] || 0) + 1; });
  const priorData = Object.entries(priorMap).map(([name, value]) => ({ name, value }));

  // Subseller vs Principal
  const subsellerCount = cases.filter(c => c.isSubsellerCase).length;
  const principalCount = cases.length - subsellerCount;

  return (
    <div className="space-y-5 mt-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total de Casos" value={totalCases} subtitle={`${subsellerCount} subsellers`} icon={Shield} />
        <StatCard label="Taxa Aprovação" value={`${approvalRate}%`} subtitle={`${approved} aprovados`} icon={CheckCircle2} />
        <StatCard label="Recusados" value={rejected} subtitle={`${totalCases > 0 ? ((rejected / totalCases) * 100).toFixed(1) : 0}%`} icon={AlertTriangle} color="text-red-500" />
        <StatCard label="Rev. Manual" value={manual} subtitle={`${totalCases > 0 ? ((manual / totalCases) * 100).toFixed(1) : 0}%`} icon={Clock} />
        <StatCard label="Risk Score Med." value={formatNumber(riskScoreStats.median)} subtitle={`Min: ${formatNumber(riskScoreStats.min)}`} icon={AlertTriangle} />
      </div>

      <MinMaxMedianTable
        title="Risk Score dos Casos — Mín / Mediana / Média / Máx"
        rows={[{ label: 'Risk Score (0-100)', stats: riskScoreStats }].filter(r => r.stats.count > 0)}
        formatter={formatNumber}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <PieCard title="Status dos Casos" data={statusData} colorMap={{ Aprovado: '#2bc196', Recusado: '#ef4444', Manual: '#f59e0b', Pendente: '#94a3b8', 'Em Processamento': '#002443', 'Docs Solicitados': '#8b5cf6' }} />
        <PieCard title="Decisão da IA" data={iaData} colorMap={{ Aprovado: '#2bc196', Recusado: '#ef4444', 'Revisão Manual': '#f59e0b', 'Aprovado com Condições': '#36706c' }} />
        <PieCard title="Prioridade" data={priorData} colorMap={{ low: '#2bc196', medium: '#f59e0b', high: '#ef4444', critical: '#7c2d12' }} />
      </div>

      {topFlags.length > 0 && (
        <Card className="p-4">
          <h3 className="text-sm font-bold text-[#002443] mb-3">Top Red Flags Mais Frequentes</h3>
          <div className="space-y-2">
            {topFlags.map(([flag, count], i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <span className="text-xs text-red-800 flex-1 mr-4">{flag}</span>
                <span className="text-xs font-bold text-red-600 flex-shrink-0">{count}x</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── SENTINEL Scores Tab ──
function SentinelTab({ complianceScores }) {
  if (!complianceScores.length) return <Card className="p-8 text-center"><p className="text-sm text-[#002443]/50">Nenhum score SENTINEL disponível.</p></Card>;

  const sqStats = calcStats(complianceScores.map(s => s.score_questionario));
  const sveStats = calcStats(complianceScores.map(s => s.score_validacao_externa));
  const sgcStats = calcStats(complianceScores.map(s => s.score_geral_composto));
  const bonusStats = calcStats(complianceScores.map(s => s.bonus_consistencia));
  const confidenceStats = calcStats(complianceScores.map(s => s.nivel_confianca_ia));

  // Recommendation distribution
  const recMap = {};
  complianceScores.forEach(s => { recMap[s.recomendacao_final || 'N/A'] = (recMap[s.recomendacao_final || 'N/A'] || 0) + 1; });
  const recData = Object.entries(recMap).map(([name, value]) => ({ name, value }));

  // Classification distribution
  const classMap = {};
  complianceScores.forEach(s => { classMap[s.classificacao_geral || 'N/A'] = (classMap[s.classificacao_geral || 'N/A'] || 0) + 1; });
  const classData = Object.entries(classMap).map(([name, value]) => ({ name, value }));

  // Findings severity
  const sevTotals = {};
  complianceScores.forEach(s => {
    const fps = s.findings_por_severidade || {};
    Object.entries(fps).forEach(([sev, count]) => { sevTotals[sev] = (sevTotals[sev] || 0) + count; });
  });
  const sevData = Object.entries(sevTotals).map(([name, value]) => ({ name, value }));

  // Total findings
  const findingsStats = calcStats(complianceScores.map(s => s.total_findings));

  // Phases completed
  const f1 = complianceScores.filter(s => s.fase_1_completa).length;
  const f2 = complianceScores.filter(s => s.fase_2_completa).length;
  const f3 = complianceScores.filter(s => s.fase_3_completa).length;

  return (
    <div className="space-y-5 mt-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Analyses SENTINEL" value={complianceScores.length} subtitle={`${f1} fase 1, ${f2} fase 2, ${f3} fase 3`} icon={Shield} />
        <StatCard label="SGC Mediano" value={formatNumber(sgcStats.median)} subtitle={`Min: ${formatNumber(sgcStats.min)} / Max: ${formatNumber(sgcStats.max)}`} icon={Shield} />
        <StatCard label="Confiança IA Med." value={`${confidenceStats.median}%`} subtitle={`${confidenceStats.count} análises`} icon={CheckCircle2} />
        <StatCard label="Findings Média" value={formatNumber(findingsStats.avg)} subtitle={`Max: ${formatNumber(findingsStats.max)}`} icon={AlertTriangle} />
      </div>

      <MinMaxMedianTable
        title="Scores SENTINEL — Mín / Mediana / Média / Máx"
        rows={[
          { label: 'Score Questionário (SQ) 0-1000', stats: sqStats },
          { label: 'Score Validação Externa (SVE) 0-1000', stats: sveStats },
          { label: 'Score Geral Composto (SGC) 0-1000', stats: sgcStats },
          { label: 'Bônus Consistência (0-1000)', stats: bonusStats },
          { label: 'Nível Confiança IA (0-100)', stats: confidenceStats },
          { label: 'Total Findings', stats: findingsStats },
        ].filter(r => r.stats.count > 0)}
        formatter={formatNumber}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <PieCard title="Recomendação SENTINEL" data={recData} colorMap={{ Aprovado: '#2bc196', 'Aprovado com Condições': '#36706c', 'Revisão Manual': '#f59e0b', Recusado: '#ef4444' }} />
        <PieCard title="Classificação Geral" data={classData} colorMap={{ BAIXO: '#2bc196', MÉDIO: '#f59e0b', ALTO: '#ef4444', CRÍTICO: '#7c2d12', Bloqueante: '#000' }} />
        {sevData.length > 0 && <PieCard title="Findings por Severidade" data={sevData} colorMap={{ CRITICAL: '#ef4444', HIGH: '#f59e0b', MEDIUM: '#94a3b8', LOW: '#2bc196' }} />}
      </div>
    </div>
  );
}

// ── Merchants Tab ──
function MerchantsTab({ merchants }) {
  if (!merchants.length) return <Card className="p-8 text-center"><p className="text-sm text-[#002443]/50">Nenhum merchant disponível.</p></Card>;

  // Type distribution (PF vs PJ)
  const typeMap = {};
  merchants.forEach(m => { typeMap[m.type || 'N/A'] = (typeMap[m.type || 'N/A'] || 0) + 1; });
  const typeData = Object.entries(typeMap).map(([name, value]) => ({ name: name === 'PJ' ? 'Pessoa Jurídica' : name === 'PF' ? 'Pessoa Física' : name, value }));

  // Onboarding status
  const statusMap = {};
  merchants.forEach(m => { statusMap[m.onboardingStatus || 'N/A'] = (statusMap[m.onboardingStatus || 'N/A'] || 0) + 1; });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  // Payment services
  const payMap = {};
  merchants.forEach(m => (m.paymentServices || []).forEach(p => { payMap[p] = (payMap[p] || 0) + 1; }));
  const payData = Object.entries(payMap).map(([name, value]) => ({ name, value }));

  // Subseller vs Principal
  const subCount = merchants.filter(m => m.isSubseller).length;
  const mainCount = merchants.length - subCount;

  // Risk score
  const riskStats = calcStats(merchants.map(m => m.riskScore));

  return (
    <div className="space-y-5 mt-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Total Merchants" value={merchants.length} subtitle={`${mainCount} principais, ${subCount} subsellers`} icon={Building2} />
        <StatCard label="PJ vs PF" value={`${typeMap['PJ'] || 0} PJ / ${typeMap['PF'] || 0} PF`} icon={Users} />
        <StatCard label="Risk Score Med." value={formatNumber(riskStats.median)} subtitle={`Min: ${formatNumber(riskStats.min)} / Max: ${formatNumber(riskStats.max)}`} icon={AlertTriangle} />
        <StatCard label="Aprovados" value={statusMap['Aprovado'] || 0} subtitle={`${statusMap['Recusado'] || 0} recusados`} icon={CheckCircle2} />
      </div>

      <MinMaxMedianTable
        title="Risk Score dos Merchants — Mín / Mediana / Média / Máx"
        rows={[{ label: 'Risk Score (0-100)', stats: riskStats }].filter(r => r.stats.count > 0)}
        formatter={formatNumber}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <PieCard title="Tipo de Merchant" data={typeData} />
        <PieCard title="Status Onboarding" data={statusData} colorMap={{ Aprovado: '#2bc196', Recusado: '#ef4444', Manual: '#f59e0b', Pendente: '#94a3b8', 'Em Análise': '#002443' }} />
        <PieCard title="Serviços de Pagamento" data={payData} />
      </div>
    </div>
  );
}

// ── Questionnaire Responses Tab ──
function QuestionnaireTab({ responses }) {
  if (!responses.length) return <Card className="p-8 text-center"><p className="text-sm text-[#002443]/50">Nenhuma resposta de compliance disponível.</p></Card>;

  // Group by questionText for frequency analysis
  const questionMap = {};
  responses.forEach(r => {
    const qt = r.questionText || r.questionId || 'N/A';
    if (!questionMap[qt]) questionMap[qt] = { count: 0, values: [], type: r.questionType };
    questionMap[qt].count++;
    const val = r.valueText || (r.valueArray?.length ? r.valueArray.join(', ') : null) || (r.valueBoolean != null ? String(r.valueBoolean) : null) || (r.valueNumber != null ? String(r.valueNumber) : null);
    if (val) questionMap[qt].values.push(val);
  });

  // For SELECT/MULTI_SELECT, count option frequencies
  const selectQuestions = Object.entries(questionMap)
    .filter(([_, d]) => ['SELECT', 'MULTI_SELECT'].includes(d.type) && d.values.length > 0)
    .map(([question, d]) => {
      const optMap = {};
      d.values.forEach(v => {
        v.split(',').map(s => s.trim()).filter(Boolean).forEach(opt => {
          optMap[opt] = (optMap[opt] || 0) + 1;
        });
      });
      return { question, options: Object.entries(optMap).sort((a, b) => b[1] - a[1]).slice(0, 8), total: d.count };
    })
    .filter(q => q.options.length > 0);

  // Unique onboarding cases
  const uniqueCases = new Set(responses.map(r => r.onboardingCaseId)).size;

  // Most answered questions
  const topQuestions = Object.entries(questionMap).sort((a, b) => b[1].count - a[1].count).slice(0, 15);

  // Key compliance questions analysis
  const keyQuestions = ['modeloNegocio', 'canaisVenda', 'tipoEmpresa', 'segmento', 'modeloClientes', 'servicosPagamento'];
  const keyData = keyQuestions.map(qId => {
    const matches = responses.filter(r => r.questionId === qId);
    if (!matches.length) return null;
    const optMap = {};
    matches.forEach(r => {
      const val = r.valueText || (r.valueArray?.length ? r.valueArray.join(', ') : '');
      val.split(',').map(s => s.trim()).filter(Boolean).forEach(opt => {
        optMap[opt] = (optMap[opt] || 0) + 1;
      });
    });
    return {
      question: matches[0].questionText || qId,
      options: Object.entries(optMap).sort((a, b) => b[1] - a[1]),
      total: matches.length,
    };
  }).filter(Boolean);

  return (
    <div className="space-y-5 mt-4">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Total Respostas" value={responses.length} icon={FileText} />
        <StatCard label="Casos Respondidos" value={uniqueCases} icon={Shield} />
        <StatCard label="Perguntas Únicas" value={Object.keys(questionMap).length} icon={FileText} />
      </div>

      {/* Key compliance question distributions */}
      {keyData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {keyData.map((kd, i) => (
            <Card key={i} className="p-4">
              <h3 className="text-sm font-bold text-[#002443] mb-3">{kd.question}</h3>
              <div className="space-y-1.5">
                {kd.options.slice(0, 8).map(([opt, count], j) => (
                  <div key={j} className="flex items-center justify-between px-3 py-1.5 bg-slate-50 rounded">
                    <span className="text-xs">{opt}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#2bc196] rounded-full" style={{ width: `${(count / kd.total) * 100}%` }} />
                      </div>
                      <span className="text-xs font-bold w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* SELECT/MULTI_SELECT distributions */}
      {selectQuestions.length > 0 && (
        <>
          <h3 className="text-sm font-bold text-[#002443]">Distribuições de Respostas (Seleção)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {selectQuestions.slice(0, 10).map((sq, i) => (
              <Card key={i} className="p-4">
                <h4 className="text-xs font-bold text-[#002443] mb-2">{sq.question} <span className="text-[#002443]/40">({sq.total})</span></h4>
                <div className="space-y-1.5">
                  {sq.options.map(([opt, count], j) => (
                    <div key={j} className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded">
                      <span className="text-[11px] flex-1 mr-2">{opt}</span>
                      <span className="text-[11px] font-bold">{count}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Top answered questions */}
      <Card className="p-4">
        <h3 className="text-sm font-bold text-[#002443] mb-3">Perguntas Mais Respondidas</h3>
        <div className="space-y-1.5">
          {topQuestions.map(([question, data], i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
              <span className="text-xs flex-1 mr-4">{question}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#002443]/40">{data.type}</span>
                <span className="text-xs font-bold">{data.count}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Documents Tab ──
function DocumentsTab({ documents }) {
  if (!documents.length) return <Card className="p-8 text-center"><p className="text-sm text-[#002443]/50">Nenhum documento disponível.</p></Card>;

  // Status distribution
  const statusMap = {};
  documents.forEach(d => { statusMap[d.validationStatus || 'N/A'] = (statusMap[d.validationStatus || 'N/A'] || 0) + 1; });
  const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

  // Document type distribution
  const typeMap = {};
  documents.forEach(d => { typeMap[d.documentName || 'N/A'] = (typeMap[d.documentName || 'N/A'] || 0) + 1; });
  const typeData = Object.entries(typeMap).sort((a, b) => b[1] - a[1]);

  // File type distribution
  const formatMap = {};
  documents.forEach(d => { formatMap[d.fileType || 'N/A'] = (formatMap[d.fileType || 'N/A'] || 0) + 1; });
  const formatData = Object.entries(formatMap).map(([name, value]) => ({ name, value }));

  // File size stats
  const sizeStats = calcStats(documents.map(d => d.fileSize));

  // Unique cases
  const uniqueCases = new Set(documents.map(d => d.onboardingCaseId)).size;

  // Pending vs validated
  const pending = statusMap['Pendente'] || 0;
  const validated = statusMap['Validado'] || 0;
  const rejected = statusMap['Rejeitado'] || 0;

  return (
    <div className="space-y-5 mt-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total Docs" value={documents.length} subtitle={`${uniqueCases} casos`} icon={FileText} />
        <StatCard label="Pendentes" value={pending} subtitle={`${documents.length > 0 ? ((pending / documents.length) * 100).toFixed(0) : 0}%`} icon={Clock} />
        <StatCard label="Validados" value={validated} subtitle={`${documents.length > 0 ? ((validated / documents.length) * 100).toFixed(0) : 0}%`} icon={CheckCircle2} />
        <StatCard label="Rejeitados" value={rejected} subtitle={`${documents.length > 0 ? ((rejected / documents.length) * 100).toFixed(0) : 0}%`} icon={AlertTriangle} color="text-red-500" />
        <StatCard label="Tam. Médio" value={`${(sizeStats.avg / 1024).toFixed(0)} KB`} subtitle={`Max: ${(sizeStats.max / 1024).toFixed(0)} KB`} icon={FileText} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <PieCard title="Status de Validação" data={statusData} colorMap={{ Pendente: '#f59e0b', Validado: '#2bc196', Rejeitado: '#ef4444', Erro: '#94a3b8' }} />
        <PieCard title="Formato dos Arquivos" data={formatData} />
      </div>

      {/* Document types ranking */}
      <Card className="p-4">
        <h3 className="text-sm font-bold text-[#002443] mb-3">Tipos de Documento Mais Enviados</h3>
        <div className="space-y-2">
          {typeData.map(([name, count], i) => (
            <div key={i} className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg">
              <span className="text-xs font-medium">{name}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[#2bc196] rounded-full" style={{ width: `${(count / typeData[0][1]) * 100}%` }} />
                </div>
                <span className="text-xs font-bold w-6 text-right">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── Reusable Pie Chart Card ──
function PieCard({ title, data, colorMap = {} }) {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-bold text-[#002443] mb-3">{title}</h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
            {data.map((entry, i) => <Cell key={i} fill={colorMap[entry.name] || COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}