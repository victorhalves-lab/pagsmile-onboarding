import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, User, FileCheck, FileText, Shield, History, UserCheck, Brain, Users } from 'lucide-react';
import { toast } from 'sonner';
import IAAnalysisPanel from '../components/compliance/IAAnalysisPanel';
import ComplianceResponsesPanel from '../components/compliance/ComplianceResponsesPanel';
import CaseHeader from '../components/case-analysis/CaseHeader';
import CaseSummaryCards from '../components/case-analysis/CaseSummaryCards';
import CaseMerchantTab from '../components/case-analysis/CaseMerchantTab';
import CaseDocumentsTab from '../components/case-analysis/CaseDocumentsTab';
import CaseValidationsTab from '../components/case-analysis/CaseValidationsTab';
import CaseHistoryTab from '../components/case-analysis/CaseHistoryTab';
import CaseReviewTab from '../components/case-analysis/CaseReviewTab';
import CaseReviewDialogs from '../components/case-analysis/CaseReviewDialogs';
import CaseSubsellersTab from '../components/case-analysis/CaseSubsellersTab';
import CnpjEnrichmentSummaryCard from '../components/case-analysis/CnpjEnrichmentSummaryCard';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function AnaliseDeCasos() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get('id');

  const [reviewComments, setReviewComments] = useState('');
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showRequestInfoDialog, setShowRequestInfoDialog] = useState(false);

  // ── Data Fetching ──
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

  // ── Status Mutation ──
  const updateStatusMutation = useMutation({
    mutationFn: async ({ status, comments }) => {
      await base44.entities.OnboardingCase.update(caseId, {
        status,
        manualReviewComments: comments,
        manualReviewerId: user?.email,
        manualReviewDate: new Date().toISOString(),
        finalDecisionDate: status !== 'Pendente' ? new Date().toISOString() : null
      });
      if (merchant) {
        await base44.entities.Merchant.update(merchant.id, { onboardingStatus: status });
      }
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
      toast.success(status === 'Aprovado' ? t('ac.case_approved') : status === 'Recusado' ? t('ac.case_rejected') : t('ac.case_updated'));
      setShowApproveDialog(false);
      setShowRejectDialog(false);
      setShowRequestInfoDialog(false);
      setReviewComments('');
    },
    onError: (error) => {
      toast.error(t('ac.update_error') + error.message);
    }
  });

  // ── Loading / Not Found ──
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
        <p className="text-[var(--pagsmile-blue)]/70 font-medium">{t('ac.not_found')}</p>
        <Button variant="outline" onClick={() => navigate(createPageUrl('AdminDashboard'))} className="mt-4">
          {t('ac.back_dashboard')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CaseHeader onboardingCase={onboardingCase} merchant={merchant} onRefetch={refetchCase} />

      <CaseSummaryCards
        complianceScore={complianceScore}
        onboardingCase={onboardingCase}
        validations={validations}
        documents={documents}
        responses={responses}
      />

      <Tabs defaultValue="ia-analysis" className="space-y-6">
        <TabsList className="bg-white border border-slate-200 flex-wrap h-auto p-1">
          <TabsTrigger value="ia-analysis" className="gap-1"><Brain className="w-4 h-4" /> {t('ac.tab_ia')}</TabsTrigger>
          <TabsTrigger value="info" className="gap-1"><User className="w-4 h-4" /> {t('ac.tab_merchant')}</TabsTrigger>
          <TabsTrigger value="responses" className="gap-1"><FileCheck className="w-4 h-4" /> {t('ac.tab_responses')} ({responses.length})</TabsTrigger>
          <TabsTrigger value="documents" className="gap-1"><FileText className="w-4 h-4" /> {t('ac.tab_documents')} ({documents.length})</TabsTrigger>
          <TabsTrigger value="validations" className="gap-1"><Shield className="w-4 h-4" /> {t('ac.tab_validations')} ({validations.length})</TabsTrigger>
          <TabsTrigger value="history" className="gap-1"><History className="w-4 h-4" /> {t('ac.tab_history')}</TabsTrigger>
          <TabsTrigger value="review" className="gap-1"><UserCheck className="w-4 h-4" /> {t('ac.tab_review')}</TabsTrigger>
          <TabsTrigger value="subsellers" className="gap-1"><Users className="w-4 h-4" /> {t('ac.tab_subaccounts')}</TabsTrigger>
        </TabsList>

        <TabsContent value="ia-analysis">
          <div className="space-y-4">
            <CnpjEnrichmentSummaryCard 
              complianceScore={complianceScore}
              onboardingCaseId={caseId}
              merchant={merchant}
            />
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <IAAnalysisPanel complianceScore={complianceScore} onboardingCase={onboardingCase} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="info">
          <CaseMerchantTab merchant={merchant} />
        </TabsContent>

        <TabsContent value="responses">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-[var(--pagsmile-blue)] mb-6">{t('ac.questionnaire_responses')}</h3>
            <ComplianceResponsesPanel caseId={caseId} questionnaireTemplateId={onboardingCase?.questionnaireTemplateId} />
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <CaseDocumentsTab documents={documents} caseId={caseId} merchantName={merchant?.fullName} />
        </TabsContent>

        <TabsContent value="validations">
          <div className="space-y-4">
            <CnpjEnrichmentSummaryCard 
              complianceScore={complianceScore}
              onboardingCaseId={caseId}
              merchant={merchant}
            />
            <CaseValidationsTab validations={validations} />
          </div>
        </TabsContent>

        <TabsContent value="history">
          <CaseHistoryTab auditLogs={auditLogs} />
        </TabsContent>

        <TabsContent value="subsellers">
          <CaseSubsellersTab merchantId={merchant?.id} />
        </TabsContent>

        <TabsContent value="review">
          <CaseReviewTab
            onboardingCase={onboardingCase}
            reviewComments={reviewComments}
            setReviewComments={setReviewComments}
            onShowApprove={() => setShowApproveDialog(true)}
            onShowReject={() => setShowRejectDialog(true)}
            onShowRequestInfo={() => setShowRequestInfoDialog(true)}
          />
        </TabsContent>
      </Tabs>

      <CaseReviewDialogs
        merchantName={merchant?.fullName}
        reviewComments={reviewComments}
        setReviewComments={setReviewComments}
        showApproveDialog={showApproveDialog}
        setShowApproveDialog={setShowApproveDialog}
        onApprove={() => updateStatusMutation.mutate({ status: 'Aprovado', comments: reviewComments })}
        showRejectDialog={showRejectDialog}
        setShowRejectDialog={setShowRejectDialog}
        onReject={() => updateStatusMutation.mutate({ status: 'Recusado', comments: reviewComments })}
        showRequestInfoDialog={showRequestInfoDialog}
        setShowRequestInfoDialog={setShowRequestInfoDialog}
        onRequestInfo={() => updateStatusMutation.mutate({ status: 'Manual', comments: reviewComments })}
        isPending={updateStatusMutation.isPending}
      />
    </div>
  );
}