import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Play, CheckCircle2, XCircle, ChevronDown, ChevronRight } from 'lucide-react';

/**
 * CafBackendTests — testa funções CAF backend-only (sem abrir câmera).
 * Cada teste mostra: duração, status HTTP, response JSON, logs extraídos.
 */

const BACKEND_TESTS = [
  {
    id: 'generateToken',
    name: '1. Generate Session Token',
    description: 'Assina JWT HS256 + troca em /bff/session-tokens. Deve retornar sessionToken.',
    function: 'cafGenerateToken',
    payload: (ctx) => ({ personCpf: ctx.cpf || '12345678909' }),
    success: (data) => !!data?.sdkToken,
  },
  {
    id: 'healthCheck',
    name: '2. Health Check (Core API)',
    description: 'Testa /v1/transactions, /v1/people, /v1/companies com Bearer.',
    function: 'cafHealthCheck',
    payload: () => ({}),
    success: (data) => data?.healthy === true,
  },
  {
    id: 'testAuth',
    name: '3. Test Auth (todos endpoints)',
    description: 'Testa 6 métodos de autenticação CAF de uma vez.',
    function: 'cafTestAuth',
    payload: () => ({}),
    success: (data) => data?.summary?.[0]?.ok === true,
  },
  {
    id: 'resolvePerson',
    name: '4. Resolve Person Data (lastro CPF)',
    description: 'Cascata: Questionnaire → Lead → BDC. Requer onboardingCaseId.',
    function: 'cafResolvePersonData',
    payload: (ctx) => ({ onboardingCaseId: ctx.onboardingCaseId }),
    success: (data) => !!data?.cpf,
    requiresCase: true,
  },
  {
    id: 'faceMatch',
    name: '5. Face Match via Transaction',
    description: 'POST /v1/transactions (peopleFaceAuthenticator) com selfie. Requer onboardingCaseId + selfie uploaded.',
    function: 'cafFaceMatchTransaction',
    payload: (ctx) => ({
      onboardingCaseId: ctx.onboardingCaseId,
      selfieBase64: ctx.selfieBase64,
    }),
    success: (data) => data?.success === true,
    requiresCase: true,
    requiresSelfie: true,
  },
  {
    id: 'fullEnrichment',
    name: '6. Full Enrichment (CPF + KYC)',
    description: 'cafFullEnrichment — busca dados completos do CPF. Requer CPF válido.',
    function: 'cafFullEnrichment',
    payload: (ctx) => ({ cpf: (ctx.cpf || '').replace(/\D/g, ''), onboardingCaseId: ctx.onboardingCaseId || '' }),
    success: (data) => !data?.error,
    requiresCpf: true,
  },
  {
    id: 'getProfile',
    name: '7. Get Profile (PF)',
    description: 'cafGetProfile — busca perfil cadastral pessoa física. Requer CPF.',
    function: 'cafGetProfile',
    payload: (ctx) => ({ cpf: (ctx.cpf || '').replace(/\D/g, '') }),
    success: (data) => !data?.error,
    requiresCpf: true,
  },
];

