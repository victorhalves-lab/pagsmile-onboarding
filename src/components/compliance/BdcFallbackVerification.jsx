import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { 
  Upload, Camera, CheckCircle2, Loader2, AlertCircle, 
  FileCheck, ScanFace, ArrowRight, Shield
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * BDC BigID Fallback — Manual document + selfie upload
 * Used when CAF SDK fails to load (CDN blocked, network issue, etc.)
 * Sends images to BDC Documentoscopia + Facematch APIs via backend.
 */

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function BdcFallbackVerification({ onboardingCaseId, personCpf, onComplete }) {
  const [step, setStep] = useState('doc_front'); // doc_front → doc_back → selfie → processing → done
  const [docFrontFile, setDocFrontFile] = useState(null);
  const [docFrontPreview, setDocFrontPreview] = useState(null);
  const [docBackFile, setDocBackFile] = useState(null);
  const [docBackPreview, setDocBackPreview] = useState(null);
  const [selfieFile, setSelfieFile] = useState(null);
  const [selfiePreview, setSelfiePreview] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    const preview = URL.createObjectURL(file);
    
    if (type === 'doc_front') {
      setDocFrontFile(file);
      setDocFrontPreview(preview);
    } else if (type === 'doc_back') {
      setDocBackFile(file);
      setDocBackPreview(preview);
    } else {
      setSelfieFile(file);
      setSelfiePreview(preview);
    }
  };

  const handleSubmit = async () => {
    if (!docFrontFile || !selfieFile) {
      toast.error('Envie pelo menos a frente do documento e a selfie.');
      return;
    }

    setProcessing(true);
    setError(null);
    setStep('processing');

    try {
      const docBase64 = await fileToBase64(docFrontFile);
      const selfieBase64 = await fileToBase64(selfieFile);

      // Upload document front via BDC Documentoscopia + Facematch
      const response = await base44.functions.invoke('bdcBigIdFallback', {
        action: 'full_verification',
        onboardingCaseId: onboardingCaseId || '',
        documentImageBase64: docBase64,
        selfieImageBase64: selfieBase64,
      });

      const data = response.data;
      setResult(data);

      if (data.success) {
        // Also upload doc back if provided
        if (docBackFile) {
          const backBase64 = await fileToBase64(docBackFile);
          try {
            await base44.functions.invoke('bdcBigIdFallback', {
              action: 'documentoscopia',
              onboardingCaseId: onboardingCaseId || '',
              documentImageBase64: backBase64,
            });
          } catch (e) { console.warn('Doc back upload failed:', e); }
        }

        // Upload files to storage
        try {
          const { file_url: frontUrl } = await base44.integrations.Core.UploadFile({ file: docFrontFile });
          await base44.asServiceRole?.entities?.DocumentUpload?.create?.({
            onboardingCaseId, documentTypeId: 'doc_front_bdc', documentName: 'Documento Frente (BDC)',
            fileUrl: frontUrl, fileName: docFrontFile.name, fileSize: docFrontFile.size,
            fileType: docFrontFile.type, validationStatus: 'Validado',
          });
        } catch (e) { console.warn('File upload failed:', e); }

        try {
          const { file_url: selfieUrl } = await base44.integrations.Core.UploadFile({ file: selfieFile });
          await base44.asServiceRole?.entities?.DocumentUpload?.create?.({
            onboardingCaseId, documentTypeId: 'selfie_bdc', documentName: 'Selfie (BDC Facematch)',
            fileUrl: selfieUrl, fileName: selfieFile.name, fileSize: selfieFile.size,
            fileType: selfieFile.type, validationStatus: 'Validado',
          });
        } catch (e) { console.warn('Selfie upload failed:', e); }

        setStep('done');
        toast.success('Verificação concluída com sucesso!');
      } else {
        setError(data.documentoscopia?.resultMessage || data.facematch?.resultMessage || 'Verificação falhou');
        setStep('error');
      }
    } catch (err) {
      console.error('[BDC Fallback] Error:', err);
      setError(err.message || 'Erro na verificação');
      setStep('error');
    } finally {
      setProcessing(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-[#002443] mb-2">Verificação Concluída!</h3>
        <p className="text-sm text-[#002443]/60 mb-2">
          Documento analisado e identidade verificada via BigDataCorp.
        </p>
        {result?.facematch?.similarity && (
          <p className="text-xs text-green-600 mb-4">
            Similaridade facial: {Number(result.facematch.similarity).toFixed(1)}%
          </p>
        )}
        <Button
          onClick={() => onComplete?.({ 
            status: result?.overallDecision === 'APPROVED' ? 'approved' : 'pending_review',
            provider: 'BigDataCorp', 
            bdcResult: result,
            savedResults: { front: true, back: !!docBackFile, liveness: true },
          })}
          className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white px-8 h-12 rounded-xl"
        >
          Continuar <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-4" />
        <p className="text-sm font-medium text-[#002443]">Analisando documentos...</p>
        <p className="text-xs text-[#002443]/50 mt-1">
          Executando OCR, validação forense e comparação facial via BigDataCorp.
        </p>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className="bg-white rounded-2xl border border-red-200 p-6 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h3 className="text-lg font-bold text-[#002443]">Erro na Verificação</h3>
        <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
        <Button onClick={() => { setStep('doc_front'); setError(null); }}
          className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white px-6 h-11 rounded-xl">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  const UploadCard = ({ title, icon: Icon, preview, fileSet, type, onNext }) => (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-50 mb-3">
          <Icon className="w-7 h-7 text-blue-600" />
        </div>
        <h3 className="text-lg font-bold text-[#002443] mb-1">{title}</h3>
      </div>

      {preview ? (
        <div className="relative">
          <img src={preview} alt={title} className="w-full max-h-48 object-contain rounded-xl border" />
          <button onClick={() => {
            if (type === 'doc_front') { setDocFrontFile(null); setDocFrontPreview(null); }
            else if (type === 'doc_back') { setDocBackFile(null); setDocBackPreview(null); }
            else { setSelfieFile(null); setSelfiePreview(null); }
          }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">✕</button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-8 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-colors">
          <Upload className="w-8 h-8 text-slate-400 mb-2" />
          <p className="text-sm font-medium text-[#002443]">Toque para enviar foto</p>
          <p className="text-xs text-[#002443]/50 mt-1">JPG, PNG ou PDF • Máx 10MB</p>
          <input type="file" accept="image/*,application/pdf" capture={type === 'selfie' ? 'user' : 'environment'}
            className="hidden" onChange={(e) => handleFileSelect(e, type)} />
        </label>
      )}

      {fileSet && onNext && (
        <Button onClick={onNext} className="w-full bg-[#2bc196] hover:bg-[#2bc196]/90 text-white h-11 rounded-xl">
          Próximo <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
        <p className="text-sm font-semibold text-blue-800">🔄 Verificação Alternativa — BigDataCorp</p>
        <p className="text-xs text-blue-600 mt-1">
          O SDK padrão não pôde ser carregado. Envie as fotos manualmente para verificação.
        </p>
      </div>

      {step === 'doc_front' && (
        <UploadCard title="📄 Frente do Documento" icon={FileCheck} 
          preview={docFrontPreview} fileSet={!!docFrontFile} type="doc_front"
          onNext={() => setStep('doc_back')} />
      )}

      {step === 'doc_back' && (
        <UploadCard title="📄 Verso do Documento" icon={FileCheck}
          preview={docBackPreview} fileSet={!!docBackFile} type="doc_back"
          onNext={() => setStep('selfie')} />
      )}

      {step === 'selfie' && (
        <div className="space-y-4">
          <UploadCard title="🤳 Selfie" icon={ScanFace}
            preview={selfiePreview} fileSet={!!selfieFile} type="selfie" />
          
          {selfieFile && (
            <Button onClick={handleSubmit} disabled={processing}
              className="w-full bg-[#2bc196] hover:bg-[#2bc196]/90 text-white h-12 rounded-xl shadow-lg">
              {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
              Enviar para Verificação
            </Button>
          )}
        </div>
      )}

      <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
        <Shield className="w-5 h-5 text-[#002443]/40 shrink-0 mt-0.5" />
        <p className="text-xs text-[#002443]/50">
          Verificação segura via BigDataCorp BigID. OCR + validação forense + comparação facial 1:1.
        </p>
      </div>
    </div>
  );
}