import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Smartphone, Mail, X, CheckCircle2, Loader2, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { callPublicFunction } from '@/lib/publicApi';

/**
 * Botão + modal que permite ao cliente continuar o cadastro em outro dispositivo
 * (tipicamente: começou no desktop, precisa da câmera no celular).
 *
 * Tudo o que ele já preencheu (respostas + documentos enviados + etapa atual)
 * está salvo na ComplianceSession server-side. Só precisamos transportar o
 * sessionToken pro outro device.
 *
 * Estratégia dupla:
 *   - QR code: cliente aponta a câmera do celular → cai direto na sessão
 *   - E-mail: envia link de retomada caso queira continuar depois
 */
export default function ContinueOnMobileButton({ resumeUrl, prefilledEmail = '' }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(prefilledEmail);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [copied, setCopied] = useState(false);

  // Don't render if there's no resume URL yet (session still loading)
  if (!resumeUrl) return null;

  const handleSendEmail = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Informe um e-mail válido.');
      return;
    }
    setSending(true);
    try {
      const res = await callPublicFunction('emailComplianceResumeLink', {
        toEmail: email,
        resumeUrl,
        brandName: 'Pin Bank',
      });
      if (res?.ok) {
        setSent(true);
        toast.success('Link enviado! Verifique sua caixa de entrada.');
      } else {
        toast.error('Não foi possível enviar o e-mail. Tente o QR code ou copie o link.');
      }
    } catch (e) {
      toast.error('Erro ao enviar e-mail. Use o QR code ou copie o link.');
    } finally {
      setSending(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(resumeUrl);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error('Não foi possível copiar. Selecione o link manualmente.');
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold transition-colors"
        type="button"
      >
        <Smartphone className="w-3.5 h-3.5" />
        Continuar no celular
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#1356E2]" />
                <h3 className="text-base font-bold text-[#0A0A0A]">Continuar em outro dispositivo</h3>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100"
                type="button"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <p className="text-sm text-[#0A0A0A]/70">
                Seus dados e documentos enviados <strong>já estão salvos</strong>. Escolha como retomar em outro aparelho:
              </p>

              {/* QR code */}
              <div className="bg-slate-50 rounded-xl p-5 text-center">
                <p className="text-xs font-semibold text-[#0A0A0A] mb-3">
                  📱 Aponte a câmera do celular para o QR code
                </p>
                <div className="inline-block bg-white p-3 rounded-xl border border-slate-200">
                  <QRCodeSVG value={resumeUrl} size={180} level="M" />
                </div>
                <p className="text-[11px] text-[#0A0A0A]/50 mt-3">
                  Você cai exatamente onde parou, com tudo preenchido.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">ou</span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* E-mail */}
              <div>
                <p className="text-xs font-semibold text-[#0A0A0A] mb-2 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  Receba o link por e-mail
                </p>
                {sent ? (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span>Link enviado para <strong>{email}</strong>. Verifique sua caixa.</span>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={sending}
                      className="text-sm"
                    />
                    <Button
                      onClick={handleSendEmail}
                      disabled={sending || !email}
                      className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white text-xs px-4"
                    >
                      {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Enviar'}
                    </Button>
                  </div>
                )}
              </div>

              {/* Copy link fallback */}
              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-xs font-medium text-[#0A0A0A]/70 transition-colors"
                  type="button"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      Link copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copiar link de retomada
                    </>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-[#0A0A0A]/50 text-center leading-relaxed">
                🔒 O link é único, expira após você concluir o cadastro e só você consegue retomar de onde parou.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}