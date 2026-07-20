import React, { useState } from 'react';
import { 
  CheckCircle, Edit2, ChevronDown, ChevronRight, 
  FileText, Link2, MapPin, CreditCard, DollarSign,
  Building2, Mail, Phone, Hash, Globe, Percent
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

// Detect icon based on question text
function getFieldIcon(text) {
  const t = (text || '').toLowerCase();
  if (t.includes('cnpj') || t.includes('cpf')) return Hash;
  if (t.includes('e-mail') || t.includes('email')) return Mail;
  if (t.includes('telefone') || t.includes('celular')) return Phone;
  if (t.includes('endereço') || t.includes('cep')) return MapPin;
  if (t.includes('site') || t.includes('url') || t.includes('website')) return Globe;
  if (t.includes('razão social') || t.includes('fantasia') || t.includes('empresa')) return Building2;
  if (t.includes('tpv') || t.includes('faturamento') || t.includes('ticket')) return DollarSign;
  if (t.includes('mcc') || t.includes('cartão') || t.includes('bandeira')) return CreditCard;
  if (t.includes('%') || t.includes('percentual') || t.includes('distribuição')) return Percent;
  if (t.includes('proposta') || t.includes('documento') || t.includes('upload') || t.includes('arquivo')) return FileText;
  return null;
}

function formatCurrency(val) {
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function ConfirmationReview({ questions, formData, steps, onGoToStep, updateField, shouldShowQuestion }) {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (idx) => {
    setExpandedSections(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const answeredByStep = steps.map((stepQuestions, stepIdx) => {
    const answered = stepQuestions.filter(q => {
      if (!shouldShowQuestion(q)) return false;
      const val = formData[q.id];
      return val !== undefined && val !== null && val !== '' && !(Array.isArray(val) && val.length === 0);
    });
    return { stepIdx, questions: answered };
  }).filter(s => s.questions.length > 0);

  const formatValue = (question, val) => {
    if (Array.isArray(val)) {
      // Multi-file array
      if (val.length > 0 && typeof val[0] === 'string' && val[0].startsWith('http')) {
        return { type: 'files', count: val.length };
      }
      return { type: 'tags', items: val };
    }
    if (typeof val === 'boolean') return { type: 'boolean', value: val };
    if (typeof val === 'string' && val.startsWith('http')) return { type: 'file' };
    // Address object
    if (val && typeof val === 'object' && val.cep) {
      return { type: 'address', value: val };
    }
    // Generic object — stringify safely
    if (val && typeof val === 'object') {
      try { return { type: 'text', value: JSON.stringify(val) }; } catch { return { type: 'text', value: '[Dados complexos]' }; }
    }
    // Currency detection
    const t = (question.text || '').toLowerCase();
    if (t.includes('tpv') || t.includes('faturamento') || t.includes('ticket médio') || t.includes('(r$)')) {
      const num = parseFloat(val);
      if (!isNaN(num)) return { type: 'currency', value: num };
    }
    // Percent detection
    if (t.includes('%') || t.includes('percentual')) {
      return { type: 'percent', value: val };
    }
    return { type: 'text', value: String(val) };
  };

  const renderValue = (question, val) => {
    const formatted = formatValue(question, val);

    switch (formatted.type) {
      case 'tags':
        return (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {formatted.items.map((item, i) => (
              <span key={i} className="inline-block px-2.5 py-1 bg-[#1356E2]/8 text-[#0A0A0A] text-xs font-semibold rounded-lg border border-[#1356E2]/15">
                {item}
              </span>
            ))}
          </div>
        );
      case 'boolean':
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold mt-1 ${
            formatted.value 
              ? 'bg-[#1356E2]/10 text-[#1356E2]' 
              : 'bg-red-50 text-red-500'
          }`}>
            <span className={`w-2 h-2 rounded-full ${formatted.value ? 'bg-[#1356E2]' : 'bg-red-400'}`} />
            {formatted.value ? 'Sim' : 'Não'}
          </span>
        );
      case 'file':
        return (
          <span className="inline-flex items-center gap-1.5 text-[#1356E2] text-sm font-semibold mt-1">
            <FileText className="w-4 h-4" />
            Arquivo enviado
          </span>
        );
      case 'files':
        return (
          <span className="inline-flex items-center gap-1.5 text-[#1356E2] text-sm font-semibold mt-1">
            <FileText className="w-4 h-4" />
            {formatted.count} {formatted.count === 1 ? 'arquivo enviado' : 'arquivos enviados'}
          </span>
        );
      case 'address':
        return (
          <div className="mt-1 text-sm font-semibold text-[#0A0A0A] leading-relaxed">
            <span>{formatted.value.logradouro}, {formatted.value.numero || 'S/N'}</span>
            {formatted.value.complemento && <span> — {formatted.value.complemento}</span>}
            <br />
            <span className="text-[#0A0A0A]/60 text-xs font-medium">
              {formatted.value.bairro} · {formatted.value.cidade}/{formatted.value.uf} · CEP {formatted.value.cep}
            </span>
          </div>
        );
      case 'currency':
        return (
          <span className="text-base font-bold text-[#0A0A0A] mt-0.5 block tracking-tight">
            {formatCurrency(formatted.value)}
          </span>
        );
      case 'percent':
        return (
          <span className="text-base font-bold text-[#0A0A0A] mt-0.5 block">
            {formatted.value}%
          </span>
        );
      default:
        return (
          <span className="text-sm font-semibold text-[#0A0A0A] mt-0.5 block break-words leading-relaxed">
            {formatted.value}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1356E2]/10 mb-4">
          <CheckCircle className="w-8 h-8 text-[#1356E2]" />
        </div>
        <h2 className="text-2xl font-bold text-[#0A0A0A]">Revisão Final</h2>
        <p className="text-sm text-[#0A0A0A]/50 mt-2 max-w-md mx-auto">
          Confira todos os dados antes de enviar. Clique em <strong>"Editar"</strong> para corrigir qualquer informação.
        </p>
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {answeredByStep.map(({ stepIdx, questions: stepQs }) => {
          const isExpanded = expandedSections[stepIdx] !== false;
          return (
            <div key={stepIdx} className="bg-white border border-[#0A0A0A]/8 rounded-2xl overflow-hidden shadow-sm">
              {/* Section header */}
              <button
                onClick={() => toggleSection(stepIdx)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-[#f4f4f4]/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-[#0A0A0A] text-white text-xs font-bold flex items-center justify-center">
                    {stepIdx + 1}
                  </span>
                  <div className="text-left">
                    <span className="text-sm font-bold text-[#0A0A0A] block">
                      Etapa {stepIdx + 1}
                    </span>
                    <span className="text-[10px] text-[#0A0A0A]/40 font-medium">
                      {stepQs.length} {stepQs.length === 1 ? 'campo preenchido' : 'campos preenchidos'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); onGoToStep(stepIdx); }}
                    className="text-[#1356E2] hover:text-[#1356E2] hover:bg-[#1356E2]/10 h-8 px-3 text-xs font-bold rounded-lg"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                    Editar
                  </Button>
                  {isExpanded
                    ? <ChevronDown className="w-4 h-4 text-[#0A0A0A]/30" />
                    : <ChevronRight className="w-4 h-4 text-[#0A0A0A]/30" />
                  }
                </div>
              </button>

              {/* Section content */}
              {isExpanded && (
                <div className="px-5 pb-5 pt-1 border-t border-[#0A0A0A]/5">
                  <div className="divide-y divide-[#0A0A0A]/5">
                    {stepQs.map(q => {
                      const Icon = getFieldIcon(q.text);
                      return (
                        <div key={q.id} className="py-3 first:pt-2 last:pb-1">
                          <div className="flex items-start gap-2.5">
                            {Icon && (
                              <div className="mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0">
                                <Icon className="w-3.5 h-3.5 text-[#0A0A0A]/25" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <span className="text-[11px] font-medium text-[#0A0A0A]/40 uppercase tracking-wide leading-tight block">
                                {q.text}
                              </span>
                              {renderValue(q, formData[q.id])}
                              {/* "Outro" description if present */}
                              {formData[`${q.id}_outro_descricao`] && (
                                <span className="text-xs text-[#0A0A0A]/50 italic block mt-1">
                                  Outros: {formData[`${q.id}_outro_descricao`]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Terms */}
      <div className="space-y-4 bg-white border border-[#0A0A0A]/8 rounded-2xl p-6 mt-6 shadow-sm">
        <h3 className="text-sm font-bold text-[#0A0A0A] flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-[#1356E2]" />
          Aceite dos Termos
        </h3>
        <div className="flex items-start gap-3 pl-1">
          <Checkbox
            checked={formData.aceite_termos || false}
            onCheckedChange={(checked) => updateField('aceite_termos', checked)}
            id="termos"
          />
          <Label htmlFor="termos" className="text-sm leading-relaxed cursor-pointer text-[#0A0A0A]/80">
            Li e aceito os <span className="text-[#1356E2] font-bold">Termos de Uso</span> da plataforma Pin Bank.
          </Label>
        </div>
        <div className="flex items-start gap-3 pl-1">
          <Checkbox
            checked={formData.aceite_privacidade || false}
            onCheckedChange={(checked) => updateField('aceite_privacidade', checked)}
            id="privacidade"
          />
          <Label htmlFor="privacidade" className="text-sm leading-relaxed cursor-pointer text-[#0A0A0A]/80">
            Li e aceito a <span className="text-[#1356E2] font-bold">Política de Privacidade</span> da Pin Bank.
          </Label>
        </div>
      </div>
    </div>
  );
}