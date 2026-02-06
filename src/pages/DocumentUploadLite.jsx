import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, FileUp, Shield, CheckCircle2, Loader2 } from 'lucide-react';
import DocumentUploadCard from '../components/compliance/DocumentUploadCard';
import { toast } from 'sonner';

const DOCUMENTS_LITE = [
  {
    id: 'cartao_cnpj',
    name: 'Cartão CNPJ',
    description: 'Comprovante de Inscrição e Situação Cadastral (Cartão CNPJ) atualizado.',
    required: true
  },
  {
    id: 'contrato_social',
    name: 'Contrato Social + última alteração',
    description: 'Cópia do Contrato Social ou Estatuto, incluindo a última alteração consolidada.',
    required: true
  },
  {
    id: 'doc_representante',
    name: 'Documento do Representante Legal (RG ou CNH)',
    description: 'RG ou CNH do representante legal da empresa (frente e verso, em boa resolução).',
    required: true
  },
  {
    id: 'comprovante_endereco_empresa',
    name: 'Comprovante de endereço da empresa',
    description: 'Conta de água, luz, telefone ou contrato de aluguel (emissão até 90 dias).',
    required: true
  },
  {
    id: 'comprovante_endereco_representante',
    name: 'Comprovante de endereço do representante/sócio',
    description: 'Comprovante de residência do representante legal ou sócio (emissão até 90 dias).',
    required: true
  }
];

