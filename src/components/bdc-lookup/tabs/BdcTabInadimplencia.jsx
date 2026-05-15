import React from 'react';
import DatasetSection from '../DatasetSection';
import { TrendingDown } from 'lucide-react';

export default function BdcTabInadimplencia({ result }) {
  return (
    <div className="space-y-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3">
        <TrendingDown className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-red-900">
          <p className="font-semibold mb-1">Inadimplência ⭐</p>
          <p>Protestos, dívida ativa, restrições BACEN e devolução de cheques.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DatasetSection title="Inadimplência consolidada (default_business_data)" data={result?.DefaultBusinessData} />
        <DatasetSection title="Dívida ativa (government_debtors)" data={result?.GovernmentDebtors} />
        <DatasetSection title="Em cobrança (collections)" data={result?.Collections} />
      </div>
    </div>
  );
}