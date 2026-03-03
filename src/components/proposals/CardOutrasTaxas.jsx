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
    <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-6 space-y-4">
      <h2 className="text-base font-bold text-[#002443]">Outras Taxas</h2>
      
      <div className="bg-[#f4f4f4] p-4 rounded-xl border border-[#002443]/5 space-y-5">
          {/* PIX Section */}
          <div className="space-y-3">
              <Label className="text-xs text-[#282828]/50 font-medium">Tipo de cobrança PIX</Label>
              <div className="grid grid-cols-2 gap-3 p-1 bg-white rounded-xl border border-[#002443]/5">
                <button
                  onClick={() => updatePix('tipo', 'percentual')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    pixTipo === 'percentual' 
                      ? 'bg-[#2bc196]/10 text-[#2bc196] border border-[#2bc196]/30 shadow-sm' 
                      : 'text-[#282828]/50 hover:text-[#002443]'
                  }`}
                >
                  {pixTipo === 'percentual' && <Check className="w-3 h-3" />}
                  % Percentual
                </button>
                <button
                  onClick={() => updatePix('tipo', 'fixo')}
                  className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${
                    pixTipo === 'fixo' 
                      ? 'bg-[#002443]/10 text-[#002443] border border-[#002443]/20 shadow-sm' 
                      : 'text-[#282828]/50 hover:text-[#002443]'
                  }`}
                >
                  {pixTipo === 'fixo' && <Check className="w-3 h-3" />}
                  R$ Fixo
                </button>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs text-[#282828]/50 font-medium">Valor PIX</Label>
                <div className="relative">
                    <TaxaInput
                      value={rates?.pix?.valor || ''}
                      onChange={(val) => updatePix('valor', val)}
                      placeholder="0,00"
                      className="bg-white border-[#002443]/10 text-[#002443] h-10 pr-8 text-right rounded-lg"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#282828]/40">
                        {pixTipo === 'percentual' ? '%' : ''}
                    </span>
                    {pixTipo === 'fixo' && (
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#282828]/40">R$</span>
                    )}
                </div>
              </div>
          </div>
          
          {/* Other Rates Grid */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-[#002443]/5">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#282828]/50 font-medium">Fee por Transação</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#282828]/40">R$</span>
                    <TaxaInput
                      value={rates?.feeTransacao || ''}
                      onChange={(val) => updateField('feeTransacao', val)}
                      placeholder="0,00"
                      className="bg-white border-[#002443]/10 text-[#002443] h-10 pl-8 text-right rounded-lg"
                    />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs text-[#282828]/50 font-medium">Taxa Boleto</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#282828]/40">R$</span>
                    <TaxaInput
                      value={rates?.boleto || ''}
                      onChange={(val) => updateField('boleto', val)}
                      placeholder="0,00"
                      className="bg-white border-[#002443]/10 text-[#002443] h-10 pl-8 text-right rounded-lg"
                    />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs text-[#282828]/50 font-medium">Alerta Pré-Chargeback</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#282828]/40">R$</span>
                    <TaxaInput
                      value={rates?.alertaPreChargeback || ''}
                      onChange={(val) => updateField('alertaPreChargeback', val)}
                      placeholder="0,00"
                      className="bg-white border-[#002443]/10 text-[#002443] h-10 pl-8 text-right rounded-lg"
                    />
                </div>
              </div>
              
              <div className="col-span-2 space-y-3 pt-2 mt-2 border-t border-[#002443]/5">
                <Label className="text-xs text-[#282828]/50 font-medium">TPV Mínimo Garantido</Label>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-[#282828]/40">Mês 1</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#282828]/40">R$</span>
                        <TaxaInput
                          value={rates?.minimoGarantido?.mes1 || ''}
                          onChange={(val) => updateField('minimoGarantido', { ...rates.minimoGarantido, mes1: val })}
                          placeholder="0,00"
                          className="bg-white border-[#002443]/10 text-[#002443] h-10 pl-8 text-right text-xs rounded-lg"
                        />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-[#282828]/40">Mês 2</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#282828]/40">R$</span>
                        <TaxaInput
                          value={rates?.minimoGarantido?.mes2 || ''}
                          onChange={(val) => updateField('minimoGarantido', { ...rates.minimoGarantido, mes2: val })}
                          placeholder="0,00"
                          className="bg-white border-[#002443]/10 text-[#002443] h-10 pl-8 text-right text-xs rounded-lg"
                        />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] text-[#282828]/40">Mês 3 em diante</Label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#282828]/40">R$</span>
                        <TaxaInput
                          value={rates?.minimoGarantido?.mes3 || ''}
                          onChange={(val) => updateField('minimoGarantido', { ...rates.minimoGarantido, mes3: val })}
                          placeholder="0,00"
                          className="bg-white border-[#002443]/10 text-[#002443] h-10 pl-8 text-right text-xs rounded-lg"
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