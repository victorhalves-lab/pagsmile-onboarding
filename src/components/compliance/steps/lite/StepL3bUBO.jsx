import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UserCircle } from 'lucide-react';

export default function StepL3bUBO({ formData, handleChange }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-xl bg-[var(--pagsmile-green)]/10">
          <UserCircle className="w-6 h-6 text-[var(--pagsmile-green)]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--pagsmile-blue)]">
            Beneficiário Final (UBO)
          </h2>
          <p className="text-[var(--pagsmile-blue)]/70">
            Pessoa física com participação relevante
          </p>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="space-y-2">
          <Label className="text-[var(--pagsmile-blue)] font-semibold">
            Existe Beneficiário Final (UBO) com mais de 25%?
          </Label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleChange('existeUBO', true)}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                formData.existeUBO === true
                  ? 'border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="font-semibold text-[var(--pagsmile-blue)]">Sim</p>
            </button>
            <button
              type="button"
              onClick={() => handleChange('existeUBO', false)}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                formData.existeUBO === false
                  ? 'border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className="font-semibold text-[var(--pagsmile-blue)]">Não</p>
            </button>
          </div>
          <p className="text-xs text-[var(--pagsmile-blue)]/60">
            UBO = Ultimate Beneficial Owner (pessoa física que detém mais de 25% da empresa, direta ou indiretamente)
          </p>
        </div>

        {/* Condicional UBO */}
        {formData.existeUBO === true && (
          <div className="space-y-3 p-5 bg-slate-50 rounded-xl border border-slate-200">
            <Label className="text-[var(--pagsmile-blue)] font-semibold">
              Liste os UBOs (Nome; CPF; %)
            </Label>
            <Textarea
              value={formData.listaUBO || ''}
              onChange={(e) => handleChange('listaUBO', e.target.value)}
              placeholder="Ex: João Silva; 123.456.789-00; 30%&#10;Maria Santos; 987.654.321-00; 40%"
              className="min-h-[100px] bg-white"
            />
            <p className="text-xs text-[var(--pagsmile-blue)]/60">
              Separe cada beneficiário em uma linha. Formato: Nome; CPF; Percentual
            </p>
          </div>
        )}
      </div>
    </div>
  );
}