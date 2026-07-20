import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, Loader2, Shield, FileText, CheckCircle2, XCircle, Lock } from 'lucide-react';
import PartnerSlaIndicator from '../components/partner-portal/PartnerSlaIndicator';
import MaskedField from '../components/partner-portal/MaskedField';
import PartnerRecommendationForm from '../components/partner-portal/PartnerRecommendationForm';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ComplianceParceiroDetalhe() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const assignmentId = urlParams.get('id');

  const [recommendationOpen, setRecommendationOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['partner-case-detail', assignmentId],
    queryFn: async () => {
      const res = await base44.functions.invoke('partnerGetCaseDetail', { assignmentId });
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    enabled: !!assignmentId
  });

  if (!assignmentId) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600">Assignment não especificado.</p>
        <Button onClick={() => navigate('/ComplianceParceiro')} className="mt-4">Voltar</Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#1356E2]" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="p-8 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <p className="text-red-600 font-semibold">{error.message}</p>
          <Button onClick={() => navigate('/ComplianceParceiro')} className="mt-4">Voltar</Button>
        </CardContent>
      </Card>
    );
  }

  const { assignment, case: caseData, merchant, responses, complianceScore, integrationLogs, documents, visibilityLevel } = data;

  const canRecommend = ['pending', 'viewed', 'in_review'].includes(assignment.status);

  return (
    <div className="min-h-screen p-4 lg:p-0">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate('/ComplianceParceiro')} className="mb-3 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Voltar
          </Button>

          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-[#0A0A0A]">
                <MaskedField value={assignment.merchantName} level="full" fallback="Cliente sem nome" />
              </h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                <span>CPF/CNPJ: <MaskedField value={assignment.merchantCpfCnpj} level={visibilityLevel} /></span>
                <span>·</span>
                <span>Modelo: <strong>{assignment.caseModel}</strong></span>
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <PartnerSlaIndicator dueDate={assignment.dueDate} status={assignment.status} />
                {assignment.caseRiskScoreV4 != null && (
                  <Badge className="bg-slate-100 text-slate-700 border-slate-200">
                    Score V4: {assignment.caseRiskScoreV4} ({assignment.caseSubfaixa || 'N/A'})
                  </Badge>
                )}
                {visibilityLevel !== 'full' && (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                    <Lock className="w-3 h-3 mr-1" />
                    Visibilidade: {visibilityLevel === 'redacted' ? 'Restrita' : 'Apenas Resumo'}
                  </Badge>
                )}
              </div>
            </div>

            {canRecommend ? (
              <Button onClick={() => setRecommendationOpen(true)} className="bg-[#1356E2] hover:bg-[#1356E2]/90">
                <Send className="w-4 h-4 mr-2" />
                Enviar Parecer
              </Button>
            ) : assignment.partnerRecommendation && (
              <div className="text-right">
                <div className="text-xs text-slate-500 mb-1">Parecer enviado</div>
                <Badge className={
                  assignment.partnerRecommendation === 'approve' ? 'bg-green-100 text-green-700 border-green-200' :
                  assignment.partnerRecommendation === 'reject' ? 'bg-red-100 text-red-700 border-red-200' :
                  'bg-amber-100 text-amber-700 border-amber-200'
                }>
                  {assignment.partnerRecommendation === 'approve' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                  {assignment.partnerRecommendation === 'reject' && <XCircle className="w-3 h-3 mr-1" />}
                  {
                    { approve: 'Aprovado', reject: 'Reprovado', request_docs: 'Docs Solicitados', escalate: 'Escalado' }[assignment.partnerRecommendation]
                  }
                </Badge>
              </div>
            )}
          </div>
        </div>

        {/* Parecer do parceiro (se já enviado) */}
        {assignment.partnerRecommendation && (
          <Card className="mb-6 border-slate-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Parecer enviado em {assignment.partnerReviewedAt ? format(new Date(assignment.partnerReviewedAt), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '—'}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{assignment.partnerComments}</p>
              <div className="text-xs text-slate-400 mt-2">Por: {assignment.partnerReviewerName}</div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            {visibilityLevel !== 'summary_only' && (
              <>
                <TabsTrigger value="responses">Respostas ({responses?.length || 0})</TabsTrigger>
                <TabsTrigger value="documents">Documentos ({documents?.length || 0})</TabsTrigger>
                <TabsTrigger value="integrations">Integrações ({integrationLogs?.length || 0})</TabsTrigger>
              </>
            )}
            <TabsTrigger value="score">Análise de Risco</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Dados do Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <InfoRow label="Nome / Razão Social" value={merchant?.fullName || merchant?.companyName} />
                <InfoRow label="CPF/CNPJ" value={merchant?.cpfCnpj} />
                <InfoRow label="E-mail" value={merchant?.email} />
                <InfoRow label="Telefone" value={merchant?.phone} />
                <InfoRow label="Tipo" value={merchant?.type} />
                <InfoRow label="Red Flags" value={
                  caseData?.redFlags?.length ? caseData.redFlags.join(', ') : 'Nenhuma'
                } />
                <InfoRow label="Status Pin Bank" value={caseData?.status} />
                <InfoRow label="Submetido em" value={
                  caseData?.submissionDate ? format(new Date(caseData.submissionDate), "dd/MM/yyyy HH:mm", { locale: ptBR }) : '—'
                } />
              </CardContent>
            </Card>
          </TabsContent>

          {visibilityLevel !== 'summary_only' && (
            <>
              <TabsContent value="responses">
                <Card>
                  <CardContent className="p-6">
                    {(responses || []).length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">Nenhuma resposta registrada.</p>
                    ) : (
                      <div className="space-y-3">
                        {responses.map(r => (
                          <div key={r.id} className="border-b border-slate-100 pb-3 last:border-b-0">
                            <div className="text-sm font-medium text-[#0A0A0A]">{r.questionText}</div>
                            <div className="text-sm text-slate-600 mt-1">
                              {r.valueText || (r.valueNumber != null ? r.valueNumber : '') ||
                                (r.valueBoolean != null ? (r.valueBoolean ? 'Sim' : 'Não') : '') ||
                                (r.valueArray ? r.valueArray.join(', ') : '—')}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="documents">
                <PartnerDocumentsList documents={documents} assignmentId={assignmentId} />
              </TabsContent>

              <TabsContent value="integrations">
                <Card>
                  <CardContent className="p-6">
                    {(integrationLogs || []).length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">Nenhuma integração registrada.</p>
                    ) : (
                      <div className="space-y-2">
                        {integrationLogs.slice(0, 30).map(l => (
                          <div key={l.id} className="flex items-center justify-between text-sm border-b border-slate-100 pb-2">
                            <div>
                              <div className="font-medium text-[#0A0A0A]">{l.provider} · {l.service_type}</div>
                              <div className="text-xs text-slate-500">{l.status} · {l.created_date ? format(new Date(l.created_date), "dd/MM HH:mm", { locale: ptBR }) : ''}</div>
                            </div>
                            {l.score != null && <Badge className="bg-slate-100 text-slate-700">Score: {l.score}</Badge>}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </>
          )}

          <TabsContent value="score">
            <Card>
              <CardContent className="p-6">
                {complianceScore ? (
                  <div className="space-y-3 text-sm">
                    <InfoRow label="Score Final V4" value={complianceScore.score_final} />
                    <InfoRow label="Subfaixa" value={`${complianceScore.subfaixa} - ${complianceScore.subfaixa_nome || ''}`} />
                    <InfoRow label="Rolling Reserve" value={complianceScore.rolling_reserve_percent ? `${complianceScore.rolling_reserve_percent}%` : '0%'} />
                    <InfoRow label="Monitoramento" value={complianceScore.monitoramento_nivel} />
                    <InfoRow label="Recomendação Pin Bank" value={complianceScore.recomendacao_final} />
                    {complianceScore.sumario_executivo && (
                      <div className="pt-3 border-t border-slate-100">
                        <div className="font-medium text-[#0A0A0A] mb-1">Sumário Executivo</div>
                        <p className="text-slate-600 whitespace-pre-wrap">{complianceScore.sumario_executivo}</p>
                      </div>
                    )}
                    {complianceScore.red_flags?.length > 0 && (
                      <div>
                        <div className="font-medium text-[#0A0A0A] mb-1">Red Flags</div>
                        <ul className="list-disc pl-5 text-slate-600 space-y-0.5">
                          {complianceScore.red_flags.map((f, i) => <li key={i}>{f}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">Score ainda não calculado.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <PartnerRecommendationForm
        open={recommendationOpen}
        onClose={() => setRecommendationOpen(false)}
        assignment={assignment}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['partner-case-detail', assignmentId] })}
      />
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-40 flex-shrink-0 text-slate-500">{label}:</span>
      <span className="flex-1 font-medium text-[#0A0A0A]">{value || '—'}</span>
    </div>
  );
}

function PartnerDocumentsList({ documents, assignmentId }) {
  const [downloading, setDownloading] = useState(null);

  const handleDownload = async (doc) => {
    setDownloading(doc.id);
    try {
      const res = await base44.functions.invoke('partnerDownloadDocument', {
        assignmentId,
        documentId: doc.id
      });
      if (res.data?.url) {
        window.open(res.data.url, '_blank');
      }
    } finally {
      setDownloading(null);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        {(documents || []).length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">Nenhum documento enviado.</p>
        ) : (
          <div className="space-y-2">
            {documents.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#1356E2]" />
                  <div>
                    <div className="font-medium text-sm text-[#0A0A0A]">{d.label || d.fileName || 'Documento'}</div>
                    <div className="text-xs text-slate-500">{d.documentTypeId}</div>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleDownload(d)} disabled={downloading === d.id}>
                  {downloading === d.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Baixar'}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}