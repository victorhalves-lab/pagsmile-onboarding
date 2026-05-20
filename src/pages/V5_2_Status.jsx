import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Play, Eye, CheckCircle2, AlertCircle, Database, Shield, Layers, Rocket, FlaskConical, MessageSquareText, ExternalLink, ListChecks } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { FEATURE_FLAGS, DIMENSOES_ANALITICAS, BLOQUEIOS_ABSOLUTOS, SEGMENTOS_CANONICOS, SEGMENTOS_TIER_3_ONLY } from '@/lib/v5_2/constants';
import { V5_2_SEGMENTS } from '@/lib/v5_2/segments';
import EngineDryRunPanel from '@/components/v5_2/EngineDryRunPanel';
import CaseDryRunPanel from '@/components/v5_2/CaseDryRunPanel';
import ServerFlagPanel from '@/components/v5_2/ServerFlagPanel';

/**
 * [V5.2] Status Dashboard — controle administrativo do framework V5.2.
 *
 * Esta página NÃO substitui nada — é APENAS um painel de controle adicional.
 * Coexiste com todo o sistema V4/V5.1 existente.
 */
export default function V5_2_Status() {
  const [flagV2Enabled, setFlagV2Enabled] = useState(false);
  const [seedRunning, setSeedRunning] = useState(false);
  const [seedResult, setSeedResult] = useState(null);

  useEffect(() => {
    try {
      setFlagV2Enabled(localStorage.getItem('feature_risk_analysis_v2') === 'true');
    } catch {}
  }, []);

  const { data: datasets = [], isLoading: loadingDs } = useQuery({
    queryKey: ['v5_2_datasets'],
    queryFn: () => base44.entities.Dataset.list('-created_date', 200),
  });

  const { data: bloqueios = [], isLoading: loadingBl } = useQuery({
    queryKey: ['v5_2_bloqueios'],
    queryFn: () => base44.entities.Bloqueio.list('-created_date', 200),
  });

  const { data: capabilities = [], isLoading: loadingCap } = useQuery({
    queryKey: ['v5_2_capabilities'],
    queryFn: () => base44.entities.Capability.list('-created_date', 50),
  });

  const handleToggleFlag = (next) => {
    setFlagV2Enabled(next);
    try {
      localStorage.setItem('feature_risk_analysis_v2', next ? 'true' : 'false');
    } catch {}
    toast.success(next ? 'V5.2 Risk Analysis V2 ATIVO (local)' : 'V5.2 Risk Analysis V2 DESATIVADO (local)');
  };

  const runSeed = async (mode) => {
    setSeedRunning(true);
    setSeedResult(null);
    try {
      const res = await base44.functions.invoke('seedV5_2MasterData', { mode });
      setSeedResult(res.data);
      toast.success(mode === 'apply' ? 'Seed V5.2 aplicado com sucesso' : 'Preview gerado — revise antes de aplicar');
    } catch (e) {
      toast.error('Erro: ' + (e.message || 'desconhecido'));
    } finally {
      setSeedRunning(false);
    }
  };

  const v5_2Datasets = datasets.filter(d => d.dimensao_analitica || d.nome_amigavel);
  const v5_2Bloqueios = bloqueios.filter(b => b.nucleo_duro_regulatorio === true || b.decisao_padrao);
  const absolutosSeed = bloqueios.filter(b => BLOQUEIOS_ABSOLUTOS.includes(b.codigo));

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-8 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-white/10">
            <Rocket className="w-7 h-7 text-[#5cf7cf]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Framework V5.2 — Status & Controles</h1>
            <p className="text-white/60 text-sm mt-1">
              Painel administrativo. <strong>Coexistência total com V4/V5.1</strong> — nada é substituído.
            </p>
          </div>
        </div>
      </div>

      {/* SERVER-SIDE Flag (Entrega 4) */}
      <ServerFlagPanel />

      {/* Feature Flag UI legada (localStorage — só UI) */}
      <Card className="border-2 border-[#2bc196]/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-[#2bc196]" />
                Feature Flag: <code className="text-sm bg-[#f4f4f4] px-2 py-1 rounded">risk_analysis_v2</code>
              </CardTitle>
              <CardDescription className="mt-2">
                Quando ativa, a nova tela de Análise de Risco V2 (Hero + 4 abas + 13 dimensões) é renderizada.
                Quando inativa, a tela legada `UnifiedRiskAnalysis` continua funcionando normalmente.
              </CardDescription>
            </div>
            <Switch
              checked={flagV2Enabled}
              onCheckedChange={handleToggleFlag}
              className="data-[state=checked]:bg-[#2bc196]"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm">
            <p className="font-semibold text-amber-900">⚠️ Override local (apenas seu navegador)</p>
            <p className="text-amber-800 mt-1">
              Esta toggle salva em <code>localStorage</code> e só afeta seu navegador. Útil para QA/desenvolvimento.
              Rollout global será feito em fase posterior via PublicSettings.
            </p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="entidades" className="w-full">
        <TabsList className="bg-[#f4f4f4] border border-[#002443]/5">
          <TabsTrigger value="entidades">Entidades V5.2</TabsTrigger>
          <TabsTrigger value="seed">Seed Master Data</TabsTrigger>
          <TabsTrigger value="engine">Engine V5.2 (Dry-Run)</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline (caso único)</TabsTrigger>
          <TabsTrigger value="dimensoes">13 Dimensões</TabsTrigger>
          <TabsTrigger value="absolutos">10 Bloqueios Absolutos</TabsTrigger>
          <TabsTrigger value="segmentos">15 Segmentos</TabsTrigger>
          <TabsTrigger value="questions">Questions V5.2</TabsTrigger>
          <TabsTrigger value="sandbox">Sandbox UI</TabsTrigger>
        </TabsList>

        {/* ENTIDADES STATUS */}
        <TabsContent value="entidades" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatusCard
              icon={Database}
              title="Datasets"
              total={datasets.length}
              v52={v5_2Datasets.length}
              loading={loadingDs}
              hint="Datasets com campos V5.2 (dimensao_analitica ou nome_amigavel)"
            />
            <StatusCard
              icon={Shield}
              title="Bloqueios"
              total={bloqueios.length}
              v52={v5_2Bloqueios.length}
              loading={loadingBl}
              hint="Bloqueios com campos V5.2 (núcleo_duro ou decisao_padrao)"
            />
            <StatusCard
              icon={Layers}
              title="Capabilities"
              total={capabilities.length}
              v52={capabilities.filter(c => c.sentinel_prompts?.length).length}
              loading={loadingCap}
              hint="Capabilities canônicas V5.2 (com sentinel_prompts)"
            />
          </div>
        </TabsContent>

        {/* SEED */}
        <TabsContent value="seed" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Seed V5.2 Master Data (aditivo + idempotente)</CardTitle>
              <CardDescription>
                Adiciona <strong>4 capabilities canônicas</strong>, <strong>8 bloqueios absolutos novos</strong> e <strong>13 datasets prioritários V5.2</strong>.
                Não deleta nem sobrescreve nada — apenas insere o que falta e completa campos vazios.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => runSeed('preview')}
                  disabled={seedRunning}
                  className="border-[#002443]/20"
                >
                  {seedRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
                  Preview (dry-run)
                </Button>
                <Button
                  onClick={() => runSeed('apply')}
                  disabled={seedRunning || !seedResult}
                  className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white"
                >
                  {seedRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                  Aplicar
                </Button>
              </div>

              {seedResult && <SeedResultPanel result={seedResult} />}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ENGINE V5.2 DRY-RUN */}
        <TabsContent value="engine" className="mt-4">
          <EngineDryRunPanel />
        </TabsContent>

        {/* PIPELINE V5.2 — caso único */}
        <TabsContent value="pipeline" className="mt-4">
          <CaseDryRunPanel />
        </TabsContent>

        {/* DIMENSÕES */}
        <TabsContent value="dimensoes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>13 Dimensões Analíticas (Aba 3 da nova tela)</CardTitle>
              <CardDescription>Single source of truth em <code>lib/v5_2/constants.js</code></CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {DIMENSOES_ANALITICAS.map((d) => (
                <div key={d.id} className="p-3 rounded-xl border border-[#002443]/5 bg-white">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-[#002443]/40">#{d.ordem}</span>
                    <span className="font-bold text-sm text-[#002443]">{d.nome}</span>
                    {d.novo_v5_2 && <Badge className="bg-[#2bc196] text-white text-[10px] border-0">NOVO V5.2</Badge>}
                  </div>
                  <p className="text-[11px] text-[#002443]/50 font-mono">{d.id}</p>
                  {d.condicional_capability && (
                    <p className="text-[10px] text-amber-700 mt-1">⚡ Só renderiza se capability <strong>{d.condicional_capability}</strong> ativa</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABSOLUTOS */}
        <TabsContent value="absolutos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>10 Bloqueios Absolutos — Núcleo Duro Regulatório</CardTitle>
              <CardDescription>NÃO admitem exceção de nenhum papel — recusa direta sempre</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {BLOQUEIOS_ABSOLUTOS.map((code) => {
                const seeded = absolutosSeed.find(b => b.codigo === code);
                return (
                  <div key={code} className="flex items-center justify-between p-3 rounded-xl border border-[#002443]/5 bg-white">
                    <div className="flex items-center gap-3">
                      <code className="font-mono text-sm text-[#002443] bg-red-50 px-2 py-1 rounded">{code}</code>
                      <span className="text-sm text-[#002443]/70">{seeded?.titulo || '(não seeded ainda)'}</span>
                    </div>
                    {seeded ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-0">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Seeded
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-700 border-0">
                        <AlertCircle className="w-3 h-3 mr-1" /> Pendente seed
                      </Badge>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEGMENTOS */}
        <TabsContent value="segmentos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>15 Segmentos Canônicos V5.2</CardTitle>
              <CardDescription>
                10 segmentos legados (compatíveis com V4) + 5 novos V5.2 (turismo, eventos, servicos_b2b, servicos_locais, crossborder).
                Fonte única em <code>lib/v5_2/segments.js</code>.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {V5_2_SEGMENTS.map((seg) => (
                <div key={seg.id} className="p-3 rounded-xl border border-[#002443]/5 bg-white">
                  <div className="flex items-start gap-2">
                    <span className="text-2xl">{seg.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm text-[#002443]">{seg.label}</p>
                        {seg.isNewInV5_2 && (
                          <Badge className="bg-[#2bc196] text-white border-0 text-[9px]">NOVO V5.2</Badge>
                        )}
                        {seg.fixedTier && (
                          <Badge className="bg-amber-100 text-amber-700 border-0 text-[9px]">TIER FIXO</Badge>
                        )}
                      </div>
                      <p className="font-mono text-[10px] text-[#002443]/40 mt-0.5">{seg.id}</p>
                      <p className="text-xs text-[#002443]/60 mt-1 leading-relaxed">{seg.description}</p>
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-[9px]">{seg.group}</Badge>
                        <Badge variant="outline" className="text-[9px]">{seg.defaultTier}</Badge>
                        {seg.requiresCapabilities.map(cap => (
                          <Badge key={cap} className="bg-indigo-50 text-indigo-700 border-0 text-[9px]">{cap}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        {/* QUESTIONS V5.2 — seed do catálogo canônico */}
        <TabsContent value="questions" className="mt-4">
          <QuestionsV5_2Panel />
        </TabsContent>

        {/* SANDBOX UI — atalho para a página de teste */}
        <TabsContent value="sandbox" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="w-5 h-5 text-[#2bc196]" />
                Sandbox de Questionário V5.2
              </CardTitle>
              <CardDescription>
                Tela admin-only que renderiza o questionário V5.2 ao vivo com filtragem dinâmica por tier/segmento/capability + tieringEngine + bloqueios em tempo real.
                Útil para validar microcopy, fluxo das 5 modalidades (A/B/C/D/E) e tier escalation banner antes do soft launch.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/V5_2_Sandbox">
                <Button className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Abrir Sandbox
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QuestionsV5_2Panel() {
  const [running, setRunning] = React.useState(false);
  const [result, setResult] = React.useState(null);

  const run = async (mode) => {
    setRunning(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('seedV5_2Questions', { mode });
      setResult(res.data);
      toast.success(mode === 'apply' ? 'Questions V5.2 aplicadas' : 'Preview gerado — confira antes de aplicar');
    } catch (e) {
      toast.error('Erro: ' + (e.message || 'desconhecido'));
    } finally {
      setRunning(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-[#2bc196]" />
          Catálogo de Perguntas V5.2 (Fase 5.2)
        </CardTitle>
        <CardDescription>
          Seed idempotente das perguntas canônicas do questionário dinâmico V5.2 — cria o
          QuestionnaireTemplate master (<code>subCategory=V5_2_DYNAMIC</code>) e popula
          ~16 perguntas das 5 modalidades. Aditivo: nunca sobrescreve perguntas existentes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => run('preview')} disabled={running} className="border-[#002443]/20">
            {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
            Preview (dry-run)
          </Button>
          <Button onClick={() => run('apply')} disabled={running || !result} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white">
            {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            Aplicar
          </Button>
        </div>

        {result?.summary && (
          <div className="space-y-3">
            <div className="bg-[#f4f4f4] rounded-xl p-4">
              <p className="text-sm font-bold text-[#002443] mb-2">
                {result.mode === 'preview' ? '🔍 Preview (sem escrita)' : '✅ Aplicado'}
              </p>
              <p className="text-xs text-[#002443]/70">{result.message}</p>
              {result.catalog_size !== undefined && (
                <p className="text-xs text-[#002443]/60 mt-1">
                  Catálogo atual: <strong>{result.catalog_size}</strong> perguntas
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MiniStat label="Template" value={result.summary.template?.created ? 'criado' : (result.summary.template?.found ? 'já existe' : 'pendente')} tone="indigo" />
              <MiniStat label="Inseridas" value={result.summary.questions?.inserted ?? 0} tone="emerald" />
              <MiniStat label="Atualizadas" value={result.summary.questions?.updated ?? 0} tone="amber" />
              <MiniStat label="Skipped" value={result.summary.questions?.skipped ?? 0} tone="slate" />
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-900">
          <div className="flex items-start gap-2">
            <MessageSquareText className="w-4 h-4 mt-0.5 shrink-0" />
            <div>
              Perguntas são identificadas por <code className="bg-white px-1 rounded">id_canonico</code>{' '}
              (ex: <code>q_t2_revenue_proof</code>). Ajustes manuais feitos diretamente em Question são preservados — o seed só completa campos vazios.
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, tone = 'slate' }) {
  const toneClass = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    amber: 'bg-amber-50 text-amber-700 border-amber-100',
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    slate: 'bg-slate-50 text-slate-700 border-slate-200',
  }[tone];
  return (
    <div className={`rounded-lg border px-3 py-2 ${toneClass}`}>
      <div className="text-[10px] uppercase tracking-wider opacity-70">{label}</div>
      <div className="text-lg font-bold">{value}</div>
    </div>
  );
}

function StatusCard({ icon: Icon, title, total, v52, loading, hint }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#2bc196]/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-[#2bc196]" />
          </div>
          <div>
            <p className="text-xs text-[#002443]/50 uppercase tracking-wide font-bold">{title}</p>
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#002443]/30 mt-1" />
            ) : (
              <p className="text-2xl font-bold text-[#002443]">{total}</p>
            )}
          </div>
        </div>
        <div className="text-xs text-[#002443]/60">
          <Badge className="bg-[#2bc196]/10 text-[#2bc196] border-0 mr-2">{v52} V5.2</Badge>
          <span className="text-[#002443]/40">{hint}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function SeedResultPanel({ result }) {
  if (!result?.summary) return null;
  const { summary } = result;
  return (
    <div className="space-y-3">
      <div className="bg-[#f4f4f4] rounded-xl p-4">
        <p className="text-sm font-bold text-[#002443] mb-2">
          {result.mode === 'preview' ? '🔍 Preview (sem escrita)' : '✅ Aplicado'}
        </p>
        <p className="text-xs text-[#002443]/70">{result.message}</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {['capabilities', 'bloqueios', 'datasets'].map(section => (
          <div key={section} className="p-4 border border-[#002443]/5 rounded-xl bg-white">
            <p className="font-bold text-sm text-[#002443] capitalize mb-2">{section}</p>
            <div className="space-y-1 text-xs">
              <p className="text-emerald-700">+ {summary[section].inserted} inserted</p>
              <p className="text-amber-700">↻ {summary[section].updated} updated</p>
              <p className="text-[#002443]/40">= {summary[section].skipped} skipped</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}