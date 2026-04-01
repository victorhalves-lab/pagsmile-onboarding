import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import FechamentoRatesResume from '@/components/fechamento/FechamentoRatesResume';
import FechamentoStep1CompanyForm from '@/components/fechamento/FechamentoStep1CompanyForm';
import FechamentoStep2Volumetria from '@/components/fechamento/FechamentoStep2Volumetria';
import FechamentoStep3ModeloNegocio from '@/components/fechamento/FechamentoStep3ModeloNegocio';
import SEGMENT_TO_COMPLIANCE from '@/components/fechamento/segmentComplianceMap';

// Mapa: nome do segmento → businessSubCategory para o Lead
const SEGMENT_TO_BIZ_CATEGORY = {
  'Gateway': 'GATEWAY',
  'Marketplace': 'MARKETPLACE',
  'Plataformas Verticais': 'GATEWAY',
  'Educação': 'MERCHAN',
  'Infoprodutos': 'MERCHAN',
  'E-commerce': 'MERCHAN',
  'SaaS': 'MERCHAN',
  'Dropshipping': 'MERCHAN',
  'MPE': 'MERCHAN',
  'Link de Pagamento': 'MERCHAN',
};

const StepIndicator = ({ current, total }) => (
  <div className="flex items-center justify-center gap-2 mb-8">
    {[...Array(total)].map((_, i) => (
      <div
        key={i}
        className={`h-2 rounded-full transition-all duration-300 ${
          i + 1 === current ? 'w-8 bg-[#2bc196]' : 'w-2 bg-[#002443]/10'
        }`}
      />
    ))}
  </div>
);

