import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function ComplianceDisclaimer() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="bg-amber-50 border border-amber-200 rounded-2xl p-5"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-100 rounded-xl flex-shrink-0">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-900 mb-1">Importante — Sujeito à Aprovação</p>
          <p className="text-sm text-amber-800 leading-relaxed">
            As taxas são referenciais e estão sujeitas à aprovação de Compliance e validação do modelo de negócio pela Pin Bank.
          </p>
        </div>
      </div>
    </motion.div>
  );
}