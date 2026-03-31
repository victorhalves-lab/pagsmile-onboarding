import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Zap, Upload, Check, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function LeadQuestionnairePix() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const linkCode = urlParams.get('ref');

  const { data: onboardingLink } = useQuery({
    queryKey: ['onboardingLink', linkCode],
    queryFn: async () => {
      if (!linkCode) return null;
      const links = await base44.entities.OnboardingLink.filter({ uniqueCode: linkCode });
      return links[0] || null;
    },
    enabled: !!linkCode
  });

  const [form, setForm] = useState({
    companyName: '', cnpj: '', contactName: '', email: '', phone: '',
    businessType: '', pixTpv: '', pixTicketMedio: '', pixVolume: '',
    businessModel: '', whatSells: '', currentPixPartners: '',
    currentPixCost: '', mainChallenges: '', competitorFile: null, competitorFileUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [protocolo, setProtocolo] = useState('');

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  // Auto-calc volume
  useEffect(() => {
    const tpv = parseFloat(form.pixTpv);
    const ticket = parseFloat(form.pixTicketMedio);
    if (tpv > 0 && ticket > 0) {
      updateField('pixVolume', String(Math.round(tpv / ticket)));
    } else {
      updateField('pixVolume', '');
    }
  }, [form.pixTpv, form.pixTicketMedio]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    updateField('competitorFileUrl', file_url);
    setUploading(false);
    toast.success('Arquivo enviado!');
  };

  const handleSubmit = async () => {
    if (!form.companyName || !form.email || !form.businessType) {
      toast.error('Preencha os campos obrigatórios: Nome da Empresa, E-mail e Tipo de Atuação');
      return;
    }
    setSubmitting(true);

    const proto = `PIX-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;
    const bizMap = { Gateway: 'GATEWAY', Seller: 'MERCHAN', Marketplace: 'MARKETPLACE' };

    // Buscar dados do Introducer se existir no link
    let introducerData = {};
    if (onboardingLink?.introducerId) {
      const introducers = await base44.entities.Introducer.filter({ id: onboardingLink.introducerId });
      if (introducers.length > 0) {
        introducerData = {
          introducerId: introducers[0].id,
          introducerReferralCode: introducers[0].referralCode,
          introducerName: introducers[0].name,
        };
      }
    } else if (onboardingLink?.introducerReferralCode) {
      const introducers = await base44.entities.Introducer.filter({ referralCode: onboardingLink.introducerReferralCode, status: 'active' });
      if (introducers.length > 0) {
        introducerData = {
          introducerId: introducers[0].id,
          introducerReferralCode: introducers[0].referralCode,
          introducerName: introducers[0].name,
        };
      }
    }

    const lead = await base44.entities.Lead.create({
      email: form.email,
      fullName: form.companyName,
      cpfCnpj: form.cnpj || undefined,
      phone: form.phone || undefined,
      companyName: form.companyName,
      contactName: form.contactName || undefined,
      status: 'questionario_preenchido',
      businessSubCategory: bizMap[form.businessType] || 'MERCHAN',
      tpvMensal: form.pixTpv ? Number(form.pixTpv) : undefined,
      ticketMedio: form.pixTicketMedio ? Number(form.pixTicketMedio) : undefined,
      transacoesMes: form.pixVolume ? Number(form.pixVolume) : undefined,
      protocolo: proto,
      origemLead: linkCode ? `link_pix_${linkCode}` : 'questionario_pix_publico',
      onboardingLinkCode: linkCode || undefined,
      ...introducerData,
      commercialAgentId: onboardingLink?.commercialAgentId || undefined,
      commercialAgentName: onboardingLink?.commercialAgentName || undefined,
      lastInteractionDate: new Date().toISOString(),
      questionnaireData: {
        origem: 'questionario_pix_publico',
        businessModel: form.businessModel,
        whatSells: form.whatSells,
        currentPixPartners: form.currentPixPartners,
        currentPixCost: form.currentPixCost,
        mainChallenges: form.mainChallenges,
        competitorFileUrl: form.competitorFileUrl,
      }
    });

    if (onboardingLink) {
      await base44.entities.OnboardingLink.update(onboardingLink.id, {
        submissionCount: (onboardingLink.submissionCount || 0) + 1
      });
    }

    setProtocolo(proto);
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Card className="max-w-md w-full text-center">
          <CardContent className="pt-8 pb-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#2bc196]/10 flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-[#2bc196]" />
            </div>
            <h2 className="text-xl font-bold">Questionário Enviado!</h2>
            <p className="text-sm text-[#002443]/60">
              Seu protocolo é <strong className="text-[#2bc196]">{protocolo}</strong>
            </p>
            <p className="text-sm text-[#002443]/60">Nossa equipe entrará em contato em breve.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-[#2bc196]/10 flex items-center justify-center mx-auto">
          <Zap className="w-7 h-7 text-[#2bc196]" />
        </div>
        <h1 className="text-2xl font-bold text-[#002443]">Questionário PIX</h1>
        <p className="text-sm text-[#002443]/60">Preencha para receber uma proposta personalizada de PIX</p>
      </div>

      {/* Basic Info */}
      <Card className="border-[#002443]/5">
        <CardHeader className="pb-3"><CardTitle className="text-base">Dados da Empresa</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Nome da Empresa *</Label><Input value={form.companyName} onChange={e => updateField('companyName', e.target.value)} placeholder="Razão Social" /></div>
            <div><Label>CNPJ</Label><Input value={form.cnpj} onChange={e => updateField('cnpj', e.target.value)} placeholder="00.000.000/0001-00" /></div>
            <div><Label>Nome do Contato</Label><Input value={form.contactName} onChange={e => updateField('contactName', e.target.value)} placeholder="Nome do contato" /></div>
            <div><Label>E-mail *</Label><Input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} placeholder="email@empresa.com" /></div>
            <div><Label>Telefone</Label><Input value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="(11) 99999-9999" /></div>
            <div>
              <Label>Tipo de Atuação *</Label>
              <Select value={form.businessType} onValueChange={v => updateField('businessType', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gateway">Gateway</SelectItem>
                  <SelectItem value="Seller">Seller</SelectItem>
                  <SelectItem value="Marketplace">Marketplace</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Volume PIX */}
      <Card className="border-[#002443]/5">
        <CardHeader className="pb-3"><CardTitle className="text-base">Volume PIX</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><Label>TPV Mensal em PIX (R$) *</Label><Input type="number" value={form.pixTpv} onChange={e => updateField('pixTpv', e.target.value)} placeholder="150000" /></div>
            <div><Label>Ticket Médio PIX (R$) *</Label><Input type="number" value={form.pixTicketMedio} onChange={e => updateField('pixTicketMedio', e.target.value)} placeholder="75" /></div>
            <div><Label>Volume Transações/Mês</Label><Input type="number" value={form.pixVolume} readOnly className="bg-[#f4f4f4] font-semibold" placeholder="Calculado" /><p className="text-[10px] text-[#002443]/50 mt-1">TPV ÷ Ticket Médio</p></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Modelo de Negócio</Label><Textarea value={form.businessModel} onChange={e => updateField('businessModel', e.target.value)} placeholder="Como sua empresa opera?" rows={2} /></div>
            <div><Label>O que vende/comercializa?</Label><Textarea value={form.whatSells} onChange={e => updateField('whatSells', e.target.value)} placeholder="Produtos ou serviços" rows={2} /></div>
          </div>
        </CardContent>
      </Card>

      {/* Competitors */}
      <Card className="border-[#002443]/5">
        <CardHeader className="pb-3"><CardTitle className="text-base">Situação Atual</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label>Parceiros atuais de PIX</Label><Input value={form.currentPixPartners} onChange={e => updateField('currentPixPartners', e.target.value)} placeholder="Banco X, Y Pagamentos" /></div>
            <div><Label>Quanto paga por PIX atualmente?</Label><Input value={form.currentPixCost} onChange={e => updateField('currentPixCost', e.target.value)} placeholder="R$ 0,89 ou 0,5%" /></div>
          </div>
          <div><Label>Principais dores</Label><Textarea value={form.mainChallenges} onChange={e => updateField('mainChallenges', e.target.value)} placeholder="Altas taxas, conciliação, suporte..." rows={2} /></div>
          <div>
            <Label className="mb-1 block">Upload de proposta de concorrente (opcional)</Label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer">
                <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleFileUpload} />
                <Button type="button" variant="outline" size="sm" asChild disabled={uploading}>
                  <span>{uploading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Upload className="w-4 h-4 mr-1" />}Selecionar</span>
                </Button>
              </label>
              {form.competitorFileUrl && <span className="text-xs text-[#2bc196] flex items-center gap-1"><Check className="w-3 h-3" />Enviado</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-center pb-8">
        <Button onClick={handleSubmit} disabled={submitting} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white px-8 py-3 text-base">
          {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />}
          Enviar Questionário
        </Button>
      </div>
    </div>
  );
}