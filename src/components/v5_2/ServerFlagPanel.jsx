/**
 * [V5.2 — Entrega 4] ServerFlagPanel
 * ──────────────────────────────────
 * Toggle server-side da flag `score_engine_v5_2`.
 * Quando ON, NOVOS OnboardingCases criados via publicComplianceSubmit
 * nascem com framework_version='v5.2'. Casos existentes NUNCA são alterados.
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, ServerCog, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function ServerFlagPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [meta, setMeta] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke('v5_2FeatureFlag', { action: 'read' });
      setEnabled(!!res.data?.enabled);
      setMeta({ updatedAt: res.data?.updatedAt, updatedBy: res.data?.updatedBy });
    } catch (e) {
      toast.error('Falha ao ler flag: ' + (e.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (next) => {
    setSaving(true);
    try {
      const res = await base44.functions.invoke('v5_2FeatureFlag', { action: 'write', enabled: next });
      if (res.data?.ok) {
        setEnabled(next);
        toast.success(next
          ? '✅ V5.2 ATIVO — novos casos nascerão em v5.2'
          : '🔒 V5.2 DESATIVADO — novos casos voltam a nascer em v4.0'
        );
        await load();
      } else {
        toast.error('Erro: ' + (res.data?.error || ''));
      }
    } catch (e) {
      toast.error('Falha: ' + (e.message || ''));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-2 border-amber-300/40 bg-gradient-to-br from-amber-50/40 to-white">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2.5 rounded-xl bg-amber-100 mt-0.5">
              <ServerCog className="w-5 h-5 text-amber-700" />
            </div>
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                Flag SERVER-SIDE: <code className="text-sm bg-white border border-amber-200 px-2 py-0.5 rounded">score_engine_v5_2</code>
              </CardTitle>
              <CardDescription className="mt-2 leading-relaxed">
                Quando <strong>ATIVA</strong>, novos <code>OnboardingCase</code> criados via fluxo público de Compliance
                nascem com <code>framework_version = 'v5.2'</code> e passam pelo pipeline V5.2 completo.
                <br /><strong className="text-amber-700">⚠️ Casos JÁ existentes (V4/V5.1) NUNCA são alterados</strong> — DNA do framework é imutável.
              </CardDescription>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-amber-700" />
            ) : (
              <Switch
                checked={enabled}
                onCheckedChange={toggle}
                disabled={saving}
                className="data-[state=checked]:bg-[#2bc196]"
              />
            )}
            <Badge className={enabled
              ? 'bg-[#2bc196] text-white border-0'
              : 'bg-[#002443]/10 text-[#002443]/60 border-0'
            }>
              {enabled ? 'ATIVO' : 'INATIVO (default)'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white border border-[#002443]/5">
            <p className="text-[10px] uppercase text-[#002443]/40 font-bold mb-1">Última alteração</p>
            <p className="text-[#002443]/70 font-mono">
              {meta.updatedAt ? new Date(meta.updatedAt).toLocaleString('pt-BR') : '—'}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-white border border-[#002443]/5">
            <p className="text-[10px] uppercase text-[#002443]/40 font-bold mb-1">Por</p>
            <p className="text-[#002443]/70 truncate">{meta.updatedBy || '—'}</p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
          <div className="text-amber-900 leading-relaxed">
            <p className="font-semibold mb-1">Como saber se está funcionando:</p>
            <p>Após ativar, submeta um novo questionário público de compliance.
            O <code>OnboardingCase</code> resultante terá <code>framework_version: 'v5.2'</code>.
            Verifique na aba <strong>Entidades V5.2</strong> ou em <code>/Cadastro</code>.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}