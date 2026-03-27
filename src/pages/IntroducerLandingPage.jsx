import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, ArrowRight, ExternalLink } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import LandingHeader from '@/components/landing/LandingHeader';
import ComplianceDisclaimer from '@/components/landing/ComplianceDisclaimer';
import SegmentRatesTable from '@/components/landing/SegmentRatesTable';
import RateCalculator from '@/components/landing/RateCalculator';

const PAGSMILE_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png";

export default function IntroducerLandingPage() {
  const { uniqueLandingPageSlug } = useParams();
  const [activeSegment, setActiveSegment] = useState('');

  const { data: introducer, isLoading, isError } = useQuery({
    queryKey: ['introducerLP', uniqueLandingPageSlug],
    queryFn: async () => {
      const results = await base44.entities.Introducer.filter({
        uniqueLandingPageSlug,
        status: 'active',
      });
      if (!results || results.length === 0) return null;
      return results[0];
    },
    enabled: !!uniqueLandingPageSlug,
  });

  // Set default active segment when data loads
  useEffect(() => {
    if (introducer?.standardRates?.length > 0 && !activeSegment) {
      setActiveSegment(introducer.standardRates[0].segmentName);
    }
  }, [introducer, activeSegment]);

  const activeRates = introducer?.standardRates?.find(s => s.segmentName === activeSegment);

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4f4f4] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[#2bc196] mx-auto mb-4" />
          <p className="text-[#002443]/50 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  // Not found
  if (!introducer || !introducer.landingPageActive) {
    return (
      <div className="min-h-screen bg-[#f4f4f4] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <img src={PAGSMILE_LOGO} alt="Pagsmile" className="h-8 mx-auto mb-6 invert" />
          <h2 className="text-xl font-bold text-[#002443] mb-2">Página não encontrada</h2>
          <p className="text-sm text-[#002443]/50">Esta página de parceiro não está disponível ou foi desativada.</p>
        </div>
      </div>
    );
  }

  const segments = introducer.standardRates || [];

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      {/* Top gradient bar */}
      <div className="fixed top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#002443] via-[#2bc196] to-[#5cf7cf] z-50" />

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 space-y-8">
        {/* Header */}
        <LandingHeader
          companyName={introducer.companyName}
          companyLogoUrl={introducer.companyLogoUrl}
        />

        {/* Compliance Disclaimer */}
        <ComplianceDisclaimer />

        {/* Segments with Tabs */}
        {segments.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm overflow-hidden">
            <Tabs value={activeSegment} onValueChange={setActiveSegment}>
              {/* Tab Navigation */}
              <div className="border-b border-[#002443]/5 px-4 pt-4">
                <TabsList className="bg-[#f4f4f4] p-1 h-auto flex-wrap gap-1">
                  {segments.map((seg) => (
                    <TabsTrigger
                      key={seg.segmentName}
                      value={seg.segmentName}
                      className="text-xs md:text-sm data-[state=active]:bg-[#2bc196] data-[state=active]:text-white data-[state=active]:shadow-md px-3 py-2 rounded-lg"
                    >
                      {seg.segmentName}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Tab Content */}
              {segments.map((seg) => (
                <TabsContent key={seg.segmentName} value={seg.segmentName} className="p-6 md:p-8">
                  <SegmentRatesTable segmentRates={seg} />
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}

        {/* Calculator */}
        {activeRates && (
          <RateCalculator segmentRates={activeRates} />
        )}

        {/* CTA */}
        <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-8 text-center">
          <h3 className="text-xl md:text-2xl font-bold text-[#002443] mb-2">
            Quer uma proposta <span className="text-[#2bc196]">customizada</span>?
          </h3>
          <p className="text-sm text-[#002443]/50 mb-6 max-w-md mx-auto">
            Preencha nosso questionário rápido e receba uma proposta personalizada para o seu modelo de negócio.
          </p>
          <Link to={`/LeadQuestionnaire?ref=${introducer.referralCode}`}>
            <Button
              size="lg"
              className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl text-base px-8 py-6 shadow-lg shadow-[#2bc196]/20"
            >
              Solicitar Proposta Customizada
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <footer className="text-center py-6">
          <img src={PAGSMILE_LOGO} alt="Pagsmile" className="h-5 mx-auto mb-3 invert opacity-30" />
          <p className="text-[10px] text-[#002443]/30">
            © {new Date().getFullYear()} Pagsmile. Todas as taxas sujeitas à aprovação de Compliance.
          </p>
        </footer>
      </div>
    </div>
  );
}