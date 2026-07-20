import React from 'react';
import { motion } from 'framer-motion';
import SlideLayout from './SlideLayout';
import { Link, Palette, Send, ShieldCheck, Users, ArrowRight, CheckCircle2 } from 'lucide-react';

const FLOW_STEPS = [
  { icon: Palette, title: 'Personalização do Link', desc: 'A Pin Bank gera um link de compliance exclusivo para seu negócio — com suas cores, logo e nome, ou com a identidade Pin Bank.', gradient: 'from-[#1356E2] to-emerald-600' },
  { icon: Send, title: 'Envio para Sellers', desc: 'Você envia o link para seus sellers/subsellers preencherem as informações de compliance, ou preenche em nome deles.', gradient: 'from-[#0A0A0A] to-blue-700' },
  { icon: Users, title: 'Preenchimento pelo Seller', desc: 'O seller preenche o questionário de KYC diretamente pelo link, com formulário guiado e upload de documentos.', gradient: 'from-purple-500 to-purple-700' },
  { icon: ShieldCheck, title: 'Aprovação Pin Bank', desc: 'Cada subseller é analisado e aprovado individualmente pela Pin Bank, garantindo conformidade regulatória total.', gradient: 'from-amber-500 to-orange-600' },
];

const FEATURES = [
  '🎨 White-label: seu logo, suas cores, sua marca',
  '🔗 Link único e rastreável por seller',
  '📋 Questionário KYC completo integrado',
  '✅ Aprovação individual por subseller',
  '📊 Painel de controle do status de cada seller',
  '🔒 Conformidade total com regulação BACEN',
];

export default function SlideSubsellerLinks({ slideNumber, totalSlides }) {
  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides} variant="dark">
      <h2 className="text-xl font-extrabold text-white mb-0.5">Gestão de Links de Sub-Contas</h2>
      <p className="text-[10px] text-white/35 mb-3">Onboarding personalizado para seus sellers com aprovação individual</p>

      <div className="flex-1 flex flex-col gap-3">
        {/* Flow */}
        <div className="flex items-stretch gap-2">
          {FLOW_STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <React.Fragment key={i}>
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.4 }}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-2xl px-3 py-3"
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${step.gradient} flex items-center justify-center mb-2 shadow-sm`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-[10px] font-bold text-white mb-1">{step.title}</p>
                  <p className="text-[8px] text-white/40 leading-tight">{step.desc}</p>
                </motion.div>
                {i < FLOW_STEPS.length - 1 && (
                  <div className="flex items-center">
                    <ArrowRight className="w-3.5 h-3.5 text-[#1356E2]/40" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4"
        >
          <h3 className="text-[10px] font-bold text-[#1356E2] uppercase tracking-wider mb-3">Recursos do Link de Sub-Contas</h3>
          <div className="grid grid-cols-3 gap-2">
            {FEATURES.map((feat, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white/[0.03] rounded-xl border border-white/[0.04]">
                <span className="text-[9px] text-white/60">{feat}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}