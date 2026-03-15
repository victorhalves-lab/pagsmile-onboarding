import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2, Save, ClipboardList, ArrowLeft, Building2, CreditCard, DollarSign, Shield, Target } from 'lucide-react';

import MeetingFormBasicInfo from '@/components/meeting-questionnaire/MeetingFormBasicInfo';
import MeetingFormBusinessDetails from '@/components/meeting-questionnaire/MeetingFormBusinessDetails';
import MeetingFormVolume from '@/components/meeting-questionnaire/MeetingFormVolume';
import MeetingFormCurrentRates from '@/components/meeting-questionnaire/MeetingFormCurrentRates';
import MeetingFormChallenges from '@/components/meeting-questionnaire/MeetingFormChallenges';

export default function QuestionarioReuniao() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('id');

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const defaultForm = {
    clientFullName: '', clientCpfCnpj: '', clientEmail: '', clientPhone: '',
    clientWebsite: '', contactName: '', contactRole: '',
    businessType: '', businessDescription: '', salesChannels: '',
    revenueBreakdown: [{ product: '', percentage: 0 }],
    monthlyTpv: '', averageTicket: '', monthlyTransactions: '', growthExpectation: '',
    preferredPaymentMethods: [],
    currentMdr1x: '', currentMdr2to6x: '', currentMdr7to12x: '',
    currentPixRate: '', currentBoletoRate: '',
    anticipationType: '', anticipationRate: '',
    transactionFee: '',
    antiFraudProvider: '', antiFraudCost: '',
    currentChallenges: '', criticalFeatures: '', implementationTimeline: '',
    notes: ''
  };

  const [form, setForm] = useState(defaultForm);
  const [loadedExisting, setLoadedExisting] = useState(false);

  // Load existing questionnaire for editing
  const { data: existingQuestionnaire, isLoading: loadingExisting } = useQuery({
    queryKey: ['edit-questionnaire', editId],
    queryFn: () => base44.entities.InternalCommercialQuestionnaire.filter({ id: editId }),
    enabled: !!editId,
  });

  React.useEffect(() => {
    if (existingQuestionnaire?.length > 0 && !loadedExisting) {
      const q = existingQuestionnaire[0];
      setForm({
        clientFullName: q.clientFullName || '',
        clientCpfCnpj: q.clientCpfCnpj || '',
        clientEmail: q.clientEmail === 'pendente@revisar.com' ? '' : (q.clientEmail || ''),
        clientPhone: q.clientPhone || '',
        clientWebsite: q.clientWebsite || '',
        contactName: q.contactName || '',
        contactRole: q.contactRole || '',
        businessType: q.businessType || '',
        businessDescription: q.businessDescription || '',
        salesChannels: q.salesChannels || '',
        revenueBreakdown: q.revenueBreakdown?.length > 0 ? q.revenueBreakdown : [{ product: '', percentage: 0 }],
        monthlyTpv: q.monthlyTpv != null ? String(q.monthlyTpv) : '',
        averageTicket: q.averageTicket != null ? String(q.averageTicket) : '',
        monthlyTransactions: q.monthlyTransactions != null ? String(q.monthlyTransactions) : '',
        growthExpectation: q.growthExpectation || '',
        preferredPaymentMethods: q.preferredPaymentMethods || [],
        currentMdr1x: q.currentMdr1x != null ? String(q.currentMdr1x) : '',
        currentMdr2to6x: q.currentMdr2to6x != null ? String(q.currentMdr2to6x) : '',
        currentMdr7to12x: q.currentMdr7to12x != null ? String(q.currentMdr7to12x) : '',
        currentPixRate: q.currentPixRate != null ? String(q.currentPixRate) : '',
        currentBoletoRate: q.currentBoletoRate != null ? String(q.currentBoletoRate) : '',
        anticipationType: q.anticipationType || '',
        anticipationRate: q.anticipationRate != null ? String(q.anticipationRate) : '',
        transactionFee: q.transactionFee != null ? String(q.transactionFee) : '',
        antiFraudProvider: q.antiFraudProvider || '',
        antiFraudCost: q.antiFraudCost != null ? String(q.antiFraudCost) : '',
        currentChallenges: q.currentChallenges || '',
        criticalFeatures: q.criticalFeatures || '',
        implementationTimeline: q.implementationTimeline || '',
        notes: q.notes || '',
      });
      setLoadedExisting(true);
    }
  }, [existingQuestionnaire, loadedExisting]);

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.clientFullName || !form.clientEmail || !form.businessType) {
      toast.error('Preencha os campos obrigatórios: Nome, Email e Tipo de Negócio');
      return;
    }
    setSaving(true);

    const protocolo = `MR-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

    // Clean numeric fields
    const data = {
      ...form,
      protocolo,
      commercialAgentName: user?.full_name || 'Admin',
      status: 'preenchido',
      monthlyTpv: form.monthlyTpv ? Number(form.monthlyTpv) : undefined,
      averageTicket: form.averageTicket ? Number(form.averageTicket) : undefined,
      monthlyTransactions: form.monthlyTransactions ? Number(form.monthlyTransactions) : undefined,
      currentMdr1x: form.currentMdr1x ? Number(form.currentMdr1x) : undefined,
      currentMdr2to6x: form.currentMdr2to6x ? Number(form.currentMdr2to6x) : undefined,
      currentMdr7to12x: form.currentMdr7to12x ? Number(form.currentMdr7to12x) : undefined,
      currentPixRate: form.currentPixRate ? Number(form.currentPixRate) : undefined,
      currentBoletoRate: form.currentBoletoRate ? Number(form.currentBoletoRate) : undefined,
      anticipationRate: form.anticipationRate ? Number(form.anticipationRate) : undefined,
      transactionFee: form.transactionFee ? Number(form.transactionFee) : undefined,
      antiFraudCost: form.antiFraudCost ? Number(form.antiFraudCost) : undefined,
      revenueBreakdown: form.revenueBreakdown.filter(r => r.product && r.percentage > 0),
    };

    // Remove empty strings
    Object.keys(data).forEach(k => { if (data[k] === '') delete data[k]; });

    const questionnaire = await base44.entities.InternalCommercialQuestionnaire.create(data);

    // Create a Lead from this questionnaire
    const lead = await base44.entities.Lead.create({
      email: form.clientEmail,
      fullName: form.clientFullName,
      cpfCnpj: form.clientCpfCnpj || undefined,
      phone: form.clientPhone || undefined,
      companyName: form.clientFullName,
      website: form.clientWebsite || undefined,
      contactName: form.contactName || undefined,
      contactRole: form.contactRole || undefined,
      status: 'questionario_preenchido',
      businessSubCategory: form.businessType,
      tpvMensal: data.monthlyTpv || undefined,
      ticketMedio: data.averageTicket || undefined,
      transacoesMes: data.monthlyTransactions || undefined,
      expectativaCrescimento: form.growthExpectation || undefined,
      protocolo,
      origemLead: 'reuniao_comercial',
      lastInteractionDate: new Date().toISOString(),
      expectedRates: {
        mdr1x: data.currentMdr1x,
        mdr2a6x: data.currentMdr2to6x,
        mdr7a12x: data.currentMdr7to12x,
        antecipacao: data.anticipationRate,
        feeTransacao: data.transactionFee,
        antifraude: data.antiFraudCost,
      },
      questionnaireData: {
        origem: 'reuniao_comercial',
        questionnaireId: questionnaire.id,
        businessDescription: form.businessDescription,
        salesChannels: form.salesChannels,
        revenueBreakdown: data.revenueBreakdown,
        preferredPaymentMethods: form.preferredPaymentMethods,
        currentPixRate: data.currentPixRate,
        currentBoletoRate: data.currentBoletoRate,
        anticipationType: form.anticipationType,
        antiFraudProvider: form.antiFraudProvider,
        antiFraudCost: data.antiFraudCost,
        currentChallenges: form.currentChallenges,
        criticalFeatures: form.criticalFeatures,
        implementationTimeline: form.implementationTimeline,
        notes: form.notes,
      }
    });

    // Link questionnaire to lead
    await base44.entities.InternalCommercialQuestionnaire.update(questionnaire.id, { leadId: lead.id });

    queryClient.invalidateQueries({ queryKey: ['leads-questionarios'] });
    queryClient.invalidateQueries({ queryKey: ['internal-questionnaires'] });

    setSaving(false);
    toast.success('Questionário salvo e lead criado com sucesso!');
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
            <ClipboardList className="w-6 h-6 text-[#5cf7cf]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Questionário de Reunião</h1>
            <p className="text-sm text-white/60">Preencha durante a reunião comercial com o cliente</p>
          </div>
        </div>
      </div>

      <MeetingFormBasicInfo form={form} updateField={updateField} />
      <MeetingFormBusinessDetails form={form} updateField={updateField} />
      <MeetingFormVolume form={form} updateField={updateField} />
      <MeetingFormCurrentRates form={form} updateField={updateField} />
      <MeetingFormChallenges form={form} updateField={updateField} />

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