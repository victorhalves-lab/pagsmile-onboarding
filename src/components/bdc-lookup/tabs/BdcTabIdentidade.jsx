import React from 'react';
import DatasetSection from '../DatasetSection';

export default function BdcTabIdentidade({ result }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <DatasetSection title="Dados básicos (basic_data)" data={result?.BasicData} />
      <DatasetSection title="Receita Federal (registration_data)" data={result?.RegistrationData} />
      <DatasetSection title="Histórico cadastral (history_basic_data)" data={result?.HistoryBasicData} />
      <DatasetSection title="Evolução (company_evolution)" data={result?.CompanyEvolution} />
    </div>
  );
}