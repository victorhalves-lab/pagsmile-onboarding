import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { 
  ScanFace, FileCheck, CheckCircle2, Loader2, AlertCircle,
  Camera, Shield, ArrowRight, RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * CAF SDK Web Integration — DocumentDetector + FaceLiveness
 * 
 * Flow:
 * 1. Backend generates sessionToken (Mobile Token) via cafGenerateToken
 * 2. Load CAF Web SDK scripts (UMD) dynamically
 * 3. Step 1: DocumentDetector captures front + back of document
 * 4. Step 2: FaceLiveness performs liveness check
 * 5. Each step returns a signedResponse → sent to cafVerifyResult for validation
 */

const CAF_DD_SDK_URL = 'https://repo.combateafraude.com/javascript/release/document-detector/6.13.0/document-detector-6.13.0.umd.js';
const CAF_DD_WASM_URL = 'https://repo.combateafraude.com/javascript/release/document-detector/6.13.0/dd-validator.wasm';
const CAF_FL_SDK_URL = 'https://repo.combateafraude.com/javascript/release/caf-face-liveness/0.16.0/caf-face-liveness_0.16.0.umd.js';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) { resolve(); return; }
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load: ${src}`));
    document.body.appendChild(script);
  });
}

const STEPS = [
  { id: 'init', label: 'Preparação', icon: Shield, color: 'blue' },
  { id: 'document_front', label: 'Doc. Frente', icon: FileCheck, color: 'blue' },
  { id: 'document_back', label: 'Doc. Verso', icon: FileCheck, color: 'blue' },
  { id: 'liveness', label: 'Prova de Vida', icon: ScanFace, color: 'purple' },
];

export default function CafVerificationStep({ 
  personName, personCpf, onComplete, onSkip, onboardingCaseId 
}) {
  const [phase, setPhase] = useState('ready'); // ready | loading | doc_front | doc_back | liveness | done | error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sdkToken, setSdkToken] = useState(null);
  const [personId, setPersonId] = useState(null);
  const [docResults, setDocResults] = useState({ front: null, back: null });
  const [livenessResult, setLivenessResult] = useState(null);
  const ddRef = useRef(null);
  const containerRef = useRef(null);
  const flContainerRef = useRef(null);

  // Get current step index for indicator
  const stepIndex = phase === 'ready' || phase === 'loading' ? 0 
    : phase === 'doc_front' ? 1 
    : phase === 'doc_back' ? 2 
    : phase === 'liveness' ? 3 : 4;

  // Step 1: Get token from backend + load SDKs
  const startVerification = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPhase('loading');
    try {
      // Get token from backend
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

      // Load SDK scripts in parallel
      await Promise.all([
        loadScript(CAF_DD_SDK_URL),
        loadScript(CAF_FL_SDK_URL),
      ]);

      toast.success('SDK carregado! Iniciando captura do documento...');
      setPhase('doc_front');
    } catch (err) {
      console.error('[CAF] Init error:', err);
      setError(err.message);
      setPhase('error');
      toast.error('Erro ao iniciar verificação');
    } finally {
      setLoading(false);
    }
  }, [personCpf, onboardingCaseId]);

  // Step 2: Run DocumentDetector for front capture
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
        ddRef.current = dd;

        await dd.initialize();
        const result = await dd.capture({
          expectedDocument: 'rg_front',
          mode: 'automatic',
          automaticCaptureMaxDuration: 60,
          personID: personId,
        });

        if (cancelled) return;
        console.log('[CAF] Doc front captured:', result);
        setDocResults(prev => ({ ...prev, front: result }));

        // Verify on backend
        if (result?.signedResponse) {
          base44.functions.invoke('cafVerifyResult', {
            signedResponse: result.signedResponse,
            onboardingCaseId: onboardingCaseId || '',
            module: 'document',
          }).catch(e => console.warn('[CAF] Doc front verify log failed:', e));
        }

        await dd.close();
        toast.success('Frente do documento capturada!');
        setPhase('doc_back');
      } catch (err) {
        if (cancelled) return;
        console.error('[CAF] Doc front error:', err);
        if (dd) { try { await dd.close(); await dd.dispose(); } catch {} }
        setError('Erro na captura do documento (frente): ' + (err.message || err));
        setPhase('error');
      }
    };
    runCapture();
    return () => { cancelled = true; };
  }, [phase, sdkToken, personId, onboardingCaseId]);

  // Step 3: Run DocumentDetector for back capture
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

        await dd.initialize();
        const result = await dd.capture({
          expectedDocument: 'rg_back',
          mode: 'automatic',
          automaticCaptureMaxDuration: 60,
          personID: personId,
        });

        if (cancelled) return;
        console.log('[CAF] Doc back captured:', result);
        setDocResults(prev => ({ ...prev, back: result }));

        if (result?.signedResponse) {
          base44.functions.invoke('cafVerifyResult', {
            signedResponse: result.signedResponse,
            onboardingCaseId: onboardingCaseId || '',
            module: 'document',
          }).catch(e => console.warn('[CAF] Doc back verify log failed:', e));
        }

        await dd.close();
        await dd.dispose();
        toast.success('Verso do documento capturado! Iniciando prova de vida...');
        setPhase('liveness');
      } catch (err) {
        if (cancelled) return;
        console.error('[CAF] Doc back error:', err);
        if (dd) { try { await dd.close(); await dd.dispose(); } catch {} }
        setError('Erro na captura do documento (verso): ' + (err.message || err));
        setPhase('error');
      }
    };
    runCapture();
    return () => { cancelled = true; };
  }, [phase, sdkToken, personId, onboardingCaseId]);

  // Step 4: Run FaceLiveness
  useEffect(() => {
    if (phase !== 'liveness' || !sdkToken) return;
    let cancelled = false;

    const runLiveness = async () => {
      try {
        const CafFaceLivenessSdk = window['CafFaceLiveness'];
        if (!CafFaceLivenessSdk) throw new Error('FaceLiveness SDK not loaded');

        await CafFaceLivenessSdk.init(sdkToken, personId, {
          htmlContainerId: 'caf-fl-container',
        });

        const result = await CafFaceLivenessSdk.run();
        if (cancelled) return;

        console.log('[CAF] Liveness result:', result);
        setLivenessResult(result);

        // Verify on backend
        if (result?.signedResponse) {
          base44.functions.invoke('cafVerifyResult', {
            signedResponse: result.signedResponse,
            onboardingCaseId: onboardingCaseId || '',
            module: 'liveness',
          }).catch(e => console.warn('[CAF] Liveness verify log failed:', e));
        }

        CafFaceLivenessSdk.dispose();
        toast.success('Prova de vida concluída com sucesso!');
        setPhase('done');
      } catch (err) {
        if (cancelled) return;
        console.error('[CAF] Liveness error:', err);
        try { window['CafFaceLiveness']?.dispose(); } catch {}
        setError('Erro na prova de vida: ' + (err.message || err));
        setPhase('error');
      }
    };
    runLiveness();
    return () => { cancelled = true; };
  }, [phase, sdkToken, personId, onboardingCaseId]);

  // When all done, notify parent
  useEffect(() => {
    if (phase === 'done') {
      onComplete?.({
        transactionId: livenessResult?.signedResponse || 'caf_sdk_completed',
        status: 'approved',
        docFront: docResults.front,
        docBack: docResults.back,
        liveness: livenessResult,
      });
    }
  }, [phase]);

  // === RENDER ===

  if (phase === 'done') {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-[#002443] mb-2">Verificação Concluída!</h3>
        <p className="text-sm text-[#002443]/60 mb-6">
          Documento e prova de vida verificados com sucesso.
        </p>
        <Button
          onClick={() => onComplete?.({ status: 'approved' })}
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
        <h2 className="text-xl font-bold text-[#002443] mb-2">Verificação de Identidade</h2>
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
                isActive ? 'bg-purple-50 border-purple-200 text-purple-700' :
                'bg-slate-50 border-slate-200 text-slate-500'
              }`}>
                {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> : 
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />}
                <span className="hidden sm:inline">{step.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Ready state — show instructions and start button */}
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
            {onSkip && (
              <Button variant="outline" onClick={onSkip} className="text-slate-500 border-slate-200 h-12 rounded-xl">
                Pular
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Loading state */}
      {phase === 'loading' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500 mx-auto mb-4" />
          <p className="text-sm font-medium text-[#002443]">Carregando SDK de verificação...</p>
          <p className="text-xs text-[#002443]/50 mt-1">Obtendo token seguro e preparando a câmera.</p>
        </div>
      )}

      {/* Active capture phases (doc_front, doc_back, liveness) — SDKs render their own UI as modals/overlays */}
      {(phase === 'doc_front' || phase === 'doc_back') && (
        <div className="bg-white rounded-2xl border border-purple-200 p-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-50 mb-3">
            <FileCheck className="w-6 h-6 text-blue-600 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-[#002443] mb-2">
            {phase === 'doc_front' ? 'Capture a Frente do Documento' : 'Capture o Verso do Documento'}
          </h3>
          <p className="text-sm text-[#002443]/60">
            {phase === 'doc_front' 
              ? 'Posicione a frente do seu RG ou CNH na câmera. O SDK fará a captura automaticamente.'
              : 'Agora posicione o verso do documento. A captura será automática.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-purple-600 font-medium">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Aguardando captura...
          </div>
        </div>
      )}

      {phase === 'liveness' && (
        <div className="bg-white rounded-2xl border border-purple-200 p-6">
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-50 mb-3">
              <ScanFace className="w-6 h-6 text-purple-600 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-[#002443] mb-2">Prova de Vida</h3>
            <p className="text-sm text-[#002443]/60">
              Siga as instruções na tela para completar a verificação facial.
            </p>
          </div>
          {/* Container where FaceLiveness SDK renders */}
          <div id="caf-fl-container" ref={flContainerRef} className="min-h-[300px]" />
        </div>
      )}

      {/* Error state */}
      {phase === 'error' && (
        <div className="bg-white rounded-2xl border border-red-200 p-6 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-50 mb-2">
            <AlertCircle className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-lg font-bold text-[#002443]">Erro na Verificação</h3>
          <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button
              onClick={() => { setPhase('ready'); setError(null); setDocResults({ front: null, back: null }); }}
              className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white px-6 h-11 rounded-xl"
            >
              <RefreshCw className="w-4 h-4 mr-2" /> Tentar Novamente
            </Button>
            {onSkip && (
              <Button variant="outline" onClick={onSkip} className="border-slate-200 text-slate-500 h-11 rounded-xl">
                Pular Verificação
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Security notice */}
      <div className="flex items-start gap-3 bg-slate-50 rounded-xl p-4">
        <Shield className="w-5 h-5 text-[#002443]/40 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-[#002443]">Verificação segura</p>
          <p className="text-xs text-[#002443]/50 mt-1">
            Tecnologia certificada pela CAF (Combate à Fraude) com detecção de documentos e prova de vida em tempo real.
          </p>
        </div>
      </div>
    </div>
  );
}