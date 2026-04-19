import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, CheckCircle2, XCircle, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';

/**
 * CafSdkTests — testa o SDK Web da CAF (abre câmera real).
 * Testes isolados: DocumentDetector (frente/verso) e FaceLiveness.
 */

const CAF_DD_SDK_URL = 'https://repo.combateafraude.com/javascript/release/document-detector/6.13.0/document-detector-6.13.0.umd.js';
const CAF_DD_WASM_URL = 'https://repo.combateafraude.com/javascript/release/document-detector/6.13.0/dd-validator.wasm';
const CAF_FL_SDK_URL = 'https://repo.combateafraude.com/javascript/release/caf-face-liveness/0.16.0/caf-face-liveness_0.16.0.umd.js';

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-caf-lab="${src}"]`);
    if (existing && existing.dataset.loaded === 'true') return resolve();
    if (existing) existing.remove();
    // NO crossorigin attribute — CAF CDN doesn't set CORS headers for script tags,
    // and crossorigin="anonymous" forces CORS mode which then fails silently.
    // Plain <script> tag works because browser doesn't require CORS for classic scripts.
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.setAttribute('data-caf-lab', src);
    s.onload = () => { s.dataset.loaded = 'true'; resolve(); };
    s.onerror = (ev) => {
      // Network blocked (AdBlock/CSP/DNS) — script never executes
      reject(new Error(`Falha ao carregar ${src} — verifique bloqueadores (AdBlock/uBlock), CSP do navegador ou conectividade com repo.combateafraude.com`));
    };
    document.body.appendChild(s);
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

function ResultBlock({ result }) {
  const [expanded, setExpanded] = useState(false);
  if (!result) return null;
  return (
    <div className="mt-3 text-xs">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={result.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
          {result.ok ? <><CheckCircle2 className="w-3 h-3 mr-1" /> OK</> : <><XCircle className="w-3 h-3 mr-1" /> FAIL</>}
        </Badge>
        <span className="text-slate-500">{result.duration}ms</span>
        <span className="text-slate-400 text-[10px]">{result.timestamp}</span>
        {result.data && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="ml-auto flex items-center gap-1 text-slate-600 hover:text-slate-900"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {expanded ? 'Ocultar' : 'Ver resultado'}
          </button>
        )}
      </div>
      {result.error && <p className="mt-2 text-red-600 text-xs">{result.error}</p>}
      {expanded && result.data && (
        <pre className="mt-2 p-3 bg-slate-900 text-slate-100 rounded-lg overflow-auto max-h-96 text-[10px] leading-relaxed">
          {JSON.stringify(result.data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function CafSdkTests() {
  const [sdkToken, setSdkToken] = useState(null);
  const [personId, setPersonId] = useState(null);
  const [sdksLoaded, setSdksLoaded] = useState(false);
  const [loadingSdk, setLoadingSdk] = useState(false);
  const [initError, setInitError] = useState(null);
  const [activeTest, setActiveTest] = useState(null); // 'doc_front' | 'doc_back' | 'liveness'
  const [results, setResults] = useState({});
  const flContainerRef = useRef(null);

  const initSdks = async () => {
    setLoadingSdk(true);
    setInitError(null);
    try {
      // 1. Get fresh session token
      const tokenRes = await base44.functions.invoke('cafGenerateToken', { personCpf: '12345678909' });
      if (tokenRes.data?.error) throw new Error(tokenRes.data.error);
      setSdkToken(tokenRes.data.sdkToken);
      setPersonId(tokenRes.data.personId);

      // 2. Load SDK scripts (sequencial — assim identificamos qual falhou)
      preloadWasm(CAF_DD_WASM_URL);
      try {
        await loadScript(CAF_DD_SDK_URL);
      } catch (e) {
        throw new Error(`[DocumentDetector SDK] ${e.message}`);
      }
      try {
        await loadScript(CAF_FL_SDK_URL);
      } catch (e) {
        throw new Error(`[FaceLiveness SDK] ${e.message}`);
      }

      const ddModule = window['@combateafraude/document-detector'];
      const flModule = window['CafFaceLiveness'];
      if (!ddModule?.DocumentDetector) throw new Error('DocumentDetector carregou mas window["@combateafraude/document-detector"].DocumentDetector está undefined');
      if (!flModule) throw new Error('FaceLiveness carregou mas window["CafFaceLiveness"] está undefined');

      setSdksLoaded(true);
    } catch (err) {
      setInitError(err.message);
    } finally {
      setLoadingSdk(false);
    }
  };

  const runDocDetector = async (side) => {
    setActiveTest(side === 'front' ? 'doc_front' : 'doc_back');
    const testId = side === 'front' ? 'doc_front' : 'doc_back';
    const start = Date.now();
    let dd = null;
    try {
      const { DocumentDetector } = window['@combateafraude/document-detector'];
      dd = new DocumentDetector({
        token: sdkToken,
        language: 'pt_BR',
        blockExecutionOnDesktops: false,
        enableFramingAnalyzer: true,
        enableVisibilityChangeSecurity: true,
        appearance: {
          capture: { captureButtonColor: '#2bc196' },
          upload: {
            startScreen: { allowButton: { backgroundColor: '#2bc196' } },
            successScreen: { icon: { color: '#2bc196' } },
          },
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
      await dd.close();
      await dd.dispose();
      setResults({
        ...results,
        [testId]: {
          ok: !!result?.isCaptureValid,
          duration: Date.now() - start,
          data: {
            detectedDocument: result?.detectedDocument,
            isCaptureValid: result?.isCaptureValid,
            hasBlob: !!result?.image?.blob,
            hasUrl: !!result?.image?.url,
            storageKey: result?.image?.storageInfo?.key,
            blobSize: result?.image?.blob?.size,
          },
          timestamp: new Date().toLocaleTimeString(),
        },
      });
    } catch (err) {
      if (dd) { try { await dd.close(); await dd.dispose(); } catch {} }
      setResults({
        ...results,
        [testId]: {
          ok: false,
          duration: Date.now() - start,
          data: null,
          error: `${err.name || 'Error'}: ${err.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      });
    } finally {
      setActiveTest(null);
    }
  };

  const runLiveness = async () => {
    setActiveTest('liveness');
    const start = Date.now();
    try {
      const FL = window['CafFaceLiveness'];
      if (!FL) throw new Error('FaceLiveness SDK não carregado');
      await FL.init(sdkToken, personId, {
        htmlContainerId: 'caf-lab-fl-container',
        language: 'pt_BR',
        performFaceAuthentication: false,
        cameraPreviewFilter: 'classic',
      }, {
        startButton: {
          label: 'Iniciar',
          backgroundColor: '#2bc196',
          color: '#ffffff',
          borderRadius: '12px',
        },
      });
      const jwtResult = await FL.run({
        onCaptureProcessingStart: () => console.log('[LAB] liveness processing start'),
        onCaptureProcessingEnd: () => console.log('[LAB] liveness processing end'),
      });
      FL.dispose();

      // Decode JWT payload (no validation, just inspect)
      let payload = null;
      try {
        const parts = String(jwtResult).split('.');
        if (parts.length === 3) {
          payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        }
      } catch {}

      setResults({
        ...results,
        liveness: {
          ok: true,
          duration: Date.now() - start,
          data: {
            jwtLength: jwtResult?.length,
            jwtPrefix: String(jwtResult).substring(0, 50) + '...',
            payloadDecoded: payload,
            isAlive: payload?.isAlive,
            sessionId: payload?.sessionId,
            imageUrl: payload?.imageUrl,
          },
          timestamp: new Date().toLocaleTimeString(),
        },
      });
    } catch (err) {
      try { window['CafFaceLiveness']?.dispose(); } catch {}
      setResults({
        ...results,
        liveness: {
          ok: false,
          duration: Date.now() - start,
          data: null,
          error: `${err.name || 'Error'}: ${err.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      });
    } finally {
      setActiveTest(null);
    }
  };

  const reset = () => {
    setSdkToken(null);
    setPersonId(null);
    setSdksLoaded(false);
    setInitError(null);
    setResults({});
  };

  return (
    <div className="space-y-4">
      {/* Init SDK */}
      <Card className="p-4 bg-purple-50 border-purple-200">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[#002443]">Inicializar SDK</h3>
            <p className="text-xs text-slate-600 mt-0.5">
              Gera Session Token fresco + carrega DocumentDetector + FaceLiveness scripts.
            </p>
            {sdksLoaded && (
              <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
                <Badge className="bg-green-100 text-green-700">Token: {sdkToken?.substring(0, 20)}...</Badge>
                <Badge className="bg-green-100 text-green-700">PersonId: {personId}</Badge>
                <Badge className="bg-green-100 text-green-700">Scripts carregados ✓</Badge>
              </div>
            )}
            {initError && <p className="text-xs text-red-600 mt-2">❌ {initError}</p>}
          </div>
          {!sdksLoaded ? (
            <Button
              onClick={initSdks}
              disabled={loadingSdk}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {loadingSdk ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Carregando...</>
              ) : (
                <><Play className="w-3.5 h-3.5 mr-1.5" /> Inicializar</>
              )}
            </Button>
          ) : (
            <Button onClick={reset} variant="outline" size="sm">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Reset
            </Button>
          )}
        </div>
      </Card>

      {/* DocumentDetector Frente */}
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h4 className="text-sm font-bold text-[#002443]">8. Document Detector — FRENTE</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Abre câmera. Capture um RG/CNH de frente. Retorna blob + metadata.
            </p>
          </div>
          <Button
            onClick={() => runDocDetector('front')}
            disabled={!sdksLoaded || activeTest !== null}
            size="sm"
            className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white"
          >
            {activeTest === 'doc_front' ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Capturando...</>
            ) : (
              <><Play className="w-3.5 h-3.5 mr-1.5" /> Testar Frente</>
            )}
          </Button>
        </div>
        <ResultBlock result={results.doc_front} />
      </Card>

      {/* DocumentDetector Verso */}
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h4 className="text-sm font-bold text-[#002443]">9. Document Detector — VERSO</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Abre câmera novamente. Vire o documento e capture o verso.
            </p>
          </div>
          <Button
            onClick={() => runDocDetector('back')}
            disabled={!sdksLoaded || activeTest !== null}
            size="sm"
            className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white"
          >
            {activeTest === 'doc_back' ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Capturando...</>
            ) : (
              <><Play className="w-3.5 h-3.5 mr-1.5" /> Testar Verso</>
            )}
          </Button>
        </div>
        <ResultBlock result={results.doc_back} />
      </Card>

      {/* FaceLiveness */}
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h4 className="text-sm font-bold text-[#002443]">10. Face Liveness (Prova de Vida)</h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Abre câmera frontal. Siga as instruções para prova de vida. Retorna JWT com isAlive + sessionId.
            </p>
          </div>
          <Button
            onClick={runLiveness}
            disabled={!sdksLoaded || activeTest !== null}
            size="sm"
            className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white"
          >
            {activeTest === 'liveness' ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Capturando...</>
            ) : (
              <><Play className="w-3.5 h-3.5 mr-1.5" /> Testar Liveness</>
            )}
          </Button>
        </div>
        {/* FaceLiveness renderiza dentro deste container */}
        <div
          id="caf-lab-fl-container"
          ref={flContainerRef}
          className="mt-4 min-h-[300px] rounded-xl overflow-hidden border border-slate-200 bg-slate-50"
          style={{ display: activeTest === 'liveness' ? 'block' : 'none' }}
        />
        <ResultBlock result={results.liveness} />
      </Card>
    </div>
  );
}