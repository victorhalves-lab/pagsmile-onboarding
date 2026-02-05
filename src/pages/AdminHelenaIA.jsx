import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Brain,
  Settings,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Zap,
  Target,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Loader2,
  Info,
  Play,
  History,
  FileText,
  Users,
  Shield,
  Scale,
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

export default function AdminHelenaIA() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [thresholds, setThresholds] = useState({
    auto_approve: 80,
    auto_reject: 40
  });
  const [factorWeights, setFactorWeights] = useState({
    cadastral: 20,
    financial: 20,
    pld: 30,
    documents: 15,
    external: 15
  });
  const queryClient = useQueryClient();

  const { data: helenaAnalyses = [], isLoading } = useQuery({
    queryKey: ['helenaAnalyses'],
    queryFn: () => base44.entities.HelenaAnalysis.list('-created_date', 100)
  });

  const { data: onboardingCases = [] } = useQuery({
    queryKey: ['onboardingCases'],
    queryFn: () => base44.entities.OnboardingCase.list('-created_date', 100)
  });

  // Estatísticas
  const stats = React.useMemo(() => {
    const completed = helenaAnalyses.filter(a => a.status === 'completed');
    const approved = completed.filter(a => a.decision === 'APPROVED');
    const rejected = completed.filter(a => a.decision === 'REJECTED');
    const manualReview = completed.filter(a => a.decision === 'MANUAL_REVIEW');

    const avgScore = completed.length > 0 
      ? Math.round(completed.reduce((sum, a) => sum + (a.score || 0), 0) / completed.length)
      : 0;

    const avgProcessingTime = completed.length > 0
      ? Math.round(completed.reduce((sum, a) => sum + (a.processing_time_ms || 0), 0) / completed.length)
      : 0;

    // Feedback dos analistas
    const withFeedback = completed.filter(a => a.analyst_feedback);
    const agreedFeedback = withFeedback.filter(a => a.analyst_feedback === 'agree');
    const accuracyRate = withFeedback.length > 0 
      ? Math.round((agreedFeedback.length / withFeedback.length) * 100)
      : 0;

    return {
      total: completed.length,
      approved: approved.length,
      rejected: rejected.length,
      manualReview: manualReview.length,
      avgScore,
      avgProcessingTime,
      accuracyRate,
      pending: helenaAnalyses.filter(a => a.status === 'pending' || a.status === 'processing').length
    };
  }, [helenaAnalyses]);

  // Dados para gráficos
  const decisionPieData = [
    { name: 'Aprovados', value: stats.approved, color: '#22c55e' },
    { name: 'Revisão Manual', value: stats.manualReview, color: '#f97316' },
    { name: 'Recusados', value: stats.rejected, color: '#ef4444' },
  ].filter(d => d.value > 0);

  const scoreDistribution = React.useMemo(() => {
    const ranges = [
      { range: '0-20', min: 0, max: 20, count: 0 },
      { range: '21-40', min: 21, max: 40, count: 0 },
      { range: '41-60', min: 41, max: 60, count: 0 },
      { range: '61-80', min: 61, max: 80, count: 0 },
      { range: '81-100', min: 81, max: 100, count: 0 },
    ];

    helenaAnalyses.filter(a => a.score !== undefined).forEach(a => {
      const range = ranges.find(r => a.score >= r.min && a.score <= r.max);
      if (range) range.count++;
    });

    return ranges;
  }, [helenaAnalyses]);

  const getDecisionBadge = (decision) => {
    const config = {
      APPROVED: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      REJECTED: { color: 'bg-red-100 text-red-800', icon: XCircle },
      MANUAL_REVIEW: { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
    };
    const c = config[decision] || config.MANUAL_REVIEW;
    const Icon = c.icon;
    return (
      <Badge className={`${c.color} gap-1`}>
        <Icon className="w-3 h-3" />
        {decision === 'APPROVED' ? 'Aprovado' : decision === 'REJECTED' ? 'Recusado' : 'Revisão Manual'}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Helena IA</h1>
            <p className="text-slate-500">Inteligência Artificial para Análise de Compliance</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="config">Configuração</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="training">Treinamento</TabsTrigger>
          <TabsTrigger value="logs">Logs da IA</TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <Activity className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                    <p className="text-xs text-slate-500">Análises Realizadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <Target className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.accuracyRate}%</p>
                    <p className="text-xs text-slate-500">Taxa de Acerto</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.avgScore}</p>
                    <p className="text-xs text-slate-500">Score Médio</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-100">
                    <Zap className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800">{stats.avgProcessingTime}ms</p>
                    <p className="text-xs text-slate-500">Tempo Médio</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição de Decisões</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={decisionPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {decisionPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-4">
                  {decisionPieData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                      <span>{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição de Scores</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Limiares Atuais */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Limiares de Decisão</CardTitle>
              <CardDescription>Configuração atual dos limites para decisão automática</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-8">
                <div className="flex-1 h-4 bg-slate-100 rounded-full relative overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-red-400 transition-all"
                    style={{ width: `${thresholds.auto_reject}%` }}
                  />
                  <div 
                    className="absolute top-0 h-full bg-green-400 transition-all"
                    style={{ left: `${thresholds.auto_approve}%`, right: 0 }}
                  />
                  <div 
                    className="absolute top-0 h-full bg-orange-400 transition-all"
                    style={{ left: `${thresholds.auto_reject}%`, width: `${thresholds.auto_approve - thresholds.auto_reject}%` }}
                  />
                </div>
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-red-600">Recusar (&lt;{thresholds.auto_reject})</span>
                <span className="text-orange-600">Revisão Manual ({thresholds.auto_reject}-{thresholds.auto_approve})</span>
                <span className="text-green-600">Aprovar (&gt;{thresholds.auto_approve})</span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Config Tab */}
        <TabsContent value="config" className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Configuração da Helena</AlertTitle>
            <AlertDescription>
              Ajuste os limiares de decisão automática e os pesos dos fatores de análise.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Limiares de Decisão Automática</CardTitle>
              <CardDescription>Defina os scores para aprovação/rejeição automática</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Score mínimo para Aprovação Automática</Label>
                    <span className="text-sm font-medium text-green-600">{thresholds.auto_approve}</span>
                  </div>
                  <Slider
                    value={[thresholds.auto_approve]}
                    onValueChange={(v) => setThresholds(prev => ({ ...prev, auto_approve: v[0] }))}
                    min={50}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">Casos com score ≥ {thresholds.auto_approve} serão aprovados automaticamente</p>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <Label>Score máximo para Rejeição Automática</Label>
                    <span className="text-sm font-medium text-red-600">{thresholds.auto_reject}</span>
                  </div>
                  <Slider
                    value={[thresholds.auto_reject]}
                    onValueChange={(v) => setThresholds(prev => ({ ...prev, auto_reject: v[0] }))}
                    min={0}
                    max={50}
                    step={5}
                    className="w-full"
                  />
                  <p className="text-xs text-slate-500 mt-1">Casos com score ≤ {thresholds.auto_reject} serão recusados automaticamente</p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90">
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fatores de Análise</CardTitle>
              <CardDescription>Peso de cada categoria na composição do score final (total deve ser 100%)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { id: 'cadastral', label: 'Dados Cadastrais', icon: FileText },
                  { id: 'financial', label: 'Perfil Financeiro', icon: Scale },
                  { id: 'pld', label: 'PLD/FT e Sanções', icon: Shield },
                  { id: 'documents', label: 'Documentos', icon: FileText },
                  { id: 'external', label: 'Validações Externas (CAF/BDC)', icon: Activity },
                ].map(factor => (
                  <div key={factor.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <factor.icon className="w-5 h-5 text-slate-400" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{factor.label}</p>
                    </div>
                    <div className="w-32">
                      <Slider
                        value={[factorWeights[factor.id]]}
                        onValueChange={(v) => setFactorWeights(prev => ({ ...prev, [factor.id]: v[0] }))}
                        min={0}
                        max={50}
                        step={5}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-700 w-12 text-right">{factorWeights[factor.id]}%</span>
                  </div>
                ))}
                <div className="pt-3 border-t flex justify-between items-center">
                  <span className="text-sm font-medium">Total:</span>
                  <span className={`text-lg font-bold ${
                    Object.values(factorWeights).reduce((a, b) => a + b, 0) === 100 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {Object.values(factorWeights).reduce((a, b) => a + b, 0)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Análises</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Caso</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Decisão</TableHead>
                      <TableHead>Tempo</TableHead>
                      <TableHead>Feedback</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {helenaAnalyses.slice(0, 20).map(analysis => (
                      <TableRow key={analysis.id}>
                        <TableCell className="text-sm">
                          {analysis.created_date ? new Date(analysis.created_date).toLocaleDateString('pt-BR') : '-'}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {analysis.onboarding_case_id?.substring(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <span className={`font-semibold ${
                            analysis.score >= 80 ? 'text-green-600' :
                            analysis.score >= 40 ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {analysis.score || '-'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {analysis.decision && getDecisionBadge(analysis.decision)}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {analysis.processing_time_ms ? `${analysis.processing_time_ms}ms` : '-'}
                        </TableCell>
                        <TableCell>
                          {analysis.analyst_feedback === 'agree' && (
                            <ThumbsUp className="w-4 h-4 text-green-600" />
                          )}
                          {analysis.analyst_feedback === 'disagree' && (
                            <ThumbsDown className="w-4 h-4 text-red-600" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Tab */}
        <TabsContent value="training" className="space-y-6">
          <Alert className="border-purple-200 bg-purple-50">
            <Brain className="h-4 w-4 text-purple-600" />
            <AlertTitle className="text-purple-800">Treinamento e Feedback</AlertTitle>
            <AlertDescription className="text-purple-700">
              O feedback dos analistas é usado para melhorar continuamente as análises da Helena.
              Quanto mais feedbacks, mais precisa se torna a IA.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <ThumbsUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{helenaAnalyses.filter(a => a.analyst_feedback === 'agree').length}</p>
                <p className="text-sm text-slate-500">Concordâncias</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <ThumbsDown className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{helenaAnalyses.filter(a => a.analyst_feedback === 'disagree').length}</p>
                <p className="text-sm text-slate-500">Discordâncias</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <MessageSquare className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{helenaAnalyses.filter(a => a.analyst_feedback_notes).length}</p>
                <p className="text-sm text-slate-500">Com Comentários</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Instruções da Helena</CardTitle>
              <CardDescription>Prompt base usado para análise de compliance</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea 
                className="font-mono text-sm h-64"
                defaultValue={`Você é HELENA, uma auditora de compliance sênior com mais de 15 anos de experiência em KYC/AML.

Sua função é analisar questionários de compliance e dados de validações externas para determinar o risco de cada merchant.

MATRIZ DE RISCO:
- Score 0-39 (RECUSADO): Red flags críticos como sanções, PEP não declarado, produtos proibidos
- Score 40-79 (REVISÃO MANUAL): Controles parciais, setores de risco, complexidade societária
- Score 80-100 (APROVADO): Controles robustos de PLD/KYC, sem red flags

FONTES DE DADOS:
1. Respostas do Questionário de Compliance
2. Validações CAF (Liveness, Facematch, OCR)
3. Validações BigDataCorp (KYC Empresa, Sócios, Indicadores)

OUTPUT ESPERADO:
- Score numérico (0-100)
- Decisão (APPROVED/MANUAL_REVIEW/REJECTED)
- Justificativa detalhada
- Fatores positivos e de risco
- Red flags identificados`}
              />
              <div className="flex justify-end mt-4">
                <Button variant="outline">
                  Restaurar Padrão
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logs de Execução da Helena</CardTitle>
              <CardDescription>Detalhes das análises realizadas pela IA</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="space-y-4">
                  {helenaAnalyses.slice(0, 10).map(analysis => (
                    <div key={analysis.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {analysis.decision && getDecisionBadge(analysis.decision)}
                          <span className="text-sm text-slate-500">
                            {analysis.created_date ? new Date(analysis.created_date).toLocaleString('pt-BR') : '-'}
                          </span>
                        </div>
                        <span className={`text-2xl font-bold ${
                          analysis.score >= 80 ? 'text-green-600' :
                          analysis.score >= 40 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {analysis.score || '-'}
                        </span>
                      </div>
                      
                      {analysis.justification && (
                        <div className="bg-slate-50 rounded-lg p-3 mb-3">
                          <p className="text-sm font-medium text-slate-700 mb-1">Justificativa:</p>
                          <p className="text-sm text-slate-600">{analysis.justification}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-4">
                        {analysis.positive_factors?.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-green-700 mb-1">Fatores Positivos:</p>
                            <ul className="text-xs text-slate-600 list-disc list-inside">
                              {analysis.positive_factors.slice(0, 3).map((f, i) => (
                                <li key={i}>{f}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {analysis.risk_factors?.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-red-700 mb-1">Fatores de Risco:</p>
                            <ul className="text-xs text-slate-600 list-disc list-inside">
                              {analysis.risk_factors.slice(0, 3).map((f, i) => (
                                <li key={i}>{f}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {analysis.red_flags?.length > 0 && (
                        <div className="mt-3 p-2 bg-red-50 rounded border border-red-200">
                          <p className="text-xs font-medium text-red-700 mb-1">Red Flags:</p>
                          <div className="flex flex-wrap gap-1">
                            {analysis.red_flags.map((flag, i) => (
                              <Badge key={i} className="bg-red-100 text-red-800 text-xs">{flag}</Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysis.processing_time_ms && (
                        <p className="text-xs text-slate-400 mt-2">
                          Processado em {analysis.processing_time_ms}ms
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}