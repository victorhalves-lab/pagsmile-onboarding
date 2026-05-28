import React, { useState, useEffect, useMemo } from 'react';
import { callPublicFunction } from '@/lib/publicApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Building2, Send, CheckCircle2, Sparkles, ArrowRight, Loader2, Users } from 'lucide-react';
import { toast } from 'sonner';
import SubsellerCard from '@/components/subseller-info/SubsellerCard';

const INITIAL_ROWS = 10;

const emptySubseller = () => ({
  person_type: 'PJ',
  company_name: '', cnpj: '', cpf: '', rg: '', cnae: '',
  business_model: '', business_model_other: '',
  what_they_sell: '', offer_url: '', offer_explanation: '',
  monthly_tpv: '', average_ticket: '',
  bank_name: '', bank_agency: '', bank_account: '', bank_account_type: 'corrente',
  bank_holder_name: '', bank_holder_document: '',
  documents: [],
});

// Documentos exigidos por tipo de pessoa
const REQUIRED_DOCS = {
  PJ: ['contrato_social', 'doc_socio', 'selfie_socio', 'comprovante_endereco_empresa'],
  PF: ['documento_id', 'selfie_documento', 'comprovante_residencia'],
};

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
    () => rows.filter(r => {
      const isPJ = (r.person_type || 'PJ') === 'PJ';
      return (r.company_name?.trim() && (isPJ ? r.cnpj?.trim() : r.cpf?.trim()));
    }).length,
    [rows]
  );

  const update = (idx, field, value) => {
    setRows(prev => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const addRow = () => setRows(prev => [...prev, emptySubseller()]);
  const addManyRows = (n) => setRows(prev => [...prev, ...Array.from({ length: n }, emptySubseller)]);
  const removeRow = (idx) => setRows(prev => prev.filter((_, i) => i !== idx));

  // Valida cada subseller antes de submeter
  const validateBeforeSubmit = (filled) => {
    for (let i = 0; i < filled.length; i++) {
      const r = filled[i];
      const isPJ = (r.person_type || 'PJ') === 'PJ';
      const label = r.company_name || `Subseller #${i + 1}`;

      if (!r.company_name?.trim()) {
        return `${label}: nome obrigatório.`;
      }
      if (isPJ && !r.cnpj?.trim()) return `${label}: CNPJ obrigatório.`;
      if (!isPJ && !r.cpf?.trim()) return `${label}: CPF obrigatório.`;

      if (r.business_model === 'outro' && !r.business_model_other?.trim()) {
        return `${label}: descreva qual é o modelo de negócio (campo "Outro").`;
      }

      const requiredDocs = REQUIRED_DOCS[isPJ ? 'PJ' : 'PF'];
      const docTypesPresent = new Set((r.documents || []).map(d => d.doc_type));
      const missing = requiredDocs.filter(t => !docTypesPresent.has(t));
      if (missing.length > 0) {
        return `${label}: faltam documentos obrigatórios (${missing.length}).`;
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const filled = rows.filter(r => {
      const isPJ = (r.person_type || 'PJ') === 'PJ';
      return (r.company_name?.trim() && (isPJ ? r.cnpj?.trim() : r.cpf?.trim()));
    });
    if (filled.length === 0) {
      toast.error('Preencha ao menos um subseller (nome + CNPJ/CPF).');
      return;
    }
    const err = validateBeforeSubmit(filled);
    if (err) {
      toast.error(err);
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
            Preencha abaixo as informações dos seus subsellers e envie os documentos exigidos.
            Cada subseller pode ser PJ ou PF — selecione corretamente para que os campos certos apareçam.
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
        {rows.map((row, idx) => (
          <SubsellerCard
            key={idx}
            idx={idx}
            row={row}
            token={token}
            onUpdate={(field, value) => update(idx, field, value)}
            onRemove={() => removeRow(idx)}
          />
        ))}
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