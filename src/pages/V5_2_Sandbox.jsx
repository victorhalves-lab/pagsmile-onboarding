// V5.2 — Sandbox interno (admin-only) para validar o fluxo V5.2 end-to-end.
// Mostra: questionário tier-aware + tieringEngine ao vivo + realtime blocks.
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

import { QUESTIONS_V5_2 } from '@/lib/v5_2/questionCatalog';
import { resolverTierDinamico } from '@/lib/v5_2/tieringEngine';
import { evaluateRealtimeBlocks } from '@/lib/v5_2/realtimeBlockEngine';
import { SEGMENTOS_CANONICOS } from '@/lib/v5_2/constants';

import QuestionRendererV5_2 from '@/components/v5_2/questionnaire/QuestionRendererV5_2';
import RealtimeBlocksPanel from '@/components/v5_2/questionnaire/RealtimeBlocksPanel';
import TierEscalatedBanner from '@/components/v5_2/questionnaire/TierEscalatedBanner';

export default function V5_2_Sandbox() {
  const [merchantType, setMerchantType] = useState('PJ');
  const [isSubseller, setIsSubseller] = useState(false);
  const [segmento, setSegmento] = useState('ecommerce');
  const [respostas, setRespostas] = useState({});
  const [filesMeta, setFilesMeta] = useState({});

  // Snapshot BDC simulado (placeholder para a sandbox)
  const bdcSnapshot = useMemo(() => ({
    companyName: 'ACME SOLUÇÕES LTDA',
    tradeName: 'ACME',
    taxIdStatus: 'ATIVA',
    capitalSocial: 50000,
    foundingDate: '2022-03-15',
    lista_suja_mte: false,
    pep_detectado: false,
  }), []);

  const tpvDeclarado = Number(respostas.q_base_tpv_mensal_declarado) || 0;
  const rendaPF = Number(respostas.q_sub_pf_renda_mensal) || 0;

  // Tiering dinâmico
  const tierResult = useMemo(() => resolverTierDinamico({
    segmento,
    merchantType,
    isSubseller,
    tpvMensalDeclarado: tpvDeclarado,
    rendaMensalLiquida: rendaPF,
    respostas: {
      ...respostas,
      // mapas atalhos para o engine reconhecer
      mcc: respostas.q_base_mcc,
      paises_destino: respostas.q_cap_crossborder_paises_destino,
    },
    bdcSnapshot,
  }), [segmento, merchantType, isSubseller, tpvDeclarado, rendaPF, respostas, bdcSnapshot]);

  // Bloqueios real-time
  const blocks = useMemo(() => evaluateRealtimeBlocks({
    respostas,
    bdcSnapshot,
    segmento,
    tier: tierResult.tier,
    capabilities_ativas: tierResult.capabilities_ativas,
  }), [respostas, bdcSnapshot, segmento, tierResult]);

  // Filtragem dinâmica das perguntas por tier + segmento + capabilities
  const perguntasVisiveis = useMemo(() => {
    return QUESTIONS_V5_2.filter((q) => {
      const tiersOk = !q.tiers_aplicaveis?.length || q.tiers_aplicaveis.includes(tierResult.tier);
      const segOk = !q.segmentos_aplicaveis?.length
        || q.segmentos_aplicaveis.includes('all')
        || q.segmentos_aplicaveis.includes(segmento);
      const capOk = !q.capabilities_ativam?.length
        || q.capabilities_ativam.some((c) => tierResult.capabilities_ativas.includes(c));
      // conditionalLogic mínimo: dependsOn + operator + value (string)
      if (q.conditionalLogic?.dependsOn) {
        const dep = respostas[q.conditionalLogic.dependsOn];
        const target = q.conditionalLogic.value;
        const op = q.conditionalLogic.operator;
        if (op === 'greater_than' && !(Number(dep) > Number(target))) return false;
        if (op === 'equals' && String(dep) !== String(target)) return false;
      }
      return tiersOk && segOk && capOk;
    }).sort((a, b) => a.order - b.order);
  }, [tierResult, segmento, respostas]);

  const handleChange = (idCanonico, v) => setRespostas((s) => ({ ...s, [idCanonico]: v }));
  const handleFile = (idCanonico, file) => setFilesMeta((s) => ({
    ...s,
    [idCanonico]: { fileName: file.name, fileSize: file.size },
  }));
  const handleRemoveFile = (idCanonico) => setFilesMeta((s) => {
    const copy = { ...s }; delete copy[idCanonico]; return copy;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">V5.2 — Sandbox de Questionário</h1>
        <p className="text-sm text-slate-600">Admin-only — valida fluxo dinâmico, tiering e bloqueios em tempo real.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna esquerda: contexto + perguntas */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contexto do caso</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={merchantType} onValueChange={setMerchantType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PJ">PJ</SelectItem>
                    <SelectItem value="PF">PF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Segmento</Label>
                <Select value={segmento} onValueChange={setSegmento}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SEGMENTOS_CANONICOS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Subseller?</Label>
                <Select value={String(isSubseller)} onValueChange={(v) => setIsSubseller(v === 'true')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Não</SelectItem>
                    <SelectItem value="true">Sim</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <TierEscalatedBanner
            tier_base={tierResult.tier_base}
            tier_final={tierResult.tier_final}
            motivos={tierResult.motivos}
          />

          <RealtimeBlocksPanel soft={blocks.soft} hard={blocks.hard} />

          <div className="space-y-3">
            <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
              Perguntas dinâmicas ({perguntasVisiveis.length})
            </div>
            {perguntasVisiveis.length === 0 && (
              <Card>
                <CardContent className="py-6 text-center text-sm text-slate-500">
                  Nenhuma pergunta aplicável a este contexto.
                </CardContent>
              </Card>
            )}
            {perguntasVisiveis.map((q) => (
              <QuestionRendererV5_2
                key={q.id_canonico}
                question={q}
                value={respostas[q.id_canonico]}
                fileMeta={filesMeta[q.id_canonico]}
                bdcSnapshot={bdcSnapshot}
                onChange={(v) => handleChange(q.id_canonico, v)}
                onChangeFile={(f) => handleFile(q.id_canonico, f)}
                onRemoveFile={() => handleRemoveFile(q.id_canonico)}
                datasetNomeAmigavel={q.cross_check_bdc?.dataset || 'BDC'}
              />
            ))}
          </div>
        </div>

        {/* Coluna direita: state inspector */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tier resolvido</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-slate-500 text-xs">tier_base:</span>{' '}
                <Badge variant="outline">{tierResult.tier_base}</Badge>
              </div>
              <div>
                <span className="text-slate-500 text-xs">tier_final:</span>{' '}
                <Badge className={tierResult.escalado ? 'bg-indigo-600' : 'bg-slate-600'}>
                  {tierResult.tier_final}
                </Badge>
              </div>
              {tierResult.grau && (
                <div>
                  <span className="text-slate-500 text-xs">grau:</span>{' '}
                  <Badge variant="outline">{tierResult.grau}</Badge>
                </div>
              )}
              <div>
                <span className="text-slate-500 text-xs">capabilities ativas:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {tierResult.capabilities_ativas.length === 0 && (
                    <span className="text-xs text-slate-400">— nenhuma —</span>
                  )}
                  {tierResult.capabilities_ativas.map((c) => (
                    <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-slate-500 text-xs">triggers:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {tierResult.triggers.length === 0 && (
                    <span className="text-xs text-slate-400">— nenhum —</span>
                  )}
                  {tierResult.triggers.map((t) => (
                    <Badge key={t.codigo} variant="outline" className="text-[10px]">{t.codigo}</Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Respostas (live)</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-[10px] bg-slate-50 border border-slate-200 rounded p-2 overflow-auto max-h-96">
{JSON.stringify({ respostas, filesMeta }, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}