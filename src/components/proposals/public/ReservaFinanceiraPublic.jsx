import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, Info, CreditCard, Zap } from 'lucide-react';
import { getReservaWithDefaults } from '@/lib/reservaFinanceiraDefaults';

/**
 * Exibição pública da Reserva Financeira na PropostaPublica.
 *
 * Tolerante a propostas antigas: getReservaWithDefaults injeta os defaults
 * (PIX 1%/90d + Cartão 20%/180d) se a proposta ainda não tem o campo gravado.
 */
export default function ReservaFinanceiraPublic({ rates }) {
  const reserva = getReservaWithDefaults(rates);

  // Se ambos estiverem inativos, não exibe a seção (evita poluir propostas
  // onde o vendedor explicitamente desativou as duas).
  if (!reserva.pix.ativa && !reserva.cartao.ativa) return null;

  const Block = ({ icon: Icon, label, percent, dias, color, ativa }) => (
    <div className={`flex-1 rounded-2xl p-5 border ${ativa ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-50'}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color.bg}`}>
          <Icon className={`w-4 h-4 ${color.text}`} />
        </div>
        <p className="text-sm font-bold text-[#002443]">{label}</p>
      </div>
      {ativa ? (
        <div className="space-y-1">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-3xl font-extrabold ${color.text} font-mono`}>{percent}%</span>
            <span className="text-xs text-[#002443]/50">de retenção</span>
          </div>
          <p className="text-xs text-[#002443]/70">
            Liberação em <span className="font-bold text-[#002443]">{dias} dias</span>
          </p>
        </div>
      ) : (
        <p className="text-xs text-[#002443]/40 italic">Não aplicável</p>
      )}
    </div>
  );

  return (
    <Card className="mb-4 border-[#2bc196]/20 bg-gradient-to-br from-[#2bc196]/5 to-transparent">
      <CardContent className="py-5">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-[#2bc196]" />
          <h3 className="font-bold text-sm text-[#002443] uppercase tracking-wide">
            Reserva Financeira
          </h3>
        </div>

        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <Block
            icon={Zap}
            label="PIX"
            percent={reserva.pix.percentual}
            dias={reserva.pix.diasRetencao}
            color={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
            ativa={reserva.pix.ativa}
          />
          <Block
            icon={CreditCard}
            label="Cartão"
            percent={reserva.cartao.percentual}
            dias={reserva.cartao.diasRetencao}
            color={{ bg: 'bg-amber-50', text: 'text-amber-600' }}
            ativa={reserva.cartao.ativa}
          />
        </div>

        <div className="flex items-start gap-2 bg-[#2bc196]/8 border border-[#2bc196]/20 rounded-xl px-4 py-3">
          <Info className="w-4 h-4 text-[#36706c] mt-0.5 flex-shrink-0" />
          <p className="text-xs text-[#002443]/80 leading-relaxed">
            {reserva.disclaimer}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}