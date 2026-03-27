import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function ComplianceDisclaimer() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-amber-50/80 backdrop-blur-sm border border-amber-200/60 rounded-2xl p-5 md:p-6"
    >
      <div className="flex items-start gap-4">
        <div className="p-2 bg-amber-100 rounded-xl flex-shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="text-sm md:text-base text-amber-900 font-bold mb-1">
            Importante — Sujeito à Aprovação
          </p>
          <p className="text-sm text-amber-800/70 leading-relaxed">
            As taxas apresentadas são referenciais para o segmento indicado e estão sujeitas à aprovação final
            de Compliance e validação do enquadramento do modelo de negócio do cliente pela Pagsmile.
          </p>
        </div>
      </div>
    </motion.div>
  );
}