import React from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, AlertTriangle, Shield, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import useBdcCnpjEnrichment from '@/hooks/useBdcCnpjEnrichment';
import SiteValidationBadge from '../leads/SiteValidationBadge';

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
  const { isLoading, error, enrichCnpj, toLegacyCnpjData } = useBdcCnpjEnrichment();

  const handleCnpjChange = async (e) => {
    const formatted = formatCnpj(e.target.value);
    updateField('cnpj', formatted);
    
    const digits = formatted.replace(/\D/g, '');
    if (digits.length === 14) {
      const bdc = await enrichCnpj(digits, 'quick');
      if (bdc) {
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
      } else {
        // Fallback to Brasil API
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
            setCnpjData(legacy);
            if (legacy.razao_social) updateField('razaoSocial', legacy.razao_social);
            if (legacy.nome_fantasia) updateField('nomeFantasia', legacy.nome_fantasia);
          }
        } catch { /* silent */ }
      }
    }
  };

  const ai = form._bdcQuickData?.activityIndicators;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#002443]">Dados da Empresa</h2>
        <p className="text-xs text-[#002443]/50 mt-1">Autocomplete via Big Data Corp + fallback Brasil API</p>
      </div>

      {/* CNPJ */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-[#002443]">CNPJ *</label>
        <div className="relative">
          <Input
            value={form.cnpj || ''}
            onChange={handleCnpjChange}
            placeholder="00.000.000/0001-00"
            className={`h-12 rounded-xl font-mono ${errors?.cnpj ? 'border-red-400' : ''}`}
            maxLength={18}
          />
          {isLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#2bc196]" />}
          {cnpjData && !isLoading && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />}
        </div>
        {errors?.cnpj && <p className="text-xs text-red-500">CNPJ válido é obrigatório</p>}
        {error && <p className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{error}</p>}
      </div>

      {/* BDC Activity Banner */}
      {ai && (
        <div className="p-3 rounded-xl bg-[#002443]/5 border border-[#002443]/10 flex items-center gap-3 flex-wrap">
          <Shield className="w-4 h-4 text-[#002443]/40 shrink-0" />
          <span className="text-[10px] font-bold text-[#002443]/50 uppercase">BDC Verified</span>
          {ai.activityLevel != null && (
            <Badge variant="outline" className={`text-[10px] ${ai.activityLevel >= 0.3 ? 'border-emerald-300 text-emerald-700' : 'border-red-300 text-red-700'}`}>
              Atividade: {(ai.activityLevel * 100).toFixed(0)}%
            </Badge>
          )}
          {ai.employeesRange && <Badge variant="outline" className="text-[10px]"><Building2 className="w-3 h-3 mr-1" />{ai.employeesRange}</Badge>}
          {ai.shellCompanyLikelihood != null && ai.shellCompanyLikelihood > 0.3 && (
            <Badge className="text-[10px] bg-red-100 text-red-700">⚠ Shell: {(ai.shellCompanyLikelihood * 100).toFixed(0)}%</Badge>
          )}
        </div>
      )}

      {/* Razão Social */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-[#002443]">Razão Social *</label>
        <Input value={form.razaoSocial || ''} onChange={(e) => !cnpjData && updateField('razaoSocial', e.target.value)} readOnly={!!cnpjData} placeholder={cnpjData ? 'Preenchido automaticamente' : 'Razão Social'} className={`h-12 rounded-xl ${cnpjData ? 'bg-[#f4f4f4] font-medium' : ''}`} />
        {cnpjData && <p className="text-[10px] text-[#2bc196]">✓ Preenchido via BDC</p>}
      </div>

      {/* Nome Fantasia */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-[#002443]">Nome Fantasia *</label>
        <Input value={form.nomeFantasia || ''} onChange={(e) => updateField('nomeFantasia', e.target.value)} placeholder="Nome Fantasia (editável)" className={`h-12 rounded-xl ${errors?.nomeFantasia ? 'border-red-400' : ''}`} />
        {errors?.nomeFantasia && <p className="text-xs text-red-500">Campo obrigatório</p>}
      </div>

      {/* Presença Digital */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-[#002443]">Presença digital principal *</label>
        <Input value={form.presencaDigital || ''} onChange={(e) => updateField('presencaDigital', e.target.value)} placeholder="URL do site, @instagram, ou 'Não possuo'" className="h-12 rounded-xl" />
        {form.presencaDigital && form.presencaDigital !== 'Não possuo' && (
          <SiteValidationBadge siteUrl={form.presencaDigital} updateField={updateField} />
        )}
      </div>
    </div>
  );
}