import React from 'react';
import { motion } from 'framer-motion';
import SlideLayout from './SlideLayout';
import { Building2, CreditCard, QrCode, DollarSign, Calendar, TrendingUp } from 'lucide-react';

const fmtBRL = (v) => v != null ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—';
const fmtPct = (v) => v != null ? `${Number(v).toFixed(2)}%` : '—';

const SEGMENT_LABELS = {
  educacao: 'Educação', infoprodutos: 'Infoprodutos', ecommerce: 'E-commerce',
  saas: 'SaaS', gateway: 'Gateway', marketplace: 'Marketplace',
  mpe: 'MPE', dropshipping: 'Dropshipping', plataformas_verticais: 'Plataformas Verticais',
  link_pagamento: 'Link de Pagamento',
};

export default function SlideSummary({ proposal = {}, contract = {}, slideNumber, totalSlides }) {
  const rates = proposal.rates || contract.rates || {};
  const cartao = rates.cartao || {};
  const pix = rates.pix || {};
  const visa1x = cartao.visa?.avista;
  const setupFee = rates.setup ?? contract.setupFee ?? 6000;

  const rateCards = [
    { icon: CreditCard, label: 'Cartão 1x (Visa)', value: fmtPct(visa1x), accent: true },
    { icon: CreditCard, label: 'Cartão 2-6x', value: fmtPct(cartao.visa?.de2a6x) },
    { icon: CreditCard, label: 'Cartão 7-12x', value: fmtPct(cartao.visa?.de7a12x) },
    { icon: QrCode, label: 'PIX', value: pix.tipo === 'fixo' ? fmtBRL(pix.valor) : fmtPct(pix.valor), accent: true },
    { icon: DollarSign, label: 'Setup', value: fmtBRL(setupFee) },
    { icon: TrendingUp, label: 'Antecipação', value: `${fmtPct(rates.percentualAntecipacao)} a.m.` },
  ];

  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <h2 className="text-xl font-extrabold text-[#0A0A0A] mb-0.5">Resumo do Cliente</h2>
      <p className="text-[10px] text-[#0A0A0A]/60 mb-4">Visão geral da operação e condições negociadas</p>

      <div className="flex-1 grid grid-cols-3 gap-4 content-start">
        {/* Client card - dark */}
        <div className="bg-gradient-to-br from-[#0A0A0A] to-[#003a6b] rounded-2xl p-4 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#1356E2] rounded-full blur-[60px] opacity-[0.12]" />
          <Building2 className="w-6 h-6 text-[#1356E2] mb-3" />
          <h3 className="text-sm font-bold mb-1">{proposal.clienteNome || contract.clientName || 'Cliente'}</h3>
          <p className="text-[10px] text-white/40 mb-3">{proposal.clienteCnpj || contract.clientDocument || '—'}</p>
          <div className="space-y-1.5">
            {[
              { k: 'Segmento', v: SEGMENT_LABELS[proposal.businessSubCategory] || proposal.businessSubCategory || '—', green: true },
              { k: 'Proposta', v: proposal.codigo || '—' },
              { k: 'Contrato', v: contract.codigo || '—' },
              { k: 'Contato', v: proposal.clienteContato || '—' },
            ].map((r, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-[9px] text-white/35">{r.k}</span>
                <span className={`text-[10px] font-semibold ${r.green ? 'text-[#1356E2]' : 'text-white/75'}`}>{r.v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rate cards */}
        <div className="col-span-2 grid grid-cols-3 gap-2.5">
          {rateCards.map((card, i) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.3 }}
                className={`rounded-2xl p-3 flex flex-col items-center justify-center text-center border ${
                  card.accent
                    ? 'bg-gradient-to-br from-[#1356E2]/10 to-[#1356E2]/5 border-[#1356E2]/20'
                    : 'bg-gradient-to-br from-[#0A0A0A]/[0.04] to-[#0A0A0A]/[0.02] border-[#0A0A0A]/[0.06]'
                }`}
              >
                <Icon className={`w-5 h-5 mb-1 ${card.accent ? 'text-[#1356E2]' : 'text-[#0A0A0A]/60'}`} />
                <span className="text-[9px] text-[#0A0A0A]/60">{card.label}</span>
                <span className={`text-lg font-bold font-mono ${card.accent ? 'text-[#1356E2]' : 'text-[#0A0A0A]'}`}>{card.value}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </SlideLayout>
  );
}