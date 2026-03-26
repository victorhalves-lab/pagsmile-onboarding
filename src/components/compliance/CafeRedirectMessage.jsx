import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Copy, ExternalLink, FileText, ScanFace, Shield, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CafeRedirectMessage({ redirectUrl, onConfirmCompletion, isCompleting }) {
  const [linkCopied, setLinkCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(redirectUrl);
      setLinkCopied(true);
      toast.success('Link copiado com sucesso!');
      setTimeout(() => setLinkCopied(false), 3000);
    } catch {
      toast.error('Não foi possível copiar o link. Copie manualmente.');
    }
  };

  const handleConfirmAndFinish = () => {
    if (!confirmed) {
      toast.error('Confirme que você concluiu o envio de documentos e verificação na CAF antes de finalizar.');
      return;
    }
    onConfirmCompletion();
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/9bd38c4f7_Logo-modo-claro.png" 
          alt="Pagsmile" 
          className="h-7 mx-auto mb-6"
        />
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#2bc196]/15 mb-4">
          <CheckCircle2 className="w-9 h-9 text-[#2bc196]" />
        </div>
        <h1 className="text-2xl font-bold text-[#002443] mb-2">
          Questionário Enviado com Sucesso!
        </h1>
        <p className="text-[#002443]/60 text-sm max-w-md mx-auto">
          Suas respostas foram salvas. Agora é necessário realizar a verificação de documentos, liveness e face match pela plataforma da CAF.
        </p>
      </div>

      {/* Etapas explicativas */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 mb-6">
        <h2 className="text-sm font-bold text-[#002443] uppercase tracking-wide mb-4">
          Próximos passos na CAF
        </h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-50 shrink-0">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#002443]">Upload de Documentos</p>
              <p className="text-xs text-[#002443]/50">Envie os documentos solicitados pela plataforma.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-50 shrink-0">
              <ScanFace className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#002443]">Liveness & Face Match</p>
              <p className="text-xs text-[#002443]/50">Realize a prova de vida e verificação facial.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Link da CAF */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-6">
        <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Link para verificação na CAF
        </h3>
        <div className="flex items-center gap-2 bg-white rounded-xl border border-amber-200 p-3 mb-4">
          <input
            type="text"
            readOnly
            value={redirectUrl}
            className="flex-1 text-xs text-[#002443]/70 bg-transparent outline-none truncate"
          />
          <Button
            size="sm"
            variant={linkCopied ? "default" : "outline"}
            onClick={handleCopyLink}
            className={linkCopied
              ? "bg-[#2bc196] hover:bg-[#2bc196]/90 text-white shrink-0"
              : "border-amber-300 text-amber-700 hover:bg-amber-100 shrink-0"
            }
          >
            {linkCopied ? <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
            {linkCopied ? 'Copiado!' : 'Copiar'}
          </Button>
        </div>
        <a
          href={redirectUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-[1.02] shadow-md text-sm"
        >
          Acessar Plataforma CAF
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Confirmação de conclusão */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-sm font-bold text-[#002443] mb-3">
          Já concluiu o processo na CAF?
        </h3>
        <p className="text-xs text-[#002443]/50 mb-4">
          Após enviar todos os documentos e concluir o liveness/face match na plataforma da CAF, confirme abaixo para finalizar seu processo de compliance.
        </p>

        <label className="flex items-start gap-3 cursor-pointer mb-5 p-3 rounded-xl border border-slate-200 hover:border-[#2bc196]/40 hover:bg-[#2bc196]/5 transition-all">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#2bc196] focus:ring-[#2bc196] accent-[#2bc196]"
          />
          <span className="text-sm text-[#002443]">
            Confirmo que já realizei o envio de documentos, liveness e face match na plataforma da CAF.
          </span>
        </label>

        <Button
          onClick={handleConfirmAndFinish}
          disabled={!confirmed || isCompleting}
          className="w-full bg-[#2bc196] hover:bg-[#2bc196]/90 text-white h-12 rounded-xl shadow-lg shadow-green-500/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
        >
          {isCompleting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Finalizando...
            </>
          ) : (
            <>
              Finalizar Compliance
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      {/* Footer */}
      <div className="text-center mt-6">
        <p className="text-xs text-[#002443]/40 flex items-center justify-center gap-1">
          <Shield className="w-3 h-3" />
          Seus dados estão protegidos e serão tratados com confidencialidade.
        </p>
      </div>
    </div>
  );
}