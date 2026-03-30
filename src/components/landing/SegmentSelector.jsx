import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const SEGMENT_DESCRIPTIONS = {
  'Educação': 'Instituições de ensino, cursos online, plataformas EAD e edtechs.',
  'SaaS': 'Empresas de software como serviço com cobrança recorrente (assinaturas).',
  'Plataformas Verticais': 'Plataformas especializadas em nichos como saúde, imobiliário, jurídico, agro, fitness, etc.',
  'E-commerce': 'Lojas virtuais que vendem produtos físicos ou digitais diretamente ao consumidor.',
  'Marketplace': 'Plataformas que conectam vendedores e compradores, intermediando transações entre múltiplos sellers.',
  'MPE': 'Micro e Pequenas Empresas — negócios locais como lojas, salões, oficinas e prestadores de serviço.',
  'Link de Pagamento': 'Empresas que vendem via links por WhatsApp, e-mail ou redes sociais.',
  'Infoprodutos': 'Produtores e afiliados de cursos, mentorias, e-books e conteúdo digital.',
  'Dropshipping': 'Lojas que vendem sem estoque próprio, com entrega feita diretamente pelo fornecedor.',
  'Gateway': 'Empresas que processam pagamentos para outros merchants (sub-adquirência ou facilitação).',
};

export default function SegmentSelector({ segments, activeSegment, onSelect }) {
  const [expandedInfo, setExpandedInfo] = useState(null);

  const toggleInfo = (name) => {
    setExpandedInfo(prev => prev === name ? null : name);
  };

  return (
    <div className="space-y-2">
      {/* Pills */}
      <div className="flex flex-wrap gap-2">
        {segments.map((seg) => {
          const isActive = seg.segmentName === activeSegment;
          const desc = SEGMENT_DESCRIPTIONS[seg.segmentName];
          const isInfoOpen = expandedInfo === seg.segmentName;

          return (
            <button
              key={seg.segmentName}
              onClick={() => onSelect(seg.segmentName)}
              className={`
                relative flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold
                transition-all duration-200 border-2 whitespace-nowrap
                ${isActive
                  ? 'bg-[#2bc196] text-white border-[#2bc196] shadow-md shadow-[#2bc196]/20'
                  : 'bg-white text-[#002443] border-[#002443]/10 hover:border-[#2bc196]/40 hover:bg-[#2bc196]/5'
                }
              `}
            >
              {seg.segmentName}
              {desc && (
                <span
                  onClick={(e) => { e.stopPropagation(); toggleInfo(seg.segmentName); }}
                  className={`
                    text-[10px] font-medium ml-0.5 underline decoration-dotted underline-offset-2 cursor-pointer
                    ${isActive ? 'text-white/70 hover:text-white' : 'text-[#002443]/35 hover:text-[#2bc196]'}
                  `}
                >
                  {isInfoOpen ? '✕' : '?'}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Expanded description */}
      <AnimatePresence mode="wait">
        {expandedInfo && SEGMENT_DESCRIPTIONS[expandedInfo] && (
          <motion.div
            key={expandedInfo}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="bg-[#002443]/[0.04] border border-[#002443]/[0.08] rounded-xl px-4 py-3 flex items-start gap-2">
              <ChevronDown className="w-3.5 h-3.5 text-[#2bc196] mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-[#002443]/70 mb-0.5">{expandedInfo}</p>
                <p className="text-xs text-[#002443]/55 leading-relaxed">{SEGMENT_DESCRIPTIONS[expandedInfo]}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}