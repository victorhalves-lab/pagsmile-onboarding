import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Brain, Activity, CheckCircle2, XCircle, AlertTriangle,
  RefreshCw, BarChart3, Zap, Target, ThumbsUp, ThumbsDown,
  MessageSquare, Loader2, Info, Clock, FileText, Shield, Scale,
} from 'lucide-react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import TrendLineChart from '../components/dashboard/TrendLineChart';
import TopRejectionReasonsChart from '../components/dashboard/TopRejectionReasonsChart';
import RiskDistributionCards from '../components/dashboard/RiskDistributionCards';

export default function HelenaIA() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [thresholds, setThresholds] = useState({ auto_approve: 80, auto_reject: 40 });
  const [factorWeights, setFactorWeights] = useState({ cadastral: 15, financial: 15, pld: 25, documents: 15, external: 15, cnpj_enrichment: 15 });
  const queryClient = useQueryClient();

  const { data: helenaAnalyses = [], isLoading } = useQuery({
    queryKey: ['helenaAnalyses'],
    queryFn: () => base44.entities.HelenaAnalysis.list('-created_date', 100)
  });

  const { data: onboardingCases = [] } = useQuery({
    queryKey: ['onboardingCases'],
    queryFn: () => base44.entities.OnboardingCase.list('-created_date', 100)
  });

  const stats = React.useMemo(() => {
    const completed = helenaAnalyses.filter(a => a.status === 'completed');
    const approved = completed.filter(a => a.decision === 'APPROVED');
    const rejected = completed.filter(a => a.decision === 'REJECTED');
    const manualReview = completed.filter(a => a.decision === 'MANUAL_REVIEW');
    const avgScore = completed.length > 0 ? Math.round(completed.reduce((sum, a) => sum + (a.score || 0), 0) / completed.length) : 0;
    const avgProcessingTime = completed.length > 0 ? Math.round(completed.reduce((sum, a) => sum + (a.processing_time_ms || 0), 0) / completed.length) : 0;
    const withFeedback = completed.filter(a => a.analyst_feedback);
    const agreedFeedback = withFeedback.filter(a => a.analyst_feedback === 'agree');
    const accuracyRate = withFeedback.length > 0 ? Math.round((agreedFeedback.length / withFeedback.length) * 100) : 0;
    const approvalRate = completed.length > 0 ? Math.round((approved.length / completed.length) * 100) : 0;
    const rejectionRate = completed.length > 0 ? Math.round((rejected.length / completed.length) * 100) : 0;
    const manualRate = completed.length > 0 ? Math.round((manualReview.length / completed.length) * 100) : 0;
    const casesWithScore = helenaAnalyses.filter(a => a.score !== undefined);
    const rejectionReasons = {};
    helenaAnalyses.forEach(a => {
      if (a.decision === 'REJECTED' || a.decision === 'MANUAL_REVIEW') {
        (a.red_flags || []).concat(a.risk_factors || []).forEach(f => { rejectionReasons[f] = (rejectionReasons[f] || 0) + 1; });
      }
    });
    return {
      total: completed.length, approved: approved.length, rejected: rejected.length, manualReview: manualReview.length,
      avgScore, avgProcessingTime, accuracyRate, pending: helenaAnalyses.filter(a => a.status === 'pending' || a.status === 'processing').length,
      approvalRate, rejectionRate, manualRate,
      lowRisk: casesWithScore.filter(a => a.score >= 80).length, mediumRisk: casesWithScore.filter(a => a.score >= 60 && a.score < 80).length,
      highRisk: casesWithScore.filter(a => a.score >= 40 && a.score < 60).length, criticalRisk: casesWithScore.filter(a => a.score < 40).length,
      topRejectionReasons: Object.entries(rejectionReasons).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count).slice(0, 5),
      agreedCount: agreedFeedback.length, disagreedCount: withFeedback.filter(a => a.analyst_feedback === 'disagree').length,
      withCommentsCount: helenaAnalyses.filter(a => a.analyst_feedback_notes).length
    };
  }, [helenaAnalyses]);

  const trendData = React.useMemo(() => ['Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'].map((name, i) => {
    const monthAnalyses = helenaAnalyses.filter(a => { const d = new Date(a.created_date); return d.getMonth() === (6 + i) % 12; });
    return { name, ia: monthAnalyses.filter(a => a.decision === 'APPROVED' || a.decision === 'REJECTED').length, manual: monthAnalyses.filter(a => a.decision === 'MANUAL_REVIEW').length };
  }), [helenaAnalyses]);

  const decisionPieData = [
    { name: 'Aprovados', value: stats.approved, color: '#2bc196' },
    { name: 'Revisão Manual', value: stats.manualReview, color: '#36706c' },
    { name: 'Recusados', value: stats.rejected, color: '#002443' },
  ].filter(d => d.value > 0);

  const scoreDistribution = React.useMemo(() => {
    const ranges = [{ range: '0-20', min: 0, max: 20, count: 0 }, { range: '21-40', min: 21, max: 40, count: 0 }, { range: '41-60', min: 41, max: 60, count: 0 }, { range: '61-80', min: 61, max: 80, count: 0 }, { range: '81-100', min: 81, max: 100, count: 0 }];
    helenaAnalyses.filter(a => a.score !== undefined).forEach(a => { const r = ranges.find(r => a.score >= r.min && a.score <= r.max); if (r) r.count++; });
    return ranges;
  }, [helenaAnalyses]);

  const getDecisionBadge = (decision) => {
    const config = { APPROVED: { bg: 'bg-[#2bc196]/10', text: 'text-[#2bc196]', icon: CheckCircle2, label: 'Aprovado' }, REJECTED: { bg: 'bg-red-50', text: 'text-red-500', icon: XCircle, label: 'Recusado' }, MANUAL_REVIEW: { bg: 'bg-[#36706c]/10', text: 'text-[#36706c]', icon: AlertTriangle, label: 'Revisão Manual' } };
    const c = config[decision] || config.MANUAL_REVIEW; const Icon = c.icon;
    return <Badge className={`${c.bg} ${c.text} gap-1 border-0`}><Icon className="w-3 h-3" />{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2bc196]/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-[#2bc196]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#002443]">Helena IA</h1>
            <p className="text-sm text-[#002443]/60">Inteligência Artificial para Análise de Compliance</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries()} className="border-[#002443]/10 hover:bg-[#f4f4f4] rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2 text-[#002443]/50" /><span className="text-[#002443]/70">Atualizar</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#f4f4f4] border border-[#002443]/5">
          {['dashboard', 'config', 'history', 'training', 'logs'].map(tab => (
            <TabsTrigger key={tab} value={tab} className="data-[state=active]:bg-white data-[state=active]:text-[#002443] data-[state=active]:shadow-sm">
              {tab === 'dashboard' ? 'Dashboard' : tab === 'config' ? 'Configuração' : tab === 'history' ? 'Histórico' : tab === 'training' ? 'Treinamento' : 'Logs da IA'}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6 mt-6">
          {/* KPI Row 1 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Volume Processado', value: stats.total, icon: Activity, color: '#002443' },
              { label: 'Taxa de Aprovação', value: `${stats.approvalRate}%`, icon: CheckCircle2, color: '#2bc196' },
              { label: 'Taxa de Rejeição', value: `${stats.rejectionRate}%`, icon: XCircle, color: '#002443' },
              { label: 'Encaminhamento Manual', value: `${stats.manualRate}%`, icon: AlertTriangle, color: '#36706c' },
            ].map((kpi, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#002443]/5 p-4">
                <div className="flex items-center gap-2 mb-1"><kpi.icon className="w-4 h-4" style={{ color: kpi.color }} /><p className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p></div>
                <p className="text-xs text-[#002443]/50">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* KPI Row 2 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Taxa de Acerto', value: `${stats.accuracyRate}%`, icon: Target, color: '#2bc196' },
              { label: 'Score Médio', value: stats.avgScore, icon: BarChart3, color: '#36706c' },
              { label: 'Tempo Médio', value: `${(stats.avgProcessingTime / 1000).toFixed(1)}s`, icon: Zap, color: '#002443' },
              { label: 'Pendentes', value: stats.pending, icon: Clock, color: '#002443' },
            ].map((kpi, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#002443]/5 p-4">
                <div className="flex items-center gap-2 mb-1"><kpi.icon className="w-4 h-4" style={{ color: kpi.color }} /><p className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p></div>
                <p className="text-xs text-[#002443]/50">{kpi.label}</p>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-[#002443]/5 p-6">
              <h3 className="text-sm font-bold text-[#002443] mb-4">Distribuição por Status</h3>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart><Pie data={decisionPieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {decisionPieData.map((entry, index) => <Cell key={index} fill={entry.color} stroke="white" strokeWidth={2} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-4 mt-2">
                {decisionPieData.map((entry, i) => <div key={i} className="flex items-center gap-2 text-xs text-[#002443]/60"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }}></div>{entry.name}: {entry.value}</div>)}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-[#002443]/5 p-6">
              <h3 className="text-sm font-bold text-[#002443] mb-4">Distribuição de Scores</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={scoreDistribution}><CartesianGrid strokeDasharray="3 3" stroke="rgba(0,36,67,0.05)" /><XAxis dataKey="range" tick={{ fontSize: 11, fill: '#002443' }} /><YAxis tick={{ fontSize: 11, fill: '#002443' }} /><Tooltip /><Bar dataKey="count" fill="#2bc196" radius={[6, 6, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrendLineChart data={trendData} title="Tendência (IA vs Manual)" />
            <TopRejectionReasonsChart data={stats.topRejectionReasons} />
          </div>

          <RiskDistributionCards lowRisk={stats.lowRisk} mediumRisk={stats.mediumRisk} highRisk={stats.highRisk} criticalRisk={stats.criticalRisk} />

          {/* Thresholds bar */}
          <div className="bg-white rounded-2xl border border-[#002443]/5 p-6">
            <h3 className="text-sm font-bold text-[#002443] mb-3">Limiares de Decisão</h3>
            <div className="h-3 bg-[#f4f4f4] rounded-full relative overflow-hidden">
              <div className="absolute left-0 top-0 h-full bg-red-300 transition-all" style={{ width: `${thresholds.auto_reject}%` }} />
              <div className="absolute top-0 h-full bg-[#36706c] transition-all" style={{ left: `${thresholds.auto_reject}%`, width: `${thresholds.auto_approve - thresholds.auto_reject}%` }} />
              <div className="absolute top-0 h-full bg-[#2bc196] transition-all" style={{ left: `${thresholds.auto_approve}%`, right: 0 }} />
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-red-400">Recusar (&lt;{thresholds.auto_reject})</span>
              <span className="text-[#36706c]">Revisão ({thresholds.auto_reject}-{thresholds.auto_approve})</span>
              <span className="text-[#2bc196]">Aprovar (&gt;{thresholds.auto_approve})</span>
            </div>
          </div>
        </TabsContent>

        {/* Config */}
        <TabsContent value="config" className="space-y-6 mt-6">
          <div className="bg-[#36706c]/5 border border-[#36706c]/10 rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-[#36706c] mt-0.5 shrink-0" />
            <p className="text-xs text-[#002443]/60">Ajuste os limiares de decisão automática e os pesos dos fatores de análise.</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#002443]/5 p-6 space-y-5">
            <h3 className="text-base font-bold text-[#002443]">Limiares de Decisão</h3>
            {[
              { label: 'Aprovação Automática', key: 'auto_approve', color: '#2bc196', min: 50, max: 100 },
              { label: 'Rejeição Automática', key: 'auto_reject', color: '#002443', min: 0, max: 50 },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between mb-2">
                  <Label className="text-xs text-[#002443]/50">{item.label}</Label>
                  <span className="text-sm font-bold" style={{ color: item.color }}>{thresholds[item.key]}</span>
                </div>
                <Slider value={[thresholds[item.key]]} onValueChange={(v) => setThresholds(prev => ({ ...prev, [item.key]: v[0] }))} min={item.min} max={item.max} step={5} />
              </div>
            ))}
            <Button className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl">Salvar</Button>
          </div>

          <div className="bg-white rounded-2xl border border-[#002443]/5 p-6 space-y-4">
            <h3 className="text-base font-bold text-[#002443]">Fatores de Análise</h3>
            {[
              { id: 'cadastral', label: 'Dados Cadastrais', icon: FileText },
              { id: 'financial', label: 'Perfil Financeiro', icon: Scale },
              { id: 'pld', label: 'PLD/FT e Sanções', icon: Shield },
              { id: 'documents', label: 'Documentos', icon: FileText },
              { id: 'external', label: 'Validações Externas', icon: Activity },
            ].map(factor => (
              <div key={factor.id} className="flex items-center gap-4 p-3 rounded-xl border border-[#002443]/5">
                <factor.icon className="w-4 h-4 text-[#002443]/30" />
                <p className="flex-1 text-sm font-medium text-[#002443]">{factor.label}</p>
                <div className="w-28"><Slider value={[factorWeights[factor.id]]} onValueChange={(v) => setFactorWeights(prev => ({ ...prev, [factor.id]: v[0] }))} min={0} max={50} step={5} /></div>
                <span className="text-sm font-bold text-[#002443] w-10 text-right">{factorWeights[factor.id]}%</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-3 border-t border-[#002443]/5">
              <span className="text-xs text-[#002443]/50">Total:</span>
              <span className={`text-base font-bold ${Object.values(factorWeights).reduce((a, b) => a + b, 0) === 100 ? 'text-[#2bc196]' : 'text-red-500'}`}>{Object.values(factorWeights).reduce((a, b) => a + b, 0)}%</span>
            </div>
          </div>
        </TabsContent>

        {/* History */}
        <TabsContent value="history" className="mt-6">
          <div className="bg-white rounded-2xl border border-[#002443]/5 overflow-hidden">
            <div className="p-5 border-b border-[#002443]/5"><h3 className="text-base font-bold text-[#002443]">Histórico de Análises</h3></div>
            {isLoading ? <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#2bc196]" /></div> : (
              <Table>
                <TableHeader><TableRow className="bg-[#f4f4f4]">
                  {['Data', 'Caso', 'Score', 'Decisão', 'Tempo', 'Feedback'].map((h, i) => <TableHead key={i} className="text-[10px] font-bold text-[#002443]/40 uppercase">{h}</TableHead>)}
                </TableRow></TableHeader>
                <TableBody>
                  {helenaAnalyses.slice(0, 20).map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs text-[#002443]/60">{a.created_date ? new Date(a.created_date).toLocaleDateString('pt-BR') : '-'}</TableCell>
                      <TableCell className="font-mono text-xs text-[#36706c]">{a.onboarding_case_id?.substring(0, 8)}...</TableCell>
                      <TableCell><span className={`font-bold ${a.score >= 80 ? 'text-[#2bc196]' : a.score >= 40 ? 'text-[#36706c]' : 'text-red-500'}`}>{a.score || '-'}</span></TableCell>
                      <TableCell>{a.decision && getDecisionBadge(a.decision)}</TableCell>
                      <TableCell className="text-xs text-[#002443]/40">{a.processing_time_ms ? `${a.processing_time_ms}ms` : '-'}</TableCell>
                      <TableCell>{a.analyst_feedback === 'agree' && <ThumbsUp className="w-4 h-4 text-[#2bc196]" />}{a.analyst_feedback === 'disagree' && <ThumbsDown className="w-4 h-4 text-red-400" />}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Training */}
        <TabsContent value="training" className="space-y-6 mt-6">
          <div className="bg-[#2bc196]/5 border border-[#2bc196]/15 rounded-2xl p-4 flex items-start gap-3">
            <Brain className="w-4 h-4 text-[#2bc196] mt-0.5 shrink-0" />
            <p className="text-xs text-[#002443]/60">O feedback dos analistas melhora continuamente as análises da Helena.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Concordâncias', value: stats.agreedCount, icon: ThumbsUp, color: '#2bc196' },
              { label: 'Discordâncias', value: stats.disagreedCount, icon: ThumbsDown, color: '#002443' },
              { label: 'Com Comentários', value: stats.withCommentsCount, icon: MessageSquare, color: '#36706c' },
              { label: 'Taxa de Acerto', value: `${stats.accuracyRate}%`, icon: Target, color: '#2bc196' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#002443]/5 p-4 text-center">
                <s.icon className="w-6 h-6 mx-auto mb-2" style={{ color: s.color }} />
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs text-[#002443]/50">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-[#002443]/5 p-6 space-y-4">
            <h3 className="text-base font-bold text-[#002443]">Instruções da Helena</h3>
            <p className="text-xs text-[#002443]/40">Prompt base para análise de compliance</p>
            <Textarea className="font-mono text-xs h-52 border-[#002443]/10 bg-[#f4f4f4]" defaultValue={`Você é HELENA, uma auditora de compliance sênior com mais de 15 anos de experiência em KYC/AML.

MATRIZ DE RISCO:
- Score 0-39 (RECUSADO): Red flags críticos
- Score 40-79 (REVISÃO MANUAL): Controles parciais
- Score 80-100 (APROVADO): Controles robustos

OUTPUT: Score (0-100), Decisão, Justificativa, Fatores, Red Flags`} />
            <div className="flex justify-end"><Button variant="outline" className="rounded-xl border-[#002443]/10 text-sm">Restaurar Padrão</Button></div>
          </div>
        </TabsContent>

        {/* Logs */}
        <TabsContent value="logs" className="mt-6">
          <div className="bg-white rounded-2xl border border-[#002443]/5 p-6 space-y-4">
            <h3 className="text-base font-bold text-[#002443]">Logs de Execução</h3>
            {isLoading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#2bc196]" /></div> : (
              <div className="space-y-3">
                {helenaAnalyses.slice(0, 10).map(a => (
                  <div key={a.id} className="rounded-2xl border border-[#002443]/5 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">{a.decision && getDecisionBadge(a.decision)}<span className="text-xs text-[#002443]/40">{a.created_date ? new Date(a.created_date).toLocaleString('pt-BR') : '-'}</span></div>
                      <span className={`text-2xl font-bold ${a.score >= 80 ? 'text-[#2bc196]' : a.score >= 40 ? 'text-[#36706c]' : 'text-red-500'}`}>{a.score || '-'}</span>
                    </div>
                    {a.justification && <div className="bg-[#f4f4f4] rounded-xl p-3 mb-3"><p className="text-xs font-semibold text-[#002443]/40 mb-1">Justificativa:</p><p className="text-xs text-[#002443]/60">{a.justification}</p></div>}
                    <div className="grid grid-cols-2 gap-3">
                      {a.positive_factors?.length > 0 && <div><p className="text-[10px] font-bold text-[#2bc196] mb-1">Fatores Positivos:</p><ul className="text-[10px] text-[#002443]/50 list-disc list-inside">{a.positive_factors.slice(0, 3).map((f, i) => <li key={i}>{f}</li>)}</ul></div>}
                      {a.risk_factors?.length > 0 && <div><p className="text-[10px] font-bold text-red-400 mb-1">Fatores de Risco:</p><ul className="text-[10px] text-[#002443]/50 list-disc list-inside">{a.risk_factors.slice(0, 3).map((f, i) => <li key={i}>{f}</li>)}</ul></div>}
                    </div>
                    {a.red_flags?.length > 0 && <div className="mt-3 p-2 bg-red-50 rounded-xl"><p className="text-[10px] font-bold text-red-400 mb-1">Red Flags:</p><div className="flex flex-wrap gap-1">{a.red_flags.map((flag, i) => <Badge key={i} className="bg-red-50 text-red-500 text-[10px] border-0">{flag}</Badge>)}</div></div>}
                    {a.processing_time_ms && <p className="text-[10px] text-[#002443]/30 mt-2">Processado em {a.processing_time_ms}ms</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}