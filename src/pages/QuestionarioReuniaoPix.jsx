import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Save, ArrowLeft, Zap } from 'lucide-react';

import PixFormBasicInfo from '@/components/pix-questionnaire/PixFormBasicInfo';
import PixFormBusiness from '@/components/pix-questionnaire/PixFormBusiness';
import PixFormCompetitors from '@/components/pix-questionnaire/PixFormCompetitors';

export default function QuestionarioReuniaoPix() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const defaultForm = {
    clientFullName: '',
    clientCpfCnpj: '',
    contactName: '',
    clientEmail: '',
    clientPhone: '',
    businessType: '',
    pixTpv: '',
    pixTicketMedio: '',
    pixVolume: '',
    businessModel: '',
    whatSells: '',
    currentPixPartners: '',
    currentPixCost: '',
    mainChallenges: '',
    competitorProposalUrl: ''
  };

  const [form, setForm] = useState(defaultForm);
  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // Auto-calc volume
  React.useEffect(() => {
    const tpv = parseFloat(form.pixTpv);
    const ticket = parseFloat(form.pixTicketMedio);
    if (tpv > 0 && ticket > 0) {
      updateField('pixVolume', String(Math.round(tpv / ticket)));
    } else {
      updateField('pixVolume', '');
    }
  }, [form.pixTpv, form.pixTicketMedio]);

  const handleSubmit = async () => {
    if (!form.clientFullName || !form.clientEmail || !form.businessType) {
      toast.error('Preencha os campos obrigatórios: Nome da Empresa, E-mail e Tipo de Atuação');
      return;
    }
    setSaving(true);

    const protocolo = `PIX-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

    // Create InternalCommercialQuestionnaire
    const questionnaire = await base44.entities.InternalCommercialQuestionnaire.create({
      commercialAgentName: user?.full_name || 'Admin',
      status: 'preenchido',
      origemIA: false,
      protocolo,
      clientFullName: form.clientFullName,
      clientCpfCnpj: form.clientCpfCnpj || undefined,
      clientEmail: form.clientEmail,
      clientPhone: form.clientPhone || undefined,
      contactName: form.contactName || undefined,
      businessType: form.businessType === 'Gateway' ? 'GATEWAY' : form.businessType === 'Marketplace' ? 'MARKETPLACE' : 'MERCHAN',
      businessDescription: form.businessModel || undefined,
      monthlyTpv: form.pixTpv ? Number(form.pixTpv) : undefined,
      averageTicket: form.pixTicketMedio ? Number(form.pixTicketMedio) : undefined,
      monthlyTransactions: form.pixVolume ? Number(form.pixVolume) : undefined,
      currentPixRate: form.currentPixCost ? Number(form.currentPixCost.replace(/[^0-9.,]/g, '').replace(',', '.')) : undefined,
      currentChallenges: form.mainChallenges || undefined,
      notes: [
        form.whatSells ? `Produtos/Serviços: ${form.whatSells}` : '',
        form.currentPixPartners ? `Parceiros PIX atuais: ${form.currentPixPartners}` : '',
        form.currentPixCost ? `Custo PIX atual: ${form.currentPixCost}` : '',
        form.competitorProposalUrl ? `Proposta concorrente: ${form.competitorProposalUrl}` : '',
      ].filter(Boolean).join('\n'),
      preferredPaymentMethods: ['PIX'],
    });

    // Create Lead
    const lead = await base44.entities.Lead.create({
      email: form.clientEmail,
      fullName: form.clientFullName,
      cpfCnpj: form.clientCpfCnpj || undefined,
      phone: form.clientPhone || undefined,
      companyName: form.clientFullName,
      contactName: form.contactName || undefined,
      status: 'questionario_preenchido',
      businessSubCategory: form.businessType === 'Gateway' ? 'GATEWAY' : form.businessType === 'Marketplace' ? 'MARKETPLACE' : 'MERCHAN',
      tpvMensal: form.pixTpv ? Number(form.pixTpv) : undefined,
      ticketMedio: form.pixTicketMedio ? Number(form.pixTicketMedio) : undefined,
      transacoesMes: form.pixVolume ? Number(form.pixVolume) : undefined,
      protocolo,
      origemLead: 'reuniao_pix',
      lastInteractionDate: new Date().toISOString(),
      expectedRates: {
        mdr1x: undefined,
        mdr2a6x: undefined,
        mdr7a12x: undefined,
        antecipacao: undefined,
        feeTransacao: undefined,
        antifraude: undefined,
      },
      questionnaireData: {
        origem: 'reuniao_pix',
        questionnaireId: questionnaire.id,
        businessDescription: form.businessModel,
        whatSells: form.whatSells,
        currentPixPartners: form.currentPixPartners,
        currentPixCost: form.currentPixCost,
        mainChallenges: form.mainChallenges,
        competitorProposalUrl: form.competitorProposalUrl,
      }
    });

    await base44.entities.InternalCommercialQuestionnaire.update(questionnaire.id, { leadId: lead.id });

    queryClient.invalidateQueries({ queryKey: ['leads-questionarios'] });
    queryClient.invalidateQueries({ queryKey: ['internal-questionnaires'] });
    setSaving(false);
    toast.success('Questionário PIX salvo e lead criado com sucesso!');
    navigate(createPageUrl('QuestionariosLeads'));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl('QuestionariosLeads'))} className="text-white/70 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <div className="p-3 rounded-xl bg-white/10">
            <Zap className="w-6 h-6 text-[#5cf7cf]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Questionário de Reunião - PIX</h1>
            <p className="text-sm text-white/60">Preencha durante a reunião com clientes interessados em PIX</p>
          </div>
        </div>
      </div>

      <PixFormBasicInfo form={form} updateField={updateField} />
      <PixFormBusiness form={form} updateField={updateField} />
      <PixFormCompetitors form={form} updateField={updateField} />

      {/* Submit */}
      <div className="flex justify-end gap-3 pb-8">
        <Button variant="outline" onClick={() => navigate(createPageUrl('QuestionariosLeads'))}>Cancelar</Button>
        <Button onClick={handleSubmit} disabled={saving} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white">
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Salvar e Criar Lead
        </Button>
      </div>
    </div>
  );
}