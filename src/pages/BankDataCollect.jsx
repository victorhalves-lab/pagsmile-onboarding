import React, { useEffect, useState } from 'react';
import { callPublicFunction } from '@/lib/publicApi';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * Public page — client-facing. Receives ?token=XXX and shows a simple form
 * for the merchant to fill bank data (Banco, Agência, Conta).
 * SDK-free: uses callPublicFunction so it works without any auth.
 */
export default function BankDataCollect() {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    banco: '', agencia: '', digitoAgencia: '', conta: '', digitoConta: '',
  });

  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const t = qs.get('token') || '';
    setToken(t);
    if (!t) { setError('Link inválido ou incompleto.'); setLoading(false); return; }

    (async () => {
      try {
        const res = await callPublicFunction('publicBankDataRead', { token: t });
        if (res?.error) {
          setError(res.error === 'not_found' ? 'Link não encontrado.' : 'Não foi possível abrir este link.');
        } else {
          setInfo(res);
          if (res.status === 'preenchido' && res.filled) {
            setForm({
              banco: res.filled.banco || '',
              agencia: res.filled.agencia || '',
              digitoAgencia: res.filled.digitoAgencia || '',
              conta: res.filled.conta || '',
              digitoConta: res.filled.digitoConta || '',
            });
            setSuccess(true);
          }
        }
      } catch (e) {
        setError(e.message || 'Erro ao carregar.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.banco || !form.agencia || !form.conta) {
      setError('Preencha Banco, Agência e Conta.'); return;
    }
    setSubmitting(true); setError('');
    try {
      const res = await callPublicFunction('publicBankDataSubmit', { token, ...form });
      if (res?.error) {
        setError('Não foi possível salvar. Tente novamente.');
      } else {
        setSuccess(true);
      }
    } catch (e) {
      setError(e.message || 'Erro ao enviar.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#1356E2]" />
      </div>
    );
  }

  if (error && !info) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-semibold mb-1">Ops!</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-start justify-center p-4 pt-12">
      <Card className="max-w-lg w-full p-6 md:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#0A0A0A]">Dados Bancários — Pin Bank</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {info?.companyName ? <>Olá <strong>{info.companyName}</strong>,</> : 'Olá,'} precisamos dos dados bancários da sua conta para concluir o onboarding.
          </p>
          {info?.cpfCnpj && (
            <p className="text-xs text-muted-foreground mt-1">CPF/CNPJ: {info.cpfCnpj}</p>
          )}
        </div>

        {success ? (
          <div className="text-center py-8">
            <CheckCircle2 className="w-14 h-14 text-[#1356E2] mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-1">Recebemos seus dados!</h3>
            <p className="text-sm text-muted-foreground">Obrigado. A Pin Bank seguirá com o processo.</p>
            <div className="mt-6 text-xs text-muted-foreground bg-gray-50 rounded p-3 text-left">
              <div><strong>Banco:</strong> {form.banco}</div>
              <div><strong>Agência:</strong> {form.agencia}{form.digitoAgencia ? `-${form.digitoAgencia}` : ''}</div>
              <div><strong>Conta:</strong> {form.conta}{form.digitoConta ? `-${form.digitoConta}` : ''}</div>
            </div>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label>Banco *</Label>
              <Input
                placeholder="Ex: 237 - Bradesco, 341 - Itaú"
                value={form.banco}
                onChange={(e) => setForm({ ...form, banco: e.target.value })}
                disabled={submitting}
              />
            </div>
            <div className="grid grid-cols-[1fr_80px] gap-2">
              <div>
                <Label>Agência *</Label>
                <Input value={form.agencia} onChange={(e) => setForm({ ...form, agencia: e.target.value })} disabled={submitting} />
              </div>
              <div>
                <Label>Dígito</Label>
                <Input value={form.digitoAgencia} onChange={(e) => setForm({ ...form, digitoAgencia: e.target.value })} disabled={submitting} />
              </div>
            </div>
            <div className="grid grid-cols-[1fr_80px] gap-2">
              <div>
                <Label>Conta *</Label>
                <Input value={form.conta} onChange={(e) => setForm({ ...form, conta: e.target.value })} disabled={submitting} />
              </div>
              <div>
                <Label>Dígito</Label>
                <Input value={form.digitoConta} onChange={(e) => setForm({ ...form, digitoConta: e.target.value })} disabled={submitting} />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={submitting} className="w-full bg-[#1356E2] hover:bg-[#239b78]">
              {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</> : 'Enviar'}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Seus dados são protegidos conforme a LGPD.
            </p>
          </form>
        )}
      </Card>
    </div>
  );
}