import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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
import { createPageUrl } from '../utils';
import { formatCNPJ } from '@/components/proposals/CnpjInput';
import AceiteModal from '@/components/proposals/AceiteModal';
import ContrapropostaModal from '@/components/proposals/ContrapropostaModal';
import RecusaModal from '@/components/proposals/RecusaModal';

export default function PropostaPixPublica() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const queryClient = useQueryClient();
  const contentRef = useRef(null);

  const [showAceiteModal, setShowAceiteModal] = useState(false);
  const [showContrapropostaModal, setShowContrapropostaModal] = useState(false);
  const [showRecusaModal, setShowRecusaModal] = useState(false);

  const { data: proposta, isLoading } = useQuery({
    queryKey: ['pix_proposta_publica', token],
    queryFn: async () => {
      if (!token) return null;
      const results = await base44.entities.PixProposal.filter({ tokenPublico: token });
      return results[0] || null;
    },
    enabled: !!token
  });

  // Track view
  useEffect(() => {
    if (proposta && proposta.status === 'enviada') {
      const viewKey = `pix_proposta_viewed_${proposta.id}`;
      if (sessionStorage.getItem(viewKey)) return;
      sessionStorage.setItem(viewKey, '1');
      base44.entities.PixProposal.update(proposta.id, { status: 'visualizada' });
      if (proposta.leadId) {
        base44.entities.LeadActivity.create({
          leadId: proposta.leadId, activityType: 'proposta_visualizada',
          description: `Proposta PIX ${proposta.codigo} visualizada pelo cliente`,
          performedBy: 'cliente', activityDate: new Date().toISOString()
        });
      }
    }
  }, [proposta?.id]);

  const aceitarMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.PixProposal.update(proposta.id, { status: 'aceita', acceptedDate: new Date().toISOString() });
      if (proposta.leadId) {
        await base44.entities.Lead.update(proposta.leadId, { status: 'proposta_aceita', lastInteractionDate: new Date().toISOString() });
      }
      await base44.entities.LeadActivity.create({
        leadId: proposta.leadId || '', activityType: 'proposta_aceita',
        description: `Proposta PIX ${proposta.codigo} aceita pelo cliente`,
        performedBy: 'cliente', activityDate: new Date().toISOString()
      });
      base44.analytics.track({ eventName: 'pix_proposta_aceita', properties: { proposal_id: proposta.id, proposal_code: proposta.codigo || '', client_name: proposta.clienteNome || '', success: true } });

      // Redirect to PIX compliance questionnaire
      let complianceUrl = null;
      if (proposta.leadId) {
        const keysToClean = ['compliance_session_token', 'compliance_data_pix'];
        keysToClean.forEach(key => localStorage.removeItem(key));
        localStorage.setItem('lead_id_for_compliance', proposta.leadId);
        complianceUrl = `${window.location.origin}${createPageUrl('ComplianceDinamico')}?model=pix&leadId=${proposta.leadId}`;
      }
      return complianceUrl;
    },
    onSuccess: (complianceUrl) => {
      toast.success('Proposta PIX aceita com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['pix_proposta_publica', token] });
      setShowAceiteModal(false);
      if (complianceUrl) { setTimeout(() => { window.location.href = complianceUrl; }, 2000); }
    }
  });

  const contrapropostaMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.PixProposal.update(proposta.id, { status: 'contraproposta', counterProposalDetails: data });
      await base44.entities.LeadActivity.create({ leadId: proposta.leadId || '', activityType: 'proposta_contraproposta', description: `Contraproposta PIX recebida para ${proposta.codigo}`, performedBy: 'cliente', activityDate: new Date().toISOString() });
      if (proposta.leadId) { await base44.entities.Lead.update(proposta.leadId, { status: 'em_contato_comercial', lastInteractionDate: new Date().toISOString() }); }
    },
    onSuccess: () => { toast.success('Contraproposta enviada!'); queryClient.invalidateQueries({ queryKey: ['pix_proposta_publica', token] }); setShowContrapropostaModal(false); }
  });

  const recusarMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.PixProposal.update(proposta.id, { status: 'recusada', rejectedDate: new Date().toISOString(), rejectedReason: `${data.motivo}${data.detalhe ? `: ${data.detalhe}` : ''}` });
      await base44.entities.LeadActivity.create({ leadId: proposta.leadId || '', activityType: 'proposta_recusada', description: `Proposta PIX ${proposta.codigo} recusada: ${data.motivo}`, performedBy: 'cliente', activityDate: new Date().toISOString() });
      if (proposta.leadId) { await base44.entities.Lead.update(proposta.leadId, { status: 'proposta_recusada', lastInteractionDate: new Date().toISOString() }); }
    },
    onSuccess: () => { toast.success('Proposta recusada'); queryClient.invalidateQueries({ queryKey: ['pix_proposta_publica', token] }); setShowRecusaModal(false); }
  });

  if (isLoading) return <div className="max-w-4xl mx-auto py-12 px-4 space-y-6"><Skeleton className="h-20 w-full rounded-xl" /><Skeleton className="h-12 w-3/4" /><Skeleton className="h-96 w-full rounded-xl" /></div>;
  if (!proposta) return <div className="max-w-lg mx-auto py-20 text-center"><AlertTriangle className="w-16 h-16 mx-auto text-amber-500 mb-4" /><h1 className="text-2xl font-bold text-[#002443] mb-2">Proposta não encontrada</h1><p className="text-[#002443]/60">O link pode ter expirado ou ser inválido.</p></div>;

  const isExpired = proposta.validUntil && new Date(proposta.validUntil) < new Date();
  if (isExpired && !['aceita', 'recusada', 'contraproposta'].includes(proposta.status)) {
    return <div className="max-w-lg mx-auto py-20 text-center"><Clock className="w-16 h-16 mx-auto text-slate-400 mb-4" /><h1 className="text-2xl font-bold text-[#002443] mb-2">Proposta Expirada</h1><p className="text-[#002443]/60">Esta proposta expirou em {moment(proposta.validUntil).format('DD/MM/YYYY')}.</p></div>;
  }

  const isAlreadyResponded = ['aceita', 'recusada'].includes(proposta.status);
  const rates = proposta.rates || {};

  return (
    <div className="max-w-4xl mx-auto py-8 px-4" ref={contentRef}>
      {/* Status Banner */}
      {isAlreadyResponded && (
        <div className={`rounded-2xl p-6 mb-6 text-center ${proposta.status === 'aceita' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-center justify-center gap-3 mb-2">
            {proposta.status === 'aceita' ? <CheckCircle2 className="w-8 h-8 text-green-500" /> : <XCircle className="w-8 h-8 text-red-500" />}
            <h2 className={`text-xl font-bold ${proposta.status === 'aceita' ? 'text-green-800' : 'text-red-800'}`}>
              Proposta {proposta.status === 'aceita' ? 'Aceita' : 'Recusada'}
            </h2>
          </div>
          <p className={`text-sm ${proposta.status === 'aceita' ? 'text-green-600' : 'text-red-600'}`}>
            {proposta.status === 'aceita' ? 'Obrigado! Veja abaixo as condições comerciais acordadas.' : 'Esta proposta foi recusada.'}
          </p>
        </div>
      )}

      {/* Hero Header */}
      <div className="relative overflow-hidden bg-[#002443] rounded-3xl p-8 md:p-12 mb-8 text-center shadow-xl">
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2bc196 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#2bc196] rounded-full blur-3xl opacity-20 pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#5cf7cf] rounded-full blur-3xl opacity-10 pointer-events-none" />
        <div className="relative z-10">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/df6449845_Logo-modo-escuro.png" alt="Pagsmile" className="h-12 mx-auto mb-6" />
          <Badge className="bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border-none mb-4 px-4 py-1.5 text-sm">Proposta PIX</Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">Condições Comerciais PIX</h1>
          <p className="text-white/80 text-base md:text-lg max-w-lg mx-auto">
            Preparadas especialmente para <span className="font-bold text-white">{proposta.clienteNome}</span>
          </p>
          <p className="text-white/40 text-xs mt-8">Emitida em {proposta.created_date ? moment(proposta.created_date).format('DD/MM/YYYY') : '-'}</p>
        </div>
      </div>

      {/* Client & Validity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="border-[#2bc196]/20 bg-[#2bc196]/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2"><Shield className="w-4 h-4 text-[#2bc196]" /><h3 className="font-bold text-sm text-[#002443]">Dados do Cliente</h3></div>
            <p className="font-bold text-lg text-[#002443]">{proposta.clienteNome}</p>
            <p className="text-sm text-[#002443]/60">CNPJ: {formatCNPJ(proposta.clienteCnpj)}</p>
            {proposta.clienteContato && <p className="text-sm text-[#002443]/60 mt-1">Contato: {proposta.clienteContato}</p>}
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-slate-500" /><h3 className="font-bold text-sm text-[#002443]">Validade da Proposta</h3></div>
            <p className="font-bold text-lg text-[#002443]">{proposta.validUntil ? moment(proposta.validUntil).format('DD/MM/YYYY') : '-'}</p>
            <p className="text-sm text-[#002443]/60 mt-2 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" />Sujeita à aprovação do time de compliance.</p>
          </CardContent>
        </Card>
      </div>

      {/* PIX Rate Card */}
      <Card className="mb-6 border-[#2bc196]/30 bg-gradient-to-r from-[#2bc196]/5 to-transparent">
        <CardContent className="py-8">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Banknote className="w-6 h-6 text-[#2bc196]" />
            <h2 className="font-bold text-xl text-[#002443]">Taxa PIX</h2>
          </div>
          <div className="text-center">
            <p className="text-5xl font-extrabold text-[#2bc196]">
              {rates.pix?.tipo === 'fixo'
                ? `R$ ${(parseFloat(rates.pix?.valor) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `${(parseFloat(rates.pix?.valor) || 0).toFixed(2).replace('.', ',')}%`}
            </p>
            <p className="text-sm text-[#002443]/50 mt-2">
              {rates.pix?.tipo === 'fixo' ? 'por transação' : 'sobre o valor da transação'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* TPV Mínimo */}
      {rates.minimoGarantido && (parseFloat(rates.minimoGarantido.mes1) > 0 || parseFloat(rates.minimoGarantido.mes2) > 0 || parseFloat(rates.minimoGarantido.mes3) > 0) && (
        <Card className="mb-6 bg-slate-50 border-slate-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-4"><Shield className="w-5 h-5 text-slate-500" /><h2 className="font-bold text-base text-[#002443]">TPV Mínimo Garantido</h2></div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                <p className="text-xs text-[#002443]/50 uppercase font-semibold mb-1">Mês 1</p>
                <p className="font-bold text-[#002443]">R$ {(parseFloat(rates.minimoGarantido.mes1) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                <p className="text-xs text-[#002443]/50 uppercase font-semibold mb-1">Mês 2</p>
                <p className="font-bold text-[#002443]">R$ {(parseFloat(rates.minimoGarantido.mes2) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#2bc196]/40 text-center shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-[#2bc196]/5 pointer-events-none" />
                <p className="text-xs text-[#2bc196] uppercase font-semibold mb-1">Mês 3 em diante</p>
                <p className="font-bold text-[#2bc196]">R$ {(parseFloat(rates.minimoGarantido.mes3) || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
            </div>
            <p className="text-xs text-[#002443]/50 mt-3 text-center">* O valor de "Mês 3 em diante" é a meta mensal a ser mantida a partir do terceiro mês de operação.</p>
          </CardContent>
        </Card>
      )}

      {/* Action Bar */}
      {['enviada', 'visualizada'].includes(proposta.status) && !isAlreadyResponded && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 z-50 md:relative md:bg-transparent md:backdrop-blur-none md:border-none md:p-0 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 md:mb-8 shadow-[0_-10px_40px_rgba(0,36,67,0.08)] md:shadow-none pb-safe">
          <Button onClick={() => setShowAceiteModal(true)} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white px-10 h-14 rounded-2xl text-lg font-bold w-full md:w-auto shadow-lg shadow-[#2bc196]/20 transition-transform hover:scale-105">
            <Shield className="w-5 h-5 mr-2" /> Aceitar Proposta
          </Button>
          <div className="flex w-full md:w-auto gap-3">
            <Button onClick={() => setShowContrapropostaModal(true)} variant="outline" className="flex-1 md:flex-none border-[#002443]/20 text-[#002443] hover:bg-[#002443]/5 h-14 rounded-2xl font-semibold">
              <MessageSquare className="w-4 h-4 mr-2" /> Negociar
            </Button>
            <Button onClick={() => setShowRecusaModal(true)} variant="outline" className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50 h-14 rounded-2xl font-semibold">
              <XCircle className="w-4 h-4 mr-2" /> Recusar
            </Button>
          </div>
        </div>
      )}

      {proposta.status === 'contraproposta' && (
        <div className="text-center py-8">
          <MessageSquare className="w-12 h-12 mx-auto text-blue-500 mb-3" />
          <h2 className="text-xl font-bold text-[#002443] mb-1">Contraproposta Enviada</h2>
          <p className="text-[#002443]/60">Aguardando análise do time comercial.</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-[#002443]/30 py-4 border-t border-slate-200">
        <p>&copy; {new Date().getFullYear()} Pagsmile. Proposta {proposta.codigo}</p>
        <p>Emitida em {proposta.created_date ? moment(proposta.created_date).format('DD/MM/YYYY [às] HH:mm') : '-'}</p>
      </div>

      {/* Modals */}
      <AceiteModal open={showAceiteModal} onClose={() => setShowAceiteModal(false)} onConfirm={() => aceitarMutation.mutate()} isPending={aceitarMutation.isPending} />
      <ContrapropostaModal open={showContrapropostaModal} onClose={() => setShowContrapropostaModal(false)} proposta={proposta} onSubmit={(data) => contrapropostaMutation.mutate(data)} isPending={contrapropostaMutation.isPending} />
      <RecusaModal open={showRecusaModal} onClose={() => setShowRecusaModal(false)} onSubmit={(data) => recusarMutation.mutate(data)} isPending={recusarMutation.isPending} />
    </div>
  );
}