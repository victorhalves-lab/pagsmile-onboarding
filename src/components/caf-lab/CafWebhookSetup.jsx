import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Webhook, Copy, Check, ExternalLink, Shield, AlertTriangle,
  Loader2, Key, Zap, Globe, Lock, CheckCircle2, XCircle
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * CafWebhookSetup — gera URL oficial do webhook + guia passo-a-passo
 * para registrar no Trust portal da CAF.
 */

const EVENTS_LIST = [
  { id: 'TRANSACTIONPROCESSSTARTEDEVENT', label: 'Transaction Process Started', desc: 'Transação iniciou processamento' },
  { id: 'TRANSACTIONSTATUSUPDATED', label: 'Transaction Status Updated', desc: 'Status atualizado (APPROVED/REPROVED)', critical: true },
  { id: 'TRANSACTIONDOCUMENTSCOPYREQUESTEDEVENT', label: 'Documentscopy Requested', desc: 'Análise documentoscópica solicitada' },
  { id: 'FACEAUTHENTICATIONEVENT', label: 'Face Authentication', desc: 'Autenticação facial processada' },
  { id: 'PROFILEUPDATEDEVENT', label: 'Profile Updated', desc: 'Status do profile (PF/PJ) mudou', critical: true },
];

function CopyableField({ label, value, mono = true }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success('Copiado!');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div>
      <Label className="text-xs text-[#0A0A0A]/70">{label}</Label>
      <div className="flex gap-2 mt-1">
        <Input
          value={value}
          readOnly
          className={`h-9 text-xs ${mono ? 'font-mono' : ''} bg-slate-50`}
        />
        <Button size="icon" variant="outline" onClick={copy} className="h-9 w-9 shrink-0">
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

export default function CafWebhookSetup() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const loadUrl = async () => {
    setLoading(true);
    setError(null);
    try {
      // Passa o host atual do navegador como appBaseUrl
      const appBaseUrl = `${window.location.protocol}//${window.location.host}`;
      const res = await base44.functions.invoke('cafGetWebhookUrl', { appBaseUrl });
      if (res.data?.error) throw new Error(res.data.error);
      setData(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUrl(); }, []);

  if (loading) {
    return (
      <Card className="p-8 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Gerando URL do webhook...
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <p className="text-sm text-red-700 font-semibold">Erro: {error}</p>
        <Button onClick={loadUrl} size="sm" variant="outline" className="mt-3">Tentar novamente</Button>
      </Card>
    );
  }

  const { webhookUrl, baseUrl, hasSecretConfigured, instructions, security } = data;

  return (
    <div className="space-y-4">
      {/* Banner de status */}
      <Card className={`p-4 ${hasSecretConfigured ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-start gap-3">
          {hasSecretConfigured
            ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            : <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          }
          <div className="text-xs">
            {hasSecretConfigured ? (
              <>
                <p className="font-bold text-emerald-900">✅ CAF_WEBHOOK_SECRET configurado</p>
                <p className="text-emerald-800 mt-1 opacity-80">
                  Assinaturas HMAC SHA-256 serão validadas. Eventos sem assinatura válida serão rejeitados com 401.
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-amber-900">⚠ CAF_WEBHOOK_SECRET não configurado</p>
                <p className="text-amber-800 mt-1 opacity-80">
                  Sem o secret, aceitamos eventos sem validação (inseguro). Depois de cadastrar o webhook no Trust,
                  adicione o secret como <code className="bg-white/70 px-1 rounded">CAF_WEBHOOK_SECRET</code> nos secrets da app.
                </p>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* URL principal */}
      <Card className="p-5 border-[#1356E2]/40 bg-gradient-to-br from-emerald-50/50 to-white">
        <div className="flex items-center gap-2 mb-4">
          <Webhook className="w-5 h-5 text-[#1356E2]" />
          <h3 className="text-base font-bold text-[#0A0A0A]">URL do Webhook (Payload URL)</h3>
          <Badge className="bg-[#1356E2] text-white text-[9px]">CLOUD EVENTS</Badge>
        </div>

        <CopyableField label="Cole esta URL no Trust Portal → API Configurations → Webhooks → + New webhook" value={webhookUrl} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-emerald-100">
          <div>
            <Label className="text-[10px] text-[#0A0A0A]/60 uppercase tracking-wider">Method</Label>
            <p className="text-sm font-mono text-[#0A0A0A] mt-0.5">POST</p>
          </div>
          <div>
            <Label className="text-[10px] text-[#0A0A0A]/60 uppercase tracking-wider">Content-Type</Label>
            <p className="text-sm font-mono text-[#0A0A0A] mt-0.5">application/json</p>
          </div>
          <div>
            <Label className="text-[10px] text-[#0A0A0A]/60 uppercase tracking-wider">Auth</Label>
            <p className="text-sm font-mono text-[#0A0A0A] mt-0.5">None (HMAC signed)</p>
          </div>
        </div>
      </Card>

      {/* Passo a passo */}
      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-[#1356E2]" />
          <h3 className="text-sm font-bold text-[#0A0A0A]">Passo-a-passo de cadastro no Trust</h3>
        </div>

        <ol className="space-y-3 text-sm text-[#0A0A0A]">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1356E2] text-white text-xs font-bold flex items-center justify-center">1</span>
            <div className="flex-1">
              <p>Acesse <a href="https://trust.caf.io" target="_blank" rel="noreferrer" className="text-[#1356E2] underline inline-flex items-center gap-1">https://trust.caf.io <ExternalLink className="w-3 h-3" /></a></p>
              <p className="text-xs text-[#0A0A0A]/60 mt-0.5">{instructions.step1}</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1356E2] text-white text-xs font-bold flex items-center justify-center">2</span>
            <div className="flex-1">
              <p>Clique em <strong>+ New webhook</strong></p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1356E2] text-white text-xs font-bold flex items-center justify-center">3</span>
            <div className="flex-1">
              <p><strong>Payload URL:</strong> cole a URL acima</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1356E2] text-white text-xs font-bold flex items-center justify-center">4</span>
            <div className="flex-1">
              <p><strong>Secret:</strong> gere um secret forte (ex: abra um terminal e rode <code className="bg-slate-100 px-1 rounded text-xs">openssl rand -hex 32</code>)</p>
              <p className="text-xs text-[#0A0A0A]/60 mt-0.5">Guarde esse valor — você vai precisar dele no passo 8.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1356E2] text-white text-xs font-bold flex items-center justify-center">5</span>
            <div className="flex-1">
              <p><strong>Authentication:</strong> <Badge variant="outline" className="text-[10px]">None</Badge></p>
              <p className="text-xs text-[#0A0A0A]/60 mt-0.5">Não precisa de Basic Auth ou API Key — a validação é via HMAC SHA-256 do body usando o secret do passo 4.</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1356E2] text-white text-xs font-bold flex items-center justify-center">6</span>
            <div className="flex-1">
              <p className="mb-2"><strong>Eventos a selecionar</strong> (recomendamos "Send me everything", OU individualmente):</p>
              <div className="space-y-1.5">
                {EVENTS_LIST.map(evt => (
                  <div key={evt.id} className="flex items-start gap-2 p-2 bg-slate-50 rounded border border-slate-200">
                    {evt.critical
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      : <div className="w-4 h-4 shrink-0 mt-0.5 rounded border border-slate-300" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-[#0A0A0A]">{evt.id}</p>
                      <p className="text-[10px] text-[#0A0A0A]/60">{evt.desc}</p>
                    </div>
                    {evt.critical && <Badge className="bg-emerald-100 text-emerald-700 text-[9px]">essencial</Badge>}
                  </div>
                ))}
              </div>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#1356E2] text-white text-xs font-bold flex items-center justify-center">7</span>
            <div className="flex-1">
              <p>Marque <strong>Active</strong> → clique em <strong>Create webhook</strong></p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold flex items-center justify-center">8</span>
            <div className="flex-1">
              <p className="font-semibold">Adicione o secret nos Secrets da Base44:</p>
              <div className="bg-slate-900 text-slate-100 rounded-lg p-3 mt-2 text-xs font-mono">
                <p className="text-slate-400">// Dashboard → Settings → Environment Variables</p>
                <p className="mt-1">Nome: <span className="text-[#E84B1C]">CAF_WEBHOOK_SECRET</span></p>
                <p>Valor: <span className="text-[#E84B1C]">{'<'}o secret gerado no passo 4{'>'}</span></p>
              </div>
              <p className="text-xs text-amber-700 mt-2">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                Sem esse secret, o handler aceita eventos sem validação (inseguro em produção).
              </p>
            </div>
          </li>
        </ol>
      </Card>

      {/* Segurança */}
      <Card className="p-5 bg-slate-50">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="w-4 h-4 text-[#0A0A0A]" />
          <h3 className="text-sm font-bold text-[#0A0A0A]">Segurança & especificações técnicas</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2">
            <Lock className="w-3.5 h-3.5 text-[#1356E2] mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-[#0A0A0A]">Assinatura</p>
              <p className="text-[#0A0A0A]/70">Header <code className="bg-white px-1 rounded">{security.signatureHeader}</code> — {security.algorithm}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Zap className="w-3.5 h-3.5 text-[#1356E2] mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-[#0A0A0A]">Resposta esperada</p>
              <p className="text-[#0A0A0A]/70">{security.expectedResponse}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Globe className="w-3.5 h-3.5 text-[#1356E2] mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-[#0A0A0A]">Retry policy</p>
              <p className="text-[#0A0A0A]/70">{security.retryPolicy}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Key className="w-3.5 h-3.5 text-[#1356E2] mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-[#0A0A0A]">Formato do payload</p>
              <p className="text-[#0A0A0A]/70">CloudEvents 1.0 — <a href={security.cloudEventsSpec} target="_blank" rel="noreferrer" className="text-[#1356E2] underline">spec</a></p>
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-200">
          <a
            href={security.officialDocs}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-[#1356E2] hover:underline inline-flex items-center gap-1"
          >
            <ExternalLink className="w-3 h-3" /> Documentação oficial CAF Connect Webhooks
          </a>
        </div>
      </Card>

      {/* IPs da CAF */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Globe className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="text-xs flex-1">
            <p className="font-bold text-blue-900 mb-1">IPs oficiais da CAF (libere no firewall se aplicável):</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-1 mt-2">
              {['34.234.120.59', '18.229.212.133', '3.218.90.124', '44.219.96.170', '18.235.54.162'].map(ip => (
                <code key={ip} className="bg-white px-2 py-1 rounded text-[10px] font-mono border border-blue-200 text-blue-900">{ip}</code>
              ))}
            </div>
            <p className="text-blue-800/70 mt-2 text-[11px]">
              Nossa plataforma não exige whitelisting (a validação HMAC já garante autenticidade), mas os IPs ficam registrados em cada webhook recebido pra auditoria.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}