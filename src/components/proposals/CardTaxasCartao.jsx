import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import TaxaInput from './TaxaInput';

const BANDEIRAS = [
  { id: 'mastercard', label: 'Mastercard' },
  { id: 'visa', label: 'Visa' },
  { id: 'elo', label: 'Elo' },
  { id: 'amex', label: 'Amex' },
  { id: 'outras', label: 'Outras' },
];

const FAIXAS = [
  { id: 'avista', label: 'À Vista (1x)' },
  { id: 'de2a6x', label: '2x a 6x' },
  { id: 'de7a12x', label: '7x a 12x' },
  { id: 'de13a18x', label: '13x a 18x' }, // Added to match preview if needed, or stick to spec
];

// Reducing to 3 ranges as per spec image: 1x, 2-6x, 7-12x
const FAIXAS_SPEC = [
  { id: 'avista', label: 'À Vista (1x)' },
  { id: 'de2a6x', label: '2x a 6x' },
  { id: 'de7a12x', label: '7x a 12x' },
];

export default function CardTaxasCartao({ rates, onUpdateRates, selectedBrand, setSelectedBrand }) {
  const [syncAll, setSyncAll] = useState(false);

  const taxas = rates.cartao || {};

  const updateTaxa = (bandeira, faixa, value) => {
    const newTaxas = { ...taxas };
    
    // Helper to set value deeply
    const setVal = (b, f, v) => {
        if (!newTaxas[b]) newTaxas[b] = {};
        newTaxas[b][f] = v;
    };

    if (syncAll) {
      // Update all brands
      BANDEIRAS.forEach(b => {
        setVal(b.id, faixa, value);
      });
    } else {
      // Update only current brand
      setVal(bandeira, faixa, value);
    }

    onUpdateRates({ ...rates, cartao: newTaxas });
  };

  const copyToAll = () => {
    const source = taxas[selectedBrand];
    if (!source) return;
    
    const newTaxas = { ...taxas };
    BANDEIRAS.forEach(b => {
      newTaxas[b.id] = { ...source };
    });
    
    onUpdateRates({ ...rates, cartao: newTaxas });
    toast.success('Taxas copiadas para todas as bandeiras!');
  };
  
  const copyToMasterVisa = () => {
      const source = taxas[selectedBrand];
      if (!source) return;
      
      const newTaxas = { ...taxas };
      // Copy to Mastercard and Visa
      ['mastercard', 'visa'].forEach(bid => {
          newTaxas[bid] = { ...source };
      });
      
      onUpdateRates({ ...rates, cartao: newTaxas });
      toast.success('Taxas copiadas para Visa e Mastercard!');
  }

  return (
    <div className="space-y-4 pt-4 border-t border-white/10">
      <h2 className="text-base font-semibold text-white">Taxas de Cartão</h2>
      
      {/* Brand Selection */}
      <div className="flex flex-wrap gap-2 p-1 bg-[#18181b] rounded-lg w-fit">
        {BANDEIRAS.map(b => (
          <button
            key={b.id}
            onClick={() => setSelectedBrand(b.id)}
            className={`px-4 py-2 text-xs font-medium rounded-md transition-all ${
              selectedBrand === b.id
                ? 'bg-[#2bc196]/10 text-[#2bc196] border border-[#2bc196]/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#18181b] p-4 rounded-lg border border-white/5">
        {FAIXAS_SPEC.map(f => (
          <div key={f.id} className="space-y-2">
            <Label className="text-xs text-slate-400">{f.label}</Label>
            <TaxaInput
              value={taxas[selectedBrand]?.[f.id] || ''}
              onChange={(val) => updateTaxa(selectedBrand, f.id, val)}
              placeholder="0,00"
              className="bg-[#09090b] border-white/10 text-white h-12 text-lg font-medium text-right pr-4"
              // Custom styled input
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <div className="flex gap-2">
            <Button 
                variant="outline" 
                size="sm" 
                onClick={copyToMasterVisa}
                className="bg-transparent border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-xs h-8"
            >
                <Copy className="w-3 h-3 mr-2" />
                Copiar para Visa/Master
            </Button>
            
            <Button 
                variant="outline" 
                size="sm" 
                onClick={copyToAll}
                className="bg-transparent border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-xs h-8"
            >
                <Copy className="w-3 h-3 mr-2" />
                Copiar para Todas
            </Button>
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="sync-all"
            checked={syncAll}
            onCheckedChange={setSyncAll}
            className="border-white/20 data-[state=checked]:bg-[#2bc196] data-[state=checked]:border-[#2bc196]"
          />
          <Label htmlFor="sync-all" className="text-xs text-slate-400 cursor-pointer select-none">
            Sincronizar: ao editar, copiar automaticamente para todas as bandeiras
          </Label>
        </div>
      </div>
    </div>
  );
}