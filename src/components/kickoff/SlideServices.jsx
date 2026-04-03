import React from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Wallet, QrCode, Send, FileText, Server, Check, Landmark, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

const ALL_MODULES = [
  { key: 'subadquirenciaCartao', icon: CreditCard, name: 'Subadquirência Cartão', desc: 'Processamento de crédito e débito via Visa, Mastercard, Elo e Amex', gradient: 'from-[#2bc196] to-emerald-600' },
  { key: 'contaPagamento', icon: Wallet, name: 'Conta de Pagamento', desc: 'Conta digital para liquidação, movimentação e gestão financeira', gradient: 'from-[#002443] to-blue-700' },
  { key: 'pixRecebimentos', icon: ArrowDownToLine, name: 'PIX IN', desc: 'API PIX para geração de cobranças com QR Code e conciliação automática', gradient: 'from-[#2bc196] to-teal-500' },
  { key: 'pixPagamentos', icon: ArrowUpFromLine, name: 'PIX OUT', desc: 'Envio de pagamentos via PIX para fornecedores e parceiros', gradient: 'from-purple-500 to-purple-700' },
  { key: 'boleto', icon: FileText, name: 'Boleto Bancário', desc: 'Emissão e gestão de boletos com registro automático', gradient: 'from-amber-500 to-orange-600' },
  { key: 'gateway', icon: Server, name: 'Gateway de Pagamento', desc: 'Infraestrutura de roteamento e orquestração de pagamentos', gradient: 'from-[#002443] to-[#003a6b]' },
  { key: 'baas', icon: Landmark, name: 'BaaS — Bank as a Service', desc: 'Infraestrutura bancária completa: contas, transferências e gestão financeira integrada', gradient: 'from-[#002443] to-[#2bc196]' },
];

export default function SlideServices({ modules = {}, slideNumber, totalSlides }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="relative w-full aspect-[16/9] bg-gradient-to-br from-[#002443] via-[#002443] to-[#003a6b] rounded-3xl overflow-hidden shadow-[0_8px_40px_rgba(0,36,67,0.2)]"
      style={{ pageBreakAfter: 'always', pageBreakInside: 'avoid' }}
    >
      {/* Background effects */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-[#2bc196] rounded-full blur-[180px] opacity-[0.07]" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-[#5cf7cf] rounded-full blur-[140px] opacity-[0.05]" />
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#002443] via-[#2bc196] to-[#5cf7cf]" />
      <div className="absolute left-0 top-1.5 bottom-9 w-[3px] bg-gradient-to-b from-[#2bc196] via-[#2bc196]/30 to-transparent rounded-r" />

      {/* Content */}
      <div className="absolute inset-0 pt-6 pb-12 px-10 flex flex-col">
        <h2 className="text-xl font-extrabold text-white mb-0.5">Serviços Contratados</h2>
        <p className="text-[10px] text-[#2bc196]/60 mb-4">Ecossistema completo de pagamentos e serviços financeiros</p>

        <div className="flex-1 grid grid-cols-4 gap-2.5 content-start">
          {ALL_MODULES.map((mod, i) => {
            const Icon = mod.icon;
            const isActive = modules[mod.key];
            return (
              <motion.div
                key={mod.key}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
                className={`relative rounded-2xl p-3.5 border transition-all group ${
                  isActive
                    ? 'bg-gradient-to-br from-[#2bc196]/15 to-[#2bc196]/5 border-[#2bc196]/30 shadow-lg shadow-[#2bc196]/5'
                    : 'bg-gradient-to-br from-white/[0.06] to-white/[0.02] border-white/[0.10] hover:border-[#2bc196]/20 hover:bg-white/[0.08]'
                }`}
              >
                {isActive && (
                  <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#2bc196] flex items-center justify-center shadow-md shadow-[#2bc196]/30">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}

                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center mb-3 shadow-lg shadow-black/20 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>

                <h3 className={`text-[11px] font-bold mb-1 ${isActive ? 'text-[#2bc196]' : 'text-white/80'}`}>{mod.name}</h3>
                <p className={`text-[8px] leading-[1.5] ${isActive ? 'text-white/50' : 'text-white/35'}`}>{mod.desc}</p>

                {isActive ? (
                  <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-[#2bc196]/15 border border-[#2bc196]/25">
                    <span className="text-[7px] text-[#2bc196] font-bold">Ativo</span>
                  </div>
                ) : (
                  <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.10]">
                    <span className="text-[7px] text-white/35 font-medium">Disponível</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 h-9 flex items-center justify-between px-10 bg-white/[0.03] border-t border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-[#2bc196] to-[#002443] flex items-center justify-center">
            <span className="text-[6px] font-bold text-white">P</span>
          </div>
          <span className="text-[8px] font-semibold tracking-wider uppercase text-white/20">Pagsmile</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[8px] tracking-wider text-white/15">CONFIDENCIAL</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalSlides }, (_, i) => (
              <div key={i} className={`w-1 h-1 rounded-full transition-all ${i + 1 === slideNumber ? 'bg-[#2bc196] w-3' : 'bg-white/15'}`} />
            ))}
          </div>
          <span className="text-[9px] font-mono font-medium text-white/25">{String(slideNumber).padStart(2, '0')}</span>
        </div>
      </div>
    </motion.div>
  );
}