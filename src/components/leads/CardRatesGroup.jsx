import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreditCard } from 'lucide-react';

/**
 * Renderiza um grupo de taxas de cartão agrupadas por categoria (À Vista, 2-6x, 7-12x)
 * com campos lado a lado para cada bandeira (Visa, Master, Amex, Elo, Outras).
 */

const BANDEIRA_ORDER = ['Visa', 'Mastercard', 'Amex', 'Elo', 'Outras'];

const CATEGORY_ORDER = [
  { label: 'Cartão de Crédito à Vista (1x)', prefix: 'Taxa de Cartão à Vista (1x)' },
  { label: 'Cartão de Crédito 2 a 6x', prefix: 'Taxa de Cartão 2-6x' },
  { label: 'Cartão de Crédito 7 a 12x', prefix: 'Taxa de Cartão 7-12x' },
];

function extractBandeira(text) {
  for (const b of BANDEIRA_ORDER) {
    if (text.includes(b)) return b;
  }
  return null;
}

function matchesCategory(text, prefix) {
  return text.startsWith(prefix);
}

export default function CardRatesGroup({ questions, formData, updateField }) {
  // Organizar perguntas por categoria e bandeira
  const categories = CATEGORY_ORDER.map(cat => {
    const catQuestions = BANDEIRA_ORDER.map(bandeira => {
      return questions.find(q => 
        matchesCategory(q.text, cat.prefix) && extractBandeira(q.text) === bandeira
      );
    }).filter(Boolean);

    return { ...cat, questions: catQuestions };
  }).filter(cat => cat.questions.length > 0);

  if (categories.length === 0) return null;

  return (
    <div className="space-y-6">
      {categories.map((cat) => (
        <div key={cat.prefix} className="space-y-3">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#2bc196]" />
            <Label className="text-sm font-bold text-[var(--pagsmile-blue)]">
              {cat.label}
            </Label>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {cat.questions.map(q => {
              const bandeira = extractBandeira(q.text);
              return (
                <div key={q.id} className="space-y-1">
                  <Label className="text-xs font-medium text-[var(--pagsmile-blue)]/70">
                    {bandeira}
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData[q.id] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || parseFloat(val) >= 0) {
                          updateField(q.id, val);
                        }
                      }}
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (val !== '' && !isNaN(parseFloat(val))) {
                          updateField(q.id, parseFloat(val).toFixed(2));
                        }
                      }}
                      placeholder="0,00"
                      className="h-10 rounded-lg pr-7 text-sm"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--pagsmile-blue)]/40 font-medium">
                      %
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}