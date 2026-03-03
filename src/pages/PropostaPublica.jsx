import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
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

export default function PropostaPublica() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const queryClient = useQueryClient();
  const propostaContentRef = useRef(null);

  const [showAceiteModal, setShowAceiteModal] = useState(false);
  const [showContrapropostaModal, setShowContrapropostaModal] = useState(false);
  const [showRecusaModal, setShowRecusaModal] = useState(false);

  const { data: proposta, isLoading, error } = useQuery({
    queryKey: ['proposta_publica', token],
    queryFn: async () => {
      if (!token) return null;
      const results = await base44.entities.Proposal.filter({ tokenPublico: token });
      return results[0] || null;
    },
    enabled: !!token
  });

  // Register view when loaded + track in LeadActivity
  useEffect(() => {
    if (proposta && proposta.status === 'enviada') {
      base44.entities.Proposal.update(proposta.id, {
        status: 'visualizada',
      });
      // Registrar visualização como atividade do Lead
      if (proposta.leadId) {
        base44.entities.LeadActivity.create({
          leadId: proposta.leadId,
          activityType: 'proposta_visualizada',
          description: `Proposta ${proposta.codigo} visualizada pelo cliente`,
          performedBy: 'cliente',
          activityDate: new Date().toISOString()
        });
      }
    }
  }, [proposta?.id]);

  // Mutations
  const aceitarMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Proposal.update(proposta.id, {
        status: 'aceita',
        acceptedDate: new Date().toISOString(),
      });

      await base44.entities.LeadActivity.create({
        leadId: proposta.leadId || '',
        activityType: 'proposta_aceita',
        description: `Proposta ${proposta.codigo} aceita pelo cliente`,
        performedBy: 'cliente',
        activityDate: new Date().toISOString()
      });

      if (proposta.leadId) {
        await base44.entities.Lead.update(proposta.leadId, {
          status: 'proposta_aceita',
          lastInteractionDate: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      toast.success('Proposta aceita com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['proposta_publica', token] });
      setShowAceiteModal(false);
    }
  });

  const contrapropostaMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Proposal.update(proposta.id, {
        status: 'contraproposta',
        counterProposalDetails: data,
      });

      await base44.entities.LeadActivity.create({
        leadId: proposta.leadId || '',
        activityType: 'proposta_contraproposta',
        description: `Contraproposta recebida para ${proposta.codigo}`,
        performedBy: 'cliente',
        activityDate: new Date().toISOString()
      });

      if (proposta.leadId) {
        await base44.entities.Lead.update(proposta.leadId, {
          status: 'proposta_recusada',
          lastInteractionDate: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      toast.success('Contraproposta enviada!');
      queryClient.invalidateQueries({ queryKey: ['proposta_publica', token] });
      setShowContrapropostaModal(false);
    }
  });

  const recusarMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Proposal.update(proposta.id, {
        status: 'recusada',
        rejectedDate: new Date().toISOString(),
        rejectedReason: `${data.motivo}${data.detalhe ? `: ${data.detalhe}` : ''}`,
      });

      await base44.entities.LeadActivity.create({
        leadId: proposta.leadId || '',
        activityType: 'proposta_recusada',
        description: `Proposta ${proposta.codigo} recusada: ${data.motivo}`,
        performedBy: 'cliente',
        activityDate: new Date().toISOString()
      });

      if (proposta.leadId) {
        await base44.entities.Lead.update(proposta.leadId, {
          status: 'proposta_recusada',
          lastInteractionDate: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      toast.success('Proposta recusada');
      queryClient.invalidateQueries({ queryKey: ['proposta_publica', token] });
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

  // Not found
  if (!proposta) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <AlertTriangle className="w-16 h-16 mx-auto text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold text-[#002443] mb-2">Proposta não encontrada</h1>
        <p className="text-[#002443]/60">O link pode ter expirado ou ser inválido.</p>
      </div>
    );
  }

  // Expired
  const isExpired = proposta.validUntil && new Date(proposta.validUntil) < new Date();
  if (isExpired && !['aceita', 'recusada', 'contraproposta'].includes(proposta.status)) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <Clock className="w-16 h-16 mx-auto text-slate-400 mb-4" />
        <h1 className="text-2xl font-bold text-[#002443] mb-2">Proposta Expirada</h1>
        <p className="text-[#002443]/60">
          Esta proposta expirou em {moment(proposta.validUntil).format('DD/MM/YYYY')}.
        </p>
        <p className="text-[#002443]/40 mt-2 text-sm">Entre em contato para uma nova proposta.</p>
      </div>
    );
  }

  // Already responded
  if (['aceita', 'recusada'].includes(proposta.status)) {
    const isAceita = proposta.status === 'aceita';
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        {isAceita ? (
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
        ) : (
          <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
        )}
        <h1 className="text-2xl font-bold text-[#002443] mb-2">
          Proposta {isAceita ? 'Aceita' : 'Recusada'}
        </h1>
        <p className="text-[#002443]/60">Esta proposta já foi respondida.</p>
      </div>
    );
  }

  const rates = proposta.rates || {};
  const taxaRAV = parseFloat(rates.rav?.taxa) || 0;
  const prazo = rates.rav?.prazo || 'D+1';

  return (
    <div className="max-w-4xl mx-auto py-8 px-4" ref={propostaContentRef}>
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002443] to-[#003366] rounded-2xl p-8 mb-8 text-center">
        <img
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/9bd38c4f7_Logo-modo-claro.png"
          alt="Pagsmile"
          className="h-10 mx-auto mb-4 brightness-0 invert"
        />
        <p className="text-white/60 text-sm">
          Emitida em {proposta.created_date ? moment(proposta.created_date).format('DD/MM/YYYY') : '-'}
        </p>
      </div>

      {/* Title + Export */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#002443]">PROPOSTA COMERCIAL</h1>
          <p className="text-[#002443]/60 text-sm">Taxas de Pagamentos Online</p>
        </div>
        <ExportButtons contentRef={propostaContentRef} />
      </div>

      {/* Client Card */}
      <Card className="mb-6 border-[#2bc196]/20 bg-[#2bc196]/5">
        <CardContent className="py-4">
          <p className="font-bold text-lg text-[#002443]">{proposta.clienteNome}</p>
          <p className="text-sm text-[#002443]/60">CNPJ: {formatCNPJ(proposta.clienteCnpj)}</p>
        </CardContent>
      </Card>

      {/* Taxas por Bandeira */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <h2 className="font-bold text-base text-[#002443] mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-[#2bc196]" />
            Taxas de Cartão de Crédito
          </h2>
          <TaxasPorBandeiraPublic taxas={rates} />
        </CardContent>
      </Card>

      {/* Outros Métodos */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-[#002443]/50 mb-1">PIX</p>
            <p className="text-lg font-bold text-[#2bc196]">
              {rates.pix?.tipo === 'fixo'
                ? `R$ ${(rates.pix?.valor || 0).toFixed(2).replace('.', ',')}`
                : `${rates.pix?.valor || 0}%`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-[#002443]/50 mb-1">BOLETO</p>
            <p className="text-lg font-bold text-[#002443]">
              R$ {(rates.boleto || 0).toFixed(2).replace('.', ',')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-[#002443]/50 mb-1">PRAZO</p>
            <p className="text-lg font-bold text-[#002443]">{prazo}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center">
            <p className="text-xs text-[#002443]/50 mb-1">ANTECIPAÇÃO</p>
            <p className="text-lg font-bold text-amber-600">{taxaRAV}% a.m.</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Parcelas Detalhada */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <h2 className="font-bold text-base text-[#002443] mb-4">
            Tabela de Parcelas (1x a 12x) por Bandeira
          </h2>
          <ParcelasTableDetalhada taxas={rates} taxaRAV={taxaRAV} prazo={prazo} />
        </CardContent>
      </Card>

      {/* Info */}
      <Alert className="mb-8 border-[#2bc196]/20 bg-[#2bc196]/5">
        <Info className="w-4 h-4 text-[#2bc196]" />
        <AlertDescription className="text-sm text-[#002443]/70">
          {proposta.clienteMcc && `Válida para MCC ${proposta.clienteMcc}. `}
          Válida até {proposta.validUntil ? moment(proposta.validUntil).format('DD/MM/YYYY') : '-'}.
          {' '}Sujeita à aprovação de compliance.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      {['enviada', 'visualizada', 'rascunho'].includes(proposta.status) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Button
            onClick={() => setShowAceiteModal(true)}
            size="lg"
            className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white px-8 gap-2 w-full sm:w-auto"
          >
            <CheckCircle2 className="w-5 h-5" />
            Aceitar Proposta
          </Button>
          <Button
            onClick={() => setShowContrapropostaModal(true)}
            size="lg"
            variant="outline"
            className="border-blue-300 text-blue-700 hover:bg-blue-50 px-8 gap-2 w-full sm:w-auto"
          >
            <MessageSquare className="w-5 h-5" />
            Contraproposta
          </Button>
          <Button
            onClick={() => setShowRecusaModal(true)}
            size="lg"
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50 px-8 gap-2 w-full sm:w-auto"
          >
            <XCircle className="w-5 h-5" />
            Recusar
          </Button>
        </div>
      )}

      {/* Contraproposta status */}
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