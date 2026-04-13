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
  Image, File, FileCheck, Building2, User, ChevronRight, Shield, Upload
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import DocumentViewerModal from '@/components/compliance/DocumentViewerModal';
import RejectReasonsDialog from '@/components/compliance/RejectReasonsDialog';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function GestaoDocumentos() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [viewerDoc, setViewerDoc] = useState(null);
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
      toast.success(t('gd.doc_updated'));
      setSelectedDoc(null);
      setShowRejectDialog(false);
    },
    onError: (error) => {
      toast.error(t('gd.error_update') + error.message);
    }
  });

  const handleApprove = (doc) => {
    updateDocMutation.mutate({
      docId: doc.id,
      data: { validationStatus: 'Validado', validationNotes: 'Aprovado pelo analista' }
    });
  };

  const handleReject = (reason) => {
    updateDocMutation.mutate({
      docId: selectedDoc.id,
      data: { validationStatus: 'Rejeitado', validationNotes: reason }
    });
  };

  const openViewer = (doc) => {
    setViewerDoc(doc);
    setShowViewerModal(true);
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
    return <File className="w-5 h-5 text-[var(--pagsmile-blue)]/70" />;
  };

  const getMerchantStatusColor = (stats) => {
    if (stats.pendente > 0) return 'border-l-yellow-500';
    if (stats.rejeitado > 0) return 'border-l-red-500';
    return 'border-l-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10">
              <FileText className="w-6 h-6 text-[#5cf7cf]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('gd.title')}</h1>
              <p className="text-white/60 text-sm mt-1">{t('gd.subtitle')}</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => refetch()} className="border-white/20 text-white hover:bg-white/10 rounded-xl bg-transparent">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t('gd.refresh')}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { key: 'all', label: t('gd.merchants'), value: globalStats.merchants, color: 'text-[#002443]', border: 'border-[#2bc196]', ring: 'ring-[#2bc196]/20' },
          { key: 'all2', label: t('gd.total_docs'), value: globalStats.total, color: 'text-blue-600', border: 'border-blue-500', ring: 'ring-blue-500/20' },
          { key: 'Pendente', label: t('gd.pending'), value: globalStats.pendente, color: 'text-yellow-600', border: 'border-yellow-500', ring: 'ring-yellow-500/20' },
          { key: 'Validado', label: t('gd.validated'), value: globalStats.validado, color: 'text-green-600', border: 'border-green-500', ring: 'ring-green-500/20' },
          { key: 'Rejeitado', label: t('gd.rejected'), value: globalStats.rejeitado, color: 'text-red-600', border: 'border-red-500', ring: 'ring-red-500/20' },
        ].map(s => (
          <button
            key={s.key}
            onClick={() => setStatusFilter(s.key === 'all2' ? 'all' : s.key)}
            className={`bg-white rounded-2xl border p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5 ${
              (statusFilter === s.key || (statusFilter === 'all' && s.key === 'all')) ? `${s.border} ring-2 ${s.ring}` : 'border-[#002443]/5'
            }`}
          >
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-[#282828]/50">{s.label}</p>
          </button>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-2 flex-wrap items-center">
            <Filter className="w-4 h-4 text-[var(--pagsmile-blue)]/50" />
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={t('gd.filter_status')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('gd.all_statuses')}</SelectItem>
                <SelectItem value="Pendente">{t('gd.with_pending')}</SelectItem>
                <SelectItem value="Validado">{t('gd.with_validated')}</SelectItem>
                <SelectItem value="Rejeitado">{t('gd.with_rejected')}</SelectItem>
              </SelectContent>
            </Select>

            {statusFilter !== 'all' && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                {t('gd.clear_filter')}
              </Button>
            )}
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pagsmile-blue)]/50" />
            <Input
              placeholder={t('gd.search_placeholder')}
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
            <FileCheck className="w-12 h-12 mx-auto text-[var(--pagsmile-blue)]/40 mb-4" />
            <p className="text-[var(--pagsmile-blue)]/70">{t('gd.no_merchant')}</p>
          </div>
        ) : (
          <Accordion type="multiple" className="space-y-3">
            {filteredMerchants.map((item) => (
              <AccordionItem 
                key={item.merchant?.id || 'unknown'} 
                value={item.merchant?.id || 'unknown'}
                className={`bg-white rounded-xl border border-slate-200 border-l-4 ${getMerchantStatusColor(item.stats)} overflow-hidden`}
              >
                <AccordionTrigger className="px-4 py-4 hover:no-underline hover:bg-[#f4f4f4]/50">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${item.merchant?.type === 'PJ' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                        {item.merchant?.type === 'PJ' ? (
                          <Building2 className="w-5 h-5 text-purple-600" />
                        ) : (
                          <User className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-[#002443]">
                          {item.merchant?.fullName || t('gd.unknown_merchant')}
                        </p>
                        <p className="text-sm text-[#282828]/50">
                          {item.merchant?.cpfCnpj || '-'} 
                          {item.merchant?.type && <span className="ml-2">• {item.merchant.type}</span>}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      {/* Progress indicator */}
                      <div className="hidden md:flex items-center gap-2 min-w-[120px]">
                        <Progress 
                          value={item.stats.total > 0 ? (item.stats.validado / item.stats.total) * 100 : 0} 
                          className="h-2 w-20"
                        />
                        <span className="text-[10px] text-[#282828]/40 font-medium whitespace-nowrap">
                          {item.stats.validado}/{item.stats.total}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm">
                        {item.stats.pendente > 0 && (
                          <Badge className="bg-yellow-100 text-yellow-800 border-0">
                            {t('gd.pending_count', { count: item.stats.pendente })}
                          </Badge>
                        )}
                        {item.stats.rejeitado > 0 && (
                          <Badge className="bg-red-100 text-red-800 border-0">
                            {t('gd.rejected_count', { count: item.stats.rejeitado })}
                          </Badge>
                        )}
                        {item.stats.pendente === 0 && item.stats.rejeitado === 0 && (
                          <Badge className="bg-green-100 text-green-800 border-0">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            {t('gd.complete')}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                
                <AccordionContent className="px-4 pb-4">
                  <div className="border-t border-[#002443]/5 pt-4 space-y-2">
                    {item.documents.map((doc) => {
                      const statusColor = 
                        doc.validationStatus === 'Validado' ? 'border-l-green-500' :
                        doc.validationStatus === 'Rejeitado' ? 'border-l-red-500' :
                        'border-l-yellow-500';
                      return (
                        <div 
                          key={doc.id} 
                          className={`flex items-center justify-between p-3 bg-[#f4f4f4] rounded-xl hover:bg-[#f4f4f4]/80 transition-colors border-l-[3px] ${statusColor}`}
                        >
                          <div className="flex items-center gap-3 cursor-pointer" onClick={() => openViewer(doc)}>
                            <div className="p-2 bg-white rounded-lg border border-[#002443]/5">
                              {getFileIcon(doc.fileType)}
                            </div>
                            <div>
                              <p className="font-medium text-[#002443] text-sm">{doc.documentName || t('gd.document')}</p>
                              <p className="text-xs text-[#282828]/40">
                                {doc.fileName} • {doc.uploadDate ? new Date(doc.uploadDate).toLocaleDateString('pt-BR') : 
                                 doc.created_date ? new Date(doc.created_date).toLocaleDateString('pt-BR') : '-'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {getStatusBadge(doc.validationStatus)}
                            
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openViewer(doc)} className="text-[#002443]/50 hover:text-[#002443]">
                                <Eye className="w-4 h-4" />
                              </Button>
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
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      {/* Document Viewer Modal */}
      <DocumentViewerModal
        open={showViewerModal}
        onOpenChange={setShowViewerModal}
        document={viewerDoc}
        onApprove={(doc) => {
          handleApprove(doc);
          setShowViewerModal(false);
        }}
        onReject={(doc) => {
          setSelectedDoc(doc);
          setShowViewerModal(false);
          setShowRejectDialog(true);
        }}
        isPending={updateDocMutation.isPending}
      />

      {/* Reject Reasons Dialog */}
      <RejectReasonsDialog
        open={showRejectDialog}
        onOpenChange={setShowRejectDialog}
        documentName={selectedDoc?.documentName}
        onConfirm={handleReject}
        isPending={updateDocMutation.isPending}
      />
    </div>
  );
}