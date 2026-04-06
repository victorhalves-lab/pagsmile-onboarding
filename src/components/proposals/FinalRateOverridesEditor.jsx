import React, { useState } from 'react';
import { Pencil, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function FinalRateOverridesEditor({ overrides = {}, onChange, hideCalculationColumns = false, onToggleHideColumns }) {
  const [editingParcela, setEditingParcela] = useState(null);
  const [editValue, setEditValue] = useState('');

  const startEdit = (parcela) => {
    setEditingParcela(parcela);
    setEditValue(overrides[String(parcela)] != null ? String(overrides[String(parcela)]).replace('.', ',') : '');
  };

  const confirmEdit = () => {
    if (editingParcela == null) return;
    const cleaned = editValue.replace(',', '.');
    const num = parseFloat(cleaned);
    const newOverrides = { ...overrides };
    if (editValue === '' || isNaN(num)) {
      delete newOverrides[String(editingParcela)];
    } else {
      newOverrides[String(editingParcela)] = num;
    }
    onChange(newOverrides);
    setEditingParcela(null);
    setEditValue('');
  };

  const removeOverride = (parcela) => {
    const newOverrides = { ...overrides };
    delete newOverrides[String(parcela)];
    onChange(newOverrides);
  };

  const overrideKeys = Object.keys(overrides).filter(k => overrides[k] != null).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Pencil className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Sobrescrever Taxa Final</h2>
          <p className="text-[10px] text-white/30">Aplica-se apenas às bandeiras <span className="text-amber-400/70 font-semibold">Mastercard</span> e <span className="text-amber-400/70 font-semibold">Visa</span></p>
        </div>
      </div>

      {/* Active overrides */}
      {overrideKeys.length > 0 && (
        <div className="space-y-1.5">
          {overrideKeys.map(k => (
            <div key={k} className="flex items-center gap-2 bg-amber-500/10 rounded-lg px-3 py-2">
              <span className="text-xs font-bold text-amber-400 w-8">{k}x</span>
              <span className="text-xs text-white flex-1">→ {overrides[k].toFixed(2).replace('.', ',')}%</span>
              <button onClick={() => removeOverride(k)} className="text-white/30 hover:text-red-400 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Opção de ocultar colunas de cálculo */}
      {overrideKeys.length > 0 && onToggleHideColumns && (
        <label className="flex items-center gap-2.5 bg-white/[0.03] border border-white/10 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-white/[0.05] transition-colors">
          <input
            type="checkbox"
            checked={hideCalculationColumns}
            onChange={(e) => onToggleHideColumns(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 text-[#2bc196] focus:ring-[#2bc196] bg-white/5"
          />
          <div>
            <span className="text-xs font-medium text-white">Ocultar cálculo na proposta</span>
            <p className="text-[10px] text-white/30">Esconde as colunas Base e Antecipação, mostrando apenas a taxa final</p>
          </div>
        </label>
      )}

      {/* Add/Edit override */}
      <div className="flex items-end gap-2">
        <div className="space-y-1 flex-1">
          <label className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Parcela (1-21)</label>
          <select
            value={editingParcela || ''}
            onChange={(e) => startEdit(Number(e.target.value))}
            className="w-full bg-white/5 border border-white/10 text-white h-9 rounded-lg text-xs px-2 focus:border-[#2bc196] focus:ring-1 focus:ring-[#2bc196]"
          >
            <option value="">Selecionar...</option>
            {Array.from({ length: 21 }, (_, i) => i + 1).map(p => (
              <option key={p} value={p}>{p}x</option>
            ))}
          </select>
        </div>
        {editingParcela && (
          <>
            <div className="space-y-1 flex-1">
              <label className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">Taxa Final (%)</label>
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="0,00"
                className="bg-white/5 border-white/10 text-white h-9 rounded-lg text-xs text-right focus:border-[#2bc196] focus:ring-1 focus:ring-[#2bc196]"
                onKeyDown={(e) => e.key === 'Enter' && confirmEdit()}
              />
            </div>
            <Button size="sm" onClick={confirmEdit} className="bg-[#2bc196] hover:bg-[#2bc196]/80 text-[#002443] h-9 px-3 rounded-lg">
              <Check className="w-4 h-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}