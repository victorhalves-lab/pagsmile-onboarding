import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { FileCheck, ShieldCheck, Scale, AlertCircle } from 'lucide-react';

export default function StepL5Declaracoes({ formData, handleChange }) {
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
      description: 'Permito que a Pagsmile realize verificações de dados em fontes oficiais e parceiros.'
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
    <div className="space-y-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-xl bg-[var(--pagsmile-green)]/10">
          <FileCheck className="w-6 h-6 text-[var(--pagsmile-green)]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--pagsmile-blue)]">
            Declarações e Autorização
          </h2>
          <p className="text-[var(--pagsmile-blue)]/70">
            Leia e aceite as declarações abaixo para finalizar
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {declaracoes.map((declaracao) => {
          const Icon = declaracao.icon;
          const isChecked = formData[declaracao.key] === true;

          return (
            <div
              key={declaracao.key}
              className={`p-5 rounded-xl border-2 transition-all cursor-pointer ${
                isChecked
                  ? 'border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
              onClick={() => handleChange(declaracao.key, !isChecked)}
            >
              <div className="flex items-start gap-4">
                <Checkbox
                  id={declaracao.key}
                  checked={isChecked}
                  onCheckedChange={(checked) => handleChange(declaracao.key, checked)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className={`w-4 h-4 ${isChecked ? 'text-[var(--pagsmile-green)]' : 'text-slate-400'}`} />
                    <Label 
                      htmlFor={declaracao.key}
                      className="text-[var(--pagsmile-blue)] font-semibold cursor-pointer"
                    >
                      {declaracao.label} <span className="text-red-500">*</span>
                    </Label>
                  </div>
                  <p className="text-sm text-[var(--pagsmile-blue)]/60 ml-6">
                    {declaracao.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status das Declarações */}
      {!allChecked && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Declarações Pendentes</p>
            <p className="text-sm text-amber-700">
              Você precisa aceitar todas as declarações acima para continuar.
            </p>
          </div>
        </div>
      )}

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
      <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
        <p className="text-xs text-[var(--pagsmile-blue)]/60 leading-relaxed">
          Ao aceitar as declarações acima, você confirma ter ciência de que informações falsas ou 
          omissões podem resultar em recusa da solicitação, cancelamento de serviços e, quando 
          aplicável, medidas legais cabíveis conforme legislação vigente.
        </p>
      </div>
    </div>
  );
}