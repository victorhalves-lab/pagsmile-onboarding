import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Play, CheckCircle2, XCircle, ChevronDown, ChevronRight,
  KeyRound, ShieldCheck, ShieldAlert, Zap, Info, Upload, Search
} from 'lucide-react';

/**
 * CafConnectTests — testa a NOVA Connect API (api.us.prd.caf.io)
 *
 * 1. Permissions Probe: descobre o que as credenciais atuais podem fazer
 * 2. OAuth2 token: valida client_credentials
 * 3. KYB via Connect: cria transaction com templateId do Trust
 */

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

export default function CafConnectTests() {
  const [ctx, setCtx] = useState({ cnpj: '', cpf: '', templateId: '', onboardingCaseId: '', transactionId: '' });
  const [selfieB64, setSelfieB64] = useState('');
  const [docFrontB64, setDocFrontB64] = useState('');
  const [docBackB64, setDocBackB64] = useState('');
  const [results, setResults] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  const handleFile = (setter) => (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onloadend = () => setter(r.result);
    r.readAsDataURL(f);
  };

  const runTest = async (id, fn, successCheck = () => true) => {
    setLoadingId(id);
    const start = Date.now();
    try {
      const res = await fn();
      const duration = Date.now() - start;
      const data = res?.data || res;
      const ok = !data?.error && successCheck(data);
      setResults((prev) => ({
        ...prev,
        [id]: {
          ok, duration, data, error: data?.error || null,
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [id]: {
          ok: false, duration: Date.now() - start, data: null,
          error: err.message, timestamp: new Date().toLocaleTimeString(),
        },
      }));
    } finally {
      setLoadingId(null);
    }
  };

  // Extract permission summary from probe result
  const probeResult = results.probe?.data;
  const allowed = probeResult?.summary?.allowedPermissions || [];
  const denied = probeResult?.summary?.deniedPermissions || [];

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <Card className="p-4 bg-purple-50 border-purple-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          <div className="text-xs text-purple-900">
            <p className="font-bold">Connect API (api.us.prd.caf.io) — OAuth2</p>
            <p className="mt-1 opacity-80">
              Nova API da CAF. Autenticação via <code className="bg-white/70 px-1 rounded">client_credentials</code> (secrets
              {' '}<code className="bg-white/70 px-1 rounded">CAF_CONNECT_CLIENT_ID</code> + <code className="bg-white/70 px-1 rounded">CAF_CONNECT_CLIENT_SECRET</code>).
              A permissão para cada endpoint é definida na Application em trust.caf.io.
              <strong> O teste 1 descobre o que as credenciais atuais podem fazer.</strong>
            </p>
          </div>
        </div>
      </Card>

      {/* Context inputs */}
      <Card className="p-4 bg-slate-50 border-slate-200">
        <h3 className="text-sm font-bold text-[#002443] mb-3">Contexto (para o teste 3)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label className="text-xs">CNPJ (KYB PJ) ou deixe vazio</Label>
            <Input
              value={ctx.cnpj}
              onChange={(e) => setCtx({ ...ctx, cnpj: e.target.value })}
              placeholder="00000000000000"
              className="h-9 text-sm font-mono"
            />
          </div>
          <div>
            <Label className="text-xs">CPF (KYC PF) — alternativo ao CNPJ</Label>
            <Input
              value={ctx.cpf}
              onChange={(e) => setCtx({ ...ctx, cpf: e.target.value })}
              placeholder="12345678909"
              className="h-9 text-sm font-mono"
            />
          </div>
          <div>
            <Label className="text-xs">Query Template ID (Trust)</Label>
            <Input
              value={ctx.templateId}
              onChange={(e) => setCtx({ ...ctx, templateId: e.target.value })}
              placeholder="62b620ee3f07fb0009361111"
              className="h-9 text-sm font-mono"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Crie em trust.caf.io → Query Templates
            </p>
          </div>
        </div>
      </Card>

      {/* TEST 1: Permissions Probe */}
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              <h4 className="text-sm font-bold text-[#002443]">
                1. Permissions Probe (diagnóstico)
              </h4>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Sonda 6 endpoints da Connect API e reporta quais estão liberados/negados.
              <strong> Não cria transação</strong> — usa bodies inválidos para forçar 400 (allowed) vs 403 (denied).
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-mono">→ cafConnectProbePermissions</p>
          </div>
          <Button
            onClick={() => runTest('probe',
              () => base44.functions.invoke('cafConnectProbePermissions', {}),
              (d) => Array.isArray(d?.summary?.allowedPermissions)
            )}
            disabled={loadingId === 'probe'}
            size="sm"
            className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white"
          >
            {loadingId === 'probe' ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Sondando...</>
            ) : (
              <><Play className="w-3.5 h-3.5 mr-1.5" /> Testar</>
            )}
          </Button>
        </div>
        <ResultBlock result={results.probe} />

        {/* Summary grid after probe */}
        {probeResult?.summary && (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <p className="text-[10px] font-bold text-green-800 uppercase mb-1.5">
                ✅ Liberadas ({allowed.length})
              </p>
              {allowed.length > 0 ? (
                <ul className="space-y-0.5">
                  {allowed.map((p) => (
                    <li key={p} className="text-xs text-green-700">• {p}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-green-700/50">Nenhuma</p>
              )}
            </div>
            <div className="p-3 rounded-lg bg-red-50 border border-red-200">
              <p className="text-[10px] font-bold text-red-800 uppercase mb-1.5">
                ❌ Negadas ({denied.length})
              </p>
              {denied.length > 0 ? (
                <ul className="space-y-0.5">
                  {denied.map((p) => (
                    <li key={p} className="text-xs text-red-700">• {p}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-red-700/50">Nenhuma</p>
              )}
              {denied.length > 0 && (
                <p className="text-[10px] text-red-600 mt-2 pt-2 border-t border-red-200">
                  💡 Para liberar: acesse trust.caf.io → sua Application → adicione as permissões faltantes.
                </p>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* TEST 2: Full test suite */}
      <Card className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-purple-600" />
              <h4 className="text-sm font-bold text-[#002443]">
                2. OAuth2 + Read Endpoints (suite completa)
              </h4>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Faz o OAuth2 client_credentials + 3 leituras (transactions, person, company).
              Mostra token cacheado entre chamadas consecutivas.
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-mono">→ cafConnectTestSuite</p>
          </div>
          <Button
            onClick={() => runTest('suite',
              () => base44.functions.invoke('cafConnectTestSuite', {}),
              (d) => d?.success === true
            )}
            disabled={loadingId === 'suite'}
            size="sm"
            className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white"
          >
            {loadingId === 'suite' ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Rodando...</>
            ) : (
              <><Play className="w-3.5 h-3.5 mr-1.5" /> Testar</>
            )}
          </Button>
        </div>
        <ResultBlock result={results.suite} />
      </Card>

      {/* TEST 4: Create Transaction with documents (main flow) */}
      <Card className="p-4 border-[#2bc196] bg-[#2bc196]/5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#2bc196]" />
              <h4 className="text-sm font-bold text-[#002443]">
                4. Create Transaction COM documentos (fluxo principal) ⚠️
              </h4>
              <Badge className="bg-[#2bc196] text-white text-[9px]">MAIN</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload multipart de cada imagem em <code className="bg-white/60 px-1">/v1/transactions/files</code> +
              criação da transação em <code className="bg-white/60 px-1">/v1/transactions?origin=TRUST</code>.
              <strong className="text-[#002443]"> Este é o endpoint que será usado em produção.</strong>
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-mono">→ cafConnectCreateTransaction</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div>
            <Label className="text-xs">OnboardingCase ID</Label>
            <Input
              value={ctx.onboardingCaseId}
              onChange={(e) => setCtx({ ...ctx, onboardingCaseId: e.target.value })}
              placeholder="69e65d61f5e31d7556f62ebc"
              className="h-9 text-sm font-mono"
            />
          </div>
          <div>
            <Label className="text-xs">Selfie (file)</Label>
            <Input type="file" accept="image/*" onChange={handleFile(setSelfieB64)} className="h-9 text-xs" />
            {selfieB64 && <p className="text-[10px] text-green-600 mt-0.5">✓ {Math.round(selfieB64.length / 1024)}KB</p>}
          </div>
          <div>
            <Label className="text-xs">Documento Frente (file)</Label>
            <Input type="file" accept="image/*" onChange={handleFile(setDocFrontB64)} className="h-9 text-xs" />
            {docFrontB64 && <p className="text-[10px] text-green-600 mt-0.5">✓ {Math.round(docFrontB64.length / 1024)}KB</p>}
          </div>
          <div>
            <Label className="text-xs">Documento Verso (file)</Label>
            <Input type="file" accept="image/*" onChange={handleFile(setDocBackB64)} className="h-9 text-xs" />
            {docBackB64 && <p className="text-[10px] text-green-600 mt-0.5">✓ {Math.round(docBackB64.length / 1024)}KB</p>}
          </div>
        </div>

        <div className="flex items-center justify-end mt-4">
          <Button
            onClick={() => {
              const images = [];
              if (selfieB64) images.push({ type: 'SELFIE', base64: selfieB64 });
              if (docFrontB64) images.push({ type: 'FRONT', base64: docFrontB64 });
              if (docBackB64) images.push({ type: 'BACK', base64: docBackB64 });
              return runTest('createTx',
                () => base44.functions.invoke('cafConnectCreateTransaction', {
                  onboardingCaseId: ctx.onboardingCaseId,
                  templateId: ctx.templateId,
                  attributes: {
                    ...(ctx.cpf ? { cpf: ctx.cpf.replace(/\D/g, '') } : {}),
                    ...(ctx.cnpj ? { cnpj: ctx.cnpj.replace(/\D/g, '') } : {}),
                  },
                  images,
                }),
                (d) => d?.success === true
              );
            }}
            disabled={
              loadingId === 'createTx' ||
              !ctx.onboardingCaseId ||
              !ctx.templateId ||
              (!selfieB64 && !docFrontB64 && !docBackB64)
            }
            size="sm"
            className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white"
          >
            {loadingId === 'createTx' ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Enviando...</>
            ) : (
              <><Play className="w-3.5 h-3.5 mr-1.5" /> Enviar Transação CAF (real)</>
            )}
          </Button>
        </div>
        {(!ctx.onboardingCaseId || !ctx.templateId) && (
          <p className="text-[10px] text-amber-700 mt-2">⚠ Precisa: onboardingCaseId + templateId + pelo menos 1 imagem</p>
        )}
        <ResultBlock result={results.createTx} />

        {/* Se sucesso, mostra campo pra buscar resultado */}
        {results.createTx?.data?.transactionId && (
          <div className="mt-3 pt-3 border-t border-[#2bc196]/20">
            <p className="text-xs text-[#002443] font-semibold mb-1">
              ✅ Transaction criada: <code className="font-mono bg-white/60 px-1">{results.createTx.data.transactionId}</code>
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setCtx((p) => ({ ...p, transactionId: results.createTx.data.transactionId }));
                runTest('getTx',
                  () => base44.functions.invoke('cafConnectGetTransaction', {
                    transactionId: results.createTx.data.transactionId,
                    includeCroppedImages: true,
                  }),
                  (d) => d?.success === true
                );
              }}
              disabled={loadingId === 'getTx'}
              className="mt-1"
            >
              {loadingId === 'getTx' ? (
                <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Buscando...</>
              ) : (
                <><Search className="w-3.5 h-3.5 mr-1.5" /> Buscar resultado dessa tx</>
              )}
            </Button>
            <ResultBlock result={results.getTx} />
          </div>
        )}
      </Card>

      {/* TEST 3: KYB real (consume credits) */}
      <Card className="p-4 border-amber-200 bg-amber-50/30">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-600" />
              <h4 className="text-sm font-bold text-[#002443]">
                3. KYB Search via Connect ⚠️ (consome créditos)
              </h4>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cria uma transaction real na Connect API usando o templateId + CPF/CNPJ informados.
              <strong className="text-amber-700"> Só funciona se "Create Transaction" estiver liberado no probe.</strong>
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-mono">→ cafConnectKybSearch</p>
            {!ctx.templateId && (
              <p className="text-[10px] text-amber-600 mt-1">⚠ Falta: templateId</p>
            )}
            {!ctx.cnpj && !ctx.cpf && (
              <p className="text-[10px] text-amber-600 mt-1">⚠ Falta: CNPJ ou CPF</p>
            )}
          </div>
          <Button
            onClick={() => runTest('kyb',
              () => base44.functions.invoke('cafConnectKybSearch', {
                cnpj: ctx.cnpj.replace(/\D/g, '') || undefined,
                cpf: ctx.cpf.replace(/\D/g, '') || undefined,
                templateId: ctx.templateId,
              }),
              (d) => d?.success === true
            )}
            disabled={
              loadingId === 'kyb' ||
              !ctx.templateId ||
              (!ctx.cnpj && !ctx.cpf)
            }
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            {loadingId === 'kyb' ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Criando...</>
            ) : (
              <><Play className="w-3.5 h-3.5 mr-1.5" /> Testar (real)</>
            )}
          </Button>
        </div>
        <ResultBlock result={results.kyb} />
      </Card>

      {/* Help */}
      <Card className="p-4 bg-slate-50 border-slate-200">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600">
            <p className="font-semibold text-[#002443]">Como liberar mais permissões</p>
            <p className="mt-1 opacity-80">
              1. Acesse <a href="https://trust.caf.io/" target="_blank" rel="noreferrer" className="text-[#2bc196] underline">trust.caf.io</a> → <strong>Developers</strong> → <strong>Applications</strong>
              <br />
              2. Selecione a Application usada (mesma que gerou <code>CAF_CONNECT_CLIENT_ID</code>)
              <br />
              3. Em <strong>Permissions</strong>, habilite: Create Onboarding, Read People Profiles, Read Company Profiles, Read Face Authentication Attempts
              <br />
              4. Salve — as novas permissões valem para os próximos tokens (em até 1h, pois o token atual pode estar cacheado por ~59min).
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}