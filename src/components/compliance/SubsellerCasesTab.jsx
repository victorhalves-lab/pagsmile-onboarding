import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Search, Building2, Users, Eye, Loader2, ChevronDown, ChevronRight, FileText, User, Paperclip, Copy, Check
} from 'lucide-react';
import SubsellerPFResponsesModal from '@/components/subseller/SubsellerPFResponsesModal';

const STATUS_COLORS = {
  'Pendente': 'bg-yellow-100 text-yellow-800',
  'Em Processamento': 'bg-blue-100 text-blue-800',
  'Aprovado': 'bg-green-100 text-green-800',
  'Manual': 'bg-orange-100 text-orange-800',
  'Recusado': 'bg-red-100 text-red-800',
};

export default function SubsellerCasesTab() {
  const [search, setSearch] = useState('');
  const [expandedSeller, setExpandedSeller] = useState(null);
  const [subTab, setSubTab] = useState('pj');
  const [pfModalCase, setPfModalCase] = useState(null);
  const [copiedCaseId, setCopiedCaseId] = useState(null);

  const handleCopyDocLink = (caseId) => {
    const url = `${window.location.origin}/SubsellerDocUpload?caseId=${caseId}`;
    navigator.clipboard.writeText(url);
    setCopiedCaseId(caseId);
    setTimeout(() => setCopiedCaseId(null), 2000);
  };

  const { data: cases = [], isLoading } = useQuery({
    queryKey: ['subseller-cases-tab'],
    queryFn: async () => {
      const all = await base44.entities.OnboardingCase.list('-created_date', 1000);
      return all.filter(c => c.isSubsellerCase);
    }
  });

  const { data: merchants = [] } = useQuery({
    queryKey: ['subseller-merchants-tab'],
    queryFn: () => base44.entities.Merchant.list('-created_date', 1000)
  });

  const { data: scores = [] } = useQuery({
    queryKey: ['subseller-scores-tab'],
    queryFn: () => base44.entities.SubsellerScore.list('-created_date', 500)
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['subseller-responses-tab'],
    queryFn: () => base44.entities.QuestionnaireResponse.list('-created_date', 5000)
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['subseller-docs-tab'],
    queryFn: () => base44.entities.DocumentUpload.list('-created_date', 2000)
  });

  const merchantMap = useMemo(() => {
    const m = {};
    merchants.forEach(me => { m[me.id] = me; });
    return m;
  }, [merchants]);

  const scoreMap = useMemo(() => {
    const m = {};
    scores.forEach(s => { m[s.onboarding_case_id] = s; });
    return m;
  }, [scores]);

  const responseCountMap = useMemo(() => {
    const m = {};
    responses.forEach(r => { m[r.onboardingCaseId] = (m[r.onboardingCaseId] || 0) + 1; });
    return m;
  }, [responses]);

  const docCountMap = useMemo(() => {
    const m = {};
    documents.forEach(d => { m[d.onboardingCaseId] = (m[d.onboardingCaseId] || 0) + 1; });
    return m;
  }, [documents]);

  // Split cases into PJ and PF
  const { pjCases, pfCases } = useMemo(() => {
    const pj = [];
    const pf = [];
    cases.forEach(c => {
      const m = merchantMap[c.merchantId];
      if (m?.type === 'PF') pf.push(c);
      else pj.push(c);
    });
    return { pjCases: pj, pfCases: pf };
  }, [cases, merchantMap]);

  const activeCases = subTab === 'pf' ? pfCases : pjCases;

  // Group by seller (parentMerchantId)
  const sellerGroups = useMemo(() => {
    const groups = {};
    activeCases.forEach(c => {
      const sellerId = c.parentMerchantId || 'unknown';
      if (!groups[sellerId]) groups[sellerId] = [];
      groups[sellerId].push(c);
    });

    return Object.entries(groups)
      .map(([sellerId, subCases]) => {
        const seller = merchantMap[sellerId];
        return {
          sellerId,
          sellerName: seller?.fullName || seller?.companyName || 'Seller desconhecido',
          sellerCnpj: seller?.cpfCnpj || '',
          subsellers: subCases,
          totalApproved: subCases.filter(c => c.status === 'Aprovado').length,
          totalPending: subCases.filter(c => ['Pendente', 'Em Processamento', 'Manual'].includes(c.status)).length,
          totalRejected: subCases.filter(c => c.status === 'Recusado').length,
        };
      })
      .filter(g => {
        if (!search) return true;
        const s = search.toLowerCase();
        return g.sellerName.toLowerCase().includes(s) || g.sellerCnpj.includes(s) ||
          g.subsellers.some(c => {
            const m = merchantMap[c.merchantId];
            return (m?.fullName || '').toLowerCase().includes(s) || (m?.cpfCnpj || '').includes(s);
          });
      })
      .sort((a, b) => b.subsellers.length - a.subsellers.length);
  }, [activeCases, merchantMap, search]);

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" /></div>;
  }

  return (
    <div className="space-y-4">
      <Tabs value={subTab} onValueChange={setSubTab}>
        <TabsList className="bg-white border border-[#002443]/10 p-1 rounded-xl mb-4">
          <TabsTrigger value="pj" className="rounded-lg data-[state=active]:bg-[#002443] data-[state=active]:text-white gap-2 px-4">
            <Building2 className="w-4 h-4" /> Pessoa Jurídica
            <Badge className="bg-[#2bc196]/20 text-[#002443] text-xs ml-1 border-0">{pjCases.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pf" className="rounded-lg data-[state=active]:bg-[#002443] data-[state=active]:text-white gap-2 px-4">
            <User className="w-4 h-4" /> Pessoa Física
            <Badge className="bg-purple-100 text-purple-700 text-xs ml-1 border-0">{pfCases.length}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pagsmile-blue)]/40" />
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar seller ou subseller..." className="pl-10" />
      </div>

      <div className="text-sm text-[var(--pagsmile-blue)]/50 mb-2">
        {sellerGroups.length} seller{sellerGroups.length !== 1 ? 's' : ''} • {activeCases.length} subconta{activeCases.length !== 1 ? 's' : ''} ({subTab === 'pf' ? 'PF' : 'PJ'})
      </div>

      {sellerGroups.length === 0 ? (
        <Card><CardContent className="text-center py-12">
          <Users className="w-12 h-12 mx-auto text-[var(--pagsmile-blue)]/20 mb-4" />
          <p className="text-[var(--pagsmile-blue)]/50">Nenhum questionário de subseller recebido ainda.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">
          {sellerGroups.map(group => {
            const isExpanded = expandedSeller === group.sellerId;
            return (
              <Card key={group.sellerId} className="overflow-hidden">
                <button
                  onClick={() => setExpandedSeller(isExpanded ? null : group.sellerId)}
                  className="w-full text-left p-4 flex items-center justify-between hover:bg-[#f4f4f4] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-100">
                      <Building2 className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--pagsmile-blue)]">{group.sellerName}</p>
                      <p className="text-xs text-[var(--pagsmile-blue)]/50">{group.sellerCnpj}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
                      <Badge className="bg-[var(--pagsmile-blue)]/5 text-[var(--pagsmile-blue)] border-0 text-xs">
                        <Users className="w-3 h-3 mr-1" />{group.subsellers.length}
                      </Badge>
                      {group.totalApproved > 0 && <Badge className="bg-green-100 text-green-700 border-0 text-xs">{group.totalApproved} ✓</Badge>}
                      {group.totalPending > 0 && <Badge className="bg-yellow-100 text-yellow-700 border-0 text-xs">{group.totalPending} ⏳</Badge>}
                      {group.totalRejected > 0 && <Badge className="bg-red-100 text-red-700 border-0 text-xs">{group.totalRejected} ✗</Badge>}
                    </div>
                    {isExpanded ? <ChevronDown className="w-5 h-5 text-[var(--pagsmile-blue)]/40" /> : <ChevronRight className="w-5 h-5 text-[var(--pagsmile-blue)]/40" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-[var(--pagsmile-blue)]/5">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#f4f4f4]">
                          <TableHead>Subseller</TableHead>
                          <TableHead>Segmento</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-center">Score</TableHead>
                          <TableHead className="text-center">Respostas</TableHead>
                          <TableHead className="text-center">Docs</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {group.subsellers.map(c => {
                          const m = merchantMap[c.merchantId];
                          const score = scoreMap[c.id];
                          const respCount = responseCountMap[c.id] || 0;
                          const docCount = docCountMap[c.id] || 0;
                          return (
                            <TableRow key={c.id} className="hover:bg-[#f4f4f4]/50">
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <div>
                                    <p className="font-medium text-[var(--pagsmile-blue)]">{m?.fullName || 'N/A'}</p>
                                    <p className="text-xs text-[var(--pagsmile-blue)]/50">{m?.cpfCnpj || '-'}</p>
                                  </div>
                                  {m?.type === 'PF' && <Badge className="bg-purple-100 text-purple-700 border-0 text-[10px]">PF</Badge>}
                                </div>
                              </TableCell>
                              <TableCell>
                                {score?.segmento ? (
                                  <Badge className="bg-[var(--pagsmile-blue)]/5 text-[var(--pagsmile-blue)] border-0 text-xs capitalize">{score.segmento}</Badge>
                                ) : <span className="text-xs text-[var(--pagsmile-blue)]/40">-</span>}
                              </TableCell>
                              <TableCell>
                                <Badge className={`${STATUS_COLORS[c.status] || 'bg-slate-100'} border-0 text-xs`}>{c.status}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                {score ? (
                                  <span className={`font-bold ${score.score_final < 200 ? 'text-green-600' : score.score_final < 400 ? 'text-blue-600' : score.score_final < 600 ? 'text-orange-600' : 'text-red-600'}`}>
                                    {score.score_final}
                                  </span>
                                ) : <span className="text-[var(--pagsmile-blue)]/40">-</span>}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="text-xs">{respCount}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline" className="text-xs">{docCount}</Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs text-[var(--pagsmile-blue)]/70">
                                  {c.created_date ? new Date(c.created_date).toLocaleDateString('pt-BR') : '-'}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {!c.docCompleted && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                      onClick={() => handleCopyDocLink(c.id)}
                                    >
                                      {copiedCaseId === c.id ? (
                                        <><Check className="w-4 h-4 mr-1" /> Copiado!</>
                                      ) : (
                                        <><Paperclip className="w-4 h-4 mr-1" /> Link Docs</>
                                      )}
                                    </Button>
                                  )}
                                  {m?.type === 'PF' && (
                                    <Button variant="ghost" size="sm" className="text-purple-600" onClick={() => setPfModalCase(c)}>
                                      <Eye className="w-4 h-4 mr-1" /> Respostas
                                    </Button>
                                  )}
                                  <Link to={createPageUrl('AnaliseDeCasos') + `?id=${c.id}`}>
                                    <Button variant="ghost" size="sm" className="text-[var(--pagsmile-green)]">
                                      <Eye className="w-4 h-4 mr-1" /> Analisar
                                    </Button>
                                  </Link>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <SubsellerPFResponsesModal
        open={!!pfModalCase}
        onClose={() => setPfModalCase(null)}
        caseId={pfModalCase?.id}
        merchantName={pfModalCase ? merchantMap[pfModalCase.merchantId]?.fullName : ''}
      />
    </div>
  );
}