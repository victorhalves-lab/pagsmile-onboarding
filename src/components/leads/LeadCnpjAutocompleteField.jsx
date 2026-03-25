import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertTriangle, Building2, XCircle, Lock } from 'lucide-react';
import useCnpjAutocomplete, { formatCnpj } from '@/hooks/useCnpjAutocomplete';

/**
 * Campo CNPJ com autocomplete para o questionário de Lead v2.0.
 * Ao digitar 14 dígitos, consulta a BrasilAPI e preenche automaticamente
 * os campos Razão Social, Nome Fantasia, Site e MCC sugerido.
 */
export default function LeadCnpjAutocompleteField({
  value,
  onChange,
  questionId,
  questions,
  formData,
  updateField,
  error: externalError
}) {
  const { data, isLoading, error, validationError, consultarCnpj, reset } = useCnpjAutocomplete();
  const [displayValue, setDisplayValue] = useState('');
  const [hasConsulted, setHasConsulted] = useState(false);

  useEffect(() => {
    if (value && !displayValue) {
      setDisplayValue(formatCnpj(value));
    }
  }, [value]);

  const handleChange = useCallback((e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 14);
    const formatted = formatCnpj(raw);
    setDisplayValue(formatted);
    updateField(questionId, raw);

    if (raw.length < 14 && hasConsulted) {
      reset();
      setHasConsulted(false);
    }

    if (raw.length === 14) {
      triggerConsulta(raw);
    }
  }, [questionId, updateField, hasConsulted, reset]);

  const triggerConsulta = useCallback(async (cnpj) => {
    const result = await consultarCnpj(cnpj);
    setHasConsulted(true);
    if (!result || !questions?.length) return;

    // Mapear campos da API para perguntas do Lead com base no texto
    questions.forEach(q => {
      const t = (q.text || '').toLowerCase().trim();
      
      if (t === 'razão social' && result.razao_social) {
        updateField(q.id, result.razao_social);
      } else if (t === 'nome fantasia' && result.nome_fantasia) {
        updateField(q.id, result.nome_fantasia);
      } else if ((t === 'site da empresa' || t === 'website') && result.site_sugerido) {
        updateField(q.id, result.site_sugerido);
      } else if ((t === 'código mcc' || t === 'mcc pretendido') && result.mcc_sugerido) {
        updateField(q.id, result.mcc_sugerido);
      } else if ((t.includes('faturamento anual') || t.includes('faixa de faturamento')) && result.faixa_faturamento_sugerida) {
        updateField(q.id, result.faixa_faturamento_sugerida);
      }
    });
  }, [consultarCnpj, questions, updateField]);

  const isActive = data?.situacao_cadastral === 2;
  const isInactive = data && data.situacao_cadastral !== 2;
  const hasError = !!externalError || !!validationError || !!error;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <Label className="text-sm font-semibold text-[var(--pagsmile-blue)]">
          CNPJ <span className="text-red-500 ml-1">*</span>
        </Label>
        {data && isActive && (
          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] gap-1">
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

      <p className="text-xs text-[var(--pagsmile-blue)]/60">
        Ao digitar os 14 dígitos, o sistema preencherá automaticamente a Razão Social, Nome Fantasia e outros campos.
      </p>

      <div className="relative">
        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/30" />
        <Input
          value={displayValue}
          onChange={handleChange}
          placeholder="XX.XXX.XXX/XXXX-XX"
          className={`h-12 rounded-xl pl-10 pr-10 font-mono text-base tracking-wide ${
            validationError || error || externalError ? 'border-red-400 ring-1 ring-red-300' :
            isActive ? 'border-emerald-400 ring-1 ring-emerald-200' :
            isInactive ? 'border-red-400 ring-1 ring-red-300' : ''
          }`}
          maxLength={18}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#2bc196]" />
        )}
        {data && isActive && !isLoading && (
          <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
        )}
        {(isInactive || error) && !isLoading && (
          <AlertTriangle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
        )}
      </div>

      {validationError && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> {validationError}
        </p>
      )}
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> {error}
        </p>
      )}
      {externalError && !validationError && !error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> {externalError}
        </p>
      )}

      {data && isActive && (
        <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1">
          <p className="text-xs font-semibold text-emerald-800">
            {data.razao_social}
          </p>
          {data.nome_fantasia && (
            <p className="text-xs text-emerald-700">
              Fantasia: {data.nome_fantasia}
            </p>
          )}
          <p className="text-xs text-emerald-600">
            {data.cnae_fiscal_descricao} • {data.porte === 'ME' ? 'Microempresa' : data.porte === 'EPP' ? 'Pequeno Porte' : 'Demais'}
          </p>
          {data.mcc_sugerido && (
            <p className="text-xs text-emerald-600">MCC sugerido: {data.mcc_sugerido}</p>
          )}
        </div>
      )}

      {isInactive && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-800 font-medium">
            CNPJ com situação "{data.descricao_situacao_cadastral}".
          </p>
          <p className="text-xs text-amber-600 mt-1">
            Você pode continuar, mas esteja ciente que a análise pode ser impactada.
          </p>
        </div>
      )}
    </div>
  );
}