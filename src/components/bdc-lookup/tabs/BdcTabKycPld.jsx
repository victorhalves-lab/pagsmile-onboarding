import React from 'react';
import DatasetSection from '../DatasetSection';
import { Shield } from 'lucide-react';

export default function BdcTabKycPld({ result }) {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-3">
        <Shield className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-amber-900">
          <p className="font-semibold mb-1">Aba KYC/PLD ⭐</p>
          <p>Concentra todos os datasets regulatórios: sanções (OFAC, UN, EU), PEP, doações eleitorais, mídia adversa.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DatasetSection title="KYC consolidado (kyc)" data={result?.Kyc} />
        <DatasetSection title="KYC dos sócios (owners_kyc)" data={result?.OwnersKyc} />
        <DatasetSection title="KYC grupo econômico (economic_group_kyc)" data={result?.EconomicGroupKyc} />
        <DatasetSection title="PEP dedicado (pep)" data={result?.Pep || result?.PEP} />
        <DatasetSection title="Envolvimento político (political_involvement)" data={result?.PoliticalInvolvement} />
        <DatasetSection title="Mídia adversa (media_profile_and_exposure)" data={result?.MediaProfileAndExposure} />
        <DatasetSection title="ESG & Compliance (Lista Suja MTE / IBAMA)" data={result?.EsgAndCompliance} />
      </div>
    </div>
  );
}