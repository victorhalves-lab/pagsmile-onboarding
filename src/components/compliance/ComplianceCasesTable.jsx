import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Clock, CheckCircle2, AlertTriangle, XCircle, FileCheck,
  Loader2, MoreHorizontal, Mail, Eye, ArrowUpDown, Building2, User,
  Brain, FileText, ChevronLeft, ChevronRight, ChevronDown, UserPlus,
  Link2, Copy, ScanFace, RefreshCw
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import CaseExpandedDetail from '@/components/compliance/CaseExpandedDetail';
import CafLinkGeneratorModal from '@/components/compliance/CafLinkGeneratorModal';

// ── Helpers ──
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
  return <Badge className={`${color} gap-1 border`}><Icon className="w-3 h-3" />{status}</Badge>;
};

const getModelBadge = (model) => {
  const config = {
    // V4 — Segmentos
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
    // PIX V4
    'CompliancePixMerchantV4': { color: 'bg-emerald-100 text-emerald-700', label: 'PIX Merchant v4' },
    'CompliancePixIntermediarioV4': { color: 'bg-indigo-100 text-indigo-700', label: 'PIX Intermediário v4' },
    'pix_intermediario_v4': { color: 'bg-indigo-100 text-indigo-700', label: 'PIX Intermediário v4' },
    // Subseller
    'subseller_v2': { color: 'bg-indigo-100 text-indigo-700', label: 'Subseller v2' },
    // Legados (não devem aparecer mais, mas por segurança)
    'merchant': { color: 'bg-purple-100 text-purple-700', label: 'Merchant (legado)' },
    'gateway': { color: 'bg-indigo-100 text-indigo-700', label: 'Gateway (legado)' },
    'marketplace': { color: 'bg-amber-100 text-amber-700', label: 'Marketplace (legado)' },
    'lite': { color: 'bg-teal-100 text-teal-700', label: 'Lite' },
    'pix': { color: 'bg-blue-100 text-blue-700', label: 'Pix' },
    'full': { color: 'bg-purple-100 text-purple-700', label: 'Full (legado)' },
    'ecommerce': { color: 'bg-amber-100 text-amber-700', label: 'E-commerce' },
  };
  const { color, label } = config[model] || { color: 'bg-slate-100 text-slate-700', label: model || 'Desconhecido' };
  return <Badge className={`${color} text-xs font-medium border-0`}>{label}</Badge>;
};

