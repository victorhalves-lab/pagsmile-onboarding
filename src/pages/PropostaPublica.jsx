import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
// SDK-FREE: this page is PUBLIC. The @base44/sdk fails with 401 for anonymous
// visitors on a private app. callPublicFunction uses raw fetch with credentials:'omit'.
import { callPublicFunction } from '@/lib/publicApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2, XCircle, MessageSquare, Clock, Info,
  CreditCard, Loader2, AlertTriangle, Shield
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import { formatCNPJ } from '@/components/proposals/CnpjInput';
import TaxasPorBandeiraPublic from '@/components/proposals/TaxasPorBandeiraPublic';
import ParcelasTableDetalhada from '@/components/proposals/ParcelasTableDetalhada';
import ExportButtons from '@/components/proposals/ExportButtons';
import AceiteModal from '@/components/proposals/AceiteModal';
import ContrapropostaModal from '@/components/proposals/ContrapropostaModal';
import RecusaModal from '@/components/proposals/RecusaModal';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import InternationalPaymentsBanner from '@/components/landing/InternationalPaymentsBanner';
import { resolveComplianceModel } from '@/components/compliance/segmentToComplianceV4Map';
import { getOverridesForPrazo } from '@/lib/overridesUtils';
import { canonicalizeSlugUrl } from '@/lib/publicSlug';
import { usePublicProposalQuery } from '@/hooks/usePublicProposalQuery';
import PublicProposalErrorState from '@/components/proposals/PublicProposalErrorState';
import { enqueueAccept, startAcceptWorker, isAcceptPending } from '@/lib/acceptQueue';

