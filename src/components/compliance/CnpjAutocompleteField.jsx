import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertTriangle, Building2, XCircle } from 'lucide-react';
import useCnpjAutocomplete, { formatCnpj } from '@/hooks/useCnpjAutocomplete';
import { base44 } from '@/api/base44Client';
import CnpjEnrichmentPanel from './CnpjEnrichmentPanel';

export default function CnpjAutocompleteField({
  value,
  onChange,
  onAutocompleteData,
  questionId,
  isRequired = true,
  blockOnInactive = true, // true para compliance, false para lead
  label = 'CNPJ',
  helpText,
  isPublicView = false, // true = esconde painel de enriquecimento para o cliente
  hasBranding = false
}) {
  const { data, isLoading, error, validationError, consultarCnpj, reset } = useCnpjAutocomplete();
  const [displayValue, setDisplayValue] = useState('');
  const [hasConsulted, setHasConsulted] = useState(false);
  const [enrichmentResult, setEnrichmentResult] = useState(null);
  const [enrichmentLoading, setEnrichmentLoading] = useState(false);

  // Sincronizar valor externo e auto-disparar consulta se pré-preenchido
  useEffect(() => {
    if (value && !displayValue) {
      const raw = value.replace(/\D/g, '');
      setDisplayValue(formatCnpj(raw));
      // Auto-disparar consulta se CNPJ completo veio pré-preenchido (ex: do Lead)
      if (raw.length === 14 && !hasConsulted && !data) {
        triggerConsulta(raw);
      }
    }
  }, [value]);

  const handleChange = useCallback((e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 14);
    const formatted = formatCnpj(raw);
    setDisplayValue(formatted);
    onChange(questionId, raw);

    // Reset se o CNPJ mudou
    if (raw.length < 14 && hasConsulted) {
      reset();
      setHasConsulted(false);
      setEnrichmentResult(null);
    }

    // Auto-trigger quando 14 dígitos
    if (raw.length === 14) {
      triggerConsulta(raw);
    }
  }, [questionId, onChange, hasConsulted, reset]);

  const triggerConsulta = useCallback(async (cnpj) => {
    const result = await consultarCnpj(cnpj);
    setHasConsulted(true);
    if (result && onAutocompleteData) {
      onAutocompleteData(result);
    }
    // Disparar análise de enriquecimento automaticamente
    if (result && result.situacao_cadastral === 2) {
      setEnrichmentLoading(true);
      setEnrichmentResult(null);
      try {
        const enrichRes = await base44.functions.invoke('analyzeCnpjEnrichment', {
          cnpjDataArray: { ...result, cnpj },
        });
        setEnrichmentResult(enrichRes.data);
      } catch (e) {
        console.warn('Enrichment analysis failed:', e.message);
      }
      setEnrichmentLoading(false);
    }
  }, [consultarCnpj, onAutocompleteData]);

  const isActive = data?.situacao_cadastral === 2;
  const isInactive = data && data.situacao_cadastral !== 2;
  const showBlock = blockOnInactive && isInactive;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Label className="text-sm font-semibold text-[#002443]">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </Label>
        {data && isActive && (
          <Badge className="brand-badge-receita bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] gap-1">
            <CheckCircle className="w-3 h-3" />
            Receita Federal
          </Badge>
        )}
        {isInactive && (
          <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] gap-1">
            <XCircle className="w-3 h-3" />
            {data.descricao_situacao_cadastral}
          </Badge>
        )}
      </div>
      
      {helpText && (
        <p className="text-xs text-[#002443]/60">{helpText}</p>
      )}

      <div className="relative">
        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/30" />
        <Input
          value={displayValue}
          onChange={handleChange}
          placeholder="XX.XXX.XXX/XXXX-XX"
          className={`h-12 rounded-xl pl-10 pr-10 font-mono text-base tracking-wide ${
            validationError || error ? 'border-red-400 ring-1 ring-red-300' : 
            isActive ? 'brand-input-valid border-emerald-400 ring-1 ring-emerald-200' : 
            showBlock ? 'border-red-400 ring-1 ring-red-300' : ''
          }`}
          maxLength={18}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin brand-loading-spinner text-[#2bc196]" />
        )}
        {data && isActive && !isLoading && (
          <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 brand-icon-valid text-emerald-500" />
        )}
        {(isInactive || error) && !isLoading && (
          <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
        )}
      </div>

      {/* Erros */}
      {validationError && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {validationError}
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {error}
        </p>
      )}

      {/* Bloqueio para CNPJ inativo (compliance) */}
      {showBlock && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-800 font-medium">
            Este CNPJ está com situação "{data.descricao_situacao_cadastral}" na Receita Federal.
          </p>
          <p className="text-xs text-red-600 mt-1">
            Apenas empresas com situação ATIVA podem ser cadastradas. Verifique o número ou entre em contato conosco.
          </p>
        </div>
      )}

      {/* Dados básicos do CNPJ (sempre visível — autocomplete) */}
      {data && isActive && (
        <div className="p-3 brand-cnpj-summary bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1">
          <p className="text-xs font-semibold brand-cnpj-summary-title text-emerald-800">
            {data.razao_social}
          </p>
          {data.nome_fantasia && (
            <p className="text-xs brand-cnpj-summary-desc text-emerald-700">
              Fantasia: {data.nome_fantasia}
            </p>
          )}
          <p className="text-xs brand-cnpj-summary-desc text-emerald-600">
            {data.cnae_fiscal_descricao} • {data.porte === 'ME' ? 'Microempresa' : data.porte === 'EPP' ? 'Pequeno Porte' : 'Demais'}
          </p>
        </div>
      )}

      {/* Painel de análise de enriquecimento — SOMENTE para uso interno (escondido para clientes) */}
      {!isPublicView && (
        <CnpjEnrichmentPanel 
          enrichmentResult={enrichmentResult} 
          isLoading={enrichmentLoading} 
        />
      )}
    </div>
  );
}