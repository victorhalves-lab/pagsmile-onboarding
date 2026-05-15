import React from 'react';
import DatasetSection from '../DatasetSection';

export default function BdcTabReputacao({ result }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <DatasetSection title="Mídia e exposição (media_profile_and_exposure)" data={result?.MediaProfileAndExposure} />
      <DatasetSection title="Reclame Aqui & reviews (reputations_and_reviews)" data={result?.ReputationsAndReviews} />
      <DatasetSection title="Prêmios & certificações (awards_and_certifications)" data={result?.AwardsAndCertifications} />
    </div>
  );
}