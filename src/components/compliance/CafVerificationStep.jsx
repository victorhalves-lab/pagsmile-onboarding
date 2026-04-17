import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { 
  ScanFace, FileCheck, CheckCircle2, Loader2, AlertCircle,
  Camera, Shield, ArrowRight, RefreshCw, XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import CafLivenessPreparation from './CafLivenessPreparation';
import CafLivenessOverlay from './CafLivenessOverlay';
import CafDifficultyModal from './CafDifficultyModal';
import CafManualSelfieUpload from './CafManualSelfieUpload';
import BdcFallbackVerification from './BdcFallbackVerification';

/**
 * CAF SDK Web Integration — DocumentDetector + FaceLiveness
 * With BDC BigID Fallback when SDK fails to load
 * 
 * CRITICAL FIX NOTES:
 * - FaceLiveness.run() returns a JWT STRING directly, NOT an object with .signedResponse
 * - DocumentDetector.capture() returns image.blob — we use it for reliable upload (no temp URL expiry)
 * - performFaceAuthentication: true — enables face match (selfie vs document)
 * - All results are AWAITED before advancing to next step
 * - Full CAF data enrichment: isAlive, isMatch, similarity, sessionId, detectedDocument, storageInfo
 */

const CAF_DD_SDK_URL = 'https://repo.combateafraude.com/javascript/release/document-detector/6.13.0/document-detector-6.13.0.umd.js';
const CAF_DD_WASM_URL = 'https://repo.combateafraude.com/javascript/release/document-detector/6.13.0/dd-validator.wasm';
const CAF_FL_SDK_URL = 'https://repo.combateafraude.com/javascript/release/caf-face-liveness/0.16.0/caf-face-liveness_0.16.0.umd.js';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-caf-src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') { resolve(); return; }
      existing.addEventListener('load', resolve);
      existing.addEventListener('error', () => reject(new Error(`Falha ao carregar SDK: ${src}`)));
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.setAttribute('data-caf-src', src);
    script.onload = () => { script.dataset.loaded = 'true'; resolve(); };
    script.onerror = () => reject(new Error(`Falha ao carregar SDK: ${src}. Verifique sua conexão e tente novamente.`));
    document.body.appendChild(script);
  });
}