export default function PropostaPublica() {
  const { t } = useTranslation();
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const queryClient = useQueryClient();
  const propostaContentRef = useRef(null);

  const [showAceiteModal, setShowAceiteModal] = useState(false);
  const [showContrapropostaModal, setShowContrapropostaModal] = useState(false);
  const [showRecusaModal, setShowRecusaModal] = useState(false);

  // ROBUSTO: hook com 5 tentativas, fallback por slug, e distinção clara entre
  // "erro de rede" e "não encontrada". Resolve o bug onde clientes viam
  // "proposta não encontrada" apenas por instabilidade transitória de rede.
  const { status: loadStatus, proposal: proposta, refetch, error } = usePublicProposalQuery('proposal', token);
  const isLoading = loadStatus === 'loading';
  // Token efetivo: se o hook resolveu por slug, usa o token da proposta resolvida
  const effectiveToken = proposta?.tokenPublico || token;

  // Canonicalize URL to /p/:slug when coming from legacy ?token= link
  useEffect(() => {
    if (proposta?.publicSlug) canonicalizeSlugUrl('proposal', proposta.publicSlug);
  }, [proposta?.publicSlug]);

  // Inicia o worker da fila de aceite persistente — sincroniza aceites pendentes
  // mesmo se o cliente voltar dias depois.
  useEffect(() => { startAcceptWorker(); }, []);

  // Register view via public backend function (idempotent on server side)
  useEffect(() => {
    if (proposta && proposta.status === 'enviada') {
      const viewKey = `proposta_viewed_${proposta.id}`;
      if (sessionStorage.getItem(viewKey)) return;
      sessionStorage.setItem(viewKey, '1');

      callPublicFunction('publicProposalAction', {
        token: effectiveToken,
        slug: proposta?.publicSlug || null,
        type: 'proposal',
        action: 'view',
      }).catch(() => {}); // non-blocking
    }
  }, [proposta?.id]);

  // Helper: fetch lead (via public function) to resolve compliance model.
  // SECURITY: proposalToken acts as proof-of-possession so the backend can safely
  // return lead data without exposing it to random enumeration attacks.
  const fetchLeadForCompliance = async (leadId) => {
    if (!leadId) return null;
    try {
      const res = await callPublicFunction('publicReadData', {
        kind: 'lead_by_id',
        leadId,
        proposalToken: effectiveToken,
      });
      return res?.lead || null;
    } catch {
      return null;
    }
  };

  // Mutations — all go through publicProposalAction (server-side service role)
  //
  // ROBUSTNESS NOTES (fix for "página não encontrada" bug — case: ScaleFi 2026-04-18):
  // 1. Accept is idempotent on the server (status transitions only) — we retry once on network failure.
  // 2. Steps after accept (lead fetch, URL build) NEVER throw — they use safe fallbacks.
  //    If accept succeeds on the backend but a side-effect fails, the user is still redirected.
  // 3. No setTimeout delay before redirect — if the user closes the tab, they should still be redirected.
  // ACEITE OTIMISTA + FILA PERSISTENTE
  // O aceite NÃO pode falhar do ponto de vista do cliente. Estratégia:
  //  1. Enfileira o aceite em localStorage (worker tenta sync até conseguir, para sempre)
  //  2. Constrói a URL de compliance localmente (não depende do servidor)
  //  3. Redireciona IMEDIATAMENTE para o compliance — cliente nunca vê erro
  //  4. Se o servidor estiver fora, o worker sincroniza quando voltar (ou na próxima vez que abrir)
  const aceitarMutation = useMutation({
    mutationFn: async () => {
      // Validação mínima: garantir que temos o essencial para reenviar depois
      if (!proposta?.id || !effectiveToken) {
        throw new Error('Proposta não carregada completamente. Atualize a página e tente novamente.');
      }

      // Step 1 — Enfileira o aceite (garante que nunca se perde)
      enqueueAccept({
        proposalId: proposta.id,
        token: effectiveToken,
        slug: proposta.publicSlug || null,
        type: 'proposal',
        action: 'accept',
      });

      // Step 2 — Build compliance URL localmente (não depende do servidor)
      const model = proposta.businessSubCategory
        ? resolveComplianceModel({ businessSubCategory: proposta.businessSubCategory })
        : resolveComplianceModel({});

      const keysToClean = [
        'compliance_session_token',
        'compliance_data_merchant', 'compliance_data_gateway', 'compliance_data_marketplace',
        'compliance_data_merchant_v2', 'compliance_data_gateway_v2', 'compliance_data_marketplace_v2',
        'compliance_data_pix',
      ];
      keysToClean.forEach(key => { try { localStorage.removeItem(key); } catch {} });
      if (proposta.leadId) {
        try { localStorage.setItem('lead_id_for_compliance', proposta.leadId); } catch {}
      }
      // Save the proposal token so useLeadPrefill can prove possession of the lead
      // (BUG-007 LGPD fix — lead reads now require proof-of-possession).
      if (effectiveToken) {
        try { localStorage.setItem('proposal_token_for_compliance', effectiveToken); } catch {}
      }
      const complianceUrl = `${window.location.origin}/ComplianceDinamico?model=${model}${proposta.leadId ? `&leadId=${proposta.leadId}` : ''}`;

      // Analytics removido daqui: base44.analytics também depende do SDK autenticado.
      // A ação de aceite já está rastreada server-side via publicProposalAction.

      return complianceUrl;
    },
    onSuccess: (complianceUrl) => {
      toast.success(t('pp.proposal_accepted_success'));
      setShowAceiteModal(false);
      if (complianceUrl) window.location.href = complianceUrl;
    },
    onError: (err) => {
      toast.error(err?.message || 'Erro ao registrar o aceite. Tente novamente.');
    }
  });

  const contrapropostaMutation = useMutation({
    mutationFn: async (data) => {
      const res = await callPublicFunction('publicProposalAction', {
        token: effectiveToken,
        slug: proposta?.publicSlug || null,
        type: 'proposal',
        action: 'counter',
        payload: { details: data },
      });
      if (res?.error) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success(t('pp.counter_sent_success'));
      queryClient.invalidateQueries({ queryKey: ['public_proposal', 'proposal'] });
      setShowContrapropostaModal(false);
    }
  });

  const recusarMutation = useMutation({
    mutationFn: async (data) => {
      const res = await callPublicFunction('publicProposalAction', {
        token: effectiveToken,
        slug: proposta?.publicSlug || null,
        type: 'proposal',
        action: 'reject',
        payload: { motivo: data.motivo, detalhe: data.detalhe },
      });
      if (res?.error) throw new Error(res.error);
    },
    onSuccess: () => {
      toast.success(t('pp.proposal_rejected'));
      queryClient.invalidateQueries({ queryKey: ['public_proposal', 'proposal'] });
      setShowRecusaModal(false);
    }
  });

  // Loading
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 space-y-6">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  // Erro de rede (após 5 retries) — NÃO fala "não encontrada", oferece retry
  if (loadStatus === 'error') {
    return <PublicProposalErrorState status="error" onRetry={refetch} />;
  }

  // Realmente não existe
  if (loadStatus === 'notfound' || !proposta) {
    return <PublicProposalErrorState status="notfound" />;
  }

  // Expired check
  const isExpired = proposta.status === 'expirada' || (proposta.validUntil && new Date(proposta.validUntil) < new Date() && !['aceita', 'recusada', 'contraproposta'].includes(proposta.status));

  const isAlreadyResponded = ['aceita', 'recusada'].includes(proposta.status);
  const getComplianceUrl = () => {
    if (proposta.status !== 'aceita') return null;
    const model = proposta.businessSubCategory
      ? resolveComplianceModel({ businessSubCategory: proposta.businessSubCategory })
      : resolveComplianceModel({});
    return `${window.location.origin}/ComplianceDinamico?model=${model}&leadId=${proposta.leadId || ''}`;
  };
  
  const complianceUrl = getComplianceUrl();

  const handleGoToCompliance = () => {
    if (!complianceUrl) return;
    const keysToClean = [
      'compliance_session_token',
      'compliance_data_merchant', 'compliance_data_gateway', 'compliance_data_marketplace',
      'compliance_data_merchant_v2', 'compliance_data_gateway_v2', 'compliance_data_marketplace_v2',
      'compliance_data_pix',
    ];
    keysToClean.forEach(key => localStorage.removeItem(key));
    if (proposta.leadId) {
      localStorage.setItem('lead_id_for_compliance', proposta.leadId);
    }
    // Save the proposal token so useLeadPrefill can prove possession (BUG-007).
    if (effectiveToken) {
      try { localStorage.setItem('proposal_token_for_compliance', effectiveToken); } catch {}
    }
    window.location.href = complianceUrl;
  };

  const rates = proposta.rates || {};
  const taxaRAV = parseFloat(rates.rav?.taxa) || 0;
  const prazo = rates.rav?.prazo || 'D+1';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4" ref={propostaContentRef}>
      {/* Expired Banner — aviso amigável, mas cliente AINDA pode aceitar.
          O aceite fora do prazo é registrado no histórico (veja publicProposalAction). */}
      {isExpired && !isAlreadyResponded && (
        <div className="rounded-2xl p-5 mb-6 bg-amber-50 border border-amber-200">
          <div className="flex items-start gap-3">
            <Clock className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-base font-bold text-amber-900 mb-1">
                Prazo de validade original vencido
              </h2>
              <p className="text-sm text-amber-800/90 leading-relaxed">
                Esta proposta tinha validade até {moment(proposta.validUntil).format('DD/MM/YYYY')},
                mas você ainda pode aceitá-la normalmente. As condições comerciais permanecem as mesmas.
              </p>
              <p className="text-xs text-amber-700 mt-2">
                Se tiver qualquer dúvida antes de aceitar, fale com seu consultor.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status Banner */}
      {isAlreadyResponded && (
        <div className={`rounded-2xl p-6 mb-6 text-center ${proposta.status === 'aceita' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center justify-center gap-3 mb-2">
            {proposta.status === 'aceita' ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : <XCircle className="w-8 h-8 text-red-500" />}
            <h2 className={`text-xl font-bold ${proposta.status === 'aceita' ? 'text-green-800' : 'text-red-800'}`}>
              {proposta.status === 'aceita' ? t('pp.accepted_title') : t('pp.rejected_title')}
            </h2>
          </div>
          <p className={`text-sm ${proposta.status === 'aceita' ? 'text-green-600' : 'text-red-600'}`}>
            {proposta.status === 'aceita' ? t('pp.accepted_msg') : t('pp.rejected_msg')}
          </p>
          {proposta.status === 'aceita' && complianceUrl && (
            <Button
              onClick={handleGoToCompliance}
              className="mt-4 bg-[#2bc196] hover:bg-[#2bc196]/90 text-white px-8 h-12 rounded-2xl font-bold"
            >
              <Shield className="w-4 h-4 mr-2" />
              {t('pp.start_compliance')}
            </Button>
          )}
        </div>
      )}

      {/* Premium Hero Header */}
      <div className="relative overflow-hidden bg-[#002443] rounded-3xl p-8 md:p-12 mb-8 text-center shadow-xl">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2bc196 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#2bc196] rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#5cf7cf] rounded-full blur-3xl opacity-10 pointer-events-none"></div>
        
        <div className="relative z-10">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/df6449845_Logo-modo-escuro.png"
            alt="Pagsmile"
            className="h-12 mx-auto mb-6"
          />
          <Badge className="bg-[#2bc196]/20 text-[#5cf7cf] hover:bg-[#2bc196]/30 border-none mb-4 px-4 py-1.5 text-sm">
            {t('pp.exclusive_proposal')}
          </Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            {t('pp.commercial_conditions')}
          </h1>
          <p className="text-white/80 text-base md:text-lg max-w-lg mx-auto">
            {t('pp.prepared_for')} <span className="font-bold text-white">{proposta.clienteNome}</span>
          </p>
        </div>
      </div>

      {/* Title + Export */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#002443]">{t('pp.commercial_proposal')}</h1>
          <p className="text-[#002443]/60 text-sm">{t('pp.online_payment_rates')}</p>
        </div>
        <ExportButtons contentRef={propostaContentRef} />
      </div>

      {/* Detalhes do Cliente e Proposta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="border-[#2bc196]/20 bg-[#2bc196]/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-[#2bc196]" />
              <h3 className="font-bold text-sm text-[#002443]">{t('pp.client_data')}</h3>
            </div>
            <p className="font-bold text-lg text-[#002443]">{proposta.clienteNome}</p>
            <p className="text-sm text-[#002443]/60">CNPJ: {formatCNPJ(proposta.clienteCnpj)}</p>
            {proposta.clienteContato && (
              <p className="text-sm text-[#002443]/60 mt-1">Contato: {proposta.clienteContato}</p>
            )}
            {proposta.clienteMcc && (
              <div className="mt-3 inline-flex items-center gap-1 bg-white/60 px-2 py-1 rounded text-xs text-[#002443]/80 border border-[#002443]/10">
                <span className="font-semibold text-[#002443]">MCC:</span> {proposta.clienteMcc}
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="border-slate-200">
          <CardContent className="py-4">
             <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <h3 className="font-bold text-sm text-[#002443]">{t('pp.proposal_validity')}</h3>
            </div>
            <p className="font-bold text-lg text-[#002443]">
              {proposta.validUntil ? moment(proposta.validUntil).format('DD/MM/YYYY') : '-'}
            </p>
            <p className="text-sm text-[#002443]/60 mt-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              {t('pp.compliance_subject')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* TPV Mínimo Garantido */}
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
                <p className="font-bold text-[#002443]">
                  R$ {(parseFloat(rates.minimoGarantido.mes1) || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                <p className="text-xs text-[#002443]/50 uppercase font-semibold mb-1">{t('pp.month2')}</p>
                <p className="font-bold text-[#002443]">
                  R$ {(parseFloat(rates.minimoGarantido.mes2) || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#2bc196]/40 text-center shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-[#2bc196]/5 pointer-events-none" />
                <p className="text-xs text-[#2bc196] uppercase font-semibold mb-1">{t('pp.month3_plus')}</p>
                <p className="font-bold text-[#2bc196]">
                  R$ {(parseFloat(rates.minimoGarantido.mes3) || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </p>
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
          <TaxasPorBandeiraPublic taxas={rates} hideRange13a21={proposta.hideRange13a21 || false} />
        </CardContent>
      </Card>

      {/* Outros Métodos */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="py-4 text-center flex flex-col justify-center h-full">
            <p className="text-xs text-[#002443]/50 mb-1 uppercase font-semibold">PIX</p>
            <p className="text-lg font-bold text-[#2bc196]">
              {rates.pix?.tipo === 'fixo'
                ? `R$ ${(parseFloat(rates.pix?.valor) || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
                : `${(parseFloat(rates.pix?.valor) || 0).toFixed(2).replace('.', ',')}%`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center flex flex-col justify-center h-full">
            <p className="text-xs text-[#002443]/50 mb-1 uppercase font-semibold">BOLETO</p>
            <p className="text-lg font-bold text-[#002443]">
              R$ {(parseFloat(rates.boleto) || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center flex flex-col justify-center h-full">
            <p className="text-xs text-[#002443]/50 mb-1 uppercase font-semibold">{t('pp.transaction_fee')}</p>
            <p className="text-lg font-bold text-[#002443]">
              R$ {(parseFloat(rates.feeTransacao) || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center flex flex-col justify-center h-full">
            <p className="text-xs text-[#002443]/50 mb-1 uppercase font-semibold">ANTIFRAUDE</p>
            <p className="text-lg font-bold text-[#002443]">
              R$ {(parseFloat(rates.antifraude) || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center flex flex-col justify-center h-full">
            <p className="text-xs text-[#002443]/50 mb-1 uppercase font-semibold">3DS</p>
            <p className="text-lg font-bold text-[#002443]">
              R$ {(parseFloat(rates.taxa3ds) || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center flex flex-col justify-center h-full">
            <p className="text-xs text-[#002443]/50 mb-1 uppercase font-semibold">{t('pp.pre_chargeback')}</p>
            <p className="text-lg font-bold text-[#002443]">
              R$ {(parseFloat(rates.alertaPreChargeback) || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </p>
          </CardContent>
        </Card>
        {(parseFloat(rates.setup) || 0) > 0 && (
          <Card>
            <CardContent className="py-4 text-center flex flex-col justify-center h-full">
              <p className="text-xs text-[#002443]/50 mb-1 uppercase font-semibold">SETUP</p>
              <p className="text-lg font-bold text-[#002443]">
                R$ {(parseFloat(rates.setup) || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </p>
            </CardContent>
          </Card>
        )}
        {(parseFloat(rates.forex) || 0) > 0 && (
          <Card className="border-amber-200 bg-amber-50/50">
            <CardContent className="py-4 text-center flex flex-col justify-center h-full">
              <p className="text-xs text-[#002443]/50 mb-1 uppercase font-semibold">{t('pp.forex_rate')}</p>
              <p className="text-lg font-bold text-amber-600">
                {(parseFloat(rates.forex) || 0).toFixed(2).replace('.', ',')}%
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Prazo + Antecipação + Volume */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="py-5 text-center">
            <p className="text-xs text-[#002443]/50 mb-2 uppercase font-semibold tracking-wide">{t('pp.receiving_term')}</p>
            <p className="text-xl font-bold text-[#002443]">{prazo}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 text-center">
            <p className="text-xs text-[#002443]/50 mb-2 uppercase font-semibold tracking-wide">{t('pp.anticipation_rate')}</p>
            <p className="text-xl font-bold text-amber-600">{taxaRAV}% a.m.</p>
            <p className="text-[10px] text-amber-600/80 mt-2">* Sujeito à aprovação de Compliance</p>
          </CardContent>
        </Card>
        <Card className="border-[#2bc196]/30 bg-[#2bc196]/5">
          <CardContent className="py-5 text-center">
            <p className="text-xs text-[#002443]/50 mb-2 uppercase font-semibold tracking-wide">Volume Antecipado</p>
            <p className="text-xl font-bold text-[#2bc196]">
              {parseFloat(rates.percentualAntecipacao) > 0 ? `${parseFloat(rates.percentualAntecipacao)}%` : '—'}
            </p>
            <p className="text-[10px] text-[#002443]/40 mt-2">do TPV processado</p>
          </CardContent>
        </Card>
      </div>

      {/* Disclaimer: 100% antecipação está sujeita à análise de Compliance */}
      {parseFloat(rates.percentualAntecipacao) >= 100 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3">
          <Info className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Importante:</span> caso existam subcontas/subsellers, a antecipação de 100% do TPV dependerá do resultado da análise de Compliance de cada subconta/subseller.
          </p>
        </div>
      )}

      {/* Tabela de Parcelas */}
      <Card className="mb-8">
        <CardContent className="py-4">
          <h2 className="font-bold text-base text-[#002443] mb-4">
            {t('pp.installment_table')}
          </h2>
          <ParcelasTableDetalhada taxas={rates} taxaRAV={taxaRAV} prazo={prazo} showSimulator={!proposta.hideCalculationColumns} taxaFinalOverrides={proposta.taxaFinalOverrides || {}} hideCalculationColumns={proposta.hideCalculationColumns || false} hideRange13a21={proposta.hideRange13a21 || false} />
        </CardContent>
      </Card>

      <div className="mb-8">
        <InternationalPaymentsBanner />
      </div>

      {['enviada', 'visualizada', 'expirada'].includes(proposta.status) && !isAlreadyResponded && (
        <div className="h-28" />
      )}

      {proposta.status === 'contraproposta' && (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 mx-auto text-blue-500 mb-3" />
          <h2 className="text-xl font-bold text-[#002443] mb-1">{t('pp.counter_sent_title')}</h2>
          <p className="text-[#002443]/60">{t('pp.counter_sent_desc')}</p>
        </div>
      )}

      <div className="text-center text-xs text-[#002443]/30 py-4 border-t border-slate-200">
        <p>&copy; {new Date().getFullYear()} Pagsmile. Proposta {proposta.codigo}</p>
      </div>

      {/* Barra de ação: inclui propostas expiradas — cliente sempre pode aceitar (servidor valida). */}
      {['enviada', 'visualizada', 'expirada'].includes(proposta.status) && !isAlreadyResponded && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,36,67,0.1)]">
          <div className="max-w-4xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
            <Button
              onClick={() => setShowAceiteModal(true)}
              disabled={!proposta?.id || !effectiveToken}
              className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white px-10 h-12 rounded-2xl text-base font-bold w-full md:w-auto shadow-lg shadow-[#2bc196]/20 transition-transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Shield className="w-5 h-5 mr-2" />
              {t('pp.accept_proposal')}
            </Button>
            <div className="flex w-full md:w-auto gap-3">
              <Button
                onClick={() => setShowContrapropostaModal(true)}
                variant="outline"
                className="flex-1 md:flex-none border-[#002443]/20 text-[#002443] hover:bg-[#002443]/5 h-12 rounded-2xl font-semibold"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                {t('pp.negotiate')}
              </Button>
              <Button
                onClick={() => setShowRecusaModal(true)}
                variant="outline"
                className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50 h-12 rounded-2xl font-semibold"
              >
                <XCircle className="w-4 h-4 mr-2" />
                {t('pp.reject')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AceiteModal
        open={showAceiteModal}
        onClose={() => setShowAceiteModal(false)}
        onConfirm={() => aceitarMutation.mutate()}
        isPending={aceitarMutation.isPending}
      />
      <ContrapropostaModal
        open={showContrapropostaModal}
        onClose={() => setShowContrapropostaModal(false)}
        proposta={proposta}
        onSubmit={(data) => contrapropostaMutation.mutate(data)}
        isPending={contrapropostaMutation.isPending}
      />
      <RecusaModal
        open={showRecusaModal}
        onClose={() => setShowRecusaModal(false)}
        onSubmit={(data) => recusarMutation.mutate(data)}
        isPending={recusarMutation.isPending}
      />
    </div>
  );
}