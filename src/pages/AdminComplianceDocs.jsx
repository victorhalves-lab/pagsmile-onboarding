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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  FileText, Search, RefreshCw, Loader2,
  Eye, Filter, CheckCircle2, XCircle, Clock,
  Image, File, FileCheck, Building2, User, ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminComplianceDocs() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
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

  // Agrupar documentos por merchant
  const merchantsWithDocs = React.useMemo(() => {
    const grouped = {};
    
    documents.forEach(doc => {
      const onboardingCase = caseMap[doc.onboardingCaseId];
      const merchantId = onboardingCase?.merchantId;
      
      if (!merchantId) return;
      
      if (!grouped[merchantId]) {
        const merchant = merchantMap[merchantId];
        grouped[merchantId] = {
          merchant,
          documents: [],
          stats: { total: 0, pendente: 0, validado: 0, rejeitado: 0 }
        };
      }
      
      grouped[merchantId].documents.push(doc);
      grouped[merchantId].stats.total++;
      
      if (!doc.validationStatus || doc.validationStatus === 'Pendente') {
        grouped[merchantId].stats.pendente++;
      } else if (doc.validationStatus === 'Validado') {
        grouped[merchantId].stats.validado++;
      } else if (doc.validationStatus === 'Rejeitado') {
        grouped[merchantId].stats.rejeitado++;
      }
    });
    
    return Object.values(grouped);
  }, [documents, caseMap, merchantMap]);

  // Filtrar merchants
  const filteredMerchants = React.useMemo(() => {
    return merchantsWithDocs.filter(item => {
      const matchesSearch = !searchTerm || 
        item.merchant?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.merchant?.cpfCnpj?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.merchant?.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'Pendente' && item.stats.pendente > 0) ||
        (statusFilter === 'Validado' && item.stats.validado > 0) ||
        (statusFilter === 'Rejeitado' && item.stats.rejeitado > 0);
      
      return matchesSearch && matchesStatus;
    });
  }, [merchantsWithDocs, searchTerm, statusFilter]);

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

  const globalStats = React.useMemo(() => ({
    total: documents.length,
    pendente: documents.filter(d => d.validationStatus === 'Pendente' || !d.validationStatus).length,
    validado: documents.filter(d => d.validationStatus === 'Validado').length,
    rejeitado: documents.filter(d => d.validationStatus === 'Rejeitado').length,
    merchants: merchantsWithDocs.length
  }), [documents, merchantsWithDocs]);

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

  const getMerchantStatusColor = (stats) => {
    if (stats.pendente > 0) return 'border-l-yellow-500';
    if (stats.rejeitado > 0) return 'border-l-red-500';
    return 'border-l-green-500';
  };

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
            <p className="text-slate-500">Documentos organizados por merchant</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <button
          onClick={() => setStatusFilter('all')}
          className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md ${
            statusFilter === 'all' ? 'border-[var(--pagsmile-green)] ring-2 ring-[var(--pagsmile-green)]/20' : 'border-slate-200'
          }`}
        >
          <p className="text-2xl font-bold text-slate-800">{globalStats.merchants}</p>
          <p className="text-xs text-slate-500">Merchants</p>
        </button>
        <button
          onClick={() => setStatusFilter('all')}
          className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md border-slate-200`}
        >
          <p className="text-2xl font-bold text-blue-600">{globalStats.total}</p>
          <p className="text-xs text-slate-500">Total Docs</p>
        </button>
        <button
          onClick={() => setStatusFilter('Pendente')}
          className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md ${
            statusFilter === 'Pendente' ? 'border-yellow-500 ring-2 ring-yellow-500/20' : 'border-slate-200'
          }`}
        >
          <p className="text-2xl font-bold text-yellow-600">{globalStats.pendente}</p>
          <p className="text-xs text-slate-500">Pendentes</p>
        </button>
        <button
          onClick={() => setStatusFilter('Validado')}
          className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md ${
            statusFilter === 'Validado' ? 'border-green-500 ring-2 ring-green-500/20' : 'border-slate-200'
          }`}
        >
          <p className="text-2xl font-bold text-green-600">{globalStats.validado}</p>
          <p className="text-xs text-slate-500">Validados</p>
        </button>
        <button
          onClick={() => setStatusFilter('Rejeitado')}
          className={`bg-white rounded-xl border p-4 text-left transition-all hover:shadow-md ${
            statusFilter === 'Rejeitado' ? 'border-red-500 ring-2 ring-red-500/20' : 'border-slate-200'
          }`}
        >
          <p className="text-2xl font-bold text-red-600">{globalStats.rejeitado}</p>
          <p className="text-xs text-slate-500">Rejeitados</p>
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-2 flex-wrap items-center">
            <Filter className="w-4 h-4 text-slate-400" />
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Pendente">Com Pendentes</SelectItem>
                <SelectItem value="Validado">Com Validados</SelectItem>
                <SelectItem value="Rejeitado">Com Rejeitados</SelectItem>
              </SelectContent>
            </Select>

            {statusFilter !== 'all' && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                Limpar filtro
              </Button>
            )}
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou CPF/CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Lista de Merchants com Documentos */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 bg-white rounded-xl border">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" />
          </div>
        ) : filteredMerchants.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <FileCheck className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">Nenhum merchant encontrado</p>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {filteredMerchants.map((item) => (
              <AccordionItem 
                key={item.merchant?.id || 'unknown'} 
                value={item.merchant?.id || 'unknown'}
                className={`bg-white rounded-xl border border-slate-200 border-l-4 ${getMerchantStatusColor(item.stats)} overflow-hidden`}
              >
                <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-slate-50">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-lg bg-slate-100">
                        {item.merchant?.type === 'PJ' ? (
                          <Building2 className="w-5 h-5 text-slate-600" />
                        ) : (
                          <User className="w-5 h-5 text-slate-600" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-slate-800">
                          {item.merchant?.fullName || 'Merchant Desconhecido'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {item.merchant?.cpfCnpj || '-'} 
                          {item.merchant?.type && <span className="ml-2">• {item.merchant.type}</span>}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-slate-500">{item.stats.total} docs</span>
                        {item.stats.pendente > 0 && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-0">
                            {item.stats.pendente} pendente{item.stats.pendente > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {item.stats.rejeitado > 0 && (
                          <Badge className="bg-red-100 text-red-800 border-0">
                            {item.stats.rejeitado} rejeitado{item.stats.rejeitado > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {item.stats.pendente === 0 && item.stats.rejeitado === 0 && (
                          <Badge className="bg-green-100 text-green-800 border-0">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Completo
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-4 pb-4">
                  <div className="border-t border-slate-100 pt-4 space-y-3">
                    {item.documents.map((doc) => (
                      <div 
                        key={doc.id} 
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg border">
                            {getFileIcon(doc.fileType)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{doc.documentName || 'Documento'}</p>
                            <p className="text-xs text-slate-500">
                              {doc.fileName} • {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('pt-BR') : 
                               doc.created_date ? new Date(doc.created_date).toLocaleDateString('pt-BR') : '-'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {getStatusBadge(doc.validationStatus)}
                          
                          <div className="flex items-center gap-1">
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
                                  disabled={updateDocMutation.isPending}
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
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
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