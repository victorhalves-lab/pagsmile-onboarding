import React from 'react';
import { ShieldCheck, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { getReservaWithDefaults, getReservaForSegment, DEFAULT_DISCLAIMER } from '@/lib/reservaFinanceiraDefaults';

/**
 * Bloco PÚBLICO de Reserva Financeira (Rolling Reserve).
 *
 * Aceita 2 modos de obter os dados:
 *   • via `rates` → usa rates.reservaFinanceira (PropostaPadraoPublica)
 *   • via `segmentName` → calcula default por segmento (IntroducerLandingPage)
 *
 * Visual: tema claro, alinhado ao restante das páginas públicas.
 */
export default function ReservaFinanceiraPublic({ rates, segmentName }) {
  // Prioridade: rates explícito → fallback por segmento
  const reserva = rates?.reservaFinanceira
    ? getReservaWithDefaults(rates)
    : getReservaForSegment(segmentName || '');

  const pixAtiva = reserva.pix?.ativa !== false;
  const cartaoAtiva = reserva.cartao?.ativa !== false;

  if (!pixAtiva && !cartaoAtiva) return null;

  return (
    <Card className="mb-6 border-[#2bc196]/20">
      <CardContent className="py-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-[#2bc196]/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#2bc196]" />
          </div>
          <div>
            <h2 className="font-bold text-base text-[#002443]">Reserva Financeira</h2>
            <p className="text-xs text-[#002443]/50">Rolling Reserve — proteção contra chargebacks e disputas</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {pixAtiva && (
            <div className="rounded-xl bg-[#2bc196]/5 border border-[#2bc196]/20 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-[#002443]">PIX</p>
                <span className="text-[10px] font-semibold text-[#002443]/40 uppercase tracking-wider">
                  {reserva.pix.diasRetencao} dias
                </span>
              </div>
              <p className="text-3xl font-extrabold text-[#2bc196]">
                {reserva.pix.percentual}<span className="text-base text-[#2bc196]/60">%</span>
              </p>
              <p className="text-[11px] text-[#002443]/50 mt-1">retidos por {reserva.pix.diasRetencao} dias</p>
            </div>
          )}
          {cartaoAtiva && (
            <div className="rounded-xl bg-[#002443]/5 border border-[#002443]/10 p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-[#002443]">Cartão</p>
                <span className="text-[10px] font-semibold text-[#002443]/40 uppercase tracking-wider">
                  {reserva.cartao.diasRetencao} dias
                </span>
              </div>
              <p className="text-3xl font-extrabold text-[#002443]">
                {reserva.cartao.percentual}<span className="text-base text-[#002443]/40">%</span>
              </p>
              <p className="text-[11px] text-[#002443]/50 mt-1">retidos por {reserva.cartao.diasRetencao} dias</p>
            </div>
          )}
        </div>

        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
          <Lock className="w-3.5 h-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-900 leading-relaxed italic">
            "{reserva.disclaimer || DEFAULT_DISCLAIMER}"
          </p>
        </div>
      </CardContent>
    </Card>
  );
}