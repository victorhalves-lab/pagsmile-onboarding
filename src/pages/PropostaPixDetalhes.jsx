import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft, Pencil, Loader2, FileText, Eye, GitBranch, Clock,
  Link2, Copy, Check, ExternalLink, CheckCircle, Send, XCircle,
  Calendar, Building2, Banknote, Shield
} from 'lucide-react';
import { toast } from 'sonner';
import moment from 'moment';
import { useTranslation } from '@/lib/i18n/LanguageContext';

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

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-[#2bc196]/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-[#2bc196]" />
        </div>
        <h2 className="text-base font-bold text-[#002443]">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value, prefix, suffix }) {
  if (value === undefined || value === null || value === '' || value === 0) return null;
  let display = value;
  if (typeof value === 'number') {
    display = prefix === 'R$'
      ? `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      : suffix === '%' ? `${String(value).replace('.', ',')}%` : value;
  }
  return (
    <div className="flex justify-between items-center py-2 border-b border-[#002443]/5 last:border-0">
      <span className="text-xs text-[#002443]/60 font-medium">{label}</span>
      <span className="text-sm font-semibold text-[#002443]">{display}</span>
    </div>
  );
}

export default function PropostaPixDetalhes() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const proposalId = urlParams.get('id');
  const queryClient = useQueryClient();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: proposta, isLoading } = useQuery({
    queryKey: ['pix-proposta-detalhes', proposalId],
    queryFn: () => base44.entities.PixProposal.filter({ id: proposalId }),
    enabled: !!proposalId,
    select: (data) => data?.[0],
  });

  const rootId = proposta?.rootProposalId || proposta?.id;
  const { data: versionHistory = [] } = useQuery({
    queryKey: ['pix-proposal-versions', rootId],
    queryFn: async () => {
      if (!rootId) return [];
      const [byRoot, root] = await Promise.all([
        base44.entities.PixProposal.filter({ rootProposalId: rootId }),
        base44.entities.PixProposal.filter({ id: rootId }),
      ]);
      const all = [...root, ...byRoot];
      const unique = Array.from(new Map(all.map(p => [p.id, p])).values());
      return unique.sort((a, b) => (a.version || 1) - (b.version || 1));
    },
    enabled: !!proposta && !!(proposta.rootProposalId || proposta.previousVersionId),
  });

  const handleMarkAsAccepted = async () => {
    if (!proposta) return;
    setIsUpdatingStatus(true);
    const now = new Date().toISOString();
    await base44.entities.PixProposal.update(proposta.id, { status: 'aceita', acceptedDate: now });
    let changedBy = 'admin';
    try { const user = await base44.auth.me(); changedBy = user?.email || 'admin'; } catch {}
    await base44.entities.AuditLog.create({
      entityName: 'PixProposal', entityId: proposta.id, actionType: 'UPDATE',
      actionDescription: `Proposta PIX ${proposta.codigo} marcada como aceita manualmente por ${changedBy}`,
      changedBy, changeDate: now, details: { statusAnterior: proposta.status, statusNovo: 'aceita' },
    });
    if (proposta.leadId) {
      await base44.entities.Lead.update(proposta.leadId, { status: 'proposta_aceita', lastInteractionDate: now });
    }
    queryClient.invalidateQueries({ queryKey: ['pix-proposta-detalhes', proposalId] });
    toast.success(t('pxd.accepted_success'));
    setIsUpdatingStatus(false);
  };

  const criarNovaVersao = async () => {
    const seq = String(Math.floor(Math.random() * 99999)).padStart(5, '0');
    const { id, created_date, updated_date, created_by, tokenPublico, sentDate, acceptedDate, rejectedDate, rejectedReason, counterProposalDetails, ...dataToCopy } = proposta;
    const newVersion = (proposta.version || 1) + 1;
    const newProposta = {
      ...dataToCopy, codigo: `PIX-${new Date().getFullYear()}-${seq}`, status: 'rascunho',
      tokenPublico: Array.from({ length: 64 }, () => 'abcdefghijklmnopqrstuvwxyz0123456789'.charAt(Math.floor(Math.random() * 36))).join(''),
      version: newVersion, previousVersionId: proposta.id, rootProposalId: rootId, isCurrentVersion: true,
    };
    const created = await base44.entities.PixProposal.create(newProposta);
    await base44.entities.PixProposal.update(proposta.id, { isCurrentVersion: false });
    toast.success(`Nova versão V${newVersion} criada!`);
    navigate(`/CriarPropostaPix?edit=${created.id}`);
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" /></div>;

  if (!proposta) {
    return (
      <div className="text-center py-20">
        <FileText className="w-12 h-12 mx-auto text-[#002443]/20 mb-4" />
        <p className="text-[#002443]/60">{t('pxd.not_found')}</p>
        <Button variant="link" onClick={() => navigate('/GestaoPropostasPix')} className="mt-2">{t('spd.back')}</Button>
      </div>
    );
  }

  const sCfg = STATUS_CONFIG[proposta.status] || STATUS_CONFIG.rascunho;
  const publicLink = proposta.publicSlug
    ? `${window.location.origin}/pix/${proposta.publicSlug}`
    : proposta.tokenPublico
    ? `${window.location.origin}/PropostaPixPublica?token=${proposta.tokenPublico}`
    : null;
  const rates = proposta.rates || {};
  const isRascunho = proposta.status === 'rascunho';
  const canEdit = ['rascunho', 'enviada', 'visualizada'].includes(proposta.status);

  const handleCopy = () => {
    if (!publicLink) return;
    navigator.clipboard.writeText(publicLink);
    setCopied(true);
    toast.success(t('spd.link_copied'));
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/GestaoPropostasPix')} className="text-white/70 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold text-white">{proposta.codigo || 'Proposta PIX'}</h1>
              <Badge className={sCfg.color}>{sCfg.label}</Badge>
              <Badge className="bg-cyan-100 text-cyan-700 border-0">PIX</Badge>
              {(proposta.version || 1) > 1 && (
                <span className="text-[10px] bg-[#2bc196]/20 text-[#5cf7cf] px-2 py-0.5 rounded-md font-bold">v{proposta.version}</span>
              )}
            </div>
            <p className="text-white/50 text-sm mt-1">{proposta.clienteNome || t('pxd.no_client')} — {t('pxd.internal_review')}</p>
          </div>
          <div className="flex items-center gap-2">
            {['enviada', 'visualizada'].includes(proposta.status) && (
              <Button onClick={handleMarkAsAccepted} disabled={isUpdatingStatus} className="bg-green-500 hover:bg-green-600 text-white gap-2 rounded-xl">
                <CheckCircle className="w-4 h-4" /> {isUpdatingStatus ? t('pxd.updating') : t('pxd.mark_accepted')}
              </Button>
            )}
            {canEdit && (
              <Button onClick={isRascunho ? () => navigate(`/CriarPropostaPix?edit=${proposta.id}`) : criarNovaVersao}
                className="bg-white/10 hover:bg-white/20 text-white gap-2 rounded-xl">
                {isRascunho ? <Pencil className="w-4 h-4" /> : <GitBranch className="w-4 h-4" />}
                {isRascunho ? t('spd.edit') : t('pxd.new_version')}
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-6 text-xs mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-white/40" /><span className="text-white/50">{t('pxd.created')}:</span><span className="font-semibold text-white">{moment(proposta.created_date).format('DD/MM/YYYY HH:mm')}</span></div>
          {proposta.acceptedDate && <div className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5 text-green-400" /><span className="text-white/50">{t('pxd.accepted')}:</span><span className="font-semibold text-white">{moment(proposta.acceptedDate).format('DD/MM/YYYY HH:mm')}</span></div>}
          {proposta.rejectedDate && <div className="flex items-center gap-2"><XCircle className="w-3.5 h-3.5 text-red-400" /><span className="text-white/50">{t('pxd.rejected')}:</span><span className="font-semibold text-white">{moment(proposta.rejectedDate).format('DD/MM/YYYY HH:mm')}</span></div>}
          {proposta.validUntil && <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 text-amber-400" /><span className="text-white/50">{t('pxd.validity')}:</span><span className="font-semibold text-white">{moment(proposta.validUntil).format('DD/MM/YYYY')}</span></div>}
        </div>
      </div>

      {/* Link Público */}
      {isRascunho ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Link2 className="w-5 h-5 text-amber-600" /></div>
            <div>
              <h2 className="text-base font-bold text-[#002443]">{t('pxd.link_unavailable')}</h2>
              <p className="text-sm text-[#002443]/60">{t('pxd.generate_for_link')}</p>
            </div>
          </div>
        </div>
      ) : publicLink && (
        <div className="bg-white rounded-2xl border border-[#2bc196]/30 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#2bc196]/10 flex items-center justify-center"><Link2 className="w-5 h-5 text-[#2bc196]" /></div>
            <div>
              <h2 className="text-base font-bold text-[#002443]">{t('pxd.client_link')}</h2>
              <p className="text-sm text-[#002443]/60">{t('pxd.copy_send')}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#f4f4f4] rounded-xl p-3 mb-4">
            <code className="flex-1 text-sm text-[#002443]/70 truncate select-all font-mono">{publicLink}</code>
            <Button onClick={handleCopy} size="sm" className={`gap-2 rounded-lg shrink-0 ${copied ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-[#2bc196] hover:bg-[#2bc196]/90 text-white'}`}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? t('spd.copied') : t('spd.copy_link')}
            </Button>
          </div>
          <a href={publicLink} target="_blank" rel="noopener noreferrer">
            <Button variant="outline" size="sm" className="gap-2"><ExternalLink className="w-4 h-4" /> {t('spd.open_page')}</Button>
          </a>
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section icon={Building2} title={t('pxd.client_data')}>
          <InfoRow label={t('pxd.company_name')} value={proposta.clienteNome} />
          <InfoRow label="CNPJ" value={proposta.clienteCnpj} />
          <InfoRow label={t('spp.contact')} value={proposta.clienteContato} />
          <InfoRow label="MCC" value={proposta.clienteMcc} />
          <InfoRow label={t('pxd.responsible')} value={proposta.responsavelNome} />
        </Section>

        <Section icon={Banknote} title={t('pxd.pix_rate')}>
          <InfoRow label={t('pxd.type')} value={rates.pix?.tipo === 'percentual' ? t('pxd.type_pct') : t('pxd.type_fixed')} />
          <InfoRow label={t('pxd.value')} value={rates.pix?.valor} prefix={rates.pix?.tipo === 'fixo' ? 'R$' : undefined} suffix={rates.pix?.tipo === 'percentual' ? '%' : undefined} />
          {rates.minimoGarantido && (
            <>
              <div className="pt-2 mt-2 border-t border-[#002443]/5">
                <p className="text-[10px] font-bold text-[#002443]/40 uppercase tracking-wider mb-2">{t('pxd.min_tpv_monthly')}</p>
              </div>
              <InfoRow label={t('pp.month1')} value={rates.minimoGarantido.mes1} prefix="R$" />
              <InfoRow label={t('pp.month2')} value={rates.minimoGarantido.mes2} prefix="R$" />
              <InfoRow label={t('pp.month3_plus')} value={rates.minimoGarantido.mes3} prefix="R$" />
            </>
          )}
        </Section>
      </div>

      {/* Motivo de recusa */}
      {proposta.rejectedReason && (
        <Section icon={XCircle} title={t('pxd.rejection_reason')}>
          <p className="text-sm text-red-600 whitespace-pre-wrap">{proposta.rejectedReason}</p>
        </Section>
      )}

      {/* Versões */}
      {versionHistory.length > 1 && (
        <Section icon={GitBranch} title={t('pd.version_history')}>
          <div className="space-y-2">
            {versionHistory.map(v => {
              const isCurrent = v.id === proposalId;
              const vStatus = STATUS_CONFIG[v.status] || { label: v.status, color: 'bg-slate-100 text-slate-600' };
              return (
                <div key={v.id} className={`flex items-center gap-4 p-3 rounded-xl border transition-colors ${isCurrent ? 'border-[#2bc196]/30 bg-[#2bc196]/5' : 'border-[#002443]/5 hover:bg-[#f4f4f4]'}`}>
                  <div className="w-8 h-8 rounded-lg bg-[#002443]/5 flex items-center justify-center text-sm font-bold text-[#002443]">V{v.version || 1}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#002443]">
                      <span className="font-mono text-[#2bc196] mr-2">{v.codigo}</span>
                      {isCurrent && <span className="text-[10px] bg-[#2bc196]/20 text-[#2bc196] px-1.5 py-0.5 rounded font-bold ml-1">{t('pd.current')}</span>}
                    </p>
                    <p className="text-xs text-[#002443]/50 flex items-center gap-1"><Clock className="w-3 h-3" />{moment(v.created_date).format('DD/MM/YYYY HH:mm')}</p>
                  </div>
                  <Badge className={vStatus.color}>{vStatus.label}</Badge>
                  {!isCurrent && <Button variant="ghost" size="sm" onClick={() => navigate(`/PropostaPixDetalhes?id=${v.id}`)}><Eye className="w-4 h-4" /></Button>}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <div className="flex justify-center pb-8">
        <Button variant="outline" onClick={() => navigate('/GestaoPropostasPix')} className="gap-2"><ArrowLeft className="w-4 h-4" /> Voltar</Button>
      </div>
    </div>
  );
}