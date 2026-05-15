import React from 'react';
import DatasetSection from '../DatasetSection';
import { AlertOctagon } from 'lucide-react';

export default function BdcTabWatchlists({ result }) {
  return (
    <div className="space-y-4">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-3">
        <AlertOctagon className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-orange-900">
          <p className="font-semibold mb-1">Watchlists ⭐</p>
          <p>Listas nacionais (MTE Lista Suja, IBAMA, CEIS, CNEP) consolidadas no dataset ESG.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DatasetSection title="ESG & Compliance (esg_and_compliance)" data={result?.EsgAndCompliance} />
        <DatasetSection title="Dívida com governo (government_debtors)" data={result?.GovernmentDebtors} />
      </div>
    </div>
  );
}