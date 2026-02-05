import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, FileUp, ShieldCheck, Lock } from 'lucide-react';
import DocumentUploadCard from '@/components/compliance/DocumentUploadCard';

const DOCUMENTS_FULL = [
  { 
    id: 'identificacao_socios', 
    name: 'RG ou CNH dos Sócios', 
    description: 'Documento legível de todos os sócios e administradores.', 
    required: false 
  },
  { 
    id: 'comprovante_endereco_empresa', 
    name: 'Comprovante Endereço (Empresa)', 
    description: 'Conta de consumo em nome da empresa (max 90 dias).', 
    required: false 
  },
  { 
    id: 'comprovante_endereco_socios', 
    name: 'Comprovante Endereço (Representante)', 
    description: 'Comprovante de residência do representante legal (max 90 dias).', 
    required: false 
  },
  { 
    id: 'cartao_cnpj', 
    name: 'Cartão CNPJ', 
    description: 'Comprovante de inscrição emitido pela Receita Federal.', 
    required: false 
  },
  { 
    id: 'contrato_social', 
    name: 'Contrato Social e Última Alteração', 
    description: 'Contrato social consolidado ou estatuto com ata de eleição.', 
    required: false 
  },
  { 
    id: 'balanco_patrimonial', 
    name: 'Balanço Patrimonial', 
    description: 'Balanço do último exercício fiscal encerrado, assinado.', 
    required: false 
  },
  { 
    id: 'dre', 
    name: 'DRE (Dem. Resultado)', 
    description: 'Demonstração do Resultado do Exercício correspondente.', 
    required: false 
  },
  { 
    id: 'politica_kyc', 
    name: 'Política de KYC', 
    description: 'Manual ou política interna de Conheça seu Cliente.', 
    required: false 
  },
  { 
    id: 'demos_financeiros_3anos', 
    name: 'Demos Financeiros (3 anos)', 
    description: 'Demonstrativos dos últimos 3 exercícios (preferencialmente auditados).', 
    required: false 
  },
  { 
    id: 'balancete_recente', 
    name: 'Balancete mais recente', 
    description: 'Balancete contábil do mês/trimestre mais recente.', 
    required: false 
  },
  { 
    id: 'selfie_socios', 
    name: 'Selfie dos Sócios', 
    description: 'Foto do rosto segurando o documento de identificação.', 
    required: false 
  },
  { 
    id: 'politica_pld', 
    name: 'Política de PLD/FT', 
    description: 'Manual ou política interna de prevenção à lavagem de dinheiro.', 
    required: false 
  }
];

export default function DocumentUploadFull() {
  const navigate = useNavigate();
  const [uploadedDocs, setUploadedDocs] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load saved state
  useEffect(() => {
    const savedDocs = localStorage.getItem('docs_full_upload_state');
    if (savedDocs) {
      setUploadedDocs(JSON.parse(savedDocs));
    }
  }, []);

  // Save state on change
  useEffect(() => {
    localStorage.setItem('docs_full_upload_state', JSON.stringify(uploadedDocs));
  }, [uploadedDocs]);

  const handleUpload = (docId, file) => {
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

  const requiredDocs = DOCUMENTS_FULL.filter(d => d.required);
  const uploadedCount = Object.keys(uploadedDocs).length;
  const progress = Math.round((uploadedCount / DOCUMENTS_FULL.length) * 100);
  
  const canContinue = requiredDocs.length === 0 || requiredDocs.every(doc => uploadedDocs[doc.id]);

  const handleContinue = () => {
    if (!canContinue) return;
    setIsSubmitting(true);
    
    setTimeout(() => {
      navigate(createPageUrl('LivenessFacematchStep'));
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header Fixo */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileUp className="w-5 h-5 text-[var(--pagsmile-green)]" />
                Envio de Documentos (Full KYC)
              </h1>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-[var(--pagsmile-green)]">{progress}% Concluído</span>
            </div>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-8 flex gap-3 animate-in fade-in slide-in-from-top-4">
          <ShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 text-sm">Documentação Obrigatória</h3>
            <p className="text-sm text-blue-700 leading-relaxed">
              Para a análise completa do seu perfil, precisamos dos documentos abaixo. Certifique-se de que estão legíveis e assinados quando necessário.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {DOCUMENTS_FULL.map((doc) => (
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
              <h4 className="font-medium text-slate-800 text-sm">Requisitos e Segurança</h4>
              <ul className="text-sm text-slate-500 mt-1 space-y-1 list-disc pl-4">
                <li>Formatos aceitos: <strong>PDF, JPG, PNG</strong></li>
                <li>Tamanho máximo: <strong>10MB</strong> por arquivo</li>
                <li>Balanços e DRE devem estar assinados pelo contador responsável</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 md:static md:bg-transparent md:border-0 md:p-0">
          <div className="max-w-5xl mx-auto flex gap-4">
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl('ComplianceFullKYC'))}
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