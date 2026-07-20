import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { HelpCircle, AlertCircle, CheckCircle } from 'lucide-react';

// Pergunta principal de tipos de produto/serviço
const PRODUCT_TYPE_QUESTION_ID = '69a5cd07afab70a7ca2184d8';

export { PRODUCT_TYPE_QUESTION_ID };

export default function ProductTypePercentages({ formData, updateField, error }) {
  const selectedTypes = formData[PRODUCT_TYPE_QUESTION_ID];
  
  if (!Array.isArray(selectedTypes) || selectedTypes.length === 0) return null;

  // Chave para armazenar percentuais: _product_percentages = { "Produtos Físicos...": 40, "Infoprodutos...": 60 }
  const percentages = formData._product_percentages || {};
  const total = selectedTypes.reduce((sum, type) => sum + (parseFloat(percentages[type]) || 0), 0);
  const isValid = Math.abs(total - 100) < 0.01;

  const handleChange = (type, value) => {
    const newPercentages = { ...percentages, [type]: value };
    updateField('_product_percentages', newPercentages);
  };

  // Extrair nome curto da opção (antes do parêntese)
  const shortName = (opt) => {
    const idx = opt.indexOf('(');
    return idx > 0 ? opt.substring(0, idx).trim() : opt;
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-semibold text-[var(--pinbank-blue)]">
          Qual o percentual de faturamento de cada tipo selecionado? <span className="text-red-500">*</span>
        </Label>
        <p className="text-xs text-[var(--pinbank-blue)]/60 flex items-center gap-1 mt-1">
          <HelpCircle className="w-3 h-3" />
          A soma de todos os percentuais deve ser exatamente 100%.
        </p>
      </div>

      <div className="space-y-3">
        {selectedTypes.map((type) => (
          <div key={type} className="flex items-center gap-3">
            <span className="text-sm font-medium text-[var(--pinbank-blue)] min-w-[180px] flex-shrink-0 truncate" title={type}>
              {shortName(type)}
            </span>
            <div className="relative flex-1 max-w-[140px]">
              <Input
                type="number"
                min="0"
                max="100"
                step="1"
                value={percentages[type] ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || (parseFloat(val) >= 0 && parseFloat(val) <= 100)) {
                    handleChange(type, val);
                  }
                }}
                placeholder="0"
                className="h-10 rounded-xl pr-8 text-right"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--pinbank-blue)]/60 font-semibold text-sm">%</span>
            </div>
          </div>
        ))}
      </div>

      {/* Erro de validação */}
      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-500 px-1">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Indicador de soma */}
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium ${
        total === 0
          ? 'bg-slate-50 border-slate-200 text-[var(--pinbank-blue)]/50'
          : isValid
          ? 'bg-[#1356E2]/5 border-[#1356E2]/20 text-[#1356E2]'
          : 'bg-red-50 border-red-200 text-red-600'
      }`}>
        {isValid ? (
          <CheckCircle className="w-4 h-4 shrink-0" />
        ) : (
          <AlertCircle className="w-4 h-4 shrink-0" />
        )}
        <span>
          Total: {total.toFixed(0)}%
          {!isValid && total > 0 && ` — ${total > 100 ? 'excede' : 'faltam'} ${Math.abs(100 - total).toFixed(0)}%`}
        </span>
      </div>
    </div>
  );
}