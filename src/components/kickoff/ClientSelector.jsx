import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Building2, FileText, Check, Search, ShieldCheck, ShieldAlert, ShieldX, Clock } from 'lucide-react';

const PROPOSAL_STATUS_LABEL = {
  rascunho: 'Rascunho', enviada: 'Enviada', visualizada: 'Visualizada',
  aceita: 'Aceita', recusada: 'Recusada', contraproposta: 'Contraproposta',
  expirada: 'Expirada', cancelada: 'Cancelada',
};

const cleanDoc = (d) => (d || '').replace(/\D/g, '');

// Badge de compliance — fonte única de verdade visual
function ComplianceBadge({ status }) {
  if (status === 'Aprovado') {
    return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] gap-1"><ShieldCheck className="w-3 h-3" /> Compliance Aprovado</Badge>;
  }
  if (status === 'Manual') {
    return <Badge className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] gap-1"><ShieldAlert className="w-3 h-3" /> Revisão Manual</Badge>;
  }
  if (status === 'Recusado') {
    return <Badge className="bg-red-50 text-red-700 border-red-200 text-[10px] gap-1"><ShieldX className="w-3 h-3" /> Compliance Recusado</Badge>;
  }
  return <Badge className="bg-slate-50 text-slate-600 border-slate-200 text-[10px] gap-1"><Clock className="w-3 h-3" /> Compliance Pendente</Badge>;
}

