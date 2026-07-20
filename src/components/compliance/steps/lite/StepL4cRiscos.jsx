import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Globe } from 'lucide-react';

export default function StepL4cRiscos({ formData, handleChange }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-xl bg-amber-100">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--pinbank-blue)]">
            Atividades de Risco
          </h2>
          <p className="text-[var(--pinbank-blue)]/70">
            Setores sensíveis e histórico
          </p>
        </div>
      </div>

      <div className="grid gap-5">
        {/* Criptoativos */}
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-2">
          <Label className="text-[var(--pinbank-blue)] font-semibold">
            A empresa atua com criptoativos (compra/venda/intermediação/pagamento)?
          </Label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleChange('atuaCripto', true)}
              className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                formData.atuaCripto === true
                  ? 'border-amber-500 bg-amber-100'
                  : 'border-amber-200 hover:border-amber-300 bg-white'
              }`}
            >
              <p className={`font-semibold ${formData.atuaCripto === true ? 'text-amber-700' : 'text-[var(--pinbank-blue)]'}`}>Sim</p>
            </button>
            <button
              type="button"
              onClick={() => handleChange('atuaCripto', false)}
              className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                formData.atuaCripto === false
                  ? 'border-[var(--pinbank-blue)] bg-[var(--pinbank-blue)]/5'
                  : 'border-amber-200 hover:border-amber-300 bg-white'
              }`}
            >
              <p className={`font-semibold ${formData.atuaCripto === false ? 'text-[var(--pinbank-blue)]' : 'text-[var(--pinbank-blue)]'}`}>Não</p>
            </button>
          </div>
        </div>

        {/* Jogos/Apostas */}
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-2">
          <Label className="text-[var(--pinbank-blue)] font-semibold">
            A empresa atua com jogos/apostas/cassino?
          </Label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleChange('atuaJogos', true)}
              className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                formData.atuaJogos === true
                  ? 'border-amber-500 bg-amber-100'
                  : 'border-amber-200 hover:border-amber-300 bg-white'
              }`}
            >
              <p className={`font-semibold ${formData.atuaJogos === true ? 'text-amber-700' : 'text-[var(--pinbank-blue)]'}`}>Sim</p>
            </button>
            <button
              type="button"
              onClick={() => handleChange('atuaJogos', false)}
              className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                formData.atuaJogos === false
                  ? 'border-[var(--pinbank-blue)] bg-[var(--pinbank-blue)]/5'
                  : 'border-amber-200 hover:border-amber-300 bg-white'
              }`}
            >
              <p className={`font-semibold ${formData.atuaJogos === false ? 'text-[var(--pinbank-blue)]' : 'text-[var(--pinbank-blue)]'}`}>Não</p>
            </button>
          </div>
        </div>

        {/* Encerramento de Conta */}
        <div className="space-y-2">
          <Label className="text-[var(--pinbank-blue)] font-semibold">
            Houve encerramento de conta bancária/conta de pagamento por motivo de compliance nos últimos 24 meses?
          </Label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => handleChange('encerramentoConta', true)}
              className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                formData.encerramentoConta === true
                  ? 'border-red-500 bg-red-50'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className={`font-semibold ${formData.encerramentoConta === true ? 'text-red-600' : 'text-[var(--pinbank-blue)]'}`}>Sim</p>
            </button>
            <button
              type="button"
              onClick={() => handleChange('encerramentoConta', false)}
              className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                formData.encerramentoConta === false
                  ? 'border-[var(--pinbank-blue)] bg-[var(--pinbank-blue)]/5'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <p className={`font-semibold ${formData.encerramentoConta === false ? 'text-[var(--pinbank-blue)]' : 'text-[var(--pinbank-blue)]'}`}>Não</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}