import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Inbox, LinkIcon, ExternalLink, Calendar, Users, FileCheck, Building2, Eye } from 'lucide-react';
import CadastroGatewaySubsellersComplianceBlock from '@/components/cadastro/CadastroGatewaySubsellersComplianceBlock';

/**
 * Aba "Coletas Gateway" — só visível quando o merchant é um gateway que recebeu submissions.
 * Mostra:
 * - SubsellerInfoCollection (links de coleta gerados pra ele)
 * - SubsellerInfoSubmission (submissões recebidas via cada link)
 * - Detalhe por submission com subsellers e docs
 */

function formatCnpj(doc) {
  if (!doc) return '—';
  if (doc.length === 14) return doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  return doc;
}

function Section({ icon: Icon, title, badge, children }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-5">
      <h3 className="text-sm font-semibold text-[var(--pinbank-blue)] mb-3 flex items-center gap-2">
        <Icon className="w-4 h-4 text-[var(--pinbank-blue)]" />
        {title}
        {badge != null && <Badge className="bg-[var(--pinbank-blue)]/10 text-[var(--pinbank-blue)] text-[10px] ml-1">{badge}</Badge>}
      </h3>
      {children}
    </div>
  );
}

const STATUS_COLOR = {
  pending: 'bg-amber-100 text-amber-700',
  in_review: 'bg-blue-100 text-blue-700',
  processed: 'bg-green-100 text-green-700',
  archived: 'bg-slate-100 text-slate-600',
};

