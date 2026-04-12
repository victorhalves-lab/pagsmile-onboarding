import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Lightbulb, Ruler, Camera, Upload, Eye, Smartphone } from 'lucide-react';

/**
 * Enhanced difficulty modal with clearer, more empathetic guidance.
 * - Numbered troubleshooting steps
 * - Visual before/after examples
 * - Manual fallback after 3 attempts
 */
export default function CafDifficultyModal({ onRetryLiveness, onManualFallback, attemptCount, onClose }) {
  const canManualFallback = attemptCount >= 3;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto" 
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-50 mb-3">
            <AlertCircle className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-[#002443]">Precisa de ajuda?</h3>
          <p className="text-sm text-[#002443]/60 mt-1">
            Sem problemas! Siga este checklist e tente novamente:
          </p>
        </div>

        {/* Numbered troubleshooting checklist */}
        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 border border-blue-100">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">1</span>
            <div>
              <p className="text-xs font-bold text-blue-800">Afaste o celular do rosto</p>
              <p className="text-[10px] text-blue-600 mt-0.5">
                Segure a ~50cm (um braço de distância). Se estiver muito perto, o sistema não consegue detectar.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-yellow-50 border border-yellow-100">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">2</span>
            <div>
              <p className="text-xs font-bold text-yellow-800">Melhore a iluminação</p>
              <p className="text-[10px] text-yellow-600 mt-0.5">
                Acenda todas as luzes do cômodo. Fique DE FRENTE para a janela ou luminária — nunca de costas para a luz.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-green-50 border border-green-100">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">3</span>
            <div>
              <p className="text-xs font-bold text-green-800">Olhe para a câmera, não para a tela</p>
              <p className="text-[10px] text-green-600 mt-0.5">
                Direcione seu olhar para o pequeno círculo da câmera frontal (parte de cima do celular), 
                não para a imagem na tela.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-purple-50 border border-purple-100">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">4</span>
            <div>
              <p className="text-xs font-bold text-purple-800">Remova acessórios do rosto</p>
              <p className="text-[10px] text-purple-600 mt-0.5">
                Tire óculos escuros, boné, máscara e qualquer coisa que cubra parte do rosto.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">5</span>
            <div>
              <p className="text-xs font-bold text-slate-800">Fique parado e espere</p>
              <p className="text-[10px] text-slate-600 mt-0.5">
                Não mexa o celular. Mantenha a posição e aguarde 5-10 segundos — o sistema detecta automaticamente.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={onRetryLiveness}
            className="w-full bg-[#2bc196] hover:bg-[#2bc196]/90 text-white h-11 rounded-xl"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Seguir as Dicas e Tentar Novamente
          </Button>
          
          {canManualFallback && (
            <>
              <div className="relative my-1">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-[10px] text-[#002443]/40">ou</span>
                </div>
              </div>
              <Button
                onClick={onManualFallback}
                variant="outline"
                className="w-full h-11 rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                <Upload className="w-4 h-4 mr-2" /> Enviar Selfie Manualmente
              </Button>
              <p className="text-[10px] text-[#002443]/40 text-center">
                O envio manual requer revisão adicional pela equipe de compliance (pode levar até 24h).
              </p>
            </>
          )}
        </div>

        <p className="text-[10px] text-center text-[#002443]/30">
          Tentativa {attemptCount} de verificação facial
        </p>
      </div>
    </div>
  );
}