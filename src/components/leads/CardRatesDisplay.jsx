import React from 'react';
import { CreditCard } from 'lucide-react';

/**
 * Exibe taxas de cartão de crédito por bandeira e parcelamento em formato tabela.
 * Recebe as questions de taxa + questionnaireData do lead.
 */

const CARD_RATE_QUESTION_IDS = [
  '69a5cd44afab70a7ca218502', '69a5cd44afab70a7ca218503',
  '69a8621316a6e3a86682f6e3', '69a8621316a6e3a86682f6e4',
  '69a5cd45afab70a7ca218504', '69a5cd45afab70a7ca218505',
  '69a5cd45afab70a7ca218506', '69a8621316a6e3a86682f6e5',
  '69a8621316a6e3a86682f6e6', '69a5cd45afab70a7ca218507',
  '69a5cd45afab70a7ca218508', '69a5cd45afab70a7ca218509',
  '69a8621316a6e3a86682f6e7', '69a8621316a6e3a86682f6e8',
  '69a5cd45afab70a7ca21850a',
];

const BANDEIRAS = ['Visa', 'Mastercard', 'Amex', 'Elo', 'Outras'];
const CATEGORIAS = [
  { label: 'À Vista (1x)', prefix: 'Taxa de Cartão à Vista (1x)' },
  { label: '2-6x', prefix: 'Taxa de Cartão 2-6x' },
  { label: '7-12x', prefix: 'Taxa de Cartão 7-12x' },
];

export { CARD_RATE_QUESTION_IDS };

export default function CardRatesDisplay({ questions, questionnaireData }) {
  // Filtrar apenas perguntas de taxa de cartão
  const rateQuestions = questions.filter(q => CARD_RATE_QUESTION_IDS.includes(q.id));
  
  if (rateQuestions.length === 0) return null;

  // Montar grid: categoria × bandeira
  const grid = CATEGORIAS.map(cat => {
    const row = BANDEIRAS.map(bandeira => {
      const q = rateQuestions.find(rq => 
        rq.text.startsWith(cat.prefix) && rq.text.includes(bandeira)
      );
      if (!q) return { bandeira, value: null, questionId: null };
      const raw = questionnaireData[q.id];
      const val = raw !== undefined && raw !== null && raw !== '' ? parseFloat(raw) : null;
      return { bandeira, value: val, questionId: q.id };
    });
    return { ...cat, rates: row };
  });

  const hasAnyValue = grid.some(cat => cat.rates.some(r => r.value !== null));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <CreditCard className="w-4 h-4 text-rose-400" />
        <span className="text-xs font-bold text-white/70 uppercase tracking-wider">Taxas de Cartão de Crédito por Bandeira</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left py-2 px-3 text-white/40 font-semibold">Parcelamento</th>
              {BANDEIRAS.map(b => (
                <th key={b} className="text-center py-2 px-3 text-white/40 font-semibold">{b}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map(cat => (
              <tr key={cat.prefix} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                <td className="py-2.5 px-3 text-white/60 font-medium">{cat.label}</td>
                {cat.rates.map((r, i) => (
                  <td key={i} className="text-center py-2.5 px-3">
                    {r.value !== null ? (
                      <span className="text-cyan-400 font-bold">{r.value.toFixed(2).replace('.', ',')}%</span>
                    ) : (
                      <span className="text-white/15">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!hasAnyValue && (
        <p className="text-[11px] text-amber-400/60 italic text-center py-2">
          Nenhuma taxa de cartão foi informada pelo lead
        </p>
      )}
    </div>
  );
}