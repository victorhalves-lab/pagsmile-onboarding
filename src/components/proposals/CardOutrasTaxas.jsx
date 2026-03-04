import React from 'react';
import { Label } from '@/components/ui/label';
import { Check, Banknote } from 'lucide-react';
import TaxaInput from './TaxaInput';

export default function CardOutrasTaxas({ rates, onUpdateRates }) {
  const pixTipo = rates?.pix?.tipo || 'percentual';
  const updatePix = (field, value) => onUpdateRates({ ...rates, pix: { ...rates?.pix, [field]: value } });
  const updateField = (field, value) => onUpdateRates({ ...rates, [field]: value });

  const labelCls = "text-[10px] text-[#2bc196]/70 font-semibold uppercase tracking-wider";
  const inputCls = "bg-white/5 border-white/10 text-white h-11 rounded-xl placeholder:text-white/15 focus:border-[#2bc196] focus:ring-1 focus:ring-[#2bc196]";

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-[#2bc196]/10 flex items-center justify-center"><Banknote className="w-3.5 h-3.5 text-[#2bc196]" /></div>
        <h2 className="text-sm font-bold text-white">Outras Taxas</h2>
      </div>

      {/* PIX */}
      <div className="space-y-3">
        <Label className={labelCls}>PIX</Label>
        <div className="flex gap-2 mb-2">
          {[{ v: 'percentual', l: '% Percentual' }, { v: 'fixo', l: 'R$ Fixo' }].map(opt => (
            <button key={opt.v} onClick={() => updatePix('tipo', opt.v)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                pixTipo === opt.v
                  ? 'bg-[#2bc196] text-[#002443] shadow-lg shadow-[#2bc196]/20'
                  : 'bg-white/5 text-white/30 hover:text-white/50 border border-white/5'
              }`}>
              {pixTipo === opt.v && <Check className="w-3 h-3" />} {opt.l}
            </button>
          ))}
        </div>
        <TaxaInput value={rates?.pix?.valor || ''} onChange={(val) => updatePix('valor', val)} placeholder="0,00"
          prefix={pixTipo === 'fixo' ? 'R$' : undefined} suffix={pixTipo === 'percentual' ? '%' : undefined}
          className={`${inputCls} text-right ${pixTipo === 'fixo' ? 'pl-10' : 'pr-10'}`} />
      </div>

      {/* Other fees grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1"><Label className={labelCls}>Fee por Transação</Label>
          <TaxaInput value={rates?.feeTransacao || ''} onChange={(val) => updateField('feeTransacao', val)} placeholder="0,00" prefix="R$" className={`${inputCls} text-right pl-10`} /></div>
        <div className="space-y-1"><Label className={labelCls}>Taxa Boleto</Label>
          <TaxaInput value={rates?.boleto || ''} onChange={(val) => updateField('boleto', val)} placeholder="0,00" prefix="R$" className={`${inputCls} text-right pl-10`} /></div>
        <div className="col-span-2 space-y-1"><Label className={labelCls}>Alerta Pré-Chargeback</Label>
          <TaxaInput value={rates?.alertaPreChargeback || ''} onChange={(val) => updateField('alertaPreChargeback', val)} placeholder="0,00" prefix="R$" className={`${inputCls} text-right pl-10`} /></div>
      </div>

      {/* TPV Mínimo */}
      <div className="space-y-2 pt-3 border-t border-white/5">
        <Label className={labelCls}>TPV Mínimo Mensal Garantido</Label>
        <div className="grid grid-cols-3 gap-2">
          {[{ k: 'mes1', l: 'Mês 1' }, { k: 'mes2', l: 'Mês 2' }, { k: 'mes3', l: 'Mês 3 em diante' }].map(m => (
            <div key={m.k} className="space-y-1">
              <p className="text-[9px] text-white text-center">{m.l}</p>
              <TaxaInput value={rates?.minimoGarantido?.[m.k] || ''} onChange={(val) => updateField('minimoGarantido', { ...rates.minimoGarantido, [m.k]: val })} placeholder="0,00" prefix="R$" className={`${inputCls} text-right pl-10 text-sm`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}