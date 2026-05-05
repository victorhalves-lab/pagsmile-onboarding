import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Zap, FileText } from 'lucide-react';

/**
 * Card de PIX e Boleto — métodos alternativos.
 * Lê rates.pix (objeto: tipo+valor) e rates.boleto (number).
 */
export default function PixBoletoPublic({ rates }) {
  const pixTipo = rates?.pix?.tipo;
  const pixValor = parseFloat(rates?.pix?.valor) || 0;
  const boletoValor = parseFloat(rates?.boleto) || 0;

  const pixDisplay = pixTipo === 'fixo'
    ? `R$ ${pixValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `${pixValor.toFixed(2).replace('.', ',')}%`;

  const boletoDisplay = `R$ ${boletoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <Card className="mb-4">
      <CardContent className="py-4">
        <h3 className="font-bold text-sm text-[#002443] mb-3 uppercase tracking-wide">PIX e Boleto</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#f4f4f4] rounded-xl p-4 border border-[#2bc196]/10">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Zap className="w-3.5 h-3.5 text-[#2bc196]" />
              <p className="text-[10px] text-[#002443]/60 uppercase font-semibold tracking-wide">PIX</p>
            </div>
            <p className="text-xl font-bold text-[#2bc196] font-mono">{pixDisplay}</p>
          </div>
          <div className="bg-[#f4f4f4] rounded-xl p-4 border border-[#2bc196]/10">
            <div className="flex items-center gap-1.5 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-[#36706c]" />
              <p className="text-[10px] text-[#002443]/60 uppercase font-semibold tracking-wide">Boleto</p>
            </div>
            <p className="text-xl font-bold text-[#002443] font-mono">{boletoDisplay}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}