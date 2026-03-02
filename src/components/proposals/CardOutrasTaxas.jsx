import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';
import TaxaInput from './TaxaInput';

export default function CardOutrasTaxas({ rates, onUpdate }) {
  const pixTipo = rates?.pix?.tipo || 'percentual';

  const updatePix = (field, value) => {
    onUpdate({
      ...rates,
      pix: { ...rates?.pix, [field]: value }
    });
  };

  const updateField = (field, value) => {
    onUpdate({ ...rates, [field]: value });
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings className="w-5 h-5 text-[var(--pagsmile-green)]" />
          Outras Taxas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* PIX */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Tipo de cobrança PIX</Label>
          <div className="flex gap-2">
            <button
              onClick={() => updatePix('tipo', 'percentual')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all border ${
                pixTipo === 'percentual' 
                  ? 'bg-[var(--pagsmile-green)] text-white border-[var(--pagsmile-green)]' 
                  : 'bg-white text-[var(--pagsmile-blue)]/70 border-slate-200 hover:border-[var(--pagsmile-green)]'
              }`}
            >
              % Percentual
            </button>
            <button
              onClick={() => updatePix('tipo', 'fixo')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all border ${
                pixTipo === 'fixo' 
                  ? 'bg-[var(--pagsmile-green)] text-white border-[var(--pagsmile-green)]' 
                  : 'bg-white text-[var(--pagsmile-blue)]/70 border-slate-200 hover:border-[var(--pagsmile-green)]'
              }`}
            >
              R$ Fixo
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Valor PIX *</Label>
            <TaxaInput
              value={rates?.pix?.valor || ''}
              onChange={(val) => updatePix('valor', val)}
              suffix={pixTipo === 'percentual' ? '%' : ''}
              prefix={pixTipo === 'fixo' ? 'R$' : ''}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Fee por Transação</Label>
            <TaxaInput
              value={rates?.feeTransacao || ''}
              onChange={(val) => updateField('feeTransacao', val)}
              prefix="R$"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Taxa Boleto</Label>
            <TaxaInput
              value={rates?.boleto || ''}
              onChange={(val) => updateField('boleto', val)}
              prefix="R$"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Alerta Pré-Chargeback</Label>
            <TaxaInput
              value={rates?.alertaPreChargeback || ''}
              onChange={(val) => updateField('alertaPreChargeback', val)}
              prefix="R$"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">Mínimo Garantido Mensal</Label>
          <TaxaInput
            value={rates?.minimoGarantido || ''}
            onChange={(val) => updateField('minimoGarantido', val)}
            prefix="R$"
          />
        </div>
      </CardContent>
    </Card>
  );
}