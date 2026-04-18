import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CreditCard, Shield, Clock, Info, FileText, ExternalLink, Rocket, ArrowRight, TrendingUp } from 'lucide-react';
import { getMinRevenueLabel } from '@/lib/segmentConfig';
import moment from 'moment';
import TaxasPorBandeiraPublic from '@/components/proposals/TaxasPorBandeiraPublic';
import ParcelasTableDetalhada from '@/components/proposals/ParcelasTableDetalhada';
import ExportButtons from '@/components/proposals/ExportButtons';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import SEGMENT_TO_COMPLIANCE from '@/components/fechamento/segmentComplianceMap';
import InternationalPaymentsBanner from '@/components/landing/InternationalPaymentsBanner';
import { canonicalizeSlugUrl } from '@/lib/publicSlug';

const QUESTIONNAIRE_URL = 'https://pagsmilecompliance.base44.app/QuestionarioLeadsPagsmile';

export default function PropostaPadraoPublica() {
  const { t } = useTranslation();
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const propostaContentRef = useRef(null);



  const { data: proposta, isLoading } = useQuery({
    queryKey: ['std_proposta_publica', token],
    queryFn: async () => {
      if (!token) return null;
      const res = await base44.functions.invoke('publicReadContext', {
        kind: 'standard_proposal_by_token', token,
      });
      return res.data?.proposal || null;
    },
    enabled: !!token,
  });

  // Canonicalize URL to /pp/:slug when coming from legacy ?token= link
  React.useEffect(() => {
    if (proposta?.publicSlug) canonicalizeSlugUrl('standardProposal', proposta.publicSlug);
  }, [proposta?.publicSlug]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!proposta) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <AlertTriangle className="w-16 h-16 mx-auto text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold text-[#002443] mb-2">{t('spp.not_found')}</h1>
        <p className="text-[#002443]/60">{t('spp.not_found_desc')}</p>
      </div>
    );
  }

  if (proposta.status !== 'ativa') {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <Clock className="w-16 h-16 mx-auto text-slate-400 mb-4" />
        <h1 className="text-2xl font-bold text-[#002443] mb-2">{t('spp.unavailable')}</h1>
        <p className="text-[#002443]/60">{t('spp.unavailable_desc')}</p>
      </div>
    );
  }

  const rates = proposta.rates || {};
  const taxaRAV = parseFloat(rates.rav?.taxa) || 0;
  const prazo = rates.rav?.prazo || 'D+1';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4" ref={propostaContentRef}>
      {/* Premium Hero Header */}
      <div className="relative overflow-hidden bg-[#002443] rounded-3xl p-8 md:p-12 mb-8 text-center shadow-xl">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2bc196 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#2bc196] rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#5cf7cf] rounded-full blur-3xl opacity-10 pointer-events-none" />
        <div className="relative z-10">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/df6449845_Logo-modo-escuro.png" alt="Pagsmile" className="h-12 mx-auto mb-6" />
          <Badge className="bg-[#2bc196]/20 text-[#5cf7cf] hover:bg-[#2bc196]/30 border-none mb-4 px-4 py-1.5 text-sm">
            Proposta — {proposta.segment}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">{t('spp.commercial_conditions')}</h1>
          <p className="text-white/80 text-base md:text-lg max-w-lg mx-auto">
            {t('spp.standard_rates_for')} <span className="font-bold text-white">{proposta.segment}</span>
          </p>
          <div className="mt-6 inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/30 rounded-full px-5 py-2">
            <TrendingUp className="w-4 h-4 text-amber-300" />
            <p className="text-sm font-bold text-amber-200">{getMinRevenueLabel(proposta.segment)}</p>
          </div>
          <p className="text-white/40 text-xs mt-4">
            {proposta.templateName} — {proposta.codigo}
          </p>
        </div>
      </div>

      {/* Title + Export */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#002443]">{t('spp.commercial_proposal')}</h1>
          <p className="text-[#002443]/60 text-sm">{t('spp.online_rates')} — {proposta.segment}</p>
        </div>
        <ExportButtons contentRef={propostaContentRef} />
      </div>

      {/* Dados da Empresa */}
      {(proposta.clienteNome || proposta.clienteCnpj) && (
        <Card className="mb-6 border-[#2bc196]/20 bg-[#2bc196]/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-[#2bc196]" />
              <h3 className="font-bold text-sm text-[#002443]">{t('spp.company_data')}</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {proposta.clienteNome && (
                <div><p className="text-[#002443]/50 text-xs font-semibold">{t('spp.company')}</p><p className="font-bold text-[#002443]">{proposta.clienteNome}</p></div>
              )}
              {proposta.clienteCnpj && (
                <div><p className="text-[#002443]/50 text-xs font-semibold">CNPJ</p><p className="font-bold text-[#002443]">{proposta.clienteCnpj}</p></div>
              )}
              {proposta.clienteContato && (
                <div><p className="text-[#002443]/50 text-xs font-semibold">{t('spp.contact')}</p><p className="text-[#002443]">{proposta.clienteContato}</p></div>
              )}
              {proposta.clienteTelefone && (
                <div><p className="text-[#002443]/50 text-xs font-semibold">{t('spp.phone')}</p><p className="text-[#002443]">{proposta.clienteTelefone}</p></div>
              )}
              {proposta.clienteEmail && (
                <div><p className="text-[#002443]/50 text-xs font-semibold">E-mail</p><p className="text-[#002443]">{proposta.clienteEmail}</p></div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info do Segmento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="border-[#2bc196]/20 bg-[#2bc196]/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-[#2bc196]" />
              <h3 className="font-bold text-sm text-[#002443]">{t('spp.segment')}</h3>
            </div>
            <p className="font-bold text-lg text-[#002443]">{proposta.segment}</p>
            {proposta.description && <p className="text-sm text-[#002443]/60 mt-1">{proposta.description}</p>}
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-sm text-[#002443]">{t('spp.information')}</h3>
            </div>
            <p className="text-sm text-[#002443]/60 mt-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              {t('spp.standard_conditions')}
            </p>
            <p className="text-sm text-[#002443]/60 mt-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              {t('spp.rates_may_vary')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* TPV Mínimo Garantido em Cartão */}
      {rates.minimoGarantido && (parseFloat(rates.minimoGarantido.mes1) > 0 || parseFloat(rates.minimoGarantido.mes2) > 0 || parseFloat(rates.minimoGarantido.mes3) > 0) && (
        <Card className="mb-6 bg-slate-50 border-slate-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-5 h-5 text-[#002443]/60" />
              <h2 className="font-bold text-base text-[#002443]">{t('pp.min_tpv')}</h2>
            </div>
            <p className="text-[11px] text-[#002443]/40 mb-4 ml-7">Volume mínimo mensal em cartão de crédito/débito</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                <p className="text-xs text-[#002443]/50 uppercase font-semibold mb-1">{t('pp.month1')}</p>
                <p className="font-bold text-[#002443]">R$ {(parseFloat(rates.minimoGarantido.mes1) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                <p className="text-xs text-[#002443]/50 uppercase font-semibold mb-1">{t('pp.month2')}</p>
                <p className="font-bold text-[#002443]">R$ {(parseFloat(rates.minimoGarantido.mes2) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#2bc196]/40 text-center shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-[#2bc196]/5 pointer-events-none" />
                <p className="text-xs text-[#2bc196] uppercase font-semibold mb-1">{t('pp.month3_plus')}</p>
                <p className="font-bold text-[#2bc196]">R$ {(parseFloat(rates.minimoGarantido.mes3) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <p className="text-xs text-[#002443]/50 mt-3 text-center">
              {t('pp.min_tpv_note')}
            </p>
            <div className="mt-3 bg-[#2bc196]/5 border border-[#2bc196]/20 rounded-xl px-4 py-3">
              <p className="text-xs text-[#002443]/70 text-center leading-relaxed">
                {t('pp.min_tpv_pix_incentive')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Taxas por Bandeira */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <h2 className="font-bold text-base text-[#002443] mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#2bc196]" />
            {t('pp.credit_card_rates')}
          </h2>
          <TaxasPorBandeiraPublic taxas={rates} />
        </CardContent>
      </Card>

      {/* Outros Métodos */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="py-4 text-center flex flex-col justify-center h-full">
            <p className="text-xs text-[#002443]/50 mb-1 uppercase font-semibold">PIX</p>
            <p className="text-lg font-bold text-[#2bc196]">
              {rates.pix?.tipo === 'fixo'
                ? `R$ ${(parseFloat(rates.pix?.valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `${(parseFloat(rates.pix?.valor) || 0).toFixed(2).replace('.', ',')}%`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center flex flex-col justify-center h-full">
            <p className="text-xs text-[#002443]/50 mb-1 uppercase font-semibold">BOLETO</p>
            <p className="text-lg font-bold text-[#002443]">R$ {(parseFloat(rates.boleto) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center flex flex-col justify-center h-full">
            <p className="text-xs text-[#002443]/50 mb-1 uppercase font-semibold">{t('pp.transaction_fee')}</p>
            <p className="text-lg font-bold text-[#002443]">R$ {(parseFloat(rates.feeTransacao) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center flex flex-col justify-center h-full">
            <p className="text-xs text-[#002443]/50 mb-1 uppercase font-semibold">ANTIFRAUDE</p>
            <p className="text-lg font-bold text-[#002443]">R$ {(parseFloat(rates.antifraude) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center flex flex-col justify-center h-full">
            <p className="text-xs text-[#002443]/50 mb-1 uppercase font-semibold">3DS</p>
            <p className="text-lg font-bold text-[#002443]">R$ {(parseFloat(rates.taxa3ds) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center flex flex-col justify-center h-full">
            <p className="text-xs text-[#002443]/50 mb-1 uppercase font-semibold">{t('pp.pre_chargeback')}</p>
            <p className="text-lg font-bold text-[#002443]">R$ {(parseFloat(rates.alertaPreChargeback) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Setup Fee — Destaque */}
      <div className="mb-6 relative overflow-hidden bg-[#002443] rounded-2xl p-6 text-center shadow-lg">
        <div className="absolute -top-16 -right-16 w-40 h-40 bg-[#2bc196] rounded-full blur-3xl opacity-15 pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-40 h-40 bg-[#5cf7cf] rounded-full blur-3xl opacity-10 pointer-events-none" />
        <div className="relative z-10">
          <p className="text-xs text-white/50 mb-1 uppercase font-bold tracking-widest">Taxa de Setup</p>
          <p className="text-3xl font-extrabold text-[#2bc196]">R$ 6.000,00</p>
          <p className="text-xs text-white/40 mt-1">Pagamento único</p>
        </div>
      </div>

      {/* Prazo e Antecipação */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="py-4 text-center flex flex-col justify-center h-full">
            <p className="text-xs text-[#002443]/50 mb-1 uppercase font-semibold">{t('pp.receiving_term')}</p>
            <p className="text-lg font-bold text-[#002443]">{prazo}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center flex flex-col justify-center h-full">
            <p className="text-xs text-[#002443]/50 mb-1 uppercase font-semibold">{t('pp.anticipation_rate')}</p>
            <p className="text-lg font-bold text-amber-600">{taxaRAV}% a.m.</p>
            <p className="text-xs text-[#002443]/60 mt-1.5">
              Volume antecipável: <span className="font-bold text-[#002443]">até 80%</span>
            </p>
            <p className="text-[10px] text-amber-600/80 mt-1">* Percentual sujeito à aprovação de Compliance</p>
          </CardContent>
        </Card>
      </div>

      {/* CTA - Quero Contratar (fluxo fechamento → compliance) */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#2bc196] to-[#5cf7cf] rounded-3xl p-8 md:p-10 mb-8 text-center shadow-xl">
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-white rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div className="relative z-10">
          <Rocket className="w-12 h-12 mx-auto text-[#002443] mb-4" />
          <h2 className="text-2xl md:text-3xl font-extrabold text-[#002443] mb-3">
            Gostou dessas condições?
          </h2>
          <p className="text-[#002443]/70 text-base md:text-lg max-w-xl mx-auto mb-6">
            Preencha os dados da sua empresa e inicie o processo de contratação. É rápido e 100% digital.
          </p>
          <a href={`/FechamentoLandingPage?segmento=${encodeURIComponent(proposta.segment)}&fromStandardProposal=${token}`}>
            <Button className="bg-[#002443] hover:bg-[#002443]/90 text-white font-bold px-10 h-14 rounded-2xl text-lg shadow-lg shadow-[#002443]/20 transition-transform hover:scale-105">
              <Rocket className="w-5 h-5 mr-2" />
              Quero Contratar com essas Taxas
            </Button>
          </a>
          <p className="text-xs text-[#002443]/50 mt-3">Processo rápido e 100% digital — Sujeito à aprovação de Compliance</p>
        </div>
      </div>

      {/* Tabela de Parcelas */}
      <Card className="mb-8">
        <CardContent className="py-4">
          <h2 className="font-bold text-base text-[#002443] mb-4">{t('pp.installment_table')}</h2>
          <ParcelasTableDetalhada taxas={rates} taxaRAV={taxaRAV} prazo={prazo} showSimulator={true} />
        </CardContent>
      </Card>

      {/* International Payments */}
      <div className="mb-8">
        <InternationalPaymentsBanner />
      </div>



      {/* CTA - Proposta Personalizada */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#002443] to-[#36706c] rounded-3xl p-8 md:p-10 mb-8 text-center shadow-xl">
        <div className="absolute -top-20 -right-20 w-56 h-56 bg-[#2bc196] rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-[#5cf7cf] rounded-full blur-3xl opacity-10 pointer-events-none" />
        <div className="relative z-10">
          <FileText className="w-12 h-12 mx-auto text-[#2bc196] mb-4" />
          <h2 className="text-2xl md:text-3xl font-extrabold text-white mb-3">
            {t('spp.want_custom')}
          </h2>
          <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto mb-6">
            {t('spp.fill_questionnaire')}
          </p>
          <a href={QUESTIONNAIRE_URL} target="_blank" rel="noopener noreferrer">
            <Button className="bg-[#2bc196] hover:bg-[#5cf7cf] text-[#002443] font-bold px-10 h-14 rounded-2xl text-lg shadow-lg shadow-[#2bc196]/20 transition-transform hover:scale-105">
              <ExternalLink className="w-5 h-5 mr-2" />
              {t('spp.answer_questionnaire')}
            </Button>
          </a>
        </div>
      </div>

      {/* Footer — extra bottom padding for sticky bar */}
      <div className="text-center text-xs text-[#002443]/30 py-4 pb-28 border-t border-slate-200">
        <p>&copy; {new Date().getFullYear()} Pagsmile. {proposta.codigo}</p>
        <p>{t('spp.footer_note')}</p>
      </div>

      {/* Sticky Bottom Bar — Sempre fixo */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-[#002443] border-t border-[#2bc196]/30 shadow-[0_-4px_20px_rgba(0,36,67,0.3)]">
          <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
            <div className="hidden sm:block flex-1 min-w-0">
              <p className="text-white font-bold text-sm truncate">Quero essas taxas — {proposta.segment}</p>
              <p className="text-white/50 text-xs">Processo rápido e 100% digital</p>
            </div>
            <a href={`/FechamentoLandingPage?segmento=${encodeURIComponent(proposta.segment)}&fromStandardProposal=${token}`} className="flex-shrink-0">
              <Button className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white font-bold rounded-xl text-sm px-6 h-10 shadow-lg shadow-[#2bc196]/20 hover:scale-[1.02] transition-all gap-2">
                <Rocket className="w-4 h-4" />
                Contratar agora
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}