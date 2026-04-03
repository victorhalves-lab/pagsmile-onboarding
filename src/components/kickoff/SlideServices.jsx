import React from 'react';
import { motion } from 'framer-motion';
import SlideLayout from './SlideLayout';
import { CreditCard, Wallet, QrCode, Send, FileText, Server, Check, Landmark, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';

const ALL_MODULES = [
  { key: 'subadquirenciaCartao', icon: CreditCard, name: 'Subadquirência Cartão', desc: 'Processamento de crédito e débito via Visa, Mastercard, Elo e Amex', gradient: 'from-[#2bc196] to-emerald-600', bg: 'bg-[#2bc196]/10', border: 'border-[#2bc196]/25' },
  { key: 'contaPagamento', icon: Wallet, name: 'Conta de Pagamento', desc: 'Conta digital para liquidação, movimentação e gestão financeira', gradient: 'from-[#002443] to-blue-700', bg: 'bg-[#002443]/10', border: 'border-[#002443]/15' },
  { key: 'pixRecebimentos', icon: ArrowDownToLine, name: 'PIX IN', desc: 'API PIX para geração de cobranças com QR Code e conciliação automática', gradient: 'from-[#2bc196] to-teal-500', bg: 'bg-teal-500/10', border: 'border-teal-500/20' },
  { key: 'pixPagamentos', icon: ArrowUpFromLine, name: 'PIX OUT', desc: 'Envio de pagamentos via PIX para fornecedores e parceiros', gradient: 'from-purple-500 to-purple-700', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  { key: 'boleto', icon: FileText, name: 'Boleto Bancário', desc: 'Emissão e gestão de boletos com registro automático', gradient: 'from-amber-500 to-orange-600', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  { key: 'gateway', icon: Server, name: 'Gateway de Pagamento', desc: 'Infraestrutura de roteamento e orquestração de pagamentos', gradient: 'from-[#002443] to-[#003a6b]', bg: 'bg-blue-900/10', border: 'border-blue-900/15' },
  { key: 'baas', icon: Landmark, name: 'BaaS — Bank as a Service', desc: 'Infraestrutura bancária completa para contas, transferências e gestão financeira integrada', gradient: 'from-[#002443] to-[#2bc196]', bg: 'bg-gradient-to-br from-[#002443]/10 to-[#2bc196]/10', border: 'border-[#2bc196]/20' },
];

export default function SlideServices({ modules = {}, slideNumber, totalSlides }) {
  // Sempre mostra todos os módulos com cor — ativos com badge, inativos sem badge mas com visual
  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides} variant="dark">
      <h2 className="text-xl font-extrabold text-white mb-0.5">Serviços Contratados</h2>
      <p className="text-[10px] text-white/40 mb-4">Ecossistema completo de pagamentos e serviços financeiros</p>

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
                  ? 'bg-white/[0.06] border-[#2bc196]/25 hover:bg-white/[0.1] hover:shadow-lg hover:shadow-[#2bc196]/5'
                  : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.05]'
              }`}
            >
              {/* Active badge */}
              {isActive && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#2bc196] flex items-center justify-center shadow-md shadow-[#2bc196]/30">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}

              {/* Icon */}
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center mb-3 shadow-lg shadow-black/20 group-hover:scale-105 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>

              {/* Text */}
              <h3 className={`text-[11px] font-bold mb-1 ${isActive ? 'text-[#2bc196]' : 'text-white/70'}`}>{mod.name}</h3>
              <p className={`text-[8px] leading-[1.5] ${isActive ? 'text-white/50' : 'text-white/30'}`}>{mod.desc}</p>

              {/* Status tag */}
              {!isActive && (
                <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08]">
                  <span className="text-[7px] text-white/30 font-medium">Disponível</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </SlideLayout>
  );
}