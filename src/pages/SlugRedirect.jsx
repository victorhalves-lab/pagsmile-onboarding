import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { callPublicFunction } from '@/lib/publicApi';
import { Loader2, AlertTriangle } from 'lucide-react';

export default function SlugRedirect() {
  const { slug } = useParams();

  const { data: link, isLoading, isError } = useQuery({
    queryKey: ['slugRedirect', slug],
    queryFn: async () => {
      // SDK-free: rota pública. base44.functions.invoke falha com 401 em apps privadas.
      const res = await callPublicFunction('publicReadContext', {
        kind: 'onboarding_link_by_slug', slug,
      });
      return res?.link || null;
    },
    enabled: !!slug,
    retry: 2,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#1356E2]" />
      </div>
    );
  }

  if (!link) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center px-4">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-[#0A0A0A] mb-2">Link não encontrado</h2>
        <p className="text-[#0A0A0A]/70">Este link não existe ou foi removido.</p>
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