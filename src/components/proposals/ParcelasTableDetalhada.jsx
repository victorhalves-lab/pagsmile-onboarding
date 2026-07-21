import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calcularTabelaParcelas } from './ParcelasTable';
import AnticipationSimulator from './AnticipationSimulator';
import { getOverridesForPrazo } from '@/lib/overridesUtils';

const BANDEIRAS = [
  { id: 'mastercard', label: 'Mastercard' },
  { id: 'visa', label: 'Visa' },
  { id: 'elo', label: 'Elo' },
  { id: 'amex', label: 'Amex' },
];

function getTaxasForBandeira(taxas, bandeira) {
  if (!taxas) return {};
  if (taxas.credito_1x) {
    return {
      avista: taxas.credito_1x?.[bandeira] || 0,
      de2a6x: taxas.credito_2_6x?.[bandeira] || 0,
      de7a12x: taxas.credito_7_12x?.[bandeira] || 0,
      de13a21x: taxas.credito_13_21x?.[bandeira] || 0,
    };
  }
  if (taxas.cartao?.[bandeira]) {
    return taxas.cartao[bandeira];
  }
  return {};
}

export default function ParcelasTableDetalhada({ taxas, taxaRAV = 0, prazo = 'D+1', showSimulator = false, taxaFinalOverrides = {}, hideCalculationColumns = false, hideRange13a21 = false }) {
  const [activeBandeira, setActiveBandeira] = useState('mastercard');
  const [simulatedPrazo, setSimulatedPrazo] = useState(prazo);
  
  const activePrazo = showSimulator ? simulatedPrazo : prazo;
  const prazoOverrides = getOverridesForPrazo(taxaFinalOverrides, activePrazo);
  const currentTaxas = getTaxasForBandeira(taxas, activeBandeira);
  const allRows = calcularTabelaParcelas(currentTaxas, taxaRAV, activePrazo);
  const rows = hideRange13a21 ? allRows.filter(r => r.parcela <= 12) : allRows;
  const isSimulating = showSimulator && simulatedPrazo !== prazo;

  return (
    <div className="space-y-4">
      {showSimulator && taxaRAV > 0 && (
        <AnticipationSimulator
          originalPrazo={prazo}
          activePrazo={simulatedPrazo}
          onPrazoChange={setSimulatedPrazo}
        />
      )}

      <Tabs value={activeBandeira} onValueChange={setActiveBandeira}>
        <TabsList className="grid grid-cols-4 mb-4">
          {BANDEIRAS.map(b => (
            <TabsTrigger key={b.id} value={b.id} className="text-xs">{b.label}</TabsTrigger>
          ))}
        </TabsList>

        {BANDEIRAS.map(b => (
          <TabsContent key={b.id} value={b.id}>
            {(() => {
              const hideCols = hideCalculationColumns && (b.id === 'mastercard' || b.id === 'visa');
              return (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[#1356E2]/20">
                    <th className="text-left py-2 px-3 font-semibold text-[#0A0A0A]/70">Parcelas</th>
                    {!hideCols && (
                      <th className="text-right py-2 px-3 font-semibold text-[#0A0A0A]/70">Base</th>
                    )}
                    {!hideCols && taxaRAV > 0 && activePrazo !== 'FLUXO' && (
                      <th className="text-right py-2 px-3 font-semibold text-amber-600">
                        Antecipação{isSimulating ? ` (${simulatedPrazo})` : ''}
                      </th>
                    )}
                    <th className="text-right py-2 px-3 font-semibold text-[#FEA500]">Taxa</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => (
                    <tr key={r.parcela} className="border-b border-[#0A0A0A]/5 hover:bg-[#1356E2]/5">
                      <td className="py-2 px-3 font-medium">{r.parcela}x</td>
                      {!hideCols && (
                        <td className="py-2 px-3 text-right">{r.taxaBase.toFixed(2)}%</td>
                      )}
                      {!hideCols && taxaRAV > 0 && activePrazo !== 'FLUXO' && (
                        <td className="py-2 px-3 text-right text-amber-600">
                          {r.taxaAntecipacao > 0 ? `+${r.taxaAntecipacao.toFixed(2)}%` : '-'}
                        </td>
                      )}
                      {(() => {
                        const applyOverride = (b.id === 'mastercard' || b.id === 'visa') && prazoOverrides[String(r.parcela)] != null;
                        const val = applyOverride ? prazoOverrides[String(r.parcela)] : r.taxaFinal;
                        return (
                          <td className={`py-2 px-3 text-right font-bold ${applyOverride ? 'text-amber-500' : 'text-[#FEA500]'}`}>
                            {val.toFixed(2)}%
                          </td>
                        );
                      })()}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
              );
            })()}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}