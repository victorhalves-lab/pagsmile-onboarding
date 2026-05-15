import React from 'react';
import DatasetSection from '../DatasetSection';

export default function BdcTabSocios({ result }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <DatasetSection title="Vínculos societários (relationships)" data={result?.Relationships} />
      <DatasetSection title="KYC dos sócios (owners_kyc)" data={result?.OwnersKyc} />
      <DatasetSection title="Processos dos sócios (owners_lawsuits)" data={result?.OwnersLawsuits} />
      <DatasetSection title="Influência política (owners_influence)" data={result?.OwnersInfluence} />
      <DatasetSection title="Qualidade empreendedora (entrepreneur_quality)" data={result?.EntrepreneurQuality} />
      <DatasetSection title="Doações eleitorais (owners_electoral_donors)" data={result?.OwnersElectoralDonors} />
    </div>
  );
}