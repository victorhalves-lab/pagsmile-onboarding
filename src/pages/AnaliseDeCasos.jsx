import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  ArrowLeft, User, Building2, FileText, Shield, 
  CheckCircle2, XCircle, AlertTriangle, Clock,
  Loader2, Eye, Download, RefreshCw, Mail, History,
  ExternalLink, Phone, MapPin, Calendar, CreditCard,
  FileCheck, UserCheck, Building, Briefcase, Scale,
  Users, Globe, Receipt, Brain
} from 'lucide-react';
import { toast } from 'sonner';
import IAAnalysisPanel from '../components/compliance/IAAnalysisPanel';
import ComplianceResponsesPanel from '../components/compliance/ComplianceResponsesPanel';

export default function AnaliseDeCasos() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get('id');

  const [reviewComments, setReviewComments] = useState('');
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRequestInfoDialog, setShowRequestInfoDialog] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: onboardingCase, isLoading: caseLoading, refetch: refetchCase } = useQuery({
    queryKey: ['onboardingCase', caseId],
    queryFn: () => base44.entities.OnboardingCase.filter({ id: caseId }),
    enabled: !!caseId,
    select: (data) => data[0]
  });

  const { data: merchant } = useQuery({
    queryKey: ['merchant', onboardingCase?.merchantId],
    queryFn: () => base44.entities.Merchant.filter({ id: onboardingCase.merchantId }),
    enabled: !!onboardingCase?.merchantId,
    select: (data) => data[0]
  });

  const { data: responses = [] } = useQuery({
    queryKey: ['responses', caseId],
    queryFn: () => base44.entities.QuestionnaireResponse.filter({ onboardingCaseId: caseId }),
    enabled: !!caseId
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['documents', caseId],
    queryFn: () => base44.entities.DocumentUpload.filter({ onboardingCaseId: caseId }),
    enabled: !!caseId
  });

  const { data: validations = [] } = useQuery({
    queryKey: ['validations', caseId],
    queryFn: () => base44.entities.ExternalValidationResult.filter({ onboardingCaseId: caseId }),
    enabled: !!caseId
  });

  const { data: complianceScore } = useQuery({
    queryKey: ['complianceScore', caseId],
    queryFn: () => base44.entities.ComplianceScore.filter({ onboarding_case_id: caseId }),
    enabled: !!caseId,
    select: (data) => data[0]
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['auditLogs', caseId],
    queryFn: () => base44.entities.AuditLog.filter({ entityId: caseId }, '-changeDate', 50),
    enabled: !!caseId
  });

  // Mutation para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, comments }) => {
      // Atualizar OnboardingCase
      await base44.entities.OnboardingCase.update(caseId, {
        status,
        manualReviewComments: comments,
        manualReviewerId: user?.email,
        manualReviewDate: new Date().toISOString(),
        finalDecisionDate: status !== 'Pendente' ? new Date().toISOString() : null
      });

      // Atualizar Merchant
      if (merchant) {
        await base44.entities.Merchant.update(merchant.id, {
          onboardingStatus: status
        });
      }

      // Criar registro de auditoria
      await base44.entities.AuditLog.create({
        entityName: 'OnboardingCase',
        entityId: caseId,
        actionType: status === 'Aprovado' ? 'APPROVAL' : status === 'Recusado' ? 'REJECTION' : 'UPDATE',
        actionDescription: `Status alterado para ${status}${comments ? ': ' + comments : ''}`,
        changedBy: user?.email,
        changeDate: new Date().toISOString(),
        details: { previousStatus: onboardingCase?.status, newStatus: status }
      });
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['onboardingCase'] });
      queryClient.invalidateQueries({ queryKey: ['merchant'] });
      queryClient.invalidateQueries({ queryKey: ['auditLogs'] });
      toast.success(`Caso ${status === 'Aprovado' ? 'aprovado' : status === 'Recusado' ? 'recusado' : 'atualizado'} com sucesso!`);
      setShowApproveDialog(false);
      setShowRejectDialog(false);
      setShowRequestInfoDialog(false);
      setReviewComments('');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar: ' + error.message);
    }
  });

  const handleApprove = () => {
    updateStatusMutation.mutate({ status: 'Aprovado', comments: reviewComments });
  };

  const handleReject = () => {
    updateStatusMutation.mutate({ status: 'Recusado', comments: reviewComments });
  };

  const handleRequestInfo = () => {
    updateStatusMutation.mutate({ status: 'Manual', comments: reviewComments });
  };

  const getStatusBadge = (status) => {
    const config = {
      'Pendente': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      'Em Processamento': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Loader2 },
      'Aprovado': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
      'Manual': { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle },
      'Recusado': { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle }
    };
    const { color, icon: Icon } = config[status] || config['Pendente'];
    return (
      <Badge className={`${color} gap-1 text-sm px-3 py-1 border`}>
        <Icon className="w-4 h-4" />
        {status}
      </Badge>
    );
  };

  const getValidationStatusBadge = (status) => {
    const colors = {
      'Sucesso': 'bg-green-100 text-green-800',
      'Falha': 'bg-red-100 text-red-800',
      'Pendente': 'bg-yellow-100 text-yellow-800',
      'Erro': 'bg-red-100 text-red-800'
    };
    return <Badge className={colors[status] || colors['Pendente']}>{status}</Badge>;
  };

  // Agrupar respostas por seção
  const groupedResponses = responses.reduce((acc, response) => {
    const section = response.questionText?.split(' - ')[0] || 'Geral';
    if (!acc[section]) acc[section] = [];
    acc[section].push(response);
    return acc;
  }, {});

  if (caseLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" />
      </div>
    );
  }

  if (!onboardingCase) {
    return (
      <div className="text-center py-12">
        <p className="text-[var(--pagsmile-blue)]/70 font-medium">Caso não encontrado</p>
        <Button variant="outline" onClick={() => navigate(createPageUrl('AdminDashboard'))} className="mt-4">
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div>
          <Button
            variant="ghost"
            onClick={() => navigate(createPageUrl('AdminDashboard'))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${
              merchant?.type === 'PF' ? 'bg-blue-100' : 'bg-purple-100'
            }`}>
              {merchant?.type === 'PF' ? (
                <User className="w-6 h-6 text-blue-600" />
              ) : (
                <Building2 className="w-6 h-6 text-purple-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[var(--pagsmile-blue)]">
                {merchant?.fullName || 'Merchant'}
              </h1>
              <p className="text-[var(--pagsmile-blue)]/70 font-medium">{merchant?.cpfCnpj || '-'}</p>
              <p className="text-sm text-[var(--pagsmile-blue)]/60 font-medium mt-1">
                Criado em {onboardingCase.created_date ? new Date(onboardingCase.created_date).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                }) : '-'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          {getStatusBadge(onboardingCase.status)}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => refetchCase()}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Atualizar
            </Button>
            {merchant?.email && (
              <Button variant="outline" size="sm" asChild>
                <a href={`mailto:${merchant.email}`}>
                  <Mail className="w-4 h-4 mr-1" />
                  E-mail
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Score */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--pagsmile-blue)]/70 font-semibold">Score de Risco</p>
              <p className={`text-3xl font-bold ${
                (complianceScore?.score || onboardingCase.riskScore || 0) >= 75 ? 'text-green-600' :
                (complianceScore?.score || onboardingCase.riskScore || 0) >= 40 ? 'text-orange-600' : 'text-red-600'
              }`}>
                {complianceScore?.score || onboardingCase.riskScore || '-'}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${
              (complianceScore?.score || onboardingCase.riskScore || 0) >= 75 ? 'bg-green-100' :
              (complianceScore?.score || onboardingCase.riskScore || 0) >= 40 ? 'bg-orange-100' : 'bg-red-100'
            }`}>
              <Scale className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Validações */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--pagsmile-blue)]/70 font-semibold">Validações</p>
              <p className="text-3xl font-bold text-[var(--pagsmile-blue)]">
                {validations.filter(v => v.status === 'Sucesso').length}/{validations.length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-blue-100">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Documentos */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--pagsmile-blue)]/70 font-semibold">Documentos</p>
              <p className="text-3xl font-bold text-[var(--pagsmile-blue)]">
                {documents.filter(d => d.validationStatus === 'Validado').length}/{documents.length}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-purple-100">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Respostas */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[var(--pagsmile-blue)]/70 font-semibold">Respostas</p>
              <p className="text-3xl font-bold text-[var(--pagsmile-blue)]">{responses.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-teal-100">
              <FileCheck className="w-6 h-6 text-teal-600" />
            </div>
          </div>
        </div>
      </div>



      {/* Tabs */}
      <Tabs defaultValue="ia-analysis" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 flex-wrap h-auto p-1">
          <TabsTrigger value="ia-analysis" className="gap-1">
            <Brain className="w-4 h-4" />
            Análise IA
          </TabsTrigger>
          <TabsTrigger value="info" className="gap-1">
            <User className="w-4 h-4" />
            Merchant
          </TabsTrigger>
          <TabsTrigger value="responses" className="gap-1">
            <FileCheck className="w-4 h-4" />
            Respostas ({responses.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1">
            <FileText className="w-4 h-4" />
            Documentos ({documents.length})
          </TabsTrigger>
          <TabsTrigger value="validations" className="gap-1">
            <Shield className="w-4 h-4" />
            Validações ({validations.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1">
            <History className="w-4 h-4" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="review" className="gap-1">
            <UserCheck className="w-4 h-4" />
            Revisão
          </TabsTrigger>
        </TabsList>

        {/* Análise da IA */}
        <TabsContent value="ia-analysis">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <IAAnalysisPanel complianceScore={complianceScore} onboardingCase={onboardingCase} />
          </div>
        </TabsContent>

        {/* Dados do Merchant */}
        <TabsContent value="info">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-[var(--pagsmile-blue)] mb-6">Informações do Merchant</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { label: 'Tipo', value: merchant?.type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica', icon: merchant?.type === 'PF' ? User : Building2 },
                { label: 'CPF/CNPJ', value: merchant?.cpfCnpj || '-', icon: Receipt },
                { label: 'Nome/Razão Social', value: merchant?.fullName || '-', icon: User },
                { label: 'Nome Fantasia', value: merchant?.companyName || '-', icon: Building },
                { label: 'E-mail', value: merchant?.email || '-', icon: Mail },
                { label: 'Telefone', value: merchant?.phone || '-', icon: Phone },
                { label: 'Serviços de Pagamento', value: merchant?.paymentServices?.join(', ') || '-', icon: CreditCard },
                { label: 'Data de Nascimento', value: merchant?.dateOfBirth ? new Date(merchant.dateOfBirth).toLocaleDateString('pt-BR') : '-', icon: Calendar },
                { label: 'Nacionalidade', value: merchant?.nationality || '-', icon: Globe },
                { label: 'Nome da Mãe', value: merchant?.motherName || '-', icon: Users },
                { label: 'Data de Cadastro', value: merchant?.created_date ? new Date(merchant.created_date).toLocaleDateString('pt-BR') : '-', icon: Calendar }
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-[var(--pagsmile-blue)]/50" />
                      <p className="text-sm text-[var(--pagsmile-blue)]/70 font-semibold">{item.label}</p>
                    </div>
                    <p className="font-semibold text-[var(--pagsmile-blue)]">{item.value}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Respostas do Questionário */}
        <TabsContent value="responses">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-[var(--pagsmile-blue)] mb-6">Respostas do Questionário</h3>
            <ComplianceResponsesPanel caseId={caseId} />
          </div>
        </TabsContent>

        {/* Documentos */}
        <TabsContent value="documents">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-[var(--pagsmile-blue)] mb-6">Documentos Enviados</h3>
            {documents.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-[var(--pagsmile-blue)]/70 font-medium">Nenhum documento enviado</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-lg border border-slate-200">
                        <FileText className="w-6 h-6 text-[var(--pagsmile-blue)]/70" />
                      </div>
                      <div>
                        <p className="font-semibold text-[var(--pagsmile-blue)]">{doc.documentName || doc.fileName}</p>
                        <p className="text-sm text-[var(--pagsmile-blue)]/70 font-medium">
                          {doc.fileType} • {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : '-'}
                        </p>
                        {doc.uploadDate && (
                          <p className="text-xs text-[var(--pagsmile-blue)]/60 font-medium mt-1">
                            Enviado em {new Date(doc.uploadDate).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={
                        doc.validationStatus === 'Validado' ? 'bg-green-100 text-green-800' :
                        doc.validationStatus === 'Rejeitado' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {doc.validationStatus || 'Pendente'}
                      </Badge>
                      {doc.fileUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Validações Externas */}
        <TabsContent value="validations">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-[var(--pagsmile-blue)] mb-6">Validações Externas</h3>
            {validations.length === 0 ? (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-[var(--pagsmile-blue)]/70 font-medium">Nenhuma validação realizada</p>
              </div>
            ) : (
              <div className="space-y-4">
                {validations.map((validation, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          validation.provider === 'BigDataCorp' ? 'bg-blue-100' :
                          validation.provider === 'CAF' ? 'bg-purple-100' : 'bg-teal-100'
                        }`}>
                          <Shield className={`w-5 h-5 ${
                            validation.provider === 'BigDataCorp' ? 'text-blue-600' :
                            validation.provider === 'CAF' ? 'text-purple-600' : 'text-teal-600'
                          }`} />
                        </div>
                        <div>
                          <span className="font-semibold text-[var(--pagsmile-blue)]">{validation.provider}</span>
                          <p className="text-sm text-[var(--pagsmile-blue)]/70 font-medium">{validation.validationType}</p>
                        </div>
                      </div>
                      {getValidationStatusBadge(validation.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-slate-100">
                      {validation.score !== undefined && (
                        <div>
                          <p className="text-xs text-[var(--pagsmile-blue)]/70 font-semibold">Score</p>
                          <p className="font-semibold text-[var(--pagsmile-blue)]">{validation.score}</p>
                        </div>
                      )}
                      {validation.responseTime && (
                        <div>
                          <p className="text-xs text-[var(--pagsmile-blue)]/70 font-semibold">Tempo de Resposta</p>
                          <p className="font-semibold text-[var(--pagsmile-blue)]">{validation.responseTime}ms</p>
                        </div>
                      )}
                      {validation.timestamp && (
                        <div>
                          <p className="text-xs text-[var(--pagsmile-blue)]/70 font-semibold">Data</p>
                          <p className="font-semibold text-[var(--pagsmile-blue)]">
                            {new Date(validation.timestamp).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}
                    </div>

                    {validation.errorMessage && (
                      <Alert className="mt-3 bg-red-50 border-red-200">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          {validation.errorMessage}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="history">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-[var(--pagsmile-blue)] mb-6">Histórico de Alterações</h3>
            {auditLogs.length === 0 ? (
              <div className="text-center py-12">
                <History className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-[var(--pagsmile-blue)]/70 font-medium">Nenhum registro de histórico</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>
                <div className="space-y-4">
                  {auditLogs.map((log, idx) => (
                    <div key={idx} className="relative pl-10">
                      <div className={`absolute left-2 w-5 h-5 rounded-full border-2 border-white ${
                        log.actionType === 'APPROVAL' ? 'bg-green-500' :
                        log.actionType === 'REJECTION' ? 'bg-red-500' :
                        log.actionType === 'CREATE' ? 'bg-blue-500' : 'bg-slate-400'
                      }`}></div>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-[var(--pagsmile-blue)]">{log.actionDescription}</p>
                            <p className="text-sm text-[var(--pagsmile-blue)]/70 font-medium mt-1">
                              Por {log.changedBy}
                            </p>
                          </div>
                          <span className="text-xs text-[var(--pagsmile-blue)]/60 font-medium">
                            {log.changeDate ? new Date(log.changeDate).toLocaleDateString('pt-BR', {
                              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                            }) : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Revisão Manual */}
        <TabsContent value="review">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <h3 className="text-lg font-bold text-[var(--pagsmile-blue)]">Revisão Manual</h3>
            
            {onboardingCase.manualReviewComments && (
              <Alert className="bg-slate-50 border-slate-200">
                <AlertDescription>
                  <p className="font-semibold text-[var(--pagsmile-blue)] mb-1">Comentário anterior:</p>
                  <p className="text-[var(--pagsmile-blue)]/80 font-medium">{onboardingCase.manualReviewComments}</p>
                  {onboardingCase.manualReviewerId && (
                    <p className="text-xs text-[var(--pagsmile-blue)]/60 font-medium mt-2">
                      Por {onboardingCase.manualReviewerId} em {onboardingCase.manualReviewDate ? 
                        new Date(onboardingCase.manualReviewDate).toLocaleDateString('pt-BR') : '-'}
                    </p>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {onboardingCase.status !== 'Aprovado' && onboardingCase.status !== 'Recusado' && (
              <>
                <div className="space-y-2">
                  <Label>Comentários da Revisão</Label>
                  <Textarea 
                    placeholder="Adicione comentários sobre este caso..."
                    rows={4}
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={() => setShowApproveDialog(true)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Aprovar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowRequestInfoDialog(true)}
                    className="flex-1"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Solicitar Informações
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowRejectDialog(true)}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Recusar
                  </Button>
                </div>
              </>
            )}

            {(onboardingCase.status === 'Aprovado' || onboardingCase.status === 'Recusado') && (
              <Alert className={onboardingCase.status === 'Aprovado' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}>
                {onboardingCase.status === 'Aprovado' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className={onboardingCase.status === 'Aprovado' ? 'text-green-800' : 'text-red-800'}>
                  Este caso foi {onboardingCase.status === 'Aprovado' ? 'aprovado' : 'recusado'} 
                  {onboardingCase.finalDecisionDate ? ` em ${new Date(onboardingCase.finalDecisionDate).toLocaleDateString('pt-BR')}` : ''}.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de Aprovação */}
      <Dialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Confirmar Aprovação
            </DialogTitle>
            <DialogDescription>
              Você está prestes a aprovar o caso de onboarding de <strong>{merchant?.fullName}</strong>.
              Esta ação será registrada no histórico.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Comentários (opcional)</Label>
            <Textarea 
              placeholder="Adicione um comentário sobre a aprovação..."
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApproveDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleApprove}
              disabled={updateStatusMutation.isPending}
              className="bg-green-600 hover:bg-green-700"
            >
              {updateStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar Aprovação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Recusa */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Confirmar Recusa
            </DialogTitle>
            <DialogDescription>
              Você está prestes a recusar o caso de onboarding de <strong>{merchant?.fullName}</strong>.
              Esta ação será registrada no histórico.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Motivo da recusa <span className="text-red-500">*</span></Label>
            <Textarea 
              placeholder="Informe o motivo da recusa..."
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleReject}
              disabled={updateStatusMutation.isPending || !reviewComments}
              variant="destructive"
            >
              {updateStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Confirmar Recusa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Solicitar Informações */}
      <Dialog open={showRequestInfoDialog} onOpenChange={setShowRequestInfoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Solicitar Informações Adicionais
            </DialogTitle>
            <DialogDescription>
              O caso será marcado como "Manual" e o merchant será notificado para enviar informações adicionais.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label>Quais informações são necessárias? <span className="text-red-500">*</span></Label>
            <Textarea 
              placeholder="Descreva as informações ou documentos necessários..."
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              className="mt-2"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestInfoDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleRequestInfo}
              disabled={updateStatusMutation.isPending || !reviewComments}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {updateStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}