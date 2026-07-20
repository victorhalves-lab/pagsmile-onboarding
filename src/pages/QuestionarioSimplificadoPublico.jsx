import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, User, CreditCard, Zap, Percent, CheckCircle2, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import TaxasPorBandeiraInput from '../components/questionario-simplificado/TaxasPorBandeiraInput';

function formatCnpjInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function formatPhoneInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
}

export default function QuestionarioSimplificadoPublico() {
  const [formData, setFormData] = useState({
    nome_empresa: '',
    cnpj: '',
    contato_nome: '',
    contato_email: '',
    contato_telefone: '',
    contato_cargo: '',
    taxas_credito_1x: {},
    taxas_credito_2_6x: {},
    taxas_credito_7_12x: {},
    usa_antecipacao: false,
    percentual_antecipacao: null,
    taxa_antecipacao: null,
    distribuicao_avista: null,
    distribuicao_2_6x: null,
    distribuicao_7_12x: null,
    pix_tipo: 'percentual',
    pix_valor: null,
    taxa_antifraude_centavos: null,
    usa_fee_transacao: false,
    fee_transacao_centavos: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [protocolo, setProtocolo] = useState('');

  const urlParams = new URLSearchParams(window.location.search);
  const refCode = urlParams.get('ref');

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome_empresa || !formData.cnpj || !formData.contato_nome || !formData.contato_email || !formData.contato_telefone || !formData.contato_cargo) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSubmitting(true);
    const year = new Date().getFullYear();
    const seq = Math.floor(10000 + Math.random() * 90000);
    const prot = `PAG-QS-${year}-${seq}`;

    await base44.functions.invoke('publicLeadSubmit', {
      kind: 'simplified',
      linkCode: refCode || undefined,
      simplifiedPayload: {
        ...formData,
        protocolo: prot,
        onboarding_link_code: refCode || undefined,
      },
    });

    setProtocolo(prot);
    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#1356E2]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-[#1356E2]" />
          </div>
          <h2 className="text-xl font-bold text-[#0A0A0A] mb-2">Questionário Enviado!</h2>
          <p className="text-[#0A0A0A]/70 text-sm mb-4">
            Agradecemos por preencher o questionário. Nossa equipe entrará em contato em breve com uma proposta personalizada.
          </p>
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-xs text-[#0A0A0A]/50">Seu protocolo</p>
            <p className="font-mono font-bold text-[#1356E2]">{protocolo}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="text-center mb-8">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/9bd38c4f7_Logo-modo-claro.png" 
          alt="Pin Bank" className="h-8 mx-auto mb-4" 
        />
        <h1 className="text-2xl font-bold text-[#0A0A0A]">Questionário Simplificado</h1>
        <p className="text-[#0A0A0A]/60 text-sm mt-1">Preencha as informações abaixo para receber uma proposta personalizada</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Seção 1: Dados da Empresa */}
        <Section icon={Building2} title="Dados da Empresa" color="purple">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome da Empresa *</Label>
              <Input placeholder="Razão Social ou Fantasia" value={formData.nome_empresa} onChange={(e) => updateField('nome_empresa', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>CNPJ *</Label>
              <Input placeholder="00.000.000/0000-00" value={formatCnpjInput(formData.cnpj)} onChange={(e) => updateField('cnpj', e.target.value.replace(/\D/g, ''))} required />
            </div>
          </div>
        </Section>

        {/* Seção 2: Dados do Respondente */}
        <Section icon={User} title="Dados do Respondente" color="blue">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input placeholder="Seu nome completo" value={formData.contato_nome} onChange={(e) => updateField('contato_nome', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>E-mail *</Label>
              <Input type="email" placeholder="seu@email.com" value={formData.contato_email} onChange={(e) => updateField('contato_email', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Telefone *</Label>
              <Input placeholder="(00) 00000-0000" value={formatPhoneInput(formData.contato_telefone)} onChange={(e) => updateField('contato_telefone', e.target.value.replace(/\D/g, ''))} required />
            </div>
            <div className="space-y-2">
              <Label>Cargo *</Label>
              <Input placeholder="Ex: Sócio, Gerente Financeiro" value={formData.contato_cargo} onChange={(e) => updateField('contato_cargo', e.target.value)} required />
            </div>
          </div>
        </Section>

        {/* Seção 3: Taxas de Crédito */}
        <Section icon={CreditCard} title="Taxas de Crédito Atuais (%)" color="green" subtitle="Informe as taxas que você paga hoje">
          <div className="space-y-6">
            <TaxasPorBandeiraInput label="Crédito 1x (À Vista)" fieldKey="taxas_credito_1x" formData={formData} setFormData={setFormData} />
            <TaxasPorBandeiraInput label="Crédito 2-6x" fieldKey="taxas_credito_2_6x" formData={formData} setFormData={setFormData} />
            <TaxasPorBandeiraInput label="Crédito 7-12x" fieldKey="taxas_credito_7_12x" formData={formData} setFormData={setFormData} />
          </div>
        </Section>

        {/* Seção 4: Antecipação */}
        <Section icon={Zap} title="Antecipação" color="amber">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Você utiliza antecipação?</Label>
                <p className="text-xs text-[#0A0A0A]/50">Se sim, preencha as taxas abaixo</p>
              </div>
              <Switch checked={formData.usa_antecipacao} onCheckedChange={(v) => updateField('usa_antecipacao', v)} />
            </div>
            {formData.usa_antecipacao && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label>% do TPV antecipado</Label>
                  <Input type="number" step="0.01" placeholder="Ex: 80" value={formData.percentual_antecipacao ?? ''} onChange={(e) => updateField('percentual_antecipacao', e.target.value === '' ? null : parseFloat(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label>Taxa de antecipação (% a.m.)</Label>
                  <Input type="number" step="0.01" placeholder="Ex: 1.99" value={formData.taxa_antecipacao ?? ''} onChange={(e) => updateField('taxa_antecipacao', e.target.value === '' ? null : parseFloat(e.target.value))} />
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* Seção 5: Distribuição de Pagamentos */}
        <Section icon={Percent} title="Distribuição de Pagamentos (%)" color="teal" subtitle="Mix de vendas por parcelamento">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>À Vista</Label>
              <Input type="number" step="0.01" placeholder="30" value={formData.distribuicao_avista ?? ''} onChange={(e) => updateField('distribuicao_avista', e.target.value === '' ? null : parseFloat(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>2-6x</Label>
              <Input type="number" step="0.01" placeholder="50" value={formData.distribuicao_2_6x ?? ''} onChange={(e) => updateField('distribuicao_2_6x', e.target.value === '' ? null : parseFloat(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>7-12x</Label>
              <Input type="number" step="0.01" placeholder="20" value={formData.distribuicao_7_12x ?? ''} onChange={(e) => updateField('distribuicao_7_12x', e.target.value === '' ? null : parseFloat(e.target.value))} />
            </div>
          </div>
        </Section>

        {/* Seção 6: Outras Taxas */}
        <Section icon={CreditCard} title="Outras Taxas" color="indigo" subtitle="PIX, Antifraude e Fees">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Taxa PIX</Label>
                <Select value={formData.pix_tipo} onValueChange={(v) => updateField('pix_tipo', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentual">Percentual (%)</SelectItem>
                    <SelectItem value="fixo">Valor Fixo (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor PIX ({formData.pix_tipo === 'percentual' ? '%' : 'R$'})</Label>
                <Input type="number" step="0.01" placeholder={formData.pix_tipo === 'percentual' ? 'Ex: 0.99' : 'Ex: 1.50'} value={formData.pix_valor ?? ''} onChange={(e) => updateField('pix_valor', e.target.value === '' ? null : parseFloat(e.target.value))} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Taxa Antifraude (em centavos)</Label>
              <Input type="number" step="1" placeholder="Ex: 7 (= R$ 0,07)" value={formData.taxa_antifraude_centavos ?? ''} onChange={(e) => updateField('taxa_antifraude_centavos', e.target.value === '' ? null : parseInt(e.target.value))} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Paga FEE fixo por transação?</Label>
                <p className="text-xs text-[#0A0A0A]/50">Custo fixo por transação processada</p>
              </div>
              <Switch checked={formData.usa_fee_transacao} onCheckedChange={(v) => updateField('usa_fee_transacao', v)} />
            </div>

            {formData.usa_fee_transacao && (
              <div className="space-y-2">
                <Label>Valor do FEE por transação (centavos)</Label>
                <Input type="number" step="1" placeholder="Ex: 10 (= R$ 0,10)" value={formData.fee_transacao_centavos ?? ''} onChange={(e) => updateField('fee_transacao_centavos', e.target.value === '' ? null : parseInt(e.target.value))} />
              </div>
            )}
          </div>
        </Section>

        {/* Security note */}
        <div className="flex items-center gap-2 text-xs text-[#0A0A0A]/50 justify-center">
          <Shield className="w-4 h-4" />
          <span>Seus dados estão protegidos e serão usados apenas para elaboração da proposta</span>
        </div>

        {/* Submit */}
        <Button type="submit" disabled={submitting} className="w-full h-12 bg-[#1356E2] hover:bg-[#1356E2]/90 text-white font-bold text-base">
          {submitting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
          ENVIAR QUESTIONÁRIO
        </Button>
      </form>
    </div>
  );
}

function Section({ icon: Icon, title, subtitle, color, children }) {
  const colors = {
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-[#1356E2]/10 text-[#1356E2]',
    amber: 'bg-amber-100 text-amber-600',
    teal: 'bg-teal-100 text-teal-600',
    indigo: 'bg-indigo-100 text-indigo-600',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-semibold text-[#0A0A0A]">{title}</h3>
          {subtitle && <p className="text-xs text-[#0A0A0A]/60">{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}