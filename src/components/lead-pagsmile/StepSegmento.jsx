import React from 'react';
import SegmentCards from './SegmentCards';
import CnaeCoherenceAlert from '../leads/CnaeCoherenceAlert';

/** ETAPA 1 — Tipo de Negócio (P1) */
export default function StepSegmento({ form, updateField, cnpjData }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-[#002443]">Sua empresa é principalmente um(a):</h2>
        <p className="text-xs text-[#002443]/50 mt-1">Selecione o tipo que melhor descreve seu negócio</p>
      </div>
      <SegmentCards value={form.segmento} onChange={(v) => updateField('segmento', v)} />
      {cnpjData && form.segmento && (
        <CnaeCoherenceAlert cnpjData={cnpjData} selectedType={form.segmento} />
      )}
    </div>
  );
}