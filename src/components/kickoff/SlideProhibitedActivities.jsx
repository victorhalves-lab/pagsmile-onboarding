import React from 'react';
import { motion } from 'framer-motion';
import SlideLayout from './SlideLayout';
import { Ban, AlertOctagon } from 'lucide-react';

const PROHIBITED = [
  'Jogos de azar / apostas ilegais',
  'Pirâmides financeiras e esquemas Ponzi',
  'Venda de armas, munições e explosivos',
  'Drogas ilícitas e substâncias controladas',
  'Pornografia infantil ou conteúdo ilegal',
  'Financiamento ao terrorismo',
  'Lavagem de dinheiro / PLD-FT',
  'Falsificação de documentos e moedas',
  'Comércio de órgãos humanos',
  'Produtos contrabandeados ou piratas',
  'Serviços financeiros sem licença BACEN',
  'Criptomoedas sem registro junto à CVM',
];

const RESTRICTED = [
  'Alto índice de chargeback (> 1% do TPV)',
  'Operação sem site ou loja verificável',
  'Recorrência de disputas não resolvidas',
  'Ausência de política de reembolso',
  'Falta de transparência na precificação',
  'Descumprimento de normas PCI-DSS',
];

export default function SlideProhibitedActivities({ slideNumber, totalSlides }) {
  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides} variant="dark">
      <h2 className="text-xl font-extrabold text-white mb-0.5">Atividades Proibidas & Restrições</h2>
      <p className="text-[10px] text-white/35 mb-3">Conformidade contratual e regulatória — resumo das principais vedações</p>

      <div className="flex-1 grid grid-cols-2 gap-3">
        {/* Prohibited */}
        <motion.div
          initial={{ opacity: 0, x: -15 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="bg-red-500/[0.06] border border-red-500/[0.12] rounded-2xl p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center">
              <Ban className="w-4 h-4 text-red-400" />
            </div>
            <h3 className="text-[11px] font-bold text-red-400 uppercase tracking-wider">Atividades Vedadas</h3>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {PROHIBITED.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.03, duration: 0.2 }}
                className="flex items-start gap-1.5 px-2 py-1.5 bg-white/[0.03] rounded-lg border border-white/[0.04]"
              >
                <Ban className="w-3 h-3 text-red-400/60 flex-shrink-0 mt-0.5" />
                <span className="text-[8px] text-white/55 leading-tight">{item}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Restricted */}
        <motion.div
          initial={{ opacity: 0, x: 15 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="bg-amber-500/[0.06] border border-amber-500/[0.12] rounded-2xl p-4 flex flex-col"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Restrições Operacionais</h3>
          </div>
          <div className="space-y-1.5">
            {RESTRICTED.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.2 }}
                className="flex items-start gap-1.5 px-2 py-1.5 bg-white/[0.03] rounded-lg border border-white/[0.04]"
              >
                <AlertOctagon className="w-3 h-3 text-amber-400/60 flex-shrink-0 mt-0.5" />
                <span className="text-[8px] text-white/55 leading-tight">{item}</span>
              </motion.div>
            ))}
          </div>

          {/* Note */}
          <div className="mt-auto pt-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.04] rounded-xl border border-white/[0.06]">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-[8px] text-white/45">
                <strong className="text-white/60">Importante:</strong> O descumprimento destas regras pode resultar em suspensão imediata da conta conforme cláusulas contratuais.
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}