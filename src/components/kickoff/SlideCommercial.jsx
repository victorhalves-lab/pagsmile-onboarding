import React from 'react';
import { motion } from 'framer-motion';
import SlideLayout from './SlideLayout';
import { DollarSign, Clock, FileText, AlertTriangle } from 'lucide-react';

const fmtBRL = (v) => v != null ? `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '—';

export default function SlideCommercial({ contract = {}, rates = {}, slideNumber, totalSlides }) {
  const rav = rates.rav || {};

  const tpvItems = [
    { label: 'Mês 1', value: contract.projectedTpvMonth1, color: 'from-[#2bc196]/15 to-[#2bc196]/5', border: 'border-[#2bc196]/15' },
    { label: 'Mês 2', value: contract.projectedTpvMonth2, color: 'from-[#002443]/[0.06] to-[#002443]/[0.02]', border: 'border-[#002443]/[0.06]' },
    { label: 'Mês 3+', value: contract.projectedTpvMonth3, color: 'from-[#002443]/[0.06] to-[#002443]/[0.02]', border: 'border-[#002443]/[0.06]' },
  ];

  return (
    <SlideLayout slideNumber={slideNumber} totalSlides={totalSlides} variant="mid">
      <h2 className="text-xl font-extrabold text-white mb-0.5">Condições Comerciais</h2>
      <p className="text-[10px] text-white/35 mb-4">Termos principais da operação</p>

      <div className="flex-1 grid grid-cols-3 gap-3 content-start">
        {/* TPV Cards */}
        {tpvItems.map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1, duration: 0.4 }}
            className="bg-white/[0.05] border border-white/[0.08] rounded-2xl p-4 text-center"
          >
            <DollarSign className="w-5 h-5 text-[#2bc196] mx-auto mb-2" />
            <span className="text-[9px] text-white/40 block mb-1">TPV Mínimo — {item.label}</span>
            <span className="text-lg font-bold font-mono text-[#2bc196]">{fmtBRL(item.value)}</span>
          </motion.div>
        ))}

        {/* Terms */}
        {[
          { icon: DollarSign, label: 'Taxa de Setup', value: fmtBRL(contract.setupFee ?? 6000) },
          { icon: Clock, label: 'Prazo de Liquidação', value: rav.prazo || contract.paymentTerm || '—' },
          { icon: FileText, label: 'Duração do Contrato', value: contract.contractDurationMonths ? `${contract.contractDurationMonths} meses` : '—' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div key={i + 3} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 + i * 0.1, duration: 0.4 }}
              className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-[#2bc196]/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4.5 h-4.5 text-[#2bc196]" />
              </div>
              <div>
                <span className="text-[9px] text-white/35 block">{item.label}</span>
                <span className="text-sm font-bold text-white">{item.value}</span>
              </div>
            </motion.div>
          );
        })}

        {/* Chargeback + Rescisão */}
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.6, duration: 0.4 }}
          className="col-span-3 bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 grid grid-cols-3 gap-6"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <span className="text-[9px] text-white/35 block">Chargeback</span>
              <span className="text-sm font-bold text-white">R$ 65,00 / disputa</span>
            </div>
          </div>
          <div>
            <span className="text-[9px] text-white/35 block mb-0.5">Multa Contratante</span>
            <span className="text-xs font-bold text-white">
              {contract.earlyTerminationPenaltyPercentage ? `${contract.earlyTerminationPenaltyPercentage}%` : '—'}
              {contract.earlyTerminationPenaltyMaxAmount ? ` (máx ${fmtBRL(contract.earlyTerminationPenaltyMaxAmount)})` : ''}
            </span>
          </div>
          <div>
            <span className="text-[9px] text-white/35 block mb-0.5">Multa Pagsmile</span>
            <span className="text-xs font-bold text-white">
              {contract.pagsmileEarlyTerminationPenaltyPercentage ? `${contract.pagsmileEarlyTerminationPenaltyPercentage}%` : '—'}
              {contract.pagsmileEarlyTerminationPenaltyMaxAmount ? ` (máx ${fmtBRL(contract.pagsmileEarlyTerminationPenaltyMaxAmount)})` : ''}
            </span>
          </div>
        </motion.div>
      </div>
    </SlideLayout>
  );
}