import React from 'react';
import DatasetSection from '../DatasetSection';
import { GitBranch } from 'lucide-react';

export default function BdcTabCadeia({ result }) {
  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-start gap-3">
        <GitBranch className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-indigo-900">
          <p className="font-semibold mb-1">Cadeia Societária ⭐</p>
          <p>Identifica o beneficiário final (UBO) atravessando holdings, offshore e participações cruzadas.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DatasetSection title="Cadeia societária até UBO (corporate_chain)" data={result?.CorporateChain} />
        <DatasetSection title="Grupo econômico (economic_group)" data={result?.EconomicGroup} />
        <DatasetSection title="Relações do grupo (economic_group_relationships)" data={result?.EconomicGroupRelationships} />
      </div>
    </div>
  );
}