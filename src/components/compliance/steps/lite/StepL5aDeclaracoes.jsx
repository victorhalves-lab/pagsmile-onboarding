import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FileCheck, ShieldCheck, Scale } from 'lucide-react';

export default function StepL5aDeclaracoes({ formData, handleChange }) {
  const declaracoes = [
    {
      key: 'declaracaoVeracidade',
      label: 'Declaro que as informações prestadas são verdadeiras e completas.',
      icon: FileCheck,
      description: 'Atesto a veracidade de todas as informações fornecidas neste questionário.'
    },
    {
      key: 'declaracaoAutorizacao',
      label: 'Autorizo validações e checagens em bases públicas/terceiros para fins de compliance.',
      icon: ShieldCheck,
      description: 'Permito que a Pin Bank realize verificações de dados em fontes oficiais e parceiros.'
    },
    {
      key: 'declaracaoLegalidade',
      label: 'Declaro que não utilizarei a operação para fins ilícitos e cumprirei leis aplicáveis.',
      icon: Scale,
      description: 'Comprometo-me a utilizar os serviços de forma legal e ética.'
    }
  ];

  const allChecked = declaracoes.every(d => formData[d.key] === true);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 rounded-xl bg-[var(--pinbank-blue)]/10">
          <FileCheck className="w-6 h-6 text-[var(--pinbank-blue)]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--pinbank-blue)]">
            Declarações e Autorização
          </h2>
          <p className="text-[var(--pinbank-blue)]/70">
            Leia e aceite para finalizar
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {declaracoes.map((declaracao) => {
          const Icon = declaracao.icon;
          const isChecked = formData[declaracao.key] === true;

          return (
            <div
              key={declaracao.key}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                isChecked
                  ? 'border-[var(--pinbank-blue)] bg-[var(--pinbank-blue)]/5'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
              onClick={() => handleChange(declaracao.key, !isChecked)}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  id={declaracao.key}
                  checked={isChecked}
                  onCheckedChange={(checked) => handleChange(declaracao.key, checked)}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${isChecked ? 'text-[var(--pinbank-blue)]' : 'text-slate-400'}`} />
                    <Label 
                      htmlFor={declaracao.key}
                      className="text-[var(--pinbank-blue)] font-semibold cursor-pointer text-sm"
                    >
                      {declaracao.label}
                    </Label>
                  </div>
                  <p className="text-xs text-[var(--pinbank-blue)]/60 ml-6">
                    {declaracao.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status */}
      {allChecked && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-800">Declarações Aceitas</p>
            <p className="text-sm text-green-700">
              Todas as declarações foram aceitas. Você pode prosseguir para o envio de documentos.
            </p>
          </div>
        </div>
      )}

      {/* Aviso Legal */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-xs text-[var(--pinbank-blue)]/60 leading-relaxed">
          Ao aceitar as declarações acima, você confirma ter ciência de que informações falsas ou 
          omissões podem resultar em recusa da solicitação, cancelamento de serviços e, quando 
          aplicável, medidas legais cabíveis conforme legislação vigente.
        </p>
      </div>
    </div>
  );
}