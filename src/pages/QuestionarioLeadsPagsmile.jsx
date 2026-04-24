import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { callPublicFunction } from '@/lib/publicApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Send, Check, ChevronLeft, ChevronRight, Lock } from 'lucide-react';
import { toast } from 'sonner';

import StepSegmento from '@/components/lead-pagsmile/StepSegmento';
import StepDadosEmpresa from '@/components/lead-pagsmile/StepDadosEmpresa';
import StepEndereco from '@/components/lead-pagsmile/StepEndereco';
import StepContato from '@/components/lead-pagsmile/StepContato';
import StepModeloNegocio from '@/components/lead-pagsmile/StepModeloNegocio';
import StepVolumetria from '@/components/lead-pagsmile/StepVolumetria';
import StepDistribuicao from '@/components/lead-pagsmile/StepDistribuicao';
import StepTaxasAtuais from '@/components/lead-pagsmile/StepTaxasAtuais';
import StepProcessadorAtual from '@/components/lead-pagsmile/StepProcessadorAtual';
import StepComplianceRisco from '@/components/lead-pagsmile/StepComplianceRisco';
import StepFechamento from '@/components/lead-pagsmile/StepFechamento';
import ValidationSummary from '@/components/lead-pagsmile/ValidationSummary';
import StepProgressIndicator from '@/components/lead-pagsmile/StepProgressIndicator';
import DraftRecoveryBanner from '@/components/lead-pagsmile/DraftRecoveryBanner';
import useLeadV5Autosave from '@/hooks/useLeadV5Autosave';

import { calculateLeadScore, calculateSilentFlags, getScoreLabel, SEGMENTS } from '@/components/lead-pagsmile/pagsmileQuestionnaireData';
import { calculateBDCEnrichedScore, getBDCScoreLabel } from '@/components/lead-scoring/bdcLeadScoring';
import { validateStepV5, countStepFields } from '@/components/lead-pagsmile/leadV5Validators';

const STEPS = [
  { id: 'segmento', label: 'Tipo de Negócio' },
  { id: 'empresa', label: 'Dados da Empresa' },
  { id: 'endereco', label: 'Endereço' },
  { id: 'contato', label: 'Contato' },
  { id: 'modelo', label: 'Modelo de Negócio' },
  { id: 'volumetria', label: 'Volumetria' },
  { id: 'distribuicao', label: 'Distribuição' },
  { id: 'taxas', label: 'Taxas Atuais' },
  { id: 'processador', label: 'Processador' },
  { id: 'compliance', label: 'Compliance' },
  { id: 'fechamento', label: 'Fechamento' },
];

// Helper: strip internal keys (prefixed with "_") and heavy blobs from form before sending
function sanitizeFormForSubmit(form) {
  const clean = {};
  for (const [k, v] of Object.entries(form)) {
    // Keep _silentFlags, _declarativeScore, _bdcScore, _leadScore, _cnpjEnrichment (set explicitly below)
    // but drop the raw _bdcQuickData blob (can be large, re-fetched server-side)
    if (k === '_bdcQuickData') continue;
    clean[k] = v;
  }
  return clean;
}

