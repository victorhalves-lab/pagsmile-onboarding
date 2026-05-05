import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Receipt, Smartphone, Info } from 'lucide-react';
import TaxaInput from './TaxaInput';

/**
 * Bloco "Aluguel de Equipamentos" — usado dentro do CardTaxasMaquininha.
 *
 * Estrutura de dados:
 *   alugueis: {
 *     posComum:  { valor, isencaoAtiva, faturamentoMinimoIsencao },
 *     smartPos:  { valor },
 *   }
 *
 * Regras:
 *  - POS Comum: aluguel mensal por equipamento. Toggle de isenção condicional.
 *  - Smart POS: aluguel mensal por equipamento. Sem isenção.
 */
export default function AluguelEquipamentosBlock({ alugueis, onUpdateAlugueis, readOnly = false }) {
  const posComum = alugueis?.posComum || {};
  const smartPos = alugueis?.smartPos || {};

  const updatePosComum = (patch) => {
    onUpdateAlugueis({
      ...alugueis,
      posComum: { ...posComum, ...patch },
    });
  };
  const updateSmartPos = (patch) => {
    onUpdateAlugueis({
      ...alugueis,
      smartPos: { ...smartPos, ...patch },
    });
  };

  const labelCls = "text-[10px] text-[#2bc196]/70 font-semibold uppercase tracking-wider";
  const inputCls = "bg-white/5 border-white/10 text-white h-12 text-base font-semibold rounded-xl placeholder:text-white/15 focus:border-[#2bc196] focus:ring-1 focus:ring-[#2bc196]";
  const inputDisabledCls = readOnly ? 'opacity-60 cursor-not-allowed' : '';

  return (
    <div className="space-y-4 pt-4 border-t border-white/5">
      <Label className={labelCls}>Aluguel de Equipamentos</Label>

      {/* POS Comum */}
      <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#2bc196]/10 flex items-center justify-center">
            <Receipt className="w-3.5 h-3.5 text-[#2bc196]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">POS Comum</h3>
            <p className="text-[10px] text-white/30">Maquininha tradicional</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-[10px] text-white/40 uppercase tracking-wider">Aluguel /mês</Label>
            <TaxaInput
              value={posComum.valor ?? ''}
              onChange={(val) => !readOnly && updatePosComum({ valor: val })}
              prefix="R$"
              isCurrency
              placeholder="0,00"
              disabled={readOnly}
              className={`${inputCls} ${inputDisabledCls}`}
            />
          </div>
          <p className="text-[10px] text-white/40 pb-3">por equipamento</p>
        </div>

        {/* Toggle isenção */}
        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div className="flex-1">
            <p className="text-xs font-semibold text-white">Isentar POS por faturamento mínimo?</p>
            <p className="text-[10px] text-white/30">Aplica-se por equipamento, individualmente.</p>
          </div>
          <Switch
            checked={!!posComum.isencaoAtiva}
            onCheckedChange={(v) => !readOnly && updatePosComum({ isencaoAtiva: v })}
            disabled={readOnly}
          />
        </div>

        {/* Campo de faturamento mínimo (só se isenção ativa) */}
        {posComum.isencaoAtiva && (
          <div className="space-y-2 pt-1">
            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="space-y-1.5">
                <Label className="text-[10px] text-white/40 uppercase tracking-wider">Faturamento mín. /POS</Label>
                <TaxaInput
                  value={posComum.faturamentoMinimoIsencao ?? ''}
                  onChange={(val) => !readOnly && updatePosComum({ faturamentoMinimoIsencao: val })}
                  prefix="R$"
                  isCurrency
                  placeholder="0,00"
                  disabled={readOnly}
                  className={`${inputCls} ${inputDisabledCls}`}
                />
              </div>
              <p className="text-[10px] text-white/40 pb-3">por mês para isenção</p>
            </div>
            <div className="flex items-start gap-2 px-2 py-2 rounded-lg bg-[#2bc196]/[0.06] border border-[#2bc196]/10">
              <Info className="w-3 h-3 text-[#2bc196] mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-white/50 leading-relaxed">
                Cada POS que faturar igual ou acima do mínimo no mês fica <span className="text-[#2bc196] font-semibold">isenta do aluguel</span> naquele mês. POS abaixo desse volume continuam pagando.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Smart POS */}
      <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#2bc196]/10 flex items-center justify-center">
            <Smartphone className="w-3.5 h-3.5 text-[#2bc196]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Smart POS</h3>
            <p className="text-[10px] text-white/30">Maquininha Android / touch</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 items-end">
          <div className="space-y-1.5">
            <Label className="text-[10px] text-white/40 uppercase tracking-wider">Aluguel /mês</Label>
            <TaxaInput
              value={smartPos.valor ?? ''}
              onChange={(val) => !readOnly && updateSmartPos({ valor: val })}
              prefix="R$"
              isCurrency
              placeholder="0,00"
              disabled={readOnly}
              className={`${inputCls} ${inputDisabledCls}`}
            />
          </div>
          <p className="text-[10px] text-white/40 pb-3">por equipamento</p>
        </div>
      </div>
    </div>
  );
}