import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertTriangle, RefreshCw, Search, FileCheck, Clock,
  Download, Filter,
} from 'lucide-react';
import ComplianceCasesCardsGrid from '@/components/compliance/ComplianceCasesCardsGrid';
import FrameworkVersionFilter from '@/components/v5_2/FrameworkVersionFilter';
import AnaliseManualV5_2Stats from '@/components/compliance/AnaliseManualV5_2Stats';

/**
 * AnaliseManual — página dedicada para casos que caíram em revisão manual.
 *
 * Inclui casos com status:
 *   • "Manual"           → aguardando análise do time de compliance
 *   • "Docs Solicitados" → analista pediu pendências e cliente está respondendo
 *
 * Reaproveita ComplianceCasesCardsGrid, que já entrega:
 *   • Cards completos por cliente (score V4, subfaixa, decisão IA, tempo na fila)
 *   • Botões de "Gerar link de documentos", "Gerar link CAF", "Gerar link COMPLETO"
 *   • Modal de atribuição a parceiro
 *   • Ao clicar no olhinho → abre AnaliseDeCasos com abas de Aprovar / Recusar /
 *     Solicitar Pendências (documentos + perguntas) com link público para o cliente.
 */
export default function AnaliseManual() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all | Manual | Docs Solicitados
  const [agingFilter, setAgingFilter] = useState('all');   // all | over24h | over72h
  const [frameworkFilter, setFrameworkFilter] = useState('all'); // all | v4.0 | v5.2
  const [categoriaV5_2Filter, setCategoriaV5_2Filter] = useState('all'); // all | cat_2_conditional | cat_3_manual_review | cat_4_block | cat_5_intensive_monitoring
  const [bloqueiosV5_2Filter, setBloqueiosV5_2Filter] = useState(false); // só casos com bloqueios ativos
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  const itemsPerPage = 15;

  // ── Data Fetching ──
  const { data: onboardingCases = [], isLoading: casesLoading, refetch: refetchCases } = useQuery({
    queryKey: ['analiseManualCases'],
    queryFn: async () => {
      const all = await base44.entities.OnboardingCase.list('-updated_date', 500);
      // Apenas casos que estão em mãos do time de compliance
      return all.filter(c =>
        (c.status === 'Manual' || c.status === 'Docs Solicitados') && !c.isSubsellerCase
      );
    },
  });

  const { data: merchants = [], isLoading: merchantsLoading } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => base44.entities.Merchant.list(),
  });

  const { data: complianceScores = [] } = useQuery({
    queryKey: ['complianceScores'],
    queryFn: () => base44.entities.ComplianceScore.list(),
  });

  const { data: questionnaireTemplates = [] } = useQuery({
    queryKey: ['questionnaireTemplates'],
    queryFn: () => base44.entities.QuestionnaireTemplate.list(),
  });

  const { data: onboardingLinks = [] } = useQuery({
    queryKey: ['onboardingLinks'],
    queryFn: () => base44.entities.OnboardingLink.list(),
  });

  const { data: introducers = [] } = useQuery({
    queryKey: ['introducers'],
    queryFn: () => base44.entities.Introducer.list(),
  });

  // ── Maps ──
  const merchantMap = React.useMemo(() => {
    const m = {};
    merchants.forEach(x => { m[x.id] = x; });
    return m;
  }, [merchants]);

  const scoresMap = React.useMemo(() => {
    const m = {};
    complianceScores.forEach(s => {
      const existing = m[s.onboarding_case_id];
      if (!existing || new Date(s.updated_date) > new Date(existing.updated_date)) {
        m[s.onboarding_case_id] = s;
      }
    });
    return m;
  }, [complianceScores]);

  const templatesMap = React.useMemo(() => {
    const m = {};
    questionnaireTemplates.forEach(t => { m[t.id] = t; });
    return m;
  }, [questionnaireTemplates]);

  const linksMap = React.useMemo(() => {
    const m = {};
    onboardingLinks.forEach(l => { m[l.uniqueCode] = l; });
    return m;
  }, [onboardingLinks]);

  const introducerMap = React.useMemo(() => {
    const m = {};
    introducers.forEach(i => { m[i.id] = i; });
    return m;
  }, [introducers]);

  const getCaseModel = (c) => {
    if (c.questionnaireTemplateId && templatesMap[c.questionnaireTemplateId]) {
      return templatesMap[c.questionnaireTemplateId].model || 'desconhecido';
    }
    if (c.onboardingLinkCode && linksMap[c.onboardingLinkCode]) {
      const link = linksMap[c.onboardingLinkCode];
      if (link.complianceType === 'LITE') return 'lite';
      if (link.complianceType === 'PIX') return 'pix';
    }
    return 'desconhecido';
  };

  // ── Stats ──
  const stats = React.useMemo(() => {
    const now = Date.now();
    return {
      total: onboardingCases.length,
      manual: onboardingCases.filter(c => c.status === 'Manual').length,
      docsSolicitados: onboardingCases.filter(c => c.status === 'Docs Solicitados').length,
      over24h: onboardingCases.filter(c => (now - new Date(c.updated_date).getTime()) / 36e5 > 24).length,
      over72h: onboardingCases.filter(c => (now - new Date(c.updated_date).getTime()) / 36e5 > 72).length,
    };
  }, [onboardingCases]);

  // Contadores framework para o filtro
  const frameworkCounts = React.useMemo(() => {
    let v4 = 0, v52 = 0;
    onboardingCases.forEach(c => {
      if ((c.framework_version || 'v4.0') === 'v5.2') v52 += 1; else v4 += 1;
    });
    return { all: onboardingCases.length, v4, v52 };
  }, [onboardingCases]);

  // ── Filtros ──
  const filteredCases = React.useMemo(() => {
    const now = Date.now();
    return onboardingCases.filter(c => {
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;

      if (agingFilter !== 'all') {
        const hours = (now - new Date(c.updated_date).getTime()) / 36e5;
        if (agingFilter === 'over24h' && hours <= 24) return false;
        if (agingFilter === 'over72h' && hours <= 72) return false;
      }

      if (frameworkFilter !== 'all') {
        const fv = c.framework_version || 'v4.0';
        if (fv !== frameworkFilter) return false;
      }

      // [V5.2 Fase 6.5.1] Filtros V5.2 — só aplicam quando frameworkFilter === 'v5.2'
      if (frameworkFilter === 'v5.2') {
        if (categoriaV5_2Filter !== 'all' && c.categoria_decisao_v5_2 !== categoriaV5_2Filter) return false;
        if (bloqueiosV5_2Filter === true && !(Array.isArray(c.bloqueiosAtivos) && c.bloqueiosAtivos.length > 0)) return false;
      }

      if (searchTerm) {
        const m = merchantMap[c.merchantId];
        const q = searchTerm.toLowerCase();
        const matches =
          m?.fullName?.toLowerCase().includes(q) ||
          m?.cpfCnpj?.includes(searchTerm) ||
          m?.email?.toLowerCase().includes(q) ||
          c.id?.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [onboardingCases, merchantMap, statusFilter, agingFilter, searchTerm, frameworkFilter, categoriaV5_2Filter, bloqueiosV5_2Filter]);

  // [V5.2] Casos V5.2 dentro da fila — usado pelos chips de categoria
  const v52CasesInQueue = React.useMemo(
    () => onboardingCases.filter(c => (c.framework_version || 'v4.0') === 'v5.2'),
    [onboardingCases]
  );

  const totalPages = Math.ceil(filteredCases.length / itemsPerPage);
  const paginatedCases = filteredCases.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExport = () => {
    const csv = [
      ['ID', 'Cliente', 'CNPJ/CPF', 'Status', 'Framework', 'Score V4', 'Score V5.2', 'Subfaixa', 'Tier', 'Categoria V5.2', 'Bloqueios Ativos', 'Decisão IA', 'Aguardando há (h)', 'Última Atualização'].join(','),
      ...filteredCases.map(c => {
        const m = merchantMap[c.merchantId];
        const hours = ((Date.now() - new Date(c.updated_date).getTime()) / 36e5).toFixed(1);
        const bloqueios = Array.isArray(c.bloqueiosAtivos) ? c.bloqueiosAtivos.length : 0;
        return [
          c.id, `"${m?.fullName || 'N/A'}"`, m?.cpfCnpj || '', c.status,
          c.framework_version || 'v4.0',
          c.riskScoreV4 ?? '', c.risk_score_v5_1 ?? '',
          c.subfaixa ?? '', c.tier ?? '',
          c.categoria_decisao_v5_2 ?? '',
          bloqueios,
          c.iaDecision ?? '',
          hours, new Date(c.updated_date).toLocaleString('pt-BR'),
        ].join(',');
      }),
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `analise_manual_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const StatChip = ({ icon: Icon, label, value, color, active, onClick }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
        active
          ? 'bg-white border-[#2bc196] shadow-md ring-2 ring-[#2bc196]/20'
          : 'bg-white/80 border-[#002443]/10 hover:border-[#2bc196]/40'
      }`}
    >
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="text-left">
        <p className="text-xs font-semibold text-[#002443]/60 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-[#002443] leading-none mt-0.5">{value}</p>
      </div>
    </button>
  );

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-orange-500/20">
              <AlertTriangle className="w-6 h-6 text-orange-300" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Análise Manual</h1>
              <p className="text-white/60 text-sm mt-1">
                Casos que precisam de revisão humana — aprovar, recusar ou solicitar pendências ao cliente
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} className="border-white/20 text-white hover:bg-white/10 rounded-xl bg-transparent">
              <Download className="w-4 h-4 mr-2" /> Exportar
            </Button>
            <Button variant="outline" onClick={() => refetchCases()} className="border-white/20 text-white hover:bg-white/10 rounded-xl bg-transparent">
              <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Chips Clicáveis */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatChip
          icon={Filter}
          label="Total na Fila"
          value={stats.total}
          color="bg-slate-100 text-slate-600"
          active={statusFilter === 'all' && agingFilter === 'all'}
          onClick={() => { setStatusFilter('all'); setAgingFilter('all'); }}
        />
        <StatChip
          icon={AlertTriangle}
          label="Aguardando Análise"
          value={stats.manual}
          color="bg-orange-100 text-orange-600"
          active={statusFilter === 'Manual'}
          onClick={() => { setStatusFilter('Manual'); setAgingFilter('all'); }}
        />
        <StatChip
          icon={FileCheck}
          label="Pendências Enviadas"
          value={stats.docsSolicitados}
          color="bg-purple-100 text-purple-600"
          active={statusFilter === 'Docs Solicitados'}
          onClick={() => { setStatusFilter('Docs Solicitados'); setAgingFilter('all'); }}
        />
        <StatChip
          icon={Clock}
          label="+24h Parados"
          value={stats.over24h}
          color="bg-yellow-100 text-yellow-700"
          active={agingFilter === 'over24h'}
          onClick={() => { setStatusFilter('all'); setAgingFilter('over24h'); }}
        />
        <StatChip
          icon={Clock}
          label="+72h Críticos"
          value={stats.over72h}
          color="bg-red-100 text-red-700"
          active={agingFilter === 'over72h'}
          onClick={() => { setStatusFilter('all'); setAgingFilter('over72h'); }}
        />
      </div>

      {/* Busca + Filtro Framework */}
      <div className="bg-white rounded-xl border border-[#002443]/10 p-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/50" />
          <Input
            placeholder="Buscar por cliente, CNPJ/CPF, e-mail ou ID..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="pl-9"
          />
        </div>
        <FrameworkVersionFilter
          value={frameworkFilter}
          onChange={(v) => {
            setFrameworkFilter(v);
            setCurrentPage(1);
            // Reseta filtros V5.2 quando sai do contexto V5.2
            if (v !== 'v5.2') { setCategoriaV5_2Filter('all'); setBloqueiosV5_2Filter(false); }
          }}
          counts={frameworkCounts}
        />
      </div>

      {/* [V5.2 Fase 6.5.1] Stats V5.2 — aparece só quando filtra por V5.2 */}
      {frameworkFilter === 'v5.2' && v52CasesInQueue.length > 0 && (
        <AnaliseManualV5_2Stats
          cases={v52CasesInQueue}
          categoriaFilter={categoriaV5_2Filter}
          onCategoriaChange={(v) => { setCategoriaV5_2Filter(v); setCurrentPage(1); }}
          bloqueiosFilter={bloqueiosV5_2Filter}
          onBloqueiosChange={(v) => { setBloqueiosV5_2Filter(v); setCurrentPage(1); }}
        />
      )}

      {/* Resultados */}
      {filteredCases.length === 0 && !casesLoading ? (
        <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
            <FileCheck className="w-8 h-8 text-green-600" />
          </div>
          <p className="text-lg font-bold text-[#002443]">Nenhum caso aguardando análise manual</p>
          <p className="text-sm text-[#002443]/60 mt-1">
            O time está em dia! Novos casos aparecerão aqui assim que o SENTINEL escalar.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#002443]/70 font-medium">
              <span className="font-bold">{filteredCases.length}</span> caso(s) na fila
              {selectedRows.length > 0 && (
                <Badge className="ml-2 bg-[#2bc196]/15 text-[#002443] border-0">
                  {selectedRows.length} selecionado(s)
                </Badge>
              )}
            </p>
          </div>

          <ComplianceCasesCardsGrid
            paginatedCases={paginatedCases}
            filteredCasesCount={filteredCases.length}
            merchantMap={merchantMap}
            scoresMap={scoresMap}
            getCaseModel={getCaseModel}
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
            expandedRow={expandedRow}
            setExpandedRow={setExpandedRow}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            itemsPerPage={itemsPerPage}
            totalPages={totalPages}
            templatesMap={templatesMap}
            isLoading={casesLoading || merchantsLoading}
            linksMap={linksMap}
            introducerMap={introducerMap}
          />
        </>
      )}
    </div>
  );
}