export default function FechamentoLandingPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    distribuicaoTpv: { cartao: 40, pix: 50, boleto: 10 },
  });

  const segmentName = searchParams.get('segmento');
  const partnerId = searchParams.get('partnerId');
  const fromStandardProposalToken = searchParams.get('fromStandardProposal');
  const introducerId = searchParams.get('introducerId');
  const commercialAgentId = searchParams.get('agentId');

  const { data: ratesData, isLoading: isLoadingRates } = useQuery({
    queryKey: ['fechamentoRates', fromStandardProposalToken, introducerId, segmentName],
    queryFn: async () => {
      if (fromStandardProposalToken) {
        const proposals = await base44.entities.StandardProposal.filter({ tokenPublico: fromStandardProposalToken });
        if (proposals.length > 0) return { rates: proposals[0].rates, partnerId: proposals[0].chosenPartnerId };
      }
      if (introducerId && segmentName) {
        const introducers = await base44.entities.Introducer.filter({ id: introducerId });
        if (introducers.length > 0) {
          const segmentRate = introducers[0].standardRates?.find(r => r.segmentName === segmentName);
          if (segmentRate) return { rates: segmentRate, isFromIntroducer: true };
        }
      }
      return null;
    },
    retry: false,
  });

  const { data: commercialAgent } = useQuery({
    queryKey: ['commercialAgent', commercialAgentId],
    queryFn: () => base44.entities.User.filter({ id: commercialAgentId }).then(res => res[0]),
    enabled: !!commercialAgentId,
  });

  const isFromStandardProposal = !!fromStandardProposalToken;
  const isFromLandingPage = !isFromStandardProposal;
  const slug = searchParams.get('slug') || '';
  const introducerReferralCode = searchParams.get('refCode') || '';

  const createLeadAndProposalMutation = useMutation({
    mutationFn: async (finalFormData) => {
      const tpvReais = (finalFormData.tpvMensal || 0) / 100;

      const commonFields = {
        cnpj: finalFormData.cnpj,
        razaoSocial: finalFormData.razaoSocial,
        nomeFantasia: finalFormData.nomeFantasia,
        website: finalFormData.website,
        email: finalFormData.email,
        phone: finalFormData.phone,
        contactName: finalFormData.contactName,
        contactRole: finalFormData.contactRole,
        endereco: finalFormData.endereco,
        tpvMensal: tpvReais,
        distribuicaoTpv: finalFormData.distribuicaoTpv,
        modeloNegocio: finalFormData.modeloNegocio,
        sellersDescription: finalFormData.sellersDescription,
        fornecedores: finalFormData.fornecedores,
        segment: segmentName,
        businessSubCategory: SEGMENT_TO_BIZ_CATEGORY[segmentName] || 'MERCHAN',
        status: 'novo',
        ...(commercialAgent && { commercialAgentId: commercialAgent.id, commercialAgentName: commercialAgent.full_name }),
      };

      let createdOriginLead;

      if (isFromStandardProposal) {
        // === PROPOSTA PADRÃO ===
        createdOriginLead = await base44.entities.StandardProposalLead.create({
          ...commonFields,
          standardProposalToken: fromStandardProposalToken,
          ...(introducerId && { introducerId }),
        });
      } else {
        // === LANDING PAGE ===
        // Buscar dados do introducer
        let introducerData = {};
        if (introducerId) {
          const intros = await base44.entities.Introducer.filter({ id: introducerId });
          if (intros.length > 0) {
            introducerData = {
              introducerId: intros[0].id,
              introducerName: intros[0].name,
              introducerReferralCode: intros[0].referralCode,
            };
          }
        }
        createdOriginLead = await base44.entities.LandingPageLead.create({
          ...commonFields,
          slug,
          ...introducerData,
        });
      }

      // 2. Create Lead (para pipeline comercial)
      const origemLead = isFromStandardProposal ? 'proposta_padrao' : 'landing_page';
      const leadPayload = {
        fullName: finalFormData.razaoSocial,
        companyName: finalFormData.nomeFantasia,
        cpfCnpj: finalFormData.cnpj,
        email: finalFormData.email,
        phone: finalFormData.phone,
        contactName: finalFormData.contactName,
        contactRole: finalFormData.contactRole,
        website: finalFormData.website,
        businessSubCategory: SEGMENT_TO_BIZ_CATEGORY[segmentName] || 'MERCHAN',
        status: 'questionario_preenchido',
        origemLead,
        tpvMensal: tpvReais,
        questionnaireData: {
          tpvMensal: tpvReais,
          distribuicaoTpv: finalFormData.distribuicaoTpv,
          modeloNegocio: finalFormData.modeloNegocio,
          sellersDescription: finalFormData.sellersDescription,
          fornecedores: finalFormData.fornecedores,
          segmentoLandingPage: segmentName,
          contactRole: finalFormData.contactRole,
        },
        ...(introducerId && { introducerId }),
        ...(commercialAgent && { commercialAgentId: commercialAgent.id, commercialAgentName: commercialAgent.full_name }),
      };

      const createdLead = await base44.entities.Lead.create(leadPayload);

      // 3. Create Proposal
      const proposalPayload = {
        leadId: createdLead.id,
        status: 'rascunho',
        rates: ratesData.rates,
        clienteNome: createdLead.fullName,
        clienteCnpj: createdLead.cpfCnpj,
        chosenPartnerId: ratesData.partnerId,
        businessSubCategory: SEGMENT_TO_BIZ_CATEGORY[segmentName] || 'MERCHAN',
      };

      const proposalEntity = ratesData.rates.pix ? 'PixProposal' : 'Proposal';
      const createdProposal = await base44.entities[proposalEntity].create(proposalPayload);

      // 4. Link everything
      await base44.entities.Lead.update(createdLead.id, { currentProposalId: createdProposal.id });
      const updateEntity = isFromStandardProposal ? 'StandardProposalLead' : 'LandingPageLead';
      await base44.entities[updateEntity].update(createdOriginLead.id, { leadId: createdLead.id, proposalId: createdProposal.id });

      return { lead: createdLead, proposal: createdProposal };
    },
    onSuccess: ({ lead }) => {
      toast.success('Dados recebidos! Redirecionando para o compliance...');
      const complianceModel = (segmentName && SEGMENT_TO_COMPLIANCE[segmentName]) || 'ComplianceEcommerceV4';
      const complianceUrl = `${window.location.origin}/ComplianceDinamico?model=${complianceModel}&leadId=${lead.id}`;
      window.location.href = complianceUrl;
    },
    onError: (error) => {
      console.error("Mutation Error:", error);
      toast.error('Ocorreu um erro ao enviar seus dados. Tente novamente.');
    },
  });

  const handleFinalSubmit = () => {
    createLeadAndProposalMutation.mutate(formData);
  };
  
  if (isLoadingRates) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <Skeleton className="h-8 w-1/2 mb-4" />
        <Skeleton className="h-4 w-3/4 mb-8" />
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="md:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!ratesData) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Link de Proposta Inválido</h2>
        <p className="text-[#002443]/80">Não foi possível encontrar os dados da proposta. Por favor, verifique o link ou entre em contato com nosso time comercial.</p>
        <Button onClick={() => navigate('/')} className="mt-8 gap-2"><ArrowLeft /> Voltar ao Início</Button>
      </div>
    );
  }
  
  const renderStep = () => {
    switch (step) {
      case 1:
        return <FechamentoStep1CompanyForm formData={formData} setFormData={setFormData} nextStep={() => setStep(2)} />;
      case 2:
        return <FechamentoStep2Volumetria formData={formData} setFormData={setFormData} nextStep={() => setStep(3)} prevStep={() => setStep(1)} />;
      case 3:
        return <FechamentoStep3ModeloNegocio formData={formData} setFormData={setFormData} segmentName={segmentName} prevStep={() => setStep(2)} onSubmit={handleFinalSubmit} isSubmitting={createLeadAndProposalMutation.isPending} />;
      default:
        return <FechamentoStep1CompanyForm formData={formData} setFormData={setFormData} nextStep={() => setStep(2)} />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-[#002443] tracking-tight">Estamos quase lá!</h1>
        <p className="text-lg text-[#002443]/70 mt-2">
          Confira as taxas da sua proposta e preencha os dados para iniciarmos o processo de compliance.
        </p>
      </div>
      
      <div className="grid md:grid-cols-5 gap-10 lg:gap-16">
        <div className="md:col-span-2">
          <FechamentoRatesResume segmentRates={ratesData.rates} segmentName={segmentName} />
        </div>
        <div className="md:col-span-3">
          <Card className="p-6 sm:p-8 shadow-xl bg-white/80 backdrop-blur-sm">
            <StepIndicator current={step} total={3} />
            {renderStep()}
          </Card>
        </div>
      </div>
    </div>
  );
}