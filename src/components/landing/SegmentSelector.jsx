import React, { useState } from 'react';
import { Info, X, TrendingUp } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getMinRevenueLabel } from '@/lib/segmentConfig';

const SEGMENT_DESCRIPTIONS = {
  'Educação': {
    short: 'Ensino e EAD',
    long: 'Instituições de ensino, cursos online, plataformas EAD e edtechs. Ideal para escolas, universidades, plataformas de cursos e qualquer negócio voltado à educação com cobrança de mensalidades, matrículas ou vendas de conteúdo educacional.',
  },
  'SaaS': {
    short: 'Software por assinatura',
    long: 'Empresas de software como serviço com cobrança recorrente (assinaturas). Inclui plataformas de gestão, CRMs, ERPs, ferramentas de marketing, produtividade e qualquer modelo baseado em planos mensais ou anuais.',
  },
  'Plataformas Verticais': {
    short: 'Nichos especializados',
    long: 'Plataformas especializadas em nichos como saúde, imobiliário, jurídico, agro, fitness, turismo, etc. Atendem verticais específicas com soluções de pagamento integradas ao seu ecossistema.',
  },
  'E-commerce': {
    short: 'Loja virtual',
    long: 'Lojas virtuais que vendem produtos físicos ou digitais diretamente ao consumidor. Inclui e-commerces próprios (Shopify, WooCommerce, VTEX, etc.) e qualquer modelo de venda online direta.',
  },
  'Marketplace': {
    short: 'Multi-sellers',
    long: 'Plataformas que conectam vendedores e compradores, intermediando transações entre múltiplos sellers. Inclui marketplaces de produtos, serviços e delivery com split de pagamento automático.',
  },
  'MPE': {
    short: 'Micro e Pequena Empresa',
    long: 'Micro e Pequenas Empresas — negócios locais como lojas, salões, oficinas, restaurantes e prestadores de serviço. Faturamento até R$ 4,8 milhões/ano com necessidades de pagamento simples e acessíveis.',
  },
  'Link de Pagamento': {
    short: 'Vendas por link',
    long: 'Empresas que vendem via links compartilhados por WhatsApp, e-mail, Instagram ou redes sociais. Ideal para profissionais autônomos, pequenos comércios e vendas por chat sem necessidade de loja virtual.',
  },
  'Infoprodutos': {
    short: 'Conteúdo digital',
    long: 'Produtores e afiliados de cursos, mentorias, e-books, comunidades e conteúdo digital. Engloba todo o ecossistema de infoprodutos incluindo lançamentos, perpétuos e assinaturas de conteúdo.',
  },
  'Dropshipping': {
    short: 'Venda sem estoque',
    long: 'Lojas que vendem sem estoque próprio, com entrega feita diretamente pelo fornecedor (nacional ou internacional). Modelo de maior risco por chargeback e prazo de entrega estendido.',
  },
  'Gateway': {
    short: 'Processamento para terceiros',
    long: 'Empresas que processam pagamentos para outros merchants (sub-adquirência ou facilitação). Modelo de alto risco que exige compliance reforçado, KYC dos sub-merchants e monitoramento contínuo de transações.',
  },
};

export default function SegmentSelector({ segments, activeSegment, onSelect, onInfoClick, introducerSlug }) {
  const [modalSegment, setModalSegment] = useState(null);

  const openModal = (name) => {
    setModalSegment(name);
    if (onInfoClick) onInfoClick(name);
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {segments.map((seg) => {
          const isActive = seg.segmentName === activeSegment;
          const desc = SEGMENT_DESCRIPTIONS[seg.segmentName];

          return (
            <div key={seg.segmentName} className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => {
                  base44.analytics.track({
                    eventName: 'landing_segment_selected',
                    properties: {
                      segment_name: seg.segmentName,
                      introducer_slug: introducerSlug || '',
                      device: window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
                    }
                  });
                  onSelect(seg.segmentName);
                }}
                className={`
                  w-full px-3 py-3 rounded-xl text-sm font-bold
                  transition-all duration-200 border-2 text-center leading-tight
                  ${isActive
                    ? 'bg-[#1356E2] text-white border-[#1356E2] shadow-md shadow-[#1356E2]/20'
                    : 'bg-white text-[#0A0A0A] border-[#0A0A0A]/10 hover:border-[#1356E2]/40 hover:bg-[#1356E2]/5'
                  }
                `}
              >
                {seg.segmentName}
                {desc && (
                  <span className={`block text-[10px] font-medium mt-0.5 ${isActive ? 'text-white/60' : 'text-[#0A0A0A]/40'}`}>
                    {desc.short}
                  </span>
                )}
              </button>
              <div className="flex flex-col items-center gap-1">
                <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60">
                  <TrendingUp className="w-2.5 h-2.5" />
                  {getMinRevenueLabel(seg.segmentName)}
                </span>
                {desc && (
                  <button
                    onClick={(e) => { e.stopPropagation(); openModal(seg.segmentName); }}
                    className="flex items-center gap-1 text-[10px] font-semibold text-[#1356E2] hover:text-[#0A0A0A] transition-colors"
                  >
                    <Info className="w-3 h-3" />
                    Saiba mais
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalSegment && SEGMENT_DESCRIPTIONS[modalSegment] && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setModalSegment(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setModalSegment(null)}
              className="absolute top-4 right-4 text-[#0A0A0A]/30 hover:text-[#0A0A0A] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-[#1356E2]/10 rounded-xl">
                <Info className="w-5 h-5 text-[#1356E2]" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-[#0A0A0A]">{modalSegment}</h3>
                <p className="text-xs text-[#0A0A0A]/40 font-medium">{SEGMENT_DESCRIPTIONS[modalSegment].short}</p>
              </div>
            </div>

            <p className="text-sm text-[#0A0A0A]/70 leading-relaxed">
              {SEGMENT_DESCRIPTIONS[modalSegment].long}
            </p>

            <button
              onClick={() => setModalSegment(null)}
              className="mt-5 w-full bg-[#1356E2] hover:bg-[#1356E2]/90 text-white font-bold text-sm py-2.5 rounded-xl transition-colors"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
}