function ResultBlock({ result }) {
  const [expanded, setExpanded] = useState(false);
  if (!result) return null;
  const { ok, duration, data, error, timestamp } = result;
  return (
    <div className="mt-3 text-xs">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
          {ok ? <><CheckCircle2 className="w-3 h-3 mr-1" /> OK</> : <><XCircle className="w-3 h-3 mr-1" /> FAIL</>}
        </Badge>
        <span className="text-slate-500">{duration}ms</span>
        <span className="text-slate-400 text-[10px]">{timestamp}</span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-auto flex items-center gap-1 text-slate-600 hover:text-slate-900"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          {expanded ? 'Ocultar' : 'Ver JSON'}
        </button>
      </div>
      {error && <p className="mt-2 text-red-600 text-xs">{error}</p>}
      {expanded && (
        <pre className="mt-2 p-3 bg-slate-900 text-slate-100 rounded-lg overflow-auto max-h-96 text-[10px] leading-relaxed">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

export default function CafBackendTests() {
  const [context, setContext] = useState({
    cpf: '',
    onboardingCaseId: '',
    selfieBase64: '',
  });
  const [results, setResults] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  const handleSelfieUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setContext({ ...context, selfieBase64: reader.result });
    reader.readAsDataURL(file);
  };

  const runTest = async (test) => {
    setLoadingId(test.id);
    const start = Date.now();
    try {
      const payload = test.payload(context);
      const res = await base44.functions.invoke(test.function, payload);
      const duration = Date.now() - start;
      const ok = test.success(res.data) && !res.data?.error;
      setResults({
        ...results,
        [test.id]: {
          ok,
          duration,
          data: res.data,
          error: res.data?.error || null,
          timestamp: new Date().toLocaleTimeString(),
        },
      });
    } catch (err) {
      setResults({
        ...results,
        [test.id]: {
          ok: false,
          duration: Date.now() - start,
          data: null,
          error: err.message,
          timestamp: new Date().toLocaleTimeString(),
        },
      });
    } finally {
      setLoadingId(null);
    }
  };

  const runAll = async () => {
    for (const test of BACKEND_TESTS) {
      if (test.requiresCase && !context.onboardingCaseId) continue;
      if (test.requiresSelfie && !context.selfieBase64) continue;
      if (test.requiresCpf && !context.cpf) continue;
      await runTest(test);
    }
  };

  return (
    <div className="space-y-4">
      {/* Context inputs */}
      <Card className="p-4 bg-slate-50 border-slate-200">
        <h3 className="text-sm font-bold text-[#002443] mb-3">Contexto dos Testes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">CPF (para tokens/enrichment)</Label>
            <Input
              value={context.cpf}
              onChange={(e) => setContext({ ...context, cpf: e.target.value })}
              placeholder="12345678909"
              className="h-9 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">OnboardingCase ID (para lastro/match)</Label>
            <Input
              value={context.onboardingCaseId}
              onChange={(e) => setContext({ ...context, onboardingCaseId: e.target.value })}
              placeholder="case_abc123"
              className="h-9 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Selfie (para face match)</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleSelfieUpload}
              className="h-9 text-xs"
            />
            {context.selfieBase64 && (
              <p className="text-[10px] text-green-600 mt-1">✓ {Math.round(context.selfieBase64.length / 1024)}KB carregado</p>
            )}
          </div>
        </div>
        <div className="mt-3">
          <Button onClick={runAll} size="sm" className="bg-[#002443] hover:bg-[#002443]/90 text-white">
            <Play className="w-3.5 h-3.5 mr-2" /> Rodar Todos (pula os que faltam contexto)
          </Button>
        </div>
      </Card>

      {/* Tests */}
      {BACKEND_TESTS.map((test) => {
        const result = results[test.id];
        const isLoading = loadingId === test.id;
        const disabled =
          isLoading ||
          (test.requiresCase && !context.onboardingCaseId) ||
          (test.requiresSelfie && !context.selfieBase64) ||
          (test.requiresCpf && !context.cpf);
        const missingReasons = [];
        if (test.requiresCase && !context.onboardingCaseId) missingReasons.push('onboardingCaseId');
        if (test.requiresSelfie && !context.selfieBase64) missingReasons.push('selfie');
        if (test.requiresCpf && !context.cpf) missingReasons.push('cpf');

        return (
          <Card key={test.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <h4 className="text-sm font-bold text-[#002443]">{test.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{test.description}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">→ {test.function}</p>
                {missingReasons.length > 0 && (
                  <p className="text-[10px] text-amber-600 mt-1">⚠ Falta: {missingReasons.join(', ')}</p>
                )}
              </div>
              <Button
                onClick={() => runTest(test)}
                disabled={disabled}
                size="sm"
                variant={result?.ok ? 'outline' : 'default'}
                className={result?.ok ? '' : 'bg-[#2bc196] hover:bg-[#2bc196]/90 text-white'}
              >
                {isLoading ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Rodando...</>
                ) : (
                  <><Play className="w-3.5 h-3.5 mr-1.5" /> {result ? 'Rodar novamente' : 'Testar'}</>
                )}
              </Button>
            </div>
            <ResultBlock result={result} />
          </Card>
        );
      })}
    </div>
  );
}