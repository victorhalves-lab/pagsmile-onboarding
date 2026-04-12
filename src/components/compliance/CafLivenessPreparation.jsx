import React from 'react';
import { Button } from '@/components/ui/button';
import { ScanFace, Lightbulb, Ruler, SmartphoneNfc, ShieldCheck, ArrowRight, Eye, Glasses, CircleOff } from 'lucide-react';

/**
 * Enhanced preparation screen before FaceLiveness.
 * - Explains filter is now "classic" (natural view, no sketch)
 * - Clear step-by-step instructions for the user
 * - Distance/lighting/position guidance with visual cues
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
          ✅ Seus documentos foram capturados com sucesso! Agora vamos verificar sua identidade facial.
        </p>
      </div>

      {/* What will happen — step by step */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100">
        <p className="text-sm font-bold text-purple-900 mb-3">📋 O que vai acontecer agora:</p>
        <ol className="space-y-2.5">
          <li className="flex items-start gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">1</span>
            <span className="text-xs text-purple-800 leading-relaxed">
              A <strong>câmera frontal</strong> do seu dispositivo vai abrir automaticamente
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">2</span>
            <span className="text-xs text-purple-800 leading-relaxed">
              Você verá seu rosto na tela — <strong>centralize dentro do contorno oval</strong>
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">3</span>
            <span className="text-xs text-purple-800 leading-relaxed">
              <strong>Olhe diretamente para a câmera</strong> e fique parado por alguns segundos
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">4</span>
            <span className="text-xs text-purple-800 leading-relaxed">
              O sistema verifica automaticamente — <strong>não precisa clicar em nada</strong>
            </span>
          </li>
        </ol>
      </div>

      {/* Tips grid with enhanced visual guidance */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="flex flex-col items-center text-center p-4 rounded-xl bg-blue-50 border border-blue-100">
          <Ruler className="w-7 h-7 text-blue-600 mb-2" />
          <p className="text-xs font-bold text-blue-800">📏 ~50cm de distância</p>
          <p className="text-[10px] text-blue-600 mt-1 leading-relaxed">
            Segure o celular a <strong>um braço de distância</strong>. Nem muito perto, nem muito longe.
          </p>
        </div>
        <div className="flex flex-col items-center text-center p-4 rounded-xl bg-yellow-50 border border-yellow-100">
          <Lightbulb className="w-7 h-7 text-yellow-600 mb-2" />
          <p className="text-xs font-bold text-yellow-800">💡 Iluminação frontal</p>
          <p className="text-[10px] text-yellow-600 mt-1 leading-relaxed">
            A luz deve estar <strong>na sua frente</strong>, iluminando seu rosto. Nunca de costas para a janela.
          </p>
        </div>
        <div className="flex flex-col items-center text-center p-4 rounded-xl bg-green-50 border border-green-100">
          <Eye className="w-7 h-7 text-green-600 mb-2" />
          <p className="text-xs font-bold text-green-800">👀 Olhe para a câmera</p>
          <p className="text-[10px] text-green-600 mt-1 leading-relaxed">
            Olhe diretamente para a <strong>câmera frontal</strong>, não para a tela do celular.
          </p>
        </div>
      </div>

      {/* What NOT to do */}
      <div className="bg-red-50/60 rounded-xl p-3 border border-red-100">
        <p className="text-[10px] font-bold text-red-800 mb-2">🚫 O que NÃO fazer:</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { icon: Glasses, text: 'Óculos escuros' },
            { icon: CircleOff, text: 'Boné ou chapéu' },
            { icon: CircleOff, text: 'Máscara facial' },
            { icon: CircleOff, text: 'Mão no rosto' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px] text-red-700">
              <item.icon className="w-3 h-3 text-red-500" />
              <span>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Security note about camera filter */}
      <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-800">ℹ️ Sobre a imagem na tela</p>
          <p className="text-[10px] text-amber-700 mt-0.5 leading-relaxed">
            Você verá sua imagem real na câmera. Em alguns dispositivos, pode haver um leve efeito 
            visual de segurança — <strong>isso é completamente normal</strong> e faz parte da proteção contra fraudes.
          </p>
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