import React, { useState } from 'react';
import { Layers, Info } from 'lucide-react';
import TaxasPorBandeiraPublic from './TaxasPorBandeiraPublic';
import ParcelasTableDetalhada from './ParcelasTableDetalhada';

/**
 * Render público para propostas Multi-MCC.
 * Mostra abas (uma por MCC) com taxas de cartão + tabela de parcelas.
 * Antecipação, prazo e demais taxas seguem únicas para o pacote inteiro.
 */
export default function TaxasPorBandeiraPublicMulti({
  cartaoPorMcc,
  rates,
  taxaRAV,
  prazo,
  hideRange13a21,
  hideCalculationColumns,
  taxaFinalOverrides,
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  if (!Array.isArray(cartaoPorMcc) || cartaoPorMcc.length === 0) return null;

  const active = cartaoPorMcc[activeIdx];
  // Para reutilizar TaxasPorBandeiraPublic + ParcelasTableDetalhada, montamos um
  // "rates virtual" com cartao do MCC ativo. As demais propriedades (rav, taxas extras)
  // permanecem do pacote.
  const virtualRates = { ...rates, cartao: active?.cartao || {} };

  return (
    <div className="space-y-3">
      {/* Banner informativo */}
      <div className="rounded-xl border border-[#1356E2]/30 bg-[#1356E2]/5 px-4 py-3 flex items-start gap-3">
        <Layers className="w-4 h-4 text-[#E84B1C] mt-0.5 flex-shrink-0" />
        <div className="text-xs text-[#0A0A0A]/80 leading-relaxed">
          <p className="font-semibold mb-0.5">Esta proposta cobre {cartaoPorMcc.length} MCCs.</p>
          <p>As taxas de cartão variam por MCC. Antecipação, prazos e demais condições são únicas para todos.</p>
        </div>
      </div>

      {/* Abas de MCC */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {cartaoPorMcc.map((entry, idx) => (
          <button
            key={`${entry.mcc}-${idx}`}
            onClick={() => setActiveIdx(idx)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
              activeIdx === idx
                ? 'bg-[#1356E2] text-white shadow-md shadow-[#1356E2]/20'
                : 'bg-slate-100 text-[#0A0A0A]/60 hover:bg-slate-200'
            }`}
          >
            <span className="font-mono">MCC {entry.mcc}</span>
            <span className="opacity-90 max-w-[180px] truncate">{entry.mccLabel}</span>
          </button>
        ))}
      </div>

      {/* Tabela de bandeiras × faixas do MCC ativo */}
      <div className="pt-2">
        <TaxasPorBandeiraPublic taxas={virtualRates} hideRange13a21={hideRange13a21} />
      </div>

      {/* Tabela detalhada de parcelas do MCC ativo */}
      <div className="pt-4 border-t border-slate-100">
        <p className="text-xs font-semibold text-[#0A0A0A]/60 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" />
          Tabela de Parcelas — MCC {active?.mcc} ({active?.mccLabel})
        </p>
        <ParcelasTableDetalhada
          taxas={virtualRates}
          taxaRAV={taxaRAV}
          prazo={prazo}
          showSimulator={!hideCalculationColumns}
          taxaFinalOverrides={taxaFinalOverrides || {}}
          hideCalculationColumns={hideCalculationColumns}
          hideRange13a21={hideRange13a21}
        />
      </div>
    </div>
  );
}