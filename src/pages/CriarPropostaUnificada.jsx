import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link2, Copy, CheckCircle2, Globe2, Flag, Save, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Página admin para criar um pacote unificado linkando propostas Brasil
 * (Proposal / StandardProposal / PixProposal) e GlobalProposal existentes.
 * Gera um link público /u/:slug com tabs Brasil/Global.
 */
export default function CriarPropostaUnificada() {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    client_name: '',
    contact_name: '',
    contact_email: '',
    default_language: 'pt',
    valid_until: '',
    br_proposal_id: '',
    br_standard_proposal_id: '',
    br_pix_proposal_id: '',
    global_proposal_id: '',
    notes: '',
  });
  const [createdSlug, setCreatedSlug] = useState(null);

  // Carrega propostas existentes para os seletores (limit razoável; sort por mais recentes)
  const { data: brCustom = [] } = useQuery({
    queryKey: ['proposals', 'brCustom'],
    queryFn: () => base44.entities.Proposal.list('-created_date', 200),
    initialData: [],
  });
  const { data: brStandard = [] } = useQuery({
    queryKey: ['proposals', 'brStandard'],
    queryFn: () => base44.entities.StandardProposal.list('-created_date', 200),
    initialData: [],
  });
  const { data: brPix = [] } = useQuery({
    queryKey: ['proposals', 'brPix'],
    queryFn: () => base44.entities.PixProposal.list('-created_date', 200),
    initialData: [],
  });
  const { data: globalProps = [] } = useQuery({
    queryKey: ['proposals', 'global'],
    queryFn: () => base44.entities.GlobalProposal.list('-created_date', 200),
    initialData: [],
  });

  const hasAnyProposal = useMemo(() => {
    return !!(form.br_proposal_id || form.br_standard_proposal_id || form.br_pix_proposal_id || form.global_proposal_id);
  }, [form]);

  const slugFromName = (name) => {
    const base = String(name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'proposta';
    return `${base}-${Math.random().toString(36).slice(2, 8)}`;
  };

  const createM = useMutation({
    mutationFn: async () => {
      if (!form.client_name || !form.contact_email) throw new Error('Preencha cliente e e-mail.');
      if (!hasAnyProposal) throw new Error('Vincule pelo menos uma proposta (Brasil ou Global).');
      const slug = slugFromName(form.client_name);
      const created = await base44.entities.UnifiedProposalPackage.create({
        ...form,
        public_slug: slug,
        status: 'sent',
      });
      return created;
    },
    onSuccess: (pkg) => {
      setCreatedSlug(pkg.public_slug);
      toast.success('Pacote criado! Link pronto para envio.');
      qc.invalidateQueries({ queryKey: ['unifiedPackages'] });
    },
    onError: (e) => toast.error(e.message),
  });

  const publicUrl = createdSlug ? `${window.location.origin}/u/${createdSlug}` : '';
  const setF = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const propLabel = (p, currency = 'BRL') => {
    const name = p.client_name || p.company_name || p.commercial_name || '(sem nome)';
    const date = p.created_date ? new Date(p.created_date).toLocaleDateString('pt-BR') : '';
    return `${name} · ${date}`;
  };

  if (createdSlug) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="border-[#2bc196]/30 bg-gradient-to-br from-white to-[#2bc196]/5">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-14 h-14 text-[#2bc196] mx-auto mb-3" />
            <h2 className="text-xl font-bold text-[#002443] mb-1">Pacote criado!</h2>
            <p className="text-sm text-[#002443]/70 mb-5">Envie o link abaixo para o cliente. Ele verá Brasil e Global em abas no mesmo lugar.</p>

            <div className="bg-white border-2 border-[#2bc196]/40 rounded-xl p-3 flex items-center gap-2 mb-4">
              <Link2 className="w-4 h-4 text-[#2bc196] flex-shrink-0" />
              <code className="flex-1 text-sm text-[#002443] truncate text-left">{publicUrl}</code>
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('Link copiado!'); }}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" onClick={() => window.open(publicUrl, '_blank')}>
                <ExternalLink className="w-3.5 h-3.5 mr-1" /> Abrir
              </Button>
            </div>

            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => { setCreatedSlug(null); setForm({ ...form, client_name: '', contact_email: '', br_proposal_id: '', br_standard_proposal_id: '', br_pix_proposal_id: '', global_proposal_id: '' }); }}>
                Criar outro pacote
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#002443]">Criar Proposta Unificada</h1>
        <p className="text-sm text-[#002443]/60 mt-1">Linka propostas Brasil e Global existentes em um único link público com abas.</p>
      </div>

      {/* Dados do cliente */}
      <Card>
        <CardHeader><CardTitle className="text-base">Cliente</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <div><Label className="text-xs">Nome do cliente *</Label><Input value={form.client_name} onChange={e => setF('client_name', e.target.value)} /></div>
          <div><Label className="text-xs">Contato</Label><Input value={form.contact_name} onChange={e => setF('contact_name', e.target.value)} /></div>
          <div><Label className="text-xs">E-mail *</Label><Input type="email" value={form.contact_email} onChange={e => setF('contact_email', e.target.value)} /></div>
          <div>
            <Label className="text-xs">Idioma inicial</Label>
            <Select value={form.default_language} onValueChange={v => setF('default_language', v)}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pt">Português 🇧🇷</SelectItem>
                <SelectItem value="en">English 🇺🇸</SelectItem>
                <SelectItem value="zh">中文 🇨🇳</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label className="text-xs">Válida até</Label><Input type="date" value={form.valid_until} onChange={e => setF('valid_until', e.target.value)} /></div>
        </CardContent>
      </Card>

      {/* Linkagem Brasil */}
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Flag className="w-4 h-4 text-green-600" /> Brasil
            <span className="text-xs font-normal text-[#002443]/50">(opcional — escolha um tipo)</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Proposta Customizada (Proposal)</Label>
            <Select value={form.br_proposal_id || 'none'} onValueChange={v => setF('br_proposal_id', v === 'none' ? '' : v)}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Selecione uma proposta..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— nenhuma —</SelectItem>
                {brCustom.slice(0, 100).map(p => <SelectItem key={p.id} value={p.id}>{propLabel(p)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Proposta Padrão (StandardProposal)</Label>
            <Select value={form.br_standard_proposal_id || 'none'} onValueChange={v => setF('br_standard_proposal_id', v === 'none' ? '' : v)}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Selecione uma proposta padrão..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— nenhuma —</SelectItem>
                {brStandard.slice(0, 100).map(p => <SelectItem key={p.id} value={p.id}>{propLabel(p)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Proposta PIX (PixProposal)</Label>
            <Select value={form.br_pix_proposal_id || 'none'} onValueChange={v => setF('br_pix_proposal_id', v === 'none' ? '' : v)}>
              <SelectTrigger className="h-10"><SelectValue placeholder="Selecione uma proposta PIX..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— nenhuma —</SelectItem>
                {brPix.slice(0, 100).map(p => <SelectItem key={p.id} value={p.id}>{propLabel(p)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Linkagem Global */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-blue-600" /> Global
            <span className="text-xs font-normal text-[#002443]/50">(opcional)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label className="text-xs">Proposta Global (GlobalProposal)</Label>
          <Select value={form.global_proposal_id || 'none'} onValueChange={v => setF('global_proposal_id', v === 'none' ? '' : v)}>
            <SelectTrigger className="h-10"><SelectValue placeholder="Selecione uma proposta global..." /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— nenhuma —</SelectItem>
              {globalProps.slice(0, 100).map(p => <SelectItem key={p.id} value={p.id}>{propLabel(p)} · {p.pricing_model || 'cross-border'}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Ação */}
      <div className="flex justify-end gap-2 sticky bottom-4">
        <Button size="lg" onClick={() => createM.mutate()} disabled={createM.isPending || !hasAnyProposal}>
          <Save className="w-4 h-4 mr-2" />
          {createM.isPending ? 'Gerando link...' : 'Gerar link unificado'}
        </Button>
      </div>

      {!hasAnyProposal && (
        <p className="text-xs text-amber-700 text-right">Selecione ao menos uma proposta para habilitar a geração do link.</p>
      )}
    </div>
  );
}