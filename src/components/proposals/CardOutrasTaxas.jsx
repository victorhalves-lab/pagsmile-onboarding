import React from 'react';
import { Label } from '@/components/ui/label';
import TaxaInput from './TaxaInput';
import { Check } from 'lucide-react';

export default function CardOutrasTaxas({ rates, onUpdateRates }) {
  const pixTipo = rates?.pix?.tipo || 'percentual';

  const updatePix = (field, value) => {
    onUpdateRates({
      ...rates,
      pix: { ...rates?.pix, [field]: value }
    });
  };

  const updateField = (field, value) => {
    onUpdateRates({ ...rates, [field]: value });
  };

  return (
    <div className="space-y-4 pt-4 border-t border-white/10">
      <h2 className="text-base font-semibold text-white">Outras Taxas</h2>
      
      <div className="bg-[#18181b] p-4 rounded-lg border border-white/5 space-y-5">
          {/* PIX Section */}
          <div className="space-y-3">
              <Label className="text-xs text-slate-400">Tipo de cobrança PIX</Label>
              <div className="grid grid-cols-2 gap-3 p-1 bg-[#09090b] rounded-lg border border-white/5">
                <button
                  onClick={() => updatePix('tipo', 'percentual')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                    pixTipo === 'percentual' 
                      ? 'bg-[#18181b] text-[#2bc196] border border-[#2bc196]/50 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {pixTipo === 'percentual' && <Check className="w-3 h-3" />}
                  % Percentual
                </button>
                <button
                  onClick={() => updatePix('tipo', 'fixo')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                    pixTipo === 'fixo' 
                      ? 'bg-[#18181b] text-white border border-white/20 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {pixTipo === 'fixo' && <Check className="w-3 h-3" />}
                  R$ Fixo
                </button>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Valor PIX</Label>
                <div className="relative">
                    <TaxaInput
                      value={rates?.pix?.valor || ''}
                      onChange={(val) => updatePix('valor', val)}
                      placeholder="0,00"
                      className="bg-[#09090b] border-white/10 text-white h-10 pr-8 text-right"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
                        {pixTipo === 'percentual' ? '%' : ''}
                    </span>
                    {pixTipo === 'fixo' && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">R$</span>
                    )}
                </div>
              </div>
          </div>
          
          {/* Other Rates Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Fee por Transação</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">R$</span>
                    <TaxaInput
                      value={rates?.feeTransacao || ''}
                      onChange={(val) => updateField('feeTransacao', val)}
                      placeholder="0,00"
                      className="bg-[#09090b] border-white/10 text-white h-10 pl-8 text-right"
                    />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Taxa Boleto</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">R$</span>
                    <TaxaInput
                      value={rates?.boleto || ''}
                      onChange={(val) => updateField('boleto', val)}
                      placeholder="0,00"
                      className="bg-[#09090b] border-white/10 text-white h-10 pl-8 text-right"
                    />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-400">Alerta Pré-Chargeback</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">R$</span>
                    <TaxaInput
                      value={rates?.alertaPreChargeback || ''}
                      onChange={(val) => updateField('alertaPreChargeback', val)}
                      placeholder="0,00"
                      className="bg-[#09090b] border-white/10 text-white h-10 pl-8 text-right"
                    />
                </div>
              </div>
              
              <div className="col-span-2 space-y-3 pt-2 mt-2 border-t border-white/5">
                <Label className="text-xs text-slate-400">TPV Mínimo Garantido</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-slate-500">Mês 1</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">R$</span>
                        <TaxaInput
                          value={rates?.minimoGarantido?.mes1 || ''}
                          onChange={(val) => updateField('minimoGarantido', { ...rates.minimoGarantido, mes1: val })}
                          placeholder="0,00"
                          className="bg-[#09090b] border-white/10 text-white h-10 pl-8 text-right text-xs"
                        />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-slate-500">Mês 2</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">R$</span>
                        <TaxaInput
                          value={rates?.minimoGarantido?.mes2 || ''}
                          onChange={(val) => updateField('minimoGarantido', { ...rates.minimoGarantido, mes2: val })}
                          placeholder="0,00"
                          className="bg-[#09090b] border-white/10 text-white h-10 pl-8 text-right text-xs"
                        />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-slate-500">Mês 3 em diante</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">R$</span>
                        <TaxaInput
                          value={rates?.minimoGarantido?.mes3 || ''}
                          onChange={(val) => updateField('minimoGarantido', { ...rates.minimoGarantido, mes3: val })}
                          placeholder="0,00"
                          className="bg-[#09090b] border-white/10 text-white h-10 pl-8 text-right text-xs"
                        />
                    </div>
                  </div>
                </div>
              </div>
          </div>
      </div>
    </div>
  );
}