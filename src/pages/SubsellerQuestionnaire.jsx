import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, AlertTriangle } from 'lucide-react';
import DynamicQuestionnaire from '../components/compliance/DynamicQuestionnaire';

export default function SubsellerQuestionnaire() {
  const urlParams = new URLSearchParams(window.location.search);
  const linkCode = urlParams.get('ref');

  // Fetch OnboardingLink to validate
  const { data: onboardingLink, isLoading } = useQuery({
    queryKey: ['subsellerLink', linkCode],
    queryFn: async () => {
      if (!linkCode) return null;
      const links = await base44.entities.OnboardingLink.filter({ uniqueCode: linkCode });
      return links[0] || null;
    },
    enabled: !!linkCode
  });

  // Store link code for session management
  React.useEffect(() => {
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

  return (
    <DynamicQuestionnaire
      templateModel="subseller_v2"
      storageKey="compliance_data_subseller_v2"
      documentUploadPage="DocumentUploadFull"
      flowType="subseller"
      badgeLabel="SUBSELLER"
      badgeColor="bg-indigo-100 text-indigo-700"
      questionsPerStep={4}
      cafRedirectUrl="https://cadastro.io/c584e022b7936e44b8bc5acdd3a7945e"
    />
  );
}