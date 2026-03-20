import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Clock, Copy, Search, Loader2, FileEdit, CheckCircle2,
  Mail, ExternalLink, RefreshCw, ChevronLeft, ChevronRight,
  Inbox
} from 'lucide-react';
import { toast } from 'sonner';

const MODEL_LABELS = {
  pix: { label: 'Pix', color: 'bg-blue-100 text-blue-700' },
  lite: { label: 'Lite', color: 'bg-teal-100 text-teal-700' },
  saas: { label: 'SaaS', color: 'bg-violet-100 text-violet-700' },
  ecommerce: { label: 'E-commerce', color: 'bg-amber-100 text-amber-700' },
  merchant: { label: 'Merchant', color: 'bg-purple-100 text-purple-700' },
  gateway: { label: 'Gateway', color: 'bg-indigo-100 text-indigo-700' },
  marketplace: { label: 'Marketplace', color: 'bg-pink-100 text-pink-700' },
  full_kyc: { label: 'Full KYC', color: 'bg-purple-100 text-purple-700' },
};

const PHASE_LABELS = {
  questionnaire: { label: 'Questionário', color: 'bg-blue-100 text-blue-700' },
  documents: { label: 'Documentos', color: 'bg-orange-100 text-orange-700' },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-700' },
};

function getResumeUrl(sessionToken) {
  const base = window.location.origin;
  return `${base}/ComplianceResume?session=${sessionToken}`;
}

function getTimeSince(dateStr) {
  if (!dateStr) return '-';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays}d atrás`;
  if (diffHours > 0) return `${diffHours}h atrás`;
  if (diffMin > 0) return `${diffMin}min atrás`;
  return 'Agora';
}

export default function DraftsTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const { data: sessions = [], isLoading, refetch } = useQuery({
    queryKey: ['complianceSessions'],
    queryFn: () => base44.entities.ComplianceSession.filter(
      { status: 'active' },
      '-updated_date',
      500
    ),
  });

  const filteredSessions = sessions.filter(s => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (s.clientName || '').toLowerCase().includes(term) ||
      (s.clientEmail || '').toLowerCase().includes(term) ||
      (s.sessionToken || '').toLowerCase().includes(term) ||
      (s.linkCode || '').toLowerCase().includes(term)
    );
  });

  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const paginated = filteredSessions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const copyLink = (token) => {
    navigator.clipboard.writeText(getResumeUrl(token));
    toast.success('Link copiado para a área de transferência!');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <p className="text-sm text-[var(--pagsmile-blue)]/60">
            {filteredSessions.length} rascunho(s) em andamento
          </p>
        </div>
        <div className="flex gap-2 items-center w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pagsmile-blue)]/50" />
            <Input
              placeholder="Buscar por nome, e-mail ou token..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9"
            />
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" />
          </div>
        ) : paginated.length === 0 ? (
          <div className="text-center py-12">
            <Inbox className="w-12 h-12 mx-auto text-[var(--pagsmile-blue)]/30 mb-4" />
            <p className="text-[var(--pagsmile-blue)]/70 font-medium">Nenhum rascunho encontrado</p>
            <p className="text-sm text-[var(--pagsmile-blue)]/50 mt-1">
              Rascunhos aparecem quando clientes iniciam o questionário sem finalizar
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f4f4f4]">
                <TableHead className="w-[250px]">Cliente</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Fase Atual</TableHead>
                <TableHead className="text-center">Etapa</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.map((s) => {
                const model = MODEL_LABELS[s.templateModel] || MODEL_LABELS[s.flowType] || { label: s.templateModel || s.flowType, color: 'bg-slate-100 text-slate-700' };
                const phase = PHASE_LABELS[s.currentPhase] || PHASE_LABELS.questionnaire;

                return (
                  <TableRow key={s.id} className="hover:bg-[#f4f4f4] transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-amber-100">
                          <FileEdit className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[var(--pagsmile-blue)] truncate">
                            {s.clientName || 'Sem nome'}
                          </p>
                          <p className="text-xs text-[var(--pagsmile-blue)]/60 truncate">
                            {s.clientEmail || 'E-mail não informado'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${model.color} text-xs font-medium border-0`}>
                        {model.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${phase.color} text-xs font-medium border-0`}>
                        {phase.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-sm font-semibold text-[var(--pagsmile-blue)]">
                        {s.currentStep || 1}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-[var(--pagsmile-blue)]/70">
                        <Clock className="w-3.5 h-3.5" />
                        {getTimeSince(s.lastAccessDate || s.updated_date)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-[var(--pagsmile-blue)]">
                        {s.created_date ? new Date(s.created_date).toLocaleDateString('pt-BR') : '-'}
                      </p>
                      <p className="text-xs text-[var(--pagsmile-blue)]/50">
                        {s.created_date ? new Date(s.created_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyLink(s.sessionToken)}
                          className="gap-1.5 text-xs"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copiar Link
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(getResumeUrl(s.sessionToken), '_blank')}
                          className="text-[var(--pagsmile-green)] hover:text-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/10 gap-1.5 text-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Abrir
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {filteredSessions.length > itemsPerPage && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-[var(--pagsmile-blue)]/70">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredSessions.length)} de {filteredSessions.length}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-[var(--pagsmile-blue)]/80">
                {currentPage} de {totalPages || 1}
              </span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}