import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Wrench, Globe2, Target } from 'lucide-react';

const fmtBRL = (v) => `R$ ${(parseFloat(v) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Setup, Forex e Mínimos Garantidos — condições comerciais gerais.
 * Renderiza só blocos que tiverem valor preenchido (>0).
 */
export default function CondicoesGeraisPublic({ rates }) {
  const setup = parseFloat(rates?.setup) || 0;
  const forex = parseFloat(rates?.forex) || 0;
  const mes1 = parseFloat(rates?.minimoGarantido?.mes1) || 0;
  const mes2 = parseFloat(rates?.minimoGarantido?.mes2) || 0;
  const mes3 = parseFloat(rates?.minimoGarantido?.mes3) || 0;
  const hasMinimos = mes1 > 0 || mes2 > 0 || mes3 > 0;

  if (setup === 0 && forex === 0 && !hasMinimos) return null;

  return (
    <Card className="mb-4">
      <CardContent className="py-4">
        <h3 className="font-bold text-sm text-[#002443] mb-3 uppercase tracking-wide">Condições Comerciais</h3>

        {(setup > 0 || forex > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {setup > 0 && (
              <div className="bg-[#f4f4f4] rounded-xl p-4 border border-[#2bc196]/10">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Wrench className="w-3.5 h-3.5 text-[#36706c]" />
                  <p className="text-[10px] text-[#002443]/60 uppercase font-semibold tracking-wide">Setup (taxa única)</p>
                </div>
                <p className="text-xl font-bold text-[#002443] font-mono">{fmtBRL(setup)}</p>
              </div>
            )}
            {forex > 0 && (
              <div className="bg-[#f4f4f4] rounded-xl p-4 border border-[#2bc196]/10">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Globe2 className="w-3.5 h-3.5 text-[#36706c]" />
                  <p className="text-[10px] text-[#002443]/60 uppercase font-semibold tracking-wide">Forex</p>
                </div>
                <p className="text-xl font-bold text-[#002443] font-mono">{forex.toFixed(2).replace('.', ',')}%</p>
                <p className="text-[10px] text-[#002443]/50 mt-1">Sobre vendas internacionais</p>
              </div>
            )}
          </div>
        )}

        {hasMinimos && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Target className="w-3.5 h-3.5 text-[#36706c]" />
              <p className="text-[11px] text-[#002443]/70 uppercase font-semibold tracking-wide">Faturamento Mínimo Mensal Garantido</p>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#f4f4f4] rounded-xl p-3 border border-[#2bc196]/10 text-center">
                <p className="text-[10px] text-[#002443]/50 uppercase font-semibold mb-1">Mês 1</p>
                <p className="text-sm font-bold text-[#002443] font-mono">{fmtBRL(mes1)}</p>
              </div>
              <div className="bg-[#f4f4f4] rounded-xl p-3 border border-[#2bc196]/10 text-center">
                <p className="text-[10px] text-[#002443]/50 uppercase font-semibold mb-1">Mês 2</p>
                <p className="text-sm font-bold text-[#002443] font-mono">{fmtBRL(mes2)}</p>
              </div>
              <div className="bg-white rounded-xl p-3 border border-[#2bc196]/40 text-center shadow-sm">
                <p className="text-[10px] text-[#2bc196] uppercase font-semibold mb-1">Mês 3+</p>
                <p className="text-sm font-bold text-[#2bc196] font-mono">{fmtBRL(mes3)}</p>
              </div>
            </div>
            <p className="text-[10px] text-[#002443]/50 mt-2 text-center leading-relaxed">
              Volume mínimo mensal em cartão. Não atingir o mínimo pode gerar cobrança da diferença, conforme contrato.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}