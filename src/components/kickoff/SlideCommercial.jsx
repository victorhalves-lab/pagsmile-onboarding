import React from 'react';
import { motion } from 'framer-motion';
import SlideLayout from './SlideLayout';

const fmtBRL = (v) => v != null ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—';

export default function SlideCommercial({ contract = {}, rates = {}, slideNumber, totalSlides }) {
  const rav = rates.rav || {};

  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <h2 className="text-xl font-bold text-[#002443] mb-1">Condições Comerciais</h2>
      <p className="text-[10px] text-[#002443]/50 mb-4">Termos principais da operação</p>

      <div className="grid grid-cols-2 gap-4 flex-1 content-start">
        {/* TPV Mínimo */}
        <div className="bg-[#f4f4f4] rounded-xl p-4">
          <h3 className="text-[10px] font-bold text-[#002443]/60 uppercase tracking-wide mb-3">Volume Mínimo Garantido (TPV)</h3>
          <div className="space-y-2">
            {[
              { label: 'Mês 1', value: contract.projectedTpvMonth1 },
              { label: 'Mês 2', value: contract.projectedTpvMonth2 },
              { label: 'Mês 3 em diante', value: contract.projectedTpvMonth3 },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[10px] text-[#002443]/60">{item.label}</span>
                <span className="text-xs font-bold font-mono text-[#002443]">{fmtBRL(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Termos Gerais */}
        <div className="bg-[#f4f4f4] rounded-xl p-4">
          <h3 className="text-[10px] font-bold text-[#002443]/60 uppercase tracking-wide mb-3">Termos Gerais</h3>
          <div className="space-y-2">
            {[
              { label: 'Taxa de Setup', value: fmtBRL(contract.setupFee ?? 6000) },
              { label: 'Prazo de Liquidação', value: rav.prazo || contract.paymentTerm || '—' },
              { label: 'Duração do Contrato', value: contract.contractDurationMonths ? `${contract.contractDurationMonths} meses` : '—' },
              { label: 'Chargeback', value: 'R$ 65,00 por disputa' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[10px] text-[#002443]/60">{item.label}</span>
                <span className="text-xs font-bold text-[#002443]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Multa Rescisória */}
        <div className="bg-[#f4f4f4] rounded-xl p-4 col-span-2">
          <h3 className="text-[10px] font-bold text-[#002443]/60 uppercase tracking-wide mb-3">Rescisão Antecipada</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[9px] text-[#002443]/50 block">Multa Contratante</span>
              <span className="text-xs font-bold text-[#002443]">
                {contract.earlyTerminationPenaltyPercentage ? `${contract.earlyTerminationPenaltyPercentage}%` : '—'}
                {contract.earlyTerminationPenaltyMaxAmount ? ` (máx ${fmtBRL(contract.earlyTerminationPenaltyMaxAmount)})` : ''}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-[#002443]/50 block">Multa Pagsmile</span>
              <span className="text-xs font-bold text-[#002443]">
                {contract.pagsmileEarlyTerminationPenaltyPercentage ? `${contract.pagsmileEarlyTerminationPenaltyPercentage}%` : '—'}
                {contract.pagsmileEarlyTerminationPenaltyMaxAmount ? ` (máx ${fmtBRL(contract.pagsmileEarlyTerminationPenaltyMaxAmount)})` : ''}
              </span>
            </div>
          </div>
        </div>
      </div>
    </SlideLayout>
  );
}