function preloadWasm(url) {
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  link.as = 'fetch';
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

const STEPS = [
  { id: 'init', label: 'Preparação', icon: Shield },
  { id: 'document_front', label: 'Doc. Frente', icon: FileCheck },
  { id: 'document_back', label: 'Doc. Verso', icon: FileCheck },
  { id: 'liveness_prep', label: 'Instruções', icon: ScanFace },
  { id: 'liveness', label: 'Prova de Vida', icon: ScanFace },
];

// Step-by-step user guidance messages
const STEP_GUIDANCE = {
  doc_front: {
    title: '📄 Captura da Frente do Documento',
    instructions: [
      'Pegue seu RG ou CNH e posicione com a FRENTE virada para a câmera',
      'Apoie o documento sobre uma superfície lisa e com fundo escuro',
      'Certifique-se de que TODOS os cantos do documento estejam visíveis',
      'A câmera fará a captura automaticamente quando detectar o documento',
    ],
    warnings: ['Evite sombras sobre o documento', 'Não segure com os dedos sobre o texto'],
  },
  doc_back: {
    title: '📄 Captura do Verso do Documento',
    instructions: [
      'Agora VIRE o documento e mostre o VERSO para a câmera',
      'Mantenha na mesma posição estável da etapa anterior',
      'Aguarde a detecção automática — não mova o documento',
    ],
    warnings: ['O verso deve estar completamente legível'],
  },
};

/**
 * Convert a Blob to base64 data URI for transmission to backend.
 */
async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

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
  const [livenessAttempts, setLivenessAttempts] = useState(0);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [manualFallback, setManualFallback] = useState(false);
  const [bdcFallback, setBdcFallback] = useState(false);
  const flContainerRef = useRef(null);

  const stepIndex = phase === 'ready' || phase === 'loading' ? 0 
    : phase === 'doc_front' ? 1 
    : phase === 'doc_back' ? 2 
    : phase === 'liveness_prep' ? 3
    : phase === 'liveness' ? 4 : 5;

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

      // Preload the WASM file needed by DocumentDetector
      preloadWasm(CAF_DD_WASM_URL);
      
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
      // If SDK failed to load (network/CDN issue), offer BDC fallback
      if (err.message?.includes('Falha ao carregar SDK') || err.message?.includes('não carregou')) {
        console.log('[CAF] SDK load failed — enabling BDC BigID fallback');
        setBdcFallback(true);
        setPhase('bdc_fallback');
        toast.info('SDK CAF indisponível. Usando verificação alternativa BigDataCorp.');
      } else {
        setError(err.message);
        setPhase('error');
        toast.error('Erro ao iniciar verificação: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [personCpf, onboardingCaseId]);

  // ── Step 2: DocumentDetector — FRONT capture (skip if already saved) ──
  useEffect(() => {
    if (phase !== 'doc_front' || !sdkToken) return;
    // Smart skip: if front already captured and saved, go to back
    if (savedResults.front) {
      setPhase('doc_back');
      return;
    }
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
          enableVisibilityChangeSecurity: true,
          appearance: {
            general: { fontFamily: 'Plus Jakarta Sans, sans-serif' },
            capture: { captureButtonColor: '#2bc196' },
            upload: {
              startScreen: { allowButton: { backgroundColor: '#2bc196' } },
              successScreen: { icon: { color: '#2bc196' } },
            },
          },
        });

        // Pre-load AI model for better performance (recommended by CAF docs)
        if (dd.loadAiModel) await dd.loadAiModel();
        await dd.initialize();

        const result = await dd.capture({
          expectedDocument: 'any',
          mode: 'automatic',
          automaticCaptureMaxDuration: 90,
          personID: personId,
          forceEndWhenInvalid: false,
        });

        if (cancelled) return;
        console.log('[CAF] Doc front captured:', {
          type: result?.detectedDocument?.type,
          side: result?.detectedDocument?.side,
          valid: result?.isCaptureValid,
          hasBlob: !!result?.image?.blob,
          hasUrl: !!result?.image?.url,
          storageKey: result?.image?.storageInfo?.key,
        });
        setDocResults(prev => ({ ...prev, front: result }));

        // Convert blob to base64 for reliable transmission (no temp URL expiry risk)
        let imageBase64 = null;
        if (result?.image?.blob) {
          imageBase64 = await blobToBase64(result.image.blob);
        }

        // PERSIST (awaited) — send blob + all metadata
        const persistResult = await persistCafResult({
          onboardingCaseId: onboardingCaseId || '',
          module: 'document_front',
          imageBase64: imageBase64,
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
        console.error('[CAF] Doc front error:', err?.name, err?.message);
        if (dd) { try { await dd.close(); await dd.dispose(); } catch {} }
        
        if (err?.name === 'CafSdkCanceledError' || err?.name === 'CafSdkCancelledError') {
          setError('Captura cancelada pelo usuário. Clique em "Tentar Novamente" para reiniciar.');
        } else if (err?.name === 'CafCameraPermissionDeniedError') {
          setError('Permissão de câmera negada. Habilite a câmera nas configurações do navegador e tente novamente.');
        } else if (err?.name === 'CafCameraUnsupportedError') {
          setError('Câmera não suportada neste dispositivo/navegador.');
        } else {
          setError('Erro na captura do documento (frente): ' + (err?.message || err));
        }
        setPhase('error');
      }
    };
    runCapture();
    return () => { cancelled = true; };
  }, [phase, sdkToken, personId, onboardingCaseId]);

  // ── Step 3: DocumentDetector — BACK capture (skip if already saved) ──
  useEffect(() => {
    if (phase !== 'doc_back' || !sdkToken) return;
    // Smart skip: if back already captured and saved, go to liveness prep
    if (savedResults.back) {
      setPhase('liveness_prep');
      return;
    }
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
          enableVisibilityChangeSecurity: true,
          appearance: {
            general: { fontFamily: 'Plus Jakarta Sans, sans-serif' },
            capture: { captureButtonColor: '#2bc196' },
          },
        });

        if (dd.loadAiModel) await dd.loadAiModel();
        await dd.initialize();

        const result = await dd.capture({
          expectedDocument: 'any',
          mode: 'automatic',
          automaticCaptureMaxDuration: 90,
          personID: personId,
          forceEndWhenInvalid: false,
        });

        if (cancelled) return;
        console.log('[CAF] Doc back captured:', {
          type: result?.detectedDocument?.type,
          side: result?.detectedDocument?.side,
          valid: result?.isCaptureValid,
          hasBlob: !!result?.image?.blob,
        });
        setDocResults(prev => ({ ...prev, back: result }));

        // Convert blob to base64 for reliable transmission
        let imageBase64 = null;
        if (result?.image?.blob) {
          imageBase64 = await blobToBase64(result.image.blob);
        }

        // PERSIST (awaited)
        const persistResult = await persistCafResult({
          onboardingCaseId: onboardingCaseId || '',
          module: 'document_back',
          imageBase64: imageBase64,
          imageUrl: result?.image?.url || '',
          detectedDocument: result?.detectedDocument || null,
          isCaptureValid: result?.isCaptureValid,
          storageInfo: result?.image?.storageInfo || null,
        });
        setSavedResults(prev => ({ ...prev, back: !!persistResult?.success }));

        await dd.close();
        await dd.dispose();
        toast.success('Verso do documento capturado e salvo! Preparando prova de vida...');
        setPhase('liveness_prep');
      } catch (err) {
        if (cancelled) return;
        console.error('[CAF] Doc back error:', err?.name, err?.message);
        if (dd) { try { await dd.close(); await dd.dispose(); } catch {} }
        
        if (err?.name === 'CafSdkCanceledError' || err?.name === 'CafSdkCancelledError') {
          setError('Captura cancelada pelo usuário. Clique em "Tentar Novamente" para reiniciar.');
        } else if (err?.name === 'CafCameraPermissionDeniedError') {
          setError('Permissão de câmera negada. Habilite a câmera nas configurações do navegador.');
        } else {
          setError('Erro na captura do documento (verso): ' + (err?.message || err));
        }
        setPhase('error');
      }
    };
    runCapture();
    return () => { cancelled = true; };
  }, [phase, sdkToken, personId, onboardingCaseId]);

  // ── Step 4: FaceLiveness (with Face Authentication) ──
  useEffect(() => {
    if (phase !== 'liveness' || !sdkToken) return;
    let cancelled = false;
    setLivenessAttempts(prev => prev + 1);

    const runLiveness = async () => {
      try {
        const CafFaceLivenessSdk = window['CafFaceLiveness'];
        if (!CafFaceLivenessSdk) throw new Error('FaceLiveness SDK não disponível');

        await CafFaceLivenessSdk.init(sdkToken, personId, {
          htmlContainerId: 'caf-fl-container',
          language: 'pt_BR',
          performFaceAuthentication: true,
          cameraPreviewFilter: 'classic', // FIX C01: Remove scary sketch effect, use natural camera view
        }, {
          startButton: {
            label: 'Iniciar Verificação Facial',
            backgroundColor: '#2bc196',
            color: '#ffffff',
            borderRadius: '12px',
          },
          appearance: {
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          },
        });

        // FaceLiveness.run() returns a JWT STRING directly (NOT an object)
        // The JWT payload contains: imageUrl, isAlive, isMatch, sessionId, personId
        const jwtResult = await CafFaceLivenessSdk.run({
          onCaptureProcessingStart: () => {
            console.log('[CAF] Face capture processing started...');
          },
          onCaptureProcessingEnd: () => {
            console.log('[CAF] Face capture processing ended.');
          },
        });

        if (cancelled) return;

        console.log('[CAF] Liveness completed, JWT received (type:', typeof jwtResult, ', length:', jwtResult?.length, ')');
        setLivenessResult(jwtResult);

        // PERSIST (awaited) — send the FULL JWT string to backend for decoding + validation
        const persistResult = await persistCafResult({
          onboardingCaseId: onboardingCaseId || '',
          module: 'liveness',
          signedResponse: jwtResult, // This IS the JWT string directly from run()
        });
        setSavedResults(prev => ({ ...prev, liveness: !!persistResult?.success }));

        CafFaceLivenessSdk.dispose();
        toast.success('Prova de vida concluída e salva com sucesso!');
        setPhase('done');
      } catch (err) {
        if (cancelled) return;
        console.error('[CAF] Liveness error:', err?.name, err?.message);
        try { window['CafFaceLiveness']?.dispose(); } catch {}
        
        if (err?.name === 'CafSdkCanceledError' || err?.name === 'CafSdkCancelledError') {
          setError('Verificação facial cancelada pelo usuário.');
        } else if (err?.name === 'CafCameraPermissionDeniedError') {
          setError('Permissão de câmera negada. Habilite a câmera nas configurações do navegador.');
        } else if (err?.name === 'CafFaceLivenessError') {
          setError('Falha na prova de vida. Procure um ambiente bem iluminado e tente novamente.');
        } else if (err?.name === 'CafFaceAuthenticationError') {
          setError('Falha na autenticação facial. Sua face não correspondeu ao documento. Tente novamente.');
        } else if (err?.name === 'CafUnsupportedError') {
          setError('Seu dispositivo/navegador não suporta esta verificação.');
        } else if (err?.name === 'CafDeviceMotionPermissionDeniedError') {
          setError('Permissão de movimento do dispositivo negada. Permita o acesso e tente novamente.');
        } else {
          setError('Erro na prova de vida: ' + (err?.message || err));
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
        transactionId: typeof livenessResult === 'string' ? livenessResult.substring(0, 50) : 'caf_sdk_completed',
        status: 'approved',
        docFront: docResults.front,
        docBack: docResults.back,
        livenessJwt: livenessResult,
        savedResults,
      });
    }
  }, [phase]);

  // ── Smart retry: skip already-completed steps ──
  const handleRetry = () => {
    setError(null);
    setRetryCount(prev => prev + 1);

    // If docs already saved, skip directly to liveness prep
    if (savedResults.front && savedResults.back && sdkToken) {
      setPhase('liveness_prep');
      return;
    }
    // Otherwise full restart
    setPhase('ready');
    setDocResults({ front: null, back: null });
    setLivenessResult(null);
    setSdkToken(null);
    setPersonId(null);
    setSavedResults({ front: false, back: false, liveness: false });
  };

  // ── Retry only liveness (from difficulty modal or prep screen) ──
  const handleRetryLiveness = () => {
    setShowDifficultyModal(false);
    setError(null);
    // Dispose any existing SDK instance
    try { window['CafFaceLiveness']?.dispose(); } catch {}
    setPhase('liveness_prep');
  };

  // ── Manual fallback handler ──
  const handleManualFallback = () => {
    setShowDifficultyModal(false);
    try { window['CafFaceLiveness']?.dispose(); } catch {}
    setManualFallback(true);
    setPhase('manual_selfie');
  };

  // ── Difficulty timeout/click handler ──
  const handleDifficultyClick = () => {
    setShowDifficultyModal(true);
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

      {/* ── Ready state — full step-by-step guide ── */}
      {phase === 'ready' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          {/* What you will need */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm font-bold text-blue-900 mb-3">📋 O que você vai precisar:</p>
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">1</span>
                <div>
                  <p className="text-xs font-semibold text-blue-800">Documento de identidade (RG ou CNH)</p>
                  <p className="text-[10px] text-blue-600">Físico e original — não vale foto de documento no celular</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">2</span>
                <div>
                  <p className="text-xs font-semibold text-blue-800">Câmera do celular/computador funcionando</p>
                  <p className="text-[10px] text-blue-600">Quando solicitado, permita o acesso à câmera no navegador</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">3</span>
                <div>
                  <p className="text-xs font-semibold text-blue-800">Ambiente bem iluminado</p>
                  <p className="text-[10px] text-blue-600">Luz frontal no rosto, evite contraluz (janela atrás de você)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Process overview */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
            <p className="text-sm font-bold text-purple-900 mb-3">🔄 Como vai funcionar:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-purple-800">
                <span className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-[10px]">1°</span>
                <span>Você fotografa a <strong>FRENTE</strong> do documento</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-purple-800">
                <span className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-[10px]">2°</span>
                <span>Você fotografa o <strong>VERSO</strong> do documento</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-purple-800">
                <span className="w-6 h-6 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-[10px]">3°</span>
                <span>Prova de vida facial — você olha para a câmera</span>
              </div>
              <p className="text-[10px] text-purple-600 mt-2 italic">⏱️ O processo completo leva cerca de 2-3 minutos</p>
            </div>
          </div>

          {personCpf && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <Shield className="w-5 h-5 text-[#002443]/50 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#002443]">CPF identificado: {personCpf}</p>
                <p className="text-xs text-[#002443]/50 mt-0.5">A verificação será vinculada a este documento.</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 p-3 rounded-xl bg-green-50 border border-green-100">
            <Shield className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-green-800">🔒 Processo 100% seguro</p>
              <p className="text-xs text-green-600 mt-1">
                Certificado pela CAF (Combate à Fraude). Suas imagens são armazenadas com criptografia e nunca compartilhadas.
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

      {/* ── Active capture (doc_front / doc_back) — with step-by-step guidance ── */}
      {(phase === 'doc_front' || phase === 'doc_back') && (
        <div className="bg-white rounded-2xl border-2 border-purple-200 p-6 space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-50 mb-3">
              <FileCheck className="w-7 h-7 text-blue-600 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-[#002443] mb-1">
              {STEP_GUIDANCE[phase]?.title || 'Captura do Documento'}
            </h3>
          </div>

          {/* Step-by-step numbered instructions */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-xs font-bold text-blue-800 mb-3">📋 Siga estes passos:</p>
            <ol className="space-y-2">
              {(STEP_GUIDANCE[phase]?.instructions || []).map((instruction, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-xs text-blue-800 leading-relaxed">{instruction}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Warnings */}
          {STEP_GUIDANCE[phase]?.warnings?.length > 0 && (
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <p className="text-[10px] font-bold text-amber-800 mb-1">⚠️ Atenção:</p>
              {STEP_GUIDANCE[phase].warnings.map((w, i) => (
                <p key={i} className="text-[11px] text-amber-700">• {w}</p>
              ))}
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-purple-600 font-medium bg-purple-50 rounded-lg py-2.5 px-4">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            A câmera está ativa — posicione o documento conforme as instruções acima
          </div>
        </div>
      )}

      {/* ── Liveness Preparation Screen ── */}
      {phase === 'liveness_prep' && (
        <CafLivenessPreparation
          onReady={() => setPhase('liveness')}
          loading={false}
        />
      )}

      {/* ── FaceLiveness — SDK renders inside our container ── */}
      {phase === 'liveness' && (
        <div className="bg-white rounded-2xl border-2 border-purple-200 p-6">
          <CafLivenessOverlay
            onDifficultyClick={handleDifficultyClick}
            timeoutSeconds={90}
          />
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

      {/* ── BDC BigID Fallback ── */}
      {phase === 'bdc_fallback' && (
        <BdcFallbackVerification
          onboardingCaseId={onboardingCaseId}
          personCpf={personCpf}
          onComplete={onComplete}
        />
      )}

      {/* ── Manual Selfie Fallback ── */}
      {phase === 'manual_selfie' && (
        <CafManualSelfieUpload
          onboardingCaseId={onboardingCaseId}
          onComplete={onComplete}
        />
      )}

      {/* ── Difficulty Modal ── */}
      {showDifficultyModal && (
        <CafDifficultyModal
          attemptCount={livenessAttempts}
          onRetryLiveness={handleRetryLiveness}
          onManualFallback={handleManualFallback}
          onClose={() => setShowDifficultyModal(false)}
        />
      )}

      {/* ── Error state ── */}
      {phase === 'error' && (
        <div className="bg-white rounded-2xl border border-red-200 p-6 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mb-2">
            <XCircle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-[#002443]">Erro na Verificação</h3>
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3 text-left">{error}</p>
          
          <p className="text-xs text-[#002443]/40">
            Tentativa {retryCount + 1} • Face: {livenessAttempts}x
          </p>
          
          <div className="flex flex-col gap-2 items-center">
            <Button
              onClick={handleRetry}
              className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white px-6 h-11 rounded-xl"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Tentar Novamente
            </Button>
            
            {livenessAttempts >= 3 && (
              <Button
                onClick={handleManualFallback}
                variant="outline"
                className="px-6 h-11 rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50"
              >
                Enviar Selfie Manualmente
              </Button>
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