export default function ClientSelector({ onSelect }) {
  const [search, setSearch] = useState('');
  const [complianceFilter, setComplianceFilter] = useState('aprovado'); // aprovado | aceitos_sem_aprovacao | todos

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['kickoff-candidates-v2'],
    queryFn: async () => {
      // 1) Busca em paralelo as 3 fontes de propostas aceitas
      const [proposals, stdProposals, pixProposals] = await Promise.all([
        base44.entities.Proposal.filter({ status: 'aceita' }, '-updated_date', 300),
        base44.entities.StandardProposal.filter({ status: 'aceita' }, '-updated_date', 200).catch(() => []),
        base44.entities.PixProposal.filter({ status: 'aceita' }, '-updated_date', 200).catch(() => []),
      ]);

      // 2) Normaliza propostas em formato unificado
      const allProposals = [
        ...proposals.map(p => ({ ...p, _source: 'Proposal' })),
        ...stdProposals.map(p => ({
          ...p, _source: 'StandardProposal',
          clienteNome: p.clienteNome || p.templateName, codigo: p.codigo,
          businessSubCategory: p.businessSubCategory,
        })),
        ...pixProposals.map(p => ({ ...p, _source: 'PixProposal' })),
      ];

      // 3) Coleta documentos únicos para buscar merchants
      const docs = [...new Set(allProposals.map(p => cleanDoc(p.clienteCnpj)).filter(d => d.length >= 11))];
      if (docs.length === 0) return [];

      // 4) Busca merchants pelos documentos (em lotes para evitar URL gigante)
      const merchants = [];
      for (let i = 0; i < docs.length; i += 50) {
        const batch = docs.slice(i, i + 50);
        const found = await base44.entities.Merchant.filter({ cpfCnpj: { $in: batch } }, '-created_date', 500).catch(() => []);
        merchants.push(...found);
      }
      const merchantByDoc = new Map(merchants.map(m => [cleanDoc(m.cpfCnpj), m]));

      // 5) Busca OnboardingCases dos merchants encontrados
      const merchantIds = merchants.map(m => m.id);
      const cases = [];
      for (let i = 0; i < merchantIds.length; i += 50) {
        const batch = merchantIds.slice(i, i + 50);
        const found = await base44.entities.OnboardingCase.filter({ merchantId: { $in: batch } }, '-updated_date', 500).catch(() => []);
        cases.push(...found);
      }
      // Pega o caso mais recente por merchant
      const caseByMerchantId = new Map();
      for (const c of cases) {
        if (!caseByMerchantId.has(c.merchantId)) caseByMerchantId.set(c.merchantId, c);
      }

      // 6) Busca contratos por proposalId (lote) + fallback por CNPJ
      const proposalIds = allProposals.map(p => p.id).filter(Boolean);
      const contracts = [];
      for (let i = 0; i < proposalIds.length; i += 50) {
        const batch = proposalIds.slice(i, i + 50);
        const found = await base44.entities.Contract.filter({ proposalId: { $in: batch } }, '-created_date', 500).catch(() => []);
        contracts.push(...found);
      }
      const contractByProposalId = new Map(contracts.map(c => [c.proposalId, c]));
      const contractByCnpj = new Map(contracts.map(c => [cleanDoc(c.clientCnpj || c.clientDocument), c]));

      // 7) Deduplicação por CNPJ — prefere a proposta mais recente
      const byDoc = new Map();
      for (const p of allProposals) {
        const doc = cleanDoc(p.clienteCnpj);
        if (!doc) continue;
        const existing = byDoc.get(doc);
        if (!existing || new Date(p.updated_date) > new Date(existing.updated_date)) {
          byDoc.set(doc, p);
        }
      }

      // 8) Enriquece cada candidato com merchant + onboardingCase + contract
      return Array.from(byDoc.values()).map(proposal => {
        const doc = cleanDoc(proposal.clienteCnpj);
        const merchant = merchantByDoc.get(doc) || null;
        const onboardingCase = merchant ? caseByMerchantId.get(merchant.id) : null;
        const contract = contractByProposalId.get(proposal.id) || contractByCnpj.get(doc) || null;
        return {
          proposal,
          contract,
          merchant,
          complianceStatus: onboardingCase?.status || 'Pendente', // Aprovado | Manual | Recusado | Pendente
        };
      });
    },
  });

  // 9) Filtros: compliance + busca textual
  const filtered = useMemo(() => {
    return candidates.filter(c => {
      // filtro de compliance
      if (complianceFilter === 'aprovado' && c.complianceStatus !== 'Aprovado') return false;
      if (complianceFilter === 'aceitos_sem_aprovacao' && c.complianceStatus === 'Aprovado') return false;

      // busca textual
      if (!search) return true;
      const q = search.toLowerCase();
      return (
        (c.proposal.clienteNome || '').toLowerCase().includes(q) ||
        (c.proposal.clienteCnpj || '').includes(search) ||
        (c.proposal.codigo || '').toLowerCase().includes(q)
      );
    });
  }, [candidates, complianceFilter, search]);

  // contadores para o dropdown
  const counts = useMemo(() => ({
    aprovado: candidates.filter(c => c.complianceStatus === 'Aprovado').length,
    aceitos_sem_aprovacao: candidates.filter(c => c.complianceStatus !== 'Aprovado').length,
    todos: candidates.length,
  }), [candidates]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-[#2bc196]/10 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-[#2bc196]" />
        </div>
        <h1 className="text-2xl font-bold text-[#002443] mb-2">Selecione o Cliente</h1>
        <p className="text-sm text-[#002443]/50">Clientes com proposta aceita e compliance aprovado prontos para Kick-Off</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/40" />
          <Input
            placeholder="Buscar por nome, CNPJ ou código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={complianceFilter} onValueChange={setComplianceFilter}>
          <SelectTrigger className="w-full sm:w-64 rounded-xl">
            <SelectValue placeholder="Filtro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="aprovado">Aprovados no compliance ({counts.aprovado})</SelectItem>
            <SelectItem value="aceitos_sem_aprovacao">Aceitos sem compliance aprovado ({counts.aceitos_sem_aprovacao})</SelectItem>
            <SelectItem value="todos">Todos os aceitos ({counts.todos})</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-[#2bc196] mb-3" />
          <p className="text-sm text-[#002443]/40">Carregando propostas e compliance...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-[#002443]/40 text-sm">
          {search
            ? 'Nenhum cliente corresponde à busca.'
            : complianceFilter === 'aprovado'
              ? 'Nenhum cliente com proposta aceita e compliance aprovado no momento.'
              : 'Nenhum cliente encontrado para este filtro.'}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-[#002443]/50 font-medium">{filtered.length} cliente(s)</p>
          {filtered.map(({ proposal, contract, complianceStatus }, i) => {
            const propStatusLabel = PROPOSAL_STATUS_LABEL[proposal.status] || proposal.status;
            return (
              <button
                key={proposal.id || i}
                onClick={() => onSelect({ proposal, contract })}
                className="w-full text-left p-4 bg-white rounded-xl border border-[#002443]/8 hover:border-[#2bc196] hover:shadow-md transition-all group"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-[#002443]/5 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-[#002443]/40" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#002443] truncate">{proposal.clienteNome || 'Sem nome'}</p>
                      <p className="text-[10px] text-[#002443]/50 truncate">
                        {proposal.clienteCnpj || '—'} • {proposal.codigo || '—'} • {proposal.businessSubCategory || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap justify-end shrink-0">
                    <Badge className="bg-green-50 text-green-700 text-[10px]">Proposta {propStatusLabel}</Badge>
                    <ComplianceBadge status={complianceStatus} />
                    {contract && <Badge className="bg-blue-50 text-blue-600 text-[10px]">Contrato</Badge>}
                    <Check className="w-4 h-4 text-[#2bc196] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}