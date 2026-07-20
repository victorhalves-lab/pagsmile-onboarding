import React from 'react';
import { Input } from '@/components/ui/input';
import { Users, Info } from 'lucide-react';

const TOTAL_SLOTS = 5;
const REQUIRED_SLOTS = 3;

function formatCnpj(value) {
  const d = String(value || '').replace(/\D/g, '').slice(0, 14);
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

/**
 * Coleta 3 a 5 sellers principais que rodarão com o cliente (gateway/marketplace).
 * Salva em form.principaisSellers como array [{ nome, cnpj }].
 */
export default function PrincipaisSellersInput({ form, updateField, errors }) {
  const sellers = Array.isArray(form.principaisSellers) && form.principaisSellers.length
    ? form.principaisSellers
    : Array.from({ length: TOTAL_SLOTS }, () => ({ nome: '', cnpj: '' }));

  // Garantir 5 slots
  const slots = [...sellers];
  while (slots.length < TOTAL_SLOTS) slots.push({ nome: '', cnpj: '' });

  const updateSlot = (idx, field, value) => {
    const next = slots.map((s, i) => (i === idx ? { ...s, [field]: value } : s));
    updateField('principaisSellers', next);
  };

  return (
    <div className="space-y-3" data-field="principaisSellers">
      <div className="flex items-start gap-2">
        <div className="w-8 h-8 rounded-lg bg-[#1356E2]/10 flex items-center justify-center flex-shrink-0">
          <Users className="w-4 h-4 text-[#1356E2]" />
        </div>
        <div className="flex-1">
          <label className="text-sm font-semibold text-[#0A0A0A] block">
            Principais sellers que vão rodar com vocês *
          </label>
          <p className="text-xs text-[#0A0A0A]/60 mt-0.5 flex items-start gap-1">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            <span>
              Informe de <strong>3 a 5 sellers</strong> (lojas/empresas) que estarão na operação.
              Apenas nome e CNPJ — nos ajuda a dimensionar volumes e compliance.
            </span>
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {slots.map((slot, idx) => {
          const isRequired = idx < REQUIRED_SLOTS;
          return (
            <div key={idx} className="grid grid-cols-[28px_1fr_180px] gap-2 items-center">
              <div className="text-xs font-bold text-[#0A0A0A]/40 tabular-nums">
                #{idx + 1}
                {isRequired && <span className="text-red-500 ml-0.5">*</span>}
              </div>
              <Input
                value={slot.nome || ''}
                onChange={(e) => updateSlot(idx, 'nome', e.target.value)}
                placeholder={isRequired ? `Nome do seller ${idx + 1} *` : `Nome do seller ${idx + 1} (opcional)`}
                className="h-10"
              />
              <Input
                value={formatCnpj(slot.cnpj || '')}
                onChange={(e) => updateSlot(idx, 'cnpj', e.target.value.replace(/\D/g, '').slice(0, 14))}
                placeholder="CNPJ"
                inputMode="numeric"
                className="h-10 font-mono text-xs"
              />
            </div>
          );
        })}
      </div>

      {errors?.principaisSellers && (
        <p className="text-xs text-red-500">
          Preencha pelo menos {REQUIRED_SLOTS} sellers com nome e CNPJ válidos (14 dígitos).
        </p>
      )}
    </div>
  );
}