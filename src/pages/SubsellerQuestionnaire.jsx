import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, AlertTriangle } from 'lucide-react';
import DynamicQuestionnaire from '../components/compliance/DynamicQuestionnaire';
import MerchantTypeSelector from '../components/subseller/MerchantTypeSelector';
import SubsellerSegmentSelector from '../components/subseller/SubsellerSegmentSelector';

export default function SubsellerQuestionnaire() {
  const [merchantType, setMerchantType] = useState(null); // null = show selector, 'PF' or 'PJ'
  const [selectedSegment, setSelectedSegment] = useState(null); // PJ: segmento V4 escolhido
  const urlParams = new URLSearchParams(window.location.search);
  const linkCode = urlParams.get('ref');

  const { data: onboardingLink, isLoading } = useQuery({
    queryKey: ['subsellerLink', linkCode],
    queryFn: async () => {
      if (!linkCode) return null;
      const res = await base44.functions.invoke('publicReadContext', { kind: 'onboarding_link', uniqueCode: linkCode });
      return res.data?.link || null;
    },
    enabled: !!linkCode
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

  // Step 1: Show PF/PJ selector
  if (!merchantType) {
    return (
      <MerchantTypeSelector
        onSelect={setMerchantType}
        branding={branding}
      />
    );
  }

  // Step 2a: PF flow — uses subseller_pf template (BACEN-compliant, 55 perguntas)
  if (merchantType === 'PF') {
    return (
      <DynamicQuestionnaire
        templateModel="subseller_pf"
        storageKey="compliance_data_subseller_pf"
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

  // Step 2b: PJ flow — primeiro escolhe o segmento V4 (9 opções, sem PIX)
  if (merchantType === 'PJ' && !selectedSegment) {
    return (
      <SubsellerSegmentSelector
        onSelect={setSelectedSegment}
        onBack={() => setMerchantType(null)}
        branding={branding}
      />
    );
  }

  // Step 2c: PJ flow — carrega o template V4 do segmento escolhido (mesmo rigor que seller direto)
  return (
    <DynamicQuestionnaire
      templateModel={selectedSegment.model}
      storageKey={selectedSegment.storageKey}
      documentUploadPage="SubsellerDocUpload"
      flowType={`subseller_${selectedSegment.model}`}
      badgeLabel={`SUBSELLER • ${selectedSegment.title.toUpperCase()}`}
      badgeColor="bg-indigo-100 text-indigo-700"
      questionsPerStep={4}
      branding={branding}
      isPublicView={true}
    />
  );
}