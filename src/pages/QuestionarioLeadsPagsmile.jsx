import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Send, Check, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { calculateLeadScore, calculateSilentFlags, getScoreLabel, SEGMENTS } from '@/components/lead-pagsmile/pagsmileQuestionnaireData';

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

export default function QuestionarioLeadsPagsmile() {
  const urlParams = new URLSearchParams(window.location.search);
  const linkCode = urlParams.get('ref');

  const { data: onboardingLink } = useQuery({
    queryKey: ['onboardingLink', linkCode],
    queryFn: async () => {
      if (!linkCode) return null;
      const links = await base44.entities.OnboardingLink.filter({ uniqueCode: linkCode });
      return links[0] || null;
    },
    enabled: !!linkCode
  });

  const [step, setStep] = useState(0);
  const [form, setForm] = useState({});
  const [cnpjData, setCnpjData] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [protocolo, setProtocolo] = useState('');

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: false }));
  };

  // Validação por step
  const validateStep = () => {
    const errs = {};
    if (step === 0 && !form.segmento) { toast.error('Selecione o tipo de negócio'); return false; }
    if (step === 1) {
      if (!form.cnpj || form.cnpj.replace(/\D/g, '').length < 14) errs.cnpj = true;
      if (!form.nomeFantasia) errs.nomeFantasia = true;
    }
    if (step === 2) {
      if (!form._enderecoConfirmado) { toast.error('Confirme o endereço antes de prosseguir'); return false; }
    }
    if (step === 3) {
      if (!form.email) errs.email = true;
      if (!form.phone) errs.phone = true;
      if (!form.contactName) errs.contactName = true;
      if (!form.cargo && form.cargo !== '__other__') errs.cargo = true;
    }
    if (step === 4) {
      if (!form.modeloCobranca) { toast.error('Selecione o modelo de cobrança'); return false; }
      if (!form.descricaoNegocio) { toast.error('Descreva seu negócio'); return false; }
    }
    if (step === 5) {
      if (!form.tpvMensal) errs.tpvMensal = true;
      if (!form.ticketMedio) errs.ticketMedio = true;
      if (!form.faturamentoAnual) { toast.error('Selecione o faturamento anual'); return false; }
      if (!form.funcionarios) { toast.error('Selecione o número de funcionários'); return false; }
    }
    if (step === 6 && !form.jaProcessa) { toast.error('Informe se já processa pagamentos'); return false; }
    if (step === 9 && !form.encerrado) { toast.error('Informe se já foi encerrado'); return false; }
    if (step === 10) {
      if (!form.urgencia) { toast.error('Informe quando quer começar'); return false; }
      if (!form.crescimento) { toast.error('Informe a expectativa de crescimento'); return false; }
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error('Preencha os campos obrigatórios');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (!validateStep()) return;
    // Skip taxas/processador if not applicable
    const jaProcessa = form.jaProcessa === 'Sim, já processo';
    let next = step + 1;
    if (next === 7 && !jaProcessa) next = 9; // Skip taxas + processador
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
    if (!validateStep()) return;
    setSubmitting(true);

    const silentFlags = calculateSilentFlags(form, cnpjData);
    const leadScore = calculateLeadScore(form, silentFlags);
    const proto = `PSM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

    const segmentLabel = SEGMENTS.find(s => s.id === form.segmento)?.label || form.segmento;
    const bizMap = {
      gateway: 'GATEWAY', marketplace: 'MARKETPLACE', plataforma_vertical: 'GATEWAY',
      ecommerce: 'MERCHAN', dropshipping: 'MERCHAN', infoprodutos: 'MERCHAN',
      saas: 'MERCHAN', educacao: 'MERCHAN', link_pagamento: 'MERCHAN', mpe: 'MERCHAN'
    };

    // Buscar Introducer se existir
    let introducerData = {};
    if (onboardingLink?.introducerId) {
      const introducers = await base44.entities.Introducer.filter({ id: onboardingLink.introducerId });
      if (introducers.length > 0) {
        introducerData = {
          introducerId: introducers[0].id,
          introducerReferralCode: introducers[0].referralCode,
          introducerName: introducers[0].name,
        };
      }
    }

    await base44.entities.Lead.create({
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
      origemLead: linkCode ? `link_pagsmile_${linkCode}` : 'questionario_pagsmile_publico',
      onboardingLinkCode: linkCode || undefined,
      leadQualifierScore: leadScore,
      leadQualifierLevel: getScoreLabel(leadScore).label === 'Muito Quente' ? 'EXCELENTE' : getScoreLabel(leadScore).label === 'Quente' ? 'BOM' : getScoreLabel(leadScore).label === 'Morno' ? 'REGULAR' : 'FRACO',
      ...introducerData,
      commercialAgentId: onboardingLink?.commercialAgentId || undefined,
      commercialAgentName: onboardingLink?.commercialAgentName || undefined,
      lastInteractionDate: new Date().toISOString(),
      questionnaireData: {
        origem: 'questionario_leads_pagsmile_v5',
        versao: '5.0',
        segmento: form.segmento,
        segmentoLabel: segmentLabel,
        ...form,
        _silentFlags: silentFlags,
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
        pix: form.taxaPix ? { tipo: 'percentual', valor: Number(form.taxaPix) } : undefined,
      },
    });

    if (onboardingLink) {
      await base44.entities.OnboardingLink.update(onboardingLink.id, {
        submissionCount: (onboardingLink.submissionCount || 0) + 1
      });
    }

    setProtocolo(proto);
    setSubmitting(false);
    setSubmitted(true);
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

  return (
    <div className="max-w-3xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png" 
          alt="Pagsmile" 
          className="h-8 mx-auto mb-4 invert"
        />
        <h1 className="text-2xl font-bold text-[#002443]">Questionário de Lead PagSmile</h1>
        <p className="text-sm text-[#002443]/50 mt-1">{STEPS.length} etapas</p>
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
          <div
            className="h-full bg-gradient-to-r from-[#2bc196] to-[#5cf7cf] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step Content */}
      <Card className="rounded-2xl border border-[#002443]/5 shadow-sm mb-6">
        <CardContent className="p-6 sm:p-8">
          {step === 0 && <StepSegmento form={form} updateField={updateField} cnpjData={cnpjData} />}
          {step === 1 && <StepDadosEmpresa form={form} updateField={updateField} cnpjData={cnpjData} setCnpjData={setCnpjData} errors={errors} />}
          {step === 2 && <StepEndereco form={form} updateField={updateField} cnpjData={cnpjData} />}
          {step === 3 && <StepContato form={form} updateField={updateField} errors={errors} />}
          {step === 4 && <StepModeloNegocio form={form} updateField={updateField} errors={errors} />}
          {step === 5 && <StepVolumetria form={form} updateField={updateField} errors={errors} />}
          {step === 6 && <StepDistribuicao form={form} updateField={updateField} />}
          {step === 7 && <StepTaxasAtuais form={form} updateField={updateField} />}
          {step === 8 && <StepProcessadorAtual form={form} updateField={updateField} />}
          {step === 9 && <StepComplianceRisco form={form} updateField={updateField} />}
          {step === 10 && <StepFechamento form={form} updateField={updateField} />}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
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
            disabled={submitting}
            className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl gap-2 px-8"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Enviar Questionário
          </Button>
        ) : (
          <Button
            onClick={nextStep}
            className="bg-[#002443] hover:bg-[#002443]/90 text-white rounded-xl gap-2"
          >
            Próximo <ChevronRight className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}