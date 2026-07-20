import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Plus, Copy, Check, ExternalLink, Link as LinkIcon, Building2, FileText,
  Power, PowerOff, Inbox, Star, Edit3
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import CreateLinkModal from '@/components/subseller-info/CreateLinkModal';
import CreateDirectLinkModal from '@/components/subseller-info/CreateDirectLinkModal';

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

export default function GestaoSubsellerInfoLinks() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [directModalOpen, setDirectModalOpen] = useState(false);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const { data: links = [], isLoading } = useQuery({
    queryKey: ['subsellerInfoCollections'],
    queryFn: () => base44.entities.SubsellerInfoCollection.list('-created_date', 200),
    initialData: [],
  });

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
      setModalOpen(false);
      toast.success('Link criado!');
    },
    onError: (e) => toast.error(e?.message || 'Erro ao criar link.'),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }) => base44.entities.SubsellerInfoCollection.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['subsellerInfoCollections'] }),
  });

  // Link Direto Pin Bank — cria collection sob "Pin Bank Direto" e fecha modal
  const createDirectMut = useMutation({
    mutationFn: (data) => base44.entities.SubsellerInfoCollection.create({
      ...data,
      unique_token: genToken(),
      is_active: true,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subsellerInfoCollections'] });
      setDirectModalOpen(false);
      toast.success('Link direto criado!');
    },
    onError: (e) => toast.error(e?.message || 'Erro ao criar link.'),
  });

  // Cadastro manual — cria collection + redireciona para o form interno preenchido
  const createManualMut = useMutation({
    mutationFn: (data) => base44.entities.SubsellerInfoCollection.create({
      ...data,
      unique_token: genToken(),
      is_active: true,
    }),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['subsellerInfoCollections'] });
      setManualModalOpen(false);
      toast.success('Abrindo formulário…');
      // Mesma tela do cliente, mas você que preenche. Token autentica a collection.
      window.location.href = `/SubsellerInfoForm?token=${created.unique_token}`;
    },
    onError: (e) => toast.error(e?.message || 'Erro ao iniciar cadastro.'),
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0A0A0A]/5 flex items-center justify-center">
            <LinkIcon className="w-5 h-5 text-[#0A0A0A]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0A0A0A]">Links de Coleta — Subsellers</h1>
            <p className="text-sm text-[#0A0A0A]/60">
              Gere 1 link por cliente Gateway. Eles preenchem a lista de subsellers e você recebe na inbox.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={createPageUrl('SubsellerInfoRecebidos')}>
            <Button variant="outline"><Inbox className="w-4 h-4 mr-2" /> Inbox</Button>
          </Link>
          <Button variant="outline" onClick={() => setManualModalOpen(true)} className="border-[#1356E2]/40 text-[#E84B1C] hover:bg-[#1356E2]/5">
            <Edit3 className="w-4 h-4 mr-2" /> Cadastrar manualmente
          </Button>
          <Button variant="outline" onClick={() => setDirectModalOpen(true)} className="border-[#1356E2]/40 text-[#E84B1C] hover:bg-[#1356E2]/5">
            <Star className="w-4 h-4 mr-2" /> Link Direto Pin Bank
          </Button>
          <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Novo link Gateway</Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Links totais', value: links.length, icon: LinkIcon, color: '#0A0A0A' },
          { label: 'Ativos', value: links.filter(l => l.is_active !== false).length, icon: Power, color: '#1356E2' },
          { label: 'Submissões', value: links.reduce((s, l) => s + (l.submissions_count || 0), 0), icon: FileText, color: '#E84B1C' },
          { label: 'Subsellers', value: links.reduce((s, l) => s + (l.total_subsellers_count || 0), 0), icon: Building2, color: '#1356E2' },
        ].map((k, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#0A0A0A]/5 p-4">
            <div className="flex items-center gap-2 mb-1">
              <k.icon className="w-4 h-4" style={{ color: k.color }} />
              <p className="text-xl font-bold" style={{ color: k.color }}>{k.value}</p>
            </div>
            <p className="text-[10px] text-[#0A0A0A]/40">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Lista */}
      {isLoading ? (
        <Card><CardContent className="p-8 text-center text-sm text-[#0A0A0A]/40">Carregando...</CardContent></Card>
      ) : links.length === 0 ? (
        <Card><CardContent className="p-12 text-center">
          <LinkIcon className="w-10 h-10 text-[#0A0A0A]/20 mx-auto mb-3" />
          <p className="text-sm text-[#0A0A0A]/60 mb-4">Nenhum link gerado ainda.</p>
          <Button onClick={() => setModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Criar primeiro link</Button>
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
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-bold text-[#0A0A0A] truncate">{link.gateway_name}</h3>
                        {link.collection_mode === 'simple' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1356E2]/10 text-[#E84B1C] font-bold uppercase tracking-wider">⚡ Simplificado</span>
                        )}
                        {inactive && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-bold">OFF</span>}
                      </div>
                      {link.gateway_cnpj && (
                        <p className="text-[11px] text-[#0A0A0A]/60 font-mono">{formatCnpj(link.gateway_cnpj)}</p>
                      )}
                      {link.gateway_contact_name && (
                        <p className="text-xs text-[#0A0A0A]/50 truncate">{link.gateway_contact_name} {link.gateway_contact_email && `· ${link.gateway_contact_email}`}</p>
                      )}
                    </div>
                    <button
                      onClick={() => toggleMut.mutate({ id: link.id, is_active: inactive })}
                      className="text-[#0A0A0A]/30 hover:text-[#0A0A0A]/70 p-1 flex-shrink-0"
                      title={inactive ? 'Ativar' : 'Desativar'}
                    >
                      {inactive ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4 text-[#1356E2]" />}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-[#f4f4f4] rounded-lg p-2">
                      <div className="text-[9px] text-[#0A0A0A]/40 uppercase font-bold">Submissões</div>
                      <div className="text-base font-bold text-[#0A0A0A]">{link.submissions_count || 0}</div>
                    </div>
                    <div className="bg-[#f4f4f4] rounded-lg p-2">
                      <div className="text-[9px] text-[#0A0A0A]/40 uppercase font-bold">Subsellers</div>
                      <div className="text-base font-bold text-[#1356E2]">{link.total_subsellers_count || 0}</div>
                    </div>
                  </div>

                  <div className="bg-[#0A0A0A]/3 rounded-lg p-2 mb-3 truncate text-[11px] font-mono text-[#0A0A0A]/60" title={url}>
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

      <CreateLinkModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={(data) => createMut.mutate(data)}
        isSubmitting={createMut.isPending}
      />

      <CreateDirectLinkModal
        open={directModalOpen}
        onClose={() => setDirectModalOpen(false)}
        onSubmit={(data) => createDirectMut.mutate(data)}
        isSubmitting={createDirectMut.isPending}
        mode="link"
      />

      <CreateDirectLinkModal
        open={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        onSubmit={(data) => createManualMut.mutate(data)}
        isSubmitting={createManualMut.isPending}
        mode="manual"
      />
    </div>
  );
}