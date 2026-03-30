import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';

import LandingHeader from '@/components/landing/LandingHeader';
import PagsmileHeader from '@/components/landing/PagsmileHeader';
import ComplianceDisclaimer from '@/components/landing/ComplianceDisclaimer';
import SegmentRatesTable from '@/components/landing/SegmentRatesTable';
import SegmentSelector from '@/components/landing/SegmentSelector';
import RateCalculator from '@/components/landing/RateCalculator';

const PAGSMILE_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png";

export default function IntroducerLandingPage() {
  const { uniqueLandingPageSlug } = useParams();
  const [activeSegment, setActiveSegment] = useState('');

  const { data: introducer, isLoading } = useQuery({
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
        <Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" />
      </div>
    );
  }

  if (!introducer || !introducer.landingPageActive) {
    return (
      <div className="min-h-screen bg-[#f4f4f4] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <img src={PAGSMILE_LOGO} alt="Pagsmile" className="h-8 mx-auto mb-6 invert" />
          <h2 className="text-xl font-bold text-[#002443] mb-2">Página não encontrada</h2>
          <p className="text-sm text-[#002443]/60">Esta página de parceiro não está disponível.</p>
        </div>
      </div>
    );
  }

  const segments = introducer.standardRates || [];

  // Detecta se é a landing page exclusiva da Pagsmile (sem logo de parceiro)
  const isPagsmileOwn = !introducer.companyLogoUrl;

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-[#002443] via-[#2bc196] to-[#5cf7cf] z-50" />

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8">
        {/* Header: exclusivo Pagsmile ou parceiro */}
        {isPagsmileOwn ? (
          <PagsmileHeader />
        ) : (
          <LandingHeader companyName={introducer.companyName} companyLogoUrl={introducer.companyLogoUrl} />
        )}

        <ComplianceDisclaimer />

        {/* Segment selector + rates */}
        {segments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="space-y-6"
          >
            {/* Segment pills */}
            <div className="sticky top-2 z-40 bg-white/95 backdrop-blur-md border border-[#002443]/[0.06] rounded-xl p-3 shadow-lg shadow-black/5">
              <SegmentSelector
                segments={segments}
                activeSegment={activeSegment}
                onSelect={setActiveSegment}
              />
            </div>

            {/* Rates for selected segment */}
            {activeRates && (
              <motion.div
                key={activeSegment}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <SegmentRatesTable segmentRates={activeRates} />

                {/* CTA: Quero contratar com essas taxas */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mt-6"
                >
                  <Link to={`/FechamentoLandingPage?ref=${introducer.referralCode}&segment=${encodeURIComponent(activeSegment)}&introducerId=${introducer.id}`}>
                    <Button
                      size="lg"
                      className="w-full bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl text-base py-6 shadow-lg shadow-[#2bc196]/20 hover:scale-[1.01] transition-all gap-2 font-bold"
                    >
                      <Rocket className="w-5 h-5" />
                      Quero essas taxas — Contratar agora
                    </Button>
                  </Link>
                  <p className="text-center text-xs text-[#002443]/40 mt-2">Processo rápido e 100% digital</p>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Calculator */}
        {activeRates && <RateCalculator segmentRates={activeRates} />}

        {/* CTA proposta customizada */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-[#002443] rounded-2xl p-10 md:p-14 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#2bc196]/10 rounded-full blur-[80px]" />
          <div className="relative z-10">
            <h3 className="text-2xl md:text-3xl font-extrabold mb-3" style={{ color: '#ffffff' }}>
              Quer uma proposta <span style={{ color: '#2bc196' }}>customizada</span>?
            </h3>
            <p className="text-base max-w-md mx-auto mb-8" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Preencha nosso questionário rápido e receba taxas personalizadas para o seu negócio.
            </p>
            <Link to={`/LeadQuestionnaire?ref=${introducer.referralCode}&templateId=69c3b5af17040531b06c5c16`}>
              <Button
                size="lg"
                className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl text-base px-10 py-6 shadow-lg shadow-[#2bc196]/20 hover:scale-[1.02] transition-all"
              >
                Solicitar Proposta
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Footer */}
        <footer className="text-center py-6">
          <img src="https://media.base44.com/images/public/6983b65f017b96d5f695f9bb/85ecf04f8_Logo-modo-claro.png" alt="Pagsmile" className="h-6 mx-auto mb-3 opacity-30" />
          <p className="text-xs text-[#002443]/30">© {new Date().getFullYear()} Pagsmile. Taxas sujeitas à aprovação de Compliance.</p>
        </footer>
      </div>
    </div>
  );
}