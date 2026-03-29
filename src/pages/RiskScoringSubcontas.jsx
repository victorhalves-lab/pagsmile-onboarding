import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Shield, Loader2, Search, RefreshCw, Play, Eye,
  CheckCircle2, AlertTriangle, XCircle, TrendingUp, Users, Building2
} from 'lucide-react';
import { toast } from 'sonner';

const SUBFAIXA_COLORS = {
  '1A': 'bg-green-100 text-green-800', '1B': 'bg-green-50 text-green-700',
  '2A': 'bg-blue-100 text-blue-800', '2B': 'bg-blue-50 text-blue-700',
  '3A': 'bg-yellow-100 text-yellow-800', '3B': 'bg-orange-100 text-orange-800',
  '4': 'bg-red-100 text-red-800', '5': 'bg-red-200 text-red-900',
};

const SEGMENT_LABELS = {
  gateway: 'Gateway', marketplace: 'Marketplace', plataforma_vertical: 'Plataforma Vertical',
  dropshipping: 'Dropshipping', infoprodutos: 'Infoprodutos', ecommerce: 'E-commerce',
  link_pagamento: 'Link de Pagamento', foodtech: 'Foodtech', saas: 'SaaS', educacao: 'Educação',
};

export default function RiskScoringSubcontas() {
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [subfaixaFilter, setSubfaixaFilter] = useState('all');

  const { data: scores = [], isLoading: scoresLoading, refetch } = useQuery({
    queryKey: ['subseller-scores'],
    queryFn: () => base44.entities.SubsellerScore.list('-created_date', 500)
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['subseller-cases'],
    queryFn: async () => {
      const all = await base44.entities.OnboardingCase.list('-created_date', 1000);
      return all.filter(c => c.isSubsellerCase);
    }
  });

  const { data: merchants = [] } = useQuery({
    queryKey: ['subseller-merchants'],
    queryFn: () => base44.entities.Merchant.list('-created_date', 1000)
  });

  const merchantMap = useMemo(() => {
    const m = {};
    merchants.forEach(me => { m[me.id] = me; });
    return m;
  }, [merchants]);

  const caseMap = useMemo(() => {
    const m = {};
    cases.forEach(c => { m[c.id] = c; });
    return m;
  }, [cases]);

  const runScoringMutation = useMutation({
    mutationFn: () => base44.functions.invoke('scoreSubseller', { dryRun: false }),
    onSuccess: (res) => {
      const s = res.data.summary;
      toast.success(`Scoring executado: ${s.processed} processados, ${s.created} criados, ${s.updated} atualizados`);
      refetch();
    },
    onError: (err) => toast.error('Erro: ' + err.message)
  });

  const filteredScores = useMemo(() => {
    return scores.filter(s => {
      if (segmentFilter !== 'all' && s.segmento !== segmentFilter) return false;
      if (subfaixaFilter !== 'all' && s.subfaixa !== subfaixaFilter) return false;
      if (search) {
        const c = caseMap[s.onboarding_case_id];
        const m = c ? merchantMap[c.merchantId] : null;
        const term = search.toLowerCase();
        if (!((m?.fullName || '').toLowerCase().includes(term) || (m?.cpfCnpj || '').includes(term))) return false;
      }
      return true;
    });
  }, [scores, segmentFilter, subfaixaFilter, search, caseMap, merchantMap]);

  // Stats
  const stats = useMemo(() => {
    const total = scores.length;
    const bySubfaixa = {};
    const bySegmento = {};
    let totalScore = 0;
    scores.forEach(s => {
      bySubfaixa[s.subfaixa] = (bySubfaixa[s.subfaixa] || 0) + 1;
      bySegmento[s.segmento] = (bySegmento[s.segmento] || 0) + 1;
      totalScore += s.score_final || 0;
    });
    const avgScore = total > 0 ? Math.round(totalScore / total) : 0;
    const approved = scores.filter(s => s.recomendacao_final === 'Aprovado').length;
    const manual = scores.filter(s => s.recomendacao_final === 'Revisão Manual').length;
    const rejected = scores.filter(s => s.recomendacao_final === 'Recusado').length;
    return { total, avgScore, approved, manual, rejected, bySubfaixa, bySegmento };
  }, [scores]);

  if (scoresLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10"><Shield className="w-6 h-6 text-[#5cf7cf]" /></div>
            <div>
              <h1 className="text-2xl font-bold text-white">Risk Scoring Subcontas</h1>
              <p className="text-white/60 text-sm mt-1">Análise de risco para subsellers por segmento</p>
            </div>
          </div>
          <Button onClick={() => runScoringMutation.mutate()} disabled={runScoringMutation.isPending}
            className="bg-[var(--pagsmile-green)] text-white">
            {runScoringMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
            Executar Scoring
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-[var(--pagsmile-blue)]">{stats.total}</p>
          <p className="text-xs text-[var(--pagsmile-blue)]/50">Total Analisados</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-[var(--pagsmile-blue)]">{stats.avgScore}</p>
          <p className="text-xs text-[var(--pagsmile-blue)]/50">Score Médio</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          <p className="text-xs text-[var(--pagsmile-blue)]/50">Aprovados</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{stats.manual}</p>
          <p className="text-xs text-[var(--pagsmile-blue)]/50">Revisão Manual</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
          <p className="text-xs text-[var(--pagsmile-blue)]/50">Recusados</p>
        </CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pagsmile-blue)]/40" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar subseller..." className="pl-10" />
        </div>
        <Select value={segmentFilter} onValueChange={setSegmentFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Segmento" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Segmentos</SelectItem>
            {Object.entries(SEGMENT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={subfaixaFilter} onValueChange={setSubfaixaFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Subfaixa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas Subfaixas</SelectItem>
            {['1A','1B','2A','2B','3A','3B','4','5'].map(sf => <SelectItem key={sf} value={sf}>{sf}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredScores.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 mx-auto text-[var(--pagsmile-blue)]/20 mb-4" />
              <p className="text-[var(--pagsmile-blue)]/50">Nenhum score encontrado. Execute o scoring para analisar subcontas.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f4f4f4]">
                  <TableHead>Subseller</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Segmento</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead>Subfaixa</TableHead>
                  <TableHead>RR%</TableHead>
                  <TableHead>Decisão</TableHead>
                  <TableHead>Red Flags</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredScores.map(s => {
                  const c = caseMap[s.onboarding_case_id];
                  const subseller = c ? merchantMap[c.merchantId] : null;
                  const seller = c?.parentMerchantId ? merchantMap[c.parentMerchantId] : null;
                  return (
                    <TableRow key={s.id} className="hover:bg-[#f4f4f4]">
                      <TableCell>
                        <div>
                          <p className="font-medium text-[var(--pagsmile-blue)]">{subseller?.fullName || 'N/A'}</p>
                          <p className="text-xs text-[var(--pagsmile-blue)]/50">{subseller?.cpfCnpj || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-[var(--pagsmile-blue)]/70">{seller?.fullName || seller?.companyName || '-'}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-[var(--pagsmile-blue)]/5 text-[var(--pagsmile-blue)] border-0 text-xs">
                          {SEGMENT_LABELS[s.segmento] || s.segmento}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`text-lg font-bold ${
                          s.score_final < 200 ? 'text-green-600' : s.score_final < 400 ? 'text-blue-600' : s.score_final < 600 ? 'text-orange-600' : 'text-red-600'
                        }`}>{s.score_final}</span>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${SUBFAIXA_COLORS[s.subfaixa] || 'bg-slate-100'} border-0 text-xs font-bold`}>
                          {s.subfaixa} — {s.subfaixa_nome}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-semibold">{s.rolling_reserve_percent}%</span>
                      </TableCell>
                      <TableCell>
                        {s.recomendacao_final === 'Aprovado' && <Badge className="bg-green-100 text-green-800 border-0"><CheckCircle2 className="w-3 h-3 mr-1" />Aprovado</Badge>}
                        {s.recomendacao_final === 'Aprovado com Condições' && <Badge className="bg-yellow-100 text-yellow-800 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Com Condições</Badge>}
                        {s.recomendacao_final === 'Revisão Manual' && <Badge className="bg-orange-100 text-orange-800 border-0"><AlertTriangle className="w-3 h-3 mr-1" />Manual</Badge>}
                        {s.recomendacao_final === 'Recusado' && <Badge className="bg-red-100 text-red-800 border-0"><XCircle className="w-3 h-3 mr-1" />Recusado</Badge>}
                      </TableCell>
                      <TableCell>
                        {(s.red_flags?.length || 0) > 0 ? (
                          <span className="text-xs text-red-600 font-semibold">{s.red_flags.length} flag{s.red_flags.length > 1 ? 's' : ''}</span>
                        ) : (
                          <span className="text-xs text-green-600">Limpo</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {c && (
                          <Link to={createPageUrl('AnaliseDeCasos') + `?id=${c.id}`}>
                            <Button variant="ghost" size="sm" className="text-[var(--pagsmile-green)]">
                              <Eye className="w-4 h-4 mr-1" /> Ver
                            </Button>
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}