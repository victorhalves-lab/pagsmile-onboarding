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
  const leadId = urlParams.get('lead') || urlParams.get('lead_id');
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
    enabled: !!leadId
  });

  // Pre-fill form from lead
  useEffect(() => {
    if (lead) {
      setForm({
        clienteNome: lead.companyName || lead.fullName || '',
        clienteCnpj: lead.cpfCnpj || '',
        clienteMcc: lead.mcc || '',
        clienteContato: lead.contactName || '',
      });
    }
  }, [lead]);

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const updateCartao = (cartaoData) => {
    setRates(prev => ({ ...prev, cartao: cartaoData }));
  };

  const updateRav = (ravData) => {
    setRates(prev => ({ ...prev, rav: ravData }));
  };

  const updateRates = (newRates) => {
    setRates(newRates);
  };

  const validate = () => {
    const newErrors = {};
    if (!form.clienteNome) newErrors.clienteNome = 'Obrigatório';
    if (!form.clienteCnpj) newErrors.clienteCnpj = 'Obrigatório';
    if (!form.clienteMcc) newErrors.clienteMcc = 'Obrigatório';
    if (!form.clienteContato) newErrors.clienteContato = 'Obrigatório';

    // At least one card rate
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
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const buildPropostaData = (status) => {
    // Convert string rates to numbers
    const cartaoNum = {};
    Object.entries(rates.cartao || {}).forEach(([bandeira, faixas]) => {
      cartaoNum[bandeira] = {};
      Object.entries(faixas || {}).forEach(([faixa, val]) => {
        cartaoNum[bandeira][faixa] = parseTaxa(val);
      });
    });

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 15);

    return {
      leadId: leadId || '',
      codigo: gerarCodigo(),
      proposalName: `Proposta - ${form.clienteNome}`,
      status,
      origem: 'manual',
      clienteNome: form.clienteNome,
      clienteCnpj: form.clienteCnpj,
      clienteContato: form.clienteContato,
      clienteMcc: form.clienteMcc,
      rates: {
        cartao: cartaoNum,
        pix: { tipo: rates.pix?.tipo || 'percentual', valor: parseTaxa(rates.pix?.valor) },
        boleto: parseTaxa(rates.boleto),
        feeTransacao: parseTaxa(rates.feeTransacao),
        alertaPreChargeback: parseTaxa(rates.alertaPreChargeback),
        minimoGarantido: parseTaxa(rates.minimoGarantido),
        rav: { taxa: parseTaxa(rates.rav?.taxa), prazo: rates.rav?.prazo || 'D+1' },
      },
      validUntil: validUntil.toISOString(),
      tokenPublico: gerarToken(),
    };
  };

  const handleSalvarRascunho = async () => {
    setSaving(true);
    const data = buildPropostaData('rascunho');
    await base44.entities.Proposal.create(data);
    toast.success('Rascunho salvo!');
    setSaving(false);
    navigate(createPageUrl('GestaoPropostas'));
  };

  const handleGerarProposta = async () => {
    if (!validate()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    setSaving(true);
    const data = buildPropostaData('rascunho');
    const created = await base44.entities.Proposal.create(data);

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
        performedBy: 'admin',
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
      <div className="flex items-center justify-between">
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
          <CardOutrasTaxas rates={rates} onUpdate={updateRates} />
        </div>

        {/* Preview */}
        <div className="lg:col-span-5">
          <PropostaPreview form={form} rates={rates} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-6 border-t border-slate-200">
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