import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  ArrowLeft, ArrowRight, FileText, CheckCircle2, 
  Upload, X, FileUp 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DOCUMENTS_PIX = [
  { id: 'cnpj_card', name: 'Cartão CNPJ', description: 'Receita Federal' },
  { id: 'social_contract', name: 'Contrato Social', description: 'Constituição' },
  { id: 'partners_id', name: 'RG/CNH Sócios', description: 'Identificação' },
  { id: 'company_address_proof', name: 'Endereço Empresa', description: 'Comprovante' },
  { id: 'partners_selfie', name: 'Selfie com Doc', description: 'Foto do rosto' },
  { id: 'partners_address_proof', name: 'Endereço Sócios', description: 'Comprovante' },
  { id: 'balance_sheet', name: 'Balanço Patrimonial', description: 'Último exercício' },
  { id: 'dre', name: 'DRE', description: 'Demonstrativo' },
  { id: 'balancete', name: 'Balancete', description: 'Mais recente' },
  { id: 'pld_policy', name: 'Política PLD', description: 'Prevenção' }
];

export default function DocumentUploadPix() {
  const navigate = useNavigate();
  const [uploadedDocs, setUploadedDocs] = useState({});

  const handleFileSelect = (docId) => {
    // Simulação de upload
    setUploadedDocs(prev => ({
      ...prev,
      [docId]: { name: `documento_${docId}.pdf`, uploaded: true }
    }));
  };

  const handleRemoveFile = (docId) => {
    setUploadedDocs(prev => {
      const newDocs = { ...prev };
      delete newDocs[docId];
      return newDocs;
    });
  };

  const uploadedCount = Object.keys(uploadedDocs).length;
  const totalDocs = DOCUMENTS_PIX.length;
  const progress = Math.round((uploadedCount / totalDocs) * 100);

  const handleContinue = () => {
    navigate(createPageUrl('LivenessFacematchStep'));
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-slate-50">
      {/* Header */}
      <div className="sticky top-[57px] z-40 bg-white border-b border-slate-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-slate-800">Envio de Documentos (Pix)</h1>
              <p className="text-sm text-slate-500">
                {uploadedCount} de {totalDocs} documentos enviados
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-[var(--pagsmile-green)]">{progress}%</span>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Grid de documentos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {DOCUMENTS_PIX.map((doc) => {
            const isUploaded = uploadedDocs[doc.id];
            
            return (
              <div
                key={doc.id}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all",
                  isUploaded 
                    ? "border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5" 
                    : "border-slate-200 bg-white hover:border-slate-300"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    "p-3 rounded-lg",
                    isUploaded 
                      ? "bg-[var(--pagsmile-green)] text-white" 
                      : "bg-slate-100 text-slate-500"
                  )}>
                    {isUploaded ? <CheckCircle2 className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800">{doc.name}</h3>
                    <p className="text-sm text-slate-500">{doc.description}</p>
                    
                    {isUploaded ? (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-slate-500 truncate">
                          {uploadedDocs[doc.id].name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(doc.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFileSelect(doc.id)}
                        className="mt-2"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Enviar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Área de instrução */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <FileUp className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800">Formatos aceitos</h4>
              <p className="text-sm text-blue-700">
                PDF, JPG, JPEG, PNG. Tamanho máximo: 10MB por arquivo.
              </p>
            </div>
          </div>
        </div>

        {/* Navegação */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl('CompliancePixOnly'))}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Questionário
          </Button>
          
          <Button
            onClick={handleContinue}
            className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90 text-white"
          >
            Continuar
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}