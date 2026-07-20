import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Smartphone, Copy } from 'lucide-react';
import { toast } from 'sonner';
import TaxaInput from './TaxaInput';
import AluguelEquipamentosBlock from './AluguelEquipamentosBlock';

const BANDEIRAS = [
  { id: 'mastercard', label: 'Master', color: '#EB001B', secondColor: '#F79E1B' },
  { id: 'visa', label: 'Visa', color: '#1A1F71', secondColor: '#F7B600' },
  { id: 'elo', label: 'Elo', color: '#00A4E0', secondColor: '#FFCB05' },
  { id: 'amex', label: 'Amex', color: '#006FCF', secondColor: '#006FCF' },
  { id: 'outras', label: 'Outras', color: '#6B7280', secondColor: '#6B7280' },
];

// Maquininha: presencial não vai além de 12x. SEM 13-21x propositalmente.
const FAIXAS_CREDITO = [
  { id: 'avista', label: 'À Vista', sub: '1x' },
  { id: 'de2a6x', label: '2x a 6x', sub: 'parcelado' },
  { id: 'de7a12x', label: '7x a 12x', sub: 'parcelado' },
];

function BrandLogo({ brand, isActive }) {
  return (
    <div className={`relative w-10 h-7 rounded-md flex items-center justify-center overflow-hidden transition-all ${isActive ? 'ring-2 ring-[#1356E2] shadow-lg shadow-[#1356E2]/20' : 'opacity-40'}`}
      style={{ background: isActive ? `linear-gradient(135deg, ${brand.color}, ${brand.secondColor})` : 'rgba(255,255,255,0.08)' }}>
      <Smartphone className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/30'}`} />
    </div>
  );
}

/**
 * Card de Taxas de MAQUININHA (presencial — POS físico).
 *
 * - Aparece SOMENTE quando "Processamento com maquininha = Sim"
 * - Tem crédito por bandeira (1x, 2-6x, 7-12x) E débito por bandeira
 * - Taxas distintas das taxas online (canais diferentes)
 */
