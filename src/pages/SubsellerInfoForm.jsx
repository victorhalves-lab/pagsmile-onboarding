import React, { useState, useEffect, useMemo } from 'react';
import { callPublicFunction } from '@/lib/publicApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Trash2, Building2, Send, CheckCircle2, Sparkles, ArrowRight, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';

const INITIAL_ROWS = 10;

const emptySubseller = () => ({
  company_name: '', cnpj: '', business_model: '', what_they_sell: '',
  offer_url: '', offer_explanation: '',
  monthly_tpv: '', average_ticket: '',
  bank_name: '', bank_agency: '', bank_account: '', bank_account_type: 'corrente',
  bank_holder_name: '', bank_holder_document: '',
});

function formatCnpj(v) {
  const digits = String(v || '').replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

export default function SubsellerInfoForm() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [rows, setRows] = useState(() => Array.from({ length: INITIAL_ROWS }, emptySubseller));

  // Carrega contexto do link (via função pública — a entidade tem RLS admin-only)
  useEffect(() => {
    if (!token) {
      setError('Link inválido — token ausente.');
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const data = await callPublicFunction('publicReadSubsellerInfoCollection', { token });
        if (data?.status === 'ok' && data.collection) {
          setCollection(data.collection);
        } else if (data?.status === 'inactive') {
          setError('Este link foi desativado.');
        } else if (data?.status === 'expired') {
          setError('Este link expirou.');
        } else {
          setError('Link não encontrado ou expirado.');
        }
      } catch (e) {
        const msg = String(e?.message || '');
        if (msg.includes('404')) setError('Link não encontrado ou expirado.');
        else if (msg.includes('403')) setError('Este link foi desativado ou expirou.');
        else setError('Não foi possível validar este link. Tente novamente em instantes.');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const validRowsCount = useMemo(
    () => rows.filter(r => (r.company_name?.trim() || r.cnpj?.trim())).length,
    [rows]
  );

  const update = (idx, field, value) => {
    setRows(prev => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const addRow = () => setRows(prev => [...prev, emptySubseller()]);
  const addManyRows = (n) => setRows(prev => [...prev, ...Array.from({ length: n }, emptySubseller)]);
  const removeRow = (idx) => setRows(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    const filled = rows.filter(r => (r.company_name?.trim() || r.cnpj?.trim()));
    if (filled.length === 0) {
      toast.error('Preencha ao menos um subseller (Nome ou CNPJ).');
      return;
    }
    setSubmitting(true);
    try {
      const data = await callPublicFunction('publicSubsellerInfoSubmit', {
        token,
        submitter_name: submitterName,
        submitter_email: submitterEmail,
        subsellers: filled.map(r => ({
          ...r,
          monthly_tpv: r.monthly_tpv ? Number(r.monthly_tpv) : undefined,
          average_ticket: r.average_ticket ? Number(r.average_ticket) : undefined,
        })),
      });
      if (data?.success) {
        setDone(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        toast.error(data?.error || 'Erro ao enviar.');
      }
    } catch (e) {
      toast.error(e?.message || 'Erro ao enviar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto mt-16">
        <Card><CardContent className="p-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-[#002443] mb-2">Link indisponível</h1>
          <p className="text-sm text-[#002443]/60">{error}</p>
        </CardContent></Card>
      </div>
    );
  }

  if (done) {
    return (
      <div className="max-w-2xl mx-auto mt-16">
        <Card className="border-[#2bc196]/30">
          <CardContent className="p-10 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#2bc196]/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-8 h-8 text-[#2bc196]" />
            </div>
            <h1 className="text-2xl font-bold text-[#002443] mb-2">Envio recebido! 🎉</h1>
            <p className="text-sm text-[#002443]/60 mb-6">
              Recebemos sua lista de subsellers para análise. Nosso time entrará em contato em breve.
            </p>
            <p className="text-xs text-[#002443]/40">
              Você pode preencher novos subsellers a qualquer momento usando o mesmo link.
            </p>
            <Button onClick={() => { setDone(false); setRows(Array.from({ length: INITIAL_ROWS }, emptySubseller)); }}
              className="mt-6">
              Enviar mais subsellers <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-32">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#002443] via-[#003366] to-[#002443] p-8 md:p-12 mb-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#2bc196]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#5cf7cf]/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2bc196]/20 text-[#5cf7cf] text-xs font-bold mb-4">
            <Sparkles className="w-3.5 h-3.5" /> Cadastro de Subsellers
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Olá, {collection.gateway_name}! 👋
          </h1>
          <p className="text-white/70 text-base max-w-2xl">
            Preencha abaixo as informações iniciais dos seus subsellers. Quanto mais detalhado for o
            preenchimento, mais rápido nosso time analisa e libera o onboarding.
          </p>
        </div>
      </div>

      {/* Quem está preenchendo */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-[#2bc196]" />
            <h2 className="text-sm font-bold text-[#002443]">Quem está preenchendo?</h2>
            <span className="text-[10px] text-[#002443]/40">(opcional)</span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">Seu nome</Label>
              <Input value={submitterName} onChange={(e) => setSubmitterName(e.target.value)} placeholder="Ex: João Silva" />
            </div>
            <div>
              <Label className="text-xs">Seu email</Label>
              <Input value={submitterEmail} onChange={(e) => setSubmitterEmail(e.target.value)} placeholder="joao@gateway.com" type="email" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats bar */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-[#002443]/5 shadow-sm p-4 mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2bc196]/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-[#2bc196]" />
            </div>
            <div>
              <div className="text-xs text-[#002443]/50">Subsellers preenchidos</div>
              <div className="text-lg font-bold text-[#002443]">{validRowsCount} <span className="text-xs font-normal text-[#002443]/40">/ {rows.length} cards</span></div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => addManyRows(5)}>+ 5 cards</Button>
          <Button variant="outline" size="sm" onClick={() => addManyRows(10)}>+ 10 cards</Button>
          <Button onClick={handleSubmit} disabled={submitting || validRowsCount === 0}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Enviar ({validRowsCount})
          </Button>
        </div>
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {rows.map((row, idx) => {
          const filled = !!(row.company_name?.trim() || row.cnpj?.trim());
          return (
            <Card key={idx} className={`transition-all ${filled ? 'border-[#2bc196]/40 shadow-sm' : 'border-[#002443]/5'}`}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${filled ? 'bg-[#2bc196] text-white' : 'bg-[#f4f4f4] text-[#002443]/40'}`}>
                      {idx + 1}
                    </div>
                    <span className="text-sm font-semibold text-[#002443]">
                      {row.company_name || 'Subseller #' + (idx + 1)}
                    </span>
                  </div>
                  <button onClick={() => removeRow(idx)} className="text-[#002443]/30 hover:text-red-500 transition-colors p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Razão Social / Nome Fantasia *</Label>
                    <Input value={row.company_name} onChange={(e) => update(idx, 'company_name', e.target.value)} placeholder="Ex: Loja XYZ Ltda" />
                  </div>
                  <div>
                    <Label className="text-xs">CNPJ *</Label>
                    <Input value={row.cnpj} onChange={(e) => update(idx, 'cnpj', formatCnpj(e.target.value))} placeholder="00.000.000/0000-00" />
                  </div>
                  <div>
                    <Label className="text-xs">Modelo de Negócio</Label>
                    <Select value={row.business_model} onValueChange={(v) => update(idx, 'business_model', v)}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ecommerce">E-commerce</SelectItem>
                        <SelectItem value="marketplace">Marketplace</SelectItem>
                        <SelectItem value="saas">SaaS / Assinatura</SelectItem>
                        <SelectItem value="link_pagamento">Link de Pagamento</SelectItem>
                        <SelectItem value="infoprodutos">Infoprodutos / Cursos</SelectItem>
                        <SelectItem value="dropshipping">Dropshipping</SelectItem>
                        <SelectItem value="servicos">Serviços</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">O que vende?</Label>
                    <Input value={row.what_they_sell} onChange={(e) => update(idx, 'what_they_sell', e.target.value)} placeholder="Ex: Roupas femininas" />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">Site ou Link da Oferta</Label>
                    <Input value={row.offer_url} onChange={(e) => update(idx, 'offer_url', e.target.value)} placeholder="https://..." />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">Explicação da oferta (se não houver site)</Label>
                    <Textarea
                      value={row.offer_explanation}
                      onChange={(e) => update(idx, 'offer_explanation', e.target.value)}
                      placeholder="Descreva claramente o produto/serviço, valor, condições..."
                      className="h-20"
                    />
                  </div>

                  {/* Volumetria */}
                  <div className="md:col-span-2 pt-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#002443]/40 mb-2">Volumetria estimada</div>
                  </div>
                  <div>
                    <Label className="text-xs">TPV Mensal (R$)</Label>
                    <Input type="number" value={row.monthly_tpv} onChange={(e) => update(idx, 'monthly_tpv', e.target.value)} placeholder="Ex: 50000" />
                  </div>
                  <div>
                    <Label className="text-xs">Ticket Médio (R$)</Label>
                    <Input type="number" value={row.average_ticket} onChange={(e) => update(idx, 'average_ticket', e.target.value)} placeholder="Ex: 150" />
                  </div>

                  {/* Conta bancária */}
                  <div className="md:col-span-2 pt-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#002443]/40 mb-2">Conta bancária para liquidação</div>
                  </div>
                  <div>
                    <Label className="text-xs">Banco</Label>
                    <Input value={row.bank_name} onChange={(e) => update(idx, 'bank_name', e.target.value)} placeholder="Ex: Itaú, Bradesco..." />
                  </div>
                  <div>
                    <Label className="text-xs">Tipo de Conta</Label>
                    <Select value={row.bank_account_type} onValueChange={(v) => update(idx, 'bank_account_type', v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="corrente">Corrente</SelectItem>
                        <SelectItem value="poupanca">Poupança</SelectItem>
                        <SelectItem value="pagamento">Pagamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Agência</Label>
                    <Input value={row.bank_agency} onChange={(e) => update(idx, 'bank_agency', e.target.value)} placeholder="0000" />
                  </div>
                  <div>
                    <Label className="text-xs">Conta</Label>
                    <Input value={row.bank_account} onChange={(e) => update(idx, 'bank_account', e.target.value)} placeholder="00000-0" />
                  </div>
                  <div>
                    <Label className="text-xs">Titular da Conta</Label>
                    <Input value={row.bank_holder_name} onChange={(e) => update(idx, 'bank_holder_name', e.target.value)} placeholder="Nome do titular" />
                  </div>
                  <div>
                    <Label className="text-xs">CPF/CNPJ do Titular</Label>
                    <Input value={row.bank_holder_document} onChange={(e) => update(idx, 'bank_holder_document', e.target.value)} placeholder="Documento do titular" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add more */}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button variant="outline" onClick={addRow}><Plus className="w-4 h-4 mr-2" /> Adicionar 1 subseller</Button>
        <Button variant="outline" onClick={() => addManyRows(5)}><Plus className="w-4 h-4 mr-2" /> +5 subsellers</Button>
        <Button variant="outline" onClick={() => addManyRows(10)}><Plus className="w-4 h-4 mr-2" /> +10 subsellers</Button>
      </div>

      {/* Fixed bottom CTA */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <Button size="lg" onClick={handleSubmit} disabled={submitting || validRowsCount === 0}
          className="shadow-2xl shadow-[#2bc196]/30">
          {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
          Enviar {validRowsCount > 0 ? `${validRowsCount} subseller${validRowsCount > 1 ? 's' : ''}` : ''}
        </Button>
      </div>
    </div>
  );
}