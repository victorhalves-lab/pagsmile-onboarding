import React from 'react';
import DatasetSection from '../DatasetSection';

export default function BdcTabRelacionamentos({ result }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <DatasetSection title="Relações da entidade (relationships)" data={result?.Relationships} />
      <DatasetSection title="KYC familiar 1º grau (first_level_family_kyc)" data={result?.FirstLevelFamilyKyc} />
      <DatasetSection title="Relacionamentos pessoais (personal_relationships)" data={result?.PersonalRelationships} />
      <DatasetSection title="Telefones de relacionados (related_people_phones)" data={result?.RelatedPeoplePhones} />
      <DatasetSection title="E-mails de relacionados (related_people_emails)" data={result?.RelatedPeopleEmails} />
      <DatasetSection title="Endereços de relacionados (related_people_addresses)" data={result?.RelatedPeopleAddresses} />
    </div>
  );
}