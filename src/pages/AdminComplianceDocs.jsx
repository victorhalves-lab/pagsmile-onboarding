import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  FileText, Search, Download, RefreshCw, Loader2,
  Eye, Filter, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, Clock, ExternalLink,
  Image, File, FileCheck
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminComplianceDocs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const itemsPerPage = 15;
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ['allDocuments'],
    queryFn: () => base44.entities.DocumentUpload.list('-created_date', 500)
  });

  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => base44.entities.Merchant.list()
  });

  const { data: onboardingCases = [] } = useQuery({
    queryKey: ['onboardingCases'],
    queryFn: () => base44.entities.OnboardingCase.list()
  });

  const merchantMap = React.useMemo(() => {
    const map = {};
    merchants.forEach(m => { map[m.id] = m; });
    return map;
  }, [merchants]);

  const caseMap = React.useMemo(() => {
    const map = {};
    onboardingCases.forEach(c => { map[c.id] = c; });
    return map;
  }, [onboardingCases]);

  const updateDocMutation = useMutation({
    mutationFn: async ({ docId, data }) => {
      return base44.entities.DocumentUpload.update(docId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allDocuments'] });
      toast.success('Documento atualizado!');
      setSelectedDoc(null);
      setShowRejectDialog(false);
      setRejectReason('');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  });

  const handleApprove = (doc) => {
    updateDocMutation.mutate({
      docId: doc.id,
      data: { validationStatus: 'Validado', validationNotes: 'Aprovado pelo analista' }
    });
  };

  const handleReject = () => {
    if (!rejectReason) {
      toast.error('Informe o motivo da rejeição');
      return;
    }
    updateDocMutation.mutate({
      docId: selectedDoc.id,
      data: { validationStatus: 'Rejeitado', validationNotes: rejectReason }
    });
  };

  const stats = React.useMemo(() => ({
    total: documents.length,
    pendente: documents.filter(d => d.validationStatus === 'Pendente' || !d.validationStatus).length,
    validado: documents.filter(d => d.validationStatus === 'Validado').length,
    rejeitado: documents.filter(d => d.validationStatus === 'Rejeitado').length,
  }), [documents]);

  const documentTypes = [...new Set(documents.map(d => d.documentName).filter(Boolean))];

  const getStatusBadge = (status) => {
    const config = {
      'Validado': { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      'Rejeitado': { color: 'bg-red-100 text-red-800', icon: XCircle },
      'Pendente': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    };
    const c = config[status] || config['Pendente'];
    const Icon = c.icon;
    return (
      <Badge className={`${c.color} gap-1 border-0`}>
        <Icon className="w-3 h-3" />
        {status || 'Pendente'}
      </Badge>
    );
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('image')) return <Image className="w-5 h-5 text-purple-500" />;
    if (fileType?.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    return <File className="w-5 h-5 text-slate-500" />;
  };

  const filteredDocs = React.useMemo(() => {
    return documents.filter(doc => {
      const onboardingCase = caseMap[doc.onboardingCaseId];
      const merchant = onboardingCase ? merchantMap[onboardingCase.merchantId] : null;
      
      const matchesSearch = !searchTerm || 
        doc.documentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        merchant?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'Pendente' && (!doc.validationStatus || doc.validationStatus === 'Pendente')) ||
        doc.validationStatus === statusFilter;
      
      const matchesType = typeFilter === 'all' || doc.documentName === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [documents, searchTerm, statusFilter, typeFilter, caseMap, merchantMap]);

  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage);
  const paginatedDocs = filteredDocs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100">
            <FileText className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Gestão de Documentos</h1>
            <p className="text-slate-500">Todos os documentos enviados pelos merchants</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md ${
            statusFilter === 'all' ? 'border-[var(--pagsmile-green)] ring-2 ring-[var(--pagsmile-green)]/20' : 'border-slate-200'
          }`}
        >
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          <p className="text-xs text-slate-500">Total</p>
        </button>
        <button
          onClick={() => setStatusFilter('Pendente')}
          className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md ${
            statusFilter === 'Pendente' ? 'border-yellow-500 ring-2 ring-yellow-500/20' : 'border-slate-200'
          }`}
        >
          <p className="text-2xl font-bold text-yellow-600">{stats.pendente}</p>
          <p className="text-xs text-slate-500">Pendentes</p>
        </button>
        <button
          onClick={() => setStatusFilter('Validado')}
          className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md ${
            statusFilter === 'Validado' ? 'border-green-500 ring-2 ring-green-500/20' : 'border-slate-200'
          }`}
        >
          <p className="text-2xl font-bold text-green-600">{stats.validado}</p>
          <p className="text-xs text-slate-500">Validados</p>
        </button>
        <button
          onClick={() => setStatusFilter('Rejeitado')}
          className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md ${
            statusFilter === 'Rejeitado' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
          }`}
        >
          <p className="text-2xl font-bold text-red-600">{stats.rejeitado}</p>
          <p className="text-xs text-slate-500">Rejeitados</p>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-2 flex-wrap items-center">
            <Filter className="w-4 h-4 text-slate-400" />
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Tipo de Documento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                {documentTypes.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(statusFilter !== 'all' || typeFilter !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome do documento ou merchant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" />
          </div>
        ) : paginatedDocs.length === 0 ? (
          <div className="text-center py-12">
            <FileCheck className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">Nenhum documento encontrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Documento</TableHead>
                <TableHead>Merchant</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data Upload</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedDocs.map((doc) => {
                const onboardingCase = caseMap[doc.onboardingCaseId];
                const merchant = onboardingCase ? merchantMap[onboardingCase.merchantId] : null;
                return (
                  <TableRow key={doc.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          {getFileIcon(doc.fileType)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{doc.documentName || 'Documento'}</p>
                          <p className="text-xs text-slate-500">{doc.fileName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-slate-800">{merchant?.fullName || '-'}</p>
                      <p className="text-xs text-slate-500">{merchant?.cpfCnpj || ''}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal text-xs">
                        {doc.fileType || '-'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(doc.validationStatus)}</TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('pt-BR') : 
                       doc.created_date ? new Date(doc.created_date).toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {doc.fileUrl && (
                          <Button variant="ghost" size="sm" asChild>
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Eye className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                        {(!doc.validationStatus || doc.validationStatus === 'Pendente') && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleApprove(doc)}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedDoc(doc);
                                setShowRejectDialog(true);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Paginação */}
        {filteredDocs.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredDocs.length)} de {filteredDocs.length} documentos
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-slate-600">
                Página {currentPage} de {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog de Rejeição */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Rejeitar Documento
            </DialogTitle>
            <DialogDescription>
              Informe o motivo da rejeição do documento "{selectedDoc?.documentName}".
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Motivo da Rejeição <span className="text-red-500">*</span></Label>
            <Textarea 
              placeholder="Descreva o motivo da rejeição..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleReject}
              disabled={updateDocMutation.isPending || !rejectReason}
              variant="destructive"
            >
              {updateDocMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Rejeitar Documento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}