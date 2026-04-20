import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock, CheckCircle2, AlertTriangle, XCircle, FileCheck,
  Loader2, MoreHorizontal, Mail, Eye, Building2, User,
  Brain, FileText, ChevronLeft, ChevronRight, ChevronDown, UserPlus,
  Link2, ScanFace, RefreshCw, Handshake, Calendar
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import CaseExpandedDetail from '@/components/compliance/CaseExpandedDetail';
import CafLinkGeneratorModal from '@/components/compliance/CafLinkGeneratorModal';
import AssignCaseToPartnerModal from '@/components/partners-compliance/AssignCaseToPartnerModal';

// ── Helpers (mantidos idênticos à tabela anterior) ──
const getTimeInQueue = (createdDate) => {
  if (!createdDate) return '-';
  const now = new Date();
  const created = new Date(createdDate);
  const diffMs = now - created;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
  if (diffHours > 0) return `${diffHours}h`;
  return '< 1h';
};

const getStatusBadge = (status) => {
  const config = {
    'Pendente': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
    'Em Processamento': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Loader2 },
    'Aprovado': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
    'Manual': { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle },
    'Recusado': { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
    'Docs Solicitados': { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: FileCheck }
  };
  const { color, icon: Icon } = config[status] || config['Pendente'];
  return <Badge className={`${color} gap-1 border text-[11px]`}><Icon className="w-3 h-3" />{status}</Badge>;
};

const getModelBadge = (model) => {
  const config = {
    'ComplianceEcommerceV4': { color: 'bg-rose-100 text-rose-700', label: 'E-commerce v4' },
    'ComplianceGatewayV4': { color: 'bg-indigo-100 text-indigo-700', label: 'Gateway v4' },
    'ComplianceMarketplaceV4': { color: 'bg-amber-100 text-amber-700', label: 'Marketplace v4' },
    'CompliancePlataformaVerticalV4': { color: 'bg-violet-100 text-violet-700', label: 'Plat. Vertical v4' },
    'ComplianceInfoprodutosV4': { color: 'bg-amber-100 text-amber-700', label: 'Infoprodutos v4' },
    'ComplianceEducacaoV4': { color: 'bg-sky-100 text-sky-700', label: 'Educação v4' },
    'ComplianceSaaSV4': { color: 'bg-cyan-100 text-cyan-700', label: 'SaaS v4' },
    'ComplianceMerchantLinkV4': { color: 'bg-green-100 text-green-700', label: 'Link Pgto v4' },
    'ComplianceMPEV4': { color: 'bg-amber-100 text-amber-700', label: 'MPE v4' },
    'ComplianceDropshippingV4': { color: 'bg-orange-100 text-orange-700', label: 'Dropshipping v4' },
    'CompliancePixMerchantV4': { color: 'bg-emerald-100 text-emerald-700', label: 'PIX Merchant v4' },
    'CompliancePixIntermediarioV4': { color: 'bg-indigo-100 text-indigo-700', label: 'PIX Intermediário v4' },
    'pix_intermediario_v4': { color: 'bg-indigo-100 text-indigo-700', label: 'PIX Intermediário v4' },
    'subseller_v2': { color: 'bg-indigo-100 text-indigo-700', label: 'Subseller v2' },
    'merchant': { color: 'bg-purple-100 text-purple-700', label: 'Merchant (legado)' },
    'gateway': { color: 'bg-indigo-100 text-indigo-700', label: 'Gateway (legado)' },
    'marketplace': { color: 'bg-amber-100 text-amber-700', label: 'Marketplace (legado)' },
    'lite': { color: 'bg-teal-100 text-teal-700', label: 'Lite' },
    'pix': { color: 'bg-blue-100 text-blue-700', label: 'Pix' },
    'full': { color: 'bg-purple-100 text-purple-700', label: 'Full (legado)' },
    'ecommerce': { color: 'bg-amber-100 text-amber-700', label: 'E-commerce' },
  };
  const { color, label } = config[model] || { color: 'bg-slate-100 text-slate-700', label: model || 'Desconhecido' };
  return <Badge className={`${color} text-[11px] font-medium border-0`}>{label}</Badge>;
};

