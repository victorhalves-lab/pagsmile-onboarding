import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { callPublicFunction } from '@/lib/publicApi';
import { Loader2, AlertTriangle } from 'lucide-react';
import DynamicQuestionnaire from '../components/compliance/DynamicQuestionnaire';
import MerchantTypeSelector from '../components/subseller/MerchantTypeSelector';

export default function SubsellerQuestionnaire() {
  const [merchantType, setMerchantType] = useState(null); // null = show selector, 'PF' or 'PJ'
  const urlParams = new URLSearchParams(window.location.search);
  const linkCode = urlParams.get('ref');

  const { data: onboardingLink, isLoading } = useQuery({
    queryKey: ['subsellerLink', linkCode],
    queryFn: async () => {
      if (!linkCode) return null;
      // SDK-free: rota pública. base44.functions.invoke falha com 401 em apps privadas.
      const res = await callPublicFunction('publicReadContext', { kind: 'onboarding_link', uniqueCode: linkCode });
      return res?.link || null;
    },
    enabled: !!linkCode,
    retry: 2,
  });

  useEffect(() => {
    if (linkCode) {
      localStorage.setItem('onboarding_link_code', linkCode);
    }
  }, [linkCode]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" />
      </div>
    );
  }

  const isExpired = onboardingLink?.expiresAt && new Date(onboardingLink.expiresAt) < new Date();
  const isInactive = onboardingLink && !onboardingLink.isActive;

  if (!linkCode || (onboardingLink && onboardingLink.linkType !== 'SUBSELLER_COMPLIANCE') || isExpired || isInactive) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center px-4">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-[var(--pagsmile-blue)] mb-2">Link inválido</h2>
        <p className="text-[var(--pagsmile-blue)]/70">Este link de onboarding não é válido ou expirou.</p>
      </div>
    );
  }

  // Extract branding from link
  const branding = onboardingLink?.brandName ? {
    name: onboardingLink.brandName,
    logoUrl: onboardingLink.brandLogoUrl,
    primaryColor: onboardingLink.brandPrimaryColor,
    secondaryColor: onboardingLink.brandSecondaryColor,
  } : null;

  // [V5.2 Fase 6.5.2] Trilho V5.2 — quando o link foi gerado com framework_version='v5.2',
  // o template já é o V5_2_DYNAMIC (template único dinâmico tier-aware). PF/PJ é o MESMO
  // template — o tier (subseller_pj/subseller_pf) é resolvido em runtime pela engine V5.2
  // a partir do merchantType escolhido + respostas. Mantém o `MerchantTypeSelector` para
  // a engine saber se ativa `cap_financial_capacity_validation_pf` ou `_pj`.
  const isV5_2Link = onboardingLink?.framework_version === 'v5.2';

  // Step 1: Show PF/PJ selector (mantido idêntico em ambos os trilhos)
  if (!merchantType) {
    return (
      <MerchantTypeSelector
        onSelect={setMerchantType}
        branding={branding}
      />
    );
  }

  // ── TRILHO V5.2 ──────────────────────────────────────────────────────
  // Template único (V5_2_DYNAMIC) já vinculado ao link via questionnaireTemplateId.
  // PF e PJ usam o MESMO templateId — diferencia internamente via merchantType.
  if (isV5_2Link) {
    // Persiste o merchantType selecionado para que a engine V5.2 saiba qual tier
    // resolver (subseller_pj vs subseller_pf) ao processar as respostas.
    try {
      localStorage.setItem('v5_2_subseller_merchant_type', merchantType);
    } catch {}

    const isPF = merchantType === 'PF';
    return (
      <DynamicQuestionnaire
        templateId={onboardingLink.questionnaireTemplateId}
        storageKey={isPF ? 'compliance_data_v5_2_subseller_pf' : 'compliance_data_v5_2_subseller_pj'}
        documentUploadPage="SubsellerDocUpload"
        flowType={isPF ? 'subseller_pf' : 'subseller'}
        badgeLabel={isPF ? 'SUBSELLER PF · V5.2' : 'SUBSELLER PJ · V5.2'}
        badgeColor="bg-[#2bc196]/15 text-[#2bc196] border border-[#2bc196]/30"
        questionsPerStep={4}
        branding={branding}
        isPublicView={true}
      />
    );
  }

  // ── TRILHO V4 SIMPLIFICADO ───────────────────────────────────────────
  // Versão enxuta: PF e PJ usam templates lite (subseller_pf_lite_v4 / subseller_pj_lite_v4).
  // PJ não tem mais a tela de "escolher segmento" — vira pergunta dentro do questionário.
  if (merchantType === 'PF') {
    return (
      <DynamicQuestionnaire
        templateModel="subseller_pf_lite_v4"
        storageKey="compliance_data_subseller_pf_lite_v4"
        documentUploadPage="SubsellerDocUpload"
        flowType="subseller_pf"
        badgeLabel="SUBSELLER PF"
        badgeColor="bg-purple-100 text-purple-700"
        questionsPerStep={4}
        branding={branding}
        isPublicView={true}
      />
    );
  }

  return (
    <DynamicQuestionnaire
      templateModel="subseller_pj_lite_v4"
      storageKey="compliance_data_subseller_pj_lite_v4"
      documentUploadPage="SubsellerDocUpload"
      flowType="subseller"
      badgeLabel="SUBSELLER"
      badgeColor="bg-indigo-100 text-indigo-700"
      questionsPerStep={4}
      branding={branding}
      isPublicView={true}
    />
  );
}