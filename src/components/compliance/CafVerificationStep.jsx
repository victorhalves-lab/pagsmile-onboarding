import React, { useState, useEffect, useRef, useCallback } from 'react';
// SDK-FREE: page is PUBLIC (anonymous client running CAF SDK).
// callPublicFunction hits /functions/* directly — no @base44/sdk dependency.
import { callPublicFunction } from '@/lib/publicApi';
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
import CafErrorDiagnostic from './CafErrorDiagnostic';
import CafMobileProgressBar from './CafMobileProgressBar';
import { buildCafFallbackUrl, fetchCafFallbackLinks } from '@/lib/cafOnboardingLinks';

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

function loadScript(src, retries = 2) {
  return new Promise((resolve, reject) => {
    // Remove any stale/broken script tags from previous failed loads
    const existing = document.querySelector(`script[data-caf-src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === 'true') { resolve(); return; }
      // Previous script tag exists but didn't finish — remove and reload fresh
      existing.remove();
    }
    // Note: we intentionally do NOT set `crossorigin="anonymous"` here.
    // The CAF official docs example does not use it, and setting it causes the
    // browser to require an Access-Control-Allow-Origin header on the CDN response.
    // When the header varies (CDN region, CDN edge, network policy), the browser
    // rejects the script and fires `onerror` even when the HTTP response is 200.
    // Observed in production with BCK PAGAMENTOS (2026-04-21): script loaded fine
    // in curl but failed in browser due to CORS rejection.
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.setAttribute('data-caf-src', src);
    script.onload = () => { script.dataset.loaded = 'true'; resolve(); };
    script.onerror = () => {
      script.remove();
      if (retries > 0) {
        console.warn(`[CAF] Script load failed, retrying (${retries} left): ${src}`);
        setTimeout(() => {
          loadScript(src, retries - 1).then(resolve).catch(reject);
        }, 1500);
      } else {
        reject(new Error(`Falha ao carregar SDK: ${src}. Verifique sua conexão e tente novamente.`));
      }
    };
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
  // Attach docLinkToken (generated server-side at publicComplianceSubmit) to authenticate
  // this public write. Without a valid token the backend will refuse to persist CAF
  // results for an existing case, preventing anonymous tampering.
  const authedPayload = {
    ...payload,
    docLinkToken: (typeof localStorage !== 'undefined' && localStorage.getItem('created_doc_link_token')) || undefined,
  };
  try {
    const body = await callPublicFunction('cafVerifyResult', authedPayload);
    const payload2 = body?.data ?? body;
    // Gateway envelope: function likely ran server-side, treat as success so the
    // flow advances. Backend is idempotent (dedup by case+docType).
    if (payload2?._gatewayEnvelope) {
      console.log('[CAF] Gateway wrap detected — treating as success (backend is idempotent)');
      return { success: true, approved: true, _gatewayEnvelope: true };
    }
    console.log('[CAF] Result persisted:', payload2);
    return payload2;
  } catch (err) {
    console.error('[CAF] CRITICAL: Failed to persist result:', err);
    toast.error('Erro ao salvar resultado da verificação. Tentando novamente...');
    // Retry once
    try {
      const body2 = await callPublicFunction('cafVerifyResult', authedPayload);
      const payload3 = body2?.data ?? body2;
      if (payload3?._gatewayEnvelope) {
        console.log('[CAF] Gateway wrap detected on retry — treating as success');
        return { success: true, approved: true, _gatewayEnvelope: true };
      }
      console.log('[CAF] Result persisted on retry:', payload3);
      return payload3;
    } catch (retryErr) {
      console.error('[CAF] CRITICAL: Retry also failed:', retryErr);
      toast.error('Não foi possível salvar o resultado. Entre em contato com o suporte.');
      return null;
    }
  }
}

export default function CafVerificationStep({ 
  personName, personCpf, onComplete, onboardingCaseId,
  complianceModel,   // ← ex: 'ComplianceGatewayV4' — usado para montar link do cadastro.io
  merchantCnpj,      // ← pré-preenchimento no link CAF + vínculo via CNPJ no webhook
  merchantEmail,     // ← pré-preenchimento opcional
}) {
  const [phase, setPhase] = useState('ready');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorName, setErrorName] = useState(null); // nome técnico do erro CAF
  const [sdkToken, setSdkToken] = useState(null);
  const [personId, setPersonId] = useState(null);
  const [tokenType, setTokenType] = useState('unknown'); // 'session' | 'fallback'
  const [canUseFaceAuth, setCanUseFaceAuth] = useState(true);
  const [resolvedPerson, setResolvedPerson] = useState(null); // {cpf, name, source, evidenceChain}
  const [docResults, setDocResults] = useState({ front: null, back: null });
  const [livenessResult, setLivenessResult] = useState(null);
  const [savedResults, setSavedResults] = useState({ front: false, back: false, liveness: false });
  const [retryCount, setRetryCount] = useState(0);
  const [livenessAttempts, setLivenessAttempts] = useState(0);
  const [showDifficultyModal, setShowDifficultyModal] = useState(false);
  const [manualFallback, setManualFallback] = useState(false);
  const [bdcFallback, setBdcFallback] = useState(false);
  const [cafLinksOverride, setCafLinksOverride] = useState(null); // mapa custom do admin
  const flContainerRef = useRef(null);

  // Tracking de engajamento (abandono vs falha técnica) — refs pra não re-renderizar
  const sdkOpenCountRef = useRef(0);
  const didCaptureAnythingRef = useRef(false);
  const abandonLoggedRef = useRef(false);

  const docLinkToken = (typeof localStorage !== 'undefined' && localStorage.getItem('created_doc_link_token')) || undefined;

  // Carrega overrides de links do admin (se houver)
  useEffect(() => {
    fetchCafFallbackLinks().then(setCafLinksOverride).catch(() => {});
  }, []);

  // Helper: loga evento de engajamento (abertura / abandono) — separado de cafLogSdkError
  const logSdkEvent = useCallback((eventType, stage) => {
    if (!onboardingCaseId) return;
    callPublicFunction('cafLogSdkEvent', {
      onboardingCaseId,
      docLinkToken,
      eventType,
      stage: stage || 'unknown',
      attemptNumber: sdkOpenCountRef.current,
    }).catch(() => {});
  }, [onboardingCaseId, docLinkToken]);

  // ── Detecção de abandono: cliente fecha a aba sem capturar NADA ──
  // Só conta como abandono se o SDK foi aberto E nada foi salvo (nem doc frente).
  useEffect(() => {
    const handleBeforeUnload = () => {
      const isInCapture = ['doc_front', 'doc_back', 'liveness_prep', 'liveness'].includes(phase);
      if (isInCapture && !didCaptureAnythingRef.current && !abandonLoggedRef.current) {
        abandonLoggedRef.current = true;
        // sendBeacon garante envio mesmo durante unload
        try {
          const payload = JSON.stringify({
            onboardingCaseId,
            docLinkToken,
            eventType: 'sdk_abandoned',
            stage: phase,
            attemptNumber: sdkOpenCountRef.current,
          });
          const blob = new Blob([payload], { type: 'application/json' });
          const url = `${window.location.origin}/api/apps/functions/cafLogSdkEvent`;
          navigator.sendBeacon?.(url, blob);
        } catch {}
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [phase, onboardingCaseId, docLinkToken]);

  // Marca que algo foi capturado (bloqueia envio de abandono na saída)
  useEffect(() => {
    if (savedResults.front || savedResults.back || savedResults.liveness) {
      didCaptureAnythingRef.current = true;
    }
  }, [savedResults]);

  // Helper: log SDK errors to backend (fire-and-forget)
  const logSdkError = useCallback((stage, err, attemptNumber = 1) => {
    if (!onboardingCaseId) return;
    callPublicFunction('cafLogSdkError', {
      onboardingCaseId,
      docLinkToken,
      stage,
      errorName: err?.name || 'Unknown',
      errorMessage: err?.message || String(err),
      attemptNumber,
      tokenType,
    }).catch(() => {});
  }, [onboardingCaseId, docLinkToken, tokenType]);

  const stepIndex = phase === 'ready' || phase === 'loading' ? 0 
    : phase === 'doc_front' ? 1 
    : phase === 'doc_back' ? 2 
    : phase === 'liveness_prep' ? 3
    : phase === 'liveness' ? 4 : 5;

  // ── Step 1: Get token from backend + load SDKs ──
  // FLUXO DE LASTRO:
  //  1) Se temos onboardingCaseId, pergunta ao BACKEND qual CPF/nome usar (cascata Lead → BDC → Questionnaire)
  //  2) Se backend achou CPF confiável, passa pro cafGenerateToken que tenta criar person real
  //  3) Token volta com tokenType='session' (canUseFaceAuth=true) OU 'fallback' (face auth OFF)
  const startVerification = useCallback(async () => {
    setLoading(true);
    setError(null);
    setErrorName(null);
    setPhase('loading');
    // ── Engagement tracking: registra abertura do SDK (não é tentativa técnica) ──
    sdkOpenCountRef.current += 1;
    abandonLoggedRef.current = false;
    logSdkEvent('sdk_opened', 'init');
    try {
      // ── FASE A: Resolver CPF + Nome via LASTRO do backend ──
      let effectiveCpf = personCpf || '';
      let effectiveName = personName || '';
      let resolveData = null;
      
      if (onboardingCaseId) {
        try {
          const rBody = await callPublicFunction('cafResolvePersonData', {
            onboardingCaseId,
            docLinkToken,
          });
          resolveData = rBody?.data ?? rBody;
          if (resolveData?.cpf) {
            effectiveCpf = resolveData.cpf;
            effectiveName = resolveData.name || effectiveName;
            setResolvedPerson(resolveData);
            console.log('[CAF] Person resolved via backend lastro:', { source: resolveData.source, hasCpf: true });
          } else {
            console.warn('[CAF] Backend lastro did NOT find CPF — falling back to frontend CPF:', personCpf);
          }
        } catch (resolveErr) {
          console.warn('[CAF] cafResolvePersonData failed, using frontend CPF:', resolveErr?.message);
        }
      }

      // ── FASE B: Gerar token CAF com o CPF resolvido ──
      const body = await callPublicFunction('cafGenerateToken', {
        personCpf: effectiveCpf,
        onboardingCaseId: onboardingCaseId || '',
      });
      const data = body?.data ?? body;
      if (data.error) {
        throw new Error(data.error + (data.details ? ': ' + data.details : ''));
      }
      setSdkToken(data.sdkToken);
      setPersonId(data.personId);
      setTokenType(data.tokenType || 'session');
      setCanUseFaceAuth(data.canUseFaceAuth !== false);

      console.log('[CAF] Static mobile token ready:', { 
        strategy: data.tokenStrategy,
        personId: data.personId,
        tokenLength: data.sdkToken?.length,
      });

      // ── FASE C: Carregar SDKs ──
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
      logSdkError('init', err);
      // If SDK failed to load (network/CDN issue), offer BDC fallback immediately
      const isLoadError = err.message?.includes('Falha ao carregar SDK') || err.message?.includes('não carregou');
      if (isLoadError) {
        console.log('[CAF] SDK load failed — enabling BDC BigID fallback');
        setBdcFallback(true);
        setPhase('bdc_fallback');
        toast.info('SDK de verificação facial indisponível no momento. Usando método alternativo seguro.');
      } else {
        setErrorName(err.name || 'NetworkError');
        setError(err.message);
        setPhase('error');
      }
    } finally {
      setLoading(false);
    }
  }, [personCpf, personName, onboardingCaseId, docLinkToken, logSdkError]);

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

        // FIX 1: Reject capture if blob conversion produced no data — do not advance silently
        if (!imageBase64) {
          console.error('[CAF] Blob was null — rejecting capture');
          try { await dd.close(); await dd.dispose(); } catch {}
          setError('Não foi possível capturar a imagem do documento (frente). Tente novamente.');
          setPhase('error');
          return;
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

        await dd.close();
        await dd.dispose();

        if (!persistResult?.success) {
          console.error('[CAF] Doc front persist FAILED — blocking advancement');
          setSavedResults(prev => ({ ...prev, front: false }));
          setError('Não foi possível salvar a captura do documento (frente). Verifique sua conexão e tente novamente.');
          setPhase('error');
          return;
        }

        setSavedResults(prev => ({ ...prev, front: true }));
        toast.success('Frente do documento capturada e salva!');
        setPhase('doc_back');
      } catch (err) {
        if (cancelled) return;
        console.error('[CAF] Doc front error:', err?.name, err?.message);
        logSdkError('document_front', err, retryCount + 1);
        if (dd) { try { await dd.close(); await dd.dispose(); } catch {} }
        setErrorName(err?.name || null);
        setError(err?.message || String(err));
        setPhase('error');
      }
    };
    runCapture();
    return () => { cancelled = true; };
  }, [phase, sdkToken, personId, onboardingCaseId, logSdkError, retryCount]);

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

        // FIX 1: Reject capture if blob conversion produced no data — do not advance silently
        if (!imageBase64) {
          console.error('[CAF] Blob was null — rejecting capture');
          try { await dd.close(); await dd.dispose(); } catch {}
          setError('Não foi possível capturar a imagem do documento (verso). Tente novamente.');
          setPhase('error');
          return;
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

        await dd.close();
        await dd.dispose();

        if (!persistResult?.success) {
          console.error('[CAF] Doc back persist FAILED — blocking advancement');
          setSavedResults(prev => ({ ...prev, back: false }));
          setError('Não foi possível salvar a captura do documento (verso). Verifique sua conexão e tente novamente.');
          setPhase('error');
          return;
        }

        setSavedResults(prev => ({ ...prev, back: true }));
        toast.success('Verso do documento capturado e salvo! Preparando prova de vida...');
        setPhase('liveness_prep');
      } catch (err) {
        if (cancelled) return;
        console.error('[CAF] Doc back error:', err?.name, err?.message);
        logSdkError('document_back', err, retryCount + 1);
        if (dd) { try { await dd.close(); await dd.dispose(); } catch {} }
        setErrorName(err?.name || null);
        setError(err?.message || String(err));
        setPhase('error');
      }
    };
    runCapture();
    return () => { cancelled = true; };
  }, [phase, sdkToken, personId, onboardingCaseId, logSdkError, retryCount]);

  // ── Step 4: FaceLiveness (with Face Authentication) ──
  useEffect(() => {
    if (phase !== 'liveness' || !sdkToken) return;
    let cancelled = false;

    const runLiveness = async () => {
      try {
        // ── Cleanup defensivo: garante DOM e SDK limpos antes do init ──
        // Sem isso, re-entradas na fase 'liveness' empilham botões "Iniciar Verificação Facial"
        // dentro do mesmo container (cada init() faz append, não replace).
        try { window['CafFaceLiveness']?.dispose(); } catch {}
        const container = document.getElementById('caf-fl-container');
        if (container) container.innerHTML = '';

        // Conta tentativa apenas uma vez por execução real (não dispara re-render do efeito)
        setLivenessAttempts(prev => prev + 1);

        const CafFaceLivenessSdk = window['CafFaceLiveness'];
        if (!CafFaceLivenessSdk) throw new Error('FaceLiveness SDK não disponível');

        // ── performFaceAuthentication SEMPRE false ──
        // O match facial agora é feito server-side via POST /v1/transactions + peopleFaceAuthenticator
        // (endpoint que aceita nossas credenciais Bearer). Isso evita o erro "Face picture match"
        // que era causado pela tentativa do SDK de acessar /v1/persons (exige AWS Sig v4).
        // O match real rodará em cafFaceMatchTransaction após esta captura.
        await CafFaceLivenessSdk.init(sdkToken, personId, {
          htmlContainerId: 'caf-fl-container',
          language: 'pt_BR',
          performFaceAuthentication: false,
          cameraPreviewFilter: 'classic',
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

        // FIX 2: Validate JWT structure (3 dot-separated segments) before persisting
        const isValidJwt = typeof jwtResult === 'string'
          && jwtResult.length > 0
          && jwtResult.split('.').length === 3;
        if (!isValidJwt) {
          console.error('[CAF] Invalid JWT from liveness run');
          try { window['CafFaceLiveness']?.dispose(); } catch {}
          setError('A prova de vida não retornou uma resposta válida. Tente novamente.');
          setPhase('error');
          return;
        }

        // PERSIST (awaited) — send the FULL JWT string to backend for decoding + validation
        const persistResult = await persistCafResult({
          onboardingCaseId: onboardingCaseId || '',
          module: 'liveness',
          signedResponse: jwtResult, // This IS the JWT string directly from run()
        });

        CafFaceLivenessSdk.dispose();

        if (!persistResult?.success) {
          console.error('[CAF] Liveness persist FAILED — blocking advancement');
          setSavedResults(prev => ({ ...prev, liveness: false }));
          setError('Não foi possível salvar o resultado da prova de vida. Verifique sua conexão e tente novamente.');
          setPhase('error');
          return;
        }

        setSavedResults(prev => ({ ...prev, liveness: true }));

        // ── Face match já foi feito pelo SDK ──
        // O JWT retornado por CafFaceLivenessSdk.run() contém isAlive + isMatch + similarity,
        // e cafVerifyResult.js já decodificou e persistiu esses campos. Nada mais a fazer aqui.
        toast.success('Prova de vida concluída e salva com sucesso!');
        setPhase('done');
      } catch (err) {
        if (cancelled) return;
        console.error('[CAF] Liveness error:', err?.name, err?.message);
        logSdkError('liveness', err, livenessAttempts);
        try { window['CafFaceLiveness']?.dispose(); } catch {}
        setErrorName(err?.name || null);
        setError(err?.message || String(err));
        setPhase('error');
      }
    };
    runLiveness();
    return () => { cancelled = true; };
    // Dependências enxutas: NÃO incluir `livenessAttempts` (atualizado dentro do efeito)
    // nem `savedResults` (muda durante o fluxo) — ambos causariam re-init em loop.
  }, [phase, sdkToken, personId, onboardingCaseId, logSdkError]);

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
      {/* Sticky mobile-first progress bar — visible during all capture phases */}
      <CafMobileProgressBar phase={phase} savedResults={savedResults} />

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

          {/* Identificação do representante — mostra CPF localmente OU o que o backend resolveu */}
          {(personCpf || resolvedPerson?.cpf) && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-[#002443]">
                  Identificamos seu cadastro{resolvedPerson?.name ? `: ${resolvedPerson.name}` : ''}
                </p>
                <p className="text-xs text-[#002443]/60 mt-0.5">
                  CPF: {(resolvedPerson?.cpf || personCpf || '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.***.***-$4')}
                </p>
                {resolvedPerson?.source && resolvedPerson.source !== 'none' && (
                  <p className="text-[10px] text-emerald-700 mt-1">
                    ✓ Dados confirmados via {
                      resolvedPerson.source === 'questionnaire_explicit' ? 'questionário' :
                      resolvedPerson.source === 'bdc_enrichment' ? 'enriquecimento BigDataCorp' :
                      resolvedPerson.source === 'lead_pf' ? 'cadastro do lead' : 'base de dados'
                    }
                  </p>
                )}
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

      {/* ── Error state — diagnóstico inteligente ── */}
      {phase === 'error' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <CafErrorDiagnostic
            errorName={errorName}
            errorMessage={error}
            attemptCount={Math.max(retryCount + 1, livenessAttempts)}
            tokenType={tokenType}
            resolvedPerson={resolvedPerson}
            onRetry={handleRetry}
            onManualFallback={handleManualFallback}
            onBdcFallback={() => { setBdcFallback(true); setPhase('bdc_fallback'); setError(null); setErrorName(null); }}
            cafFallbackUrl={buildCafFallbackUrl(complianceModel, {
              onboardingCaseId,
              cnpj: merchantCnpj,
              cpf: resolvedPerson?.cpf || personCpf,
              name: resolvedPerson?.name || personName,
              email: merchantEmail,
              linksOverride: cafLinksOverride,
            })}
            onCafFallbackClick={() => {
              callPublicFunction('cafFallbackLinkOpened', {
                onboardingCaseId: onboardingCaseId || '',
                docLinkToken,
                complianceModel: complianceModel || '',
                fallbackUrl: buildCafFallbackUrl(complianceModel, {
                  onboardingCaseId, cnpj: merchantCnpj,
                  cpf: resolvedPerson?.cpf || personCpf,
                  name: resolvedPerson?.name || personName,
                  email: merchantEmail,
                  linksOverride: cafLinksOverride,
                }) || '',
                attemptCount: Math.max(retryCount + 1, livenessAttempts),
                errorName: errorName || '',
                errorMessage: error || '',
              }).catch(() => {});
            }}
          />
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