function SubmissionDetailModal({ submission, open, onOpenChange }) {
  if (!submission) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Submissão — {new Date(submission.created_date).toLocaleString('pt-BR')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-lg p-3">
            <div>
              <p className="text-[10px] text-[var(--pinbank-blue)]/50">Quem enviou</p>
              <p className="font-semibold">{submission.submitter_name || '—'}</p>
              {submission.submitter_email && <p className="text-xs">{submission.submitter_email}</p>}
            </div>
            <div>
              <p className="text-[10px] text-[var(--pinbank-blue)]/50">Status</p>
              <Badge className={`text-[10px] ${STATUS_COLOR[submission.status] || 'bg-slate-100'}`}>{submission.status}</Badge>
              {submission.reviewed_by && <p className="text-xs mt-1">Revisado por {submission.reviewed_by}</p>}
            </div>
          </div>

          {submission.review_notes && (
            <div className="bg-blue-50 border border-blue-100 rounded p-2 text-xs">
              <strong>Nota de revisão:</strong> {submission.review_notes}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-[var(--pinbank-blue)] mb-2">{submission.subsellers?.length || 0} subseller(s) submetido(s)</p>
            <div className="space-y-2">
              {(submission.subsellers || []).map((s, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-3 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px]">{s.person_type || 'PJ'}</Badge>
                    <p className="text-sm font-semibold text-[var(--pinbank-blue)]">{s.company_name || '—'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-[var(--pinbank-blue)]/70">
                    {s.cnpj && <span>CNPJ: {formatCnpj(s.cnpj)}</span>}
                    {s.cpf && <span>CPF: {s.cpf}</span>}
                    {s.cnae && <span>CNAE: {s.cnae}</span>}
                    {s.business_model && <span>Modelo: {s.business_model}</span>}
                    {s.monthly_tpv && <span>TPV: R$ {Number(s.monthly_tpv).toLocaleString('pt-BR')}</span>}
                    {s.average_ticket && <span>Ticket: R$ {Number(s.average_ticket).toLocaleString('pt-BR')}</span>}
                    {s.bank_name && <span>Banco: {s.bank_name}</span>}
                  </div>
                  {s.documents?.length > 0 && (
                    <div className="mt-1.5 pt-1.5 border-t border-slate-100">
                      <p className="text-[10px] text-[var(--pinbank-blue)]/50 mb-1">{s.documents.length} documento(s)</p>
                      <div className="flex flex-wrap gap-1">
                        {s.documents.map((d, i) => (
                          <Badge key={i} variant="outline" className="text-[9px]">
                            {d.doc_label || d.doc_type || `doc ${i + 1}`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function CadastroGatewayCollectionsTab({ merchant }) {
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const cpfCnpj = merchant?.cpfCnpj;

  const { data: collections = [], isLoading } = useQuery({
    queryKey: ['cadastro-gateway-collections', cpfCnpj],
    queryFn: () => base44.entities.SubsellerInfoCollection.filter({ gateway_cnpj: cpfCnpj }),
    enabled: !!cpfCnpj,
  });

  const collectionIds = useMemo(() => collections.map(c => c.id), [collections]);

  const { data: submissions = [] } = useQuery({
    queryKey: ['cadastro-gateway-submissions', collectionIds],
    queryFn: async () => {
      if (!collectionIds.length) return [];
      const results = await Promise.all(collectionIds.map(id => base44.entities.SubsellerInfoSubmission.filter({ collection_id: id })));
      return results.flat().sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: collectionIds.length > 0,
  });

  const submissionsByCollection = useMemo(() => {
    const map = new Map();
    submissions.forEach(s => {
      if (!map.has(s.collection_id)) map.set(s.collection_id, []);
      map.get(s.collection_id).push(s);
    });
    return map;
  }, [submissions]);

  const totalSubsellersSubmitted = useMemo(
    () => submissions.reduce((acc, s) => acc + (s.subsellers?.length || 0), 0),
    [submissions]
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-10 text-center mt-4">
        <p className="text-sm text-[var(--pinbank-blue)]/50">Carregando...</p>
      </div>
    );
  }

  if (!collections.length) {
    return (
      <div className="space-y-4 mt-4">
        <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-10 text-center">
          <Inbox className="w-10 h-10 mx-auto mb-3 text-[var(--pinbank-blue)]/20" />
          <p className="text-sm text-[var(--pinbank-blue)]/50">Nenhum link de coleta batch (Gateway) gerado para este merchant</p>
          <Link to="/GestaoSubsellerInfoLinks" className="inline-block mt-3">
            <Button variant="outline" size="sm" className="text-xs gap-2">
              <LinkIcon className="w-3.5 h-3.5" /> Ir para Gestão de Coletas
            </Button>
          </Link>
        </div>
        {/* Mesmo sem coleta Gateway, mostramos subsellers via Compliance individual */}
        <CadastroGatewaySubsellersComplianceBlock parentMerchantId={merchant?.id} />
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-4 text-center">
          <p className="text-2xl font-bold text-[var(--pinbank-blue)]">{collections.length}</p>
          <p className="text-[10px] text-[var(--pinbank-blue)]/50 uppercase tracking-wider mt-1">Links de Coleta</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-4 text-center">
          <p className="text-2xl font-bold text-[var(--pinbank-blue)]">{submissions.length}</p>
          <p className="text-[10px] text-[var(--pinbank-blue)]/50 uppercase tracking-wider mt-1">Submissões Recebidas</p>
        </div>
        <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">{totalSubsellersSubmitted}</p>
          <p className="text-[10px] text-[var(--pinbank-blue)]/50 uppercase tracking-wider mt-1">Subsellers Submetidos</p>
        </div>
      </div>

      {/* Lista de Collections com submissions aninhadas */}
      <Section icon={LinkIcon} title="Links de Coleta" badge={collections.length}>
        <div className="space-y-3">
          {collections.map(c => {
            const subs = submissionsByCollection.get(c.id) || [];
            const publicUrl = `${window.location.origin}/SubsellerInfoForm?token=${c.unique_token}`;
            return (
              <div key={c.id} className="border border-slate-200 rounded-lg overflow-hidden">
                <div className="bg-slate-50 p-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-[var(--pinbank-blue)]">{c.gateway_name}</p>
                      {!c.is_active && <Badge className="bg-red-100 text-red-700 text-[10px]">Inativo</Badge>}
                      {c.custom_slug && <Badge variant="outline" className="text-[10px]">/{c.custom_slug}</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-[var(--pinbank-blue)]/50 mt-1">
                      {c.gateway_contact_name && <span>{c.gateway_contact_name}</span>}
                      {c.gateway_contact_email && <span>· {c.gateway_contact_email}</span>}
                      <span>· Criado em {new Date(c.created_date).toLocaleDateString('pt-BR')}</span>
                      {c.expires_at && <span>· Expira em {new Date(c.expires_at).toLocaleDateString('pt-BR')}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Badge className="bg-[var(--pinbank-blue)]/10 text-[var(--pinbank-blue)] text-[10px]">
                      {subs.length} submissão{subs.length !== 1 ? 'ões' : ''}
                    </Badge>
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1">
                        <ExternalLink className="w-3 h-3" /> Abrir
                      </Button>
                    </a>
                  </div>
                </div>

                {subs.length > 0 && (
                  <div className="divide-y divide-slate-100">
                    {subs.map(s => (
                      <div key={s.id} className="px-3 py-2 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`text-[9px] ${STATUS_COLOR[s.status] || 'bg-slate-100'}`}>{s.status}</Badge>
                            <span className="text-xs text-[var(--pinbank-blue)]">{s.submitter_name || s.submitter_email || 'Anônimo'}</span>
                            <span className="text-[10px] text-[var(--pinbank-blue)]/40 flex items-center gap-1">
                              <Users className="w-3 h-3" />{s.subsellers?.length || 0} subsellers
                            </span>
                            <span className="text-[10px] text-[var(--pinbank-blue)]/40 flex items-center gap-1">
                              <FileCheck className="w-3 h-3" />
                              {(s.subsellers || []).reduce((a, x) => a + (x.documents?.length || 0), 0)} docs
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-[10px] text-[var(--pinbank-blue)]/40">{new Date(s.created_date).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1" onClick={() => setSelectedSubmission(s)}>
                            <Eye className="w-3 h-3" /> Detalhes
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Subsellers via link de Compliance individual (não-batch) */}
      <CadastroGatewaySubsellersComplianceBlock parentMerchantId={merchant?.id} />

      <SubmissionDetailModal
        submission={selectedSubmission}
        open={!!selectedSubmission}
        onOpenChange={(o) => !o && setSelectedSubmission(null)}
      />
    </div>
  );
}