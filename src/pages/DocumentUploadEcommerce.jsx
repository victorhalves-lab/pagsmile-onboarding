import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileUp, Shield, CheckCircle2, Loader2, ShoppingCart } from 'lucide-react';
import DocumentUploadCard from '../components/compliance/DocumentUploadCard';
import { toast } from 'sonner';

// Documentos Base (sempre obrigatórios)
const DOCUMENTS_BASE = [
  {
    id: 'cartao_cnpj',
    name: 'Cartão CNPJ',
    description: 'Comprovante de Inscrição e Situação Cadastral atualizado.',
    required: true
  },
  {
    id: 'contrato_social',
    name: 'Contrato/Estatuto Social + última alteração',
    description: 'Cópia do Contrato Social ou Estatuto consolidado.',
    required: true
  },
  {
    id: 'doc_representante',
    name: 'Documento do representante legal (RG ou CNH)',
    description: 'Documento do representante em boa resolução (frente e verso).',
    required: true
  },
  {
    id: 'comprovante_endereco_empresa',
    name: 'Comprovante de endereço da empresa',
    description: 'Conta de água, luz, telefone ou contrato de aluguel (até 90 dias).',
    required: true
  },
  {
    id: 'comprovante_endereco_representante',
    name: 'Comprovante de endereço do representante',
    description: 'Comprovante de residência do representante legal (até 90 dias).',
    required: true
  },
  {
    id: 'selfie_documento',
    name: 'Selfie segurando o documento',
    description: 'Foto do representante segurando RG/CNH na mão.',
    required: true
  }
];

// Documento PLD/FT (sempre obrigatório)
const DOCUMENT_PLD = {
  id: 'pld_ft',
  name: 'Documento de PLD/FT',
  description: 'Política/Procedimento PLD/FT OU Declaração simplificada assinada pelo representante.',
  required: true
};

// Documentos condicionais para Marketplace
const DOCUMENTS_MARKETPLACE = [
  {
    id: 'kyc_sellers',
    name: 'Documento do processo de KYC/KYB dos sellers',
    description: 'Procedimento ou manual de KYC/KYB aplicado aos sellers.',
    required: true
  },
  {
    id: 'politica_sellers',
    name: 'Política/termos de sellers',
    description: 'Link ou documento da política de sellers.',
    required: true
  }
];

// Documento opcional PEP/Sanções
const DOCUMENT_PEP = {
  id: 'doc_suporte_pep',
  name: 'Documento de suporte PEP/Sanções',
  description: 'Documentação adicional sobre a pessoa exposta ou sancionada (opcional).',
  required: false
};