export default function DocumentUploadLite() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const savedDocs = localStorage.getItem('documents_lite');
    if (savedDocs) {
      setDocuments(JSON.parse(savedDocs));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('documents_lite', JSON.stringify(documents));
  }, [documents]);

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

  const allRequiredUploaded = DOCUMENTS_LITE.filter(d => d.required).every(
    doc => documents[doc.id]?.url
  );

  const handleSubmit = async () => {
    if (!allRequiredUploaded) {
      toast.error('Por favor, envie todos os documentos obrigatórios.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Buscar dados do formulário
      const formData = JSON.parse(localStorage.getItem('compliance_data_lite') || '{}');
      const linkCode = localStorage.getItem('onboarding_link_code');

      // Criar Merchant
      const merchant = await base44.entities.Merchant.create({
        type: 'PJ',
        cpfCnpj: formData.cnpj,
        fullName: formData.razaoSocial,
        companyName: formData.nomeFantasia,
        email: formData.representanteLegalEmail,
        onboardingStatus: 'Pendente',
        paymentServices: ['Pix']
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
        { key: 'enderecoComercial', text: 'Endereço Comercial Completo', type: 'TEXT' },
        { key: 'website', text: 'Website / domínio principal', type: 'TEXT' },
        { key: 'descricaoNegocio', text: 'Descrição curta do negócio', type: 'TEXT' },
        { key: 'modeloNegocio', text: 'Modelo de negócio principal', type: 'SELECT' },
        { key: 'canalVenda', text: 'Canal de venda principal', type: 'SELECT' },
        { key: 'entregaProdutoFisico', text: 'Vocês entregam produto físico?', type: 'BOOLEAN' },
        { key: 'entregaDigitalServico', text: 'Vocês entregam produto digital ou prestam serviço?', type: 'BOOLEAN' },
        { key: 'quemRealizaEntrega', text: 'Quem realiza a entrega?', type: 'SELECT' },
        { key: 'comoComprovaEntregaFisica', text: 'Como vocês comprovam entrega? (físico)', type: 'SELECT' },
        { key: 'comoComprovaEntregaDigital', text: 'Como vocês comprovam entrega/prestação? (digital)', type: 'SELECT' },
        { key: 'tipoEmpresa', text: 'Tipo de empresa', type: 'SELECT' },
        { key: 'representanteLegalNome', text: 'Representante Legal (nome completo)', type: 'TEXT' },
        { key: 'representanteLegalCPF', text: 'CPF do Representante Legal', type: 'CPF_CNPJ' },
        { key: 'representanteLegalEmail', text: 'E-mail do Representante Legal', type: 'EMAIL' },
        { key: 'existeUBO', text: 'Existe Beneficiário Final (UBO) com mais de 25%?', type: 'BOOLEAN' },
        { key: 'listaUBO', text: 'Lista de UBOs (Nome; CPF; %)', type: 'TEXT' },
        { key: 'atividadeIlegal', text: 'A empresa atua em alguma atividade ilegal/proibida?', type: 'BOOLEAN' },
        { key: 'exigeLicenca', text: 'A empresa comercializa produtos/serviços que exigem licença/regulação?', type: 'BOOLEAN' },
        { key: 'qualLicenca', text: 'Qual licença/registro?', type: 'TEXT' },
        { key: 'socioPEP', text: 'Algum sócio/administrador/UBO é PEP?', type: 'BOOLEAN' },
        { key: 'socioSancionado', text: 'Algum sócio/administrador/UBO está em listas de sanções?', type: 'BOOLEAN' },
        { key: 'atuaCripto', text: 'A empresa atua com criptoativos?', type: 'BOOLEAN' },
        { key: 'atuaJogos', text: 'A empresa atua com jogos/apostas/cassino?', type: 'BOOLEAN' },
        { key: 'encerramentoConta', text: 'Houve encerramento de conta por compliance nos últimos 24 meses?', type: 'BOOLEAN' },
        { key: 'operacaoExterior', text: 'A empresa possui sede/operação fora do Brasil?', type: 'BOOLEAN' },
        { key: 'paisesOperacao', text: 'Países de operação', type: 'TEXT' },
        { key: 'declaracaoVeracidade', text: 'Declaro que as informações são verdadeiras e completas.', type: 'BOOLEAN' },
        { key: 'declaracaoAutorizacao', text: 'Autorizo validações em bases públicas/terceiros.', type: 'BOOLEAN' },
        { key: 'declaracaoLegalidade', text: 'Declaro que não utilizarei a operação para fins ilícitos.', type: 'BOOLEAN' }
      ];

      const responsesToCreate = questionsMap
        .filter(q => formData[q.key] !== undefined && formData[q.key] !== '')
        .map((q, index) => ({
          onboardingCaseId: onboardingCase.id,
          questionId: `lite_${q.key}`,
          questionText: q.text,
          questionType: q.type,
          valueText: typeof formData[q.key] === 'string' ? formData[q.key] : undefined,
          valueBoolean: typeof formData[q.key] === 'boolean' ? formData[q.key] : undefined
        }));

      if (responsesToCreate.length > 0) {
        await base44.entities.QuestionnaireResponse.bulkCreate(responsesToCreate);
      }

      // Criar uploads de documentos
      const documentUploads = Object.entries(documents).map(([docId, docData]) => {
        const docDef = DOCUMENTS_LITE.find(d => d.id === docId);
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
      localStorage.removeItem('compliance_data_lite');
      localStorage.removeItem('documents_lite');

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
  const requiredCount = DOCUMENTS_LITE.filter(d => d.required).length;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[var(--pagsmile-green)]/10 mb-4">
          <FileUp className="w-8 h-8 text-[var(--pagsmile-green)]" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--pagsmile-blue)] mb-2">
          Envio de Documentos
        </h1>
        <p className="text-[var(--pagsmile-blue)]/70 max-w-lg mx-auto">
          Envie os documentos obrigatórios para concluir sua solicitação de onboarding.
        </p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <div className="px-3 py-1 rounded-full bg-teal-100 text-teal-700 text-sm font-semibold">
            Perfil Lite
          </div>
          <span className="text-sm text-[var(--pagsmile-blue)]/60">
            {uploadedCount} de {requiredCount} documentos enviados
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

      {/* Documents Grid */}
      <div className="grid gap-4 mb-8">
        {DOCUMENTS_LITE.map((doc) => (
          <DocumentUploadCard
            key={doc.id}
            document={doc}
            uploadedFile={documents[doc.id]}
            onUpload={(file) => handleUpload(doc.id, file)}
            onRemove={() => handleRemove(doc.id)}
          />
        ))}
      </div>

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
          onClick={() => navigate(createPageUrl('ComplianceLite'))}
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