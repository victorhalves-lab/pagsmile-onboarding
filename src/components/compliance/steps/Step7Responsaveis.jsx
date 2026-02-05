import React from 'react';
import { UserCircle, Phone, Mail, MessageSquare, Star, ShieldCheck, Calculator, Headphones } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';
import SelectionButton from '../SelectionButton';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';

export default function Step7Responsaveis({ formData, handleChange }) {
  
  const handleCanalChange = (canalId, checked) => {
    const currentCanais = formData.canaisAtendimento || [];
    if (checked) {
      handleChange('canaisAtendimento', [...currentCanais, canalId]);
    } else {
      handleChange('canaisAtendimento', currentCanais.filter(c => c !== canalId));
    }
  };

  const canaisOptions = [
    { id: 'email', label: 'E-mail' },
    { id: 'telefone', label: 'Telefone' },
    { id: 'chat', label: 'Chat Online' },
    { id: 'whatsapp', label: 'WhatsApp' },
    { id: 'ouvidoria', label: 'Ouvidoria' },
    { id: 'redes_sociais', label: 'Redes Sociais' }
  ];

  return (
    <div className="space-y-8">
      <FormSection
        title="Responsáveis e Contatos"
        subtitle="Dados dos responsáveis operacionais e técnicos da empresa."
        icon={UserCircle}
      >
        {/* Representante Legal (Já existente, mantido como principal) */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <UserCircle className="w-5 h-5 text-[var(--pagsmile-blue)]" />
            <h3 className="font-bold text-slate-800">Representante Legal (Principal)</h3>
          </div>
          
          <FormField
            label="Nome Completo"
            required
            value={formData.responsavelNome}
            onChange={(value) => handleChange('responsavelNome', value)}
            placeholder="Nome completo do representante"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="CPF"
              required
              value={formData.responsavelCPF}
              onChange={(value) => handleChange('responsavelCPF', value)}
              placeholder="000.000.000-00"
            />
            <FormField
              label="Telefone Celular"
              required
              value={formData.responsavelTelefone}
              onChange={(value) => handleChange('responsavelTelefone', value)}
              placeholder="(00) 00000-0000"
            />
          </div>
          <FormField
            label="E-mail"
            required
            type="email"
            value={formData.responsavelEmail}
            onChange={(value) => handleChange('responsavelEmail', value)}
            placeholder="email@empresa.com"
          />
        </div>

        {/* Contábil / Financeiro */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="w-5 h-5 text-[var(--pagsmile-blue)]" />
            <h3 className="font-bold text-slate-800">Responsável Contábil / Financeiro</h3>
          </div>
          
          <FormField
            label="Nome Completo"
            required
            value={formData.financeiroNome}
            onChange={(value) => handleChange('financeiroNome', value)}
            placeholder="Nome do responsável"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="E-mail"
              required
              type="email"
              value={formData.financeiroEmail}
              onChange={(value) => handleChange('financeiroEmail', value)}
              placeholder="financeiro@empresa.com"
            />
            <FormField
              label="Telefone"
              required
              value={formData.financeiroTelefone}
              onChange={(value) => handleChange('financeiroTelefone', value)}
              placeholder="(00) 00000-0000"
            />
          </div>
          
          <FormField
            label="CRC (Conselho Regional de Contabilidade)"
            value={formData.financeiroCRC}
            onChange={(value) => handleChange('financeiroCRC', value)}
            placeholder="Opcional se interno, obrigatório se terceirizado"
          />
        </div>

        {/* Compliance */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-[var(--pagsmile-blue)]" />
            <h3 className="font-bold text-slate-800">Responsável pelo Compliance / PLD</h3>
          </div>
          
          <FormField
            label="Nome Completo"
            required
            value={formData.complianceNome}
            onChange={(value) => handleChange('complianceNome', value)}
            placeholder="Nome do responsável pelo Compliance"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label="CPF"
              required
              value={formData.complianceCPF}
              onChange={(value) => handleChange('complianceCPF', value)}
              placeholder="000.000.000-00"
            />
            <FormField
              label="E-mail"
              required
              type="email"
              value={formData.complianceEmail}
              onChange={(value) => handleChange('complianceEmail', value)}
              placeholder="compliance@empresa.com"
            />
            <FormField
              label="Telefone"
              required
              value={formData.complianceTelefone}
              onChange={(value) => handleChange('complianceTelefone', value)}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>

        {/* SAC */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 mb-4">
            <Headphones className="w-5 h-5 text-[var(--pagsmile-blue)]" />
            <h3 className="font-bold text-slate-800">Responsável pelo SAC (Atendimento)</h3>
          </div>
          
          <FormField
            label="Nome Completo"
            required
            value={formData.sacNome}
            onChange={(value) => handleChange('sacNome', value)}
            placeholder="Nome do responsável pelo SAC"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="E-mail"
              required
              type="email"
              value={formData.sacEmail}
              onChange={(value) => handleChange('sacEmail', value)}
              placeholder="sac@empresa.com"
            />
            <FormField
              label="Telefone"
              required
              value={formData.sacTelefone}
              onChange={(value) => handleChange('sacTelefone', value)}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>
      </FormSection>

      {/* Canais de Atendimento e Reputação */}
      <FormSection
        title="Canais de Atendimento e Reputação"
        subtitle="Como seus clientes entram em contato e sua reputação online."
        icon={MessageSquare}
      >
        <div className="space-y-3">
          <Label className="text-sm font-medium text-slate-700">Quais canais de atendimento sua empresa oferece? <span className="text-red-500">*</span></Label>
          <SelectionButton
            options={canaisOptions.map(c => ({ value: c.id, label: c.label }))}
            value={formData.canaisAtendimento || []}
            onChange={(val) => handleChange('canaisAtendimento', val)}
            isMulti={true}
            columns={3}
          />
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <h3 className="font-bold text-slate-800">Reputação Online</h3>
          </div>
          
          <div className="space-y-2">
             <Label className="text-sm font-medium text-slate-700">Possui página no Reclame Aqui? <span className="text-red-500">*</span></Label>
             <SelectionButton
                options={[
                  { value: true, label: 'Sim' },
                  { value: false, label: 'Não' }
                ]}
                value={formData.possuiReclameAqui}
                onChange={(value) => handleChange('possuiReclameAqui', value)}
                columns={2}
              />
          </div>

          {formData.possuiReclameAqui === true && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-2">
              <div className="md:col-span-2">
                <FormField
                  label="Link da Página no Reclame Aqui"
                  value={formData.linkReclameAqui}
                  onChange={(value) => handleChange('linkReclameAqui', value)}
                  placeholder="https://www.reclameaqui.com.br/empresa/..."
                />
              </div>
              <div className="md:col-span-1">
                <FormField
                  label="Nota Atual (0-10)"
                  type="number"
                  value={formData.notaReclameAqui}
                  onChange={(value) => handleChange('notaReclameAqui', value)}
                  placeholder="Ex: 8.5"
                />
              </div>
            </div>
          )}
        </div>
      </FormSection>
    </div>
  );
}