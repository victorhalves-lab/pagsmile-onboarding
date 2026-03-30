import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, Handshake, ShieldCheck, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FechamentoRatesResume from '@/components/fechamento/FechamentoRatesResume';
import FechamentoCompanyForm from '@/components/fechamento/FechamentoCompanyForm';
import SEGMENT_TO_COMPLIANCE from '@/components/fechamento/segmentComplianceMap';

const PAGSMILE_LOGO = "https://media.base44.com/images/public/6983b65f017b96d5f695f9bb/85ecf04f8_Logo-modo-claro.png";

export default function FechamentoLandingPage() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const ref = urlParams.get('ref') || '';
  const segment = urlParams.get('segment') || '';
  const introducerId = urlParams.get('introducerId') || '';

  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch introducer to get rates (when coming from landing page)
  const { data: introducer, isLoading: isLoadingIntroducer } = useQuery({
    queryKey: ['fechamento-introducer', introducerId],
    queryFn: async () => {
      const results = await base44.entities.Introducer.filter({ id: introducerId });
      return results?.[0] || null;
    },
    enabled: !!introducerId,
  });

  // Fetch standard proposal rates (when coming from proposta padrão, no introducer)
  const { data: standardProposal, isLoading: isLoadingStdProp } = useQuery({
    queryKey: ['fechamento-std-proposal', segment],
    queryFn: async () => {
      const results = await base44.entities.StandardProposal.filter({ segment, status: 'ativa', isDefaultForSegment: true });
      return results?.[0] || null;
    },
    enabled: !!segment && !introducerId,
  });

  const isLoading = isLoadingIntroducer || isLoadingStdProp;

  // Rates: prefer introducer rates, fallback to standard proposal rates converted to same format
  const introducerRates = introducer?.standardRates?.find(s => s.segmentName === segment);
  const stdRates = standardProposal?.rates;
  const segmentRates = introducerRates || (stdRates ? {
    segmentName: segment,
    mdrAvista: stdRates.cartao?.visa?.avista,
    mdr2a6x: stdRates.cartao?.visa?.de2a6x,
    mdr7a12x: stdRates.cartao?.visa?.de7a12x,
    mdr13a21x: stdRates.cartao?.visa?.de13a21x,
    percentualAntecipacao: stdRates.rav?.taxa,
    feeTransacao: stdRates.feeTransacao,
    antifraude: stdRates.antifraude,
    taxa3ds: stdRates.taxa3ds,
    pixTaxaPercentual: stdRates.pix?.tipo === 'percentual' ? stdRates.pix?.valor : null,
    pixTaxaFixa: stdRates.pix?.tipo === 'fixo' ? stdRates.pix?.valor : null,
  } : null);
  const partnerName = introducer?.companyName || '';

  // Map segment to businessSubCategory
  const segmentToSubCategory = (seg) => {
    if (seg === 'Gateway') return 'GATEWAY';
    if (seg === 'Marketplace') return 'MARKETPLACE';
    return 'MERCHAN';
  };

  const FECHAMENTO_TEMPLATE_ID = '69caaf2cd9ea49029f4de352';

  const handleSubmit = async () => {
    setIsSubmitting(true);

    // Build expected rates from segment
    const expectedRates = {};
    if (segmentRates) {
      if (segmentRates.mdrAvista != null) expectedRates.mdr1x = segmentRates.mdrAvista;
      if (segmentRates.mdr2a6x != null) expectedRates.mdr2a6x = segmentRates.mdr2a6x;
      if (segmentRates.mdr7a12x != null) expectedRates.mdr7a12x = segmentRates.mdr7a12x;
      if (segmentRates.percentualAntecipacao != null) expectedRates.antecipacao = segmentRates.percentualAntecipacao;
      if (segmentRates.feeTransacao != null) expectedRates.feeTransacao = segmentRates.feeTransacao;
      if (segmentRates.antifraude != null) expectedRates.antifraude = segmentRates.antifraude;
      if (segmentRates.taxa3ds != null) expectedRates.taxa3ds = segmentRates.taxa3ds;
      if (segmentRates.pixTaxaPercentual != null || segmentRates.pixTaxaFixa != null) {
        expectedRates.pix = {
          tipo: segmentRates.pixTaxaPercentual != null ? 'percentual' : 'fixo',
          valor: segmentRates.pixTaxaPercentual ?? segmentRates.pixTaxaFixa,
        };
      }
    }

    // Build questionnaireData (minimal responses for traceability)
    const questionnaireData = {
      segment,
      cnpj: formData.cnpj || '',
      razaoSocial: formData.razaoSocial || '',
      nomeFantasia: formData.nomeFantasia || '',
      contactName: formData.contactName || '',
      email: formData.email || '',
      phone: formData.phone || '',
      website: formData.website || '',
      endereco: formData.endereco || {},
      origemFechamento: 'proposta_padrao',
      standardProposalSegment: segment,
      introducerId: introducerId || null,
      introducerRef: ref || null,
      taxasAceitas: segmentRates ? {
        mdrAvista: segmentRates.mdrAvista,
        mdr2a6x: segmentRates.mdr2a6x,
        mdr7a12x: segmentRates.mdr7a12x,
        mdr13a21x: segmentRates.mdr13a21x,
        antecipacao: segmentRates.percentualAntecipacao,
        feeTransacao: segmentRates.feeTransacao,
        antifraude: segmentRates.antifraude,
        taxa3ds: segmentRates.taxa3ds,
        pixPercentual: segmentRates.pixTaxaPercentual,
        pixFixa: segmentRates.pixTaxaFixa,
      } : null,
    };

    // Create Lead with full traceability
    const lead = await base44.entities.Lead.create({
      email: formData.email,
      fullName: formData.razaoSocial || '',
      cpfCnpj: formData.cnpj || '',
      phone: formData.phone || '',
      companyName: formData.nomeFantasia || '',
      website: formData.website || '',
      contactName: formData.contactName || '',
      status: 'proposta_aceita',
      businessSubCategory: segmentToSubCategory(segment),
      origemLead: 'proposta_padrao_fechamento',
      leadQuestionnaireTemplateId: FECHAMENTO_TEMPLATE_ID,
      questionnaireData,
      introducerId: introducerId || undefined,
      introducerReferralCode: ref || undefined,
      introducerName: partnerName || undefined,
      expectedRates,
    });

    // Save lead ID for compliance pre-fill (useLeadPrefill reads this)
    const complianceModel = SEGMENT_TO_COMPLIANCE[segment] || 'ComplianceEcommerceV4';
    localStorage.setItem('lead_id_for_compliance', lead.id);
    localStorage.setItem('fechamento_lead_id', lead.id);
    if (ref) localStorage.setItem('onboarding_link_code', ref);

    // Navigate to compliance
    navigate(`/ComplianceDinamico?model=${complianceModel}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4f4f4] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-[#002443] via-[#2bc196] to-[#5cf7cf] z-50" />

      <div className="max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="text-[#002443]/60 hover:text-[#002443] gap-1 text-xs">
            <ArrowLeft className="w-4 h-4" /> Voltar às taxas
          </Button>
          <img src={PAGSMILE_LOGO} alt="Pagsmile" className="h-6 opacity-40" />
        </motion.div>

        {/* Welcome message */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-[#2bc196] to-[#002443] mb-4">
            <Handshake className="w-8 h-8" style={{ color: '#ffffff' }} />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#002443] mb-3">
            Que bom que quer ser nosso <span className="text-[#2bc196]">parceiro</span>!
          </h1>
          <p className="text-sm text-[#002443]/60 max-w-lg mx-auto leading-relaxed">
            Estamos muito felizes com a sua decisão. Juntos, vamos construir uma parceria sólida para impulsionar o crescimento do seu negócio. Preencha os dados abaixo e em poucos minutos você estará pronto para operar.
          </p>
        </motion.div>

        {/* Progress bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#002443]/40">
          <div className="flex items-center gap-1.5"><div className="w-6 h-6 rounded-full bg-[#2bc196] flex items-center justify-center text-white text-[10px] font-bold">1</div><span className="text-[#2bc196]">Dados</span></div>
          <div className="flex-1 h-px bg-[#002443]/10" />
          <div className="flex items-center gap-1.5"><div className="w-6 h-6 rounded-full bg-[#002443]/10 flex items-center justify-center text-[#002443]/40 text-[10px] font-bold">2</div><span>Compliance</span></div>
          <div className="flex-1 h-px bg-[#002443]/10" />
          <div className="flex items-center gap-1.5"><div className="w-6 h-6 rounded-full bg-[#002443]/10 flex items-center justify-center text-[#002443]/40 text-[10px] font-bold">3</div><span>Documentos</span></div>
          <div className="flex-1 h-px bg-[#002443]/10" />
          <div className="flex items-center gap-1.5"><div className="w-6 h-6 rounded-full bg-[#002443]/10 flex items-center justify-center text-[#002443]/40 text-[10px] font-bold">4</div><span>Conclusão</span></div>
        </motion.div>

        {/* Rates resume */}
        {segmentRates && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <p className="text-xs font-bold uppercase tracking-widest text-[#002443]/40 mb-3">Condições selecionadas</p>
            <FechamentoRatesResume segmentRates={segmentRates} segmentName={segment} partnerName={partnerName} />
          </motion.div>
        )}

        {!segmentRates && segment && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="bg-[#002443] rounded-2xl p-6 text-center">
              <p className="text-xs uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Segmento selecionado</p>
              <p className="text-xl font-extrabold" style={{ color: '#2bc196' }}>{segment}</p>
            </div>
          </motion.div>
        )}

        {/* Company form */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white border border-[#002443]/[0.06] rounded-2xl p-6 md:p-8">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="w-5 h-5 text-[#2bc196]" />
            <h2 className="text-lg font-bold text-[#002443]">Dados da Empresa</h2>
          </div>
          <FechamentoCompanyForm formData={formData} setFormData={setFormData} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
        </motion.div>

        {/* Trust footer */}
        <div className="text-center pb-8">
          <div className="flex items-center justify-center gap-2 text-xs text-[#002443]/30">
            <Lock className="w-3 h-3" />
            <span>Ambiente seguro e criptografado de ponta a ponta</span>
          </div>
          <img src={PAGSMILE_LOGO} alt="Pagsmile" className="h-5 mx-auto mt-4 opacity-20" />
        </div>
      </div>
    </div>
  );
}