import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, User, Building2, FileText, Shield, 
  CheckCircle2, XCircle, AlertTriangle, Clock,
  Loader2, Eye
} from 'lucide-react';

export default function OnboardingCaseDetails() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get('id');

  const { data: onboardingCase, isLoading: caseLoading } = useQuery({
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
    queryFn: () => base44.entities.ComplianceScore.filter({ onboardingCaseId: caseId }),
    enabled: !!caseId,
    select: (data) => data[0]
  });

  const getStatusBadge = (status) => {
    const config = {
      'Pendente': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'Em Processamento': { color: 'bg-blue-100 text-blue-800', icon: Loader2 },
      'Aprovado': { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      'Manual': { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
      'Recusado': { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    const { color, icon: Icon } = config[status] || config['Pendente'];
    return (
      <Badge className={`${color} gap-1 text-sm px-3 py-1`}>
        <Icon className="w-4 h-4" />
        {status}
      </Badge>
    );
  };

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
        <p className="text-slate-500">Caso não encontrado</p>
        <Button variant="outline" onClick={() => navigate(createPageUrl('AdminDashboard'))} className="mt-4">
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
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
              <h1 className="text-2xl font-bold text-slate-800">
                {merchant?.fullName || 'Merchant'}
              </h1>
              <p className="text-slate-500">{merchant?.cpfCnpj || '-'}</p>
            </div>
          </div>
        </div>
        {getStatusBadge(onboardingCase.status)}
      </div>

      {/* Score Card */}
      {complianceScore && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Score de Compliance</h2>
              <p className="text-slate-500 text-sm">Calculado pela IA</p>
            </div>
            <div className="text-right">
              <span className={`text-4xl font-bold ${
                complianceScore.score >= 75 ? 'text-green-600' :
                complianceScore.score >= 40 ? 'text-orange-600' : 'text-red-600'
              }`}>
                {complianceScore.score}
              </span>
              <p className="text-sm text-slate-500">/ 100</p>
            </div>
          </div>
          {complianceScore.iaExplanation && (
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <p className="text-sm text-slate-600">{complianceScore.iaExplanation}</p>
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-6">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="info">Dados do Merchant</TabsTrigger>
          <TabsTrigger value="responses">Respostas ({responses.length})</TabsTrigger>
          <TabsTrigger value="documents">Documentos ({documents.length})</TabsTrigger>
          <TabsTrigger value="validations">Validações ({validations.length})</TabsTrigger>
          <TabsTrigger value="review">Revisão Manual</TabsTrigger>
        </TabsList>

        {/* Dados do Merchant */}
        <TabsContent value="info">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Informações do Merchant</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: 'Tipo', value: merchant?.type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica' },
                { label: 'CPF/CNPJ', value: merchant?.cpfCnpj || '-' },
                { label: 'Nome/Razão Social', value: merchant?.fullName || '-' },
                { label: 'Nome Fantasia', value: merchant?.companyName || '-' },
                { label: 'E-mail', value: merchant?.email || '-' },
                { label: 'Telefone', value: merchant?.phone || '-' },
                { label: 'Serviços', value: merchant?.paymentServices?.join(', ') || '-' },
                { label: 'Data de Cadastro', value: merchant?.created_date ? new Date(merchant.created_date).toLocaleDateString('pt-BR') : '-' }
              ].map(item => (
                <div key={item.label} className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="font-medium text-slate-800">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Respostas do Questionário */}
        <TabsContent value="responses">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Respostas do Questionário</h3>
            {responses.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Nenhuma resposta registrada</p>
            ) : (
              <div className="space-y-3">
                {responses.map((response, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-500">{response.questionText || `Pergunta ${idx + 1}`}</p>
                    <p className="font-medium text-slate-800 mt-1">
                      {response.valueText || response.valueNumber || (response.valueBoolean !== undefined ? (response.valueBoolean ? 'Sim' : 'Não') : '-')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Documentos */}
        <TabsContent value="documents">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Documentos Enviados</h3>
            {documents.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Nenhum documento enviado</p>
            ) : (
              <div className="grid gap-4">
                {documents.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-slate-500" />
                      <div>
                        <p className="font-medium text-slate-800">{doc.documentName || doc.fileName}</p>
                        <p className="text-sm text-slate-500">{doc.fileType}</p>
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
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
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
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Validações Externas</h3>
            {validations.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Nenhuma validação realizada</p>
            ) : (
              <div className="space-y-4">
                {validations.map((validation, idx) => (
                  <div key={idx} className="p-4 border border-slate-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-slate-500" />
                        <span className="font-medium text-slate-800">{validation.provider}</span>
                        <span className="text-sm text-slate-500">- {validation.validationType}</span>
                      </div>
                      <Badge className={
                        validation.status === 'Sucesso' ? 'bg-green-100 text-green-800' :
                        validation.status === 'Falha' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }>
                        {validation.status}
                      </Badge>
                    </div>
                    {validation.score !== undefined && (
                      <p className="text-sm text-slate-600">Score: {validation.score}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Revisão Manual */}
        <TabsContent value="review">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <h3 className="text-lg font-semibold text-slate-800">Revisão Manual</h3>
            
            <div className="space-y-4">
              <div>
                <Label>Comentários da Revisão</Label>
                <Textarea 
                  placeholder="Adicione comentários sobre este caso..."
                  className="mt-2"
                  rows={4}
                  defaultValue={onboardingCase.manualReviewComments || ''}
                />
              </div>

              <div className="flex gap-4">
                <Button className="flex-1 bg-green-600 hover:bg-green-700">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Aprovar
                </Button>
                <Button variant="outline" className="flex-1">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Solicitar Mais Informações
                </Button>
                <Button variant="destructive" className="flex-1">
                  <XCircle className="w-4 h-4 mr-2" />
                  Recusar
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}