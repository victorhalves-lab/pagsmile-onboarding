import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Pencil, Link2, Copy, Check, ExternalLink,
  Loader2, FileText, Eye, GitBranch, Clock, DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import PropostaRevisaoHeader from '@/components/proposals/PropostaRevisaoHeader';
import PropostaRevisaoResumo from '@/components/proposals/PropostaRevisaoResumo';
import PropostaRevisaoLink from '@/components/proposals/PropostaRevisaoLink';
import RentabilidadeDrawer from '@/components/proposals/RentabilidadeDrawer';

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

  const queryClient = useQueryClient();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showRentabilidade, setShowRentabilidade] = useState(false);

  const handleMarkAsAccepted = async () => {
    if (!proposta) return;
    setIsUpdatingStatus(true);
    const now = new Date().toISOString();
    await base44.entities.Proposal.update(proposta.id, {
      status: 'aceita',
      acceptedDate: now,
    });
    let changedBy = 'admin';
    try { const user = await base44.auth.me(); changedBy = user?.email || 'admin'; } catch {}
    await base44.entities.AuditLog.create({
      entityName: 'Proposal', entityId: proposta.id, actionType: 'UPDATE',
      actionDescription: `Proposta ${proposta.codigo} marcada como aceita manualmente por ${changedBy}`,
      changedBy, changeDate: now,
      details: { statusAnterior: proposta.status, statusNovo: 'aceita', acaoManual: true },
    });
    if (proposta.leadId) {
      await base44.entities.Lead.update(proposta.leadId, { status: 'proposta_aceita', lastInteractionDate: now });
    }
    queryClient.invalidateQueries({ queryKey: ['proposta-detalhes', proposalId] });
    queryClient.invalidateQueries({ queryKey: ['propostas'] });
    toast.success('Proposta marcada como aceita!');
    setIsUpdatingStatus(false);
  };

  const { data: proposta, isLoading } = useQuery({
    queryKey: ['proposta-detalhes', proposalId],
    queryFn: () => base44.entities.Proposal.filter({ id: proposalId }),
    enabled: !!proposalId,
    select: (data) => data?.[0],
  });

  const rootId = proposta?.rootProposalId || proposta?.id;
  const { data: versionHistory = [] } = useQuery({
    queryKey: ['proposal-versions', rootId],
    queryFn: async () => {
      if (!rootId) return [];
      const [byRoot, root] = await Promise.all([
        base44.entities.Proposal.filter({ rootProposalId: rootId }),
        base44.entities.Proposal.filter({ id: rootId }),
      ]);
      const all = [...root, ...byRoot];
      const unique = Array.from(new Map(all.map(p => [p.id, p])).values());
      return unique.sort((a, b) => (a.version || 1) - (b.version || 1));
    },
    enabled: !!proposta && !!(proposta.rootProposalId || proposta.previousVersionId),
  });

  const criarNovaVersao = async () => {
    const year = new Date().getFullYear();
    const seq = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
    const { id, created_date, updated_date, created_by, publicLinkCode, tokenPublico, sentDate, acceptedDate, rejectedDate, rejectedReason, counterProposalDetails, ...dataToCopy } = proposta;
    const newVersion = (proposta.version || 1) + 1;

    const newProposta = {
      ...dataToCopy,
      codigo: `PROP-${year}-${seq}`,
      status: 'rascunho',
      tokenPublico: Array.from({ length: 64 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36))).join(''),
      version: newVersion,
      previousVersionId: proposta.id,
      rootProposalId: rootId,
      isCurrentVersion: true,
    };

    const created = await base44.entities.Proposal.create(newProposta);
    await base44.entities.Proposal.update(proposta.id, { isCurrentVersion: false });
    queryClient.invalidateQueries({ queryKey: ['propostas'] });
    toast.success(`Nova versão V${newVersion} criada!`);
    navigate(createPageUrl('CriarProposta') + `?edit=${created.id}`);
  };

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
        onEdit={proposta.status === 'rascunho'
          ? () => navigate(createPageUrl('CriarProposta') + `?edit=${proposta.id}`)
          : criarNovaVersao
        }
        onMarkAsAccepted={handleMarkAsAccepted}
        isUpdatingStatus={isUpdatingStatus}
      />

      {/* Botão Rentabilidade */}
      <div className="flex justify-end">
        <Button onClick={() => setShowRentabilidade(true)} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white gap-2 rounded-xl shadow-md">
          <DollarSign className="w-4 h-4" /> Simular Rentabilidade
        </Button>
      </div>

      {/* Link Público - Seção principal de ação */}
      <PropostaRevisaoLink proposta={proposta} publicLink={publicLink} />

      {/* Resumo completo da proposta */}
      <PropostaRevisaoResumo proposta={proposta} />

      {/* Histórico de Versões */}
      {versionHistory.length > 1 && (
        <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#2bc196]/10 flex items-center justify-center">
              <GitBranch className="w-4 h-4 text-[#2bc196]" />
            </div>
            <h2 className="text-base font-bold text-[#002443]">Histórico de Versões</h2>
          </div>
          <div className="space-y-2">
            {versionHistory.map(v => {
              const isCurrent = v.id === proposalId;
              const vStatus = {
                rascunho: { label: 'Rascunho', color: 'bg-slate-100 text-slate-700' },
                enviada: { label: 'Enviada', color: 'bg-yellow-100 text-yellow-700' },
                visualizada: { label: 'Visualizada', color: 'bg-orange-100 text-orange-700' },
                aceita: { label: 'Aceita', color: 'bg-green-100 text-green-700' },
                recusada: { label: 'Recusada', color: 'bg-red-100 text-red-700' },
              }[v.status] || { label: v.status, color: 'bg-slate-100 text-slate-600' };
              return (
                <div key={v.id} className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${isCurrent ? 'border-[#2bc196]/30 bg-[#2bc196]/5' : 'border-[#002443]/5 hover:bg-[#f4f4f4]'}`}>
                  <div className="w-8 h-8 rounded-lg bg-[#002443]/5 flex items-center justify-center text-sm font-bold text-[#002443]">
                    V{v.version || 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#002443]">
                      <span className="font-mono text-[#2bc196] mr-2">{v.codigo}</span>
                      {isCurrent && <span className="text-[10px] bg-[#2bc196]/20 text-[#2bc196] px-1.5 py-0.5 rounded font-bold ml-1">ATUAL</span>}
                    </p>
                    <p className="text-xs text-[#002443]/50 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {moment(v.created_date).format('DD/MM/YYYY HH:mm')}
                    </p>
                  </div>
                  <Badge className={vStatus.color}>{vStatus.label}</Badge>
                  {!isCurrent && (
                    <Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl('PropostaDetalhes') + `?id=${v.id}`)}>
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-center pb-8">
        <Button variant="outline" onClick={() => navigate(createPageUrl('GestaoPropostas'))} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Voltar para Gestão de Propostas
        </Button>
      </div>

      {/* Rentabilidade Drawer */}
      <RentabilidadeDrawer
        open={showRentabilidade}
        onClose={() => setShowRentabilidade(false)}
        proposal={proposta}
      />
    </div>
  );
}