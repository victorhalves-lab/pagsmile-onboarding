import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, Sparkles } from 'lucide-react';
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

  useEffect(() => {
    if (introducer?.standardRates?.length > 0 && !activeSegment) {
      setActiveSegment(introducer.standardRates[0].segmentName);
    }
  }, [introducer, activeSegment]);

  const activeRates = introducer?.standardRates?.find(s => s.segmentName === activeSegment);

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
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-[#002443] via-[#2bc196] to-[#5cf7cf] z-50" />

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-10">
        {/* Header */}
        <LandingHeader
          companyName={introducer.companyName}
          companyLogoUrl={introducer.companyLogoUrl}
        />

        {/* Compliance Disclaimer */}
        <ComplianceDisclaimer />

        {/* Segments with Tabs */}
        {segments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-3xl border border-[#002443]/[0.04] shadow-sm shadow-[#002443]/[0.03] overflow-hidden"
          >
            <Tabs value={activeSegment} onValueChange={setActiveSegment}>
              {/* Tab Navigation */}
              <div className="border-b border-[#002443]/[0.05] px-6 pt-6 pb-0">
                <div className="flex items-center gap-3 mb-5">
                  <Sparkles className="w-5 h-5 text-[#2bc196]" />
                  <h2 className="text-lg md:text-xl font-bold text-[#002443]">Taxas por Segmento</h2>
                </div>
                <TabsList className="bg-[#f4f4f4] p-1.5 h-auto flex-wrap gap-1.5 rounded-xl mb-[-1px]">
                  {segments.map((seg) => (
                    <TabsTrigger
                      key={seg.segmentName}
                      value={seg.segmentName}
                      className="text-sm font-semibold data-[state=active]:bg-[#2bc196] data-[state=active]:text-white data-[state=active]:shadow-md px-5 py-2.5 rounded-xl transition-all duration-200"
                    >
                      {seg.segmentName}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {/* Tab Content */}
              {segments.map((seg) => (
                <TabsContent key={seg.segmentName} value={seg.segmentName} className="p-6 md:p-10">
                  <SegmentRatesTable segmentRates={seg} />
                </TabsContent>
              ))}
            </Tabs>
          </motion.div>
        )}

        {/* Calculator */}
        {activeRates && (
          <RateCalculator segmentRates={activeRates} />
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="relative bg-gradient-to-br from-[#002443] to-[#003a5c] rounded-3xl p-10 md:p-14 text-center overflow-hidden"
        >
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#2bc196]/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#5cf7cf]/5 rounded-full blur-[60px]" />
          
          <div className="relative z-10">
            <h3 className="text-2xl md:text-3xl font-extrabold mb-3" style={{ color: '#ffffff' }}>
              Quer uma proposta{' '}
              <span className="bg-gradient-to-r from-[#2bc196] to-[#5cf7cf] bg-clip-text" style={{ WebkitTextFillColor: 'transparent', color: 'transparent' }}>
                customizada
              </span>
              ?
            </h3>
            <p className="text-base md:text-lg max-w-lg mx-auto mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Preencha nosso questionário rápido e receba uma proposta personalizada para o seu modelo de negócio.
            </p>
            <Link to={`/LeadQuestionnaire?ref=${introducer.referralCode}`}>
              <Button
                size="lg"
                className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-2xl text-lg px-10 py-7 shadow-xl shadow-[#2bc196]/25 hover:shadow-2xl hover:shadow-[#2bc196]/30 hover:scale-[1.02] transition-all duration-300"
              >
                Solicitar Proposta Customizada
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="text-center py-8">
          <img src={PAGSMILE_LOGO} alt="Pagsmile" className="h-5 mx-auto mb-3 invert opacity-25" />
          <p className="text-xs text-[#002443]/25">
            © {new Date().getFullYear()} Pagsmile. Todas as taxas sujeitas à aprovação de Compliance.
          </p>
        </footer>
      </div>
    </div>
  );
}