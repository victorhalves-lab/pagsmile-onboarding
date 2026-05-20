/**
 * [V5.2 — Entrega 3] CaseDryRunPanel
 * ──────────────────────────────────
 * Roda o pipeline V5.2 COMPLETO sobre um caso específico em modo `dryRun=true`:
 *   - Resolve tier base + triggers + tier final
 *   - Avalia bloqueios via catálogo
 *   - Calcula score 5 camadas
 *   - Mostra decisão final (com e sem bloqueios)
 * Nada é persistido.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, ArrowRight, ShieldAlert, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function CaseDryRunPanel() {
  const [caseId, setCaseId] = useState('');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const run = async () => {
    if (!caseId.trim()) {
      toast.error('Informe o ID do caso');
      return;
    }
    setRunning(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('bdcEnrichCaseV5_2', { onboardingCaseId: caseId.trim(), dryRun: true });
      setResult(res.data);
      if (res.data?.success === false || res.data?.error) {
        toast.error('Erro: ' + (res.data?.error || 'desconhecido'));
      } else {
        toast.success(`Pipeline V5.2 simulado — categoria: ${res.data?.categoria_decisao || '?'}`);
      }
    } catch (e) {
      toast.error('Erro: ' + (e.message || 'desconhecido'));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#2bc196]" />
            Pipeline V5.2 Dry-Run (caso único)
          </CardTitle>
          <CardDescription>
            Executa o pipeline completo V5.2 sobre um <strong>OnboardingCase específico</strong>:
            resolução de tier com triggers, capabilities, catálogo de bloqueios e score 5 camadas.
            <strong> Nada é persistido</strong> — útil para validar como um caso real seria classificado pela V5.2.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-[#002443]/70 block mb-1">OnboardingCase ID</label>
              <Input
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
                placeholder="ex: 67ab123..."
                className="font-mono"
              />
            </div>
            <Button onClick={run} disabled={running} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white">
              {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Rodar Pipeline
            </Button>
          </div>

          {result && !result.error && (
            <div className="space-y-3 pt-2">
              {/* Tier resolution */}
              <Card className="border-[#2bc196]/20">
                <CardContent className="p-4">
                  <p className="text-[10px] uppercase font-bold text-[#002443]/50 tracking-wide mb-2">
                    1. Resolução de Tier
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">{result.tier_base}</Badge>
                    <ArrowRight className="w-4 h-4 text-[#002443]/40" />
                    <Badge
                      className={`text-xs border-0 ${
                        result.escalado ? 'bg-amber-100 text-amber-700' : 'bg-[#f4f4f4] text-[#002443]/70'
                      }`}
                    >
                      {result.tier} {result.escalado && '↑ ESCALADO'}
                    </Badge>
                  </div>
                  <p className="text-xs text-[#002443]/60 mt-2">{result.motivo_escalada}</p>
                  {result.triggers_disparados?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {result.triggers_disparados.map((t) => (
                        <Badge key={t} className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Contexto */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-[10px] uppercase font-bold text-[#002443]/50 tracking-wide mb-2">
                    2. Contexto resolvido
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <Field label="Segmento" value={result.segmento} />
                    <Field label="Morfologia" value={result.morfologia} />
                    <Field
                      label="Capabilities"
                      value={result.capabilities_ativas?.length ? result.capabilities_ativas.join(', ') : '—'}
                    />
                    <Field label="Subfaixa" value={result.subfaixa_tier_aware} />
                  </div>
                </CardContent>
              </Card>

              {/* Score */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-[10px] uppercase font-bold text-[#002443]/50 tracking-wide mb-2">
                    3. Score V5.2 (5 camadas)
                  </p>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl font-bold text-[#002443]">
                      {result.score}
                      <span className="text-base text-[#002443]/40 font-normal"> / {result.score_max}</span>
                    </div>
                    <Badge className="bg-[#2bc196]/10 text-[#2bc196] border-0">
                      {Math.round((result.score / result.score_max) * 100)}%
                    </Badge>
                  </div>
                  <div className="space-y-1 text-xs">
                    {result.camadas && Object.entries(result.camadas).map(([k, v]) => (
                      <div key={k} className="flex justify-between border-b border-[#002443]/5 py-1">
                        <span className="text-[#002443]/60">{k.replace(/_/g, ' ')}</span>
                        <span className={`font-mono font-bold ${v.valor < 0 ? 'text-red-600' : v.valor > 0 ? 'text-emerald-600' : 'text-[#002443]/40'}`}>
                          {v.valor > 0 ? '+' : ''}{v.valor}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Bloqueios */}
              <Card className={result.bloqueios_ativos?.length > 0 ? 'border-red-200 bg-red-50/30' : ''}>
                <CardContent className="p-4">
                  <p className="text-[10px] uppercase font-bold text-[#002443]/50 tracking-wide mb-2 flex items-center gap-2">
                    <ShieldAlert className="w-3 h-3" /> 4. Bloqueios avaliados (catálogo dinâmico)
                  </p>
                  {result.bloqueios_ativos?.length > 0 ? (
                    <div className="space-y-2">
                      {result.bloqueios_detalhes?.map((b) => (
                        <div key={b.codigo} className="p-2 rounded-lg bg-white border border-red-200 text-xs">
                          <div className="flex items-center gap-2 flex-wrap">
                            <code className="font-mono font-bold text-red-700">{b.codigo}</code>
                            <Badge className="bg-red-100 text-red-700 border-0 text-[10px]">{b.severidade}</Badge>
                            {b.nucleo_duro_regulatorio && (
                              <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px]">NÚCLEO DURO</Badge>
                            )}
                            <span className="text-[#002443]/70">{b.titulo}</span>
                          </div>
                          <p className="text-[10px] text-[#002443]/50 mt-1">Razão: {b.razao}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-emerald-700">✓ Nenhum bloqueio disparado</p>
                  )}
                </CardContent>
              </Card>

              {/* Decisão final */}
              <Card className="bg-[#002443] text-white">
                <CardContent className="p-4">
                  <p className="text-[10px] uppercase font-bold text-white/40 tracking-wide mb-2">
                    5. Decisão final
                  </p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-white/10 text-white border-0">{result.categoria_decisao}</Badge>
                    {result.categoria_decisao_score !== result.categoria_decisao && (
                      <span className="text-[10px] text-white/40">
                        (score sozinho: {result.categoria_decisao_score} → ajustado por bloqueios)
                      </span>
                    )}
                  </div>
                  <p className="text-white/70 text-sm mt-2">{result.recomendacao_final}</p>
                  <p className="text-white/40 text-[10px] mt-2">⏱ {result.elapsed_ms}ms</p>
                </CardContent>
              </Card>
            </div>
          )}

          {result?.error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              <p className="font-bold">Erro:</p>
              <p>{result.error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase text-[#002443]/40 font-bold tracking-wide">{label}</p>
      <p className="text-[#002443] font-semibold mt-0.5">{value || '—'}</p>
    </div>
  );
}