export default function CardTaxasMaquininha({
  enabled,
  onToggleEnabled,
  maquininha,         // { credito: { visa: { avista, de2a6x, de7a12x }, ... }, debito: { visa, ... } }
  onUpdateMaquininha, // (newMaquininha) => void
  readOnly = false,
}) {
  const [selectedBrand, setSelectedBrand] = useState('mastercard');
  const [syncAll, setSyncAll] = useState(false);

  const credito = maquininha?.credito || {};
  const debito = maquininha?.debito || {};

  const updateCredito = (bandeira, faixa, value) => {
    const newCredito = { ...credito };
    const setVal = (b, f, v) => { if (!newCredito[b]) newCredito[b] = {}; newCredito[b][f] = v; };
    if (syncAll) BANDEIRAS.forEach(b => setVal(b.id, faixa, value));
    else setVal(bandeira, faixa, value);
    onUpdateMaquininha({ ...maquininha, credito: newCredito });
  };

  const updateDebito = (bandeira, value) => {
    const newDebito = { ...debito };
    if (syncAll) BANDEIRAS.forEach(b => { newDebito[b.id] = value; });
    else newDebito[bandeira] = value;
    onUpdateMaquininha({ ...maquininha, debito: newDebito });
  };

  const copyToAll = () => {
    const sourceCredito = credito[selectedBrand];
    const sourceDebito = debito[selectedBrand];
    if (!sourceCredito && sourceDebito === undefined) return;
    const newCredito = { ...credito };
    const newDebito = { ...debito };
    BANDEIRAS.forEach(b => {
      if (sourceCredito) newCredito[b.id] = { ...sourceCredito };
      if (sourceDebito !== undefined) newDebito[b.id] = sourceDebito;
    });
    onUpdateMaquininha({ ...maquininha, credito: newCredito, debito: newDebito });
    toast.success('Taxas de maquininha copiadas para todas as bandeiras!');
  };

  const labelCls = "text-[10px] text-[#1356E2]/70 font-semibold uppercase tracking-wider";
  const inputCls = "bg-white/5 border-white/10 text-white h-12 text-lg font-semibold text-center rounded-xl placeholder:text-white/15 focus:border-[#1356E2] focus:ring-1 focus:ring-[#1356E2]";

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-4">
      {/* Header com toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1356E2]/10 flex items-center justify-center">
            <Smartphone className="w-3.5 h-3.5 text-[#1356E2]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Processamento com maquininha?</h2>
            <p className="text-[10px] text-white/30">Ative para incluir taxas de maquininha (POS presencial)</p>
          </div>
        </div>
        <Switch
          checked={!!enabled}
          onCheckedChange={(v) => !readOnly && onToggleEnabled(v)}
          disabled={readOnly}
        />
      </div>

      {/* Conteúdo só se ativado */}
      {enabled && (
        <div className="pt-3 border-t border-white/5 space-y-5">
          {/* Brand Selector */}
          <div className="flex gap-2">
            {BANDEIRAS.map(b => (
              <button key={b.id} onClick={() => setSelectedBrand(b.id)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all ${
                  selectedBrand === b.id
                    ? 'bg-[#1356E2]/10 border-[#1356E2]/30 shadow-lg shadow-[#1356E2]/5'
                    : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
                }`}>
                <BrandLogo brand={b} isActive={selectedBrand === b.id} />
                <span className={`text-[10px] font-bold tracking-wide ${selectedBrand === b.id ? 'text-[#1356E2]' : 'text-white/30'}`}>{b.label}</span>
              </button>
            ))}
          </div>

          {/* Crédito Maquininha */}
          <div className="space-y-2">
            <Label className={labelCls}>Crédito Maquininha</Label>
            <div className="grid grid-cols-3 gap-3">
              {FAIXAS_CREDITO.map(f => (
                <div key={f.id} className="space-y-2">
                  <div className="text-center">
                    <p className="text-[10px] text-[#1356E2]/70 font-semibold uppercase tracking-wider">{f.label}</p>
                    <p className="text-[9px] text-white/20">{f.sub}</p>
                  </div>
                  <TaxaInput
                    value={credito[selectedBrand]?.[f.id] || ''}
                    onChange={(val) => !readOnly && updateCredito(selectedBrand, f.id, val)}
                    placeholder="0,00"
                    suffix="%"
                    disabled={readOnly}
                    className={`${inputCls} ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Débito Maquininha */}
          <div className="space-y-2">
            <Label className={labelCls}>Débito Maquininha</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <div className="text-center">
                  <p className="text-[10px] text-[#1356E2]/70 font-semibold uppercase tracking-wider">Débito</p>
                  <p className="text-[9px] text-white/20">à vista</p>
                </div>
                <TaxaInput
                  value={debito[selectedBrand] ?? ''}
                  onChange={(val) => !readOnly && updateDebito(selectedBrand, val)}
                  placeholder="0,00"
                  suffix="%"
                  disabled={readOnly}
                  className={`${inputCls} ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
              </div>
            </div>
          </div>

          {/* Aluguel de Equipamentos */}
          <AluguelEquipamentosBlock
            alugueis={maquininha?.alugueis || {}}
            onUpdateAlugueis={(newAlugueis) => onUpdateMaquininha({ ...maquininha, alugueis: newAlugueis })}
            readOnly={readOnly}
          />

          {/* Actions */}
          {!readOnly && (
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex items-center gap-2">
                <Checkbox id="sync-all-maq" checked={syncAll} onCheckedChange={setSyncAll}
                  className="border-white/20 data-[state=checked]:bg-[#1356E2] data-[state=checked]:border-[#1356E2]" />
                <Label htmlFor="sync-all-maq" className="text-[10px] text-white/30 cursor-pointer select-none">Sincronizar bandeiras</Label>
              </div>
              <Button variant="ghost" size="sm" onClick={copyToAll} className="text-[10px] text-white/30 hover:text-[#1356E2] hover:bg-[#1356E2]/5 h-7 rounded-lg">
                <Copy className="w-3 h-3 mr-1.5" /> Copiar para todas
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}