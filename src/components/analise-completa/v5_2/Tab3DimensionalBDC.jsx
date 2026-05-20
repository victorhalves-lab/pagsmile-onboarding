import React from 'react';
import AnaliseBdcCompleta from '../AnaliseBdcCompleta';

/**
 * [V5.2 Fase 6.4-B] Aba 3 — Análise Dimensional BDC (DOC6 §2.6.5).
 * Reaproveita o componente V4 `AnaliseBdcCompleta` que já organiza datasets BDC
 * por dimensão analítica. Sidebar 13 dimensões + DatasetCard 4 estados serão
 * adicionados em fase futura quando o catálogo Dataset V5.2 estiver 100% seedado.
 */
export default function Tab3DimensionalBDC({ bdcValidations, bdcLogs, merchant, latestScore, responses }) {
  return (
    <AnaliseBdcCompleta
      bdcValidations={bdcValidations}
      bdcLogs={bdcLogs}
      merchant={merchant}
      latestScore={latestScore}
      responses={responses}
    />
  );
}