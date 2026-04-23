import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
// SDK-FREE for public routes.
import { callPublicFunction } from '@/lib/publicApi';
import { directUploadDocument } from '@/lib/directUpload';
import { Camera, Upload, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Manual selfie upload fallback when FaceLiveness fails after 3 attempts.
 * Marks the case for manual review.
 */
export default function CafManualSelfieUpload({ onboardingCaseId, onComplete }) {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const fileRef = useRef(null);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Selecione uma imagem (JPG, PNG)');
      return;
    }

    setUploading(true);
    try {
      // Upload the selfie via public direct upload (creates DocumentUpload + returns private URI)
      const docLinkToken = (typeof localStorage !== 'undefined' && localStorage.getItem('created_doc_link_token')) || undefined;
      const uploaded = await directUploadDocument({
        file,
        caseId: onboardingCaseId,
        documentTypeId: 'manual_selfie',
        documentName: 'Selfie Manual (fallback)',
        docLinkToken,
      });
      const fileUri = uploaded?.fileUri || '';

      // Log the manual selfie result — backend validates via docLinkToken
      await callPublicFunction('cafVerifyResult', {
        onboardingCaseId: onboardingCaseId || '',
        docLinkToken,
        module: 'manual_selfie',
        imageUrl: fileUri,
        manualUpload: true,
      });

      setUploaded(true);
      toast.success('Selfie enviada! Será revisada pela equipe de compliance.');
      
      setTimeout(() => {
        onComplete?.({
          status: 'manual_review',
          manualSelfie: true,
          savedResults: { front: true, back: true, liveness: false, manualSelfie: true },
        });
      }, 1500);
    } catch (err) {
      console.error('[CAF] Manual selfie upload error:', err);
      toast.error('Erro ao enviar selfie. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  if (uploaded) {
    return (
      <div className="bg-white rounded-2xl border border-green-200 p-6 text-center space-y-3">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50">
          <CheckCircle2 className="w-7 h-7 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-[#002443]">Selfie Enviada!</h3>
        <p className="text-sm text-[#002443]/60">
          Sua selfie será analisada pela equipe de compliance. Aguarde o processamento.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-purple-200 p-6 space-y-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-50 mb-3">
          <Camera className="w-7 h-7 text-purple-600" />
        </div>
        <h3 className="text-lg font-bold text-[#002443] mb-1">Envio Manual de Selfie</h3>
        <p className="text-sm text-[#002443]/60 max-w-sm mx-auto">
          Tire uma foto do seu rosto (selfie) e envie abaixo. A verificação será feita manualmente pela equipe.
        </p>
      </div>

      <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-100">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs text-amber-700">
            <strong>Importante:</strong> A selfie deve ser uma foto clara do seu rosto, sem óculos escuros ou boné. 
            O envio manual exigirá <strong>revisão adicional</strong> e pode levar mais tempo.
          </p>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleUpload}
      />

      <Button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="w-full bg-[#2bc196] hover:bg-[#2bc196]/90 text-white h-12 rounded-xl shadow-lg"
      >
        {uploading ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
        ) : (
          <><Upload className="w-4 h-4 mr-2" /> Tirar Foto / Selecionar Selfie</>
        )}
      </Button>
    </div>
  );
}