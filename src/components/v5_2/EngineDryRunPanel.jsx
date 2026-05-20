/**
 * [V5.2 — Entrega 2] EngineDryRunPanel
 * ─────────────────────────────────────
 * Painel administrativo para comparar V5.1 vs V5.2 lado-a-lado SEM persistir.
 * Útil para auditar diferenças antes do flip da flag `score_engine_v5_2`.
 *
 * Chama o backend `scoreV5_2DryRun` que faz:
 *   - resolve tier V5.1 e V5.2 (regras diferentes pra T3)
 *   - calcula score_max V5.1 e V5.2 (escalas corrigidas)
 *   - mostra mudanças por caso
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function EngineDryRunPanel() {
  const [running, setRunning] = useState(false);
  const [limit, setLimit] = useState(20);
  const [result, setResult] = useState(null);

  const runDryRun = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await base44.functions.invoke('scoreV5_2DryRun', { limit: Number(limit) || 20 });
      setResult(res.data);
      toast.success(`Comparação V5.1 vs V5.2 gerada — ${res.data?.sumario?.com_mudanca || 0} casos com diferenças`);
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
            <Play className="w-5 h-5 text-[#2bc196]" />
            Dry-Run Comparativo V5.1 → V5.2
          </CardTitle>
          <CardDescription>
            Roda o engine V5.2 sobre casos REAIS sem persistir nada. Mostra como cada caso seria
            re-classificado pela nova engine (tier, escala de score). Útil para validar antes
            do flip da flag <code>score_engine_v5_2</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <div>
              <label className="text-xs font-bold text-[#002443]/70 block mb-1">Casos a amostrar</label>
              <Input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="w-32"
                min={1}
                max={100}
              />
            </div>
            <Button onClick={runDryRun} disabled={running} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white">
              {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
              Comparar V5.1 vs V5.2
            </Button>
          </div>

          {result?.sumario && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <SummaryCard label="Total amostrados" value={result.sumario.total} />
              <SummaryCard label="Com mudanças" value={result.sumario.com_mudanca} highlight />
              <SummaryCard label="Mudança de tier" value={result.sumario.mudancas_tier} />
              <SummaryCard label="Mudança de escala" value={result.sumario.mudancas_escala} />
            </div>
          )}

          {result?.results?.length > 0 && (
            <div className="border border-[#002443]/5 rounded-xl bg-white overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-[#f4f4f4] text-[10px] uppercase font-bold text-[#002443]/60 border-b">
                <div className="col-span-3">Merchant</div>
                <div className="col-span-2">Segmento</div>
                <div className="col-span-2">Tier V5.1 → V5.2</div>
                <div className="col-span-2">Escala V5.1 → V5.2</div>
                <div className="col-span-3">Mudanças</div>
              </div>
              <div className="max-h-[480px] overflow-y-auto divide-y divide-[#002443]/5">
                {result.results.map((r) => (
                  <div key={r.caseId} className="grid grid-cols-12 gap-2 px-3 py-2 text-xs">
                    <div className="col-span-3 truncate" title={r.merchantName}>
                      <p className="font-semibold text-[#002443]">{r.merchantName}</p>
                      <p className="text-[10px] text-[#002443]/40 font-mono">{r.cpfCnpj}</p>
                    </div>
                    <div className="col-span-2">
                      <Badge variant="outline" className="text-[10px]">{r.segmento}</Badge>
                      {r.tpvDeclarado > 0 && (
                        <p className="text-[10px] text-[#002443]/50 mt-1">
                          TPV: R$ {Number(r.tpvDeclarado).toLocaleString('pt-BR')}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2 flex items-center gap-1">
                      <Badge variant="outline" className="text-[10px]">{r.tier_v5_1}</Badge>
                      <ArrowRight className="w-3 h-3 text-[#002443]/40" />
                      <Badge
                        className={`text-[10px] border-0 ${
                          r.tier_v5_1 !== r.tier_v5_2
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-[#f4f4f4] text-[#002443]/70'
                        }`}
                      >
                        {r.tier_v5_2}
                      </Badge>
                    </div>
                    <div className="col-span-2 flex items-center gap-1">
                      <span className="font-mono text-[10px] text-[#002443]/60">{r.score_max_v5_1}</span>
                      <ArrowRight className="w-3 h-3 text-[#002443]/40" />
                      <span
                        className={`font-mono text-[10px] font-bold ${
                          r.score_max_v5_1 !== r.score_max_v5_2 ? 'text-amber-700' : 'text-[#002443]/60'
                        }`}
                      >
                        {r.score_max_v5_2}
                      </span>
                    </div>
                    <div className="col-span-3">
                      {r.tem_mudanca ? (
                        <div className="space-y-0.5">
                          {r.mudancas.map((m, i) => (
                            <p key={i} className="text-[10px] text-amber-700 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {m}
                            </p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Sem mudança
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/30">
        <CardContent className="p-4 text-sm">
          <p className="font-bold text-amber-900 mb-1">⚡ Como aplicar V5.2 em produção</p>
          <ol className="text-amber-800 text-xs space-y-1 list-decimal list-inside leading-relaxed">
            <li>Rode o seed master data (aba <strong>Seed Master Data</strong>) em modo <code>apply</code>.</li>
            <li>Rode este dry-run em amostras variadas e valide as mudanças.</li>
            <li>Quando o seu time aprovar, ative a flag <code>score_engine_v5_2</code> (Fase 3 — quando criação de casos novos passar a usar V5.2).</li>
            <li>Casos existentes V4/V5.1 NUNCA são reprocessados — eles ficam imutáveis no framework original (princípio "DNA imutável").</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({ label, value, highlight }) {
  return (
    <div
      className={`p-3 rounded-xl border ${
        highlight ? 'bg-amber-50 border-amber-200' : 'bg-white border-[#002443]/5'
      }`}
    >
      <p className="text-[10px] uppercase font-bold text-[#002443]/50 tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${highlight ? 'text-amber-700' : 'text-[#002443]'}`}>
        {value}
      </p>
    </div>
  );
}