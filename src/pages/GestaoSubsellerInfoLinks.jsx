import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Plus, Copy, Check, ExternalLink, Link as LinkIcon, Building2, FileText,
  Power, PowerOff, Inbox, Search, UserPlus, CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

function genToken() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 20);
}

function formatCnpj(v = '') {
  const d = String(v).replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

const emptyForm = {
  gateway_name: '',
  gateway_cnpj: '',
  gateway_contact_name: '',
  gateway_contact_email: '',
  notes: '',
  merchantId: null,
};

export default function GestaoSubsellerInfoLinks() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [mode, setMode] = useState('existing'); // 'existing' | 'new'
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(emptyForm);

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['subsellerInfoCollections'],
    queryFn: () => base44.entities.SubsellerInfoCollection.list('-created_date', 200),
    initialData: [],
  });

  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants-pj-aprovados'],
    queryFn: () => base44.entities.Merchant.filter({ type: 'PJ', onboardingStatus: 'Aprovado' }, '-created_date', 500),
    initialData: [],
    enabled: open && mode === 'existing',
  });

  const filteredMerchants = useMemo(() => {
    if (!search.trim()) return merchants;
    const q = search.toLowerCase();
    return merchants.filter(m =>
      (m.companyName || '').toLowerCase().includes(q) ||
      (m.fullName || '').toLowerCase().includes(q) ||
      (m.cpfCnpj || '').includes(q) ||
      (m.email || '').toLowerCase().includes(q)
    );
  }, [merchants, search]);

  const resetAndClose = () => {
    setOpen(false);
    setForm(emptyForm);
    setMode('existing');
    setSearch('');
  };

  const createMut = useMutation({
    mutationFn: (data) => {
      const { merchantId, ...rest } = data;
      return base44.entities.SubsellerInfoCollection.create({
        ...rest,
        unique_token: genToken(),
        is_active: true,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subsellerInfoCollections'] });
      resetAndClose();
      toast.success('Link criado!');
    },
    onError: (e) => toast.error(e?.message || 'Erro ao criar link.'),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.SubsellerInfoCollection.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subsellerInfoCollections'] }),
  });

  const selectMerchant = (m) => {
    setForm(f => ({
      ...f,
      gateway_name: m.companyName || m.fullName || '',
      gateway_cnpj: m.cpfCnpj || '',
      gateway_contact_name: m.fullName || '',
      gateway_contact_email: m.email || '',
      merchantId: m.id,
    }));
  };

  const buildUrl = (token) => `${window.location.origin}/SubsellerInfoForm?token=${token}`;

  const handleCopy = async (id, url) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Link copiado!');
  };

  const canSubmit =
    !!form.gateway_name.trim() &&
    (mode === 'new' ? form.gateway_cnpj.replace(/\D/g, '').length === 14 : !!form.merchantId) &&
    !createMut.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#002443]/5 flex items-center justify-center">
            <LinkIcon className="w-5 h-5 text-[#002443]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#002443]">Links de Coleta — Subsellers</h1>
            <p className="text-sm text-[#002443]/60">
              Gere 1 link por cliente Gateway. Eles preenchem a lista de subsellers e você recebe na inbox.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl('SubsellerInfoRecebidos')}>
            <Button variant="outline"><Inbox className="w-4 h-4 mr-2" /> Inbox</Button>
          </Link>
          <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Novo link</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Links totais', value: links.length, icon: LinkIcon, color: '#002443' },
          { label: 'Ativos', value: links.filter(l => l.is_active !== false).length, icon: Power, color: '#2bc196' },
          { label: 'Submissões', value: links.reduce((s, l) => s + (l.submissions_count || 0), 0), icon: FileText, color: '#36706c' },
          { label: 'Subsellers', value: links.reduce((s, l) => s + (l.total_subsellers_count || 0), 0), icon: Building2, color: '#2bc196' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#002443]/5 p-4">
            <div className="flex items-center gap-2 mb-1">
              <k.icon className="w-4 h-4" style={{ color: k.color }} />
              <p className="text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
            </div>
            <p className="text-[10px] text-[#002443]/40">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      {isLoading ? (
        <Card><CardContent className="p-8 text-center text-sm text-[#002443]/40">Carregando...</CardContent></Card>
      ) : links.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <LinkIcon className="w-10 h-10 text-[#002443]/20 mx-auto mb-3" />
          <p className="text-sm text-[#002443]/60 mb-4">Nenhum link gerado ainda.</p>
          <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Criar primeiro link</Button>
        </CardContent></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {links.map(link => {
            const url = buildUrl(link.unique_token);
            const inactive = link.is_active === false;
            return (
              <Card key={link.id} className={inactive ? 'opacity-60' : ''}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-[#002443] truncate">{link.gateway_name}</h3>
                        {inactive && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-bold">OFF</span>}
                      </div>
                      {link.gateway_cnpj && (
                        <p className="text-[11px] text-[#002443]/60 font-mono">{formatCnpj(link.gateway_cnpj)}</p>
                      )}
                      {link.gateway_contact_name && (
                        <p className="text-xs text-[#002443]/50 truncate">{link.gateway_contact_name} {link.gateway_contact_email && `· ${link.gateway_contact_email}`}</p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleMut.mutate({ id: link.id, is_active: inactive })}
                      className="text-[#002443]/30 hover:text-[#002443]/70 p-1 flex-shrink-0"
                      title={inactive ? 'Ativar' : 'Desativar'}
                    >
                      {inactive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4 text-[#2bc196]" />}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-[#f4f4f4] rounded-lg p-2">
                      <div className="text-[9px] text-[#002443]/40 uppercase font-bold">Submissões</div>
                      <div className="text-base font-bold text-[#002443]">{link.submissions_count || 0}</div>
                    </div>
                    <div className="bg-[#f4f4f4] rounded-lg p-2">
                      <div className="text-[9px] text-[#002443]/40 uppercase font-bold">Subsellers</div>
                      <div className="text-base font-bold text-[#2bc196]">{link.total_subsellers_count || 0}</div>
                    </div>
                  </div>

                  <div className="bg-[#002443]/3 rounded-lg p-2 mb-3 truncate text-[11px] font-mono text-[#002443]/60" title={url}>
                    {url}
                  </div>

                  <div className="flex gap-1.5">
                    <Button size="sm" variant={copiedId === link.id ? 'default' : 'outline'} onClick={() => handleCopy(link.id, url)} className="flex-1">
                      {copiedId === link.id ? <><Check className="w-3.5 h-3.5 mr-1.5" /> Copiado</> : <><Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar</>}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => window.open(url, '_blank')}>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Dialog open={open} onOpenChange={(v) => (v ? setOpen(true) : resetAndClose())}>
        <DialogContent className="w-[95vw] sm:max-w-xl max-h-[85vh] overflow-y-auto p-5 space-y-4">
          <DialogHeader className="pb-0">
            <DialogTitle>Novo link para Gateway</DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-[#f4f4f4] rounded-xl">
            <button
              type="button"
              onClick={() => { setMode('existing'); setForm(emptyForm); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                mode === 'existing' ? 'bg-white text-[#002443] shadow-sm' : 'text-[#002443]/50 hover:text-[#002443]'
              }`}
            >
              <Building2 className="w-4 h-4" /> Cliente já fechado
            </button>
            <button
              type="button"
              onClick={() => { setMode('new'); setForm(emptyForm); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                mode === 'new' ? 'bg-white text-[#002443] shadow-sm' : 'text-[#002443]/50 hover:text-[#002443]'
              }`}
            >
              <UserPlus className="w-4 h-4" /> Cadastrar manualmente
            </button>
          </div>

          {/* JORNADA 1 — selecionar cliente fechado */}
          {mode === 'existing' && (
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#002443]/40 pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por nome, CNPJ ou email..."
                  className="pl-9"
                />
              </div>

              <div className="max-h-64 overflow-y-auto border border-[#002443]/10 rounded-xl divide-y divide-[#002443]/5">
                {filteredMerchants.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#002443]/40">
                    {merchants.length === 0 ? 'Nenhum cliente PJ aprovado encontrado.' : 'Nenhum resultado para a busca.'}
                  </div>
                ) : (
                  filteredMerchants.slice(0, 50).map(m => {
                    const selected = form.merchantId === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => selectMerchant(m)}
                        className={`w-full text-left p-3 hover:bg-[#2bc196]/5 transition-colors flex items-center gap-3 ${selected ? 'bg-[#2bc196]/10' : ''}`}
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#002443]/5 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-[#002443]/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-[#002443] truncate">{m.companyName || m.fullName}</div>
                          <div className="text-[11px] text-[#002443]/50 truncate">
                            {m.cpfCnpj ? formatCnpj(m.cpfCnpj) : '—'} {m.email && `· ${m.email}`}
                          </div>
                        </div>
                        {selected && <CheckCircle2 className="w-5 h-5 text-[#2bc196] flex-shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>

              {form.merchantId && (
                <div className="bg-[#2bc196]/5 border border-[#2bc196]/20 rounded-xl p-3 space-y-2">
                  <p className="text-[11px] font-bold text-[#002443] uppercase">Selecionado · revise os contatos</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={form.gateway_contact_name}
                      onChange={(e) => setForm({ ...form, gateway_contact_name: e.target.value })}
                      placeholder="Contato"
                      className="h-9 text-xs"
                    />
                    <Input
                      value={form.gateway_contact_email}
                      onChange={(e) => setForm({ ...form, gateway_contact_email: e.target.value })}
                      placeholder="Email"
                      type="email"
                      className="h-9 text-xs"
                    />
                  </div>
                  <Textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    placeholder="Notas internas (opcional)"
                    className="h-16 text-xs"
                  />
                </div>
              )}

              <Button className="w-full" onClick={() => createMut.mutate(form)} disabled={!canSubmit}>
                {createMut.isPending ? 'Criando...' : form.merchantId ? `Gerar link para ${form.gateway_name}` : 'Selecione um cliente acima'}
              </Button>
            </div>
          )}

          {/* JORNADA 2 — cadastro manual */}
          {mode === 'new' && (
            <div className="space-y-3">
              <p className="text-[11px] text-[#002443]/50 bg-[#002443]/[0.03] rounded-lg p-2">
                Use esta opção para Gateways que ainda não fecharam contrato com a Pagsmile.
              </p>
              <div>
                <Label className="text-xs">Nome do Gateway *</Label>
                <Input
                  value={form.gateway_name}
                  onChange={(e) => setForm({ ...form, gateway_name: e.target.value })}
                  placeholder="Ex: Gateway XYZ"
                />
              </div>
              <div>
                <Label className="text-xs">CNPJ *</Label>
                <Input
                  value={formatCnpj(form.gateway_cnpj)}
                  onChange={(e) => setForm({ ...form, gateway_cnpj: e.target.value.replace(/\D/g, '').slice(0, 14) })}
                  placeholder="00.000.000/0000-00"
                  inputMode="numeric"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Contato (nome)</Label>
                  <Input
                    value={form.gateway_contact_name}
                    onChange={(e) => setForm({ ...form, gateway_contact_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs">Contato (email)</Label>
                  <Input
                    value={form.gateway_contact_email}
                    onChange={(e) => setForm({ ...form, gateway_contact_email: e.target.value })}
                    type="email"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Notas internas</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="h-20"
                />
              </div>
              <Button className="w-full" onClick={() => createMut.mutate(form)} disabled={!canSubmit}>
                {createMut.isPending ? 'Criando...' : 'Gerar link'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}