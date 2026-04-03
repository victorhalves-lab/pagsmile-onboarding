import React from 'react';
import SlideLayout from './SlideLayout';
import { Building2, CreditCard, QrCode, FileText, DollarSign, Calendar } from 'lucide-react';

const fmtBRL = (v) => v != null ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—';
const fmtPct = (v) => v != null ? `${Number(v).toFixed(2)}%` : '—';

export default function SlideSummary({ proposal = {}, contract = {}, slideNumber, totalSlides }) {
  const rates = proposal.rates || contract.rates || {};
  const cartao = rates.cartao || {};
  const pix = rates.pix || {};
  const visa1x = cartao.visa?.avista;
  const setupFee = rates.setup ?? contract.setupFee ?? 6000;

  const SEGMENT_LABELS = {
    educacao: 'Educação', infoprodutos: 'Infoprodutos', ecommerce: 'E-commerce',
    saas: 'SaaS', gateway: 'Gateway', marketplace: 'Marketplace',
    mpe: 'MPE', dropshipping: 'Dropshipping', plataformas_verticais: 'Plataformas Verticais',
    link_pagamento: 'Link de Pagamento',
  };

  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <h2 className="text-xl font-bold text-[#002443] mb-1">Resumo do Cliente</h2>
      <p className="text-[10px] text-[#002443]/50 mb-4">Visão geral da operação e condições negociadas</p>

      <div className="flex-1 grid grid-cols-3 gap-4 content-start">
        {/* Client Info */}
        <div className="bg-[#002443] rounded-xl p-4 text-white col-span-1">
          <Building2 className="w-6 h-6 text-[#2bc196] mb-3" />
          <h3 className="text-sm font-bold mb-1">{proposal.clienteNome || contract.clientName || 'Cliente'}</h3>
          <p className="text-[10px] text-white/50 mb-3">{proposal.clienteCnpj || contract.clientDocument || '—'}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[9px] text-white/40">Segmento</span>
              <span className="text-[10px] font-semibold text-[#2bc196]">{SEGMENT_LABELS[proposal.businessSubCategory] || proposal.businessSubCategory || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[9px] text-white/40">Proposta</span>
              <span className="text-[10px] font-semibold text-white/80">{proposal.codigo || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[9px] text-white/40">Contrato</span>
              <span className="text-[10px] font-semibold text-white/80">{contract.codigo || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[9px] text-white/40">Contato</span>
              <span className="text-[10px] font-semibold text-white/80">{proposal.clienteContato || '—'}</span>
            </div>
          </div>
        </div>

        {/* Key Rates */}
        <div className="col-span-2 grid grid-cols-3 gap-2">
          <div className="bg-[#2bc196]/5 border border-[#2bc196]/15 rounded-xl p-3 flex flex-col items-center justify-center text-center">
            <CreditCard className="w-5 h-5 text-[#2bc196] mb-1" />
            <span className="text-[9px] text-[#002443]/50">Cartão 1x (Visa)</span>
            <span className="text-lg font-bold font-mono text-[#2bc196]">{fmtPct(visa1x)}</span>
          </div>
          <div className="bg-[#f4f4f4] rounded-xl p-3 flex flex-col items-center justify-center text-center">
            <CreditCard className="w-5 h-5 text-[#002443]/50 mb-1" />
            <span className="text-[9px] text-[#002443]/50">Cartão 2-6x (Visa)</span>
            <span className="text-lg font-bold font-mono text-[#002443]">{fmtPct(cartao.visa?.de2a6x)}</span>
          </div>
          <div className="bg-[#f4f4f4] rounded-xl p-3 flex flex-col items-center justify-center text-center">
            <CreditCard className="w-5 h-5 text-[#002443]/50 mb-1" />
            <span className="text-[9px] text-[#002443]/50">Cartão 7-12x (Visa)</span>
            <span className="text-lg font-bold font-mono text-[#002443]">{fmtPct(cartao.visa?.de7a12x)}</span>
          </div>
          <div className="bg-[#2bc196]/5 border border-[#2bc196]/15 rounded-xl p-3 flex flex-col items-center justify-center text-center">
            <QrCode className="w-5 h-5 text-[#2bc196] mb-1" />
            <span className="text-[9px] text-[#002443]/50">PIX</span>
            <span className="text-lg font-bold font-mono text-[#2bc196]">
              {pix.tipo === 'fixo' ? fmtBRL(pix.valor) : fmtPct(pix.valor)}
            </span>
          </div>
          <div className="bg-[#f4f4f4] rounded-xl p-3 flex flex-col items-center justify-center text-center">
            <DollarSign className="w-5 h-5 text-[#002443]/50 mb-1" />
            <span className="text-[9px] text-[#002443]/50">Setup</span>
            <span className="text-lg font-bold font-mono text-[#002443]">{fmtBRL(setupFee)}</span>
          </div>
          <div className="bg-[#f4f4f4] rounded-xl p-3 flex flex-col items-center justify-center text-center">
            <Calendar className="w-5 h-5 text-[#002443]/50 mb-1" />
            <span className="text-[9px] text-[#002443]/50">Antecipação</span>
            <span className="text-lg font-bold font-mono text-[#002443]">{fmtPct(rates.percentualAntecipacao)} a.m.</span>
          </div>
        </div>
      </div>
    </SlideLayout>
  );
}