import React from 'react';
import { ShieldCheck, Info, RotateCcw, Lock } from 'lucide-react';
import {
  PIX_PERCENT_OPTIONS, CARTAO_PERCENT_OPTIONS,
  PIX_DIAS_RETENCAO, CARTAO_DIAS_RETENCAO,
  DEFAULT_RESERVA, DEFAULT_DISCLAIMER, getReservaWithDefaults,
} from '@/lib/reservaFinanceiraDefaults';

/**
 * Editor de Reserva Financeira (Rolling Reserve) para CriarProposta.
 *
 * UX:
 *   • Toggle PIX  ─ pills com [1%, 2%, 3%, 4%, 5%] · prazo fixo "90 dias"
 *   • Toggle Cartão ─ pills com [5%, 10%, 15%, 20%] · prazo fixo "180 dias"
 *   • Disclaimer editável (multiline)
 *   • Botão "Restaurar padrão" → PIX 1%/90d + Cartão 20%/180d
 *
 * Trabalha com `rates.reservaFinanceira` — usa o helper para garantir defaults
 * em propostas antigas que ainda não têm o campo.
 */
export default function CardReservaFinanceira({ rates, onUpdateRates, readOnly = false }) {
  const reserva = getReservaWithDefaults(rates);

  const update = (path, value) => {
    const next = { ...reserva };
    const keys = path.split('.');
    let cursor = next;
    for (let i = 0; i < keys.length - 1; i++) {
      cursor[keys[i]] = { ...cursor[keys[i]] };
      cursor = cursor[keys[i]];
    }
    cursor[keys[keys.length - 1]] = value;
    onUpdateRates({ ...rates, reservaFinanceira: next });
  };

  const restoreDefault = () => {
    onUpdateRates({ ...rates, reservaFinanceira: { ...DEFAULT_RESERVA } });
  };

  const Pill = ({ active, onClick, children }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={readOnly}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
        active
          ? 'bg-[#1356E2] text-[#0A0A0A] shadow-md shadow-[#1356E2]/20'
          : 'bg-white/5 text-white/40 hover:text-white/70 border border-white/5'
      } ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  const Block = ({ kind, title, options, diasFixos, data }) => (
    <div className={`rounded-xl p-4 border ${data.ativa ? 'bg-white/[0.04] border-white/10' : 'bg-white/[0.02] border-white/5 opacity-60'}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-white">{title}</p>
          <p className="text-[10px] text-white/40 mt-0.5">Prazo fixo: {diasFixos} dias</p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-[10px] text-white/50 uppercase font-semibold">{data.ativa ? 'Ativa' : 'Inativa'}</span>
          <button
            type="button"
            onClick={() => !readOnly && update(`${kind}.ativa`, !data.ativa)}
            disabled={readOnly}
            className={`relative w-10 h-5 rounded-full transition-colors ${data.ativa ? 'bg-[#1356E2]' : 'bg-white/15'} ${readOnly ? 'cursor-not-allowed' : ''}`}
          >
            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${data.ativa ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </label>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <Pill key={opt} active={data.percentual === opt} onClick={() => !readOnly && data.ativa && update(`${kind}.percentual`, opt)}>
            {opt}%
          </Pill>
        ))}
      </div>
    </div>
  );

  return (
    <div className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#1356E2]/10 flex items-center justify-center">
            <ShieldCheck className="w-3.5 h-3.5 text-[#FFB81C]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Reserva Financeira</h2>
            <p className="text-[10px] text-white/40">Rolling Reserve — proteção contra chargebacks e disputas</p>
          </div>
        </div>
        {!readOnly && (
          <button
            type="button"
            onClick={restoreDefault}
            className="flex items-center gap-1.5 text-[10px] text-[#FFB81C]/70 hover:text-[#FFB81C] font-semibold uppercase tracking-wider"
          >
            <RotateCcw className="w-3 h-3" /> Padrão Pin Bank
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Block kind="pix" title="PIX" options={PIX_PERCENT_OPTIONS} diasFixos={PIX_DIAS_RETENCAO} data={reserva.pix} />
        <Block kind="cartao" title="Cartão" options={CARTAO_PERCENT_OPTIONS} diasFixos={CARTAO_DIAS_RETENCAO} data={reserva.cartao} />
      </div>

      <div className="rounded-xl bg-white/[0.03] border border-white/10 p-3 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3 h-3 text-white/30" />
          <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">
            Disclaimer oficial (fixo)
          </span>
        </div>
        <p className="text-xs text-white/70 leading-relaxed italic">
          "{DEFAULT_DISCLAIMER}"
        </p>
        <div className="flex items-start gap-1.5 text-[10px] text-white/30 pt-1">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>Texto padrão Pin Bank — não editável. Aparece na proposta pública abaixo dos percentuais.</span>
        </div>
      </div>
    </div>
  );
}