export default function QuestionarioLeadsPagsmile() {
  const urlParams = new URLSearchParams(window.location.search);
  const linkCode = urlParams.get('ref');

  const { data: onboardingLink } = useQuery({
    queryKey: ['onboardingLink', linkCode],
    queryFn: async () => {
      if (!linkCode) return null;
      const res = await callPublicFunction('publicReadContext', { kind: 'onboarding_link', uniqueCode: linkCode });
      return res?.link || null;
    },
    enabled: !!linkCode
  });

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({});
  const [cnpjData, setCnpjData] = useState(null);
  const [showValidation, setShowValidation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [protocolo, setProtocolo] = useState('');
  const [bdcData, setBdcData] = useState(null);

  // ── Autosave + draft recovery ──
  const { recoverable, clear: clearDraft, discardRecoverable } = useLeadV5Autosave({ form, step, linkCode });

  const restoreDraft = useCallback(() => {
    if (recoverable?.form) {
      setForm(recoverable.form);
      setStep(recoverable.step || 0);
      discardRecoverable();
      toast.success('Rascunho restaurado!');
    }
  }, [recoverable, discardRecoverable]);

  const updateField = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // ── Derived: live validation for current step ──
  const validation = useMemo(() => validateStepV5(step, form), [step, form]);
  const fieldCount = useMemo(() => countStepFields(step, form), [step, form]);
  const errors = validation.errors;

  // Reset validation banner when user moves to a different step
  useEffect(() => { setShowValidation(false); }, [step]);

  // ── Scroll helper: focus first error field ──
  const scrollToFirstError = useCallback(() => {
    const firstField = validation.raw[0]?.field;
    if (!firstField) return;
    // Wait a tick for the error summary to render
    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-field="${firstField}"]`)
        || document.querySelector(`[name="${firstField}"]`);
      if (el && el.scrollIntoView) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  }, [validation]);

  const nextStep = () => {
    if (!validation.isValid) {
      setShowValidation(true);
      scrollToFirstError();
      return;
    }
    setShowValidation(false);
    const jaProcessa = form.jaProcessa === 'Sim, já processo';
    let next = step + 1;
    if (next === 7 && !jaProcessa) next = 9;
    if (next === 8 && !jaProcessa) next = 9;
    setStep(Math.min(next, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    const jaProcessa = form.jaProcessa === 'Sim, já processo';
    let prev = step - 1;
    if (prev === 8 && !jaProcessa) prev = 6;
    if (prev === 7 && !jaProcessa) prev = 6;
    setStep(Math.max(prev, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!validation.isValid) {
      setShowValidation(true);
      scrollToFirstError();
      return;
    }
    if (submitting) return; // double-click guard
    setSubmitting(true);

    try {
      const silentFlags = calculateSilentFlags(form, cnpjData);
      const declarativeScore = calculateLeadScore(form, silentFlags);

      // BDC full enrichment is done server-side in onLeadCreatedEnrich.
      // We only use the quick data (already loaded at CNPJ input) for client-side score preview.
      // This keeps the submit fast and resilient — NEVER block submission on BDC.
      const bdcResult = calculateBDCEnrichedScore(declarativeScore, bdcData, form.tpvMensal, form.segmento);
      const leadScore = bdcResult.finalScore;
      const proto = `PSM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

      const segmentLabel = SEGMENTS.find(s => s.id === form.segmento)?.label || form.segmento;
      const bizMap = {
        gateway: 'gateway', marketplace: 'marketplace', plataforma_vertical: 'plataformas_verticais',
        ecommerce: 'ecommerce', dropshipping: 'dropshipping', infoprodutos: 'infoprodutos',
        saas: 'saas', educacao: 'educacao', link_pagamento: 'link_pagamento', mpe: 'mpe'
      };

      const hasIntroducer = !!onboardingLink?.introducerId;
      const origemLead = hasIntroducer ? 'introducer' : 'questionario_completo';
      const cleanForm = sanitizeFormForSubmit(form);

      // Map lead qualifier level from score directly (robust)
      const scoreLabel = getScoreLabel(leadScore).label;
      const qualifierLevel =
        scoreLabel === 'Muito Quente' ? 'EXCELENTE' :
        scoreLabel === 'Quente' ? 'BOM' :
        scoreLabel === 'Morno' ? 'REGULAR' : 'FRACO';

      const leadCommonData = {
        email: form.email,
        fullName: form.razaoSocial || form.nomeFantasia || form.contactName,
        cpfCnpj: form.cnpj?.replace(/\D/g, ''),
        phone: form.phone,
        companyName: form.nomeFantasia || form.razaoSocial,
        contactName: form.contactName,
        contactRole: form.cargo === '__other__' ? form.cargoOutro : form.cargo,
        website: form.presencaDigital,
        status: 'questionario_preenchido',
        businessSubCategory: bizMap[form.segmento] || 'MERCHAN',
        tpvMensal: form.tpvMensal ? Number(form.tpvMensal) : undefined,
        ticketMedio: form.ticketMedio ? Number(form.ticketMedio) : undefined,
        transacoesMes: form.transacoesMes ? Number(form.transacoesMes) : undefined,
        expectativaCrescimento: form.crescimento,
        protocolo: proto,
        origemLead,
        onboardingLinkCode: linkCode || undefined,
        leadQualifierScore: leadScore,
        leadQualifierLevel: qualifierLevel,
        lastInteractionDate: new Date().toISOString(),
        bdcEnrichmentData: bdcData || null,
        bdcLeadScore: bdcResult.bdcScore,
        bdcScoreLevel: getBDCScoreLabel(bdcResult.finalScore).label,
        bdcFlags: bdcResult.activeFlags || [],
        bdcCrossValidation: bdcResult.crossValidation || null,
        bdcEnrichmentDate: bdcData ? new Date().toISOString() : undefined,
        questionnaireData: {
          origem: 'questionario_leads_pagsmile_v5',
          versao: '5.0',
          segmento: form.segmento,
          segmentoLabel: segmentLabel,
          ...cleanForm,
          _silentFlags: silentFlags,
          _declarativeScore: declarativeScore,
          _bdcScore: bdcResult.bdcScore,
          _leadScore: leadScore,
          _cnpjEnrichment: cnpjData || null,
        },
        expectedRates: {
          mdr1x: form.mdrAvista ? Number(form.mdrAvista) : undefined,
          mdr2a6x: form.mdr2a6x ? Number(form.mdr2a6x) : undefined,
          mdr7a12x: form.mdr7a12x ? Number(form.mdr7a12x) : undefined,
          antecipacao: form.taxaAntecipacao ? Number(form.taxaAntecipacao) : undefined,
          feeTransacao: form.feeTransacao ? Number(form.feeTransacao) : undefined,
          antifraude: form.custoAntifraude ? Number(form.custoAntifraude) : undefined,
          taxa3ds: form.taxa3ds ? Number(form.taxa3ds) : undefined,
          pix: form.taxaPix ? { tipo: 'percentual', valor: Number(form.taxaPix) } : undefined,
        },
      };

      const submitRes = await callPublicFunction('publicLeadSubmit', {
        kind: hasIntroducer ? 'introducer_lead' : 'lead',
        linkCode: linkCode || undefined,
        leadPayload: leadCommonData,
        introducerLeadPayload: hasIntroducer ? {
          email: leadCommonData.email,
          fullName: leadCommonData.fullName,
          cpfCnpj: leadCommonData.cpfCnpj,
          phone: leadCommonData.phone,
          companyName: leadCommonData.companyName,
          contactName: leadCommonData.contactName,
          contactRole: leadCommonData.contactRole,
          website: leadCommonData.website,
          businessSubCategory: leadCommonData.businessSubCategory,
          tpvMensal: leadCommonData.tpvMensal,
          ticketMedio: leadCommonData.ticketMedio,
          protocolo: proto,
          onboardingLinkCode: linkCode || '',
          questionnaireData: leadCommonData.questionnaireData,
          leadQualifierScore: leadScore,
          leadQualifierLevel: leadCommonData.leadQualifierLevel,
        } : undefined,
      });
      if (submitRes?.error) throw new Error(submitRes.error);

      // Analytics is non-critical — the SDK may block it on public routes.
      try {
        base44.analytics.track({
          eventName: 'onboarding_form_submitted',
          properties: {
            form_type: 'lead_pagsmile_v5',
            segment: form.segmento || '',
            has_introducer: !!onboardingLink?.introducerId,
            link_code: linkCode || '',
            protocolo: proto,
            lead_score: leadScore,
          }
        });
      } catch (_) { /* ignore analytics failures on public routes */ }

      clearDraft();
      setProtocolo(proto);
      setSubmitted(true);
    } catch (err) {
      const serverMessage = err?.response?.data?.error || err?.message || 'Erro desconhecido';
      toast.error(`Erro ao enviar: ${serverMessage}. Seu rascunho foi salvo, tente novamente.`);
      console.error('Submit error:', err);
      try {
        await callPublicFunction('logPublicClientError', {
          stage: 'questionario_leads_pagsmile_v5_submit',
          errorMessage: String(serverMessage).slice(0, 1500),
          componentStack: String(err?.stack || '').slice(0, 4000),
          userAgent: navigator.userAgent,
          url: window.location.href,
          extra: {
            segmento: form.segmento,
            cnpj: form.cnpj,
            hasIntroducer: !!onboardingLink?.introducerId,
            linkCode: linkCode || '',
          },
        });
      } catch (_) {}
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center rounded-2xl shadow-lg">
          <CardContent className="pt-10 pb-10 space-y-5">
            <div className="w-20 h-20 rounded-full bg-[#2bc196]/10 flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-[#2bc196]" />
            </div>
            <h2 className="text-2xl font-bold text-[#002443]">Questionário Enviado!</h2>
            <p className="text-sm text-[#002443]/60">
              Seu protocolo é <strong className="text-[#2bc196] text-lg">{protocolo}</strong>
            </p>
            <p className="text-sm text-[#002443]/60">Nossa equipe entrará em contato em breve com uma proposta personalizada.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = ((step + 1) / STEPS.length) * 100;
  const isLastStep = step === STEPS.length - 1;
  const nextDisabled = !validation.isValid;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png" 
          alt="Pagsmile" 
          className="h-8 mx-auto mb-4"
          style={{ filter: 'brightness(0) saturate(100%) invert(12%) sepia(36%) saturate(2476%) hue-rotate(183deg) brightness(91%) contrast(107%)' }}
        />
        <h1 className="text-2xl font-bold text-[#002443]">Questionário de Lead PagSmile</h1>
        <p className="text-sm text-[#002443]/50 mt-1">{STEPS.length} etapas · progresso salvo automaticamente</p>
      </div>

      {/* Draft recovery banner */}
      {recoverable && !submitted && (
        <DraftRecoveryBanner
          savedAt={recoverable.savedAt}
          onRestore={restoreDraft}
          onDiscard={() => { clearDraft(); discardRecoverable(); }}
        />
      )}

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2 gap-3 flex-wrap">
          <span className="text-xs font-bold text-[#002443]/50">
            Etapa {step + 1} de {STEPS.length}: {STEPS[step].label}
          </span>
          <StepProgressIndicator total={fieldCount.total} filled={fieldCount.filled} />
        </div>
        <div className="w-full h-2 bg-[#002443]/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#2bc196] to-[#5cf7cf] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Validation Summary */}
      {showValidation && (
        <ValidationSummary
          messages={validation.summary}
          totalFields={fieldCount.total}
          filledFields={fieldCount.filled}
        />
      )}

      {/* Step Content */}
      <Card className="rounded-2xl border border-[#002443]/5 shadow-sm mb-6">
        <CardContent className="p-6 sm:p-8">
          {step === 0 && <StepSegmento form={form} updateField={updateField} cnpjData={cnpjData} />}
          {step === 1 && <StepDadosEmpresa form={form} updateField={updateField} cnpjData={cnpjData} setCnpjData={setCnpjData} errors={errors} setBdcData={(d) => { setBdcData(d); updateField('_bdcQuickData', d); }} />}
          {step === 2 && <StepEndereco form={form} updateField={updateField} cnpjData={cnpjData} />}
          {step === 3 && <StepContato form={form} updateField={updateField} errors={errors} />}
          {step === 4 && <StepModeloNegocio form={form} updateField={updateField} errors={errors} />}
          {step === 5 && <StepVolumetria form={form} updateField={updateField} errors={errors} />}
          {step === 6 && <StepDistribuicao form={form} updateField={updateField} errors={errors} />}
          {step === 7 && <StepTaxasAtuais form={form} updateField={updateField} errors={errors} />}
          {step === 8 && <StepProcessadorAtual form={form} updateField={updateField} />}
          {step === 9 && <StepComplianceRisco form={form} updateField={updateField} errors={errors} />}
          {step === 10 && <StepFechamento form={form} updateField={updateField} errors={errors} />}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={step === 0}
          className="rounded-xl gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Anterior
        </Button>

        {isLastStep ? (
          <Button
            onClick={handleSubmit}
            disabled={submitting || nextDisabled}
            className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl gap-2 px-8 disabled:opacity-50"
            title={nextDisabled ? `Faltam ${validation.summary.length} campos obrigatórios` : ''}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : nextDisabled ? <Lock className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            {submitting ? 'Enviando...' : 'Enviar Questionário'}
          </Button>
        ) : (
          <Button
            onClick={nextStep}
            className="bg-[#002443] hover:bg-[#002443]/90 text-white rounded-xl gap-2 disabled:opacity-60"
            title={nextDisabled ? `Faltam ${validation.summary.length} campos obrigatórios` : ''}
          >
            {nextDisabled && <Lock className="w-3.5 h-3.5" />}
            Próximo <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Bottom hint */}
      {nextDisabled && showValidation && (
        <p className="text-center text-[10px] text-[#002443]/40 mt-4">
          💾 Seus dados estão sendo salvos automaticamente — você pode fechar e voltar depois
        </p>
      )}
    </div>
  );
}