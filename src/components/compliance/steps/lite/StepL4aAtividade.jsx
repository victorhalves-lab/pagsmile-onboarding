import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShieldAlert } from 'lucide-react';

export default function StepL4aAtividade({ formData, handleChange }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-xl bg-orange-100">
          <ShieldAlert className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--pinbank-blue)]">
            Compliance - Atividade
          </h2>
          <p className="text-[var(--pinbank-blue)]/70">
            Perguntas sobre a atividade da empresa
          </p>
        </div>
      </div>

      <div className="grid gap-5">
        {/* Atividade Ilegal */}
        <div className="space-y-2">
          <Label className="text-[var(--pinbank-blue)] font-semibold">
            A empresa atua em alguma atividade ilegal/proibida?
          </Label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleChange('atividadeIlegal', true)}
              className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                formData.atividadeIlegal === true
                  ? 'border-red-500 bg-red-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className={`font-semibold ${formData.atividadeIlegal === true ? 'text-red-600' : 'text-[var(--pinbank-blue)]'}`}>Sim</p>
            </button>
            <button
              type="button"
              onClick={() => handleChange('atividadeIlegal', false)}
              className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                formData.atividadeIlegal === false
                  ? 'border-[var(--pinbank-blue)] bg-[var(--pinbank-blue)]/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className={`font-semibold ${formData.atividadeIlegal === false ? 'text-[var(--pinbank-blue)]' : 'text-[var(--pinbank-blue)]'}`}>Não</p>
            </button>
          </div>
        </div>

        {/* Licença/Regulação */}
        <div className="space-y-2">
          <Label className="text-[var(--pinbank-blue)] font-semibold">
            A empresa comercializa produtos/serviços que exigem licença/regulação relevante?
          </Label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleChange('exigeLicenca', true)}
              className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                formData.exigeLicenca === true
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className={`font-semibold ${formData.exigeLicenca === true ? 'text-amber-600' : 'text-[var(--pinbank-blue)]'}`}>Sim</p>
            </button>
            <button
              type="button"
              onClick={() => handleChange('exigeLicenca', false)}
              className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                formData.exigeLicenca === false
                  ? 'border-[var(--pinbank-blue)] bg-[var(--pinbank-blue)]/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className={`font-semibold ${formData.exigeLicenca === false ? 'text-[var(--pinbank-blue)]' : 'text-[var(--pinbank-blue)]'}`}>Não</p>
            </button>
          </div>
          <p className="text-xs text-[var(--pinbank-blue)]/60">Ex.: vigilância sanitária, órgão regulador, autorização específica</p>
        </div>

        {formData.exigeLicenca === true && (
          <div className="space-y-2 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <Label className="text-[var(--pinbank-blue)] font-semibold text-sm">Qual licença/registro?</Label>
            <Input
              value={formData.qualLicenca || ''}
              onChange={(e) => handleChange('qualLicenca', e.target.value)}
              placeholder="Descreva a licença ou registro"
              className="h-11 bg-white"
            />
          </div>
        )}
      </div>
    </div>
  );
}