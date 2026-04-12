import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Lightbulb, Ruler, Camera, Upload } from 'lucide-react';

/**
 * Modal shown when user clicks "Estou com dificuldade" or timeout triggers.
 * Gives tips and offers retry or manual fallback (after 3 attempts).
 */
export default function CafDifficultyModal({ onRetryLiveness, onManualFallback, attemptCount, onClose }) {
  const canManualFallback = attemptCount >= 3;

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl" 
        onClick={e => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-50 mb-3">
            <AlertCircle className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-lg font-bold text-[#002443]">Dificuldade na Verificação?</h3>
          <p className="text-sm text-[#002443]/60 mt-1">Tente seguir estas dicas:</p>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50">
            <Ruler className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              <strong>Afaste o celular</strong> — mantenha aproximadamente 50cm (um braço de distância)
            </p>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-yellow-50">
            <Lightbulb className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-800">
              <strong>Melhore a iluminação</strong> — acenda luzes, vá para um cômodo mais claro, evite contraluz
            </p>
          </div>
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-green-50">
            <Camera className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            <p className="text-xs text-green-800">
              <strong>Olhe para a câmera</strong> — centralize o rosto, sem óculos escuros, boné ou máscara
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <Button
            onClick={onRetryLiveness}
            className="w-full bg-[#2bc196] hover:bg-[#2bc196]/90 text-white h-11 rounded-xl"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Tentar Novamente
          </Button>
          
          {canManualFallback && (
            <Button
              onClick={onManualFallback}
              variant="outline"
              className="w-full h-11 rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              <Upload className="w-4 h-4 mr-2" /> Enviar Selfie Manualmente
            </Button>
          )}

          {canManualFallback && (
            <p className="text-[10px] text-[#002443]/40 text-center">
              O envio manual exigirá revisão adicional pela equipe de compliance.
            </p>
          )}
        </div>

        <p className="text-[10px] text-center text-[#002443]/30">
          Tentativa {attemptCount} de verificação facial
        </p>
      </div>
    </div>
  );
}