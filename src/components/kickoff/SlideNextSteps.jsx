import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles } from 'lucide-react';

export default function SlideNextSteps({ clientName, responsavelNome, slideNumber, totalSlides }) {
  const steps = [
    'Assinatura digital do contrato',
    'Envio das credenciais de sandbox (API Gargântua)',
    'Agendamento do kick-off técnico de integração',
    'Preenchimento conjunto do Documento de Ramp-Up',
    'Definição do cronograma de testes',
    'Planejamento do Go Live',
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative w-full aspect-[16/9] bg-[#002443] rounded-3xl overflow-hidden shadow-[0_12px_60px_rgba(0,36,67,0.25)]"
      style={{ pageBreakAfter: 'always' }}
    >
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-[#2bc196] rounded-full blur-[160px] opacity-[0.06]" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] bg-[#5cf7cf] rounded-full blur-[140px] opacity-[0.04]" />
      </div>
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#2bc196] to-transparent" />

      <div className="relative h-full flex flex-col px-12 pt-8 pb-12">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">Próximos Passos</h2>
            <p className="text-[10px] text-white/30 mt-1">Ações imediatas para iniciarmos a implementação</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-full">
            <Sparkles className="w-3 h-3 text-[#2bc196]" />
            <span className="text-[9px] text-white/40 font-medium">Action items</span>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 gap-x-8 gap-y-3 content-start">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
              className="flex items-center gap-3 px-4 py-2.5 bg-white/[0.03] border border-white/[0.05] rounded-xl hover:bg-white/[0.05] transition-colors"
            >
              <div className="w-7 h-7 rounded-lg bg-[#2bc196]/10 border border-[#2bc196]/20 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-4 h-4 text-[#2bc196]" />
              </div>
              <span className="text-[11px] text-white/70 font-medium">{step}</span>
            </motion.div>
          ))}
        </div>

        <div className="mt-auto pt-5 border-t border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-extrabold text-[#2bc196] mb-1">Estamos prontos para começar!</p>
              <p className="text-[10px] text-white/25">
                {clientName ? `Apresentação preparada para ${clientName}` : 'Pagsmile — Seu parceiro de pagamentos'}
              </p>
            </div>
            <div className="text-right space-y-1">
              {responsavelNome && (
                <p className="text-[10px] text-white/40">Responsável: <strong className="text-white/60">{responsavelNome}</strong></p>
              )}
              <p className="text-[10px] text-white/25">comercial@pagsmile.com</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 h-8 flex items-center justify-between px-10 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-[#2bc196] to-[#002443] flex items-center justify-center">
              <span className="text-[6px] font-bold text-white">P</span>
            </div>
            <span className="text-[8px] text-white/15 font-semibold tracking-wider uppercase">Pagsmile</span>
          </div>
          <span className="text-[9px] text-white/20 font-mono">{String(slideNumber).padStart(2, '0')}</span>
        </div>
      </div>
    </motion.div>
  );
}