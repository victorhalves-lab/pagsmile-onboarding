import React from 'react';
import DatasetSection from '../DatasetSection';

export default function BdcTabProcessos({ result }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <DatasetSection title="Processos da entidade (processes)" data={result?.Processes} />
      <DatasetSection title="Processos dos sócios (owners_lawsuits)" data={result?.OwnersLawsuits} />
      <DatasetSection title="Bens penhorados/judiciais (judicial_assets)" data={result?.JudicialAssets} />
    </div>
  );
}