const getV4ScoreDisplay = (v4Score, subfaixa, subfaixaNome) => {
  if (v4Score === undefined || v4Score === null) {
    return <span className="text-[var(--pagsmile-blue)]/50 text-sm">Sem score</span>;
  }
  const subfaixaColors = {
    '1A': 'text-green-700 bg-green-50', '1B': 'text-green-600 bg-green-50',
    '2A': 'text-blue-700 bg-blue-50', '2B': 'text-blue-600 bg-blue-50',
    '3A': 'text-yellow-700 bg-yellow-50', '3B': 'text-orange-700 bg-orange-50',
    '4': 'text-red-600 bg-red-50', '5': 'text-red-800 bg-red-100',
  };
  const colorClass = subfaixaColors[subfaixa] || 'text-slate-600 bg-slate-50';
  const displayName = subfaixaNome || subfaixa || '';
  return (
    <div className="flex items-baseline gap-1.5 flex-wrap">
      <span className={`font-bold text-xl ${colorClass.split(' ')[0]}`}>{Math.round(v4Score)}</span>
      {displayName && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>{displayName}</span>}
    </div>
  );
};

const getSubfaixaBadge = (subfaixa) => {
  if (!subfaixa) return <span className="text-[var(--pagsmile-blue)]/50 text-sm">-</span>;
  const colorMap = {
    '1A':'bg-green-100 text-green-700','1B':'bg-green-100 text-green-700',
    '2A':'bg-blue-100 text-blue-700','2B':'bg-blue-100 text-blue-700',
    '3A':'bg-yellow-100 text-yellow-700','3B':'bg-orange-100 text-orange-700',
    '4':'bg-red-100 text-red-700','5':'bg-red-200 text-red-800'
  };
  return <Badge className={`text-[10px] font-bold border-0 ${colorMap[subfaixa] || 'bg-slate-100 text-slate-600'}`}>{subfaixa}</Badge>;
};

const getDecisionBadge = (decision) => {
  if (!decision) return <span className="text-[var(--pagsmile-blue)]/50 text-sm">-</span>;
  const config = {
    'Aprovado': 'bg-green-100 text-green-700',
    'Aprovado com Condições': 'bg-blue-100 text-blue-700',
    'Revisão Manual': 'bg-orange-100 text-orange-700',
    'Recusado': 'bg-red-100 text-red-700',
  };
  const colorClass = config[decision] || 'bg-slate-100 text-slate-700';
  return <Badge className={`${colorClass} text-[10px] font-semibold border-0`}>{decision}</Badge>;
};

