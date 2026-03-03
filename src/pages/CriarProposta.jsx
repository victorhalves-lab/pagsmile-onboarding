import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import CardDadosCliente from '@/components/proposals/CardDadosCliente';
import CardTaxasCartao from '@/components/proposals/CardTaxasCartao';
import CardAntecipacao from '@/components/proposals/CardAntecipacao';
import CardOutrasTaxas from '@/components/proposals/CardOutrasTaxas';
import PropostaPreview from '@/components/proposals/PropostaPreview';

const parseTaxa = (val) => {
  if (!val && val !== 0) return 0;
  const num = typeof val === 'string' ? parseFloat(val.replace(',', '.')) : val;
  return isNaN(num) ? 0 : num;
};

const formatTaxa = (val) => {
  if (!val && val !== 0) return '';
  return String(val).replace('.', ',');
};

export default function CriarProposta() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const leadId = urlParams.get('lead') || urlParams.get('lead_id') || urlParams.get('leadId');
  const editId = urlParams.get('edit');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    clienteNome: '',
    clienteCnpj: '',
    clienteMcc: '',
    clienteContato: '',
  });

  const [rates, setRates] = useState({
    cartao: {},
    pix: { tipo: 'percentual', valor: '' },
    boleto: '',
    feeTransacao: '',
    alertaPreChargeback: '',
    minimoGarantido: '',
    rav: { taxa: '', prazo: 'D+1' },
  });

  // Fetch lead if coming from a lead
  const { data: lead } = useQuery({
    queryKey: ['lead-for-proposal', leadId],
    queryFn: async () => {
      const leads = await base44.entities.Lead.filter({ id: leadId });
      return leads[0] || null;
    },
    enabled: !!leadId && !editId
  });

  // Fetch existing proposal for edit mode
  const { data: existingProposal } = useQuery({
    queryKey: ['proposal-edit', editId],
    queryFn: async () => {
      const proposals = await base44.entities.Proposal.filter({ id: editId });
      return proposals[0] || null;
    },
    enabled: !!editId
  });

  // Pre-fill form from existing proposal (edit mode)
  useEffect(() => {
    if (existingProposal) {
      setForm({
        clienteNome: existingProposal.clienteNome || '',
        clienteCnpj: existingProposal.clienteCnpj || '',
        clienteMcc: existingProposal.clienteMcc || '',
        clienteContato: existingProposal.clienteContato || '',
      });
      const r = existingProposal.rates || {};
      setRates({
        cartao: r.cartao || {},
        pix: r.pix || { tipo: 'percentual', valor: '' },
        boleto: r.boleto || '',
        feeTransacao: r.feeTransacao || '',
        alertaPreChargeback: r.alertaPreChargeback || r.antifraude || '',
        minimoGarantido: r.minimoGarantido || '',
        rav: r.rav || { taxa: '', prazo: 'D+1' },
      });
    }
  }, [existingProposal]);

  // Pre-fill form from lead
  useEffect(() => {
    if (lead && !editId) {
      setForm({
        clienteNome: lead.companyName || lead.fullName || '',
        clienteCnpj: (lead.cpfCnpj || '').replace(/\D/g, ''),
        clienteMcc: lead.mcc || '',
        clienteContato: lead.contactName || '',
      });
    }
  }, [lead, editId]);

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const updateCartao = (cartaoData) => {
    setRates(prev => ({ ...prev, cartao: cartaoData }));
    setErrors(prev => ({ ...prev, cartao: undefined }));
  };

  const updateRav = (ravData) => {
    setRates(prev => ({ ...prev, rav: ravData }));
    setErrors(prev => ({ ...prev, rav: undefined }));
  };

  const updateRates = (newRates) => {
    setRates(newRates);
    setErrors(prev => ({ ...prev, pix: undefined }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.clienteNome) newErrors.clienteNome = 'Obrigatório';
    if (!form.clienteCnpj || form.clienteCnpj.replace(/\D/g, '').length !== 14) {
      newErrors.clienteCnpj = 'CNPJ inválido (14 dígitos)';
    }
    if (!form.clienteMcc) newErrors.clienteMcc = 'Obrigatório';
    if (!form.clienteContato) newErrors.clienteContato = 'Obrigatório';

    const hasAnyCardRate = Object.values(rates.cartao || {}).some(b =>
      b && (b.avista || b.de2a6x || b.de7a12x)
    );
    if (!hasAnyCardRate) newErrors.cartao = 'Preencha ao menos uma taxa de cartão';
    if (!rates.pix?.valor) newErrors.pix = 'Preencha o valor do PIX';
    if (!rates.rav?.taxa) newErrors.rav = 'Preencha a taxa RAV';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const gerarCodigo = () => {
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
    return `PROP-${year}-${seq}`;
  };

  const gerarToken = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 64; i++) token += chars.charAt(Math.floor(Math.random() * chars.length));
    return token;
  };

  const buildPropostaData = async (status) => {
    const taxas = rates.cartao || {};

    // Build granular credit rates per bandeira
    const credito_1x = {};
    const credito_2_6x = {};
    const credito_7_12x = {};
    const debito = {};

    ['visa', 'mastercard', 'elo', 'amex', 'outras'].forEach(bandeira => {
      const b = taxas[bandeira] || {};
      credito_1x[bandeira] = parseTaxa(b.avista);
      credito_2_6x[bandeira] = parseTaxa(b.de2a6x);
      credito_7_12x[bandeira] = parseTaxa(b.de7a12x);
      // Débito estimado como 60% da taxa à vista
      debito[bandeira] = Math.round(parseTaxa(b.avista) * 0.6 * 100) / 100;
    });

    // Also keep the original cartao structure for backward compatibility
    const cartaoNum = {};
    Object.entries(taxas).forEach(([bandeira, faixas]) => {
      cartaoNum[bandeira] = {};
      Object.entries(faixas || {}).forEach(([faixa, val]) => {
        cartaoNum[bandeira][faixa] = parseTaxa(val);
      });
    });

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 15);

    let criadoPor = 'sistema';
    try {
      const user = await base44.auth.me();
      criadoPor = user?.email || user?.id || 'sistema';
    } catch (e) { /* ignore */ }

    return {
      leadId: leadId || '',
      codigo: gerarCodigo(),
      proposalName: `Proposta - ${form.clienteNome}`,
      status,
      origem: 'manual',
      clienteNome: form.clienteNome,
      clienteCnpj: form.clienteCnpj.replace(/\D/g, ''),
      clienteContato: form.clienteContato,
      clienteMcc: form.clienteMcc,
      rates: {
        cartao: cartaoNum,
        credito_1x,
        credito_2_6x,
        credito_7_12x,
        debito,
        pix: { tipo: rates.pix?.tipo || 'percentual', valor: parseTaxa(rates.pix?.valor) },
        boleto: parseTaxa(rates.boleto),
        antifraude: parseTaxa(rates.alertaPreChargeback),
        feeTransacao: parseTaxa(rates.feeTransacao),
        alertaPreChargeback: parseTaxa(rates.alertaPreChargeback),
        minimoGarantido: parseTaxa(rates.minimoGarantido),
        rav: { taxa: parseTaxa(rates.rav?.taxa), prazo: rates.rav?.prazo || 'D+1' },
      },
      validUntil: validUntil.toISOString(),
      tokenPublico: gerarToken(),
      responsavelId: criadoPor,
      responsavelNome: criadoPor,
    };
  };

  const handleSalvarRascunho = async () => {
    setSaving(true);
    const data = await buildPropostaData('rascunho');
    if (editId) {
      await base44.entities.Proposal.update(editId, data);
      toast.success('Rascunho atualizado!');
    } else {
      await base44.entities.Proposal.create(data);
      toast.success('Rascunho salvo!');
    }
    setSaving(false);
    navigate(createPageUrl('GestaoPropostas'));
  };

  const handleGerarProposta = async () => {
    if (!validate()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setSaving(true);
    const data = await buildPropostaData('rascunho');
    let created;
    if (editId) {
      await base44.entities.Proposal.update(editId, data);
      created = { id: editId };
    } else {
      created = await base44.entities.Proposal.create(data);
    }

    // Registrar no AuditLog
    await base44.entities.AuditLog.create({
      entityName: 'Proposal',
      entityId: created.id,
      actionType: 'CREATE',
      actionDescription: `Proposta ${data.codigo} criada para ${data.clienteNome}`,
      changedBy: data.responsavelNome || 'admin',
      changeDate: new Date().toISOString(),
      details: { codigo: data.codigo, clienteNome: data.clienteNome, clienteCnpj: data.clienteCnpj, status: data.status }
    });

    if (leadId) {
      await base44.entities.Lead.update(leadId, {
        currentProposalId: created.id,
        status: 'proposta_enviada',
        lastInteractionDate: new Date().toISOString()
      });
      await base44.entities.LeadActivity.create({
        leadId,
        activityType: 'proposta_criada',
        description: `Proposta ${data.codigo} criada`,
        performedBy: data.responsavelNome || 'admin',
        activityDate: new Date().toISOString()
      });
    }

    toast.success('Proposta gerada!');
    setSaving(false);
    navigate(createPageUrl('GestaoPropostas'));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 bg-[#f8f9fa] z-10 py-3 -mt-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold text-[var(--pagsmile-blue)]">
            {editId ? 'Editar Proposta' : 'Criar Nova Proposta'}
          </h1>
        </div>
        <Button variant="outline" onClick={handleSalvarRascunho} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar Rascunho
        </Button>
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form */}
        <div className="lg:col-span-7 space-y-6">
          <CardDadosCliente form={form} errors={errors} mccs={[]} onUpdate={updateForm} />
          <CardTaxasCartao taxas={rates.cartao} onUpdate={updateCartao} />
          {errors.cartao && <p className="text-xs text-red-500 -mt-4">{errors.cartao}</p>}
          <CardAntecipacao rav={rates.rav} onUpdate={updateRav} />
          {errors.rav && <p className="text-xs text-red-500 -mt-4">{errors.rav}</p>}
          <CardOutrasTaxas rates={rates} onUpdate={updateRates} />
          {errors.pix && <p className="text-xs text-red-500 -mt-4">{errors.pix}</p>}
        </div>

        {/* Preview */}
        <div className="lg:col-span-5">
          <PropostaPreview form={form} rates={rates} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200 sticky bottom-0 bg-[#f8f9fa] py-4 -mb-4">
        <Button variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
        <Button
          onClick={handleGerarProposta}
          disabled={saving}
          className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90 text-white gap-2"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Gerar Proposta
        </Button>
      </div>
    </div>
  );
}