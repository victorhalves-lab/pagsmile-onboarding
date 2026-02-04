import React from 'react';
import { Store } from 'lucide-react';
import FormSection from '../FormSection';
import FormField from '../FormField';
import SelectionButton from '../SelectionButton';
import YesNoQuestion from '../YesNoQuestion';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export default function Section7Marketplace({ formData, handleChange }) {
  const gatilhosOptions = [
    { id: 'aumento_volume', label: 'Aumento volume' },
    { id: 'aumento_reembolso', label: 'Aumento reembolso' },
    { id: 'reclamacoes', label: 'Reclamações' },
    { id: 'prod_fora_categoria', label: 'Prod. fora categoria' },
    { id: 'mudanca_titularidade', label: 'Mudança titularidade' },
    { id: 'outro', label: 'Outro' }
  ];

  const handleGatilhoChange = (gatilhoId, checked) => {
    const currentGatilhos = formData.mkt_gatilhos || [];
    if (checked) {
      handleChange('mkt_gatilhos', [...currentGatilhos, gatilhoId]);
    } else {
      handleChange('mkt_gatilhos', currentGatilhos.filter(g => g !== gatilhoId));
    }
  };

  return (
    <FormSection
      title="Marketplace e Sub-vendedores"
      subtitle="Detalhes sobre seu processo de onboarding e gestão de sub-vendedores."
      icon={Store}
    >
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">
          Sua empresa possui sub-vendedores ou opera como Marketplace?
        </Label>
        <SelectionButton
          options={[
            { value: true, label: 'Sim', description: 'Opera com sub-vendedores' },
            { value: false, label: 'Não', description: 'Não opera' }
          ]}
          value={formData.operaMarketplace}
          onChange={(value) => handleChange('operaMarketplace', value)}
          columns={2}
        />
      </div>

      {formData.operaMarketplace === true && (
        <div className="space-y-6">
          {/* MKT1: Onboarding */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
            <h4 className="font-semibold text-slate-800">MKT1. Onboarding de Sub-vendedores</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: 'mkt_kyc_interno', label: 'Realiza KYC/KYB interno?' },
                { key: 'mkt_kyc_terceiro', label: 'Terceiro realiza KYC/KYB?' },
                { key: 'mkt_coleta_cnpj', label: 'Coleta CNPJ/CPF?' },
                { key: 'mkt_coleta_contrato', label: 'Coleta contrato social?' },
                { key: 'mkt_coleta_endereco', label: 'Coleta endereço?' },
                { key: 'mkt_valida_cnae', label: 'Valida CNAE?' },
                { key: 'mkt_coleta_representante', label: 'Coleta representante?' },
                { key: 'mkt_coleta_ubo', label: 'Coleta UBO?' },
                { key: 'mkt_valida_conta', label: 'Valida conta bancária?' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-2 rounded bg-white border border-slate-100">
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <SelectionButton
                    options={[
                      { value: true, label: 'Sim' },
                      { value: false, label: 'Não' }
                    ]}
                    value={formData[item.key]}
                    onChange={(value) => handleChange(item.key, value)}
                    columns={2}
                    className="!gap-1"
                  />
                </div>
              ))}
            </div>

            <YesNoQuestion
              question="Controle por categoria (whitelist/blacklist)?"
              value={formData.mkt_controle_categoria}
              onChange={(value) => handleChange('mkt_controle_categoria', value)}
              detailValue={formData.mkt_controle_categoria_detalhe}
              onDetailChange={(value) => handleChange('mkt_controle_categoria_detalhe', value)}
              detailLabel="Como define categorias?"
              detailPlaceholder="Descreva como define as categorias permitidas/bloqueadas..."
              required
            />
          </div>

          {/* MKT2: Contrato e Governança */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
            <h4 className="font-semibold text-slate-800">MKT2. Contrato e Governança</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { key: 'mkt_contrato', label: 'Contrato com sub-vendedor?' },
                { key: 'mkt_exporta_base', label: 'Exporta base mensal?' },
                { key: 'mkt_politica_suspensao', label: 'Política de suspensão?' }
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between p-3 rounded bg-white border border-slate-100">
                  <span className="text-sm text-slate-700">{item.label}</span>
                  <SelectionButton
                    options={[
                      { value: true, label: 'Sim' },
                      { value: false, label: 'Não' }
                    ]}
                    value={formData[item.key]}
                    onChange={(value) => handleChange(item.key, value)}
                    columns={2}
                    className="!gap-1"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* MKT3: Monitoramento */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
            <h4 className="font-semibold text-slate-800">MKT3. Monitoramento</h4>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Gatilhos para revisão/bloqueio? <span className="text-red-500">*</span>
              </Label>
              <SelectionButton
                options={[
                  { value: true, label: 'Sim' },
                  { value: false, label: 'Não' }
                ]}
                value={formData.mkt_possui_gatilhos}
                onChange={(value) => handleChange('mkt_possui_gatilhos', value)}
                columns={2}
              />
            </div>

            {formData.mkt_possui_gatilhos === true && (
              <div className="p-3 rounded bg-white border border-slate-100">
                <Label className="text-sm text-slate-600 mb-3 block">Selecione os gatilhos:</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {gatilhosOptions.map(gatilho => (
                    <div key={gatilho.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={gatilho.id}
                        checked={(formData.mkt_gatilhos || []).includes(gatilho.id)}
                        onCheckedChange={(checked) => handleGatilhoChange(gatilho.id, checked)}
                      />
                      <Label htmlFor={gatilho.id} className="text-sm text-slate-700 cursor-pointer">
                        {gatilho.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">
                Limita qtd de sub-vendedores/mês? <span className="text-red-500">*</span>
              </Label>
              <SelectionButton
                options={[
                  { value: true, label: 'Sim' },
                  { value: false, label: 'Não' }
                ]}
                value={formData.mkt_limita_qtd}
                onChange={(value) => handleChange('mkt_limita_qtd', value)}
                columns={2}
              />
            </div>

            {formData.mkt_limita_qtd === true && (
              <FormField
                label="Quantidade Máxima"
                required
                type="number"
                value={formData.mkt_qtd_max}
                onChange={(value) => handleChange('mkt_qtd_max', value)}
                placeholder="Ex: 100"
              />
            )}
          </div>
        </div>
      )}
    </FormSection>
  );
}