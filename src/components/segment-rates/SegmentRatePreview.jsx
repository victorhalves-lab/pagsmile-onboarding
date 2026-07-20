import React, { useState } from 'react';
import { CreditCard, Smartphone, ReceiptText, Repeat, Eye, Clock } from 'lucide-react';
import { calcularTabelaParcelas } from '@/components/proposals/ParcelasTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PRAZO_OPTIONS = [
  { value: 'D+2', label: 'D+2' },
  { value: 'D+7', label: 'D+7' },
  { value: 'D+15', label: 'D+15' },
  { value: 'D+30', label: 'D+30' },
  { value: 'FLUXO', label: 'No Fluxo' },
];

function fmtPct(v) {
  return (v != null && !isNaN(v)) ? `${Number(v).toFixed(2)}%` : '—';
}

function fmtBrl(v) {
  return (v != null && !isNaN(v)) ? `R$ ${Number(v).toFixed(2).replace('.', ',')}` : '—';
}

function ParcelasSimulation({ data, prazo }) {
  const taxas = {
    avista: data.mdrAvista || 0,
    de2a6x: data.mdr2a6x || 0,
    de7a12x: data.mdr7a12x || 0,
    de13a21x: data.mdr13a21x || 0,
  };
  const rows = calcularTabelaParcelas(taxas, data.percentualAntecipacao || 0, prazo);
  const showAntecipacao = (data.percentualAntecipacao || 0) > 0 && prazo !== 'FLUXO';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b-2 border-[#1356E2]/20">
            <th className="text-left py-2 px-2 font-semibold text-[#0A0A0A]/70">Parcela</th>
            <th className="text-right py-2 px-2 font-semibold text-[#0A0A0A]/70">Base</th>
            {showAntecipacao && <th className="text-right py-2 px-2 font-semibold text-amber-600">Antecipação</th>}
            <th className="text-right py-2 px-2 font-semibold text-[#1356E2]">Taxa Final</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.parcela} className="border-b border-[#0A0A0A]/5 hover:bg-[#1356E2]/5">
              <td className="py-1.5 px-2 font-medium">{r.parcela}x</td>
              <td className="py-1.5 px-2 text-right">{r.taxaBase.toFixed(2)}%</td>
              {showAntecipacao && (
                <td className="py-1.5 px-2 text-right text-amber-600">
                  {r.taxaAntecipacao > 0 ? `+${r.taxaAntecipacao.toFixed(2)}%` : '—'}
                </td>
              )}
              <td className="py-1.5 px-2 text-right font-bold text-[#1356E2]">{r.taxaFinal.toFixed(2)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function SegmentRatePreview({ data }) {
  const [prazo, setPrazo] = useState('D+2');

  if (!data) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <Eye className="w-4 h-4 text-[#1356E2]" />
        <h3 className="text-sm font-bold text-[#0A0A0A]">Pré-visualização das Taxas</h3>
      </div>

      {/* MDR Summary */}
      <div className="bg-[#0A0A0A] rounded-xl p-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-[#1356E2]/8 rounded-full blur-[60px]" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-4 h-4" style={{ color: '#1356E2' }} />
            <span className="text-xs font-bold" style={{ color: '#ffffff' }}>Cartão de Crédito</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: '1x', value: data.mdrAvista },
              { label: '2–6x', value: data.mdr2a6x },
              { label: '7–12x', value: data.mdr7a12x },
              { label: '13–21x', value: data.mdr13a21x },
            ].map(r => (
              <div key={r.label} className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-2 py-3 text-center">
                <p className="text-[10px] font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{r.label}</p>
                <p className="text-lg font-extrabold" style={{ color: '#1356E2' }}>
                  {fmtPct(r.value)}
                </p>
              </div>
            ))}
          </div>

          {/* Antecipação */}
          <div className="mt-3 bg-[#1356E2]/10 border border-[#1356E2]/20 rounded-lg p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Repeat className="w-3.5 h-3.5" style={{ color: '#1356E2' }} />
              <span className="text-xs font-bold" style={{ color: '#ffffff' }}>Antecipação</span>
            </div>
            <span className="text-lg font-extrabold" style={{ color: '#1356E2' }}>{fmtPct(data.percentualAntecipacao)} <span className="text-[10px]" style={{ color: 'rgba(43,193,150,0.6)' }}>a.m.</span></span>
          </div>
        </div>
      </div>

      {/* PIX */}
      <div className="bg-white border border-[#1356E2]/20 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Smartphone className="w-4 h-4 text-[#1356E2]" />
          <span className="text-xs font-bold text-[#0A0A0A]">PIX</span>
        </div>
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-[10px] font-semibold text-[#0A0A0A]/50 mb-0.5">Percentual</p>
            <p className="text-xl font-extrabold text-[#1356E2]">{fmtPct(data.pixTaxaPercentual)}</p>
          </div>
          <span className="text-xs font-bold text-[#0A0A0A]/20">ou</span>
          <div className="text-center">
            <p className="text-[10px] font-semibold text-[#0A0A0A]/50 mb-0.5">Fixa</p>
            <p className="text-xl font-extrabold text-[#1356E2]">{fmtBrl(data.pixTaxaFixa)}</p>
          </div>
        </div>
      </div>

      {/* Taxas Adicionais */}
      <div className="bg-white border border-[#0A0A0A]/8 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <ReceiptText className="w-4 h-4 text-[#0A0A0A]/50" />
          <span className="text-xs font-bold text-[#0A0A0A]">Taxas Adicionais</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Fee/Transação', value: fmtBrl(data.feeTransacao) },
            { label: 'Antifraude', value: fmtBrl(data.antifraude) },
            { label: '3DS', value: fmtBrl(data.taxa3ds) },
            { label: 'Boleto', value: fmtBrl(data.boleto) },
          ].map(item => (
            <div key={item.label} className="bg-[#f4f4f4] rounded-lg p-2.5 text-center">
              <p className="text-[10px] font-semibold text-[#0A0A0A]/50">{item.label}</p>
              <p className="text-sm font-bold text-[#0A0A0A]">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Simulação de Parcelas */}
      <div className="bg-white border border-[#0A0A0A]/8 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-[#1356E2]" />
          <span className="text-xs font-bold text-[#0A0A0A]">Simulação de Parcelas</span>
        </div>

        {/* Prazo selector */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {PRAZO_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setPrazo(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                prazo === opt.value
                  ? 'bg-[#1356E2] text-white shadow-sm'
                  : 'bg-[#f4f4f4] text-[#0A0A0A]/50 hover:bg-[#1356E2]/10 hover:text-[#0A0A0A]'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <ParcelasSimulation data={data} prazo={prazo} />
      </div>
    </div>
  );
}