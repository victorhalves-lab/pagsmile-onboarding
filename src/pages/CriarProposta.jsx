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

export default function CriarProposta() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const leadId = urlParams.get('lead') || urlParams.get('lead_id') || urlParams.get('leadId');
  const editId = urlParams.get('edit');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedBrand, setSelectedBrand] = useState('mastercard');

  const [form, setForm] = useState({
    clienteNome: '', clienteCnpj: '', clienteMcc: '', clienteContato: '',
    prazoRecebimento: 'D+1', usaAntecipacao: false, percentualAntecipacao: '',
    taxaAntecipacao: '',
    dataValidade: new Date(new Date().setDate(new Date().getDate() + 15)),
  });

  const [rates, setRates] = useState({
    cartao: {},
    pix: { tipo: 'percentual', valor: '' },
    boleto: '', feeTransacao: '', antifraude: '', alertaPreChargeback: '',
    minimoGarantido: { mes1: '', mes2: '', mes3: '' },
  });

  const { data: lead } = useQuery({
    queryKey: ['lead-for-proposal', leadId],
    queryFn: async () => { const leads = await base44.entities.Lead.filter({ id: leadId }); return leads[0] || null; },
    enabled: !!leadId && !editId
  });

  const { data: existingProposal } = useQuery({
    queryKey: ['proposal-edit', editId],
    queryFn: async () => { const proposals = await base44.entities.Proposal.filter({ id: editId }); return proposals[0] || null; },
    enabled: !!editId
  });

  useEffect(() => {
    if (existingProposal) {
      setForm({
        clienteNome: existingProposal.clienteNome || '', clienteCnpj: existingProposal.clienteCnpj || '',
        clienteMcc: existingProposal.clienteMcc || '', clienteContato: existingProposal.clienteContato || '',
        prazoRecebimento: existingProposal.rates?.rav?.prazo || 'D+1',
        usaAntecipacao: !!existingProposal.rates?.rav?.taxa,
        percentualAntecipacao: existingProposal.rates?.percentualAntecipacao || '',
        taxaAntecipacao: existingProposal.rates?.rav?.taxa || '',
        dataValidade: existingProposal.validUntil ? new Date(existingProposal.validUntil) : new Date(),
      });
      const r = existingProposal.rates || {};
      setRates({
        cartao: r.cartao || {}, pix: r.pix || { tipo: 'percentual', valor: '' },
        boleto: r.boleto || '', feeTransacao: r.feeTransacao || '',
        antifraude: r.antifraude || '', alertaPreChargeback: r.alertaPreChargeback || '',
        minimoGarantido: typeof r.minimoGarantido === 'object' ? r.minimoGarantido : { mes1: r.minimoGarantido || '', mes2: r.minimoGarantido || '', mes3: r.minimoGarantido || '' },
      });
    }
  }, [existingProposal]);

  useEffect(() => {
    if (lead && !editId) {
      setForm(prev => ({
        ...prev, clienteNome: lead.companyName || lead.fullName || '',
        clienteCnpj: (lead.cpfCnpj || '').replace(/\D/g, ''),
        clienteMcc: lead.mcc || '', clienteContato: lead.contactName || '',
      }));
    }
  }, [lead, editId]);

  const updateForm = (field, value) => { setForm(prev => ({ ...prev, [field]: value })); setErrors(prev => ({ ...prev, [field]: undefined })); };
  const updateRates = (newRates) => setRates(newRates);

  const validate = () => {
    const newErrors = {};
    if (!form.clienteNome) newErrors.clienteNome = 'Obrigatório';
    if (!form.clienteCnpj || form.clienteCnpj.replace(/\D/g, '').length !== 14) newErrors.clienteCnpj = 'CNPJ inválido (14 dígitos)';
    if (!form.clienteMcc) newErrors.clienteMcc = 'Obrigatório';
    if (!form.clienteContato) newErrors.clienteContato = 'Obrigatório';
    const hasAnyCardRate = Object.values(rates.cartao || {}).some(b => b && (b.avista || b.de2a6x || b.de7a12x));
    if (!hasAnyCardRate) newErrors.cartao = 'Preencha ao menos uma taxa de cartão';
    if (rates.pix?.valor && isNaN(parseTaxa(rates.pix.valor))) newErrors.pix = 'Valor inválido';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const gerarCodigo = () => `PROP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
  const gerarToken = () => { const c = 'abcdefghijklmnopqrstuvwxyz0123456789'; let t = ''; for (let i = 0; i < 64; i++) t += c.charAt(Math.floor(Math.random() * c.length)); return t; };

  const buildPropostaData = async (status) => {
    const taxas = rates.cartao || {};
    const credito_1x = {}, credito_2_6x = {}, credito_7_12x = {}, credito_13_21x = {}, debito = {};
    ['visa', 'mastercard', 'elo', 'amex', 'outras'].forEach(b => {
      const d = taxas[b] || {};
      credito_1x[b] = parseTaxa(d.avista); credito_2_6x[b] = parseTaxa(d.de2a6x); credito_7_12x[b] = parseTaxa(d.de7a12x); credito_13_21x[b] = parseTaxa(d.de13a21x);
      debito[b] = Math.round(parseTaxa(d.avista) * 0.6 * 100) / 100;
    });
    let criadoPor = 'sistema';
    try { const user = await base44.auth.me(); criadoPor = user?.email || user?.id || 'sistema'; } catch (e) {}
    return {
      leadId: leadId || '', codigo: existingProposal?.codigo || gerarCodigo(),
      proposalName: `Proposta - ${form.clienteNome}`, status, origem: 'manual',
      clienteNome: form.clienteNome, clienteCnpj: form.clienteCnpj.replace(/\D/g, ''),
      clienteContato: form.clienteContato, clienteMcc: form.clienteMcc,
      rates: {
        cartao: taxas, credito_1x, credito_2_6x, credito_7_12x, credito_13_21x, debito,
        pix: { tipo: rates.pix?.tipo || 'percentual', valor: parseTaxa(rates.pix?.valor) },
        boleto: parseTaxa(rates.boleto), antifraude: parseTaxa(rates.alertaPreChargeback),
        feeTransacao: parseTaxa(rates.feeTransacao), alertaPreChargeback: parseTaxa(rates.alertaPreChargeback),
        minimoGarantido: { mes1: parseTaxa(rates.minimoGarantido?.mes1), mes2: parseTaxa(rates.minimoGarantido?.mes2), mes3: parseTaxa(rates.minimoGarantido?.mes3) },
        rav: { taxa: parseTaxa(form.taxaAntecipacao), prazo: form.prazoRecebimento },
        percentualAntecipacao: parseTaxa(form.percentualAntecipacao),
      },
      validUntil: form.dataValidade.toISOString(),
      tokenPublico: existingProposal?.tokenPublico || gerarToken(),
      responsavelId: criadoPor, responsavelNome: criadoPor,
    };
  };

  const handleSalvarRascunho = async () => {
    setSaving(true);
    const data = await buildPropostaData('rascunho');
    if (editId) { await base44.entities.Proposal.update(editId, data); toast.success('Rascunho atualizado!'); }
    else { await base44.entities.Proposal.create(data); toast.success('Rascunho salvo!'); }
    setSaving(false);
    navigate(createPageUrl('GestaoPropostas'));
  };

  const handleGerarProposta = async () => {
    if (!validate()) { toast.error('Preencha todos os campos obrigatórios'); return; }
    setSaving(true);
    const data = await buildPropostaData('rascunho');
    let created;
    if (editId) { await base44.entities.Proposal.update(editId, data); created = { id: editId }; }
    else { created = await base44.entities.Proposal.create(data); }
    await base44.entities.AuditLog.create({
      entityName: 'Proposal', entityId: created.id, actionType: 'CREATE',
      actionDescription: `Proposta ${data.codigo} gerada para ${data.clienteNome}`,
      changedBy: data.responsavelNome || 'admin', changeDate: new Date().toISOString(),
      details: { codigo: data.codigo, clienteNome: data.clienteNome, status: data.status }
    });
    if (leadId) {
      await base44.entities.Lead.update(leadId, { currentProposalId: created.id, status: 'proposta_enviada', lastInteractionDate: new Date().toISOString() });
      await base44.entities.LeadActivity.create({ leadId, activityType: 'proposta_criada', description: `Proposta ${data.codigo} criada`, performedBy: data.responsavelNome || 'admin', activityDate: new Date().toISOString() });
    }
    toast.success('Proposta gerada com sucesso!');
    setSaving(false);
    navigate(createPageUrl('GestaoPropostas'));
  };

  return (
    <div className="min-h-screen bg-[#002443] font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 sticky top-0 z-20 bg-[#002443] border-b border-white/5">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white/50 hover:text-white hover:bg-white/5 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-white">{editId ? 'Editar Proposta' : 'Nova Proposta'}</h1>
            <p className="text-xs text-[#2bc196]/60">Defina as taxas e condições comerciais</p>
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

      <div className="flex h-[calc(100vh-65px)]">
        {/* Left Column - Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 pb-32">
          <CardDadosCliente form={form} errors={errors} onUpdate={updateForm} />
          <CardTaxasCartao rates={rates} onUpdateRates={updateRates} selectedBrand={selectedBrand} setSelectedBrand={setSelectedBrand} />
          <CardAntecipacao form={form} onUpdate={updateForm} />
          <CardOutrasTaxas rates={rates} onUpdateRates={updateRates} />
        </div>

        {/* Right Column - Preview */}
        <div className="w-[460px] bg-[#001a33] border-l border-white/5 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6">
            <PropostaPreview form={form} rates={rates} selectedBrand={selectedBrand} onBandeiraChange={setSelectedBrand} />
          </div>
        </div>
      </div>
    </div>
  );
}