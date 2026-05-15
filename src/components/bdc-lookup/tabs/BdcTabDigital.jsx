import React from 'react';
import DatasetSection from '../DatasetSection';

export default function BdcTabDigital({ result }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <DatasetSection title="Domínios (domains)" data={result?.Domains} />
      <DatasetSection title="Passagens web (passages)" data={result?.Passages} />
      <DatasetSection title="Anúncios online (online_ads)" data={result?.OnlineAds} />
      <DatasetSection title="Atributos digitais (digital_attributes)" data={result?.DigitalAttributes} />
      <DatasetSection title="Indicadores de atividade (activity_indicators)" data={result?.ActivityIndicators} />
      <DatasetSection title="Marketplaces (marketplace_data)" data={result?.MarketplaceData} />
    </div>
  );
}