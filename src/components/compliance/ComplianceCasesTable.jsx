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
  Brain, FileText, ChevronLeft, ChevronRight, ChevronDown, UserPlus
} from 'lucide-react';
import CaseExpandedDetail from '@/components/compliance/CaseExpandedDetail';

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
    'lite': { color: 'bg-teal-100 text-teal-700', label: 'Lite' },
    'pix': { color: 'bg-blue-100 text-blue-700', label: 'Pix' },
    'full': { color: 'bg-purple-100 text-purple-700', label: 'Full' },
    'ecommerce': { color: 'bg-amber-100 text-amber-700', label: 'E-commerce' },
    'gateway': { color: 'bg-indigo-100 text-indigo-700', label: 'Gateway' }
  };
  const { color, label } = config[model] || config['full'];
  return <Badge className={`${color} text-xs font-medium border-0`}>{label}</Badge>;
};

const getScoreBadge = (score) => {
  if (score === undefined || score === null) return <span className="text-[var(--pagsmile-blue)]/50">-</span>;
  let colorClass = 'text-red-600 bg-red-50';
  let label = 'Crítico';
  if (score >= 80) { colorClass = 'text-green-600 bg-green-50'; label = 'Baixo Risco'; }
  else if (score >= 50) { colorClass = 'text-orange-600 bg-orange-50'; label = 'Médio Risco'; }
  return (
    <div className="flex items-center gap-2">
      <span className={`font-bold text-lg ${colorClass.split(' ')[0]}`}>{score}</span>
      <span className={`text-xs px-2 py-0.5 rounded-full ${colorClass}`}>{label}</span>
    </div>
  );
};

export default function ComplianceCasesTable({
  paginatedCases, filteredCasesCount, merchantMap, scoresMap, getCaseModel,
  selectedRows, setSelectedRows, expandedRow, setExpandedRow,
  sortField, sortOrder, setSortField, setSortOrder,
  currentPage, setCurrentPage, itemsPerPage, totalPages,
  templatesMap, isLoading, linksMap = {}, introducerMap = {},
}) {
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
              <TableHead className="text-center">Fase 1 (SQ)</TableHead>
              <TableHead className="text-center">Fase 2 (SVE)</TableHead>
              <TableHead className="text-center">
                <button className="flex items-center gap-1 hover:text-[var(--pagsmile-blue)] font-semibold mx-auto"
                  onClick={() => { if (sortField === 'riskScore') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); else { setSortField('riskScore'); setSortOrder('desc'); } }}>
                  <Brain className="w-4 h-4 mr-1" /> Final (SGC) <ArrowUpDown className="w-3 h-3" />
                </button>
              </TableHead>
              <TableHead>Tempo na Fila</TableHead>
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
                      <span className="text-sm font-medium text-[var(--pagsmile-blue)]/80">{scoresMap[c.id]?.score_questionario || '-'}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-medium text-[var(--pagsmile-blue)]/80">{scoresMap[c.id]?.score_validacao_externa || '-'}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center">{getScoreBadge(scoresMap[c.id]?.score_geral_composto || c.riskScore)}</div>
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
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedRow === c.id && (
                    <TableRow className="bg-[#f4f4f4]/50">
                      <TableCell colSpan={12} className="p-4">
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
    </div>
  );
}