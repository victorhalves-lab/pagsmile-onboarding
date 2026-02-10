import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Button } from '@/components/ui/button';
import { 
  Shield, Scan, Camera, FileText, Copy, CheckCircle2, 
  ExternalLink, Loader2, Link as LinkIcon
} from 'lucide-react';
import { toast } from 'sonner';

export default function IdentityVerificationModal({ 
  isOpen, 
  onClose, 
  caseId,
  flowType 
}) {
  const navigate = useNavigate();
  const [sessionId, setSessionId] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [verificationCompleted, setVerificationCompleted] = useState(false);

  useEffect(() => {
    if (isOpen && !sessionId) {
      const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
    }
  }, [isOpen]);

  // Listen for completion message from popup
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === 'LIVENESS_COMPLETED' && event.data?.sessionId === sessionId) {
        setVerificationCompleted(true);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [sessionId]);

  if (!isOpen) return null;

  const verificationLink = sessionId 
    ? `${window.location.origin}${createPageUrl('LivenessSimulation')}?sessionId=${sessionId}&caseId=${caseId || ''}`
    : '';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationLink);
    setLinkCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setLinkCopied(false), 3000);
  };

  const handleOpenSimulation = () => {
    window.open(verificationLink, '_blank', 'width=480,height=750');
  };

  const handleFinish = () => {
    onClose();
    navigate(createPageUrl('OnboardingCompletion') + (caseId ? `?caseId=${caseId}` : ''));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-sm" />

      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Progress Bar */}
        <div className="h-1.5 bg-slate-100">
          <div className={`h-full transition-all duration-700 ${verificationCompleted ? 'w-full bg-[#2bc196]' : 'w-1/4 bg-[#002443]'}`} />
        </div>

        {/* Step Label */}
        <p className="text-center text-sm text-[#002443]/50 mt-4 font-medium">
          {verificationCompleted ? 'Verificação Concluída!' : 'Verificação de Identidade'}
        </p>

        <div className="px-8 pb-8 pt-4">
          {!verificationCompleted ? (
            <>
              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div className="w-20 h-20 rounded-full bg-[#2bc196]/10 flex items-center justify-center">
                  <Shield className="w-10 h-10 text-[#2bc196]" />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-extrabold text-[#002443] text-center mb-2">
                Verificação de Identidade
              </h2>
              <p className="text-[#002443]/60 text-center text-sm mb-6 leading-relaxed">
                Para finalizar a verificação da sua conta, um link será enviado para o sócio principal realizar o teste de vivacidade e comparação facial.
              </p>

              {/* Steps */}
              <div className="bg-[#f8f9fa] rounded-2xl p-5 space-y-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#2bc196]/10 flex items-center justify-center shrink-0">
                    <Scan className="w-5 h-5 text-[#2bc196]" />
                  </div>
                  <span className="font-semibold text-[#002443] text-sm">Prova de Vida</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#2bc196]/10 flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5 text-[#2bc196]" />
                  </div>
                  <span className="font-semibold text-[#002443] text-sm">Tire uma Selfie</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#2bc196]/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-[#2bc196]" />
                  </div>
                  <span className="font-semibold text-[#002443] text-sm">Foto do Documento</span>
                </div>
              </div>

              {/* Link Area */}
              <div className="bg-[#002443]/5 rounded-xl p-3 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <LinkIcon className="w-4 h-4 text-[#002443]/50" />
                  <span className="text-xs font-semibold text-[#002443]/60 uppercase tracking-wider">Link de Verificação</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    readOnly 
                    value={verificationLink} 
                    className="flex-1 bg-white rounded-lg px-3 py-2 text-xs text-[#002443]/70 border border-slate-200 truncate"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyLink}
                    className="shrink-0 h-9 px-3"
                  >
                    {linkCopied ? <CheckCircle2 className="w-4 h-4 text-[#2bc196]" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Main CTA */}
              <Button 
                onClick={handleOpenSimulation}
                className="w-full h-14 bg-[#2bc196] hover:bg-[#2bc196]/90 text-white font-bold text-base rounded-2xl shadow-lg shadow-[#2bc196]/30"
              >
                Iniciar Verificação
              </Button>

              <p className="text-center text-xs text-[#002443]/40 mt-3">
                Modo Demonstração — A simulação abrirá em nova janela
              </p>
            </>
          ) : (
            <>
              {/* Completed State */}
              <div className="flex justify-center mb-5">
                <div className="w-20 h-20 rounded-full bg-[#2bc196]/10 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-[#2bc196]" />
                </div>
              </div>

              <h2 className="text-2xl font-extrabold text-[#2bc196] text-center mb-2">
                Verificação Concluída!
              </h2>
              <p className="text-[#002443]/60 text-center text-sm mb-6">
                Sua identidade foi verificada com sucesso.
              </p>

              <div className="bg-[#2bc196]/5 border border-[#2bc196]/20 rounded-2xl p-5 space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2bc196] shrink-0" />
                  <span className="font-semibold text-[#002443] text-sm">Prova de vida validada</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2bc196] shrink-0" />
                  <span className="font-semibold text-[#002443] text-sm">Comparação facial aprovada</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#2bc196] shrink-0" />
                  <span className="font-semibold text-[#002443] text-sm">Documento verificado</span>
                </div>
              </div>

              <Button 
                onClick={handleFinish}
                className="w-full h-14 bg-[#2bc196] hover:bg-[#2bc196]/90 text-white font-bold text-base rounded-2xl shadow-lg shadow-[#2bc196]/30"
              >
                Continuar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}