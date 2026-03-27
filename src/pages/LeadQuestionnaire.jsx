import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
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

  // Buscar link de onboarding se existir
  const { data: onboardingLink } = useQuery({
    queryKey: ['onboardingLink', linkCode],
    queryFn: async () => {
      if (!linkCode) return null;
      const links = await base44.entities.OnboardingLink.filter({ uniqueCode: linkCode });
      return links[0] || null;
    },
    enabled: !!linkCode
  });

  // Buscar template de lead ativo
  const { data: template, isLoading } = useQuery({
    queryKey: ['leadTemplate', onboardingLink?.questionnaireTemplateId],
    queryFn: async () => {
      if (paramTemplateId) {
        const templates = await base44.entities.QuestionnaireTemplate.filter({ id: paramTemplateId });
        if (templates[0]) return templates[0];
      }
      if (onboardingLink?.questionnaireTemplateId) {
        const templates = await base44.entities.QuestionnaireTemplate.filter({ 
          id: onboardingLink.questionnaireTemplateId 
        });
        if (templates[0]) return templates[0];
      }
      // Busca template de lead padrão ativo
      const templates = await base44.entities.QuestionnaireTemplate.filter({ 
        category: 'LEAD_GENERATION', 
        isActive: true 
      });
      // Prioriza o template completo caso existam múltiplos
      const fullTemplate = templates.find(t => t.model === 'full_lead_public');
      return fullTemplate || templates[0] || null;
    }
  });

  // Buscar perguntas do template
  const { data: questions = [], isLoading: loadingQuestions } = useQuery({
    queryKey: ['leadQuestions', template?.id],
    queryFn: () => base44.entities.Question.filter(
      { questionnaireTemplateId: template.id },
      'order'
    ),
    enabled: !!template?.id
  });

  const handleSubmit = async (leadData) => {
    // Incrementar contagem de submissões do link
    if (onboardingLink) {
      await base44.entities.OnboardingLink.update(onboardingLink.id, {
        submissionCount: (onboardingLink.submissionCount || 0) + 1
      });
    }

    navigate(createPageUrl('LeadSuccess') + `?protocolo=${leadData.protocolo}`);
  };

  if (isLoading || loadingQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[var(--pagsmile-green)] mx-auto mb-4" />
          <p className="text-[var(--pagsmile-blue)]/70">{t('lead_quest.loading')}</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-[var(--pagsmile-blue)] mb-2">{t('lead_quest.not_available')}</h2>
          <p className="text-[var(--pagsmile-blue)]/70">{t('lead_quest.no_active')}</p>
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