import React from 'react';
import { Label } from '@/components/ui/label';
import { Check, Banknote, AlertTriangle } from 'lucide-react';
import TaxaInput from './TaxaInput';
import { getFeeLimits } from '@/lib/partnerLimits';

export default function CardOutrasTaxas({ rates, onUpdateRates, partner, readOnly = false }) {
  const pixTipo = rates?.pix?.tipo || 'percentual';
  const updatePix = (field, value) => onUpdateRates({ ...rates, pix: { ...rates?.pix, [field]: value } });
  const updateField = (field, value) => onUpdateRates({ ...rates, [field]: value });

  const labelCls = "text-[10px] text-[#FEA500]/80 font-semibold uppercase tracking-wider";
  const inputCls = "bg-white/5 border-white/10 text-white h-11 rounded-xl placeholder:text-white/15 focus:border-[#1356E2] focus:ring-1 focus:ring-[#1356E2]";

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-[#1356E2]/10 flex items-center justify-center"><Banknote className="w-3.5 h-3.5 text-[#E84B1C]" /></div>
        <h2 className="text-sm font-bold text-white">Outras Taxas</h2>
      </div>

      {/* PIX */}
      <div className="space-y-3">
        <Label className={labelCls}>PIX</Label>
        <div className="flex gap-2 mb-2">
          {[{ v: 'percentual', l: '% Percentual' }, { v: 'fixo', l: 'R$ Fixo' }].map(opt => (
            <button key={opt.v} onClick={() => !readOnly && updatePix('tipo', opt.v)} disabled={readOnly}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                pixTipo === opt.v
                  ? 'bg-[#1356E2] text-[#0A0A0A] shadow-lg shadow-[#1356E2]/20'
                  : 'bg-white/5 text-white/30 hover:text-white/50 border border-white/5'
              }`}>
              {pixTipo === opt.v && <Check className="w-3 h-3" />} {opt.l}
            </button>
          ))}
        </div>
        <TaxaInput value={rates?.pix?.valor || ''} onChange={(val) => !readOnly && updatePix('valor', val)} placeholder="0,00"
          prefix={pixTipo === 'fixo' ? 'R$' : undefined} suffix={pixTipo === 'percentual' ? '%' : undefined}
          isCurrency={pixTipo === 'fixo'} disabled={readOnly}
          className={`${inputCls} text-right ${pixTipo === 'fixo' ? 'pl-10' : 'pr-10'} ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`} />
      </div>

      {/* Other fees grid */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Fee por Transação', key: 'feeTransacao', limitKey: 'feeTransacao' },
          { label: 'Taxa Boleto', key: 'boleto', limitKey: null },
          { label: 'Taxa de Antifraude', key: 'antifraude', limitKey: 'antifraude' },
          { label: 'Alerta Pré-Chargeback', key: 'alertaPreChargeback', limitKey: null },
          { label: 'Custo 3DS', key: 'taxa3ds', limitKey: 'taxa3ds' },
          { label: 'Valor de Setup', key: 'setup', limitKey: null },
          { label: 'Taxa Forex (%)', key: 'forex', limitKey: null, isPercent: true },
        ].map(field => {
          const limits = field.limitKey && partner ? getFeeLimits(partner, field.limitKey) : null;
          const currentVal = parseFloat(String(rates?.[field.key] || '0').replace(/\./g, '').replace(',', '.')) || 0;
          const hasViolation = limits && currentVal > 0 && currentVal < limits.minFee;
          return (
            <div key={field.key} className="space-y-1">
              <Label className={labelCls}>{field.label}</Label>
              <TaxaInput
                value={rates?.[field.key] || ''}
                onChange={(val) => !readOnly && updateField(field.key, val)}
                placeholder="0,00"
                prefix={field.isPercent ? undefined : "R$"}
                suffix={field.isPercent ? "%" : undefined}
                isCurrency={!field.isPercent}
                disabled={readOnly}
                className={`${inputCls} text-right ${field.isPercent ? 'pr-10' : 'pl-10'} ${hasViolation ? 'border-red-400/50 ring-1 ring-red-400/30' : ''} ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
              {limits && (
                <div className="space-y-0.5">
                  <p className="text-[8px] text-white/20">
                    Mín. parceiro: R$ {limits.partnerFee.toFixed(2).replace('.', ',')}
                    {limits.isTuna && ' (Tuna - sem restrição)'}
                  </p>
                  {hasViolation && (
                    <div className="flex items-center gap-1 text-red-400">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span className="text-[8px]">Abaixo do custo do parceiro</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* TPV Mínimo */}
      <div className="space-y-2 pt-3 border-t border-white/5">
        <Label className={labelCls}>TPV Mínimo Mensal Garantido</Label>
        <div className="grid grid-cols-3 gap-2">
          {[{ k: 'mes1', l: 'Mês 1' }, { k: 'mes2', l: 'Mês 2' }, { k: 'mes3', l: 'Mês 3 em diante' }].map(m => (
            <div key={m.k} className="space-y-1">
              <p className="text-[9px] text-white text-center">{m.l}</p>
              <TaxaInput value={rates?.minimoGarantido?.[m.k] || ''} onChange={(val) => !readOnly && updateField('minimoGarantido', { ...rates.minimoGarantido, [m.k]: val })} placeholder="0,00" prefix="R$" isCurrency disabled={readOnly} className={`${inputCls} text-right pl-10 text-sm ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}