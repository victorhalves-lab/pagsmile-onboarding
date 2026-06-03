import React, { useState, useMemo } from 'react';
import { callPublicFunction } from '@/lib/publicApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Send, CheckCircle2, Sparkles, ArrowRight, Loader2, Users, Trash2, Zap, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

const INITIAL_ROWS = 10;

const emptyRow = () => ({
  person_type: 'PJ',
  company_name: '',
  cnpj: '',
  cpf: '',
  offer_url: '',
});

function formatDoc(value, personType) {
  const d = String(value || '').replace(/\D/g, '');
  if (personType === 'PF') {
    return d.slice(0, 11)
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }
  return d.slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

const URL_REGEX = /^https?:\/\/.+\..+/i;

export default function SubsellerInfoFormSimple({ collection, token }) {
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [rows, setRows] = useState(() => Array.from({ length: INITIAL_ROWS }, emptyRow));

  const validRowsCount = useMemo(() => rows.filter(r => {
    const isPJ = (r.person_type || 'PJ') === 'PJ';
    const docOk = isPJ ? r.cnpj?.replace(/\D/g, '').length === 14 : r.cpf?.replace(/\D/g, '').length === 11;
    return r.company_name?.trim() && docOk && URL_REGEX.test(String(r.offer_url || '').trim());
  }).length, [rows]);

  const update = (idx, field, value) => {
    setRows(prev => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };
  const addRow = () => setRows(prev => [...prev, emptyRow()]);
  const addManyRows = (n) => setRows(prev => [...prev, ...Array.from({ length: n }, emptyRow)]);
  const removeRow = (idx) => setRows(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    const filled = rows.filter(r => {
      const isPJ = (r.person_type || 'PJ') === 'PJ';
      return r.company_name?.trim() && (isPJ ? r.cnpj?.trim() : r.cpf?.trim());
    });
    if (filled.length === 0) {
      toast.error('Preencha ao menos 1 subseller (nome + documento).');
      return;
    }
    // Valida URL obrigatória
    for (let i = 0; i < filled.length; i++) {
      const r = filled[i];
      const label = r.company_name || `Subseller #${i + 1}`;
      if (!URL_REGEX.test(String(r.offer_url || '').trim())) {
        toast.error(`${label}: link da oferta é obrigatório (URL válida).`);
        return;
      }
    }
    setSubmitting(true);
    try {
      const data = await callPublicFunction('publicSubsellerInfoSubmit', {
        token,
        submitter_name: submitterName,
        submitter_email: submitterEmail,
        subsellers: filled.map(r => ({
          person_type: r.person_type,
          company_name: r.company_name.trim(),
          cnpj: r.person_type === 'PJ' ? r.cnpj.replace(/\D/g, '') : undefined,
          cpf: r.person_type === 'PF' ? r.cpf.replace(/\D/g, '') : undefined,
          offer_url: r.offer_url.trim(),
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
              Recebemos sua lista de subsellers. Nosso time analisará e entrará em contato em breve.
            </p>
            <Button
              onClick={() => { setDone(false); setRows(Array.from({ length: INITIAL_ROWS }, emptyRow)); }}
              className="mt-2"
            >
              Enviar mais subsellers <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-32">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#002443] via-[#003366] to-[#002443] p-8 md:p-10 mb-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#2bc196]/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2bc196]/20 text-[#5cf7cf] text-xs font-bold mb-3">
            <Zap className="w-3.5 h-3.5" /> Cadastro rápido
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Olá, {collection.gateway_name}! 👋
          </h1>
          <p className="text-white/70 text-sm max-w-2xl">
            Versão simplificada: informe apenas <strong className="text-white">CNPJ/CPF, nome e link da oferta</strong> de cada subseller.
            Levamos os detalhes adiante por outro canal, se necessário.
          </p>
        </div>
      </div>

      {/* Quem está preenchendo */}
      <Card className="mb-5">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-[#2bc196]" />
            <h2 className="text-sm font-bold text-[#002443]">Quem está preenchendo?</h2>
            <span className="text-[10px] text-[#002443]/40">(opcional)</span>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
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
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-[#002443]/5 shadow-sm p-3 mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-8 h-8 rounded-lg bg-[#2bc196]/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#2bc196]" />
          </div>
          <div>
            <div className="text-xs text-[#002443]/50">Subsellers válidos</div>
            <div className="text-base font-bold text-[#002443]">{validRowsCount} <span className="text-xs font-normal text-[#002443]/40">/ {rows.length}</span></div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => addManyRows(5)}>+ 5 linhas</Button>
          <Button onClick={handleSubmit} disabled={submitting || validRowsCount === 0}>
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Enviar ({validRowsCount})
          </Button>
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-3">
        {rows.map((row, idx) => {
          const isPJ = (row.person_type || 'PJ') === 'PJ';
          const urlOk = !row.offer_url || URL_REGEX.test(row.offer_url.trim());
          return (
            <Card key={idx} className="border border-[#002443]/8">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="text-xl font-black text-[#002443]/15 tabular-nums">#{String(idx + 1).padStart(2, '0')}</div>
                  <div className="flex bg-[#f4f4f4] rounded-lg p-0.5 ml-auto">
                    <button
                      type="button"
                      onClick={() => update(idx, 'person_type', 'PJ')}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${isPJ ? 'bg-white text-[#002443] shadow-sm' : 'text-[#002443]/50'}`}
                    >PJ</button>
                    <button
                      type="button"
                      onClick={() => update(idx, 'person_type', 'PF')}
                      className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${!isPJ ? 'bg-white text-[#002443] shadow-sm' : 'text-[#002443]/50'}`}
                    >PF</button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(idx)}
                    className="text-[#002443]/30 hover:text-red-500 p-1"
                    title="Remover"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-[#002443]/50">
                      {isPJ ? 'CNPJ *' : 'CPF *'}
                    </Label>
                    <Input
                      value={isPJ ? formatDoc(row.cnpj, 'PJ') : formatDoc(row.cpf, 'PF')}
                      onChange={(e) => update(idx, isPJ ? 'cnpj' : 'cpf', e.target.value.replace(/\D/g, '').slice(0, isPJ ? 14 : 11))}
                      placeholder={isPJ ? '00.000.000/0000-00' : '000.000.000-00'}
                      inputMode="numeric"
                      className="mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-[#002443]/50">
                      {isPJ ? 'Razão Social *' : 'Nome Completo *'}
                    </Label>
                    <Input
                      value={row.company_name}
                      onChange={(e) => update(idx, 'company_name', e.target.value)}
                      placeholder={isPJ ? 'Empresa LTDA' : 'João da Silva'}
                      className="mt-0.5"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-[#002443]/50 flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" /> Link da oferta *
                    </Label>
                    <Input
                      value={row.offer_url}
                      onChange={(e) => update(idx, 'offer_url', e.target.value)}
                      placeholder="https://..."
                      type="url"
                      className={`mt-0.5 ${!urlOk ? 'border-red-300' : ''}`}
                    />
                    {!urlOk && (
                      <p className="text-[10px] text-red-500 mt-0.5">URL inválida — deve começar com http:// ou https://</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button variant="outline" onClick={addRow}><Plus className="w-4 h-4 mr-2" /> + 1 subseller</Button>
        <Button variant="outline" onClick={() => addManyRows(5)}><Plus className="w-4 h-4 mr-2" /> + 5</Button>
        <Button variant="outline" onClick={() => addManyRows(10)}><Plus className="w-4 h-4 mr-2" /> + 10</Button>
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <Button size="lg" onClick={handleSubmit} disabled={submitting || validRowsCount === 0} className="shadow-2xl shadow-[#2bc196]/30">
          {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
          Enviar {validRowsCount > 0 ? `${validRowsCount} subseller${validRowsCount > 1 ? 's' : ''}` : ''}
        </Button>
      </div>
    </div>
  );
}