export default function DocumentUploadEcommerce() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const savedDocs = localStorage.getItem('documents_ecommerce');
    if (savedDocs) {
      setDocuments(JSON.parse(savedDocs));
    }
    
    const savedFormData = localStorage.getItem('compliance_data_ecommerce');
    if (savedFormData) {
      setFormData(JSON.parse(savedFormData));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('documents_ecommerce', JSON.stringify(documents));
  }, [documents]);

  // Determinar documentos necessários com base nas respostas
  const requiredDocuments = useMemo(() => {
    const docs = [...DOCUMENTS_BASE, DOCUMENT_PLD];
    
    // Se opera marketplace, adicionar docs de marketplace
    if (formData.operaMarketplace === 'Sim') {
      docs.push(...DOCUMENTS_MARKETPLACE);
    }
    
    // Se tem PEP ou sancionado, adicionar doc opcional de suporte
    if (formData.algumPEP === 'Sim' || formData.algumSancionado === 'Sim') {
      docs.push(DOCUMENT_PEP);
    }
    
    return docs;
  }, [formData.operaMarketplace, formData.algumPEP, formData.algumSancionado]);

  const handleUpload = async (docId, file) => {
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setDocuments(prev => ({
        ...prev,
        [docId]: {
          url: file_url,
          name: file.name,
          uploadedAt: new Date().toISOString()
        }
      }));
      toast.success('Documento enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar documento: ' + error.message);
    }
  };

  const handleRemove = (docId) => {
    setDocuments(prev => {
      const newDocs = { ...prev };
      delete newDocs[docId];
      return newDocs;
    });
  };

  const allRequiredUploaded = requiredDocuments.filter(d => d.required).every(
    doc => documents[doc.id]?.url
  );

  const handleSubmit = async () => {
    if (!allRequiredUploaded) {
      toast.error('Por favor, envie todos os documentos obrigatórios.');
      return;
    }

    setIsSubmitting(true);

    try {
      const linkCode = localStorage.getItem('onboarding_link_code');

      // Criar Merchant
      const merchant = await base44.entities.Merchant.create({
        type: 'PJ',
        cpfCnpj: formData.cnpj,
        fullName: formData.razaoSocial,
        companyName: formData.nomeFantasia,
        email: formData.representanteEmail,
        onboardingStatus: 'Pendente',
        paymentServices: ['Pix', 'Cartão']
      });

      // Criar OnboardingCase
      const onboardingCase = await base44.entities.OnboardingCase.create({
        merchantId: merchant.id,
        status: 'Pendente',
        onboardingLinkCode: linkCode,
        priority: 'medium'
      });

      // Criar respostas do questionário
      const questionsMap = [
        { key: 'cnpj', text: 'CNPJ', type: 'CPF_CNPJ' },
        { key: 'razaoSocial', text: 'Razão Social', type: 'TEXT' },
        { key: 'nomeFantasia', text: 'Nome Fantasia', type: 'TEXT' },
        { key: 'urlDominio', text: 'URL do domínio principal', type: 'TEXT' },
        { key: 'plataformaEcommerce', text: 'Plataforma de e-commerce', type: 'SELECT' },
        { key: 'tipoSocietario', text: 'Tipo societário', type: 'SELECT' },
        { key: 'representanteNome', text: 'Nome do representante legal', type: 'TEXT' },
        { key: 'representanteCPF', text: 'CPF do representante', type: 'CPF_CNPJ' },
        { key: 'representanteCargo', text: 'Cargo do representante', type: 'TEXT' },
        { key: 'representanteEmail', text: 'E-mail do representante', type: 'EMAIL' },
        { key: 'algumPEP', text: 'Algum sócio/administrador é PEP?', type: 'SELECT' },
        { key: 'algumSancionado', text: 'Algum consta em listas restritivas?', type: 'SELECT' },
        { key: 'tpvMensal', text: 'TPV/Faturamento mensal', type: 'SELECT' },
        { key: 'ticketMedio', text: 'Ticket médio', type: 'SELECT' },
        { key: 'chargebackRate', text: 'Taxa de chargeback', type: 'SELECT' },
        { key: 'estornosRate', text: 'Taxa de estornos', type: 'SELECT' },
        { key: 'operaMarketplace', text: 'Opera Marketplace/3P?', type: 'SELECT' },
        { key: 'temCrossBorder', text: 'Tem cross-border?', type: 'SELECT' },
        { key: 'temRecorrencia', text: 'Tem assinatura/recorrência?', type: 'SELECT' },
        { key: 'vendeProdutoDigital', text: 'Vende produto digital?', type: 'SELECT' },
        { key: 'possuiPoliticaPLD', text: 'Possui política de PLD/FT?', type: 'SELECT' },
        { key: 'declaracaoVeracidade', text: 'Declaração de veracidade', type: 'BOOLEAN' },
        { key: 'declaracaoAutorizacao', text: 'Autorização para validações', type: 'BOOLEAN' },
        { key: 'declaracaoLegalidade', text: 'Declaração de legalidade', type: 'BOOLEAN' }
      ];

      const responsesToCreate = questionsMap
        .filter(q => formData[q.key] !== undefined && formData[q.key] !== '')
        .map((q) => ({
          onboardingCaseId: onboardingCase.id,
          questionId: `ecom_${q.key}`,
          questionText: q.text,
          questionType: q.type,
          valueText: typeof formData[q.key] === 'string' ? formData[q.key] : undefined,
          valueBoolean: typeof formData[q.key] === 'boolean' ? formData[q.key] : undefined
        }));

      if (responsesToCreate.length > 0) {
        await base44.entities.QuestionnaireResponse.bulkCreate(responsesToCreate);
      }

      // Salvar quadro societário como resposta JSON
      if (formData.quadroSocietario && formData.quadroSocietario.length > 0) {
        await base44.entities.QuestionnaireResponse.create({
          onboardingCaseId: onboardingCase.id,
          questionId: 'ecom_quadroSocietario',
          questionText: 'Quadro societário',
          questionType: 'TEXT',
          valueText: JSON.stringify(formData.quadroSocietario)
        });
      }

      // Criar uploads de documentos
      const documentUploads = Object.entries(documents).map(([docId, docData]) => {
        const docDef = requiredDocuments.find(d => d.id === docId);
        return {
          onboardingCaseId: onboardingCase.id,
          documentTypeId: docId,
          documentName: docDef?.name || docId,
          fileUrl: docData.url,
          fileName: docData.name,
          uploadDate: docData.uploadedAt,
          validationStatus: 'Pendente'
        };
      });

      if (documentUploads.length > 0) {
        await base44.entities.DocumentUpload.bulkCreate(documentUploads);
      }

      // Limpar localStorage
      localStorage.removeItem('compliance_data_ecommerce');
      localStorage.removeItem('documents_ecommerce');

      toast.success('Questionário enviado com sucesso!');
      navigate(createPageUrl('OnboardingCompletion') + `?caseId=${onboardingCase.id}`);

    } catch (error) {
      console.error('Erro ao submeter:', error);
      toast.error('Erro ao enviar questionário: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadedCount = Object.keys(documents).length;
  const requiredCount = requiredDocuments.filter(d => d.required).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-orange-100 mb-4">
          <ShoppingCart className="w-8 h-8 text-orange-600" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--pagsmile-blue)] mb-2">
          Envio de Documentos
        </h1>
        <p className="text-[var(--pagsmile-blue)]/70 max-w-lg mx-auto">
          Envie os documentos para concluir o cadastro do seu e-commerce.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-semibold">
            E-commerce Known
          </div>
          <span className="text-sm text-[var(--pagsmile-blue)]/60">
            {uploadedCount} de {requiredCount} documentos obrigatórios enviados
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[var(--pagsmile-green)] transition-all duration-500"
            style={{ width: `${(uploadedCount / requiredCount) * 100}%` }}
          />
        </div>
      </div>

      {/* Seção: Documentos Base */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-[var(--pagsmile-blue)] mb-4">Documentos Base</h3>
        <div className="grid gap-4">
          {DOCUMENTS_BASE.map((doc) => (
            <DocumentUploadCard
              key={doc.id}
              document={doc}
              uploadedFile={documents[doc.id]}
              onUpload={(file) => handleUpload(doc.id, file)}
              onRemove={() => handleRemove(doc.id)}
            />
          ))}
        </div>
      </div>

      {/* Seção: PLD/FT */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-[var(--pagsmile-blue)] mb-4">PLD/FT</h3>
        <DocumentUploadCard
          document={DOCUMENT_PLD}
          uploadedFile={documents[DOCUMENT_PLD.id]}
          onUpload={(file) => handleUpload(DOCUMENT_PLD.id, file)}
          onRemove={() => handleRemove(DOCUMENT_PLD.id)}
        />
      </div>

      {/* Seção: Marketplace (condicional) */}
      {formData.operaMarketplace === 'Sim' && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-[var(--pagsmile-blue)] mb-4 flex items-center gap-2">
            <span className="px-2 py-0.5 bg-violet-100 text-violet-700 text-xs rounded-full">MARKETPLACE</span>
            Documentos de Sellers
          </h3>
          <div className="grid gap-4">
            {DOCUMENTS_MARKETPLACE.map((doc) => (
              <DocumentUploadCard
                key={doc.id}
                document={doc}
                uploadedFile={documents[doc.id]}
                onUpload={(file) => handleUpload(doc.id, file)}
                onRemove={() => handleRemove(doc.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Seção: PEP/Sanções (condicional) */}
      {(formData.algumPEP === 'Sim' || formData.algumSancionado === 'Sim') && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-[var(--pagsmile-blue)] mb-4 flex items-center gap-2">
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">PEP/SANÇÕES</span>
            Documentação Adicional
          </h3>
          <DocumentUploadCard
            document={DOCUMENT_PEP}
            uploadedFile={documents[DOCUMENT_PEP.id]}
            onUpload={(file) => handleUpload(DOCUMENT_PEP.id, file)}
            onRemove={() => handleRemove(DOCUMENT_PEP.id)}
          />
        </div>
      )}

      {/* Info Box */}
      <div className="bg-slate-50 rounded-xl p-4 mb-8 flex items-start gap-3">
        <Shield className="w-5 h-5 text-[var(--pagsmile-blue)]/60 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-[var(--pagsmile-blue)]">Seus documentos estão seguros</p>
          <p className="text-xs text-[var(--pagsmile-blue)]/60 mt-1">
            Todos os arquivos são criptografados e armazenados em ambiente seguro, 
            acessíveis apenas pela equipe de compliance.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-6 border-t border-slate-200">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('ComplianceEcommerce'))}
          className="text-slate-500 hover:text-[var(--pagsmile-blue)]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Questionário
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={!allRequiredUploaded || isSubmitting}
          className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90 text-white px-8 h-12 rounded-xl shadow-lg shadow-green-500/20 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              Concluir Submissão
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}