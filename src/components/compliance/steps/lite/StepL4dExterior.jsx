import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Globe } from 'lucide-react';

export default function StepL4dExterior({ formData, handleChange }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-xl bg-blue-100">
          <Globe className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--pagsmile-blue)]">
            Operação Internacional
          </h2>
          <p className="text-[var(--pagsmile-blue)]/70">
            Presença fora do Brasil
          </p>
        </div>
      </div>

      <div className="grid gap-5">
        {/* Operação Fora do Brasil */}
        <div className="space-y-2">
          <Label className="text-[var(--pagsmile-blue)] font-semibold">
            A empresa possui sede/operação fora do Brasil?
          </Label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleChange('operacaoExterior', true)}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                formData.operacaoExterior === true
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Globe className="w-5 h-5 mx-auto mb-1 text-blue-600" />
              <p className={`font-semibold ${formData.operacaoExterior === true ? 'text-blue-600' : 'text-[var(--pagsmile-blue)]'}`}>Sim</p>
            </button>
            <button
              type="button"
              onClick={() => handleChange('operacaoExterior', false)}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                formData.operacaoExterior === false
                  ? 'border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <Globe className="w-5 h-5 mx-auto mb-1 text-slate-400" />
              <p className={`font-semibold ${formData.operacaoExterior === false ? 'text-[var(--pagsmile-green)]' : 'text-[var(--pagsmile-blue)]'}`}>Não</p>
            </button>
          </div>
        </div>

        {formData.operacaoExterior === true && (
          <div className="space-y-2 p-5 bg-blue-50 rounded-xl border border-blue-200">
            <Label className="text-[var(--pagsmile-blue)] font-semibold flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Quais países?
            </Label>
            <Input
              value={formData.paisesOperacao || ''}
              onChange={(e) => handleChange('paisesOperacao', e.target.value)}
              placeholder="Ex: Estados Unidos, Portugal"
              className="h-12 bg-white"
            />
          </div>
        )}
      </div>
    </div>
  );
}