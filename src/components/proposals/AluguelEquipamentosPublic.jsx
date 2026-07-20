import React from 'react';
import { Receipt, Smartphone, CheckCircle2 } from 'lucide-react';

const fmtBRL = (val) => {
  const n = typeof val === 'number' ? val : parseFloat(String(val).replace(/\./g, '').replace(',', '.'));
  if (isNaN(n) || n <= 0) return null;
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

/**
 * Bloco público de Aluguel de Equipamentos (POS Comum + Smart POS).
 * Renderiza apenas se houver pelo menos um valor preenchido.
 */
export default function AluguelEquipamentosPublic({ alugueis }) {
  const posComum = alugueis?.posComum || {};
  const smartPos = alugueis?.smartPos || {};

  const posComumValor = fmtBRL(posComum.valor);
  const smartPosValor = fmtBRL(smartPos.valor);
  const fatMinIsencao = fmtBRL(posComum.faturamentoMinimoIsencao);

  if (!posComumValor && !smartPosValor) return null;

  return (
    <div className="mt-5 pt-5 border-t border-[#1356E2]/15">
      <h3 className="font-bold text-sm text-[#0A0A0A] mb-3 uppercase tracking-wide">Aluguel de Equipamentos</h3>

      <div className="space-y-3">
        {posComumValor && (
          <div className="bg-white/60 rounded-lg p-3 border border-slate-100">
            <div className="flex items-center gap-2 mb-1.5">
              <Receipt className="w-4 h-4 text-[#1356E2]" />
              <span className="font-bold text-sm text-[#0A0A0A]">POS Comum</span>
            </div>
            <p className="text-base font-bold text-[#0A0A0A] ml-6">
              R$ {posComumValor} <span className="text-xs font-normal text-[#0A0A0A]/50">/ mês por equipamento</span>
            </p>
            {posComum.isencaoAtiva && fatMinIsencao && (
              <div className="mt-2 ml-6 flex items-start gap-1.5 text-xs text-[#0A0A0A]/70 leading-relaxed">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#1356E2] mt-0.5 flex-shrink-0" />
                <p>
                  <span className="font-semibold">Isenção:</span> equipamentos POS Comum que faturarem R$ {fatMinIsencao} ou mais por mês ficam isentos do aluguel naquele mês.
                </p>
              </div>
            )}
          </div>
        )}

        {smartPosValor && (
          <div className="bg-white/60 rounded-lg p-3 border border-slate-100">
            <div className="flex items-center gap-2 mb-1.5">
              <Smartphone className="w-4 h-4 text-[#1356E2]" />
              <span className="font-bold text-sm text-[#0A0A0A]">Smart POS</span>
            </div>
            <p className="text-base font-bold text-[#0A0A0A] ml-6">
              R$ {smartPosValor} <span className="text-xs font-normal text-[#0A0A0A]/50">/ mês por equipamento</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}