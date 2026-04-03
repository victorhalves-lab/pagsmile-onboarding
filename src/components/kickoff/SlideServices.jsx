import React from 'react';
import SlideLayout from './SlideLayout';
import { CreditCard, Wallet, QrCode, Send, FileText, Server, Check } from 'lucide-react';

const ALL_MODULES = [
  { key: 'subadquirenciaCartao', icon: CreditCard, name: 'Subadquirência Cartão', desc: 'Processamento de crédito e débito via Visa, Mastercard, Elo e Amex' },
  { key: 'contaPagamento', icon: Wallet, name: 'Conta de Pagamento', desc: 'Conta digital para liquidação, movimentação e gestão financeira' },
  { key: 'pixRecebimentos', icon: QrCode, name: 'PIX Recebimentos', desc: 'API PIX para geração de cobranças com QR Code e conciliação automática' },
  { key: 'pixPagamentos', icon: Send, name: 'PIX Pagamentos', desc: 'Envio de pagamentos via PIX para fornecedores e parceiros' },
  { key: 'boleto', icon: FileText, name: 'Boleto Bancário', desc: 'Emissão e gestão de boletos com registro automático' },
  { key: 'gateway', icon: Server, name: 'Gateway de Pagamento', desc: 'Infraestrutura de roteamento e orquestração de pagamentos' },
];

export default function SlideServices({ modules = {}, slideNumber, totalSlides }) {
  const activeModules = ALL_MODULES.filter(m => modules[m.key]);
  const inactiveModules = ALL_MODULES.filter(m => !modules[m.key]);

  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <h2 className="text-xl font-bold text-[#002443] mb-1">Serviços Contratados</h2>
      <p className="text-[10px] text-[#002443]/50 mb-4">Módulos ativados para sua operação</p>

      <div className="flex-1 grid grid-cols-3 gap-3">
        {activeModules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div key={mod.key} className="bg-[#2bc196]/5 border border-[#2bc196]/20 rounded-xl p-3 relative">
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#2bc196] flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
              <Icon className="w-6 h-6 text-[#2bc196] mb-2" />
              <h3 className="text-[11px] font-bold text-[#002443] mb-1">{mod.name}</h3>
              <p className="text-[9px] text-[#002443]/50 leading-relaxed">{mod.desc}</p>
            </div>
          );
        })}
        {inactiveModules.map((mod) => {
          const Icon = mod.icon;
          return (
            <div key={mod.key} className="bg-[#f4f4f4]/50 border border-[#002443]/5 rounded-xl p-3 opacity-40">
              <Icon className="w-6 h-6 text-[#002443]/30 mb-2" />
              <h3 className="text-[11px] font-bold text-[#002443]/40 mb-1">{mod.name}</h3>
              <p className="text-[9px] text-[#002443]/30">Não contratado</p>
            </div>
          );
        })}
      </div>
    </SlideLayout>
  );
}