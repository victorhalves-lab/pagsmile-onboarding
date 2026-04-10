import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

/**
 * Esta página agora redireciona para o fluxo real de compliance.
 * A verificação CAF (DocumentDetector + FaceLiveness) é integrada
 * diretamente no DynamicDocumentUploadPage — não existe mais fluxo separado.
 */
export default function LivenessFacematchStep() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to the completion page — CAF is now integrated in the document upload flow
    navigate('/OnboardingCompletion', { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2bc196] mx-auto mb-4" />
        <p className="text-[#002443]/60 text-sm">Redirecionando...</p>
      </div>
    </div>
  );
}