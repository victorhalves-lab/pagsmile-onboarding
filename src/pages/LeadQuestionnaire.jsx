import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import LeadQuestionnaireForm from '@/components/leads/LeadQuestionnaireForm';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function LeadQuestionnaire() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const linkCode = urlParams.get('ref');
  const paramTemplateId = urlParams.get('templateId');

  // Buscar link de onboarding se existir (via public function)
  const { data: onboardingLink } = useQuery({
    queryKey: ['onboardingLink', linkCode],
    queryFn: async () => {
      if (!linkCode) return null;
      const res = await base44.functions.invoke('publicReadContext', { kind: 'onboarding_link', uniqueCode: linkCode });
      return res.data?.link || null;
    },
    enabled: !!linkCode
  });

  // Buscar template de lead ativo (via backend function)
  const { data: template, isLoading } = useQuery({
    queryKey: ['leadTemplate', onboardingLink?.questionnaireTemplateId, paramTemplateId],
    queryFn: async () => {
      // 1. Explicit templateId from URL
      if (paramTemplateId) {
        const res = await base44.functions.invoke('publicReadContext', { kind: 'questionnaire_template', id: paramTemplateId });
        if (res.data?.template) return res.data.template;
      }
      // 2. Template from onboardingLink
      if (onboardingLink?.questionnaireTemplateId) {
        const res = await base44.functions.invoke('publicReadContext', { kind: 'questionnaire_template', id: onboardingLink.questionnaireTemplateId });
        if (res.data?.template) return res.data.template;
      }
      // 3. Default full_lead_public template
      const res = await base44.functions.invoke('publicReadContext', { kind: 'questionnaire_template', model: 'full_lead_public' });
      return res.data?.template || null;
    }
  });

  // Buscar perguntas do template (via backend function)
  const { data: questions = [], isLoading: loadingQuestions } = useQuery({
    queryKey: ['leadQuestions', template?.id],
    queryFn: async () => {
      const res = await base44.functions.invoke('publicReadContext', { kind: 'questions_by_template', templateId: template.id });
      return res.data?.questions || [];
    },
    enabled: !!template?.id
  });

  const handleSubmit = async (leadData) => {
    // Incrementing submissionCount is now handled inside publicLeadSubmit
    navigate(`/LeadSuccess?protocolo=${leadData.protocolo}`);
  };

  if (isLoading || loadingQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--pinbank-blue)] mx-auto mb-4" />
          <p className="text-[var(--pinbank-blue)]/70">{t('lead_quest.loading')}</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-[var(--pinbank-blue)] mb-2">{t('lead_quest.not_available')}</h2>
          <p className="text-[var(--pinbank-blue)]/70">{t('lead_quest.no_active')}</p>
        </div>
      </div>
    );
  }

  // ── SAFETY NET: templates hardcoded (V5 e PIX V4) não usam entidade Question.
  // Se o usuário chegou aqui com um desses templates, redirecionar para a rota correta
  // preservando o ref. Isso evita leads-fantasma sem dados preenchidos.
  const tplModel = template.model || '';
  if (tplModel === 'LEAD_PIN_BANK_V5') {
    const qs = linkCode ? `?ref=${linkCode}` : '';
    window.location.replace(`/QuestionarioLeadsPagsmile${qs}`);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--pinbank-blue)]" />
      </div>
    );
  }
  if (tplModel === 'LEAD_PIX_V4') {
    const qs = linkCode ? `?ref=${linkCode}` : '';
    window.location.replace(`/LeadPixV4${qs}`);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[var(--pinbank-blue)]" />
      </div>
    );
  }

  // ── SAFETY NET 2: se o template não tem perguntas cadastradas (caso da V5/PIX V4 fora do redirect),
  // não renderizar um form vazio que só captura aceites. Mostrar erro explícito.
  if (!questions || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <h2 className="text-xl font-bold text-[var(--pinbank-blue)] mb-2">Questionário indisponível</h2>
          <p className="text-[var(--pinbank-blue)]/70 text-sm">
            Este questionário não está configurado corretamente. Por favor, entre em contato com quem enviou o link para receber um link atualizado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <LeadQuestionnaireForm 
      template={template}
      questions={questions}
      linkCode={linkCode}
      onboardingLink={onboardingLink}
      onSubmit={handleSubmit}
    />
  );
}