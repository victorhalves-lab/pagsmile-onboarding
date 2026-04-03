import React from 'react';
import { motion } from 'framer-motion';
import SlideLayout from './SlideLayout';
import { CreditCard, Wallet, QrCode, Send, FileText, Server, Check, X } from 'lucide-react';

const ALL_MODULES = [
  { key: 'subadquirenciaCartao', icon: CreditCard, name: 'Subadquirência Cartão', desc: 'Processamento de crédito e débito via Visa, Mastercard, Elo e Amex', gradient: 'from-[#2bc196] to-emerald-600' },
  { key: 'contaPagamento', icon: Wallet, name: 'Conta de Pagamento', desc: 'Conta digital para liquidação, movimentação e gestão financeira', gradient: 'from-[#002443] to-blue-700' },
  { key: 'pixRecebimentos', icon: QrCode, name: 'PIX Recebimentos', desc: 'API PIX para geração de cobranças com QR Code e conciliação automática', gradient: 'from-[#2bc196] to-teal-500' },
  { key: 'pixPagamentos', icon: Send, name: 'PIX Pagamentos', desc: 'Envio de pagamentos via PIX para fornecedores e parceiros', gradient: 'from-purple-500 to-purple-700' },
  { key: 'boleto', icon: FileText, name: 'Boleto Bancário', desc: 'Emissão e gestão de boletos com registro automático', gradient: 'from-amber-500 to-orange-600' },
  { key: 'gateway', icon: Server, name: 'Gateway de Pagamento', desc: 'Infraestrutura de roteamento e orquestração de pagamentos', gradient: 'from-[#002443] to-[#003a6b]' },
];

export default function SlideServices({ modules = {}, slideNumber, totalSlides }) {
  const activeModules = ALL_MODULES.filter(m => modules[m.key]);
  const inactiveModules = ALL_MODULES.filter(m => !modules[m.key]);

  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <h2 className="text-xl font-extrabold text-[#002443] mb-0.5">Serviços Contratados</h2>
      <p className="text-[10px] text-[#002443]/60 mb-4">Módulos ativados para sua operação</p>

      <div className="flex-1 grid grid-cols-3 gap-3">
        {activeModules.map((mod, i) => {
          const Icon = mod.icon;
          return (
            <motion.div key={mod.key} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.4 }}
              className="bg-gradient-to-br from-[#002443]/[0.04] to-[#2bc196]/[0.06] border border-[#2bc196]/15 rounded-2xl p-4 relative group hover:shadow-lg transition-all"
            >
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#2bc196] flex items-center justify-center shadow-sm">
                <Check className="w-3 h-3 text-white" />
              </div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${mod.gradient} flex items-center justify-center mb-3 shadow-sm`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-[11px] font-bold text-[#002443] mb-1">{mod.name}</h3>
              <p className="text-[8.5px] text-[#002443]/55 leading-[1.5]">{mod.desc}</p>
            </motion.div>
          );
        })}
        {inactiveModules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div key={mod.key} className="bg-[#002443]/[0.02] border border-[#002443]/[0.05] rounded-2xl p-4 opacity-40">
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#002443]/10 flex items-center justify-center">
                <X className="w-3 h-3 text-[#002443]/30" />
              </div>
              <Icon className="w-8 h-8 text-[#002443]/20 mb-2" />
              <h3 className="text-[11px] font-bold text-[#002443]/35 mb-1">{mod.name}</h3>
              <p className="text-[8.5px] text-[#002443]/25">Não contratado</p>
            </div>
          );
        })}
      </div>
    </SlideLayout>
  );
}