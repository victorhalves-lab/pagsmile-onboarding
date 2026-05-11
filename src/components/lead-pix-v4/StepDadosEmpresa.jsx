import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, AlertTriangle, Shield, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import useBdcCnpjEnrichment from '@/hooks/useBdcCnpjEnrichment';
import SiteValidationBadge from '@/components/leads/SiteValidationBadge';

const formatCnpj = (val) => {
  const d = val.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`;
};

export default function StepDadosEmpresa({ form, updateField, cnpjData, setCnpjData, errors, setBdcData }) {
  const { isLoading, error, enrichCnpj, toLegacyCnpjData } = useBdcCnpjEnrichment();

  const handleCnpjChange = async (e) => {
    const formatted = formatCnpj(e.target.value);
    updateField('cnpj', formatted);

    const digits = formatted.replace(/\D/g, '');
    if (digits.length === 14) {
      const bdc = await enrichCnpj(digits, 'quick');
      if (bdc) {
        // Set legacy cnpjData for compatibility
        const legacy = toLegacyCnpjData(bdc);
        if (legacy) {
          setCnpjData(legacy);
          if (legacy.razao_social) updateField('razaoSocial', legacy.razao_social);
          if (legacy.nome_fantasia) updateField('nomeFantasia', legacy.nome_fantasia);
          if (legacy.site_sugerido) updateField('presencaDigital', legacy.site_sugerido);
        }
        // Set BDC-specific data for enriched scoring
        if (setBdcData) setBdcData(bdc);
        // Auto-fill address into form
        if (bdc.endereco) {
          updateField('enderecoCep', bdc.endereco.cep || '');
          updateField('enderecoLogradouro', bdc.endereco.logradouro || '');
          updateField('enderecoNumero', bdc.endereco.numero || '');
          updateField('enderecoComplemento', bdc.endereco.complemento || '');
          updateField('enderecoBairro', bdc.endereco.bairro || '');
          updateField('enderecoMunicipio', bdc.endereco.municipio || '');
          updateField('enderecoUf', bdc.endereco.uf || '');
        }
      } else {
        // BDC failed — fallback to Brasil API
        try {
          const resp = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, { signal: AbortSignal.timeout(5000) });
          if (resp.ok) {
            const data = await resp.json();
            const legacy = {
              razao_social: data.razao_social,
              nome_fantasia: data.nome_fantasia,
              capital_social: data.capital_social,
              porte: data.porte,
              data_inicio_atividade: data.data_inicio_atividade,
              situacao_cadastral: data.descricao_situacao_cadastral,
              cnae_fiscal: String(data.cnae_fiscal),
            };
            setCnpjData(legacy);
            if (legacy.razao_social) updateField('razaoSocial', legacy.razao_social);
            if (legacy.nome_fantasia) updateField('nomeFantasia', legacy.nome_fantasia);
          }
        } catch { /* silent fallback failure */ }
      }
    }
  };

  const ai = form._bdcQuickData?.activityIndicators;

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold text-[#002443]">Dados da Empresa</h2>
      <p className="text-xs text-[#002443]/50">Digite o CNPJ para preenchimento automático via Big Data Corp.</p>

      {/* CNPJ */}
      <div className="space-y-1">
        <Label className="text-sm font-semibold">CNPJ *</Label>
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
          {ai.employeesRange && (
            <Badge variant="outline" className="text-[10px]">
              <Building2 className="w-3 h-3 mr-1" />{ai.employeesRange}
            </Badge>
          )}
          {ai.shellCompanyLikelihood != null && ai.shellCompanyLikelihood > 0.3 && (
            <Badge className="text-[10px] bg-red-100 text-red-700">
              ⚠ Shell: {(ai.shellCompanyLikelihood * 100).toFixed(0)}%
            </Badge>
          )}
        </div>
      )}

      {/* Razão Social — sempre editável, mesmo após enriquecimento */}
      <div className="space-y-1">
        <Label className="text-sm font-semibold">Razão Social *</Label>
        <Input
          value={form.razaoSocial || ''}
          onChange={(e) => updateField('razaoSocial', e.target.value)}
          placeholder="Razão Social da empresa"
          className="h-12 rounded-xl"
        />
      </div>

      {/* Nome Fantasia */}
      <div className="space-y-1">
        <Label className="text-sm font-semibold">Nome Fantasia *</Label>
        <Input
          value={form.nomeFantasia || ''}
          onChange={(e) => updateField('nomeFantasia', e.target.value)}
          placeholder="Nome Fantasia (editável)"
          className={`h-12 rounded-xl ${errors?.nomeFantasia ? 'border-red-400' : ''}`}
        />
        {errors?.nomeFantasia && <p className="text-xs text-red-500">Campo obrigatório</p>}
        <p className="text-[10px] text-[#002443]/40 mt-0.5">Nome que aparece para quem paga via PIX</p>
      </div>

      {/* Presença Digital */}
      <div className="space-y-1">
        <Label className="text-sm font-semibold">Presença Digital (site, Instagram, etc.)</Label>
        <div className="flex gap-2 items-center">
          <Input
            value={form.presencaDigital || ''}
            onChange={e => updateField('presencaDigital', e.target.value)}
            placeholder="https://... ou @instagram ou 'Não possuo'"
            className="text-xs flex-1 h-12 rounded-xl"
          />
          {form.presencaDigital && form.presencaDigital !== 'Não possuo' && (
            <SiteValidationBadge url={form.presencaDigital} />
          )}
        </div>
      </div>
    </div>
  );
}