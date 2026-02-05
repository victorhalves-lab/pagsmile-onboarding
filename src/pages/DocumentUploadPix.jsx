import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, FileUp, ShieldCheck, Lock } from 'lucide-react';
import DocumentUploadCard from '@/components/compliance/DocumentUploadCard';

const DOCUMENTS_PIX = [
  { 
    id: 'contrato_social', 
    name: 'Contrato Social ou Estatuto', 
    description: 'Última alteração consolidada ou estatuto vigente.', 
    required: false 
  },
  { 
    id: 'cartao_cnpj', 
    name: 'Cartão CNPJ', 
    description: 'Comprovante de inscrição e situação cadastral.', 
    required: false 
  },
  { 
    id: 'identificacao_socios', 
    name: 'RG ou CNH dos Sócios', 
    description: 'Documento legível, frente e verso, de todos os sócios.', 
    required: false 
  },
  { 
    id: 'comprovante_endereco', 
    name: 'Comprovante de Endereço', 
    description: 'Conta de consumo (luz, água) ou boleto recente (max 90 dias).', 
    required: false 
  }
];

export default function DocumentUploadPix() {
  const navigate = useNavigate();
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load saved state
  useEffect(() => {
    const savedDocs = localStorage.getItem('docs_pix_upload_state');
    if (savedDocs) {
      setUploadedDocs(JSON.parse(savedDocs));
    }
  }, []);

  // Save state on change
  useEffect(() => {
    localStorage.setItem('docs_pix_upload_state', JSON.stringify(uploadedDocs));
  }, [uploadedDocs]);

  const handleUpload = (docId, file) => {
    // In a real app, you would upload the file to a server here.
    // For now, we simulate the upload by storing metadata.
    setUploadedDocs(prev => ({
      ...prev,
      [docId]: { 
        name: file.name, 
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString()
      }
    }));
  };

  const handleRemove = (docId) => {
    setUploadedDocs(prev => {
      const newDocs = { ...prev };
      delete newDocs[docId];
      return newDocs;
    });
  };

  const requiredDocs = DOCUMENTS_PIX.filter(d => d.required);
  const uploadedCount = Object.keys(uploadedDocs).length;
  const progress = Math.round((uploadedCount / DOCUMENTS_PIX.length) * 100);
  
  // Check if all required docs are uploaded (or allow continue if none required)
  const canContinue = requiredDocs.length === 0 || requiredDocs.every(doc => uploadedDocs[doc.id]);

  const handleContinue = () => {
    if (!canContinue) return;
    setIsSubmitting(true);
    
    // Simulate API delay
    setTimeout(() => {
      navigate(createPageUrl('LivenessFacematchStep'));
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header Fixo */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileUp className="w-5 h-5 text-[var(--pagsmile-green)]" />
                Envio de Documentos (Pix)
              </h1>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-[var(--pagsmile-green)]">{progress}% Concluído</span>
            </div>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 flex gap-3 animate-in fade-in slide-in-from-top-4">
          <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 text-sm">Ambiente Seguro</h3>
            <p className="text-sm text-blue-700 leading-relaxed">
              Seus documentos são criptografados e armazenados com segurança. Eles serão utilizados exclusivamente para análise de compliance e validação cadastral.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {DOCUMENTS_PIX.map((doc) => (
            <DocumentUploadCard
              key={doc.id}
              doc={doc}
              isUploaded={!!uploadedDocs[doc.id]}
              fileName={uploadedDocs[doc.id]?.name}
              onUpload={handleUpload}
              onRemove={handleRemove}
            />
          ))}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-slate-100 rounded-lg">
              <Lock className="w-4 h-4 text-slate-600" />
            </div>
            <div>
              <h4 className="font-medium text-slate-800 text-sm">Requisitos dos Arquivos</h4>
              <ul className="text-sm text-slate-500 mt-1 space-y-1 list-disc pl-4">
                <li>Formatos aceitos: <strong>PDF, JPG, PNG</strong></li>
                <li>Tamanho máximo: <strong>10MB</strong> por arquivo</li>
                <li>Documentos devem estar legíveis e dentro da validade</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 md:static md:bg-transparent md:border-0 md:p-0">
          <div className="max-w-3xl mx-auto flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl('CompliancePixOnly'))}
              className="flex-1 md:flex-none h-12"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
            
            <Button
              onClick={handleContinue}
              disabled={!canContinue || isSubmitting}
              className="flex-1 h-12 bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90 text-white shadow-lg shadow-green-500/20"
            >
              {isSubmitting ? 'Processando...' : 'Continuar para Biometria'}
              {!isSubmitting && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}