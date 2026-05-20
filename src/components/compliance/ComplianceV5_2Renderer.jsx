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
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null); // { merchantId, onboardingCaseId, docLinkToken }

  // Captura framework_version_at_start uma única vez (DNA imutável do bootstrap)
  const [frameworkAtStart] = useState(() => {
    try {
      const existing = localStorage.getItem('v5_2_framework_at_start');
      if (existing) return existing;
      const v = 'v5.2';
      localStorage.setItem('v5_2_framework_at_start', v);
      return v;
    } catch {
      return 'v5.2';
    }
  });

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

  /**
   * Lookup de resposta por id_canonico (V5.2) com fallback para id Base44.
   */
  const findAnswerByCanonical = (idCanonico) => {
    const q = questions.find((qq) => qq.id_canonico === idCanonico);
    if (!q) return undefined;
    return answers[q.id];
  };

  /**
   * Submit V5.2 real — chama publicComplianceSubmit forçando framework_version=v5.2.
   * Reusa a função V4 (que já cobre dedup de Merchant, criação de Case e bulk insert
   * de QuestionnaireResponse). A engine V5.2 backend continua intocada.
   */
  const handleSubmit = async () => {
    if (blocks.hard.length > 0) {
      toast.error('Existem bloqueios críticos. Revise antes de enviar.');
      return;
    }
    if (!template?.id) {
      toast.error('Template V5.2 indisponível.');
      return;
    }
    if (visibleQuestions.length === 0) {
      toast.error('Nenhuma pergunta para enviar.');
      return;
    }

    setSubmitting(true);
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const linkCode = urlParams.get('linkCode') || urlParams.get('code') || '';
      const leadId = urlParams.get('leadId') || '';

      // ─── Monta merchantData a partir de respostas canônicas (com fallback) ───
      const cpfCnpj = findAnswerByCanonical('q_identidade_cpf_cnpj')
        || findAnswerByCanonical('q_identidade_cnpj')
        || findAnswerByCanonical('q_identidade_cpf')
        || '';
      const fullName = findAnswerByCanonical('q_identidade_razao_social')
        || findAnswerByCanonical('q_identidade_nome_completo')
        || '';
      const companyName = findAnswerByCanonical('q_identidade_nome_fantasia') || '';
      const email = findAnswerByCanonical('q_contato_email') || '';
      const phone = findAnswerByCanonical('q_contato_telefone') || '';

      const merchantData = {
        type: merchantContext.tipo === 'PF' ? 'PF' : 'PJ',
        cpfCnpj: String(cpfCnpj || '').replace(/\D/g, ''),
        fullName: String(fullName || companyName || 'N/A').slice(0, 200),
        companyName: String(companyName || '').slice(0, 200),
        email: String(email || '').toLowerCase().trim(),
        phone: String(phone || '').trim(),
        onboardingStatus: 'Em Análise',
      };

      // ─── Monta responses no shape esperado pela função V4 ───
      const responsesPayload = visibleQuestions
        .filter((q) => answers[q.id] !== undefined && answers[q.id] !== '')
        .map((q) => {
          const v = answers[q.id];
          const entry = {
            questionId: q.id,
            questionText: q.text || '',
            questionType: q.type || 'TEXT',
          };
          if (typeof v === 'boolean') entry.valueBoolean = v;
          else if (typeof v === 'number') entry.valueNumber = v;
          else if (Array.isArray(v)) entry.valueArray = v.map(String);
          else entry.valueText = String(v);
          return entry;
        });

      const onboardingCaseData = {
        status: 'Pendente',
        priority: tierResult?.tier === 'tier_3' ? 'high' : 'medium',
        onboardingLinkCode: linkCode,
        framework_version_at_start: frameworkAtStart,
      };

      const res = await base44.functions.invoke('publicComplianceSubmit', {
        templateId: template.id,
        merchantData,
        onboardingCaseData,
        responses: responsesPayload,
        linkCode,
        leadId: leadId || undefined,
      });

      if (res.data?.ok) {
        setSubmitted({
          merchantId: res.data.merchantId,
          onboardingCaseId: res.data.onboardingCaseId,
          docLinkToken: res.data.docLinkToken,
          framework_version: res.data.framework_version,
          deduped: res.data.deduped,
        });
        // Limpa autosave para evitar re-submit acidental
        try { if (storageKey) localStorage.removeItem(storageKey); } catch {}
        toast.success(res.data.deduped
          ? 'Onboarding já existente reaproveitado.'
          : 'Respostas V5.2 enviadas com sucesso.');
      } else {
        toast.error('Erro: ' + (res.data?.error || 'falha desconhecida'));
      }
    } catch (e) {
      toast.error('Erro ao enviar: ' + (e?.message || 'desconhecido'));
    } finally {
      setSubmitting(false);
    }
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

      {/* Success state */}
      {submitted && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="p-5 text-sm text-emerald-900 space-y-1">
            <p className="font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              {submitted.deduped ? 'Onboarding já existente reaproveitado' : 'Onboarding V5.2 criado'}
            </p>
            <p className="text-xs text-emerald-800/80 font-mono">
              Caso: {submitted.onboardingCaseId} · Framework: {submitted.framework_version || 'v5.2'}
            </p>
            <p className="text-xs text-emerald-800/80">
              Próximo passo: envio de documentos será habilitado em fase posterior.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      {!submitted && (
        <div className="flex justify-end pt-2">
          <Button
            onClick={handleSubmit}
            disabled={blocks.hard.length > 0 || submitting}
            className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando…</>
            ) : (
              'Enviar respostas'
            )}
          </Button>
        </div>
      )}

      {/* Beta banner */}
      <div className="text-[11px] text-[#002443]/40 text-center pt-4 border-t border-[#002443]/5">
        Framework V5.2 — Fase 5.8 (Beta). Persistência ativa, pipeline de score V5.2 ativará automaticamente.
      </div>
    </div>
  );
}