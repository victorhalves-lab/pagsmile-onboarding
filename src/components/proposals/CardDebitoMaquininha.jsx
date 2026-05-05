import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CreditCard } from 'lucide-react';
import TaxaInput from './TaxaInput';

const BANDEIRAS = [
  { id: 'mastercard', label: 'Master' },
  { id: 'visa', label: 'Visa' },
  { id: 'elo', label: 'Elo' },
  { id: 'amex', label: 'Amex' },
  { id: 'outras', label: 'Outras' },
];

/**
 * Card de Taxas de Débito — APARECE APENAS quando "Processamento com maquininha = Sim".
 *
 * Por padrão débito NÃO existe nas propostas (apenas online: PIX, crédito, etc).
 * Débito faz sentido somente em maquininha física (presencial).
 */
export default function CardDebitoMaquininha({ enabled, onToggleEnabled, debito, onUpdateDebito, readOnly = false }) {
  const labelCls = "text-[10px] text-[#2bc196]/70 font-semibold uppercase tracking-wider";
  const inputCls = "bg-white/5 border-white/10 text-white h-11 rounded-xl placeholder:text-white/15 focus:border-[#2bc196] focus:ring-1 focus:ring-[#2bc196]";

  const updateBrand = (brand, val) => onUpdateDebito({ ...(debito || {}), [brand]: val });

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-4">
      {/* Toggle: Processamento com maquininha? */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#2bc196]/10 flex items-center justify-center">
            <CreditCard className="w-3.5 h-3.5 text-[#2bc196]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Processamento com maquininha?</h2>
            <p className="text-[10px] text-white/30">Ative para incluir taxas de débito por bandeira</p>
          </div>
        </div>
        <Switch
          checked={!!enabled}
          onCheckedChange={(v) => !readOnly && onToggleEnabled(v)}
          disabled={readOnly}
        />
      </div>

      {/* Inputs de débito por bandeira — só aparecem se maquininha ativada */}
      {enabled && (
        <div className="pt-2 border-t border-white/5 space-y-3">
          <Label className={labelCls}>Taxas de Débito por Bandeira</Label>
          <div className="grid grid-cols-5 gap-2">
            {BANDEIRAS.map(b => (
              <div key={b.id} className="space-y-1.5">
                <p className="text-[9px] text-white/40 text-center font-semibold">{b.label}</p>
                <TaxaInput
                  value={debito?.[b.id] ?? ''}
                  onChange={(val) => !readOnly && updateBrand(b.id, val)}
                  placeholder="0,00"
                  suffix="%"
                  disabled={readOnly}
                  className={`${inputCls} text-center text-sm font-semibold ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}