// V4 Score Badge: 0-849 scale where 0=best
const getV4ScoreBadge = (v4Score, subfaixa, subfaixaNome) => {
  if (v4Score === undefined || v4Score === null) return <span className="text-[var(--pagsmile-blue)]/50">-</span>;
  const subfaixaColors = {
    '1A': 'text-green-700 bg-green-50', '1B': 'text-green-600 bg-green-50',
    '2A': 'text-blue-700 bg-blue-50', '2B': 'text-blue-600 bg-blue-50',
    '3A': 'text-yellow-700 bg-yellow-50', '3B': 'text-orange-700 bg-orange-50',
    '4': 'text-red-600 bg-red-50', '5': 'text-red-800 bg-red-100',
  };
  const colorClass = subfaixaColors[subfaixa] || 'text-slate-600 bg-slate-50';
  const displayName = subfaixaNome || subfaixa || '';
  return (
    <div className="flex items-center gap-2">
      <span className={`font-bold text-lg ${colorClass.split(' ')[0]}`}>{Math.round(v4Score)}</span>
      {displayName && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${colorClass}`}>{displayName}</span>}
    </div>
  );
};

const getDecisionBadge = (decision) => {
  if (!decision) return <span className="text-[var(--pagsmile-blue)]/50">-</span>;
  const config = {
    'Aprovado': 'bg-green-100 text-green-700',
    'Aprovado com Condições': 'bg-blue-100 text-blue-700',
    'Revisão Manual': 'bg-orange-100 text-orange-700',
    'Recusado': 'bg-red-100 text-red-700',
  };
  const colorClass = config[decision] || 'bg-slate-100 text-slate-700';
  return <Badge className={`${colorClass} text-[10px] font-semibold border-0`}>{decision}</Badge>;
};

// ── CAF Status Badge: 🟢 completo / 🟡 parcial / 🔴 pendente ──
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

// ── Revalidar individual ──
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

export default function ComplianceCasesTable({
  paginatedCases, filteredCasesCount, merchantMap, scoresMap, getCaseModel,
  selectedRows, setSelectedRows, expandedRow, setExpandedRow,
  sortField, sortOrder, setSortField, setSortOrder,
  currentPage, setCurrentPage, itemsPerPage, totalPages,
  templatesMap, isLoading, linksMap = {}, introducerMap = {},
}) {
  const [cafModalCase, setCafModalCase] = React.useState(null);
  return (
    <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm overflow-hidden">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" />
        </div>
      ) : paginatedCases.length === 0 ? (
        <div className="text-center py-12">
          <FileCheck className="w-12 h-12 mx-auto text-[var(--pagsmile-blue)]/40 mb-4" />
          <p className="text-[var(--pagsmile-blue)]/70 font-medium">Nenhum questionário encontrado</p>
          <p className="text-sm text-[var(--pagsmile-blue)]/50 mt-1">Ajuste os filtros ou aguarde novas submissões</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="bg-[#f4f4f4]">
              <TableHead className="w-10">
                <Checkbox 
                  checked={selectedRows.length === paginatedCases.length && paginatedCases.length > 0}
                  onCheckedChange={(checked) => {
                    setSelectedRows(checked ? paginatedCases.map(c => c.id) : []);
                  }}
                />
              </TableHead>
              <TableHead className="w-[280px]">
                <button className="flex items-center gap-1 hover:text-[var(--pagsmile-blue)] font-semibold"
                  onClick={() => { if (sortField === 'merchant') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); else { setSortField('merchant'); setSortOrder('asc'); } }}>
                  Merchant <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-center">
                <button className="flex items-center gap-1 hover:text-[var(--pagsmile-blue)] font-semibold mx-auto"
                  onClick={() => { if (sortField === 'riskScoreV4') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); else { setSortField('riskScoreV4'); setSortOrder('asc'); } }}>
                  Score V4 <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead className="text-center">Subfaixa</TableHead>
              <TableHead className="text-center">
                <button className="flex items-center gap-1 hover:text-[var(--pagsmile-blue)] font-semibold mx-auto"
                  onClick={() => { if (sortField === 'iaDecision') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); else { setSortField('iaDecision'); setSortOrder('asc'); } }}>
                  <Brain className="w-4 h-4 mr-1" /> Decisão <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead>Tempo na Fila</TableHead>
              <TableHead className="text-center">CAF</TableHead>
              <TableHead>Introducer</TableHead>
              <TableHead>Analista</TableHead>
              <TableHead>
                <button className="flex items-center gap-1 hover:text-[var(--pagsmile-blue)] font-semibold"
                  onClick={() => { if (sortField === 'created_date') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); else { setSortField('created_date'); setSortOrder('desc'); } }}>
                  Submissão <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCases.map((c) => {
              const merchant = merchantMap[c.merchantId];
              return (
                <React.Fragment key={c.id}>
                  <TableRow className={`hover:bg-[#f4f4f4] transition-colors cursor-pointer ${selectedRows.includes(c.id) ? 'bg-[#2bc196]/5' : ''}`}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedRows.includes(c.id)}
                        onCheckedChange={(checked) => setSelectedRows(prev => checked ? [...prev, c.id] : prev.filter(id => id !== c.id))} />
                    </TableCell>
                    <TableCell onClick={() => setExpandedRow(expandedRow === c.id ? null : c.id)}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${merchant?.type === 'PF' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                          {merchant?.type === 'PF' ? <User className="w-4 h-4 text-blue-600" /> : <Building2 className="w-4 h-4 text-purple-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--pagsmile-blue)]">{merchant?.fullName || 'N/A'}</p>
                          <p className="text-sm text-[var(--pagsmile-blue)]/70">{merchant?.cpfCnpj || '-'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getModelBadge(getCaseModel(c))}</TableCell>
                    <TableCell>{getStatusBadge(c.status)}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">{getV4ScoreBadge(c.riskScoreV4, c.subfaixa, c.subfaixaNome)}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      {c.subfaixa ? (
                        <Badge className={`text-[10px] font-bold border-0 ${
                          {'1A':'bg-green-100 text-green-700','1B':'bg-green-100 text-green-700',
                           '2A':'bg-blue-100 text-blue-700','2B':'bg-blue-100 text-blue-700',
                           '3A':'bg-yellow-100 text-yellow-700','3B':'bg-orange-100 text-orange-700',
                           '4':'bg-red-100 text-red-700','5':'bg-red-200 text-red-800'}[c.subfaixa] || 'bg-slate-100 text-slate-600'
                        }`}>{c.subfaixa}</Badge>
                      ) : <span className="text-[var(--pagsmile-blue)]/50">-</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">{getDecisionBadge(scoresMap[c.id]?.recomendacao_final || c.iaDecision)}</div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const time = getTimeInQueue(c.created_date);
                        const hasDays = time.includes('d');
                        const days = hasDays ? parseInt(time) : 0;
                        let bgColor = 'bg-green-100 text-green-700';
                        if (days >= 5) bgColor = 'bg-red-100 text-red-700';
                        else if (days >= 3) bgColor = 'bg-orange-100 text-orange-700';
                        else if (days >= 1) bgColor = 'bg-yellow-100 text-yellow-700';
                        return <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${bgColor}`}>{time}</span>;
                      })()}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">
                        <CafStatusBadge caseData={c} />
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const link = c.onboardingLinkCode ? linksMap[c.onboardingLinkCode] : null;
                        const introducer = link?.introducerId ? introducerMap[link.introducerId] : null;
                        if (introducer) {
                          return (
                            <div className="flex items-center gap-1.5">
                              <UserPlus className="w-3.5 h-3.5 text-[#2bc196]" />
                              <span className="text-sm font-medium text-[var(--pagsmile-blue)]">{introducer.name}</span>
                            </div>
                          );
                        }
                        return <span className="text-sm text-[var(--pagsmile-blue)]/40">-</span>;
                      })()}
                    </TableCell>
                    <TableCell><span className="text-sm text-[var(--pagsmile-blue)]/80">{c.assignedAnalystName || '-'}</span></TableCell>
                    <TableCell>
                      <div>
                        <p className="text-[var(--pagsmile-blue)] text-sm">{c.created_date ? new Date(c.created_date).toLocaleDateString('pt-BR') : '-'}</p>
                        <p className="text-xs text-[var(--pagsmile-blue)]/50">{c.created_date ? new Date(c.created_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); setExpandedRow(expandedRow === c.id ? null : c.id); }} className="text-[#002443]/50">
                          <ChevronDown className={`w-4 h-4 transition-transform ${expandedRow === c.id ? 'rotate-180' : ''}`} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); setCafModalCase(c); }}
                          className="text-[#2bc196] hover:text-[#2bc196] hover:bg-[#2bc196]/10"
                          title="Gerar link para o cliente"
                        >
                          <Link2 className="w-4 h-4 mr-1" /> Gerar Link
                        </Button>
                        <Link to={createPageUrl('AnaliseDeCasos') + `?id=${c.id}`}>
                          <Button variant="ghost" size="sm" className="text-[var(--pagsmile-green)] hover:text-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/10">
                            <Eye className="w-4 h-4 mr-1" /> Analisar
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild><Link to={createPageUrl('AnaliseDeCasos') + `?id=${c.id}`}><Eye className="w-4 h-4 mr-2" />Ver Detalhes</Link></DropdownMenuItem>
                            <DropdownMenuItem asChild><Link to={createPageUrl('AnaliseDeCasos') + `?id=${c.id}`}><FileText className="w-4 h-4 mr-2" />Ver Respostas</Link></DropdownMenuItem>
                            {merchant?.email && (<DropdownMenuItem asChild><a href={`mailto:${merchant.email}`}><Mail className="w-4 h-4 mr-2" />Enviar E-mail</a></DropdownMenuItem>)}
                            <RevalidateMenuItem caseData={c} />
                            <DropdownMenuItem onClick={() => setCafModalCase(c)}>
                              <ScanFace className="w-4 h-4 mr-2" /> Gerar Link Cliente
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedRow === c.id && (
                    <TableRow className="bg-[#f4f4f4]/50">
                      <TableCell colSpan={13} className="p-4">
                        <CaseExpandedDetail caseData={c} scoresMap={scoresMap} templatesMap={templatesMap} merchantMap={merchantMap} />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      )}
      
      {/* Paginação */}
      {filteredCasesCount > 0 && (
        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
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

      {/* Modal para gerar link do cliente */}
      <CafLinkGeneratorModal
        open={!!cafModalCase}
        onOpenChange={(o) => { if (!o) setCafModalCase(null); }}
        caseData={cafModalCase}
        merchant={cafModalCase ? merchantMap[cafModalCase.merchantId] : null}
      />
    </div>
  );
}