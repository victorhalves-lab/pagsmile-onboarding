import React from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle } from 'lucide-react';
import useBdcCnpjEnrichment from '@/hooks/useBdcCnpjEnrichment';
import SiteValidationBadge from '../leads/SiteValidationBadge';
import { applyBdcAutofill } from './bdcAutofillMapper';

const formatCnpj = (val) => {
  const d = val.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
};

/** ETAPA 2 — Dados da Empresa com BDC Enrichment */
export default function StepDadosEmpresa({ form, updateField, cnpjData, setCnpjData, errors, setBdcData }) {
  const { isLoading, enrichCnpj, toLegacyCnpjData } = useBdcCnpjEnrichment();

  const handleCnpjChange = async (e) => {
    const formatted = formatCnpj(e.target.value);
    updateField('cnpj', formatted);
    
    const digits = formatted.replace(/\D/g, '');
    if (digits.length === 14) {
      const bdc = await enrichCnpj(digits, 'quick');
      // Considera o BDC "útil" apenas se trouxer razão social OU nome fantasia.
      // Resposta vazia (token expirado, dataset sem dados) → cai para BrasilAPI.
      const bdcUtil = !!(bdc?.autoFill?.razaoSocial || bdc?.autoFill?.nomeFantasia);
      if (bdcUtil) {
        const legacy = toLegacyCnpjData(bdc);
        if (legacy) {
          setCnpjData(legacy);
          if (legacy.razao_social) updateField('razaoSocial', legacy.razao_social);
          if (legacy.nome_fantasia) updateField('nomeFantasia', legacy.nome_fantasia);
          if (legacy.site_sugerido) updateField('presencaDigital', legacy.site_sugerido);
        }
        if (setBdcData) setBdcData(bdc);
        // Auto-fill address
        if (bdc.endereco) {
          updateField('enderecoCep', bdc.endereco.cep || '');
          updateField('enderecoLogradouro', bdc.endereco.logradouro || '');
          updateField('enderecoNumero', bdc.endereco.numero || '');
          updateField('enderecoComplemento', bdc.endereco.complemento || '');
          updateField('enderecoBairro', bdc.endereco.bairro || '');
          updateField('enderecoMunicipio', bdc.endereco.municipio || '');
          updateField('enderecoUf', bdc.endereco.uf || '');
          updateField('_enderecoConfirmado', true);
        }
        // Auto-fill contato (email/phone) + volumetria (faturamento/funcionários) + plataforma
        // via mapper central. Só preenche campos que estão vazios — nunca sobrescreve o cliente.
        const autofilled = applyBdcAutofill(bdc, form, updateField);
        if (Object.keys(autofilled).length > 0) {
          updateField('_bdcAutofilled', { ...(form._bdcAutofilled || {}), ...autofilled });
        }
      } else {
        // Fallback to Brasil API (também ativado quando BDC retorna vazio/expirado)
        try {
          const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, { signal: AbortSignal.timeout(5000) });
          if (resp.ok) {
            const data = await resp.json();
            const legacy = {
              razao_social: data.razao_social, nome_fantasia: data.nome_fantasia,
              capital_social: data.capital_social, porte: data.porte,
              data_inicio_atividade: data.data_inicio_atividade,
              situacao_cadastral: data.descricao_situacao_cadastral,
              cnae_fiscal: String(data.cnae_fiscal),
              endereco: data.cep ? {
                cep: data.cep, logradouro: data.logradouro, numero: data.numero,
                complemento: data.complemento, bairro: data.bairro,
                municipio: data.municipio, uf: data.uf,
              } : null,
            };
            if (legacy.razao_social || legacy.nome_fantasia) {
              setCnpjData(legacy);
              if (legacy.razao_social) updateField('razaoSocial', legacy.razao_social);
              if (legacy.nome_fantasia) updateField('nomeFantasia', legacy.nome_fantasia);
              // Auto-fill address from BrasilAPI as well
              if (legacy.endereco) {
                updateField('enderecoCep', legacy.endereco.cep || '');
                updateField('enderecoLogradouro', legacy.endereco.logradouro || '');
                updateField('enderecoNumero', legacy.endereco.numero || '');
                updateField('enderecoComplemento', legacy.endereco.complemento || '');
                updateField('enderecoBairro', legacy.endereco.bairro || '');
                updateField('enderecoMunicipio', legacy.endereco.municipio || '');
                updateField('enderecoUf', legacy.endereco.uf || '');
              }
            }
          }
        } catch { /* silent — cliente preenche manualmente */ }
      }
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#0A0A0A]">Dados da Empresa</h2>
      </div>

      {/* CNPJ */}
      <div className="space-y-1" data-field="cnpj">
        <label className="text-sm font-semibold text-[#0A0A0A]">CNPJ *</label>
        <div className="relative">
          <Input
            value={form.cnpj || ''}
            onChange={handleCnpjChange}
            placeholder="00.000.000/0001-00"
            className={`h-12 rounded-xl font-mono ${errors?.cnpj ? 'border-red-400' : ''}`}
            maxLength={18}
          />
          {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#1356E2]" />}
          {cnpjData && !isLoading && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />}
        </div>
        {errors?.cnpj && <p className="text-xs text-red-500">CNPJ inválido — confira os dígitos</p>}
      </div>

      {/* Razão Social — sempre editável pelo cliente, mesmo após enriquecimento */}
      <div className="space-y-1" data-field="razaoSocial">
        <label className="text-sm font-semibold text-[#0A0A0A]">Razão Social *</label>
        <Input
          value={form.razaoSocial || ''}
          onChange={(e) => updateField('razaoSocial', e.target.value)}
          placeholder="Razão Social"
          className={`h-12 rounded-xl ${errors?.razaoSocial ? 'border-red-400' : ''}`}
        />
        {errors?.razaoSocial && <p className="text-xs text-red-500">Razão Social é obrigatória</p>}
      </div>

      {/* Nome Fantasia */}
      <div className="space-y-1" data-field="nomeFantasia">
        <label className="text-sm font-semibold text-[#0A0A0A]">Nome Fantasia *</label>
        <Input value={form.nomeFantasia || ''} onChange={(e) => updateField('nomeFantasia', e.target.value)} placeholder="Nome Fantasia (editável)" className={`h-12 rounded-xl ${errors?.nomeFantasia ? 'border-red-400' : ''}`} />
        {errors?.nomeFantasia && <p className="text-xs text-red-500">Campo obrigatório</p>}
      </div>

      {/* Presença Digital */}
      <div className="space-y-1" data-field="presencaDigital">
        <label className="text-sm font-semibold text-[#0A0A0A]">Presença digital principal *</label>
        <Input value={form.presencaDigital || ''} onChange={(e) => updateField('presencaDigital', e.target.value)} placeholder="URL do site, @instagram, ou 'Não possuo'" className={`h-12 rounded-xl ${errors?.presencaDigital ? 'border-red-400' : ''}`} />
        {errors?.presencaDigital && <p className="text-xs text-red-500">Informe site, @rede social ou "Não possuo"</p>}
        {form.presencaDigital && form.presencaDigital !== 'Não possuo' && (
          <SiteValidationBadge siteUrl={form.presencaDigital} updateField={updateField} />
        )}
      </div>
    </div>
  );
}