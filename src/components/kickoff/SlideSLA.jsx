import React from 'react';
import SlideLayout from './SlideLayout';

export default function SlideSLA({ contract = {}, slideNumber, totalSlides }) {
  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <h2 className="text-xl font-bold text-[#002443] mb-1">SLAs & Reservas de Segurança</h2>
      <p className="text-[10px] text-[#002443]/50 mb-4">Compromissos de nível de serviço e gestão de risco</p>

      <div className="grid grid-cols-2 gap-4 flex-1 content-start">
        {/* SLA */}
        <div className="bg-[#f4f4f4] rounded-xl p-4">
          <h3 className="text-[10px] font-bold text-[#002443]/60 uppercase tracking-wide mb-3">SLA da Plataforma</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-[10px] text-[#002443]/60">Uptime</span>
              <span className="text-xs font-bold text-[#2bc196]">{contract.slaUptime || '99.5%'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[10px] text-[#002443]/60">Tempo Resposta API</span>
              <span className="text-xs font-bold text-[#002443]">{contract.slaResponseTime || '< 600ms'}</span>
            </div>
          </div>
        </div>

        {/* Suporte */}
        <div className="bg-[#f4f4f4] rounded-xl p-4">
          <h3 className="text-[10px] font-bold text-[#002443]/60 uppercase tracking-wide mb-3">Suporte Técnico</h3>
          <div className="space-y-1.5">
            {[
              { level: 'Crítico', sla: contract.supportCriticalSLA || 'Até 1h', color: 'bg-red-500' },
              { level: 'Alto', sla: contract.supportHighSLA || 'Até 6h', color: 'bg-orange-400' },
              { level: 'Médio', sla: contract.supportMediumSLA || 'Até 1 dia', color: 'bg-yellow-400' },
              { level: 'Baixo', sla: contract.supportLowSLA || 'Até 5 dias', color: 'bg-green-400' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                <span className="text-[10px] text-[#002443]/60 flex-1">{item.level}</span>
                <span className="text-[10px] font-bold text-[#002443]">{item.sla}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Reservas */}
        <div className="bg-[#f4f4f4] rounded-xl p-4 col-span-2">
          <h3 className="text-[10px] font-bold text-[#002443]/60 uppercase tracking-wide mb-3">Reservas de Segurança (Rolling Reserve)</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <span className="text-[10px] font-semibold text-[#002443] block mb-2">PIX</span>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[10px] text-[#002443]/60">Percentual</span>
                  <span className="text-xs font-bold text-[#002443]">{contract.pixRiskReservePercentage != null ? `${contract.pixRiskReservePercentage}%` : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-[#002443]/60">Dias de Retenção</span>
                  <span className="text-xs font-bold text-[#002443]">{contract.pixRiskReserveDays != null ? `${contract.pixRiskReserveDays} dias` : '—'}</span>
                </div>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-[#002443] block mb-2">Cartão</span>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[10px] text-[#002443]/60">Percentual</span>
                  <span className="text-xs font-bold text-[#002443]">{contract.cardRiskReservePercentage != null ? `${contract.cardRiskReservePercentage}%` : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-[#002443]/60">Dias de Retenção</span>
                  <span className="text-xs font-bold text-[#002443]">{contract.cardRiskReserveDays != null ? `${contract.cardRiskReserveDays} dias` : '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-[#002443]/60">Liberação Parcial</span>
                  <span className="text-xs font-bold text-[#002443]">{contract.cardRiskReservePartialReleaseDays != null ? `${contract.cardRiskReservePartialReleaseDays} dias` : '—'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SlideLayout>
  );
}