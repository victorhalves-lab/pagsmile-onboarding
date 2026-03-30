import React, { useState, useEffect, useCallback } from 'react';
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
import InternationalPaymentsBanner from '@/components/landing/InternationalPaymentsBanner';

const PAGSMILE_LOGO = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png";

// ── Inline analytics (avoids external hook that may break rules-of-hooks) ──
function getSessionId() {
  let id = sessionStorage.getItem('lp_session_id');
  if (!id) {
    id = `lps_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    sessionStorage.setItem('lp_session_id', id);
  }
  return id;
}

function getDeviceType() {
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function fireAnalytics(eventType, ctx, extra = {}) {
  base44.entities.LandingPageEvent.create({
    introducerId: ctx.introducerId,
    referralCode: ctx.referralCode,
    slug: ctx.slug,
    eventType,
    sessionId: ctx.sessionId,
    deviceType: getDeviceType(),
    referrer: document.referrer || '',
    userAgent: navigator.userAgent,
    ...extra,
  }).catch(() => {});
}

// ────────────────────────────────────────────

export default function IntroducerLandingPage() {
  const { uniqueLandingPageSlug } = useParams();
  const [activeSegment, setActiveSegment] = useState('');
  const [pageViewTracked, setPageViewTracked] = useState(false);

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

  // Set first segment as active once data loads
  useEffect(() => {
    if (introducer?.standardRates?.length > 0 && !activeSegment) {
      setActiveSegment(introducer.standardRates[0].segmentName);
    }
  }, [introducer, activeSegment]);

  // Analytics context — stable reference
  const analyticsCtx = {
    introducerId: introducer?.id || '',
    referralCode: introducer?.referralCode || '',
    slug: uniqueLandingPageSlug || '',
    sessionId: getSessionId(),
  };

  // Track page view once
  useEffect(() => {
    if (!pageViewTracked && uniqueLandingPageSlug && introducer) {
      setPageViewTracked(true);
      fireAnalytics('page_view', analyticsCtx);
    }
  }, [uniqueLandingPageSlug, introducer, pageViewTracked]);

  const handleSegmentSelect = useCallback((segName) => {
    setActiveSegment(segName);
    fireAnalytics('segment_view', analyticsCtx, { segmentName: segName });
  }, [analyticsCtx.introducerId]);

  const handleSegmentInfo = useCallback((segName) => {
    fireAnalytics('segment_info', analyticsCtx, { segmentName: segName });
  }, [analyticsCtx.introducerId]);

  const handleCtaContratar = useCallback((segName) => {
    fireAnalytics('cta_contratar', analyticsCtx, { segmentName: segName });
  }, [analyticsCtx.introducerId]);

  const handleCtaProposta = useCallback(() => {
    fireAnalytics('cta_proposta', analyticsCtx);
  }, [analyticsCtx.introducerId]);

  const handleCalculatorInteract = useCallback((segName) => {
    fireAnalytics('calculator_interact', analyticsCtx, { segmentName: segName });
  }, [analyticsCtx.introducerId]);

  // ── Derived values (safe — no hooks below) ──
  const activeRates = introducer?.standardRates?.find(s => s.segmentName === activeSegment);
  const segments = introducer?.standardRates || [];
  const isPagsmileOwn = introducer && !introducer.companyLogoUrl;

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4f4f4] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" />
      </div>
    );
  }

  // ── Not found state ──
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

  // ── Main render ──
  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-[#002443] via-[#2bc196] to-[#5cf7cf] z-50" />

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8">
        {/* Header */}
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
            <div className="sticky top-2 z-40 bg-white/95 backdrop-blur-md border border-[#002443]/[0.06] rounded-xl p-3 shadow-lg shadow-black/5">
              <SegmentSelector
                segments={segments}
                activeSegment={activeSegment}
                onSelect={handleSegmentSelect}
                onInfoClick={handleSegmentInfo}
              />
            </div>

            {activeRates && (
              <motion.div
                key={activeSegment}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <SegmentRatesTable segmentRates={activeRates} />

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mt-6"
                >
                  <Link
                    to={`/FechamentoLandingPage?ref=${introducer.referralCode}&segment=${encodeURIComponent(activeSegment)}&introducerId=${introducer.id}`}
                    onClick={() => handleCtaContratar(activeSegment)}
                  >
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

        {/* International Payments */}
        <InternationalPaymentsBanner />

        {/* Calculator */}
        {activeRates && (
          <div onMouseDown={() => handleCalculatorInteract(activeSegment)}>
            <RateCalculator segmentRates={activeRates} />
          </div>
        )}

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
            <Link to={`/LeadQuestionnaire?ref=${introducer.referralCode}&templateId=69c3b5af17040531b06c5c16`} onClick={handleCtaProposta}>
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