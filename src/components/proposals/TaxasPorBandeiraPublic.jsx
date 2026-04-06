import React from 'react';

const BANDEIRAS = [
  { id: 'visa', label: 'Visa', color: 'bg-blue-50 border-blue-200' },
  { id: 'mastercard', label: 'Mastercard', color: 'bg-orange-50 border-orange-200' },
  { id: 'elo', label: 'Elo', color: 'bg-yellow-50 border-yellow-200' },
  { id: 'amex', label: 'Amex', color: 'bg-purple-50 border-purple-200' },
  { id: 'outras', label: 'Outras', color: 'bg-slate-50 border-slate-200' },
];

const FAIXAS = [
  { label: 'À Vista (1x)', key: '1x', representativeParcela: 1 },
  { label: '2x a 6x', key: '2_6x', representativeParcela: 2 },
  { label: '7x a 12x', key: '7_12x', representativeParcela: 7 },
  { label: '13x a 21x', key: '13_21x', representativeParcela: 13 },
];

// Bandeiras que recebem override de taxa final
const OVERRIDE_BANDEIRAS = new Set(['visa', 'mastercard']);

function getTaxa(taxas, bandeira, faixa) {
  if (!taxas) return null;
  // Formato granular (novo)
  if (faixa === '1x' && taxas.credito_1x?.[bandeira] !== undefined) return taxas.credito_1x[bandeira];
  if (faixa === '2_6x' && taxas.credito_2_6x?.[bandeira] !== undefined) return taxas.credito_2_6x[bandeira];
  if (faixa === '7_12x' && taxas.credito_7_12x?.[bandeira] !== undefined) return taxas.credito_7_12x[bandeira];
  if (faixa === '13_21x' && taxas.credito_13_21x?.[bandeira] !== undefined) return taxas.credito_13_21x[bandeira];
  // Formato cartão (compat)
  if (taxas.cartao?.[bandeira]) {
    if (faixa === '1x') return taxas.cartao[bandeira].avista;
    if (faixa === '2_6x') return taxas.cartao[bandeira].de2a6x;
    if (faixa === '7_12x') return taxas.cartao[bandeira].de7a12x;
    if (faixa === '13_21x') return taxas.cartao[bandeira].de13a21x;
  }
  return null;
}

function formatVal(val) {
  if (val === null || val === undefined) return '-';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '-';
  return `${num.toFixed(2)}%`;
}

export default function TaxasPorBandeiraPublic({ taxas, taxaFinalOverrides = {}, taxaRAV = 0, prazo = 'D+1' }) {
  // Calcula taxa final (base + antecipação) para uma parcela representativa
  const calcFinalRate = (baseRate, parcela) => {
    if (baseRate === null || baseRate === undefined) return null;
    const base = typeof baseRate === 'string' ? parseFloat(baseRate) : baseRate;
    if (isNaN(base)) return null;

    // Se há um override para esta parcela, usá-lo diretamente
    const override = taxaFinalOverrides[String(parcela)];
    if (override != null) return override;

    // Caso contrário, calcular base + antecipação
    const prazoDias = prazo === 'FLUXO' ? 0 : (parseInt(String(prazo).replace('D+', '')) || 1);
    let taxaAntecipacao = 0;
    if (prazo !== 'FLUXO' && taxaRAV > 0) {
      let soma = 0;
      for (let i = 1; i <= parcela; i++) {
        const diasVenc = i * 30;
        const diasAntecip = diasVenc - prazoDias;
        if (diasAntecip > 0) soma += (diasAntecip / 30) * taxaRAV;
      }
      taxaAntecipacao = soma / parcela;
    }
    return base + taxaAntecipacao;
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b-2 border-[#2bc196]/20">
            <th className="text-left py-3 px-4 font-semibold text-[#002443]/70">Faixa</th>
            {BANDEIRAS.map(b => (
              <th key={b.id} className="text-center py-3 px-4 font-semibold text-[#002443]">{b.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {FAIXAS.map(f => (
            <tr key={f.key} className="border-b border-slate-100 hover:bg-slate-50/50">
              <td className="py-3 px-4 font-medium text-[#002443]/80">{f.label}</td>
              {BANDEIRAS.map(b => {
                const baseRate = getTaxa(taxas, b.id, f.key);
                const isOverrideBandeira = OVERRIDE_BANDEIRAS.has(b.id);
                const hasOverride = isOverrideBandeira && taxaFinalOverrides[String(f.representativeParcela)] != null;

                // Para Visa e Mastercard: mostrar taxa final (com override ou base+antecipação)
                // Para demais bandeiras: mostrar apenas a taxa base (sem antecipação)
                const displayValue = isOverrideBandeira
                  ? calcFinalRate(baseRate, f.representativeParcela)
                  : baseRate;

                return (
                  <td key={b.id} className={`py-3 px-4 text-center font-bold ${hasOverride ? 'text-amber-600' : 'text-[#2bc196]'}`}>
                    {formatVal(displayValue)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}