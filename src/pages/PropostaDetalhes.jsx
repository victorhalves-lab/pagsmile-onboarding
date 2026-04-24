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
import ExtendValidityModal from '@/components/proposals/ExtendValidityModal';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { generatePublicSlug } from '@/lib/publicSlug';

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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const proposalId = urlParams.get('id');

  const queryClient = useQueryClient();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showRentabilidade, setShowRentabilidade] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [isExtendingValidity, setIsExtendingValidity] = useState(false);

  const handleExtendValidity = async (newValidUntilIso) => {
    if (!proposta || !newValidUntilIso) return;
    setIsExtendingValidity(true);
    const now = new Date().toISOString();
    const wasExpired = proposta.status === 'expirada';

    // Se a proposta estava expirada, reabre para 'enviada' — assim o cliente
    // pode aceitar normalmente e o pipeline comercial reflete a reativação.
    const update = { validUntil: newValidUntilIso };
    if (wasExpired) update.status = 'enviada';

    try {
      await base44.entities.Proposal.update(proposta.id, update);

      let changedBy = 'admin';
      try { const u = await base44.auth.me(); changedBy = u?.email || 'admin'; } catch {}

      await base44.entities.AuditLog.create({
        entityName: 'Proposal', entityId: proposta.id, actionType: 'UPDATE',
        actionDescription: `Validade da proposta ${proposta.codigo} estendida para ${moment(newValidUntilIso).format('DD/MM/YYYY')} por ${changedBy}${wasExpired ? ' (reativada de expirada)' : ''}`,
        changedBy, changeDate: now,
        details: {
          validadeAnterior: proposta.validUntil || null,
          validadeNova: newValidUntilIso,
          statusAnterior: proposta.status,
          statusNovo: update.status || proposta.status,
          reativada: wasExpired,
        },
      });

      if (proposta.leadId) {
        try {
          await base44.entities.LeadActivity.create({
            leadId: proposta.leadId,
            activityType: 'nota_adicionada',
            description: `Validade da proposta ${proposta.codigo} estendida até ${moment(newValidUntilIso).format('DD/MM/YYYY')}${wasExpired ? ' (proposta reativada)' : ''}`,
            performedBy: changedBy,
            activityDate: now,
          });
        } catch {}
      }

      queryClient.invalidateQueries({ queryKey: ['proposta-detalhes', proposalId] });
      queryClient.invalidateQueries({ queryKey: ['propostas'] });
      toast.success(wasExpired ? 'Proposta reativada e validade estendida!' : 'Validade atualizada com sucesso!');
      setShowExtendModal(false);
    } catch (e) {
      toast.error('Falha ao estender validade: ' + (e?.message || 'erro desconhecido'));
    } finally {
      setIsExtendingValidity(false);
    }
  };

  const handleMarkAsAccepted = async () => {
    if (!proposta) return;
    setIsUpdatingStatus(true);
    const now = new Date().toISOString();

    // FIX BUG #2: auto-link Lead by CNPJ if leadId is missing, so the Lead's
    // status also transitions to "proposta_aceita" (otherwise it stays in
    // "questionario_preenchido" → comercial sees "Gerar Proposta" wrongly).
    let resolvedLeadId = proposta.leadId || '';
    const cnpj = (proposta.clienteCnpj || '').replace(/\D/g, '');
    if (!resolvedLeadId && cnpj.length === 14) {
      try {
        const leads = await base44.entities.Lead.filter({ cpfCnpj: cnpj });
        if (leads.length > 0) resolvedLeadId = leads[0].id;
      } catch {}
    }

    const proposalUpdate = { status: 'aceita', acceptedDate: now };
    if (resolvedLeadId && !proposta.leadId) proposalUpdate.leadId = resolvedLeadId;
    await base44.entities.Proposal.update(proposta.id, proposalUpdate);

    let changedBy = 'admin';
    try { const user = await base44.auth.me(); changedBy = user?.email || 'admin'; } catch {}
    await base44.entities.AuditLog.create({
      entityName: 'Proposal', entityId: proposta.id, actionType: 'UPDATE',
      actionDescription: `Proposta ${proposta.codigo} marcada como aceita manualmente por ${changedBy}`,
      changedBy, changeDate: now,
      details: { statusAnterior: proposta.status, statusNovo: 'aceita', acaoManual: true, leadAutoLinked: !proposta.leadId && !!resolvedLeadId },
    });
    if (resolvedLeadId) {
      try {
        await base44.entities.Lead.update(resolvedLeadId, { status: 'proposta_aceita', lastInteractionDate: now, currentProposalId: proposta.id });
        await base44.entities.LeadActivity.create({ leadId: resolvedLeadId, activityType: 'proposta_aceita', description: `Proposta ${proposta.codigo} aceita (manualmente por ${changedBy})`, performedBy: changedBy, activityDate: now });
      } catch {}
    }
    queryClient.invalidateQueries({ queryKey: ['proposta-detalhes', proposalId] });
    queryClient.invalidateQueries({ queryKey: ['propostas'] });
    toast.success(t('pd.accepted_success'));
    setIsUpdatingStatus(false);
  };

  const { data: proposta, isLoading } = useQuery({
    queryKey: ['proposta-detalhes', proposalId],
    queryFn: () => base44.entities.Proposal.filter({ id: proposalId }),
    enabled: !!proposalId,
    select: (data) => data?.[0],
  });

  // ─── Auto-backfill publicSlug for legacy proposals ───
  // If the proposal doesn't have a slug (created before the auto-slug automation
  // or the automation failed silently), generate one now. This runs once per
  // proposal without one and persists it, so every subsequent link is friendly.
  useEffect(() => {
    if (!proposta || proposta.publicSlug || proposta.status === 'rascunho') return;
    const companyName = proposta.clienteNome || proposta.proposalName || 'proposta';
    const slug = generatePublicSlug(companyName);
    base44.entities.Proposal.update(proposta.id, { publicSlug: slug })
      .then(() => queryClient.invalidateQueries({ queryKey: ['proposta-detalhes', proposalId] }))
      .catch((err) => console.warn('Falha ao gerar slug público:', err));
  }, [proposta, proposalId, queryClient]);

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
    // Each version gets its OWN unique token and slug (auto-generated on create).
    // All old links remain active — the public resolver always finds the current
    // version via rootProposalId + isCurrentVersion=true.
    const { id, created_date, updated_date, created_by, tokenPublico, publicLinkCode, publicSlug, sentDate, acceptedDate, rejectedDate, rejectedReason, counterProposalDetails, ...dataToCopy } = proposta;
    const newVersion = (proposta.version || 1) + 1;

    // FIX BUG #4: if the root proposal was created without leadId, auto-resolve
    // by CNPJ so new versions are properly linked to the pipeline.
    let resolvedLeadId = dataToCopy.leadId || '';
    const cnpj = (dataToCopy.clienteCnpj || '').replace(/\D/g, '');
    if (!resolvedLeadId && cnpj.length === 14) {
      try {
        const leads = await base44.entities.Lead.filter({ cpfCnpj: cnpj });
        if (leads.length > 0) resolvedLeadId = leads[0].id;
      } catch {}
    }

    const newProposta = {
      ...dataToCopy,
      leadId: resolvedLeadId,
      codigo: `PROP-${year}-${seq}`,
      status: 'rascunho',
      version: newVersion,
      previousVersionId: proposta.id,
      rootProposalId: rootId,
      isCurrentVersion: true,
    };

    const created = await base44.entities.Proposal.create(newProposta);
    await base44.entities.Proposal.update(proposta.id, { isCurrentVersion: false });

    // Audit trail: record who created the new version
    let performedBy = 'admin';
    try { const user = await base44.auth.me(); performedBy = user?.email || 'admin'; } catch {}
    const now = new Date().toISOString();
    try {
      await base44.entities.AuditLog.create({
        entityName: 'Proposal', entityId: created.id, actionType: 'CREATE',
        actionDescription: `Nova versão V${newVersion} da proposta ${proposta.codigo} criada por ${performedBy}`,
        changedBy: performedBy, changeDate: now,
        details: { previousProposalId: proposta.id, rootProposalId: rootId, version: newVersion },
      });
      if (resolvedLeadId) {
        await base44.entities.LeadActivity.create({
          leadId: resolvedLeadId, activityType: 'proposta_criada',
          description: `Nova versão V${newVersion} criada (${created.codigo}) a partir de ${proposta.codigo}`,
          performedBy, activityDate: now,
          details: { proposalId: created.id, previousProposalId: proposta.id, version: newVersion },
        });
      }
    } catch (e) { console.warn('Falha ao registrar auditoria de nova versão:', e); }

    queryClient.invalidateQueries({ queryKey: ['propostas'] });
    queryClient.invalidateQueries({ queryKey: ['lead-activities', resolvedLeadId] });
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
        <p className="text-[#002443]/60">{t('pd.not_found')}</p>
        <Button variant="link" onClick={() => navigate(createPageUrl('GestaoPropostas'))} className="mt-2">
          {t('pd.back_proposals')}
        </Button>
      </div>
    );
  }

  const sCfg = STATUS_CONFIG[proposta.status] || STATUS_CONFIG.rascunho;
  
  // Use the root proposal's token for a stable public link
  const stableToken = (() => {
    if (!proposta.rootProposalId || !versionHistory.length) return proposta.tokenPublico;
    const root = versionHistory.find(v => v.id === proposta.rootProposalId);
    return root?.tokenPublico || proposta.tokenPublico;
  })();
  const publicLink = proposta.publicSlug
    ? `${window.location.origin}/p/${proposta.publicSlug}`
    : stableToken
    ? `${window.location.origin}${createPageUrl('PropostaPublica')}?token=${stableToken}`
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
        onExtendValidity={() => setShowExtendModal(true)}
        isExtendingValidity={isExtendingValidity}
      />

      {/* Botão Rentabilidade */}
      <div className="flex justify-end">
        <Button onClick={() => setShowRentabilidade(true)} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white gap-2 rounded-xl shadow-md">
          <DollarSign className="w-4 h-4" /> {t('pd.simulate_profitability')}
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
            <h2 className="text-base font-bold text-[#002443]">{t('pd.version_history')}</h2>
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
                      {isCurrent && <span className="text-[10px] bg-[#2bc196]/20 text-[#2bc196] px-1.5 py-0.5 rounded font-bold ml-1">{t('pd.current')}</span>}
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
          <ArrowLeft className="w-4 h-4" /> {t('pd.back_proposals')}
        </Button>
      </div>

      {/* Rentabilidade Drawer */}
      <RentabilidadeDrawer
        open={showRentabilidade}
        onClose={() => setShowRentabilidade(false)}
        proposal={proposta}
      />

      {/* Modal para estender validade */}
      <ExtendValidityModal
        open={showExtendModal}
        onClose={() => setShowExtendModal(false)}
        proposta={proposta}
        onConfirm={handleExtendValidity}
        isPending={isExtendingValidity}
      />
    </div>
  );
}