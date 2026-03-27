import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, FileText, Loader2, Building2, Banknote, Shield } from 'lucide-react';
import { toast } from 'sonner';
import CnpjInput from '@/components/proposals/CnpjInput';

const parseTaxa = (val) => {
  if (!val && val !== 0) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export default function CriarPropostaPix() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const leadId = urlParams.get('lead') || urlParams.get('lead_id') || urlParams.get('leadId');
  const editId = urlParams.get('edit');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    clienteNome: '', clienteCnpj: '', clienteMcc: '', clienteContato: '',
    dataValidade: new Date(new Date().setDate(new Date().getDate() + 15)),
  });

  const [pixTipo, setPixTipo] = useState('percentual');
  const [pixValor, setPixValor] = useState('');
  const [minimoGarantido, setMinimoGarantido] = useState({ mes1: '', mes2: '', mes3: '' });

  const { data: lead } = useQuery({
    queryKey: ['lead-for-pix-proposal', leadId],
    queryFn: async () => { const leads = await base44.entities.Lead.filter({ id: leadId }); return leads[0] || null; },
    enabled: !!leadId && !editId
  });

  const { data: existingProposal } = useQuery({
    queryKey: ['pix-proposal-edit', editId],
    queryFn: async () => { const proposals = await base44.entities.PixProposal.filter({ id: editId }); return proposals[0] || null; },
    enabled: !!editId
  });

  const { data: leads } = useQuery({
    queryKey: ['leads-list-pix'],
    queryFn: () => base44.entities.Lead.list('-created_date', 100),
  });

  useEffect(() => {
    if (existingProposal) {
      setForm({
        clienteNome: existingProposal.clienteNome || '',
        clienteCnpj: existingProposal.clienteCnpj || '',
        clienteMcc: existingProposal.clienteMcc || '',
        clienteContato: existingProposal.clienteContato || '',
        dataValidade: existingProposal.validUntil ? new Date(existingProposal.validUntil) : new Date(),
      });
      const r = existingProposal.rates || {};
      setPixTipo(r.pix?.tipo || 'percentual');
      setPixValor(r.pix?.valor ?? '');
      setMinimoGarantido(r.minimoGarantido || { mes1: '', mes2: '', mes3: '' });
    }
  }, [existingProposal]);

  useEffect(() => {
    if (lead && !editId) {
      setForm(prev => ({
        ...prev,
        clienteNome: lead.companyName || lead.fullName || '',
        clienteCnpj: (lead.cpfCnpj || '').replace(/\D/g, ''),
        clienteMcc: lead.mcc || '',
        clienteContato: lead.contactName || '',
      }));
    }
  }, [lead, editId]);

  const updateForm = (field, value) => { setForm(prev => ({ ...prev, [field]: value })); setErrors(prev => ({ ...prev, [field]: undefined })); };

  const handleLeadSelect = (selectedLeadId) => {
    const selected = leads?.find(l => l.id === selectedLeadId);
    if (selected) {
      updateForm('clienteNome', selected.companyName || selected.fullName || '');
      updateForm('clienteCnpj', (selected.cpfCnpj || '').replace(/\D/g, ''));
      updateForm('clienteMcc', selected.mcc || '');
      updateForm('clienteContato', selected.contactName || '');
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.clienteNome) newErrors.clienteNome = 'Obrigatório';
    if (!form.clienteCnpj || form.clienteCnpj.replace(/\D/g, '').length !== 14) newErrors.clienteCnpj = 'CNPJ inválido (14 dígitos)';
    if (!pixValor && pixValor !== 0) newErrors.pixValor = 'Informe o valor da taxa PIX';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const gerarCodigo = () => `PIX-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
  const gerarToken = () => { const c = 'abcdefghijklmnopqrstuvwxyz0123456789'; let t = ''; for (let i = 0; i < 64; i++) t += c.charAt(Math.floor(Math.random() * c.length)); return t; };

  const buildData = async (status) => {
    let criadoPor = 'sistema';
    try { const user = await base44.auth.me(); criadoPor = user?.email || user?.id || 'sistema'; } catch (e) {}
    return {
      leadId: leadId || existingProposal?.leadId || '',
      codigo: existingProposal?.codigo || gerarCodigo(),
      proposalName: `Proposta PIX - ${form.clienteNome}`,
      status,
      origem: 'manual',
      clienteNome: form.clienteNome,
      clienteCnpj: form.clienteCnpj.replace(/\D/g, ''),
      clienteContato: form.clienteContato,
      clienteMcc: form.clienteMcc,
      rates: {
        pix: { tipo: pixTipo, valor: parseTaxa(pixValor) },
        minimoGarantido: {
          mes1: parseTaxa(minimoGarantido.mes1),
          mes2: parseTaxa(minimoGarantido.mes2),
          mes3: parseTaxa(minimoGarantido.mes3),
        },
      },
      validUntil: form.dataValidade.toISOString(),
      tokenPublico: existingProposal?.tokenPublico || gerarToken(),
      responsavelId: criadoPor,
      responsavelNome: criadoPor,
    };
  };

  const handleSalvarRascunho = async () => {
    setSaving(true);
    const data = await buildData('rascunho');
    if (editId) { await base44.entities.PixProposal.update(editId, data); toast.success('Rascunho atualizado!'); }
    else { await base44.entities.PixProposal.create(data); toast.success('Rascunho salvo!'); }
    setSaving(false);
    navigate('/GestaoPropostasPix');
  };

  const handleGerarProposta = async () => {
    if (!validate()) { toast.error('Preencha todos os campos obrigatórios'); return; }
    setSaving(true);
    const data = await buildData('enviada');
    let created;
    if (editId) { await base44.entities.PixProposal.update(editId, data); created = { id: editId }; }
    else { created = await base44.entities.PixProposal.create(data); }
    await base44.entities.AuditLog.create({
      entityName: 'PixProposal', entityId: created.id, actionType: 'CREATE',
      actionDescription: `Proposta PIX ${data.codigo} gerada para ${data.clienteNome}`,
      changedBy: data.responsavelNome || 'admin', changeDate: new Date().toISOString(),
      details: { codigo: data.codigo, clienteNome: data.clienteNome, status: data.status }
    });
    if (data.leadId) {
      await base44.entities.Lead.update(data.leadId, { currentProposalId: created.id, status: 'proposta_enviada', lastInteractionDate: new Date().toISOString() });
      await base44.entities.LeadActivity.create({ leadId: data.leadId, activityType: 'proposta_criada', description: `Proposta PIX ${data.codigo} criada`, performedBy: data.responsavelNome || 'admin', activityDate: new Date().toISOString() });
    }
    toast.success('Proposta PIX gerada com sucesso!');
    setSaving(false);
    navigate(`/PropostaPixDetalhes?id=${created.id}`);
  };

  const inputCls = "bg-white/5 border-white/10 text-white h-11 rounded-xl placeholder:text-white/20 focus:border-[#2bc196] focus:ring-1 focus:ring-[#2bc196]";
  const labelCls = "text-[10px] text-[#2bc196]/70 font-semibold uppercase tracking-wider";
  const errorCls = "text-[10px] text-red-400";

  return (
    <div className="min-h-screen bg-[#002443] font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-20 bg-[#002443] border-b border-white/5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white/50 hover:text-white hover:bg-white/5 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-white">{editId ? 'Editar Proposta PIX' : 'Nova Proposta PIX'}</h1>
            <p className="text-xs text-[#2bc196]/60">Defina a taxa PIX e TPV mínimo</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={handleSalvarRascunho} disabled={saving} className="text-white/60 hover:text-white hover:bg-white/5 rounded-xl text-sm">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Rascunho
          </Button>
          <Button onClick={handleGerarProposta} disabled={saving} className="bg-[#2bc196] hover:bg-[#5cf7cf] text-[#002443] font-bold rounded-xl shadow-lg shadow-[#2bc196]/20 px-6">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />} Gerar Proposta
          </Button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-6 space-y-6 pb-32">
        {/* Dados do Cliente */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-[#2bc196]/10 flex items-center justify-center"><Building2 className="w-3.5 h-3.5 text-[#2bc196]" /></div>
            <h2 className="text-sm font-bold text-white">Dados do Cliente</h2>
          </div>

          {leads && leads.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
              {leads.slice(0, 6).map(l => (
                <button key={l.id} onClick={() => handleLeadSelect(l.id)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 text-[10px] text-white/50 hover:text-white hover:border-[#2bc196]/30 hover:bg-[#2bc196]/5 transition-all truncate max-w-[140px]">
                  {l.companyName || l.fullName}
                </button>
              ))}
            </div>
          )}

          <div className="space-y-1">
            <Label className={labelCls}>Nome da Empresa *</Label>
            <Input value={form.clienteNome || ''} onChange={(e) => updateForm('clienteNome', e.target.value)} placeholder="Razão social ou nome fantasia"
              className={`${inputCls} ${errors?.clienteNome ? 'border-red-400/50' : ''}`} />
            {errors?.clienteNome && <p className={errorCls}>{errors.clienteNome}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className={labelCls}>CNPJ *</Label>
              <CnpjInput value={form.clienteCnpj || ''} onChange={(val) => updateForm('clienteCnpj', val)} error={errors?.clienteCnpj}
                className={`${inputCls} ${errors?.clienteCnpj ? 'border-red-400/50' : ''}`} />
              {errors?.clienteCnpj && <p className={errorCls}>{errors.clienteCnpj}</p>}
            </div>
            <div className="space-y-1">
              <Label className={labelCls}>MCC</Label>
              <Input value={form.clienteMcc || ''} onChange={(e) => updateForm('clienteMcc', e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="5812"
                className={inputCls} />
            </div>
          </div>

          <div className="space-y-1">
            <Label className={labelCls}>Contato</Label>
            <Input value={form.clienteContato || ''} onChange={(e) => updateForm('clienteContato', e.target.value)} placeholder="Nome do contato principal"
              className={inputCls} />
          </div>
        </div>

        {/* Taxa PIX */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-[#2bc196]/10 flex items-center justify-center"><Banknote className="w-3.5 h-3.5 text-[#2bc196]" /></div>
            <h2 className="text-sm font-bold text-white">Taxa PIX</h2>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className={labelCls}>Tipo de Cobrança *</Label>
              <Select value={pixTipo} onValueChange={setPixTipo}>
                <SelectTrigger className={inputCls}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentual">Percentual (%)</SelectItem>
                  <SelectItem value="fixo">Fixo (R$)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className={labelCls}>Valor da Taxa *</Label>
              <div className="relative">
                <Input
                  value={pixValor}
                  onChange={(e) => { setPixValor(e.target.value); setErrors(prev => ({ ...prev, pixValor: undefined })); }}
                  placeholder={pixTipo === 'percentual' ? '0.35' : '0.30'}
                  className={`${inputCls} ${errors?.pixValor ? 'border-red-400/50' : ''}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 text-sm">
                  {pixTipo === 'percentual' ? '%' : 'R$'}
                </span>
              </div>
              {errors?.pixValor && <p className={errorCls}>{errors.pixValor}</p>}
            </div>
          </div>
        </div>

        {/* TPV Mínimo Garantido */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-[#2bc196]/10 flex items-center justify-center"><Shield className="w-3.5 h-3.5 text-[#2bc196]" /></div>
            <h2 className="text-sm font-bold text-white">TPV Mínimo Garantido</h2>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className={labelCls}>Mês 1 (R$)</Label>
              <Input value={minimoGarantido.mes1} onChange={(e) => setMinimoGarantido(prev => ({ ...prev, mes1: e.target.value }))}
                placeholder="0.00" className={inputCls} />
            </div>
            <div className="space-y-1">
              <Label className={labelCls}>Mês 2 (R$)</Label>
              <Input value={minimoGarantido.mes2} onChange={(e) => setMinimoGarantido(prev => ({ ...prev, mes2: e.target.value }))}
                placeholder="0.00" className={inputCls} />
            </div>
            <div className="space-y-1">
              <Label className={labelCls}>Mês 3+ (R$)</Label>
              <Input value={minimoGarantido.mes3} onChange={(e) => setMinimoGarantido(prev => ({ ...prev, mes3: e.target.value }))}
                placeholder="0.00" className={inputCls} />
            </div>
          </div>
          <p className="text-[10px] text-white/30">* "Mês 3+" representa o TPV mínimo a partir do terceiro mês de operação.</p>
        </div>

        {/* Preview Card */}
        <div className="rounded-2xl bg-[#2bc196]/5 border border-[#2bc196]/20 p-5 space-y-3">
          <h3 className="text-sm font-bold text-[#2bc196]">Resumo da Proposta</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-white/40 text-xs">Cliente</p>
              <p className="text-white font-semibold">{form.clienteNome || '—'}</p>
            </div>
            <div>
              <p className="text-white/40 text-xs">Taxa PIX</p>
              <p className="text-white font-semibold">
                {pixValor ? (pixTipo === 'percentual' ? `${pixValor}%` : `R$ ${pixValor}`) : '—'}
              </p>
            </div>
            <div>
              <p className="text-white/40 text-xs">TPV Mín. Mês 3+</p>
              <p className="text-white font-semibold">
                {minimoGarantido.mes3 ? `R$ ${parseTaxa(minimoGarantido.mes3).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—'}
              </p>
            </div>
            <div>
              <p className="text-white/40 text-xs">CNPJ</p>
              <p className="text-white font-semibold">{form.clienteCnpj || '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}