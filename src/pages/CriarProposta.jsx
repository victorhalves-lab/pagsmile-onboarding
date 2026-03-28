import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, FileText, Loader2, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import CardDadosCliente from '@/components/proposals/CardDadosCliente';
import PartnerSelector from '@/components/proposals/PartnerSelector';
import CardTaxasCartao from '@/components/proposals/CardTaxasCartao';
import CardAntecipacao from '@/components/proposals/CardAntecipacao';
import CardOutrasTaxas from '@/components/proposals/CardOutrasTaxas';
import ProfitabilityPanel from '@/components/proposals/ProfitabilityPanel';
import PropostaPreview from '@/components/proposals/PropostaPreview';
import CopyRatesModal from '@/components/proposals/CopyRatesModal';

const parseTaxa = (val) => {
  if (!val && val !== 0) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  // Remove pontos de milhar e troca vírgula decimal por ponto
  const cleaned = String(val).replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export default function CriarProposta() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const leadId = urlParams.get('lead') || urlParams.get('lead_id') || urlParams.get('leadId');
  const editId = urlParams.get('edit');
  const templateFromId = urlParams.get('templateFromId');
  const [saving, setSaving] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [selectedBrand, setSelectedBrand] = useState('mastercard');
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);
  const [selectedMccCode, setSelectedMccCode] = useState('');

  const [form, setForm] = useState({
    clienteNome: '', clienteCnpj: '', clienteMcc: '', clienteContato: '',
    businessSubCategory: '',
    prazoRecebimento: 'D+1', usaAntecipacao: false, percentualAntecipacao: '',
    taxaAntecipacao: '',
    dataValidade: new Date(new Date().setDate(new Date().getDate() + 15)),
  });

  const [rates, setRates] = useState({
    cartao: {},
    pix: { tipo: 'percentual', valor: '' },
    boleto: '', feeTransacao: '', antifraude: '', alertaPreChargeback: '', taxa3ds: '', setup: '',
    minimoGarantido: { mes1: '', mes2: '', mes3: '' },
  });

  const usePriscila = urlParams.get('usePriscila') === '1';

  const { data: templateProposal } = useQuery({
    queryKey: ['template-proposal', templateFromId],
    queryFn: async () => { const proposals = await base44.entities.Proposal.filter({ id: templateFromId }); return proposals[0] || null; },
    enabled: !!templateFromId && !editId
  });

  const applyCopiedRates = (sourceProposal) => {
    if (!sourceProposal?.rates) { toast.error(t('criar_prop.no_rates')); return; }
    const r = sourceProposal.rates;
    setForm(prev => ({
      ...prev,
      prazoRecebimento: r.rav?.prazo || prev.prazoRecebimento,
      usaAntecipacao: !!r.rav?.taxa,
      percentualAntecipacao: r.percentualAntecipacao ?? prev.percentualAntecipacao,
      taxaAntecipacao: r.rav?.taxa ?? prev.taxaAntecipacao,
    }));
    setRates({
      cartao: r.cartao || {},
      pix: r.pix || { tipo: 'percentual', valor: '' },
      boleto: r.boleto ?? '',
      feeTransacao: r.feeTransacao ?? '',
      antifraude: r.antifraude ?? '',
      alertaPreChargeback: r.alertaPreChargeback ?? '',
      taxa3ds: r.taxa3ds ?? '',
      setup: r.setup ?? '',
      minimoGarantido: typeof r.minimoGarantido === 'object' ? r.minimoGarantido : { mes1: r.minimoGarantido ?? '', mes2: r.minimoGarantido ?? '', mes3: r.minimoGarantido ?? '' },
    });
    toast.success(t('criar_prop.rates_copied'));
  };

  useEffect(() => {
    if (templateProposal) applyCopiedRates(templateProposal);
  }, [templateProposal]);

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

  // Load all active partners for the selected partner
  const { data: allPartners = [] } = useQuery({
    queryKey: ['partners-active'],
    queryFn: () => base44.entities.Partner.filter({ isActive: true }),
  });
  const selectedPartner = allPartners.find(p => p.id === selectedPartnerId) || null;

  useEffect(() => {
    if (existingProposal) {
      setForm({
        clienteNome: existingProposal.clienteNome || '', clienteCnpj: existingProposal.clienteCnpj || '',
        clienteMcc: existingProposal.clienteMcc || '', clienteContato: existingProposal.clienteContato || '',
        businessSubCategory: existingProposal.businessSubCategory || '',
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
        taxa3ds: r.taxa3ds || '', setup: r.setup || '',
        minimoGarantido: typeof r.minimoGarantido === 'object' ? r.minimoGarantido : { mes1: r.minimoGarantido || '', mes2: r.minimoGarantido || '', mes3: r.minimoGarantido || '' },
      });
      if (existingProposal.chosenPartnerId) {
        setSelectedPartnerId(existingProposal.chosenPartnerId);
      }
    }
  }, [existingProposal]);

  useEffect(() => {
    if (lead && !editId) {
      setForm(prev => ({
        ...prev, clienteNome: lead.companyName || lead.fullName || '',
        clienteCnpj: (lead.cpfCnpj || '').replace(/\D/g, ''),
        clienteMcc: lead.mcc || '', clienteContato: lead.contactName || '',
        businessSubCategory: lead.businessSubCategory || prev.businessSubCategory,
      }));

      // Auto-preencher com taxas da PRISCILA se usePriscila=1
      if (usePriscila && lead.priscilaAnalysisReport?.taxasSugeridas) {
        const tx = lead.priscilaAnalysisReport.taxasSugeridas;
        setRates(prev => ({
          ...prev,
          cartao: tx.cartao || prev.cartao,
          pix: tx.pix || prev.pix,
          boleto: tx.boleto ?? prev.boleto,
          feeTransacao: tx.feeTransacao ?? prev.feeTransacao,
          antifraude: tx.antifraude ?? prev.antifraude,
          alertaPreChargeback: tx.alertaPreChargeback ?? prev.alertaPreChargeback,
          minimoGarantido: tx.minimoGarantido || prev.minimoGarantido,
        }));
        if (tx.rav?.prazo) setForm(prev => ({ ...prev, prazoRecebimento: tx.rav.prazo }));
        if (tx.rav?.taxa) setForm(prev => ({ ...prev, taxaAntecipacao: tx.rav.taxa, usaAntecipacao: true }));
        if (tx.percentualAntecipacao) setForm(prev => ({ ...prev, percentualAntecipacao: tx.percentualAntecipacao }));
        toast.success(t('criar_prop.priscila_applied'));
      }
    }
  }, [lead, editId, usePriscila]);

  const updateForm = (field, value) => { setForm(prev => ({ ...prev, [field]: value })); setErrors(prev => ({ ...prev, [field]: undefined })); };
  const updateRates = (newRates) => setRates(newRates);

  const validate = () => {
    const newErrors = {};
    if (!form.clienteNome) newErrors.clienteNome = t('criar_prop.required');
    if (!form.clienteCnpj || form.clienteCnpj.replace(/\D/g, '').length !== 14) newErrors.clienteCnpj = t('criar_prop.invalid_cnpj');
    if (!form.clienteMcc) newErrors.clienteMcc = t('criar_prop.required');
    if (!form.clienteContato) newErrors.clienteContato = t('criar_prop.required');
    if (!form.businessSubCategory) newErrors.businessSubCategory = t('criar_prop.select_business');
    const hasAnyCardRate = Object.values(rates.cartao || {}).some(b => b && (b.avista || b.de2a6x || b.de7a12x));
    if (!hasAnyCardRate) newErrors.cartao = t('criar_prop.fill_card_rate');
    if (rates.pix?.valor && isNaN(parseTaxa(rates.pix.valor))) newErrors.pix = t('criar_prop.invalid_value');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const gerarCodigo = () => `PROP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
  const gerarToken = () => { const c = 'abcdefghijklmnopqrstuvwxyz0123456789'; let t = ''; for (let i = 0; i < 64; i++) t += c.charAt(Math.floor(Math.random() * c.length)); return t; };

  const buildPropostaData = async (status) => {
    const taxasRaw = rates.cartao || {};
    // Converter TODAS as taxas de cartão de string para number
    const cartaoNumerico = {};
    const credito_1x = {}, credito_2_6x = {}, credito_7_12x = {}, credito_13_21x = {}, debito = {};
    ['visa', 'mastercard', 'elo', 'amex', 'outras'].forEach(b => {
      const d = taxasRaw[b] || {};
      const av = parseTaxa(d.avista), p26 = parseTaxa(d.de2a6x), p712 = parseTaxa(d.de7a12x), p1321 = parseTaxa(d.de13a21x);
      cartaoNumerico[b] = { avista: av, de2a6x: p26, de7a12x: p712, de13a21x: p1321 };
      credito_1x[b] = av; credito_2_6x[b] = p26; credito_7_12x[b] = p712; credito_13_21x[b] = p1321;
      debito[b] = Math.round(av * 0.6 * 100) / 100;
    });
    let criadoPor = 'sistema';
    try { const user = await base44.auth.me(); criadoPor = user?.email || user?.id || 'sistema'; } catch (e) {}
    return {
      leadId: leadId || '', codigo: existingProposal?.codigo || gerarCodigo(),
      proposalName: `Proposta - ${form.clienteNome}`, status, origem: 'manual',
      businessSubCategory: form.businessSubCategory,
      chosenPartnerId: selectedPartnerId || '',
      chosenPartnerName: selectedPartner?.name || '',
      clienteNome: form.clienteNome, clienteCnpj: form.clienteCnpj.replace(/\D/g, ''),
      clienteContato: form.clienteContato, clienteMcc: form.clienteMcc,
      rates: {
        cartao: cartaoNumerico, credito_1x, credito_2_6x, credito_7_12x, credito_13_21x, debito,
        pix: { tipo: rates.pix?.tipo || 'percentual', valor: parseTaxa(rates.pix?.valor) },
        boleto: parseTaxa(rates.boleto), antifraude: parseTaxa(rates.antifraude),
        feeTransacao: parseTaxa(rates.feeTransacao), alertaPreChargeback: parseTaxa(rates.alertaPreChargeback),
        taxa3ds: parseTaxa(rates.taxa3ds), setup: parseTaxa(rates.setup),
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
    if (editId) { await base44.entities.Proposal.update(editId, data); toast.success(t('criar_prop.draft_updated')); }
    else { await base44.entities.Proposal.create(data); toast.success(t('criar_prop.draft_saved')); }
    setSaving(false);
    navigate(createPageUrl('GestaoPropostas'));
  };

  const handleGerarProposta = async () => {
    if (!validate()) { toast.error(t('criar_prop.fill_required')); return; }
    setSaving(true);
    const data = await buildPropostaData('enviada');
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
    toast.success(t('criar_prop.generated'));
    setSaving(false);
    navigate(createPageUrl('PropostaDetalhes') + `?id=${created.id}`);
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
            <h1 className="text-lg font-bold text-white">{editId ? t('criar_prop.edit_title') : t('criar_prop.new_title')}</h1>
            <p className="text-xs text-[#2bc196]/60">{t('criar_prop.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => setIsCopyModalOpen(true)} className="text-white/60 hover:text-white hover:bg-white/5 rounded-xl text-sm">
            <Copy className="w-4 h-4 mr-2" /> {t('criar_prop.copy_rates')}
          </Button>
          <Button variant="ghost" onClick={handleSalvarRascunho} disabled={saving} className="text-white/60 hover:text-white hover:bg-white/5 rounded-xl text-sm">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} {t('criar_prop.draft')}
          </Button>
          <Button onClick={handleGerarProposta} disabled={saving} className="bg-[#2bc196] hover:bg-[#5cf7cf] text-[#002443] font-bold rounded-xl shadow-lg shadow-[#2bc196]/20 px-6">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />} {t('criar_prop.generate')}
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Left Column - Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 pb-32">
          <CardDadosCliente form={form} errors={errors} onUpdate={updateForm} />
          <PartnerSelector
            selectedPartnerId={selectedPartnerId}
            onSelectPartner={setSelectedPartnerId}
            selectedMccCode={selectedMccCode}
            onSelectMcc={setSelectedMccCode}
            leadMcc={form.clienteMcc}
            leadBusinessType={form.businessSubCategory}
            leadTpv={lead?.tpvMensal}
          />
          <CardTaxasCartao rates={rates} onUpdateRates={updateRates} selectedBrand={selectedBrand} setSelectedBrand={setSelectedBrand} partner={selectedPartner} clientMcc={form.clienteMcc} />
          <CardAntecipacao form={form} onUpdate={updateForm} />
          <CardOutrasTaxas rates={rates} onUpdateRates={updateRates} partner={selectedPartner} />
        </div>

        {/* Right Column - Preview + Profitability */}
        <div className="w-[460px] bg-[#001a33] border-l border-white/5 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <ProfitabilityPanel
              rates={rates}
              form={form}
              partner={selectedPartner}
              leadTpv={lead?.tpvMensal}
              leadTransacoes={lead?.transacoesMes}
              selectedMccCode={selectedMccCode}
            />
            <PropostaPreview form={form} rates={rates} selectedBrand={selectedBrand} onBandeiraChange={setSelectedBrand} />
          </div>
        </div>
      </div>

      <CopyRatesModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        currentProposalId={editId}
        onSelect={async (selectedId) => {
          setIsCopyModalOpen(false);
          const proposals = await base44.entities.Proposal.filter({ id: selectedId });
          if (proposals[0]) applyCopiedRates(proposals[0]);
        }}
      />
    </div>
  );
}