function CafStatusBadge({ caseData }) {
  const hasDocs = caseData?.docCompleted === true;
  const hasCaf = caseData?.cafCompleted === true;
  if (hasDocs && hasCaf) {
    return (
      <Badge className="bg-green-100 text-green-700 border border-green-200 text-[10px] gap-1">
        <CheckCircle2 className="w-3 h-3" /> CAF completo
      </Badge>
    );
  }
  if (hasDocs || hasCaf) {
    return (
      <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200 text-[10px] gap-1">
        <AlertTriangle className="w-3 h-3" /> CAF parcial
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-700 border border-red-200 text-[10px] gap-1">
      <XCircle className="w-3 h-3" /> CAF pendente
    </Badge>
  );
}

function RevalidateMenuItem({ caseData }) {
  const [running, setRunning] = React.useState(false);
  const handleRevalidate = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setRunning(true);
    try {
      await base44.entities.OnboardingCase.update(caseData.id, {
        bigDataCorpCompleted: false,
        validationsCompleted: false,
        status: 'Em Processamento',
      });
      await base44.functions.invoke('autoEnrichOnboarding', { onboardingCaseId: caseData.id });
      toast.success('Pipeline de revalidação iniciado!');
    } catch (err) {
      toast.error('Erro ao revalidar: ' + err.message);
    } finally {
      setRunning(false);
    }
  };
  return (
    <DropdownMenuItem onClick={handleRevalidate} disabled={running}>
      {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
      {running ? 'Revalidando...' : 'Revalidar Pipeline'}
    </DropdownMenuItem>
  );
}

// ── Card individual do cliente ──
function CaseCard({
  c, merchant, scoresMap, templatesMap, merchantMap, getCaseModel,
  linksMap, introducerMap,
  selectedRows, setSelectedRows,
  expandedRow, setExpandedRow,
  onOpenCafModal, onOpenAssignModal
}) {
  const isSelected = selectedRows.includes(c.id);
  const isExpanded = expandedRow === c.id;
  const link = c.onboardingLinkCode ? linksMap[c.onboardingLinkCode] : null;
  const introducer = link?.introducerId ? introducerMap[link.introducerId] : null;
  const time = getTimeInQueue(c.created_date);
  const days = time.includes('d') ? parseInt(time) : 0;
  let timeBg = 'bg-green-100 text-green-700';
  if (days >= 5) timeBg = 'bg-red-100 text-red-700';
  else if (days >= 3) timeBg = 'bg-orange-100 text-orange-700';
  else if (days >= 1) timeBg = 'bg-yellow-100 text-yellow-700';

  return (
    <div className={`bg-white rounded-xl border shadow-sm hover:shadow-md transition-all ${
      isSelected ? 'border-[#2bc196] ring-1 ring-[#2bc196]/30' : 'border-[#002443]/10'
    }`}>
      {/* Header: checkbox + merchant + status + modelo */}
      <div className="p-4 flex items-start gap-3 border-b border-[#002443]/5">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => setSelectedRows(prev => checked ? [...prev, c.id] : prev.filter(id => id !== c.id))}
          className="mt-1"
        />
        <div className={`p-2 rounded-lg flex-shrink-0 ${merchant?.type === 'PF' ? 'bg-blue-100' : 'bg-purple-100'}`}>
          {merchant?.type === 'PF' ? <User className="w-4 h-4 text-blue-600" /> : <Building2 className="w-4 h-4 text-purple-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--pagsmile-blue)] text-sm truncate" title={merchant?.fullName}>
            {merchant?.fullName || 'N/A'}
          </p>
          <p className="text-xs text-[var(--pagsmile-blue)]/70 truncate">{merchant?.cpfCnpj || '-'}</p>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            {getStatusBadge(c.status)}
            {getModelBadge(getCaseModel(c))}
          </div>
        </div>
      </div>

      {/* Grid de informações: Score / Subfaixa / Decisão / Tempo */}
      <div className="grid grid-cols-2 gap-3 p-4 border-b border-[#002443]/5">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--pagsmile-blue)]/50 font-semibold mb-1">Score V4</p>
          {getV4ScoreDisplay(c.riskScoreV4, c.subfaixa, c.subfaixaNome)}
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--pagsmile-blue)]/50 font-semibold mb-1">Subfaixa</p>
          {getSubfaixaBadge(c.subfaixa)}
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--pagsmile-blue)]/50 font-semibold mb-1 flex items-center gap-1">
            <Brain className="w-3 h-3" /> Decisão IA
          </p>
          {getDecisionBadge(scoresMap[c.id]?.recomendacao_final || c.iaDecision)}
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[var(--pagsmile-blue)]/50 font-semibold mb-1">Tempo na fila</p>
          <span className={`text-[11px] font-semibold px-2 py-1 rounded-lg ${timeBg}`}>{time}</span>
        </div>
      </div>

      {/* CAF / Introducer / Analista / Submissão */}
      <div className="p-4 space-y-2 border-b border-[#002443]/5 text-xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[var(--pagsmile-blue)]/60 font-medium">CAF</span>
          <CafStatusBadge caseData={c} />
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[var(--pagsmile-blue)]/60 font-medium">Introducer</span>
          {introducer ? (
            <span className="flex items-center gap-1 text-[var(--pagsmile-blue)] font-medium truncate">
              <UserPlus className="w-3 h-3 text-[#2bc196] flex-shrink-0" />
              <span className="truncate">{introducer.name}</span>
            </span>
          ) : (
            <span className="text-[var(--pagsmile-blue)]/40">-</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[var(--pagsmile-blue)]/60 font-medium">Analista</span>
          <span className="text-[var(--pagsmile-blue)]/80 truncate">{c.assignedAnalystName || '-'}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[var(--pagsmile-blue)]/60 font-medium flex items-center gap-1">
            <Calendar className="w-3 h-3" /> Submissão
          </span>
          <span className="text-[var(--pagsmile-blue)]/80">
            {c.created_date
              ? `${new Date(c.created_date).toLocaleDateString('pt-BR')} ${new Date(c.created_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
              : '-'}
          </span>
        </div>
      </div>

      {/* Ações */}
      <div className="p-3 flex items-center gap-1.5 flex-wrap">
        <Link to={createPageUrl('AnaliseDeCasos') + `?id=${c.id}`} className="flex-1 min-w-[90px]">
          <Button variant="ghost" size="sm" className="w-full text-[var(--pagsmile-green)] hover:text-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/10">
            <Eye className="w-4 h-4 mr-1" /> Analisar
          </Button>
        </Link>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenAssignModal(c.id)}
          className="flex-1 min-w-[90px] text-[#002443] hover:text-[#002443] hover:bg-[#2bc196]/10 border border-[#2bc196]/30"
          title="Atribuir a parceiro"
        >
          <Handshake className="w-4 h-4 mr-1" /> Atribuir a parceiro
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenCafModal(c)}
          className="flex-1 min-w-[90px] text-[#2bc196] hover:text-[#2bc196] hover:bg-[#2bc196]/10"
          title="Gerar link para o cliente"
        >
          <Link2 className="w-4 h-4 mr-1" /> Gerar Link
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpandedRow(isExpanded ? null : c.id)}
          className="text-[#002443]/60"
          title={isExpanded ? 'Recolher' : 'Expandir'}
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild><Link to={createPageUrl('AnaliseDeCasos') + `?id=${c.id}`}><Eye className="w-4 h-4 mr-2" />Ver Detalhes</Link></DropdownMenuItem>
            <DropdownMenuItem asChild><Link to={createPageUrl('AnaliseDeCasos') + `?id=${c.id}`}><FileText className="w-4 h-4 mr-2" />Ver Respostas</Link></DropdownMenuItem>
            {merchant?.email && (<DropdownMenuItem asChild><a href={`mailto:${merchant.email}`}><Mail className="w-4 h-4 mr-2" />Enviar E-mail</a></DropdownMenuItem>)}
            <RevalidateMenuItem caseData={c} />
            <DropdownMenuItem onClick={() => onOpenCafModal(c)}>
              <ScanFace className="w-4 h-4 mr-2" /> Gerar Link Cliente
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenAssignModal(c.id)}>
              <Handshake className="w-4 h-4 mr-2" /> Atribuir a parceiro
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Expandido */}
      {isExpanded && (
        <div className="border-t border-[#002443]/5 bg-[#f4f4f4]/40 p-4">
          <CaseExpandedDetail caseData={c} scoresMap={scoresMap} templatesMap={templatesMap} merchantMap={merchantMap} />
        </div>
      )}
    </div>
  );
}

export default function ComplianceCasesCardsGrid({
  paginatedCases, filteredCasesCount, merchantMap, scoresMap, getCaseModel,
  selectedRows, setSelectedRows, expandedRow, setExpandedRow,
  currentPage, setCurrentPage, itemsPerPage, totalPages,
  templatesMap, isLoading, linksMap = {}, introducerMap = {},
}) {
  const [cafModalCase, setCafModalCase] = React.useState(null);
  const [assignModalCaseId, setAssignModalCaseId] = React.useState(null);

  const allSelected = selectedRows.length === paginatedCases.length && paginatedCases.length > 0;
  const toggleAll = (checked) => setSelectedRows(checked ? paginatedCases.map(c => c.id) : []);

  return (
    <div className="space-y-4">
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" />
        </div>
      ) : paginatedCases.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm text-center py-12">
          <FileCheck className="w-12 h-12 mx-auto text-[var(--pagsmile-blue)]/40 mb-4" />
          <p className="text-[var(--pagsmile-blue)]/70 font-medium">Nenhum questionário encontrado</p>
          <p className="text-sm text-[var(--pagsmile-blue)]/50 mt-1">Ajuste os filtros ou aguarde novas submissões</p>
        </div>
      ) : (
        <>
          {/* Barra de seleção total */}
          <div className="bg-white rounded-xl border border-[#002443]/5 px-4 py-2.5 flex items-center gap-3 text-sm">
            <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
            <span className="text-[var(--pagsmile-blue)]/70">
              {selectedRows.length > 0
                ? `${selectedRows.length} selecionado(s)`
                : `Selecionar todos desta página (${paginatedCases.length})`}
            </span>
          </div>

          {/* Grid responsivo de cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
            {paginatedCases.map((c) => (
              <CaseCard
                key={c.id}
                c={c}
                merchant={merchantMap[c.merchantId]}
                scoresMap={scoresMap}
                templatesMap={templatesMap}
                merchantMap={merchantMap}
                getCaseModel={getCaseModel}
                linksMap={linksMap}
                introducerMap={introducerMap}
                selectedRows={selectedRows}
                setSelectedRows={setSelectedRows}
                expandedRow={expandedRow}
                setExpandedRow={setExpandedRow}
                onOpenCafModal={setCafModalCase}
                onOpenAssignModal={setAssignModalCaseId}
              />
            ))}
          </div>
        </>
      )}

      {/* Paginação */}
      {filteredCasesCount > 0 && (
        <div className="bg-white rounded-xl border border-[#002443]/5 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <p className="text-sm text-[var(--pagsmile-blue)]/70">
            Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredCasesCount)} de {filteredCasesCount} questionários
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-[var(--pagsmile-blue)]/80">Página {currentPage} de {totalPages || 1}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Modal CAF */}
      <CafLinkGeneratorModal
        open={!!cafModalCase}
        onOpenChange={(o) => { if (!o) setCafModalCase(null); }}
        caseData={cafModalCase}
        merchant={cafModalCase ? merchantMap[cafModalCase.merchantId] : null}
      />

      {/* Modal Atribuir a Parceiro */}
      <AssignCaseToPartnerModal
        open={!!assignModalCaseId}
        onClose={() => setAssignModalCaseId(null)}
        onboardingCaseId={assignModalCaseId}
        onAssigned={() => setAssignModalCaseId(null)}
      />
    </div>
  );
}