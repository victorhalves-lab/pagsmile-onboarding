import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import DynamicDocumentUploader from '@/components/compliance/DynamicDocumentUploader';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SubsellerDocUpload() {
  const urlParams = new URLSearchParams(window.location.search);
  const caseId = urlParams.get('caseId');

  const [uploading, setUploading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [documentsData, setDocumentsData] = useState({});

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

  // Fetch existing documents
  const { data: existingDocs = [] } = useQuery({
    queryKey: ['doc-upload-existing', caseId],
    queryFn: () => base44.entities.DocumentUpload.filter({ onboardingCaseId: caseId }),
    enabled: !!caseId,
  });

  // Fetch questionnaire responses to apply conditional logic
  const { data: responses = [] } = useQuery({
    queryKey: ['doc-upload-responses', caseId],
    queryFn: () => base44.entities.QuestionnaireResponse.filter({ onboardingCaseId: caseId }),
    enabled: !!caseId,
  });

  // Build formData from responses to drive conditional logic in document uploader
  const formData = useMemo(() => {
    const data = {};
    responses.forEach(r => {
      const val = r.valueText || r.valueNumber || r.valueBoolean || r.valueArray;
      if (val !== undefined && val !== null) {
        data[r.questionId] = val;
      }
    });
    return data;
  }, [responses]);

  // Restore existing docs into documentsData
  useEffect(() => {
    if (existingDocs.length > 0) {
      const restored = {};
      existingDocs.forEach(d => {
        restored[d.documentTypeId] = {
          fileUrl: d.fileUrl,
          fileName: d.fileName,
          fileSize: d.fileSize,
          fileType: d.fileType,
          uploaded: true,
        };
      });
      setDocumentsData(restored);
    }
  }, [existingDocs]);

  const requiredDocuments = template?.requiredDocuments || [];

  const handleSubmit = async () => {
    // Check all required docs are uploaded
    const applicableDocs = requiredDocuments.filter(doc => {
      if (!doc.conditionalLogic) return doc.required;
      const depVal = formData[doc.conditionalLogic.dependsOn];
      if (doc.conditionalLogic.operator === 'equals') {
        return String(depVal) === String(doc.conditionalLogic.value);
      }
      return doc.required;
    });

    const requiredMissing = applicableDocs.filter(doc => {
      if (!doc.required) return false;
      const uploaded = documentsData[doc.documentTypeId];
      return !uploaded || !uploaded.fileUrl;
    });

    if (requiredMissing.length > 0) {
      toast.error(`Faltam ${requiredMissing.length} documento(s) obrigatório(s).`);
      return;
    }

    setUploading(true);

    // Create DocumentUpload records for new uploads (skip already existing)
    const existingDocTypeIds = new Set(existingDocs.map(d => d.documentTypeId));
    const newDocs = Object.entries(documentsData)
      .filter(([typeId, data]) => data.fileUrl && !existingDocTypeIds.has(typeId))
      .map(([typeId, data]) => {
        const docDef = requiredDocuments.find(d => d.documentTypeId === typeId);
        return {
          onboardingCaseId: caseId,
          documentTypeId: typeId,
          documentName: docDef?.label || typeId,
          fileUrl: data.fileUrl,
          fileName: data.fileName || '',
          fileSize: data.fileSize || 0,
          fileType: data.fileType || '',
          uploadDate: new Date().toISOString(),
          validationStatus: 'Pendente',
        };
      });

    if (newDocs.length > 0) {
      await base44.entities.DocumentUpload.bulkCreate(newDocs);
    }

    // Update case
    await base44.entities.OnboardingCase.update(caseId, { docCompleted: true });

    setUploading(false);
    setCompleted(true);
    toast.success('Documentos enviados com sucesso!');
  };

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
          <p className="text-[#002443]/70">O caso de onboarding informado não existe.</p>
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
            ENVIO DE DOCUMENTOS
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-[#002443]">
            Upload de Documentos — Compliance
          </h1>
          <p className="text-sm text-[#002443]/60 mt-2 max-w-lg mx-auto">
            Empresa: <strong>{merchant?.fullName || merchant?.companyName || 'Carregando...'}</strong>
          </p>
          {merchant?.cpfCnpj && (
            <p className="text-xs text-[#002443]/40 mt-1">CNPJ/CPF: {merchant.cpfCnpj}</p>
          )}
        </div>

        {/* Document Uploader */}
        {template ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#002443]/5">
            <DynamicDocumentUploader
              requiredDocuments={requiredDocuments}
              formData={formData}
              documentsData={documentsData}
              setDocumentsData={setDocumentsData}
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