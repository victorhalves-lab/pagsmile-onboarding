import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, AlertTriangle } from 'lucide-react';
import DynamicQuestionnaire from '../components/compliance/DynamicQuestionnaire';
import MerchantTypeSelector from '../components/subseller/MerchantTypeSelector';

const SUBSELLER_CAF_URLS = {
  'Gateway': 'https://cadastro.io/9b998e4d45055dac959680cf3dcfc1c9',
  'Dropshipping': 'https://cadastro.io/11b31cdf4650c56126d766671e15e8d4',
  'E-commerce': 'https://cadastro.io/f97ba64b86ae1964ff85e0ad9e833d63',
  'Educação': 'https://cadastro.io/6b2852b7919ea3f65edca7667f81bf58',
  'Infoprodutos': 'https://cadastro.io/ede0e7c940889f03adbbf5f5a49400b9',
  'Link de Pagamento': 'https://cadastro.io/3ff25303e2a775e8aefa01575f4435fb',
  'MPE': 'https://cadastro.io/2df6ae66b394e25da18ae5acb2afc221',
  'Plataforma Vertical': 'https://cadastro.io/c970cf175a8facad0185d452edf39ccb',
  'SaaS / Recorrência': 'https://cadastro.io/597a5b430412b83fa526211e0e9beb7e',
  'Marketplace': 'https://cadastro.io/119c66a9c7f1e2618b20b3a41f656d3b',
};

export default function SubsellerQuestionnaire() {
  const [merchantType, setMerchantType] = useState(null); // null = show selector, 'PF' or 'PJ'
  const urlParams = new URLSearchParams(window.location.search);
  const linkCode = urlParams.get('ref');

  const { data: onboardingLink, isLoading } = useQuery({
    queryKey: ['subsellerLink', linkCode],
    queryFn: async () => {
      if (!linkCode) return null;
      const links = await base44.entities.OnboardingLink.filter({ uniqueCode: linkCode });
      return links[0] || null;
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

  // Step 2a: PF flow — uses subseller_pf template, uploads docs in-platform
  if (merchantType === 'PF') {
    return (
      <DynamicQuestionnaire
        templateModel="subseller_pf"
        storageKey="compliance_data_subseller_pf"
        documentUploadPage="DocumentUploadFull"
        flowType="subseller_pf"
        badgeLabel="SUBSELLER PF"
        badgeColor="bg-purple-100 text-purple-700"
        questionsPerStep={4}
        branding={branding}
        isPublicView={true}
      />
    );
  }

  // Step 2b: PJ flow — unchanged, uses subseller_v2 template + CAF redirect
  return (
    <DynamicQuestionnaire
      templateModel="subseller_v2"
      storageKey="compliance_data_subseller_v2"
      documentUploadPage="DocumentUploadFull"
      flowType="subseller"
      badgeLabel="SUBSELLER"
      badgeColor="bg-indigo-100 text-indigo-700"
      questionsPerStep={4}
      cafRedirectUrlMap={SUBSELLER_CAF_URLS}
      branding={branding}
      isPublicView={true}
    />
  );
}