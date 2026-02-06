import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FileCheck } from 'lucide-react';

export default function StepE6Declaracoes({ formData, handleChange }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-green-100">
          <FileCheck className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-[var(--pagsmile-blue)]">Declarações Obrigatórias</h2>
          <p className="text-sm text-[var(--pagsmile-blue)]/60">Confirme as declarações abaixo</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg">
          <Checkbox
            id="declaracaoVeracidade"
            checked={formData.declaracaoVeracidade || false}
            onCheckedChange={(checked) => handleChange('declaracaoVeracidade', checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="declaracaoVeracidade"
              className="text-sm font-medium leading-relaxed cursor-pointer"
            >
              Declaro que as informações prestadas são verdadeiras e completas. *
            </Label>
          </div>
        </div>

        <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg">
          <Checkbox
            id="declaracaoAutorizacao"
            checked={formData.declaracaoAutorizacao || false}
            onCheckedChange={(checked) => handleChange('declaracaoAutorizacao', checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="declaracaoAutorizacao"
              className="text-sm font-medium leading-relaxed cursor-pointer"
            >
              Autorizo validações em bases públicas/terceiros para fins de compliance. *
            </Label>
          </div>
        </div>

        <div className="flex items-start space-x-3 p-4 bg-slate-50 rounded-lg">
          <Checkbox
            id="declaracaoLegalidade"
            checked={formData.declaracaoLegalidade || false}
            onCheckedChange={(checked) => handleChange('declaracaoLegalidade', checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="declaracaoLegalidade"
              className="text-sm font-medium leading-relaxed cursor-pointer"
            >
              Declaro que não utilizarei a operação para fins ilícitos e cumprirei leis aplicáveis. *
            </Label>
          </div>
        </div>
      </div>

      {(!formData.declaracaoVeracidade || !formData.declaracaoAutorizacao || !formData.declaracaoLegalidade) && (
        <p className="text-sm text-amber-600 p-3 bg-amber-50 rounded-lg">
          Todas as declarações devem ser aceitas para prosseguir.
        </p>
      )}
    </div>
  );
}