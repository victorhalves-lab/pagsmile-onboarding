import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, FileText, ShieldCheck, ArrowRight, Mail, Loader2, Clock } from 'lucide-react';
import { callPublicFunction } from '@/lib/publicApi';
import { toast } from 'sonner';

/**
 * Tela "ponte" entre o questionário e o upload de documentos.
 *
 * Substitui a transição silenciosa anterior (navigate direto), garantindo que
 * o cliente entenda:
 *   1. O questionário foi recebido com sucesso.
 *   2. AINDA FALTA a Etapa 2 (documentos + CAF) — sem ela, NÃO há aprovação.
 *   3. Pode continuar agora OU receber um link por email para retomar depois.
 *
 * Regra de governança: nenhum subseller pode "esquecer" da Etapa 2.
 * Se escolher continuar depois, o link de retomada é enviado por email e
 * o caso fica em "Em Processamento" (segurado pelo Doc Gate em autoEnrichOnboarding).
 */
export default function QuestionnaireToDocsBridge({
  onContinueNow,
  resumeUrl,
  clientEmail,
  clientName,
  branding,
}) {
  const [isSendingResume, setIsSendingResume] = useState(false);
  const [resumeSent, setResumeSent] = useState(false);

  const bPrimary = branding?.primaryColor || '#1356E2';
  const bSecondary = branding?.secondaryColor || '#0A0A0A';
  const hasBranding = !!branding?.name;

  const handleSendResume = async () => {
    if (!clientEmail) {
      toast.error('Não foi possível identificar seu e-mail. Use "Continuar agora" para finalizar.');
      return;
    }
    setIsSendingResume(true);
    try {
      const res = await callPublicFunction('emailComplianceResumeLink', {
        toEmail: clientEmail,
        toName: clientName || '',
        resumeUrl: resumeUrl || window.location.href,
        brandName: branding?.name || 'Pin Bank',
      });
      if (res?.ok) {
        setResumeSent(true);
        toast.success('Link enviado para seu e-mail!');
      } else {
        toast.error('Não foi possível enviar o link. Tente novamente ou continue agora.');
      }
    } catch (e) {
      toast.error('Erro ao enviar o link. Tente novamente ou continue agora.');
    } finally {
      setIsSendingResume(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      {/* Confirmação */}
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
          style={{ backgroundColor: bPrimary + '20' }}
        >
          <CheckCircle2 className="w-8 h-8" style={{ color: bPrimary }} />
        </div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: bSecondary }}>
          Questionário recebido!
        </h1>
        <p className="text-sm" style={{ color: bSecondary, opacity: 0.7 }}>
          Suas respostas foram salvas com segurança. Falta apenas mais 1 etapa.
        </p>
      </div>

      {/* Card de próximo passo */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm mb-6">
        <div className="flex items-start gap-4 mb-6">
          <div
            className="p-3 rounded-xl flex-shrink-0"
            style={{ backgroundColor: bPrimary + '15' }}
          >
            <FileText className="w-6 h-6" style={{ color: bPrimary }} />
          </div>
          <div>
            <div
              className="inline-block px-2 py-0.5 rounded text-[10px] font-bold tracking-wide mb-2"
              style={{ backgroundColor: bSecondary + '15', color: bSecondary }}
            >
              ETAPA 2 DE 2 — OBRIGATÓRIA
            </div>
            <h2 className="text-lg font-bold mb-1" style={{ color: bSecondary }}>
              Envio de documentos e verificação de identidade
            </h2>
            <p className="text-sm" style={{ color: bSecondary, opacity: 0.7 }}>
              Para concluir seu cadastro, precisamos:
            </p>
            <ul className="mt-3 space-y-1.5 text-sm" style={{ color: bSecondary, opacity: 0.85 }}>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: bPrimary }} />
                Documentos KYC/KYB (contrato social, comprovante, etc.)
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: bPrimary }} />
                Selfie + documento com IA (CAF — 2 minutos)
              </li>
            </ul>
          </div>
        </div>

        {/* Aviso importante */}
        <div
          className="rounded-xl p-3.5 mb-6 border"
          style={{
            backgroundColor: bSecondary + '08',
            borderColor: bSecondary + '20',
          }}
        >
          <p className="text-xs leading-relaxed" style={{ color: bSecondary, opacity: 0.85 }}>
            <strong>Sem completar esta etapa, seu cadastro não será aprovado.</strong>{' '}
            O tempo médio é de 5 minutos. Tenha em mãos seus documentos digitalizados.
          </p>
        </div>

        {/* Ações */}
        <Button
          onClick={onContinueNow}
          className="w-full h-12 rounded-xl text-white font-semibold text-base shadow-lg transition-all hover:scale-[1.01] mb-3"
          style={{
            backgroundColor: bPrimary,
            boxShadow: `0 10px 15px -3px ${bPrimary}33`,
          }}
        >
          Continuar agora
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        {!resumeSent ? (
          <Button
            variant="outline"
            onClick={handleSendResume}
            disabled={isSendingResume || !clientEmail}
            className="w-full h-11 rounded-xl border-slate-200 hover:bg-slate-50"
            style={{ color: bSecondary }}
          >
            {isSendingResume ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Salvar e continuar depois
              </>
            )}
          </Button>
        ) : (
          <div
            className="w-full h-11 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium"
            style={{
              backgroundColor: bPrimary + '12',
              borderColor: bPrimary + '40',
              color: bPrimary,
            }}
          >
            <CheckCircle2 className="w-4 h-4" />
            Link de retomada enviado para {clientEmail}
          </div>
        )}

        {clientEmail && !resumeSent && (
          <p className="text-[11px] text-center mt-3" style={{ color: bSecondary, opacity: 0.5 }}>
            <Clock className="w-3 h-3 inline mr-1" />
            Enviaremos um link para <strong>{clientEmail}</strong> que você poderá usar a qualquer momento.
          </p>
        )}
      </div>

      {/* Footer */}
      <p
        className="text-xs text-center flex items-center justify-center gap-1"
        style={{ color: bSecondary, opacity: 0.4 }}
      >
        <ShieldCheck className="w-3 h-3" />
        Seus dados estão protegidos e serão tratados com confidencialidade.
      </p>
    </div>
  );
}