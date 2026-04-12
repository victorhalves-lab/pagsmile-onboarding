import React from 'react';
import { Button } from '@/components/ui/button';
import { ScanFace, Lightbulb, Ruler, SmartphoneNfc, ShieldCheck, ArrowRight } from 'lucide-react';

/**
 * Preparation screen shown before FaceLiveness starts.
 * Explains the privacy mask effect, gives distance/lighting tips.
 */
export default function CafLivenessPreparation({ onReady, loading }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-50 mb-3">
          <ScanFace className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-lg font-bold text-[#002443] mb-1">Prova de Vida — Preparação</h3>
        <p className="text-sm text-[#002443]/60 max-w-md mx-auto">
          Seus documentos foram capturados com sucesso! Agora vamos verificar sua identidade facial.
        </p>
      </div>

      {/* Privacy mask explanation — KEY IMPROVEMENT */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
        <ShieldCheck className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-800">Efeito de privacidade na tela</p>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            Durante a verificação, seu rosto aparecerá com um <strong>efeito de contorno/desenho</strong> na tela. 
            <strong> Isso é normal e NÃO é um erro</strong> — é uma proteção de privacidade aplicada pela tecnologia de verificação. 
            Apenas siga as instruções na tela.
          </p>
        </div>
      </div>

      {/* Tips grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex flex-col items-center text-center p-4 rounded-xl bg-blue-50 border border-blue-100">
          <Ruler className="w-7 h-7 text-blue-600 mb-2" />
          <p className="text-xs font-bold text-blue-800">~50cm de distância</p>
          <p className="text-[10px] text-blue-600 mt-1">Mantenha o celular a um braço de distância do rosto</p>
        </div>
        <div className="flex flex-col items-center text-center p-4 rounded-xl bg-yellow-50 border border-yellow-100">
          <Lightbulb className="w-7 h-7 text-yellow-600 mb-2" />
          <p className="text-xs font-bold text-yellow-800">Boa iluminação</p>
          <p className="text-[10px] text-yellow-600 mt-1">Procure um local com luz frontal no rosto, evite contraluz</p>
        </div>
        <div className="flex flex-col items-center text-center p-4 rounded-xl bg-green-50 border border-green-100">
          <SmartphoneNfc className="w-7 h-7 text-green-600 mb-2" />
          <p className="text-xs font-bold text-green-800">Posição frontal</p>
          <p className="text-[10px] text-green-600 mt-1">Olhe diretamente para a câmera, sem óculos escuros ou boné</p>
        </div>
      </div>

      {/* CTA */}
      <Button
        onClick={onReady}
        disabled={loading}
        className="w-full bg-[#2bc196] hover:bg-[#2bc196]/90 text-white h-12 rounded-xl shadow-lg text-sm font-semibold"
      >
        <ScanFace className="w-4 h-4 mr-2" />
        Estou Pronto — Iniciar Verificação Facial
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}