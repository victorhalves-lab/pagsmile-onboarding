import React from 'react';
import { motion } from 'framer-motion';
import SlideLayout from './SlideLayout';
import { ArrowDown, ArrowRight, Banknote, Building2, Users, Percent, Wallet } from 'lucide-react';

export default function SlideSplitPayment({ clientName, slideNumber, totalSlides }) {
  const displayName = clientName || 'Seu Negócio';

  const FLOW = [
    { icon: Banknote, label: 'Pagamento do\nCliente Final', color: 'from-[#1356E2] to-emerald-600', desc: 'O cliente final realiza o pagamento (Cartão, PIX ou Boleto)' },
    { icon: Building2, label: 'Adquirente\nPagsmile', color: 'from-[#0A0A0A] to-blue-700', desc: 'O valor é processado e cai na adquirente da Pin Bank' },
    { icon: Percent, label: 'Split Automático\nde Taxas', color: 'from-purple-500 to-purple-700', desc: 'A taxa da Pin Bank e a taxa do cliente são retiradas automaticamente por split' },
    { icon: Wallet, label: 'Subseller\nRecebe', color: 'from-amber-500 to-orange-600', desc: 'O subseller recebe diretamente na conta via split — sem intermediários' },
  ];

  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <h2 className="text-xl font-extrabold text-[#0A0A0A] mb-0.5">Fluxo de Liquidação via Split</h2>
      <p className="text-[10px] text-[#0A0A0A]/60 mb-4">Repasse direto e automático para cada subseller</p>

      <div className="flex-1 flex flex-col gap-4">
        {/* Flow diagram */}
        <div className="flex items-stretch gap-2">
          {FLOW.map((step, i) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={i}>
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="flex-1 bg-gradient-to-br from-[#0A0A0A]/[0.04] to-[#1356E2]/[0.04] border border-[#0A0A0A]/[0.06] rounded-2xl p-3.5 text-center"
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-2 shadow-sm`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[10px] font-bold text-[#0A0A0A] mb-1 whitespace-pre-line leading-tight">{step.label}</p>
                  <p className="text-[8px] text-[#0A0A0A]/50 leading-tight">{step.desc}</p>
                </motion.div>
                {i < FLOW.length - 1 && (
                  <div className="flex items-center">
                    <ArrowRight className="w-4 h-4 text-[#1356E2]/50" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Split detail box */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="bg-gradient-to-br from-[#0A0A0A] to-[#003a6b] rounded-2xl p-5 text-white relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#1356E2] rounded-full blur-[80px] opacity-10" />
          <h3 className="text-[11px] font-bold text-[#1356E2] uppercase tracking-wider mb-3">Como Funciona o Split</h3>

          <div className="flex items-center gap-3">
            {/* Pagamento */}
            <div className="flex-1 bg-white/[0.06] rounded-xl p-3 text-center border border-white/[0.08]">
              <span className="text-[9px] text-white/40 block mb-1">Valor Total</span>
              <span className="text-sm font-bold text-white">R$ 100,00</span>
            </div>
            <ArrowRight className="w-4 h-4 text-[#1356E2]/40 flex-shrink-0" />
            {/* Pin Bank */}
            <div className="flex-1 bg-[#1356E2]/10 rounded-xl p-3 text-center border border-[#1356E2]/20">
              <span className="text-[9px] text-[#1356E2]/60 block mb-1">Taxa Pin Bank</span>
              <span className="text-sm font-bold text-[#1356E2]">- R$ 3,50</span>
            </div>
            <ArrowRight className="w-4 h-4 text-[#1356E2]/40 flex-shrink-0" />
            {/* Client */}
            <div className="flex-1 bg-white/[0.06] rounded-xl p-3 text-center border border-white/[0.08]">
              <span className="text-[9px] text-white/40 block mb-1">Taxa {displayName}</span>
              <span className="text-sm font-bold text-white">- R$ 1,50</span>
            </div>
            <ArrowRight className="w-4 h-4 text-[#1356E2]/40 flex-shrink-0" />
            {/* Seller */}
            <div className="flex-1 bg-[#1356E2]/10 rounded-xl p-3 text-center border border-[#1356E2]/20">
              <span className="text-[9px] text-[#1356E2]/60 block mb-1">Subseller Recebe</span>
              <span className="text-lg font-bold text-[#1356E2]">R$ 95,00</span>
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] rounded-lg border border-white/[0.06]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#1356E2]" />
            <span className="text-[8px] text-white/50">
              <strong className="text-white/70">Tudo por split:</strong> O subseller recebe diretamente na conta — sem necessidade de repasse manual. Transparência total.
            </span>
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}