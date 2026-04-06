import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, AlertTriangle, ShieldCheck, CheckCircle2, Building2 } from 'lucide-react';
import DynamicDocumentUploader from '@/components/compliance/DynamicDocumentUploader';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function SubsellerDocUpload() {
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get('caseId');

  const [uploading, setUploading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [documents, setDocuments] = useState({});

  // Fetch case
  const { data: onboardingCase, isLoading: caseLoading } = useQuery({
    queryKey: ['doc-upload-case', caseId],
    queryFn: async () => {
      const cases = await base44.entities.OnboardingCase.filter({ id: caseId });
      return cases[0] || null;
    },
    enabled: !!caseId,
  });

  // Fetch merchant
  const { data: merchant } = useQuery({
    queryKey: ['doc-upload-merchant', onboardingCase?.merchantId],
    queryFn: async () => {
      const merchants = await base44.entities.Merchant.filter({ id: onboardingCase.merchantId });
      return merchants[0] || null;
    },
    enabled: !!onboardingCase?.merchantId,
  });

  // Fetch template
  const { data: template } = useQuery({
    queryKey: ['doc-upload-template', onboardingCase?.questionnaireTemplateId],
    queryFn: async () => {
      const templates = await base44.entities.QuestionnaireTemplate.filter({ id: onboardingCase.questionnaireTemplateId });
      return templates[0] || null;
    },
    enabled: !!onboardingCase?.questionnaireTemplateId,
  });

  // Fetch existing documents already uploaded for this case
  const { data: existingDocs = [] } = useQuery({
    queryKey: ['doc-upload-existing', caseId],
    queryFn: () => base44.entities.DocumentUpload.filter({ onboardingCaseId: caseId }),
    enabled: !!caseId,
  });

  // Fetch questionnaire responses — needed to resolve conditional document logic (e.g. segment)
  const { data: responses = [] } = useQuery({
    queryKey: ['doc-upload-responses', caseId],
    queryFn: () => base44.entities.QuestionnaireResponse.filter({ onboardingCaseId: caseId }),
    enabled: !!caseId,
  });

  // Build formData from responses — the DynamicDocumentUploader uses this to filter docs by segment
  const formData = useMemo(() => {
    const data = {};
    responses.forEach(r => {
      const val = r.valueText ?? r.valueNumber ?? r.valueBoolean ?? (r.valueArray?.length > 0 ? r.valueArray : null);
      if (val !== undefined && val !== null) {
        data[r.questionId] = val;
      }
    });
    return data;
  }, [responses]);

  // Detect segment from responses for display
  const segmentResponse = useMemo(() => {
    return responses.find(r => 
      r.questionText?.toLowerCase().includes('segmento') && r.valueText
    );
  }, [responses]);

  // Restore existing docs into local state
  useEffect(() => {
    if (existingDocs.length > 0) {
      const restored = {};
      existingDocs.forEach(d => {
        restored[d.documentTypeId] = {
          url: d.fileUrl,
          name: d.fileName,
          size: d.fileSize,
          type: d.fileType,
          uploadedAt: d.uploadDate,
        };
      });
      setDocuments(prev => {
        // Only restore if we don't already have local uploads
        if (Object.keys(prev).length === 0) return restored;
        return prev;
      });
    }
  }, [existingDocs]);

  const handleSubmit = async () => {
    // Determine which docs are applicable based on conditional logic
    const allDocs = template?.requiredDocuments || [];
    const applicableDocs = allDocs.filter(doc => {
      if (!doc.conditionalLogic) return true;
      const { dependsOn, value, operator } = doc.conditionalLogic;
      if (!dependsOn) return true;
      const fieldValue = formData[dependsOn];
      if (operator === 'equals') return String(fieldValue) === String(value);
      return true;
    });

    const requiredMissing = applicableDocs.filter(doc => {
      if (!doc.required) return false;
      const docKey = doc.documentTypeId || doc.id;
      const uploaded = documents[docKey];
      return !uploaded || !uploaded.url;
    });

    if (requiredMissing.length > 0) {
      toast.error(`Faltam ${requiredMissing.length} documento(s) obrigatório(s): ${requiredMissing.map(d => d.label).join(', ')}`);
      return;
    }

    setUploading(true);

    // Create DocumentUpload records (skip already persisted)
    const existingDocTypeIds = new Set(existingDocs.map(d => d.documentTypeId));
    const newDocs = Object.entries(documents)
      .filter(([typeId, data]) => data.url && !existingDocTypeIds.has(typeId))
      .map(([typeId, data]) => {
        const docDef = allDocs.find(d => (d.documentTypeId || d.id) === typeId);
        return {
          onboardingCaseId: caseId,
          documentTypeId: typeId,
          documentName: docDef?.label || typeId,
          fileUrl: data.url,
          fileName: data.name || '',
          fileSize: data.size || 0,
          fileType: data.type || '',
          uploadDate: new Date().toISOString(),
          validationStatus: 'Pendente',
        };
      });

    if (newDocs.length > 0) {
      await base44.entities.DocumentUpload.bulkCreate(newDocs);
    }

    await base44.entities.OnboardingCase.update(caseId, { docCompleted: true });

    setUploading(false);
    setCompleted(true);
    toast.success('Documentos enviados com sucesso!');
  };

  // --- Render states ---

  if (!caseId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-4" />
          <h2 className="text-xl font-bold text-[#002443] mb-2">Link inválido</h2>
          <p className="text-[#002443]/70">Este link não possui um caso de onboarding vinculado.</p>
        </div>
      </div>
    );
  }

  if (caseLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" />
      </div>
    );
  }

  if (!onboardingCase) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 mx-auto text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-[#002443] mb-2">Caso não encontrado</h2>
          <p className="text-[#002443]/70">O caso de onboarding informado não existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-[#002443] mb-3">Documentos Enviados!</h2>
          <p className="text-[#002443]/70">
            Seus documentos foram recebidos com sucesso e serão analisados pela equipe de compliance.
          </p>
          <p className="text-sm text-[#002443]/50 mt-4">
            Empresa: <strong>{merchant?.fullName || merchant?.companyName || 'N/A'}</strong>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f4f4] py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/9bd38c4f7_Logo-modo-claro.png" 
            alt="Pagsmile" 
            className="h-7 mx-auto mb-4"
          />
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold mb-3">
            ENVIO DE DOCUMENTOS — SUBSELLER
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#002443]">
            Upload de Documentos
          </h1>

          {/* Client info card */}
          <div className="mt-4 inline-flex flex-col items-center gap-2 bg-white rounded-xl px-6 py-4 shadow-sm border border-[#002443]/5">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-[#002443]">
                {merchant?.fullName || merchant?.companyName || 'Carregando...'}
              </span>
            </div>
            {merchant?.cpfCnpj && (
              <span className="text-xs text-[#002443]/50">CNPJ/CPF: {merchant.cpfCnpj}</span>
            )}
            {segmentResponse && (
              <Badge className="bg-indigo-100 text-indigo-700 border-0 text-xs">
                Segmento: {segmentResponse.valueText}
              </Badge>
            )}
          </div>
        </div>

        {/* Document Uploader */}
        {template ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#002443]/5">
            <DynamicDocumentUploader
              template={template}
              documents={documents}
              setDocuments={setDocuments}
              formData={formData}
            />

            <div className="mt-8 pt-6 border-t border-[#002443]/5 flex justify-end">
              <Button
                onClick={handleSubmit}
                disabled={uploading}
                className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white px-8 h-12 rounded-xl shadow-lg"
              >
                {uploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4 mr-2" /> Enviar Documentos</>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-[#2bc196]" />
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-[#002443]/40 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3" />
            Seus dados estão protegidos e serão tratados com confidencialidade.
          </p>
        </div>
      </div>
    </div>
  );
}