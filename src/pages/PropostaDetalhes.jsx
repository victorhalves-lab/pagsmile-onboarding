import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Pencil, Link2, Copy, Check, ExternalLink,
  Loader2, FileText, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import PropostaRevisaoHeader from '@/components/proposals/PropostaRevisaoHeader';
import PropostaRevisaoResumo from '@/components/proposals/PropostaRevisaoResumo';
import PropostaRevisaoLink from '@/components/proposals/PropostaRevisaoLink';

const STATUS_CONFIG = {
  rascunho: { label: 'Rascunho', color: 'bg-slate-100 text-slate-700' },
  enviada: { label: 'Enviada', color: 'bg-yellow-100 text-yellow-700' },
  visualizada: { label: 'Visualizada', color: 'bg-orange-100 text-orange-700' },
  contraproposta: { label: 'Contraproposta', color: 'bg-blue-100 text-blue-700' },
  aceita: { label: 'Aceita', color: 'bg-green-100 text-green-700' },
  recusada: { label: 'Recusada', color: 'bg-red-100 text-red-700' },
  expirada: { label: 'Expirada', color: 'bg-slate-100 text-slate-500' },
  cancelada: { label: 'Cancelada', color: 'bg-slate-100 text-slate-500' },
};

export default function PropostaDetalhes() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const proposalId = urlParams.get('id');

  const { data: proposta, isLoading } = useQuery({
    queryKey: ['proposta-detalhes', proposalId],
    queryFn: () => base44.entities.Proposal.filter({ id: proposalId }),
    enabled: !!proposalId,
    select: (data) => data?.[0],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" />
      </div>
    );
  }

  if (!proposta) {
    return (
      <div className="text-center py-20">
        <FileText className="w-12 h-12 mx-auto text-[#002443]/20 mb-4" />
        <p className="text-[#002443]/60">Proposta não encontrada</p>
        <Button variant="link" onClick={() => navigate(createPageUrl('GestaoPropostas'))} className="mt-2">
          Voltar para Gestão de Propostas
        </Button>
      </div>
    );
  }

  const sCfg = STATUS_CONFIG[proposta.status] || STATUS_CONFIG.rascunho;
  const publicLink = proposta.tokenPublico
    ? `${window.location.origin}${createPageUrl('PropostaPublica')}?token=${proposta.tokenPublico}`
    : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <PropostaRevisaoHeader
        proposta={proposta}
        statusConfig={sCfg}
        onBack={() => navigate(createPageUrl('GestaoPropostas'))}
        onEdit={() => navigate(createPageUrl('CriarProposta') + `?edit=${proposta.id}`)}
      />

      {/* Link Público - Seção principal de ação */}
      <PropostaRevisaoLink proposta={proposta} publicLink={publicLink} />

      {/* Resumo completo da proposta */}
      <PropostaRevisaoResumo proposta={proposta} />

      {/* Footer */}
      <div className="flex justify-center pb-8">
        <Button variant="outline" onClick={() => navigate(createPageUrl('GestaoPropostas'))} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar para Gestão de Propostas
        </Button>
      </div>
    </div>
  );
}