import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Copy, Check, ExternalLink, Link as LinkIcon, Building2, Users, FileText, Power, PowerOff, Inbox } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

function genToken() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 20);
}

export default function GestaoSubsellerInfoLinks() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [form, setForm] = useState({ gateway_name: '', gateway_contact_name: '', gateway_contact_email: '', notes: '' });

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['subsellerInfoCollections'],
    queryFn: () => base44.entities.SubsellerInfoCollection.list('-created_date', 200),
    initialData: [],
  });

  const createMut = useMutation({
    mutationFn: (data) => base44.entities.SubsellerInfoCollection.create({
      ...data, unique_token: genToken(), is_active: true,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subsellerInfoCollections'] });
      setOpen(false);
      setForm({ gateway_name: '', gateway_contact_name: '', gateway_contact_email: '', notes: '' });
      toast.success('Link criado!');
    },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.SubsellerInfoCollection.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subsellerInfoCollections'] }),
  });

  const buildUrl = (token) => `${window.location.origin}/SubsellerInfoForm?token=${token}`;

  const handleCopy = async (id, url) => {
    await navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success('Link copiado!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#002443]/5 flex items-center justify-center">
            <LinkIcon className="w-5 h-5 text-[#002443]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#002443]">Links de Coleta — Subsellers</h1>
            <p className="text-sm text-[#002443]/60">
              Gere 1 link por cliente Gateway. Eles preenchem a lista de subsellers (nome, CNPJ, modelo, oferta, volume, conta bancária) e você recebe na inbox.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl('SubsellerInfoRecebidos')}>
            <Button variant="outline"><Inbox className="w-4 h-4 mr-2" /> Inbox de Submissões</Button>
          </Link>
          <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> Novo link</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Links totais', value: links.length, icon: LinkIcon, color: '#002443' },
          { label: 'Ativos', value: links.filter(l => l.is_active !== false).length, icon: Power, color: '#2bc196' },
          { label: 'Submissões totais', value: links.reduce((s, l) => s + (l.submissions_count || 0), 0), icon: FileText, color: '#36706c' },
          { label: 'Subsellers totais', value: links.reduce((s, l) => s + (l.total_subsellers_count || 0), 0), icon: Building2, color: '#2bc196' },
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

      {/* List */}
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
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-[#002443]">{link.gateway_name}</h3>
                        {inactive && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-bold">DESATIVADO</span>}
                      </div>
                      {link.gateway_contact_name && (
                        <p className="text-xs text-[#002443]/50">{link.gateway_contact_name} {link.gateway_contact_email && `· ${link.gateway_contact_email}`}</p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleMut.mutate({ id: link.id, is_active: inactive })}
                      className="text-[#002443]/30 hover:text-[#002443]/70 p-1"
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo link para Gateway</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Nome do Gateway *</Label>
              <Input value={form.gateway_name} onChange={(e) => setForm({ ...form, gateway_name: e.target.value })} placeholder="Ex: Gateway XYZ" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Contato (nome)</Label>
                <Input value={form.gateway_contact_name} onChange={(e) => setForm({ ...form, gateway_contact_name: e.target.value })} />
              </div>
              <div>
                <Label>Contato (email)</Label>
                <Input value={form.gateway_contact_email} onChange={(e) => setForm({ ...form, gateway_contact_email: e.target.value })} type="email" />
              </div>
            </div>
            <div>
              <Label>Notas internas</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="h-20" />
            </div>
            <Button
              className="w-full"
              onClick={() => createMut.mutate(form)}
              disabled={!form.gateway_name?.trim() || createMut.isPending}
            >
              {createMut.isPending ? 'Criando...' : 'Gerar link'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}