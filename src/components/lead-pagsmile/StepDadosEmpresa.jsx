import React from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle, AlertTriangle } from 'lucide-react';
import useCnpjAutocomplete, { formatCnpj } from '@/hooks/useCnpjAutocomplete';
import SiteValidationBadge from '../leads/SiteValidationBadge';

/** ETAPA 2 — Dados da Empresa (P2-P5) com Autocomplete CNPJ */
export default function StepDadosEmpresa({ form, updateField, cnpjData, setCnpjData, errors }) {
  const { isLoading, error, validationError, consultarCnpj } = useCnpjAutocomplete();

  const handleCnpjChange = async (e) => {
    const formatted = formatCnpj(e.target.value);
    updateField('cnpj', formatted);
    
    const digits = formatted.replace(/\D/g, '');
    if (digits.length === 14) {
      const result = await consultarCnpj(digits);
      if (result) {
        setCnpjData(result);
        // Auto-preencher campos
        if (result.razao_social) updateField('razaoSocial', result.razao_social);
        if (result.nome_fantasia) updateField('nomeFantasia', result.nome_fantasia);
        if (result.site_sugerido) updateField('presencaDigital', result.site_sugerido);
      }
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-bold text-[#002443]">Dados da Empresa</h2>
        <p className="text-xs text-[#002443]/50 mt-1">Autocomplete via CNPJ — 3 APIs cascata</p>
      </div>

      {/* P2 — CNPJ */}
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
        {validationError && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{validationError}</p>}
        {error && <p className="text-xs text-amber-600 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{error}</p>}
      </div>

      {/* P3 — Razão Social (auto, não-editável) */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-[#002443]">Razão Social *</label>
        <Input
          value={form.razaoSocial || ''}
          onChange={(e) => !cnpjData && updateField('razaoSocial', e.target.value)}
          readOnly={!!cnpjData}
          placeholder={cnpjData ? 'Preenchido automaticamente' : 'Razão Social da empresa'}
          className={`h-12 rounded-xl ${cnpjData ? 'bg-[#f4f4f4] text-[#002443] font-medium' : ''}`}
        />
        {cnpjData && <p className="text-[10px] text-[#2bc196]">✓ Preenchido via Receita Federal</p>}
      </div>

      {/* P4 — Nome Fantasia (auto, editável) */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-[#002443]">Nome Fantasia *</label>
        <Input
          value={form.nomeFantasia || ''}
          onChange={(e) => updateField('nomeFantasia', e.target.value)}
          placeholder="Nome Fantasia (editável)"
          className="h-12 rounded-xl"
        />
        {cnpjData && <p className="text-[10px] text-[#002443]/50">Preenchido pela RF. Você pode editar se estiver desatualizado.</p>}
      </div>

      {/* P5 — Presença Digital */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-[#002443]">Presença digital principal *</label>
        <Input
          value={form.presencaDigital || ''}
          onChange={(e) => updateField('presencaDigital', e.target.value)}
          placeholder="URL do site, @instagram, Google Meu Negócio, ou 'Não possuo'"
          className="h-12 rounded-xl"
        />
        {form.presencaDigital && form.presencaDigital !== 'Não possuo' && (
          <SiteValidationBadge siteUrl={form.presencaDigital} updateField={updateField} />
        )}
      </div>
    </div>
  );
}