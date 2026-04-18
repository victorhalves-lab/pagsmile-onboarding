import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function SlugRedirect() {
  const { slug } = useParams();

  const { data: link, isLoading, isError } = useQuery({
    queryKey: ['slugRedirect', slug],
    queryFn: async () => {
      const res = await base44.functions.invoke('publicReadContext', {
        kind: 'onboarding_link_by_slug', slug,
      });
      return res.data?.link || null;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" />
      </div>
    );
  }

  if (!link) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center px-4">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-[#002443] mb-2">Link não encontrado</h2>
        <p className="text-[#002443]/70">Este link não existe ou foi removido.</p>
      </div>
    );
  }

  // Redirect to appropriate page based on link type
  if (link.linkType === 'SUBSELLER_COMPLIANCE') {
    return <Navigate to={`/SubsellerQuestionnaire?ref=${link.uniqueCode}`} replace />;
  }

  if (link.linkType === 'LEAD_QUESTIONNAIRE') {
    return <Navigate to={`/ComplianceDinamico?ref=${link.uniqueCode}`} replace />;
  }

  if (link.linkType === 'LEAD_SIMPLIFICADO') {
    return <Navigate to={`/QuestionarioSimplificadoPublico?ref=${link.uniqueCode}`} replace />;
  }

  // Fallback — redirect with ref param
  return <Navigate to={`/SubsellerQuestionnaire?ref=${link.uniqueCode}`} replace />;
}