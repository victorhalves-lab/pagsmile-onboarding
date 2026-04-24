import React from 'react';
import BulletproofDocumentUploader from '@/components/compliance/BulletproofDocumentUploader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Wraps the BulletproofDocumentUploader (which is working well) for the V2 flow.
 * Delegates all upload logic — just handles validation & navigation.
 */
export default function StepDocumentsV2({
  template, documents, setDocuments,
  caseId, docLinkToken,
  onBack, onNext, canGoBack, isSubmitting,
}) {
  // Guard: template must be loaded and valid before rendering the uploader.
  const templateReady = !!(template && typeof template === 'object' && Array.isArray(template.requiredDocuments));

  const handleNext = () => {
    const required = (template?.requiredDocuments || []).map((d, i) => ({
      ...d, _docKey: d.documentTypeId || d.id || `doc_${i}_${(d.label || '').replace(/\s+/g, '_').toLowerCase().slice(0, 30)}`,
    })).filter(d => d.required);

    const missing = required.filter(d => {
      const e = documents[d._docKey];
      if (!e) return true;
      if (e.persisted !== true) return true;
      const hasFiles = Array.isArray(e.files) ? e.files.length > 0 : !!e.url;
      return !(hasFiles || (e.notAvailable && e.notAvailableReason));
    });

    if (missing.length > 0) {
      toast.error(`Faltam ${missing.length} documentos obrigatórios: ${missing.map(d => d.label).slice(0, 3).join(', ')}${missing.length > 3 ? '…' : ''}`);
      return;
    }
    onNext();
  };

  return (
    <div>
      {templateReady && caseId ? (
        <BulletproofDocumentUploader
          template={template}
          documents={documents || {}}
          setDocuments={setDocuments}
          storageKey={`onboarding_v2_docs_${caseId}`}
          caseId={caseId}
          docLinkToken={docLinkToken}
          onAllRequiredUploaded={() => {}}
          formData={{}}
        />
      ) : (
        <div className="text-center py-12 text-slate-500">
          <Loader2 className="w-8 h-8 mx-auto text-slate-300 animate-spin mb-3" />
          <p className="text-sm">Carregando documentos solicitados…</p>
        </div>
      )}

      <div className="flex justify-between items-center mt-8 pt-5 border-t border-slate-100">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={!canGoBack || isSubmitting}
          className="h-10 px-4 rounded-lg disabled:opacity-40"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <Button
          onClick={handleNext}
          disabled={isSubmitting}
          className="h-10 px-6 rounded-lg bg-[#2bc196] hover:bg-[#2bc196]/90 text-white"
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Aguarde</>
          ) : (
            <>Continuar <ArrowRight className="w-4 h-4 ml-2" /></>
          )}
        </Button>
      </div>
    </div>
  );
}