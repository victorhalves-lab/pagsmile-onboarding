import React from 'react';
import { CheckCircle2, ScanFace, Clock, Sparkles } from 'lucide-react';

/**
 * Welcome banner shown ONLY when the client accesses via mode=caf_only link.
 * Contextualizes the client: "you already did X, now only this last step is missing".
 * Reduces anxiety and abandonment by framing the task as "almost done".
 */
export default function CafOnlyWelcomeBanner({ merchantName }) {
  return (
    <div className="bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 rounded-2xl p-5 md:p-6 mb-6 shadow-xl shadow-purple-500/20 relative overflow-hidden">
      {/* Decorative sparkles */}
      <div className="absolute top-3 right-3 opacity-20">
        <Sparkles className="w-16 h-16 text-white" />
      </div>

      <div className="relative">
        {/* Greeting */}
        <div className="flex items-center gap-2 mb-3">
          <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm">
            <ScanFace className="w-4 h-4 text-white" />
          </div>
          <p className="text-xs font-bold text-white/90 uppercase tracking-wider">
            Último passo do seu cadastro
          </p>
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight">
          {merchantName ? `Olá, ${merchantName.split(' ')[0]}!` : 'Olá!'} Você está quase lá. 🎉
        </h2>
        <p className="text-sm text-white/90 leading-relaxed mb-4">
          Seu questionário e documentos já foram recebidos com sucesso.
          <strong className="text-white"> Agora só falta verificar sua identidade</strong> para concluir.
        </p>

        {/* Mini-checklist: what's already done vs what's pending */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-white/85">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>Questionário de compliance <span className="text-emerald-300 font-semibold">concluído</span></span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/85">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>Documentos empresariais <span className="text-emerald-300 font-semibold">enviados</span></span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white font-semibold">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-white flex items-center justify-center shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            </div>
            <span>Verificação de identidade (documento + selfie)</span>
          </div>
        </div>

        {/* Time estimate */}
        <div className="inline-flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-lg bg-white/15 backdrop-blur-sm border border-white/20">
          <Clock className="w-3.5 h-3.5 text-white" />
          <span className="text-[11px] text-white font-medium">Leva cerca de 2 minutos</span>
        </div>
      </div>
    </div>
  );
}