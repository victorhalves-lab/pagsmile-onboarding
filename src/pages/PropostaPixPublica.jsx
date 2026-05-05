import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// SDK-FREE: this page is PUBLIC. Anonymous visitors can't use @base44/sdk on a private app.
import { callPublicFunction } from '@/lib/publicApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2, XCircle, MessageSquare, Clock, Info,
  Loader2, AlertTriangle, Shield, Banknote
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import { formatCNPJ } from '@/components/proposals/CnpjInput';
import AceiteModal from '@/components/proposals/AceiteModal';
import ContrapropostaModal from '@/components/proposals/ContrapropostaModal';
import RecusaModal from '@/components/proposals/RecusaModal';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { resolvePixComplianceModel } from '@/components/compliance/segmentToComplianceV4Map';
import { canonicalizeSlugUrl } from '@/lib/publicSlug';
import { usePublicProposalQuery } from '@/hooks/usePublicProposalQuery';
import PublicProposalErrorState from '@/components/proposals/PublicProposalErrorState';
import { enqueueAccept, startAcceptWorker } from '@/lib/acceptQueue';
import DownloadPdfButton from '@/components/proposals/DownloadPdfButton';

export default function PropostaPixPublica() {
  const { t } = useTranslation();
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const queryClient = useQueryClient();
  const contentRef = useRef(null);

  const [showAceiteModal, setShowAceiteModal] = useState(false);
  const [showContrapropostaModal, setShowContrapropostaModal] = useState(false);
  const [showRecusaModal, setShowRecusaModal] = useState(false);

  // ROBUSTO: hook com 5 tentativas + fallback por slug. Distingue erro de rede de "não encontrada".
  const { status: loadStatus, proposal: proposta, refetch } = usePublicProposalQuery('pix_proposal', token);
  const isLoading = loadStatus === 'loading';
  const effectiveToken = proposta?.tokenPublico || token;

  // Canonicalize URL to /pix/:slug when coming from legacy ?token= link
  useEffect(() => {
    if (proposta?.publicSlug) canonicalizeSlugUrl('pixProposal', proposta.publicSlug);
  }, [proposta?.publicSlug]);

  // Inicia worker da fila de aceite persistente
  useEffect(() => { startAcceptWorker(); }, []);

  // Track view via public function (idempotent on server)
  useEffect(() => {
    if (proposta && proposta.status === 'enviada') {
      const viewKey = `pix_proposta_viewed_${proposta.id}`;
      if (sessionStorage.getItem(viewKey)) return;
      sessionStorage.setItem(viewKey, '1');
      callPublicFunction('publicProposalAction', {
        token: effectiveToken, slug: proposta?.publicSlug || null, type: 'pix_proposal', action: 'view',
      }).catch(() => {});
    }
  }, [proposta?.id]);

  // Helper: fetch lead (via public function) for compliance model
  const fetchLeadForCompliance = async (leadId) => {
    if (!leadId) return null;
    try {
      const res = await callPublicFunction('publicReadData', { kind: 'lead_by_id', leadId });
      return res?.lead || null;
    } catch { return null; }
  };

  // ACEITE OTIMISTA + FILA PERSISTENTE — aceite nunca se perde, mesmo com rede ruim
  const aceitarMutation = useMutation({
    mutationFn: async () => {
      if (!proposta?.id || !effectiveToken) {
        throw new Error('Proposta não carregada completamente. Atualize a página e tente novamente.');
      }

      // Step 1 — Enfileira o aceite (sincroniza em background até conseguir)
      enqueueAccept({
        proposalId: proposta.id,
        token: effectiveToken,
        slug: proposta.publicSlug || null,
        type: 'pix_proposal',
        action: 'accept',
      });

      // Step 2 — Build compliance URL localmente (não depende do servidor)
      let complianceUrl = null;
      if (proposta.leadId) {
        const keysToClean = ['compliance_session_token', 'compliance_data_pix', 'compliance_data_pix_merchant_v4', 'compliance_data_pix_intermediario_v4'];
        keysToClean.forEach(key => { try { localStorage.removeItem(key); } catch {} });
        try { localStorage.setItem('lead_id_for_compliance', proposta.leadId); } catch {}
        // resolvePixComplianceModel aceita objeto vazio — segue com default se sem lead
        const pixModel = resolvePixComplianceModel({});
        complianceUrl = `${window.location.origin}/ComplianceDinamico?model=${pixModel}&leadId=${proposta.leadId}`;
      }

      // Analytics removido: base44.analytics depende do SDK autenticado (falha em páginas públicas).

      return complianceUrl;
    },
    onSuccess: (complianceUrl) => {
      toast.success(t('pxp.pix_accepted'));
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
        token: effectiveToken, slug: proposta?.publicSlug || null, type: 'pix_proposal', action: 'counter', payload: { details: data },
      });
      if (res?.error) throw new Error(res.error);
    },
    onSuccess: () => { toast.success(t('pp.counter_sent_success')); queryClient.invalidateQueries({ queryKey: ['public_proposal', 'pix_proposal'] }); setShowContrapropostaModal(false); }
  });

  const recusarMutation = useMutation({
    mutationFn: async (data) => {
      const res = await callPublicFunction('publicProposalAction', {
        token: effectiveToken, slug: proposta?.publicSlug || null, type: 'pix_proposal', action: 'reject', payload: { motivo: data.motivo, detalhe: data.detalhe },
      });
      if (res?.error) throw new Error(res.error);
    },
    onSuccess: () => { toast.success(t('pp.proposal_rejected')); queryClient.invalidateQueries({ queryKey: ['public_proposal', 'pix_proposal'] }); setShowRecusaModal(false); }
  });

  // Fetch lead (via public function) to resolve compliance model for the "already accepted" banner
  const { data: leadForBanner } = useQuery({
    queryKey: ['pix_proposta_lead', proposta?.leadId],
    queryFn: async () => fetchLeadForCompliance(proposta.leadId),
    enabled: !!proposta?.leadId && proposta?.status === 'aceita',
  });

  if (isLoading) return <div className="max-w-4xl mx-auto py-12 px-4 space-y-6"><Skeleton className="h-20 w-full rounded-xl" /><Skeleton className="h-12 w-3/4" /><Skeleton className="h-96 w-full rounded-xl" /></div>;
  if (loadStatus === 'error') return <PublicProposalErrorState status="error" onRetry={refetch} />;
  if (loadStatus === 'notfound' || !proposta) return <PublicProposalErrorState status="notfound" />;

  const isExpired = proposta.status === 'expirada' || (proposta.validUntil && new Date(proposta.validUntil) < new Date() && !['aceita', 'recusada', 'contraproposta'].includes(proposta.status));
  const isAlreadyResponded = ['aceita', 'recusada'].includes(proposta.status);

  const pixComplianceModel = resolvePixComplianceModel(leadForBanner);
  const pixComplianceUrl = (proposta?.status === 'aceita' && proposta?.leadId)
    ? `${window.location.origin}/ComplianceDinamico?model=${pixComplianceModel}&leadId=${proposta.leadId}`
    : null;
  const rates = proposta.rates || {};

  return (
    <div className="max-w-4xl mx-auto py-8 px-4" ref={contentRef}>
      {isExpired && (
        <div className="rounded-2xl p-6 mb-6 text-center bg-amber-50 border border-amber-200">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Clock className="w-8 h-8 text-amber-500" />
            <h2 className="text-xl font-bold text-amber-800">{t('pp.expired_title')}</h2>
          </div>
          <p className="text-sm text-amber-600">{t('pp.expired_desc', { date: moment(proposta.validUntil).format('DD/MM/YYYY') })}</p>
          <p className="text-xs text-amber-500 mt-2">{t('pp.expired_contact')}</p>
        </div>
      )}

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
          {proposta.status === 'aceita' && pixComplianceUrl && (
            <Button
              onClick={() => {
                const keysToClean = ['compliance_session_token', 'compliance_data_pix', 'compliance_data_pix_merchant_v4', 'compliance_data_pix_intermediario_v4'];
                keysToClean.forEach(key => localStorage.removeItem(key));
                if (proposta.leadId) localStorage.setItem('lead_id_for_compliance', proposta.leadId);
                window.location.href = pixComplianceUrl;
              }}
              className="mt-4 bg-[#2bc196] hover:bg-[#2bc196]/90 text-white px-8 h-12 rounded-2xl font-bold"
            >
              <Shield className="w-4 h-4 mr-2" />
              {t('pp.start_compliance')}
            </Button>
          )}
        </div>
      )}

      <div className="flex justify-end mb-3">
        <DownloadPdfButton
          type="pix_proposal"
          token={proposta.tokenPublico}
          slug={proposta.publicSlug}
          codigo={proposta.codigo}
          publicMode
        />
      </div>

      <div className="relative overflow-hidden bg-[#002443] rounded-3xl p-8 md:p-12 mb-8 text-center shadow-xl">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2bc196 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#2bc196] rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#5cf7cf] rounded-full blur-3xl opacity-10 pointer-events-none" />
        <div className="relative z-10">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/df6449845_Logo-modo-escuro.png" alt="Pagsmile" className="h-12 mx-auto mb-6" />
          <Badge className="bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border-none mb-4 px-4 py-1.5 text-sm">{t('pxp.pix_proposal')}</Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">{t('pxp.pix_conditions')}</h1>
          <p className="text-white/80 text-base md:text-lg max-w-lg mx-auto">
            {t('pp.prepared_for')} <span className="font-bold text-white">{proposta.clienteNome}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="border-[#2bc196]/20 bg-[#2bc196]/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2"><Shield className="w-4 h-4 text-[#2bc196]" /><h3 className="font-bold text-sm text-[#002443]">{t('pp.client_data')}</h3></div>
            <p className="font-bold text-lg text-[#002443]">{proposta.clienteNome}</p>
            <p className="text-sm text-[#002443]/60">CNPJ: {formatCNPJ(proposta.clienteCnpj)}</p>
            {proposta.clienteContato && <p className="text-sm text-[#002443]/60 mt-1">Contato: {proposta.clienteContato}</p>}
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-slate-500" /><h3 className="font-bold text-sm text-[#002443]">{t('pp.proposal_validity')}</h3></div>
            <p className="font-bold text-lg text-[#002443]">{proposta.validUntil ? moment(proposta.validUntil).format('DD/MM/YYYY') : '-'}</p>
            <p className="text-sm text-[#002443]/60 mt-2 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" />{t('pxp.compliance_subject')}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6 border-[#2bc196]/30 bg-gradient-to-r from-[#2bc196]/5 to-transparent">
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Banknote className="w-6 h-6 text-[#2bc196]" />
            <h2 className="font-bold text-xl text-[#002443]">{t('pxp.pix_rate')}</h2>
          </div>
          <div className="text-center">
            <p className="text-5xl font-extrabold text-[#2bc196]">
              {rates.pix?.tipo === 'fixo'
                ? `R$ ${(parseFloat(rates.pix?.valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `${(parseFloat(rates.pix?.valor) || 0).toFixed(2).replace('.', ',')}%`}
            </p>
            <p className="text-sm text-[#002443]/50 mt-2">
              {rates.pix?.tipo === 'fixo' ? t('pxp.per_transaction') : t('pxp.on_transaction_value')}
            </p>
          </div>
        </CardContent>
      </Card>

      {rates.minimoGarantido && (parseFloat(rates.minimoGarantido.mes1) > 0 || parseFloat(rates.minimoGarantido.mes2) > 0 || parseFloat(rates.minimoGarantido.mes3) > 0) && (
        <Card className="mb-6 bg-slate-50 border-slate-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-4"><Banknote className="w-5 h-5 text-[#002443]/60" /><h2 className="font-bold text-base text-[#002443]">TPV Mínimo Garantido Mensal</h2></div>
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
            <p className="text-xs text-[#002443]/50 mt-3 text-center">{t('pp.min_tpv_note')}</p>
          </CardContent>
        </Card>
      )}

      {['enviada', 'visualizada'].includes(proposta.status) && !isAlreadyResponded && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 z-50 md:relative md:bg-transparent md:backdrop-blur-none md:border-none md:p-0 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 md:mb-8 shadow-[0_-10px_40px_rgba(0,36,67,0.08)] md:shadow-none pb-safe">
          <Button onClick={() => setShowAceiteModal(true)} disabled={!proposta?.id || !effectiveToken} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white px-10 h-14 rounded-2xl text-lg font-bold w-full md:w-auto shadow-lg shadow-[#2bc196]/20 transition-transform hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed">
            <Shield className="w-5 h-5 mr-2" /> {t('pp.accept_proposal')}
          </Button>
          <div className="flex w-full md:w-auto gap-3">
            <Button onClick={() => setShowContrapropostaModal(true)} variant="outline" className="flex-1 md:flex-none border-[#002443]/20 text-[#002443] hover:bg-[#002443]/5 h-14 rounded-2xl font-semibold">
              <MessageSquare className="w-4 h-4 mr-2" /> {t('pp.negotiate')}
            </Button>
            <Button onClick={() => setShowRecusaModal(true)} variant="outline" className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50 h-14 rounded-2xl font-semibold">
              <XCircle className="w-4 h-4 mr-2" /> {t('pp.reject')}
            </Button>
          </div>
        </div>
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

      <AceiteModal open={showAceiteModal} onClose={() => setShowAceiteModal(false)} onConfirm={() => aceitarMutation.mutate()} isPending={aceitarMutation.isPending} />
      <ContrapropostaModal open={showContrapropostaModal} onClose={() => setShowContrapropostaModal(false)} proposta={proposta} onSubmit={(data) => contrapropostaMutation.mutate(data)} isPending={contrapropostaMutation.isPending} />
      <RecusaModal open={showRecusaModal} onClose={() => setShowRecusaModal(false)} onSubmit={(data) => recusarMutation.mutate(data)} isPending={recusarMutation.isPending} />
    </div>
  );
}