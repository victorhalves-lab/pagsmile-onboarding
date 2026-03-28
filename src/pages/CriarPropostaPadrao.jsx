import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
// Select removed — segments now use buttons
import { ArrowLeft, Save, FileText, Loader2, AlertTriangle, Info } from 'lucide-react';
import { toast } from 'sonner';
import PartnerSelector from '@/components/proposals/PartnerSelector';
import CardTaxasCartao from '@/components/proposals/CardTaxasCartao';
import CardAntecipacao from '@/components/proposals/CardAntecipacao';
import CardOutrasTaxas from '@/components/proposals/CardOutrasTaxas';
import PropostaPreview from '@/components/proposals/PropostaPreview';
import { DEFAULT_SEGMENT_RATES } from '@/lib/rateCalculator';
import { useTranslation } from '@/lib/i18n/LanguageContext';

const SEGMENTS = ['Educação', 'Infoprodutos', 'E-commerce', 'SaaS', 'Gateway', 'Marketplace'];


const parseTaxa = (val) => {
  if (!val && val !== 0) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const cleaned = String(val).replace(/\./g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export default function CriarPropostaPadrao() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');
  const [saving, setSaving] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('mastercard');
  const [selectedPartnerId, setSelectedPartnerId] = useState(null);

  const [form, setForm] = useState({
    templateName: '',
    segment: '',
    description: '',
    clienteNome: '',
    clienteCnpj: '',
    clienteContato: '',
    clienteTelefone: '',
    clienteEmail: '',
    prazoRecebimento: 'D+1',
    usaAntecipacao: false,
    percentualAntecipacao: '',
    taxaAntecipacao: '',
    dataValidade: new Date(new Date().setMonth(new Date().getMonth() + 3)),
  });

  const [rates, setRates] = useState({
    cartao: {},
    pix: { tipo: 'percentual', valor: '' },
    boleto: '', feeTransacao: '', antifraude: '', alertaPreChargeback: '', taxa3ds: '', setup: '',
    minimoGarantido: { mes1: '', mes2: '', mes3: '' },
  });

  const { data: existingProposal } = useQuery({
    queryKey: ['std-proposal-edit', editId],
    queryFn: async () => {
      const results = await base44.entities.StandardProposal.filter({ id: editId });
      return results[0] || null;
    },
    enabled: !!editId,
  });

  const { data: allPartners = [] } = useQuery({
    queryKey: ['partners-active'],
    queryFn: () => base44.entities.Partner.filter({ isActive: true }),
  });
  const selectedPartner = allPartners.find(p => p.id === selectedPartnerId) || null;

  useEffect(() => {
    if (existingProposal) {
      setForm({
        templateName: existingProposal.templateName || '',
        segment: existingProposal.segment || '',
        description: existingProposal.description || '',
        clienteNome: existingProposal.clienteNome || '',
        clienteCnpj: existingProposal.clienteCnpj || '',
        clienteContato: existingProposal.clienteContato || '',
        clienteTelefone: existingProposal.clienteTelefone || '',
        clienteEmail: existingProposal.clienteEmail || '',
        prazoRecebimento: existingProposal.rates?.rav?.prazo || 'D+1',
        usaAntecipacao: !!existingProposal.rates?.rav?.taxa,
        percentualAntecipacao: existingProposal.rates?.percentualAntecipacao || '',
        taxaAntecipacao: existingProposal.rates?.rav?.taxa || '',
        dataValidade: existingProposal.validUntil ? new Date(existingProposal.validUntil) : new Date(),
      });
      const r = existingProposal.rates || {};
      setRates({
        cartao: r.cartao || {},
        pix: r.pix || { tipo: 'percentual', valor: '' },
        boleto: r.boleto || '', feeTransacao: r.feeTransacao || '',
        antifraude: r.antifraude || '', alertaPreChargeback: r.alertaPreChargeback || '',
        taxa3ds: r.taxa3ds || '', setup: r.setup || '',
        minimoGarantido: typeof r.minimoGarantido === 'object' ? r.minimoGarantido : { mes1: '', mes2: '', mes3: '' },
      });
      if (existingProposal.chosenPartnerId) setSelectedPartnerId(existingProposal.chosenPartnerId);
    }
  }, [existingProposal]);

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));

    // Auto-preencher taxas quando segmento é selecionado
    if (field === 'segment' && value) {
      const segDefault = DEFAULT_SEGMENT_RATES.find(s => s.segmentName === value);
      if (segDefault) {
        const bandeiras = ['visa', 'mastercard', 'elo', 'amex', 'outras'];
        const cartao = {};
        bandeiras.forEach(b => {
          cartao[b] = {
            avista: segDefault.mdrAvista,
            de2a6x: segDefault.mdr2a6x,
            de7a12x: segDefault.mdr7a12x,
            de13a21x: segDefault.mdr13a21x,
          };
        });

        setRates({
          cartao,
          pix: { tipo: 'percentual', valor: segDefault.pixTaxaPercentual },
          boleto: 2.99,
          feeTransacao: segDefault.feeTransacao,
          antifraude: segDefault.antifraude,
          alertaPreChargeback: 55,
          taxa3ds: segDefault.taxa3ds,
          setup: 5000,
          minimoGarantido: { mes1: '', mes2: '', mes3: '' },
        });

        setForm(prev => ({
          ...prev,
          [field]: value,
          taxaAntecipacao: segDefault.percentualAntecipacao,
          percentualAntecipacao: 100,
          usaAntecipacao: true,
        }));

        toast.success(t('cpp.segment_auto', { segment: value }));
      }
    }
  };
  const updateRates = (newRates) => setRates(newRates);

  const gerarCodigo = () => `STDP-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
  const gerarToken = () => {
    const c = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let t = '';
    for (let i = 0; i < 64; i++) t += c.charAt(Math.floor(Math.random() * c.length));
    return t;
  };

  const buildData = async (status) => {
    const taxasRaw = rates.cartao || {};
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
    try { const user = await base44.auth.me(); criadoPor = user?.email || 'sistema'; } catch {}
    return {
      templateName: form.templateName,
      segment: form.segment,
      description: form.description,
      clienteNome: form.clienteNome,
      clienteCnpj: form.clienteCnpj,
      clienteContato: form.clienteContato,
      clienteTelefone: form.clienteTelefone,
      clienteEmail: form.clienteEmail,
      status,
      codigo: existingProposal?.codigo || gerarCodigo(),
      chosenPartnerId: selectedPartnerId || '',
      chosenPartnerName: selectedPartner?.name || '',
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
      responsavelId: criadoPor,
      responsavelNome: criadoPor,
    };
  };

  const handleSalvarRascunho = async () => {
    if (!form.templateName || !form.segment) {
      toast.error(t('cpp.fill_name_segment'));
      return;
    }
    setSaving(true);
    const data = await buildData('rascunho');
    if (editId) { await base44.entities.StandardProposal.update(editId, data); toast.success(t('cpp.draft_updated')); }
    else { await base44.entities.StandardProposal.create(data); toast.success(t('cpp.draft_saved')); }
    setSaving(false);
    navigate('/GestaoPropostasPadrao');
  };

  const handleAtivar = async () => {
    if (!form.templateName || !form.segment) {
      toast.error(t('cpp.fill_name_segment'));
      return;
    }
    setSaving(true);
    const data = await buildData('ativa');
    let created;
    if (editId) { await base44.entities.StandardProposal.update(editId, data); created = { id: editId }; }
    else { created = await base44.entities.StandardProposal.create(data); }
    toast.success(t('cpp.activated'));
    setSaving(false);
    navigate(`/PropostaPadraoDetalhes?id=${created.id}`);
  };

  // Fake form/clienteNome for preview component reuse
  const previewForm = {
    clienteNome: form.clienteNome || form.templateName || 'Proposta Padrão',
    clienteCnpj: form.clienteCnpj || '', clienteMcc: '', clienteContato: form.clienteContato || '',
    businessSubCategory: '',
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
            <h1 className="text-lg font-bold text-white">{editId ? t('cpp.edit_title') : t('cpp.new_title')}</h1>
            <p className="text-xs text-[#2bc196]/60">{t('cpp.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={handleSalvarRascunho} disabled={saving} className="text-white/60 hover:text-white hover:bg-white/5 rounded-xl text-sm">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} {t('cpp.draft')}
          </Button>
          <Button onClick={handleAtivar} disabled={saving} className="bg-[#2bc196] hover:bg-[#5cf7cf] text-[#002443] font-bold rounded-xl shadow-lg shadow-[#2bc196]/20 px-6">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileText className="w-4 h-4 mr-2" />} {t('cpp.activate')}
          </Button>
        </div>
      </div>

      <div className="flex h-[calc(100vh-65px)]">
        {/* Left Column - Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 pb-32">
          {/* Dados da Proposta Padrão */}
          {/* Dados da Empresa */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 space-y-4">
           <h2 className="text-sm font-bold text-white/80 uppercase tracking-wider">{t('cpp.company_data')}</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <Label className="text-white/60 text-xs">{t('cpp.company_name')}</Label>
               <Input value={form.clienteNome} onChange={e => updateForm('clienteNome', e.target.value)} placeholder={t('cpp.company_placeholder')} className="bg-white/10 border-white/10 text-white placeholder:text-white/30" />
               </div>
               <div>
               <Label className="text-white/60 text-xs">{t('cpp.cnpj')}</Label>
               <Input value={form.clienteCnpj} onChange={e => updateForm('clienteCnpj', e.target.value)} placeholder="00.000.000/0000-00" className="bg-white/10 border-white/10 text-white placeholder:text-white/30" />
               </div>
               <div>
               <Label className="text-white/60 text-xs">{t('cpp.contact_name')}</Label>
               <Input value={form.clienteContato} onChange={e => updateForm('clienteContato', e.target.value)} placeholder={t('cpp.contact_name_placeholder')} className="bg-white/10 border-white/10 text-white placeholder:text-white/30" />
               </div>
               <div>
               <Label className="text-white/60 text-xs">{t('cpp.contact_phone')}</Label>
               <Input value={form.clienteTelefone} onChange={e => updateForm('clienteTelefone', e.target.value)} placeholder="(00) 00000-0000" className="bg-white/10 border-white/10 text-white placeholder:text-white/30" />
               </div>
               <div>
               <Label className="text-white/60 text-xs">{t('cpp.contact_email')}</Label>
               <Input value={form.clienteEmail} onChange={e => updateForm('clienteEmail', e.target.value)} placeholder="email@empresa.com" className="bg-white/10 border-white/10 text-white placeholder:text-white/30" />
             </div>
           </div>
          </div>

          {/* Dados da Proposta */}
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-5 space-y-4">
           <h2 className="text-sm font-bold text-white/80 uppercase tracking-wider">{t('cpp.proposal_data')}</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white/60 text-xs">{t('cpp.template_name')}</Label>
                <Input value={form.templateName} onChange={e => updateForm('templateName', e.target.value)} placeholder={t('cpp.template_placeholder')} className="bg-white/10 border-white/10 text-white placeholder:text-white/30" />
              </div>
              <div className="md:col-span-2">
                <Label className="text-white/60 text-xs">{t('cpp.description')}</Label>
                <Input value={form.description} onChange={e => updateForm('description', e.target.value)} placeholder={t('cpp.description_placeholder')} className="bg-white/10 border-white/10 text-white placeholder:text-white/30" />
             </div>
             </div>

             {/* Segmento - Botões */}
             <div className="mt-2">
             <div className="flex items-center gap-2 mb-3">
               <Label className="text-white/80 text-sm font-bold">{t('cpp.segment')}</Label>
               {!form.segment && (
                 <span className="flex items-center gap-1.5 bg-[#2bc196]/15 text-[#5cf7cf] text-xs font-semibold px-3 py-1 rounded-full animate-pulse">
                   <Info className="w-3.5 h-3.5" />
                   {t('cpp.select_segment')}
                 </span>
               )}
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
               {SEGMENTS.map(s => (
                 <button
                   key={s}
                   type="button"
                   onClick={() => updateForm('segment', s)}
                   className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 border-2 ${
                     form.segment === s
                       ? 'bg-[#2bc196] border-[#2bc196] text-[#002443] shadow-lg shadow-[#2bc196]/25 scale-[1.02]'
                       : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-[#2bc196]/40 hover:text-white cursor-pointer'
                   }`}
                 >
                   {s}
                 </button>
               ))}
             </div>
             {form.segment && (
               <p className="text-[10px] text-[#2bc196]/60 flex items-center gap-1.5 mt-3">
                 <Info className="w-3 h-3" />
                 {t('cpp.segment_filled', { segment: form.segment })}
               </p>
             )}
             </div>
          </div>

          <CardTaxasCartao rates={rates} onUpdateRates={updateRates} selectedBrand={selectedBrand} setSelectedBrand={setSelectedBrand} partner={selectedPartner} clientMcc="" />
          <CardAntecipacao form={form} onUpdate={updateForm} />
          <CardOutrasTaxas rates={rates} onUpdateRates={updateRates} partner={selectedPartner} />

          {/* Parceiro - apenas para simulação de rentabilidade */}
          <PartnerSelector
            selectedPartnerId={selectedPartnerId}
            onSelectPartner={setSelectedPartnerId}
            leadMcc=""
            leadBusinessType=""
          />
        </div>

        {/* Right Column - Preview */}
        <div className="w-[460px] bg-[#001a33] border-l border-white/5 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <PropostaPreview form={previewForm} rates={rates} selectedBrand={selectedBrand} onBandeiraChange={setSelectedBrand} />
          </div>
        </div>
      </div>
    </div>
  );
}