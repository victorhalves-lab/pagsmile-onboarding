import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Send, Check, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { toast } from 'sonner';

import StepTipoNegocio from '@/components/lead-pix-v4/StepTipoNegocio';
import StepDadosEmpresa from '@/components/lead-pix-v4/StepDadosEmpresa';
import StepContato from '@/components/lead-pix-v4/StepContato';
import StepModeloNegocio from '@/components/lead-pix-v4/StepModeloNegocio';
import StepVolumePix from '@/components/lead-pix-v4/StepVolumePix';
import StepSituacaoAtual from '@/components/lead-pix-v4/StepSituacaoAtual';
import StepServicosComplementar from '@/components/lead-pix-v4/StepServicosComplementar';
import { calculatePixSilentFlags, calculatePixLeadScore, getPixScoreLabel } from '@/components/lead-pix-v4/pixQuestionnaireData';
import { calculateBDCEnrichedScore, getBDCScoreLabel } from '@/components/lead-scoring/bdcLeadScoring';

const STEPS = [
  { id: 'tipo', label: 'Tipo de Negócio' },
  { id: 'empresa', label: 'Dados da Empresa' },
  { id: 'contato', label: 'Contato' },
  { id: 'modelo', label: 'Modelo de Negócio' },
  { id: 'volume', label: 'Volume PIX' },
  { id: 'situacao', label: 'Situação Atual' },
  { id: 'servicos', label: 'Serviços & Fechamento' },
];

