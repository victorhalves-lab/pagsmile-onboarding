import React from 'react';
import SlideCover from './SlideCover';
import SlideSummary from './SlideSummary';
import SlideAbout from './SlideAbout';
import SlideServices from './SlideServices';
import SlideRatesCard from './SlideRatesCard';
import SlideRatesOther from './SlideRatesOther';
import SlideCommercial from './SlideCommercial';
import SlideSLA from './SlideSLA';
import SlideRoadmap from './SlideRoadmap';
import SlideSupport from './SlideSupport';
import SlideFollowUp from './SlideFollowUp';
import SlideNextSteps from './SlideNextSteps';

const TOTAL_SLIDES = 12;

export default function KickOffPresentation({ proposal, contract }) {
  const rates = proposal?.rates || contract?.rates || {};
  const modules = contract?.modules || {};
  const clientName = proposal?.clienteNome || contract?.clientName || 'Cliente';
  const responsavelNome = proposal?.responsavelNome || contract?.responsavelNome || '';
  const setupFee = proposal?.rates?.setup ?? contract?.setupFee ?? 6000;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <SlideCover clientName={clientName} totalSlides={TOTAL_SLIDES} />
      <SlideSummary proposal={proposal || {}} contract={contract || {}} slideNumber={2} totalSlides={TOTAL_SLIDES} />
      <SlideAbout slideNumber={3} totalSlides={TOTAL_SLIDES} />
      <SlideServices modules={modules} slideNumber={4} totalSlides={TOTAL_SLIDES} />
      <SlideRatesCard rates={rates} slideNumber={5} totalSlides={TOTAL_SLIDES} />
      <SlideRatesOther rates={rates} setupFee={setupFee} slideNumber={6} totalSlides={TOTAL_SLIDES} />
      <SlideCommercial contract={contract || {}} rates={rates} slideNumber={7} totalSlides={TOTAL_SLIDES} />
      <SlideSLA contract={contract || {}} slideNumber={8} totalSlides={TOTAL_SLIDES} />
      <SlideRoadmap slideNumber={9} totalSlides={TOTAL_SLIDES} />
      <SlideSupport slideNumber={10} totalSlides={TOTAL_SLIDES} />
      <SlideFollowUp slideNumber={11} totalSlides={TOTAL_SLIDES} />
      <SlideNextSteps clientName={clientName} responsavelNome={responsavelNome} slideNumber={12} totalSlides={TOTAL_SLIDES} />
    </div>
  );
}