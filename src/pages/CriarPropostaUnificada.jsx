import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link2, Copy, CheckCircle2, Globe2, Flag, Save, ExternalLink, Plus, Sparkles, ListChecks } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Página única que oferece DOIS modos de criação de Proposta Unificada:
 *
 * MODO A — "Linkar existentes": dropdowns das propostas já criadas (Standard/Pix/Custom/Global)
 * MODO B — "Criar do zero": checkboxes dos módulos desejados + atalhos para criar cada
 *   proposta na sua tela nativa (em nova aba). Ao voltar, basta selecionar nos dropdowns
 *   e empacotar — preserva 100% da lógica de criação existente.
 */
export default function CriarPropostaUnificada() {
  const qc = useQueryClient();
  const [mode, setMode] = useState('link'); // 'link' | 'wizard'
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
  // Modo wizard: quais módulos o usuário decidiu incluir
  const [wizardModules, setWizardModules] = useState({
    br_custom: false,
    br_standard: false,
    br_pix: false,
    global: false,
  });
  const [createdSlug, setCreatedSlug] = useState(null);

  const { data: brCustom = [], refetch: refetchCustom } = useQuery({
    queryKey: ['proposals', 'brCustom'],
    queryFn: () => base44.entities.Proposal.list('-created_date', 200),
    initialData: [],
  });
  const { data: brStandard = [], refetch: refetchStandard } = useQuery({
    queryKey: ['proposals', 'brStandard'],
    queryFn: () => base44.entities.StandardProposal.list('-created_date', 200),
    initialData: [],
  });
  const { data: brPix = [], refetch: refetchPix } = useQuery({
    queryKey: ['proposals', 'brPix'],
    queryFn: () => base44.entities.PixProposal.list('-created_date', 200),
    initialData: [],
  });
  const { data: globalProps = [], refetch: refetchGlobal } = useQuery({
    queryKey: ['proposals', 'global'],
    queryFn: () => base44.entities.GlobalProposal.list('-created_date', 200),
    initialData: [],
  });

  const hasAnyProposal = useMemo(
    () => !!(form.br_proposal_id || form.br_standard_proposal_id || form.br_pix_proposal_id || form.global_proposal_id),
    [form]
  );

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

  const propLabel = (p) => {
    const name = p.client_name || p.clienteNome || p.companyName || p.commercial_name || p.templateName || '(sem nome)';
    const date = p.created_date ? new Date(p.created_date).toLocaleDateString('pt-BR') : '';
    return `${name}${date ? ` · ${date}` : ''}`;
  };

  // Refresh all lists (chamado quando usuário volta da criação em nova aba)
  const refreshAll = () => {
    refetchCustom(); refetchStandard(); refetchPix(); refetchGlobal();
    toast.success('Lista de propostas atualizada.');
  };

  // ── Tela de sucesso ──
  if (createdSlug) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="border-[#1356E2]/30 bg-gradient-to-br from-white to-[#1356E2]/5">
          <CardContent className="pt-6 text-center">
            <CheckCircle2 className="w-14 h-14 text-[#1356E2] mx-auto mb-3" />
            <h2 className="text-xl font-bold text-[#0A0A0A] mb-1">Pacote criado!</h2>
            <p className="text-sm text-[#0A0A0A]/70 mb-5">Envie o link abaixo para o cliente. Ele verá Brasil e Global em abas no mesmo lugar.</p>
            <div className="bg-white border-2 border-[#1356E2]/40 rounded-xl p-3 flex items-center gap-2 mb-4">
              <Link2 className="w-4 h-4 text-[#1356E2] flex-shrink-0" />
              <code className="flex-1 text-sm text-[#0A0A0A] truncate text-left">{publicUrl}</code>
              <Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success('Link copiado!'); }}>
                <Copy className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" onClick={() => window.open(publicUrl, '_blank')}>
                <ExternalLink className="w-3.5 h-3.5 mr-1" /> Abrir
              </Button>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => {
                setCreatedSlug(null);
                setForm({ ...form, client_name: '', contact_email: '', br_proposal_id: '', br_standard_proposal_id: '', br_pix_proposal_id: '', global_proposal_id: '' });
                setWizardModules({ br_custom: false, br_standard: false, br_pix: false, global: false });
              }}>
                Criar outro pacote
              </Button>
              <Link to="/HubPropostas"><Button variant="ghost">Voltar ao Hub</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Renderer comum dos dropdowns de seleção ──
  const ProposalDropdown = ({ label, value, onChange, items, currencyHint }) => (
    <Select value={value || 'none'} onValueChange={v => onChange(v === 'none' ? '' : v)}>
      <SelectTrigger className="h-10"><SelectValue placeholder={`Selecione uma proposta ${label.toLowerCase()}...`} /></SelectTrigger>
      <SelectContent>
        <SelectItem value="none">— nenhuma —</SelectItem>
        {items.slice(0, 100).map(p => (
          <SelectItem key={p.id} value={p.id}>
            {propLabel(p)}{currencyHint ? ` · ${currencyHint}` : ''}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-[#0A0A0A]">Criar Proposta Unificada</h1>
        <p className="text-sm text-[#0A0A0A]/60 mt-1">Combine propostas Brasil + Global em um único link público com abas.</p>
      </div>

      {/* Switch de modo */}
      <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 shadow-sm p-1.5 inline-flex gap-1">
        <button
          onClick={() => setMode('link')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            mode === 'link' ? 'bg-[#0A0A0A] text-white' : 'text-[#0A0A0A]/60 hover:bg-[#f4f4f4]'
          }`}
        >
          <ListChecks className="w-4 h-4" /> Linkar existentes
        </button>
        <button
          onClick={() => setMode('wizard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            mode === 'wizard' ? 'bg-[#0A0A0A] text-white' : 'text-[#0A0A0A]/60 hover:bg-[#f4f4f4]'
          }`}
        >
          <Sparkles className="w-4 h-4" /> Criar do zero
        </button>
      </div>

      {/* Dados do cliente (compartilhado entre os dois modos) */}
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

      {/* MODO A — Linkar existentes */}
      {mode === 'link' && (
        <>
          <Card className="border-green-200">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Flag className="w-4 h-4 text-green-600" /> Brasil <span className="text-xs font-normal text-[#0A0A0A]/50">(opcional)</span></CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label className="text-xs">Proposta Customizada</Label>
                <ProposalDropdown label="customizada" value={form.br_proposal_id} onChange={v => setF('br_proposal_id', v)} items={brCustom} />
              </div>
              <div><Label className="text-xs">Proposta Padrão</Label>
                <ProposalDropdown label="padrão" value={form.br_standard_proposal_id} onChange={v => setF('br_standard_proposal_id', v)} items={brStandard} />
              </div>
              <div><Label className="text-xs">Proposta PIX</Label>
                <ProposalDropdown label="PIX" value={form.br_pix_proposal_id} onChange={v => setF('br_pix_proposal_id', v)} items={brPix} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200">
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe2 className="w-4 h-4 text-blue-600" /> Global <span className="text-xs font-normal text-[#0A0A0A]/50">(opcional)</span></CardTitle></CardHeader>
            <CardContent>
              <Label className="text-xs">Proposta Global</Label>
              <ProposalDropdown label="global" value={form.global_proposal_id} onChange={v => setF('global_proposal_id', v)} items={globalProps} />
            </CardContent>
          </Card>
        </>
      )}

      {/* MODO B — Criar do zero (wizard) */}
      {mode === 'wizard' && (
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50/30 to-white">
          <CardHeader>
            <CardTitle className="text-base">Escolha os módulos e crie cada proposta</CardTitle>
            <p className="text-xs text-[#0A0A0A]/60 mt-1">
              Marque os módulos desejados, clique em "Criar" para cada um (abre a tela específica em nova aba),
              volte aqui e selecione as propostas recém-criadas no dropdown abaixo de cada módulo.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <WizardModuleBlock
              checked={wizardModules.br_custom}
              onCheck={(v) => setWizardModules(prev => ({ ...prev, br_custom: v }))}
              title="Proposta Brasil — Customizada"
              icon={<Flag className="w-4 h-4 text-green-600" />}
              createUrl="/CriarProposta"
              accent="green"
            >
              <ProposalDropdown label="customizada" value={form.br_proposal_id} onChange={v => setF('br_proposal_id', v)} items={brCustom} />
            </WizardModuleBlock>

            <WizardModuleBlock
              checked={wizardModules.br_standard}
              onCheck={(v) => setWizardModules(prev => ({ ...prev, br_standard: v }))}
              title="Proposta Brasil — Padrão"
              icon={<Flag className="w-4 h-4 text-green-600" />}
              createUrl="/CriarPropostaPadrao"
              accent="green"
            >
              <ProposalDropdown label="padrão" value={form.br_standard_proposal_id} onChange={v => setF('br_standard_proposal_id', v)} items={brStandard} />
            </WizardModuleBlock>

            <WizardModuleBlock
              checked={wizardModules.br_pix}
              onCheck={(v) => setWizardModules(prev => ({ ...prev, br_pix: v }))}
              title="Proposta Brasil — PIX"
              icon={<Flag className="w-4 h-4 text-green-600" />}
              createUrl="/CriarPropostaPix"
              accent="green"
            >
              <ProposalDropdown label="PIX" value={form.br_pix_proposal_id} onChange={v => setF('br_pix_proposal_id', v)} items={brPix} />
            </WizardModuleBlock>

            <WizardModuleBlock
              checked={wizardModules.global}
              onCheck={(v) => setWizardModules(prev => ({ ...prev, global: v }))}
              title="Proposta Global (USD)"
              icon={<Globe2 className="w-4 h-4 text-blue-600" />}
              createUrl="/HubPropostas?tab=global"
              accent="blue"
            >
              <ProposalDropdown label="global" value={form.global_proposal_id} onChange={v => setF('global_proposal_id', v)} items={globalProps} />
            </WizardModuleBlock>

            <div className="flex justify-center pt-2">
              <Button variant="outline" size="sm" onClick={refreshAll}>
                🔄 Atualizar lista de propostas (após criar uma nova aba)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ação final */}
      <div className="flex justify-end gap-2 sticky bottom-4">
        <Button size="lg" onClick={() => createM.mutate()} disabled={createM.isPending || !hasAnyProposal}>
          <Save className="w-4 h-4 mr-2" />
          {createM.isPending ? 'Gerando link...' : 'Gerar link unificado'}
        </Button>
      </div>

      {!hasAnyProposal && (
        <p className="text-xs text-amber-700 text-right">Selecione ou crie ao menos uma proposta para habilitar o link.</p>
      )}
    </div>
  );
}

/**
 * Bloco do modo wizard — checkbox + título + atalho "Criar" + dropdown
 * para selecionar a proposta recém-criada.
 */
function WizardModuleBlock({ checked, onCheck, title, icon, createUrl, accent, children }) {
  const accentBorder = accent === 'green' ? 'border-green-200' : 'border-blue-200';
  return (
    <div className={`rounded-xl border-2 ${checked ? accentBorder : 'border-[#0A0A0A]/10'} bg-white p-4 transition-all`}>
      <div className="flex items-center gap-3 mb-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onCheck(e.target.checked)}
          className="w-4 h-4 accent-[#1356E2]"
        />
        <div className="flex items-center gap-2 flex-1">
          {icon}
          <span className="text-sm font-semibold text-[#0A0A0A]">{title}</span>
        </div>
        {checked && (
          <a href={createUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline" className="gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Criar
              <ExternalLink className="w-3 h-3 opacity-50" />
            </Button>
          </a>
        )}
      </div>
      {checked && <div className="ml-7">{children}</div>}
    </div>
  );
}