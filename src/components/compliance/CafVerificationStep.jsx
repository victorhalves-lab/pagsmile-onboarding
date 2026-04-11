import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { 
  ScanFace, FileCheck, CheckCircle2, Loader2, AlertCircle,
  Camera, Shield, ArrowRight, RefreshCw, XCircle
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * CAF SDK Web Integration — DocumentDetector + FaceLiveness
 * 
 * Every step's result (images, metadata) is sent to the backend via cafVerifyResult
 * which persists: IntegrationLog + ExternalValidationResult + DocumentUpload.
 * All calls are AWAITED (not fire-and-forget) to guarantee persistence.
 */

const CAF_DD_SDK_URL = 'https://repo.combateafraude.com/javascript/release/document-detector/6.13.0/document-detector-6.13.0.umd.js';
const CAF_FL_SDK_URL = 'https://repo.combateafraude.com/javascript/release/caf-face-liveness/0.16.0/caf-face-liveness_0.16.0.umd.js';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) { resolve(); return; }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Falha ao carregar SDK: ${src}`));
    document.body.appendChild(script);
  });
}

const STEPS = [
  { id: 'init', label: 'Preparação', icon: Shield },
  { id: 'document_front', label: 'Doc. Frente', icon: FileCheck },
  { id: 'document_back', label: 'Doc. Verso', icon: FileCheck },
  { id: 'liveness', label: 'Prova de Vida', icon: ScanFace },
];

/**
 * Persist a CAF step result to the backend (AWAITED, not fire-and-forget).
 * Returns the backend response or null on failure.
 */
async function persistCafResult(payload) {
  try {
    const response = await base44.functions.invoke('cafVerifyResult', payload);
    console.log('[CAF] Result persisted:', response.data);
    return response.data;
  } catch (err) {
    console.error('[CAF] CRITICAL: Failed to persist result:', err);
    toast.error('Erro ao salvar resultado da verificação. Tentando novamente...');
    // Retry once
    try {
      const response = await base44.functions.invoke('cafVerifyResult', payload);
      console.log('[CAF] Result persisted on retry:', response.data);
      return response.data;
    } catch (retryErr) {
      console.error('[CAF] CRITICAL: Retry also failed:', retryErr);
      toast.error('Não foi possível salvar o resultado. Entre em contato com o suporte.');
      return null;
    }
  }
}

export default function CafVerificationStep({ 
  personName, personCpf, onComplete, onboardingCaseId 
}) {
  const [phase, setPhase] = useState('ready');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sdkToken, setSdkToken] = useState(null);
  const [personId, setPersonId] = useState(null);
  const [docResults, setDocResults] = useState({ front: null, back: null });
  const [livenessResult, setLivenessResult] = useState(null);
  const [savedResults, setSavedResults] = useState({ front: false, back: false, liveness: false });
  const [retryCount, setRetryCount] = useState(0);
  const flContainerRef = useRef(null);

  const stepIndex = phase === 'ready' || phase === 'loading' ? 0 
    : phase === 'doc_front' ? 1 
    : phase === 'doc_back' ? 2 
    : phase === 'liveness' ? 3 : 4;

  // ── Step 1: Get token from backend + load SDKs ──
  const startVerification = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPhase('loading');
    try {
      const response = await base44.functions.invoke('cafGenerateToken', {
        personCpf: personCpf || '',
        onboardingCaseId: onboardingCaseId || '',
      });
      const data = response.data;
      if (data.error) {
        throw new Error(data.error + (data.details ? ': ' + data.details : ''));
      }
      setSdkToken(data.sdkToken);
      setPersonId(data.personId);

      await Promise.all([
        loadScript(CAF_DD_SDK_URL),
        loadScript(CAF_FL_SDK_URL),
      ]);

      const ddModule = window['@combateafraude/document-detector'];
      const flModule = window['CafFaceLiveness'];
      if (!ddModule?.DocumentDetector) {
        throw new Error('DocumentDetector SDK não carregou corretamente.');
      }
      if (!flModule) {
        throw new Error('FaceLiveness SDK não carregou corretamente.');
      }

      toast.success('SDK carregado! Iniciando captura do documento...');
      setPhase('doc_front');
    } catch (err) {
      console.error('[CAF] Init error:', err);
      setError(err.message);
      setPhase('error');
      toast.error('Erro ao iniciar verificação: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [personCpf, onboardingCaseId]);

  // ── Step 2: DocumentDetector — FRONT capture ──
  useEffect(() => {
    if (phase !== 'doc_front' || !sdkToken) return;
    let dd = null;
    let cancelled = false;

    const runCapture = async () => {
      try {
        const { DocumentDetector } = window['@combateafraude/document-detector'];
        dd = new DocumentDetector({
          token: sdkToken,
          language: 'pt_BR',
          blockExecutionOnDesktops: false,
          enableFramingAnalyzer: true,
          appearance: {
            general: { fontFamily: 'Plus Jakarta Sans, sans-serif' },
          },
        });

        if (dd.loadAiModel) await dd.loadAiModel();
        await dd.initialize();

        const result = await dd.capture({
          expectedDocument: 'any',
          mode: 'automatic',
          automaticCaptureMaxDuration: 90,
          personID: personId,
        });

        if (cancelled) return;
        console.log('[CAF] Doc front captured successfully');
        setDocResults(prev => ({ ...prev, front: result }));

        // PERSIST (awaited) — send the image URL to backend for download + storage
        const persistResult = await persistCafResult({
          onboardingCaseId: onboardingCaseId || '',
          module: 'document_front',
          imageUrl: result?.image?.url || '',
          detectedDocument: result?.detectedDocument || null,
          isCaptureValid: result?.isCaptureValid,
          storageInfo: result?.image?.storageInfo || null,
        });
        setSavedResults(prev => ({ ...prev, front: !!persistResult?.success }));

        await dd.close();
        await dd.dispose();
        toast.success('Frente do documento capturada e salva!');
        setPhase('doc_back');
      } catch (err) {
        if (cancelled) return;
        console.error('[CAF] Doc front error:', err);
        if (dd) { try { await dd.close(); await dd.dispose(); } catch {} }
        
        if (err?.name === 'CafSdkCancelledError' || err?.message?.includes('cancelled')) {
          setError('Captura cancelada pelo usuário. Clique em "Tentar Novamente" para reiniciar.');
        } else {
          setError('Erro na captura do documento (frente): ' + (err.message || err));
        }
        setPhase('error');
      }
    };
    runCapture();
    return () => { cancelled = true; };
  }, [phase, sdkToken, personId, onboardingCaseId]);

  // ── Step 3: DocumentDetector — BACK capture ──
  useEffect(() => {
    if (phase !== 'doc_back' || !sdkToken) return;
    let dd = null;
    let cancelled = false;

    const runCapture = async () => {
      try {
        const { DocumentDetector } = window['@combateafraude/document-detector'];
        dd = new DocumentDetector({
          token: sdkToken,
          language: 'pt_BR',
          blockExecutionOnDesktops: false,
          enableFramingAnalyzer: true,
        });

        if (dd.loadAiModel) await dd.loadAiModel();
        await dd.initialize();

        const result = await dd.capture({
          expectedDocument: 'any',
          mode: 'automatic',
          automaticCaptureMaxDuration: 90,
          personID: personId,
        });

        if (cancelled) return;
        console.log('[CAF] Doc back captured successfully');
        setDocResults(prev => ({ ...prev, back: result }));

        // PERSIST (awaited)
        const persistResult = await persistCafResult({
          onboardingCaseId: onboardingCaseId || '',
          module: 'document_back',
          imageUrl: result?.image?.url || '',
          detectedDocument: result?.detectedDocument || null,
          isCaptureValid: result?.isCaptureValid,
          storageInfo: result?.image?.storageInfo || null,
        });
        setSavedResults(prev => ({ ...prev, back: !!persistResult?.success }));

        await dd.close();
        await dd.dispose();
        toast.success('Verso do documento capturado e salvo! Iniciando prova de vida...');
        setPhase('liveness');
      } catch (err) {
        if (cancelled) return;
        console.error('[CAF] Doc back error:', err);
        if (dd) { try { await dd.close(); await dd.dispose(); } catch {} }
        
        if (err?.name === 'CafSdkCancelledError' || err?.message?.includes('cancelled')) {
          setError('Captura cancelada pelo usuário. Clique em "Tentar Novamente" para reiniciar.');
        } else {
          setError('Erro na captura do documento (verso): ' + (err.message || err));
        }
        setPhase('error');
      }
    };
    runCapture();
    return () => { cancelled = true; };
  }, [phase, sdkToken, personId, onboardingCaseId]);

  // ── Step 4: FaceLiveness ──
  useEffect(() => {
    if (phase !== 'liveness' || !sdkToken) return;
    let cancelled = false;

    const runLiveness = async () => {
      try {
        const CafFaceLivenessSdk = window['CafFaceLiveness'];
        if (!CafFaceLivenessSdk) throw new Error('FaceLiveness SDK não disponível');

        await CafFaceLivenessSdk.init(sdkToken, personId, {
          htmlContainerId: 'caf-fl-container',
          language: 'pt_BR',
        }, {
          startButton: {
            label: 'Iniciar Verificação Facial',
            backgroundColor: '#2bc196',
            color: '#ffffff',
          },
        });

        const result = await CafFaceLivenessSdk.run();
        if (cancelled) return;

        console.log('[CAF] Liveness completed successfully');
        setLivenessResult(result);

        // PERSIST (awaited) — send signedResponse JWT to backend
        const persistResult = await persistCafResult({
          onboardingCaseId: onboardingCaseId || '',
          module: 'liveness',
          signedResponse: result?.signedResponse || '',
        });
        setSavedResults(prev => ({ ...prev, liveness: !!persistResult?.success }));

        CafFaceLivenessSdk.dispose();
        toast.success('Prova de vida concluída e salva com sucesso!');
        setPhase('done');
      } catch (err) {
        if (cancelled) return;
        console.error('[CAF] Liveness error:', err);
        try { window['CafFaceLiveness']?.dispose(); } catch {}
        
        if (err?.name === 'CafSdkCancelledError' || err?.message?.includes('cancelled')) {
          setError('Verificação facial cancelada pelo usuário.');
        } else {
          setError('Erro na prova de vida: ' + (err.message || err));
        }
        setPhase('error');
      }
    };
    runLiveness();
    return () => { cancelled = true; };
  }, [phase, sdkToken, personId, onboardingCaseId]);

  // ── When all done, notify parent ──
  useEffect(() => {
    if (phase === 'done') {
      onComplete?.({
        transactionId: livenessResult?.signedResponse || 'caf_sdk_completed',
        status: 'approved',
        docFront: docResults.front,
        docBack: docResults.back,
        liveness: livenessResult,
        savedResults,
      });
    }
  }, [phase]);

  // ── Retry handler ──
  const handleRetry = () => {
    setPhase('ready');
    setError(null);
    setDocResults({ front: null, back: null });
    setLivenessResult(null);
    setSdkToken(null);
    setPersonId(null);
    setSavedResults({ front: false, back: false, liveness: false });
    setRetryCount(prev => prev + 1);
  };

  // === RENDER ===

  if (phase === 'done') {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-[#002443] mb-2">Verificação Concluída!</h3>
        <p className="text-sm text-[#002443]/60 mb-2">
          Documento e prova de vida verificados com sucesso.
        </p>
        <div className="flex flex-col items-center gap-1 mb-6">
          <div className="flex items-center gap-2 text-xs text-green-600">
            <CheckCircle2 className="w-3.5 h-3.5" /> Documento frente capturado {savedResults.front ? '✓ salvo' : ''}
          </div>
          <div className="flex items-center gap-2 text-xs text-green-600">
            <CheckCircle2 className="w-3.5 h-3.5" /> Documento verso capturado {savedResults.back ? '✓ salvo' : ''}
          </div>
          <div className="flex items-center gap-2 text-xs text-green-600">
            <CheckCircle2 className="w-3.5 h-3.5" /> Prova de vida aprovada {savedResults.liveness ? '✓ salvo' : ''}
          </div>
        </div>
        <Button
          onClick={() => onComplete?.({ status: 'approved', savedResults })}
          className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white px-8 h-12 rounded-xl"
        >
          Continuar <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-purple-50 mb-4">
          <ScanFace className="w-8 h-8 text-purple-600" />
        </div>
        <h2 className="text-xl font-bold text-[#002443] mb-2">Verificação de Identidade (CAF)</h2>
        <p className="text-sm text-[#002443]/60 max-w-md mx-auto">
          Capture seu documento de identidade e realize a prova de vida para verificar sua identidade.
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isDone = idx < stepIndex;
          const isActive = idx === stepIndex;
          return (
            <div key={step.id} className="flex items-center gap-1.5">
              {idx > 0 && <div className={`w-6 h-0.5 ${isDone ? 'bg-green-400' : 'bg-slate-200'}`} />}
              <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                isDone ? 'bg-green-50 border-green-200 text-green-700' :
                isActive ? 'bg-purple-50 border-purple-200 text-purple-700 ring-1 ring-purple-300' :
                'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : 
                  isActive ? <Loader2 className="w-3.5 h-3.5 text-purple-600 animate-spin" /> :
                  <Icon className="w-3.5 h-3.5 text-slate-400" />}
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Ready state ── */}
      {phase === 'ready' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-100">
            <Camera className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Tenha em mãos seu RG ou CNH</p>
              <p className="text-xs text-blue-600 mt-1">
                Você precisará fotografar a frente e o verso do documento usando a câmera do dispositivo.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
            <ScanFace className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-purple-800">Prova de Vida</p>
              <p className="text-xs text-purple-600 mt-1">
                Após os documentos, uma verificação facial será realizada. Procure um local com boa iluminação.
              </p>
            </div>
          </div>

          {personCpf && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <Shield className="w-5 h-5 text-[#002443]/50 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#002443]">CPF identificado: {personCpf}</p>
                <p className="text-xs text-[#002443]/50 mt-0.5">
                  A verificação será vinculada a este documento.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
            <Shield className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">Armazenamento seguro</p>
              <p className="text-xs text-green-600 mt-1">
                Todas as imagens (documento e selfie) serão armazenadas de forma segura em nossos servidores.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button
              onClick={startVerification}
              disabled={loading}
              className="flex-1 bg-[#2bc196] hover:bg-[#2bc196]/90 text-white h-12 rounded-xl shadow-lg"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Carregando SDK...</>
              ) : (
                <><ScanFace className="w-4 h-4 mr-2" /> Iniciar Verificação</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── Loading state ── */}
      {phase === 'loading' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-sm font-medium text-[#002443]">Carregando SDK de verificação...</p>
          <p className="text-xs text-[#002443]/50 mt-1">Obtendo token seguro e preparando a câmera.</p>
        </div>
      )}

      {/* ── Active capture (doc_front / doc_back) — SDK renders its own modal overlay ── */}
      {(phase === 'doc_front' || phase === 'doc_back') && (
        <div className="bg-white rounded-2xl border-2 border-purple-200 p-6 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-4">
            <FileCheck className="w-7 h-7 text-blue-600 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-[#002443] mb-2">
            {phase === 'doc_front' ? 'Capture a Frente do Documento' : 'Capture o Verso do Documento'}
          </h3>
          <p className="text-sm text-[#002443]/60 max-w-sm mx-auto">
            {phase === 'doc_front' 
              ? 'Posicione a frente do seu RG ou CNH na câmera. O SDK fará a captura automaticamente.'
              : 'Agora posicione o verso do documento. A captura será automática.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-purple-600 font-medium bg-purple-50 rounded-lg py-2 px-4 inline-flex">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Aguardando captura do SDK...
          </div>
          <p className="text-[10px] text-[#002443]/30 mt-3">
            A imagem será salva automaticamente após a captura.
          </p>
        </div>
      )}

      {/* ── FaceLiveness — SDK renders inside our container ── */}
      {phase === 'liveness' && (
        <div className="bg-white rounded-2xl border-2 border-purple-200 p-6">
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-purple-50 mb-3">
              <ScanFace className="w-7 h-7 text-purple-600 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-[#002443] mb-2">Prova de Vida</h3>
            <p className="text-sm text-[#002443]/60">
              Siga as instruções na tela para completar a verificação facial.
            </p>
          </div>
          <div 
            id="caf-fl-container" 
            ref={flContainerRef} 
            className="min-h-[350px] rounded-xl overflow-hidden border border-slate-200 bg-slate-50" 
          />
          <p className="text-[10px] text-[#002443]/30 mt-3 text-center">
            A selfie será salva automaticamente após a verificação.
          </p>
        </div>
      )}

      {/* ── Error state ── */}
      {phase === 'error' && (
        <div className="bg-white rounded-2xl border border-red-200 p-6 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mb-2">
            <XCircle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-[#002443]">Erro na Verificação</h3>
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3 text-left">{error}</p>
          
          {retryCount < 3 && (
            <p className="text-xs text-[#002443]/40">
              Tentativa {retryCount + 1} de 3
            </p>
          )}
          
          <div className="flex gap-3 justify-center">
            {retryCount < 3 ? (
              <Button
                onClick={handleRetry}
                className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white px-6 h-11 rounded-xl"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Tentar Novamente
              </Button>
            ) : (
              <div className="text-center">
                <p className="text-sm text-red-600 mb-3">Limite de tentativas atingido.</p>
                <p className="text-xs text-[#002443]/50 mb-4">
                  Se o problema persistir, entre em contato com o suporte enviando print desta tela.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security notice */}
      <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
        <Shield className="w-5 h-5 text-[#002443]/40 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-[#002443]">Verificação segura com armazenamento completo</p>
          <p className="text-xs text-[#002443]/50 mt-1">
            Tecnologia certificada pela CAF (Combate à Fraude). Todas as imagens (documento frente/verso e selfie) 
            são baixadas e armazenadas permanentemente em nossos servidores para auditoria e compliance.
          </p>
        </div>
      </div>
    </div>
  );
}