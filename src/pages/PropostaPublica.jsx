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
import { createPageUrl } from '../utils';
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

  // Register view when loaded + track in LeadActivity (idempotent)
  useEffect(() => {
    if (proposta && proposta.status === 'enviada') {
      const viewKey = `proposta_viewed_${proposta.id}`;
      if (sessionStorage.getItem(viewKey)) return;
      sessionStorage.setItem(viewKey, '1');

      base44.entities.Proposal.update(proposta.id, {
        status: 'visualizada',
      });
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
      // Determine compliance template based on lead's businessSubCategory
      let complianceUrl = null;
      if (proposta.leadId) {
        const leads = await base44.entities.Lead.filter({ id: proposta.leadId });
        const lead = leads[0];
        if (lead) {
          const subCat = lead.businessSubCategory;
          const COMPLIANCE_TEMPLATES = {
            'MERCHAN': '69a691da6b5ed4982b8a4055',
            'GATEWAY': '69a691da6b5ed4982b8a4056',
            'MARKETPLACE': '69a691da6b5ed4982b8a4057',
          };
          const templateId = COMPLIANCE_TEMPLATES[subCat];
          if (templateId) {
            const compliancePages = {
              'MERCHAN': 'ComplianceFullKYC',
              'GATEWAY': 'ComplianceFullKYC',
              'MARKETPLACE': 'ComplianceFullKYC',
            };
            const page = compliancePages[subCat] || 'ComplianceFullKYC';
            const refCode = subCat === 'MERCHAN' ? 'COMPMERCH' : subCat === 'GATEWAY' ? 'COMPGATEW' : 'COMPMKTPL';
            complianceUrl = `${window.location.origin}${createPageUrl(page)}?ref=${refCode}&leadId=${proposta.leadId}`;
          
            // Update lead with recommended compliance template
            await base44.entities.Lead.update(proposta.leadId, {
              status: 'proposta_aceita',
              recommendedComplianceTemplateId: templateId,
              lastInteractionDate: new Date().toISOString()
            });
          } else {
            await base44.entities.Lead.update(proposta.leadId, {
              status: 'proposta_aceita',
              lastInteractionDate: new Date().toISOString()
            });
          }
        }
      }

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

      return complianceUrl;
    },
    onSuccess: (complianceUrl) => {
      toast.success('Proposta aceita com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['proposta_publica', token] });
      setShowAceiteModal(false);
      
      // Redirect to compliance questionnaire after a brief delay
      if (complianceUrl) {
        setTimeout(() => {
          window.location.href = complianceUrl;
        }, 2000);
      }
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
        <p className="text-[#002443]/60">
          {isAceita ? 'Obrigado! Agora você será direcionado ao questionário de Compliance.' : 'Esta proposta já foi respondida.'}
        </p>
        {isAceita && proposta.complianceRedirectUrl && (
          <Button
            onClick={() => window.location.href = proposta.complianceRedirectUrl}
            className="mt-6 bg-[#2bc196] hover:bg-[#2bc196]/90 text-white px-8 h-12 rounded-2xl font-bold"
          >
            <Shield className="w-4 h-4 mr-2" />
            Iniciar Questionário de Compliance
          </Button>
        )}
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
        {/* Abstract Background Details */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2bc196 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#2bc196] rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#5cf7cf] rounded-full blur-3xl opacity-10 pointer-events-none"></div>
        
        <div className="relative z-10">
          <img
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/9bd38c4f7_Logo-modo-claro.png"
            alt="Pagsmile"
            className="h-12 mx-auto mb-6 brightness-0 invert"
          />
          <Badge className="bg-[#2bc196]/20 text-[#5cf7cf] hover:bg-[#2bc196]/30 border-none mb-4 px-4 py-1.5 text-sm">
            Proposta Exclusiva
          </Badge>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
            Condições Comerciais
          </h1>
          <p className="text-white/80 text-base md:text-lg max-w-lg mx-auto">
            Preparadas especialmente para <span className="font-bold text-white">{proposta.clienteNome}</span>
          </p>
          <p className="text-white/40 text-xs mt-8">
            Emitida em {proposta.created_date ? moment(proposta.created_date).format('DD/MM/YYYY') : '-'}
          </p>
        </div>
      </div>

      {/* Title + Export */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#002443]">PROPOSTA COMERCIAL</h1>
          <p className="text-[#002443]/60 text-sm">Taxas de Pagamentos Online</p>
        </div>
        <ExportButtons contentRef={propostaContentRef} />
      </div>

      {/* Detalhes do Cliente e Proposta */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="border-[#2bc196]/20 bg-[#2bc196]/5">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-[#2bc196]" />
              <h3 className="font-bold text-sm text-[#002443]">Dados do Cliente</h3>
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
              <h3 className="font-bold text-sm text-[#002443]">Validade da Proposta</h3>
            </div>
            <p className="font-bold text-lg text-[#002443]">
              {proposta.validUntil ? moment(proposta.validUntil).format('DD/MM/YYYY') : '-'}
            </p>
            <p className="text-sm text-[#002443]/60 mt-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Esta proposta está sujeita à aprovação do time de compliance.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* TPV Mínimo Garantido */}
      {rates.minimoGarantido && (parseFloat(rates.minimoGarantido.mes1) > 0 || parseFloat(rates.minimoGarantido.mes2) > 0 || parseFloat(rates.minimoGarantido.mes3) > 0) && (
        <Card className="mb-6 bg-slate-50 border-slate-200">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-slate-500" />
              <h2 className="font-bold text-base text-[#002443]">TPV Mínimo Garantido</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                <p className="text-xs text-[#002443]/50 uppercase font-semibold mb-1">Mês 1</p>
                <p className="font-bold text-[#002443]">
                  R$ {(parseFloat(rates.minimoGarantido.mes1) || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 text-center">
                <p className="text-xs text-[#002443]/50 uppercase font-semibold mb-1">Mês 2</p>
                <p className="font-bold text-[#002443]">
                  R$ {(parseFloat(rates.minimoGarantido.mes2) || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-[#2bc196]/40 text-center shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-[#2bc196]/5 pointer-events-none" />
                <p className="text-xs text-[#2bc196] uppercase font-semibold mb-1">Mês 3 em diante</p>
                <p className="font-bold text-[#2bc196]">
                  R$ {(parseFloat(rates.minimoGarantido.mes3) || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                </p>
              </div>
            </div>
            <p className="text-xs text-[#002443]/50 mt-3 text-center">
              * O valor de "Mês 3 em diante" é a meta mensal a ser mantida a partir do terceiro mês de operação.
            </p>
          </CardContent>
        </Card>
      )}

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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="py-4 text-center flex flex-col justify-center h-full">
            <p className="text-xs text-[#002443]/50 mb-1 uppercase font-semibold">PIX</p>
            <p className="text-lg font-bold text-[#2bc196]">
              {rates.pix?.tipo === 'fixo'
                ? `R$ ${(parseFloat(rates.pix?.valor) || 0).toFixed(2).replace('.', ',')}`
                : `${(parseFloat(rates.pix?.valor) || 0).toFixed(2).replace('.', ',')}%`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center flex flex-col justify-center h-full">
            <p className="text-xs text-[#002443]/50 mb-1 uppercase font-semibold">BOLETO</p>
            <p className="text-lg font-bold text-[#002443]">
              R$ {(parseFloat(rates.boleto) || 0).toFixed(2).replace('.', ',')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center flex flex-col justify-center h-full">
            <p className="text-xs text-[#002443]/50 mb-1 uppercase font-semibold">ANTIFRAUDE</p>
            <p className="text-lg font-bold text-[#002443]">
              R$ {(parseFloat(rates.antifraude) || 0).toFixed(2).replace('.', ',')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center flex flex-col justify-center h-full">
            <p className="text-xs text-[#002443]/50 mb-1 uppercase font-semibold">PRAZO DE RECEBIMENTO</p>
            <p className="text-lg font-bold text-[#002443]">{prazo}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 text-center flex flex-col justify-center h-full">
            <p className="text-xs text-[#002443]/50 mb-1 uppercase font-semibold">TAXA DE ANTECIPAÇÃO</p>
            <p className="text-lg font-bold text-amber-600">{taxaRAV}% a.m.</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Parcelas Detalhada */}
      <Card className="mb-8">
        <CardContent className="py-4">
          <h2 className="font-bold text-base text-[#002443] mb-4">
            Tabela de Parcelas por Bandeira
          </h2>
          <ParcelasTableDetalhada taxas={rates} taxaRAV={taxaRAV} prazo={prazo} />
        </CardContent>
      </Card>

      {/* Floating Action Bar */}
      {['enviada', 'visualizada', 'rascunho'].includes(proposta.status) && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 z-50 md:relative md:bg-transparent md:backdrop-blur-none md:border-none md:p-0 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4 md:mb-8 shadow-[0_-10px_40px_rgba(0,36,67,0.08)] md:shadow-none pb-safe">
          <Button
            onClick={() => setShowAceiteModal(true)}
            className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white px-10 h-14 rounded-2xl text-lg font-bold w-full md:w-auto shadow-lg shadow-[#2bc196]/20 transition-transform hover:scale-105"
          >
            <Shield className="w-5 h-5 mr-2" />
            Aceitar Proposta
          </Button>
          
          <div className="flex w-full md:w-auto gap-3">
            <Button
              onClick={() => setShowContrapropostaModal(true)}
              variant="outline"
              className="flex-1 md:flex-none border-[#002443]/20 text-[#002443] hover:bg-[#002443]/5 h-14 rounded-2xl font-semibold"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              Negociar
            </Button>
            <Button
              onClick={() => setShowRecusaModal(true)}
              variant="outline"
              className="flex-1 md:flex-none border-red-200 text-red-600 hover:bg-red-50 h-14 rounded-2xl font-semibold"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Recusar
            </Button>
          </div>
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