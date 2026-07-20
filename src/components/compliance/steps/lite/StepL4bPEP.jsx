import React from 'react';
import { Label } from '@/components/ui/label';
import { UserX, AlertTriangle } from 'lucide-react';

export default function StepL4bPEP({ formData, handleChange }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-xl bg-orange-100">
          <UserX className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--pinbank-blue)]">
            PEP e Sanções
          </h2>
          <p className="text-[var(--pinbank-blue)]/70">
            Pessoas politicamente expostas e restrições
          </p>
        </div>
      </div>

      <div className="grid gap-5">
        {/* PEP */}
        <div className="space-y-2">
          <Label className="text-[var(--pinbank-blue)] font-semibold">
            Algum sócio/administrador/UBO é PEP (Pessoa Exposta Politicamente)?
          </Label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleChange('socioPEP', true)}
              className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                formData.socioPEP === true
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className={`font-semibold ${formData.socioPEP === true ? 'text-amber-600' : 'text-[var(--pinbank-blue)]'}`}>Sim</p>
            </button>
            <button
              type="button"
              onClick={() => handleChange('socioPEP', false)}
              className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                formData.socioPEP === false
                  ? 'border-[var(--pinbank-blue)] bg-[var(--pinbank-blue)]/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className={`font-semibold ${formData.socioPEP === false ? 'text-[var(--pinbank-blue)]' : 'text-[var(--pinbank-blue)]'}`}>Não</p>
            </button>
          </div>
          <p className="text-xs text-[var(--pinbank-blue)]/60">
            PEP = agentes públicos, ocupantes de cargos políticos, ou seus familiares/associados
          </p>
        </div>

        {/* Sanções */}
        <div className="space-y-2">
          <Label className="text-[var(--pinbank-blue)] font-semibold">
            Algum sócio/administrador/UBO está em listas de sanções/restrições?
          </Label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleChange('socioSancionado', true)}
              className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                formData.socioSancionado === true
                  ? 'border-red-500 bg-red-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className={`font-semibold ${formData.socioSancionado === true ? 'text-red-600' : 'text-[var(--pinbank-blue)]'}`}>Sim</p>
            </button>
            <button
              type="button"
              onClick={() => handleChange('socioSancionado', false)}
              className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                formData.socioSancionado === false
                  ? 'border-[var(--pinbank-blue)] bg-[var(--pinbank-blue)]/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className={`font-semibold ${formData.socioSancionado === false ? 'text-[var(--pinbank-blue)]' : 'text-[var(--pinbank-blue)]'}`}>Não</p>
            </button>
          </div>
        </div>

        {/* Alerta */}
        {(formData.socioPEP === true || formData.socioSancionado === true) && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-800">Atenção</p>
              <p className="text-sm text-orange-700">
                Estas respostas podem requerer análise adicional. Continue preenchendo normalmente.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}