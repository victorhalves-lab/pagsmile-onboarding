import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Loader2, ArrowRight, Info } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

const SEGMENT_DESCRIPTIONS = {
  'Educação': 'Instituições de ensino, cursos online, plataformas EAD e edtechs.',
  'SaaS': 'Empresas de software como serviço com cobrança recorrente (assinaturas).',
  'Plataformas Verticais': 'Plataformas especializadas em um nicho específico, como saúde, imobiliário, jurídico, agro, fitness, etc. Atendem um setor vertical com soluções completas.',
  'E-commerce': 'Lojas virtuais que vendem produtos físicos ou digitais diretamente ao consumidor.',
  'Marketplace': 'Plataformas que conectam vendedores e compradores, intermediando transações entre múltiplos sellers.',
  'MPE': 'Micro e Pequenas Empresas — negócios locais como lojas, salões, oficinas e prestadores de serviço.',
  'Link de Pagamento': 'Empresas que vendem via links enviados por WhatsApp, e-mail ou redes sociais, sem checkout próprio.',
  'Infoprodutos': 'Produtores e afiliados de cursos, mentorias, e-books e conteúdo digital.',
  'Dropshipping': 'Lojas que vendem sem estoque próprio, com entrega feita diretamente pelo fornecedor.',
  'Gateway': 'Empresas que processam pagamentos para outros merchants (sub-adquirência ou facilitação).',
};
import LandingHeader from '@/components/landing/LandingHeader';
import ComplianceDisclaimer from '@/components/landing/ComplianceDisclaimer';
import SegmentRatesTable from '@/components/landing/SegmentRatesTable';
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

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-[#002443] via-[#2bc196] to-[#5cf7cf] z-50" />

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-8">
        <LandingHeader companyName={introducer.companyName} companyLogoUrl={introducer.companyLogoUrl} />

        <ComplianceDisclaimer />

        {/* Segment tabs + rates */}
        {segments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            <Tabs value={activeSegment} onValueChange={setActiveSegment}>
              <div className="sticky top-2 z-40 mb-4">
                <TooltipProvider delayDuration={200}>
                  <TabsList className="bg-white/95 backdrop-blur-md border border-[#002443]/[0.06] p-1.5 h-auto flex-wrap gap-1 rounded-xl shadow-lg shadow-black/5">
                    {segments.map((seg) => {
                      const desc = SEGMENT_DESCRIPTIONS[seg.segmentName];
                      return (
                        <Tooltip key={seg.segmentName}>
                          <TooltipTrigger asChild>
                            <TabsTrigger
                              value={seg.segmentName}
                              className="text-sm font-bold data-[state=active]:bg-[#2bc196] data-[state=active]:text-white px-5 py-2.5 rounded-lg gap-1.5"
                            >
                              {seg.segmentName}
                              {desc && <Info className="w-3 h-3 opacity-40" />}
                            </TabsTrigger>
                          </TooltipTrigger>
                          {desc && (
                            <TooltipContent side="bottom" className="max-w-[280px] text-xs leading-relaxed bg-[#002443] text-white border-[#002443] shadow-xl">
                              <p>{desc}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      );
                    })}
                  </TabsList>
                </TooltipProvider>
              </div>

              {segments.map((seg) => (
                <TabsContent key={seg.segmentName} value={seg.segmentName}>
                  {SEGMENT_DESCRIPTIONS[seg.segmentName] && (
                    <div className="bg-[#002443]/[0.04] border border-[#002443]/[0.06] rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-[#2bc196] mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-[#002443]/70">{SEGMENT_DESCRIPTIONS[seg.segmentName]}</p>
                    </div>
                  )}
                  <SegmentRatesTable segmentRates={seg} />
                </TabsContent>
              ))}
            </Tabs>
          </motion.div>
        )}

        {/* Calculator */}
        {activeRates && <RateCalculator segmentRates={activeRates} />}

        {/* CTA */}
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