import React, { useState } from 'react';
import { CheckCircle, Edit2, ChevronDown, ChevronRight } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

export default function ConfirmationReview({ questions, formData, steps, onGoToStep, updateField, shouldShowQuestion }) {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (idx) => {
    setExpandedSections(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Agrupar respostas por step
  const answeredByStep = steps.map((stepQuestions, stepIdx) => {
    const answered = stepQuestions.filter(q => {
      if (!shouldShowQuestion(q)) return false;
      const val = formData[q.id];
      return val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0);
    });
    return { stepIdx, questions: answered };
  }).filter(s => s.questions.length > 0);

  const formatValue = (val) => {
    if (Array.isArray(val)) return val.join(', ');
    if (typeof val === 'boolean') return val ? 'Sim' : 'Não';
    if (typeof val === 'string' && val.startsWith('http')) return '📎 Arquivo enviado';
    // Address object
    if (val && typeof val === 'object' && val.cep) {
      return `${val.logradouro || ''}, ${val.numero || 'S/N'}${val.complemento ? ' - ' + val.complemento : ''} — ${val.bairro || ''}, ${val.cidade || ''}/${val.uf || ''} — CEP ${val.cep}`;
    }
    return String(val);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--pagsmile-green)]/10 mb-4">
          <CheckCircle className="w-8 h-8 text-[var(--pagsmile-green)]" />
        </div>
        <h2 className="text-xl font-bold text-[var(--pagsmile-blue)]">Revisão Final</h2>
        <p className="text-sm text-[var(--pagsmile-blue)]/70 mt-1">
          Confira todos os dados antes de enviar. Clique em "Editar" para corrigir qualquer informação.
        </p>
      </div>

      {/* Resumo por etapas */}
      <div className="space-y-3">
        {answeredByStep.map(({ stepIdx, questions: stepQs }) => {
          const isExpanded = expandedSections[stepIdx] !== false; // aberto por padrão
          return (
            <div key={stepIdx} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleSection(stepIdx)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#2bc196]/10 text-[#2bc196] text-xs font-bold flex items-center justify-center">
                    {stepIdx + 1}
                  </span>
                  <span className="text-sm font-semibold text-[var(--pagsmile-blue)]">
                    Etapa {stepIdx + 1}
                  </span>
                  <span className="text-xs text-[var(--pagsmile-blue)]/40">
                    ({stepQs.length} {stepQs.length === 1 ? 'campo' : 'campos'})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onGoToStep(stepIdx);
                    }}
                    className="text-[#2bc196] hover:text-[#2bc196] hover:bg-[#2bc196]/10 h-7 px-2 text-xs"
                  >
                    <Edit2 className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-[var(--pagsmile-blue)]/40" />
                    : <ChevronRight className="w-4 h-4 text-[var(--pagsmile-blue)]/40" />
                  }
                </div>
              </button>
              {isExpanded && (
                <div className="px-5 pb-4 pt-1 border-t border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {stepQs.map(q => (
                      <div key={q.id} className="flex flex-col py-1.5">
                        <span className="text-[var(--pagsmile-blue)]/60 text-xs leading-tight">{q.text}</span>
                        <span className="font-medium text-[var(--pagsmile-blue)] text-sm mt-0.5 break-words">
                          {formatValue(formData[q.id])}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Termos */}
      <div className="space-y-4 bg-white border border-slate-200 rounded-xl p-6 mt-6">
        <h3 className="text-sm font-bold text-[var(--pagsmile-blue)]">Aceite dos Termos</h3>
        <div className="flex items-start gap-3">
          <Checkbox
            checked={formData.aceite_termos || false}
            onCheckedChange={(checked) => updateField('aceite_termos', checked)}
            id="termos"
          />
          <Label htmlFor="termos" className="text-sm leading-relaxed cursor-pointer">
            Li e aceito os <span className="text-[var(--pagsmile-green)] font-semibold">Termos de Uso</span> da plataforma Pagsmile.
          </Label>
        </div>
        <div className="flex items-start gap-3">
          <Checkbox
            checked={formData.aceite_privacidade || false}
            onCheckedChange={(checked) => updateField('aceite_privacidade', checked)}
            id="privacidade"
          />
          <Label htmlFor="privacidade" className="text-sm leading-relaxed cursor-pointer">
            Li e aceito a <span className="text-[var(--pagsmile-green)] font-semibold">Política de Privacidade</span> da Pagsmile.
          </Label>
        </div>
      </div>
    </div>
  );
}