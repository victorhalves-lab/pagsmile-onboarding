import React from 'react';
import SlideLayout from './SlideLayout';
import { Shield, CreditCard, Landmark, Zap, Globe, Lock } from 'lucide-react';

const CAPABILITIES = [
  { icon: Landmark, title: 'Instituição de Pagamento (IP)', desc: 'Licenciada pelo Banco Central do Brasil como Instituição de Pagamento' },
  { icon: Shield, title: 'Subadquirente Licenciada', desc: 'Credenciada Visa, Mastercard, Elo e Amex para processamento de cartões' },
  { icon: CreditCard, title: 'Gateway & Orquestrador', desc: 'Roteamento inteligente entre múltiplos adquirentes com otimização de aprovação' },
  { icon: Zap, title: 'PIX Instantâneo', desc: 'API PIX completa: QR Code estático/dinâmico, cobrança, transferência e conciliação' },
  { icon: Lock, title: 'Antifraude & 3DS 2.0', desc: 'Motor de risco com IA, regras customizáveis e autenticação 3D Secure integrada' },
  { icon: Globe, title: 'Pagamentos Internacionais', desc: 'Processamento cross-border para LATAM, Europa e Ásia com liquidação local' },
];

export default function SlideAbout({ slideNumber, totalSlides }) {
  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides}>
      <h2 className="text-xl font-bold text-[#002443] mb-1">Quem é a Pagsmile</h2>
      <p className="text-[10px] text-[#002443]/50 mb-4">Infraestrutura completa de pagamentos para o seu negócio</p>

      <div className="grid grid-cols-3 gap-3 flex-1">
        {CAPABILITIES.map((cap, i) => {
          const Icon = cap.icon;
          return (
            <div key={i} className="bg-[#f4f4f4] rounded-xl p-3 flex flex-col">
              <div className="w-8 h-8 rounded-lg bg-[#2bc196]/10 flex items-center justify-center mb-2">
                <Icon className="w-4 h-4 text-[#2bc196]" />
              </div>
              <h3 className="text-[11px] font-bold text-[#002443] mb-1">{cap.title}</h3>
              <p className="text-[9px] text-[#002443]/60 leading-relaxed">{cap.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-4 text-[9px] text-[#002443]/40">
        <span>✓ PCI-DSS Certificado</span>
        <span>✓ LGPD Compliant</span>
        <span>✓ +20 países atendidos</span>
        <span>✓ 99.5% Uptime SLA</span>
      </div>
    </SlideLayout>
  );
}