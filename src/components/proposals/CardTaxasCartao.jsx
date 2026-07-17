import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Copy, CreditCard, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import TaxaInput from './TaxaInput';
import { getMDRLimits } from '@/lib/partnerLimits';

const BANDEIRAS = [
  { id: 'mastercard', label: 'Master', color: '#EB001B', secondColor: '#F79E1B' },
  { id: 'visa', label: 'Visa', color: '#1A1F71', secondColor: '#F7B600' },
  { id: 'elo', label: 'Elo', color: '#00A4E0', secondColor: '#FFCB05' },
  { id: 'amex', label: 'Amex', color: '#006FCF', secondColor: '#006FCF' },
];

const FAIXAS_SPEC = [
  { id: 'avista', label: 'À Vista', sub: '1x' },
  { id: 'de2a6x', label: '2x a 6x', sub: 'parcelado' },
  { id: 'de7a12x', label: '7x a 12x', sub: 'parcelado' },
  { id: 'de13a21x', label: '13x a 21x', sub: 'parcelado' },
];

function BrandLogo({ brand, isActive }) {
  const colors = BANDEIRAS.find(b => b.id === brand.id);
  return (
    <div className={`relative w-10 h-7 rounded-md flex items-center justify-center overflow-hidden transition-all ${isActive ? 'ring-2 ring-[#2bc196] shadow-lg shadow-[#2bc196]/20' : 'opacity-40'}`}
      style={{ background: isActive ? `linear-gradient(135deg, ${colors.color}, ${colors.secondColor})` : 'rgba(255,255,255,0.08)' }}>
      <CreditCard className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/30'}`} />
    </div>
  );
}

export default function CardTaxasCartao({ rates, onUpdateRates, selectedBrand, setSelectedBrand, partner, clientMcc, readOnly = false, hideRange13a21 = false, onToggleHideRange13a21 }) {
  const [syncAll, setSyncAll] = useState(false);
  const taxas = rates.cartao || {};

  const updateTaxa = (bandeira, faixa, value) => {
    const newTaxas = { ...taxas };
    // Cria NOVO objeto aninhado antes de modificar — evita mutação direta
    // do state (que cause inconsistência em modo Multi-MCC).
    const setVal = (b, f, v) => { newTaxas[b] = { ...(newTaxas[b] || {}) }; newTaxas[b][f] = v; };
    if (syncAll) { BANDEIRAS.forEach(b => setVal(b.id, faixa, value)); }
    else { setVal(bandeira, faixa, value); }
    onUpdateRates({ ...rates, cartao: newTaxas });
  };

  const copyToAll = () => {
    const source = taxas[selectedBrand];
    if (!source) return;
    const newTaxas = { ...taxas };
    BANDEIRAS.forEach(b => { newTaxas[b.id] = { ...source }; });
    onUpdateRates({ ...rates, cartao: newTaxas });
    toast.success('Taxas copiadas para todas as bandeiras!');
  };

  const inputCls = "bg-white/5 border-white/10 text-white h-12 text-lg font-semibold text-center rounded-xl placeholder:text-white/15 focus:border-[#2bc196] focus:ring-1 focus:ring-[#2bc196]";

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-[#2bc196]/10 flex items-center justify-center"><CreditCard className="w-3.5 h-3.5 text-[#2bc196]" /></div>
        <h2 className="text-sm font-bold text-white">Taxas de Cartão</h2>
      </div>

      {/* Brand Selector as visual buttons */}
      <div className="flex gap-2">
        {BANDEIRAS.map(b => (
          <button key={b.id} onClick={() => setSelectedBrand(b.id)}
            className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${
              selectedBrand === b.id
                ? 'bg-[#2bc196]/10 border-[#2bc196]/30 shadow-lg shadow-[#2bc196]/5'
                : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
            }`}>
            <BrandLogo brand={b} isActive={selectedBrand === b.id} />
            <span className={`text-[10px] font-bold tracking-wide ${selectedBrand === b.id ? 'text-[#2bc196]' : 'text-white/30'}`}>{b.label}</span>
          </button>
        ))}
      </div>

      {/* Toggle 13x-21x */}
      {onToggleHideRange13a21 && !readOnly && (
        <div className="flex items-center justify-between bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
          <div>
            <p className="text-xs font-medium text-white">Oferecer 13x a 21x?</p>
            <p className="text-[10px] text-white/30">Ative para incluir a faixa de 13 a 21 parcelas</p>
          </div>
          <Switch
            checked={!hideRange13a21}
            onCheckedChange={(checked) => onToggleHideRange13a21(!checked)}
          />
        </div>
      )}

      {/* Rate Inputs */}
      <div className={`grid gap-3 ${hideRange13a21 ? 'grid-cols-3' : 'grid-cols-4'}`}>
        {FAIXAS_SPEC.filter(f => !(hideRange13a21 && f.id === 'de13a21x')).map(f => {
          const limits = partner ? getMDRLimits(partner, clientMcc, selectedBrand, f.id) : null;
          const currentVal = parseFloat(String(taxas[selectedBrand]?.[f.id] || '0').replace(',', '.')) || 0;
          const hasViolation = limits && currentVal > 0 && (currentVal < limits.taxaMin || currentVal > limits.taxaMax);
          return (
            <div key={f.id} className="space-y-2">
              <div className="text-center">
                <p className="text-[10px] text-[#2bc196]/70 font-semibold uppercase tracking-wider">{f.label}</p>
                <p className="text-[9px] text-white/20">{f.sub}</p>
              </div>
              <TaxaInput
                value={taxas[selectedBrand]?.[f.id] || ''}
                onChange={(val) => !readOnly && updateTaxa(selectedBrand, f.id, val)}
                placeholder="0,00"
                suffix="%"
                disabled={readOnly}
                className={`${inputCls} ${hasViolation ? 'border-red-400/50 ring-1 ring-red-400/30' : ''} ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
              {limits && (
                <div className="text-center space-y-0.5">
                  <p className="text-[8px] text-white/20">
                    Min: {limits.taxaMin.toFixed(2).replace('.', ',')}% — Máx: {limits.taxaMax.toFixed(2).replace('.', ',')}%
                  </p>
                  {hasViolation && (
                    <div className="flex items-center justify-center gap-1 text-red-400">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span className="text-[8px]">{currentVal < limits.taxaMin ? 'Abaixo do mínimo' : 'Acima do máximo'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Actions */}
      {!readOnly && (
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex items-center gap-2">
            <Checkbox id="sync-all" checked={syncAll} onCheckedChange={setSyncAll}
              className="border-white/20 data-[state=checked]:bg-[#2bc196] data-[state=checked]:border-[#2bc196]" />
            <Label htmlFor="sync-all" className="text-[10px] text-white/30 cursor-pointer select-none">Sincronizar bandeiras</Label>
          </div>
          <Button variant="ghost" size="sm" onClick={copyToAll} className="text-[10px] text-white/30 hover:text-[#2bc196] hover:bg-[#2bc196]/5 h-7 rounded-lg">
            <Copy className="w-3 h-3 mr-1.5" /> Copiar para todas
          </Button>
        </div>
      )}
    </div>
  );
}