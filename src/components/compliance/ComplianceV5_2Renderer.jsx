import React, { useEffect, useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Rocket, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

import QuestionRendererV5_2 from '@/components/v5_2/questionnaire/QuestionRendererV5_2';
import TierEscalatedBanner from '@/components/v5_2/questionnaire/TierEscalatedBanner';
import RealtimeBlocksPanel from '@/components/v5_2/questionnaire/RealtimeBlocksPanel';
import { resolverTierDinamico } from '@/lib/v5_2/tieringEngine';
import { evaluateRealtimeBlocks } from '@/lib/v5_2/realtimeBlockEngine';

/**
 * [V5.2 — Fase 5.7] Renderer público do questionário V5.2 dinâmico.
 *
 * NÃO substitui o V4. É chamado APENAS quando `ComplianceDinamico` detecta
 * `model === 'ComplianceV5_2Dynamic'`. O fluxo V4 continua usando
 * `DynamicQuestionnaire` exatamente como hoje.
 *
 * Esta primeira versão (5.7) entrega:
 *   - Carregamento do template V5.2 + perguntas canônicas
 *   - Filtragem dinâmica por tier/segmento/capabilities
 *   - 5 modalidades (A/B/C/D/E) via QuestionRendererV5_2
 *   - Tier escalation banner em tempo real
 *   - Painel de bloqueios soft/hard ao vivo
 *   - Autosave em localStorage
 *
 * Backend submit V5.2 fica para a Fase 5.8.
 */
export default function ComplianceV5_2Renderer({ storageKey, badgeLabel, badgeColor }) {
  const [template, setTemplate] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Contexto da sessão (lido do localStorage / URL params, sem mexer no backend)
  const [merchantContext, setMerchantContext] = useState(() => ({
    tipo: 'PJ',
    tpvMensalDeclarado: 0,
    segmento: 'ecommerce',
    capabilitiesAtivas: [],
  }));

  const [answers, setAnswers] = useState({});
  const [uploadedFiles, setUploadedFiles] = useState({});

  // ─── Carrega template V5.2 + perguntas ───
  useEffect(() => {
    (async () => {
      try {
        const templates = await base44.entities.QuestionnaireTemplate.filter({
          subCategory: 'V5_2_DYNAMIC',
          isActive: true,
        });
        if (!templates || templates.length === 0) {
          setError('Template V5.2 não encontrado. Rode o seed em V5.2 Status → aba "Questions V5.2".');
          setLoading(false);
          return;
        }
        const t = templates[0];
        const qs = await base44.entities.Question.filter({ questionnaireTemplateId: t.id }, 'order', 200);
        setTemplate(t);
        setQuestions(qs || []);
      } catch (e) {
        setError(e.message || 'Erro ao carregar questionário V5.2');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ─── Autosave local ───
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.merchantContext) setMerchantContext(parsed.merchantContext);
      }
    } catch {}
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ answers, merchantContext }));
    } catch {}
  }, [answers, merchantContext, storageKey]);

  // ─── Resolução tier + bloqueios ao vivo ───
  const tierResult = useMemo(() => {
    try {
      return resolverTierDinamico({
        segmento: merchantContext.segmento,
        merchantType: merchantContext.tipo,
        tpvMensalDeclarado: merchantContext.tpvMensalDeclarado,
        respostas: answers,
      });
    } catch {
      return null;
    }
  }, [merchantContext, answers]);

  const blocks = useMemo(() => {
    try {
      return evaluateRealtimeBlocks({
        answers,
        merchantContext,
        tier: tierResult?.tier,
      });
    } catch {
      return { soft: [], hard: [] };
    }
  }, [answers, merchantContext, tierResult]);

  // ─── Filtragem dinâmica de perguntas ───
  const visibleQuestions = useMemo(() => {
    if (!questions.length) return [];
    return questions
      .filter((q) => {
        // Tier filter
        if (q.tiers_aplicaveis?.length && tierResult?.tier && !q.tiers_aplicaveis.includes(tierResult.tier)) {
          return false;
        }
        // Segmento filter
        if (q.segmentos_aplicaveis?.length && !q.segmentos_aplicaveis.includes('all')) {
          if (!q.segmentos_aplicaveis.includes(merchantContext.segmento)) return false;
        }
        // Capability filter
        if (q.capabilities_ativam?.length) {
          const hasAny = q.capabilities_ativam.some((c) => merchantContext.capabilitiesAtivas?.includes(c));
          if (!hasAny) return false;
        }
        // Conditional logic clássica
        if (q.conditionalLogic?.dependsOn) {
          const depVal = answers[q.conditionalLogic.dependsOn];
          if (q.conditionalLogic.operator === 'equals' && depVal !== q.conditionalLogic.value) return false;
        }
        return true;
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [questions, tierResult, merchantContext, answers]);

  const handleAnswer = (questionId, value) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleFileUpload = (questionId, file) => {
    setUploadedFiles((prev) => ({ ...prev, [questionId]: file }));
  };

  const handleSubmit = () => {
    // Fase 5.8 implementará o submit real. Por ora, persistimos local + mostramos toast.
    if (blocks.hard.length > 0) {
      toast.error('Existem bloqueios críticos. Revise antes de enviar.');
      return;
    }
    toast.success('Respostas salvas localmente. Submit V5.2 será habilitado na Fase 5.8.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-[#2bc196]" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-6 text-amber-900 text-sm">
          {error}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#2bc196]/10">
            <Rocket className="w-5 h-5 text-[#2bc196]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#002443]">Onboarding V5.2</h1>
            <p className="text-xs text-[#002443]/60">{template?.name}</p>
          </div>
        </div>
        <Badge className={badgeColor || 'bg-[#2bc196]/15 text-[#36706c] border-0'}>
          {badgeLabel || 'V5.2 DINÂMICO'}
        </Badge>
      </div>

      {/* Tier escalation banner */}
      {tierResult?.escalado && (
        <TierEscalatedBanner
          fromTier={tierResult.tier_base}
          toTier={tierResult.tier_final}
          reasons={tierResult.motivos || []}
        />
      )}

      {/* Realtime blocks */}
      <RealtimeBlocksPanel soft={blocks.soft} hard={blocks.hard} />

      {/* Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#2bc196]" />
            {visibleQuestions.length} pergunta{visibleQuestions.length !== 1 ? 's' : ''} no fluxo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {visibleQuestions.length === 0 ? (
            <p className="text-sm text-[#002443]/60">Nenhuma pergunta aplicável ao contexto atual.</p>
          ) : (
            visibleQuestions.map((q) => (
              <QuestionRendererV5_2
                key={q.id}
                question={q}
                value={answers[q.id]}
                onChange={(v) => handleAnswer(q.id, v)}
                onFileUpload={(file) => handleFileUpload(q.id, file)}
                file={uploadedFiles[q.id]}
                bdcSnapshot={null}
              />
            ))
          )}
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleSubmit}
          disabled={blocks.hard.length > 0}
          className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white"
        >
          Enviar respostas
        </Button>
      </div>

      {/* Beta banner */}
      <div className="text-[11px] text-[#002443]/40 text-center pt-4 border-t border-[#002443]/5">
        Framework V5.2 — Fase 5.7 (Beta). Backend submit completo na Fase 5.8.
      </div>
    </div>
  );
}