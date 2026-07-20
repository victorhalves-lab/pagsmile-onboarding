import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, CreditCard, Zap, Layers, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import CadastroPropostaTab from './CadastroPropostaTab';

const STATUS_COLORS = {
  rascunho: 'bg-gray-100 text-gray-700',
  ativa: 'bg-green-100 text-green-700',
  inativa: 'bg-slate-200 text-slate-600',
  enviada: 'bg-blue-100 text-blue-700',
  visualizada: 'bg-indigo-100 text-indigo-700',
  aceita: 'bg-green-100 text-green-700',
  recusada: 'bg-red-100 text-red-700',
  contraproposta: 'bg-amber-100 text-amber-700',
  expirada: 'bg-gray-100 text-gray-500',
  cancelada: 'bg-red-100 text-red-700',
};

function MiniProposalCard({ p, type, viewPath }) {
  const sc = STATUS_COLORS[p.status] || STATUS_COLORS['rascunho'];
  const icon = type === 'pix' ? <Zap className="w-4 h-4 text-emerald-600" />
             : type === 'standard' ? <Layers className="w-4 h-4 text-indigo-600" />
             : <CreditCard className="w-4 h-4 text-blue-600" />;
  return (
    <div className="p-3 bg-white rounded-lg border border-[var(--pinbank-blue)]/8 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-bold text-[var(--pinbank-blue)]">{p.codigo || p.templateName || 'Proposta'}</span>
          <Badge className={`text-[10px] ${sc}`}>{p.status}</Badge>
          {p.version > 1 && <Badge variant="outline" className="text-[10px]">v{p.version}</Badge>}
          {p.isDefaultForSegment && <Badge className="bg-amber-100 text-amber-700 text-[10px]">Padrão Segmento</Badge>}
        </div>
        <p className="text-[10px] text-[var(--pinbank-blue)]/40 mt-0.5">
          {p.clienteNome || '—'}
          {p.created_date && ` • ${new Date(p.created_date).toLocaleDateString('pt-BR')}`}
          {p.segment && ` • ${p.segment}`}
        </p>
      </div>
      {p.tokenPublico && viewPath && (
        <Link to={`${viewPath}?token=${p.tokenPublico}`} target="_blank">
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <ExternalLink className="w-3 h-3" /> Ver
          </Button>
        </Link>
      )}
    </div>
  );
}

export default function CadastroAllProposalsTab({ proposals: cartaoProposals = [], lead, allLeads = [], merchant }) {
  const allLeadIds = useMemo(() => allLeads.map(l => l.id), [allLeads]);
  const cnpj = merchant?.cpfCnpj;

  // PIX Proposals
  const { data: pixByLeads = [] } = useQuery({
    queryKey: ['cadastro-pix-leads', allLeadIds],
    queryFn: async () => {
      if (!allLeadIds.length) return [];
      const r = await Promise.all(allLeadIds.map(id => base44.entities.PixProposal.filter({ leadId: id })));
      return r.flat();
    },
    enabled: allLeadIds.length > 0,
  });

  // Standard Proposals (by clienteCnpj and clienteEmail)
  const { data: stdByCnpj = [] } = useQuery({
    queryKey: ['cadastro-std-cnpj', cnpj],
    queryFn: () => base44.entities.StandardProposal.filter({ clienteCnpj: cnpj }),
    enabled: !!cnpj,
  });

  const { data: stdByEmail = [] } = useQuery({
    queryKey: ['cadastro-std-email', merchant?.email],
    queryFn: () => base44.entities.StandardProposal.filter({ clienteEmail: merchant.email }),
    enabled: !!merchant?.email,
  });

  const pixProposals = useMemo(() => {
    const map = new Map();
    pixByLeads.forEach(p => map.set(p.id, p));
    return Array.from(map.values()).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [pixByLeads]);

  const stdProposals = useMemo(() => {
    const map = new Map();
    [...stdByCnpj, ...stdByEmail].forEach(p => map.set(p.id, p));
    return Array.from(map.values()).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [stdByCnpj, stdByEmail]);

  const totalCount = cartaoProposals.length + pixProposals.length + stdProposals.length;

  if (totalCount === 0) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-10 text-center mt-4">
        <FileText className="w-10 h-10 mx-auto mb-3 text-[var(--pinbank-blue)]/20" />
        <p className="text-sm text-[var(--pinbank-blue)]/50">Nenhuma proposta encontrada para este cliente</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Resumo geral */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-blue-50 rounded-lg text-center">
          <CreditCard className="w-4 h-4 text-blue-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-blue-700">{cartaoProposals.length}</p>
          <p className="text-[10px] text-[var(--pinbank-blue)]/50">Propostas Cartão</p>
        </div>
        <div className="p-3 bg-emerald-50 rounded-lg text-center">
          <Zap className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-emerald-700">{pixProposals.length}</p>
          <p className="text-[10px] text-[var(--pinbank-blue)]/50">Propostas PIX</p>
        </div>
        <div className="p-3 bg-indigo-50 rounded-lg text-center">
          <Layers className="w-4 h-4 text-indigo-600 mx-auto mb-1" />
          <p className="text-xl font-bold text-indigo-700">{stdProposals.length}</p>
          <p className="text-[10px] text-[var(--pinbank-blue)]/50">Propostas Padrão</p>
        </div>
      </div>

      {/* Propostas de Cartão (com taxas detalhadas) */}
      {cartaoProposals.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--pinbank-blue)] mb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" /> Propostas de Cartão ({cartaoProposals.length})
          </h3>
          <CadastroPropostaTab proposals={cartaoProposals} lead={lead} />
        </div>
      )}

      {/* PIX */}
      {pixProposals.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--pinbank-blue)] mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-600" /> Propostas PIX ({pixProposals.length})
          </h3>
          <div className="space-y-2">
            {pixProposals.map(p => <MiniProposalCard key={p.id} p={p} type="pix" viewPath="/PropostaPixPublica" />)}
          </div>
        </div>
      )}

      {/* Standard */}
      {stdProposals.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--pinbank-blue)] mb-2 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" /> Propostas Padrão ({stdProposals.length})
          </h3>
          <div className="space-y-2">
            {stdProposals.map(p => <MiniProposalCard key={p.id} p={p} type="standard" viewPath="/PropostaPadraoPublica" />)}
          </div>
        </div>
      )}
    </div>
  );
}