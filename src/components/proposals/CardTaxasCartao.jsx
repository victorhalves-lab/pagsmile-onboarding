import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Copy } from 'lucide-react';
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
];

export default function CardTaxasCartao({ taxas, onUpdate }) {
  const [activeBandeira, setActiveBandeira] = useState('mastercard');
  const [syncAll, setSyncAll] = useState(false);

  const updateTaxa = (bandeira, faixa, value) => {
    const newTaxas = { ...taxas };
    if (!newTaxas[bandeira]) newTaxas[bandeira] = {};
    newTaxas[bandeira][faixa] = value;

    if (syncAll) {
      BANDEIRAS.forEach(b => {
        if (!newTaxas[b.id]) newTaxas[b.id] = {};
        newTaxas[b.id][faixa] = value;
      });
    }

    onUpdate(newTaxas);
  };

  const copyToAll = () => {
    const source = taxas?.[activeBandeira];
    if (!source) return;
    const newTaxas = { ...taxas };
    BANDEIRAS.forEach(b => {
      newTaxas[b.id] = { ...source };
    });
    onUpdate(newTaxas);
    toast.success('Taxas copiadas para todas as bandeiras!');
  };

  const copyFrom = (fromBandeira) => {
    const source = taxas?.[fromBandeira];
    if (!source) return;
    const newTaxas = { ...taxas };
    newTaxas[activeBandeira] = { ...source };
    onUpdate(newTaxas);
    toast.success(`Taxas copiadas de ${BANDEIRAS.find(b => b.id === fromBandeira)?.label}`);
  };

  const getBandeiraStatus = (bandeiraId) => {
    const b = taxas?.[bandeiraId];
    if (!b) return 'empty';
    const filled = FAIXAS.filter(f => b[f.id] && b[f.id] !== '').length;
    if (filled === FAIXAS.length) return 'complete';
    if (filled > 0) return 'partial';
    return 'empty';
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-[var(--pagsmile-green)]" />
          Taxas de Cartão de Crédito
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeBandeira} onValueChange={setActiveBandeira}>
          <TabsList className="w-full grid grid-cols-5 h-auto">
            {BANDEIRAS.map(b => {
              const status = getBandeiraStatus(b.id);
              return (
                <TabsTrigger key={b.id} value={b.id} className="text-xs py-2 relative">
                  {b.label}
                  {status === 'complete' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-green-500" />
                  )}
                  {status === 'partial' && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {BANDEIRAS.map(b => (
            <TabsContent key={b.id} value={b.id} className="mt-4">
              <div className="grid grid-cols-3 gap-4">
                {FAIXAS.map(f => (
                  <div key={f.id} className="space-y-1.5">
                    <Label className="text-xs font-medium text-[var(--pagsmile-blue)]/70">
                      {f.label}
                    </Label>
                    <TaxaInput
                      value={taxas?.[b.id]?.[f.id] || ''}
                      onChange={(val) => updateTaxa(b.id, f.id, val)}
                      suffix="%"
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Ações de cópia */}
        <div className="border-t border-slate-100 pt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={copyToAll} className="text-xs gap-1">
              <Copy className="w-3 h-3" />
              Copiar para todas
            </Button>
            {BANDEIRAS.filter(b => b.id !== activeBandeira && taxas?.[b.id]?.avista).map(b => (
              <Button 
                key={b.id} 
                variant="ghost" 
                size="sm" 
                onClick={() => copyFrom(b.id)}
                className="text-xs"
              >
                Copiar de {b.label}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="sync-all"
              checked={syncAll}
              onCheckedChange={(checked) => {
                setSyncAll(checked);
                if (checked) copyToAll();
              }}
            />
            <Label htmlFor="sync-all" className="text-xs text-[var(--pagsmile-blue)]/70 cursor-pointer">
              Sincronizar: ao editar, copiar automaticamente para todas as bandeiras
            </Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}