export default function LeadPixV4() {
  const urlParams = new URLSearchParams(window.location.search);
  const linkCode = urlParams.get('ref');

  const { data: onboardingLink } = useQuery({
    queryKey: ['onboardingLink-pix-v4', linkCode],
    queryFn: async () => {
      if (!linkCode) return null;
      const res = await base44.functions.invoke('publicReadContext', { kind: 'onboarding_link', uniqueCode: linkCode });
      return res.data?.link || null;
    },
    enabled: !!linkCode,
  });

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({});
  const [cnpjData, setCnpjData] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [protocolo, setProtocolo] = useState('');
  const [bdcData, setBdcData] = useState(null);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: false }));
  };

  const validateStep = () => {
    const errs = {};
    if (step === 0 && !form.tipoNegocio) { toast.error('Selecione o tipo de negócio'); return false; }
    if (step === 1) {
      if (!form.cnpj || form.cnpj.replace(/\D/g, '').length < 14) errs.cnpj = true;
      if (!form.nomeFantasia) errs.nomeFantasia = true;
    }
    if (step === 2) {
      if (!form.email) errs.email = true;
      if (!form.phone) errs.phone = true;
      if (!form.contactName) errs.contactName = true;
    }
    if (step === 3) {
      if (!form.segmentoPix) { toast.error('Selecione o segmento'); return false; }
      if (!form.modeloCobrancaPix) { toast.error('Selecione o modelo de cobrança PIX'); return false; }
      if (!form.descricaoNegocio) { toast.error('Descreva seu negócio'); return false; }
      if (!form.finalidadeConta) { toast.error('Selecione a finalidade da conta'); return false; }
    }
    if (step === 4) {
      if (!form.tpvPix) errs.tpvPix = true;
      if (!form.ticketMedioPix) errs.ticketMedioPix = true;
      if (!form.horarioPix) { toast.error('Selecione o horário principal'); return false; }
    }
    if (step === 5) {
      if (!form.parceiroPix) { toast.error('Informe o parceiro atual ou "Primeiro"'); return false; }
      if (!form.tempoUso) { toast.error('Selecione o tempo de uso'); return false; }
      if (!form.custoPix) { toast.error('Selecione o custo PIX atual'); return false; }
      if (!form.motivoBusca) { toast.error('Selecione o motivo'); return false; }
      if (form.contaEncerrada === undefined || form.contaEncerrada === null) { toast.error('Informe se já teve conta encerrada'); return false; }
    }
    if (step === 6) {
      if (!form.servicosPix || form.servicosPix.length === 0) { toast.error('Selecione ao menos um serviço PIX'); return false; }
      if (!form.urgencia) { toast.error('Selecione a urgência'); return false; }
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      const currencyFields = ['tpvPix', 'ticketMedioPix'];
      const failedCurrencyFields = Object.keys(errs).filter(f => currencyFields.includes(f));
      if (failedCurrencyFields.length > 0) {
        base44.analytics.track({
          eventName: 'currency_input_validation_error',
          properties: {
            form_type: 'lead_pix_v4',
            step: step,
            step_label: STEPS[step]?.label || '',
            failed_fields: failedCurrencyFields.join(','),
            field_count: failedCurrencyFields.length,
          }
        });
      }
      toast.error('Preencha os campos obrigatórios');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    setStep(Math.min(step + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prevStep = () => {
    setStep(Math.max(step - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);

    try {
    const silentFlags = calculatePixSilentFlags(form, cnpjData);
    const declarativeScore = calculatePixLeadScore(form, cnpjData, silentFlags);

    // BDC enriched scoring
    let bdcFullData = bdcData;
    if (bdcData && form.cnpj) {
      // Try full enrichment on submit
      try {
        const fullResp = await base44.functions.invoke('bdcEnrichLead', { cnpj: form.cnpj.replace(/\D/g, ''), level: 'full' });
        if (fullResp.data?.success) bdcFullData = fullResp.data;
      } catch (e) { console.warn('BDC full enrichment failed:', e.message); }
    }
    const bdcResult = calculateBDCEnrichedScore(declarativeScore, bdcFullData, form.tpvPix, form.segmentoPix);
    const leadScore = bdcResult.finalScore;
    const scoreLabel = getPixScoreLabel(leadScore);
    const proto = `PIX4-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

    const bizMap = {
      'Gateway/PSP': 'GATEWAY', 'Marketplace': 'MARKETPLACE', 'Plataforma Vertical': 'GATEWAY',
    };

    // Introducer + commercial agent resolved server-side by publicLeadSubmit
    const complianceTemplate = form.tipoNegocio === 'merchant' ? 'PIX_Merchants_v4' : 'PIX_Intermediarios_v4';

    const leadPayload = {
      email: form.email,
      fullName: form.razaoSocial || form.nomeFantasia || form.contactName,
      cpfCnpj: form.cnpj?.replace(/\D/g, ''),
      phone: form.phone,
      companyName: form.nomeFantasia || form.razaoSocial,
      contactName: form.contactName,
      contactRole: form.cargo === 'Outro' ? form.cargoOutro : form.cargo,
      website: form.presencaDigital,
      status: 'questionario_preenchido',
      businessSubCategory: bizMap[form.segmentoPix] || 'MERCHAN',
      tpvMensal: form.tpvPix ? Number(form.tpvPix) : undefined,
      ticketMedio: form.ticketMedioPix ? Number(form.ticketMedioPix) : undefined,
      transacoesMes: form.transacoesPix ? Number(form.transacoesPix) : undefined,
      protocolo: proto,
      origemLead: linkCode ? `lead_pix_v4_${linkCode}` : 'questionario_pix_v4_publico',
      onboardingLinkCode: linkCode || undefined,
      leadQualifierScore: leadScore,
      leadQualifierLevel: scoreLabel.label === 'Muito Quente' ? 'EXCELENTE' : scoreLabel.label === 'Quente' ? 'BOM' : scoreLabel.label === 'Morno' ? 'REGULAR' : 'FRACO',
      lastInteractionDate: new Date().toISOString(),
      bdcEnrichmentData: bdcFullData || bdcData || null,
      bdcLeadScore: bdcResult.bdcScore,
      bdcScoreLevel: getBDCScoreLabel(bdcResult.finalScore).label,
      bdcFlags: bdcResult.activeFlags || [],
      bdcCrossValidation: bdcResult.crossValidation || null,
      bdcEnrichmentDate: bdcFullData ? new Date().toISOString() : undefined,
      questionnaireData: {
        origem: 'questionario_lead_pix_v4',
        versao: '4.0',
        ...form,
        _silentFlags: silentFlags,
        _declarativeScore: declarativeScore,
        _bdcScore: bdcResult.bdcScore,
        _leadScore: leadScore,
        _cnpjEnrichment: cnpjData || null,
        _bdcEnrichment: bdcFullData || bdcData || null,
        _tipoNegocio: form.tipoNegocio,
        _segmentoSelecionado: form.segmentoPix,
        _questionarioCompliancePix: complianceTemplate,
        _emailType: form.email ? (form.email.split('@')[1]?.toLowerCase() && ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'].includes(form.email.split('@')[1]?.toLowerCase()) ? 'personal' : 'corporate') : null,
      },
    };

    const submitRes = await base44.functions.invoke('publicLeadSubmit', {
      kind: 'lead',
      linkCode: linkCode || undefined,
      leadPayload,
    });
    if (submitRes.data?.error) throw new Error(submitRes.data.error);

    base44.analytics.track({
      eventName: 'onboarding_form_submitted',
      properties: {
        form_type: 'lead_pix_v4',
        segment: form.segmentoPix || '',
        tipo_negocio: form.tipoNegocio || '',
        has_introducer: !!onboardingLink?.introducerId,
        link_code: linkCode || '',
        protocolo: proto,
        lead_score: leadScore,
      }
    });

    setProtocolo(proto);
    setSubmitted(true);
    } catch (err) {
      console.error('Submit error:', err);
      toast.error('Erro ao enviar questionário. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center rounded-2xl shadow-lg">
          <CardContent className="pt-10 pb-10 space-y-5">
            <div className="w-20 h-20 rounded-full bg-[#2bc196]/10 flex items-center justify-center mx-auto">
              <Check className="w-10 h-10 text-[#2bc196]" />
            </div>
            <h2 className="text-2xl font-bold text-[#002443]">Questionário PIX Enviado!</h2>
            <p className="text-sm text-[#002443]/60">
              Seu protocolo é <strong className="text-[#2bc196] text-lg">{protocolo}</strong>
            </p>
            <p className="text-sm text-[#002443]/60">Nossa equipe entrará em contato em breve com uma proposta PIX personalizada.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progress = ((step + 1) / STEPS.length) * 100;
  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png"
          alt="Pagsmile"
          className="h-8 mx-auto mb-4 invert"
        />
        <div className="flex items-center justify-center gap-2 mb-2">
          <Zap className="w-6 h-6 text-[#2bc196]" />
          <h1 className="text-2xl font-bold text-[#002443]">Questionário Lead PIX v4.0</h1>
        </div>
        <p className="text-sm text-[#002443]/50">{STEPS.length} etapas • Autocomplete CNPJ • 11 flags • Score 0-100</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#002443]/50">
            Etapa {step + 1} de {STEPS.length}: {STEPS[step].label}
          </span>
          <span className="text-xs font-bold text-[#2bc196]">{Math.round(progress)}%</span>
        </div>
        <div className="w-full h-2 bg-[#002443]/5 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#2bc196] to-[#5cf7cf] rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Step Content */}
      <Card className="rounded-2xl border border-[#002443]/5 shadow-sm mb-6">
        <CardContent className="p-6 sm:p-8">
          {step === 0 && <StepTipoNegocio form={form} updateField={updateField} />}
          {step === 1 && <StepDadosEmpresa form={form} updateField={updateField} cnpjData={cnpjData} setCnpjData={setCnpjData} errors={errors} setBdcData={(d) => { setBdcData(d); updateField('_bdcQuickData', d); }} />}
          {step === 2 && <StepContato form={form} updateField={updateField} errors={errors} />}
          {step === 3 && <StepModeloNegocio form={form} updateField={updateField} errors={errors} />}
          {step === 4 && <StepVolumePix form={form} updateField={updateField} errors={errors} />}
          {step === 5 && <StepSituacaoAtual form={form} updateField={updateField} />}
          {step === 6 && <StepServicosComplementar form={form} updateField={updateField} />}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={prevStep} disabled={step === 0} className="rounded-xl gap-2">
          <ChevronLeft className="w-4 h-4" /> Anterior
        </Button>
        {isLastStep ? (
          <Button onClick={handleSubmit} disabled={submitting} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl gap-2 px-8">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar Questionário
          </Button>
        ) : (
          <Button onClick={nextStep} className="bg-[#002443] hover:bg-[#002443]/90 text-white rounded-xl gap-2">
            Próximo <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}