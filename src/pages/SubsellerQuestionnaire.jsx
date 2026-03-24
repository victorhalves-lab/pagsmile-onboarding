import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Building2, ArrowRight, ArrowLeft, Loader2, Check, 
  FileUp, AlertTriangle, ShieldCheck, Upload, X, CheckCircle2 
} from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '../utils';

const STEPS = [
  { id: 'empresa', title: 'Dados da Empresa', icon: Building2 },
  { id: 'responsavel', title: 'Responsável Legal', icon: ShieldCheck },
  { id: 'negocio', title: 'Modelo de Negócio', icon: Building2 },
  { id: 'documentos', title: 'Documentos', icon: FileUp },
];

const CANAIS_VENDA = [
  'E-commerce próprio',
  'Marketplace (Mercado Livre, Shopee, etc.)',
  'Loja física',
  'Redes sociais',
  'Aplicativo próprio',
  'Televendas',
  'Outro'
];

export default function SubsellerQuestionnaire() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const linkCode = urlParams.get('ref');

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    cnpj: '',
    razaoSocial: '',
    cnae: '',
    mcc: '',
    site: '',
    nomeResponsavel: '',
    telefoneResponsavel: '',
    emailResponsavel: '',
    modeloNegocio: '',
    canaisVenda: [],
  });
  const [documents, setDocuments] = useState({});
  const [uploading, setUploading] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Fetch OnboardingLink para obter parentMerchantId
  const { data: onboardingLink, isLoading: linkLoading } = useQuery({
    queryKey: ['subsellerLink', linkCode],
    queryFn: async () => {
      if (!linkCode) return null;
      const links = await base44.entities.OnboardingLink.filter({ uniqueCode: linkCode });
      return links[0] || null;
    },
    enabled: !!linkCode
  });

  // Fetch parent merchant name for display
  const { data: parentMerchant } = useQuery({
    queryKey: ['parentMerchant', onboardingLink?.parentMerchantId],
    queryFn: async () => {
      const merchants = await base44.entities.Merchant.filter({ id: onboardingLink.parentMerchantId });
      return merchants[0] || null;
    },
    enabled: !!onboardingLink?.parentMerchantId
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCanaisChange = (canal, checked) => {
    setFormData(prev => ({
      ...prev,
      canaisVenda: checked 
        ? [...prev.canaisVenda, canal]
        : prev.canaisVenda.filter(c => c !== canal)
    }));
  };

  const handleFileUpload = async (docKey, file) => {
    setUploading(prev => ({ ...prev, [docKey]: true }));
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setDocuments(prev => ({
      ...prev,
      [docKey]: { url: file_url, name: file.name, size: file.size, type: file.type }
    }));
    setUploading(prev => ({ ...prev, [docKey]: false }));
  };

  const removeDocument = (docKey) => {
    setDocuments(prev => {
      const copy = { ...prev };
      delete copy[docKey];
      return copy;
    });
  };

  const validateStep = () => {
    if (currentStep === 0) {
      if (!formData.cnpj || !formData.razaoSocial) {
        toast.error('Preencha CNPJ e Razão Social.');
        return false;
      }
    }
    if (currentStep === 1) {
      if (!formData.nomeResponsavel || !formData.emailResponsavel) {
        toast.error('Preencha nome e e-mail do responsável legal.');
        return false;
      }
    }
    if (currentStep === 2) {
      if (!formData.modeloNegocio) {
        toast.error('Selecione o modelo de negócio.');
        return false;
      }
    }
    if (currentStep === 3) {
      const required = ['contratoSocial', 'cartaoCnpj', 'docResponsavel', 'selfieResponsavel'];
      const missing = required.filter(k => !documents[k]?.url);
      if (missing.length > 0) {
        toast.error(`Envie todos os documentos obrigatórios (${missing.length} pendente${missing.length > 1 ? 's' : ''}).`);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setCurrentStep(prev => prev + 1);
    window.scrollTo(0, 0);
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setIsSubmitting(true);

    const parentId = onboardingLink?.parentMerchantId || null;

    // Criar Merchant (subseller)
    const merchant = await base44.entities.Merchant.create({
      type: 'PJ',
      cpfCnpj: formData.cnpj,
      fullName: formData.razaoSocial,
      email: formData.emailResponsavel,
      phone: formData.telefoneResponsavel,
      onboardingStatus: 'Pendente',
      paymentServices: ['Pix', 'Cartão'],
      parentMerchantId: parentId,
      isSubseller: !!parentId,
    });

    // Criar OnboardingCase
    const onboardingCase = await base44.entities.OnboardingCase.create({
      merchantId: merchant.id,
      questionnaireTemplateId: 'subseller_compliance',
      status: 'Pendente',
      onboardingLinkCode: linkCode,
      priority: 'medium',
      parentMerchantId: parentId,
      isSubsellerCase: !!parentId,
    });

    // Criar respostas do questionário
    const fields = [
      { key: 'cnpj', label: 'CNPJ' },
      { key: 'razaoSocial', label: 'Razão Social' },
      { key: 'cnae', label: 'CNAE' },
      { key: 'mcc', label: 'MCC' },
      { key: 'site', label: 'Site' },
      { key: 'nomeResponsavel', label: 'Nome do Responsável Legal' },
      { key: 'telefoneResponsavel', label: 'Telefone do Responsável Legal' },
      { key: 'emailResponsavel', label: 'E-mail do Responsável Legal' },
      { key: 'modeloNegocio', label: 'Modelo de Negócios' },
      { key: 'canaisVenda', label: 'Canais de Venda' },
    ];

    const responses = fields
      .filter(f => {
        const v = formData[f.key];
        return v && (Array.isArray(v) ? v.length > 0 : true);
      })
      .map(f => ({
        onboardingCaseId: onboardingCase.id,
        questionId: f.key,
        questionText: f.label,
        questionType: Array.isArray(formData[f.key]) ? 'MULTI_SELECT' : 'TEXT',
        valueText: Array.isArray(formData[f.key]) ? formData[f.key].join(', ') : formData[f.key],
        valueArray: Array.isArray(formData[f.key]) ? formData[f.key] : undefined,
      }));

    if (responses.length > 0) {
      await base44.entities.QuestionnaireResponse.bulkCreate(responses);
    }

    // Criar uploads de documentos
    const docMappings = [
      { key: 'contratoSocial', label: 'Contrato Social' },
      { key: 'cartaoCnpj', label: 'Cartão CNPJ' },
      { key: 'docResponsavel', label: 'Foto Documento Responsável Legal' },
      { key: 'selfieResponsavel', label: 'Selfie Responsável Legal' },
    ];

    const docUploads = docMappings
      .filter(d => documents[d.key]?.url)
      .map(d => ({
        onboardingCaseId: onboardingCase.id,
        documentTypeId: d.key,
        documentName: d.label,
        fileUrl: documents[d.key].url,
        fileName: documents[d.key].name,
        fileSize: documents[d.key].size,
        fileType: documents[d.key].type,
        uploadDate: new Date().toISOString(),
        validationStatus: 'Pendente',
      }));

    if (docUploads.length > 0) {
      await base44.entities.DocumentUpload.bulkCreate(docUploads);
    }

    // Atualizar contador do link
    if (onboardingLink) {
      await base44.entities.OnboardingLink.update(onboardingLink.id, {
        submissionCount: (onboardingLink.submissionCount || 0) + 1
      });
    }

    setIsSubmitting(false);
    setSubmitted(true);
  };

  if (linkLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" />
      </div>
    );
  }

  if (!linkCode || (onboardingLink && onboardingLink.linkType !== 'SUBSELLER_COMPLIANCE')) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center px-4">
        <AlertTriangle className="w-16 h-16 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-[var(--pagsmile-blue)] mb-2">Link inválido</h2>
        <p className="text-[var(--pagsmile-blue)]/70">Este link de onboarding não é válido ou expirou.</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-lg mx-auto text-center px-4">
        <div className="p-4 rounded-2xl bg-[var(--pagsmile-green)]/10 mb-6">
          <CheckCircle2 className="w-16 h-16 text-[var(--pagsmile-green)]" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--pagsmile-blue)] mb-3">Questionário Enviado!</h1>
        <p className="text-[var(--pagsmile-blue)]/70 mb-2">
          Seus dados e documentos foram recebidos com sucesso.
        </p>
        <p className="text-[var(--pagsmile-blue)]/50 text-sm">
          Nossa equipe irá analisar as informações e entrará em contato em breve.
        </p>
      </div>
    );
  }

  const progress = ((currentStep + 1) / STEPS.length) * 100;
  const step = STEPS[currentStep];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-[var(--pagsmile-green)] to-[var(--pagsmile-blue)] text-white mb-4 shadow-xl">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-[var(--pagsmile-blue)] mb-2">Compliance de Subconta</h1>
        {parentMerchant && (
          <p className="text-sm text-[var(--pagsmile-blue)]/60">
            Vinculado a: <span className="font-semibold">{parentMerchant.fullName || parentMerchant.companyName}</span>
          </p>
        )}
        <div className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 inline-block mt-2">
          SUBSELLER
        </div>
      </div>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === currentStep;
            const isDone = i < currentStep;
            return (
              <div key={s.id} className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isDone ? 'bg-[var(--pagsmile-green)] text-white' :
                  isActive ? 'bg-[var(--pagsmile-blue)] text-white' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className={`text-[10px] mt-1 text-center ${isActive ? 'font-bold text-[var(--pagsmile-blue)]' : 'text-slate-400'}`}>
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <div className="bg-[var(--pagsmile-green)] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-100">
        {currentStep === 0 && <StepEmpresa formData={formData} onChange={handleChange} />}
        {currentStep === 1 && <StepResponsavel formData={formData} onChange={handleChange} />}
        {currentStep === 2 && <StepNegocio formData={formData} onChange={handleChange} onCanaisChange={handleCanaisChange} />}
        {currentStep === 3 && (
          <StepDocumentos 
            documents={documents} 
            uploading={uploading}
            onUpload={handleFileUpload} 
            onRemove={removeDocument}
          />
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-slate-100">
          <Button variant="ghost" onClick={currentStep === 0 ? undefined : handlePrev} disabled={currentStep === 0}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext} className="bg-[var(--pagsmile-green)] text-white px-8 h-11">
              Continuar <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting}
              className="bg-[var(--pagsmile-green)] text-white px-8 h-11"
            >
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</> : <>Enviar <Check className="w-4 h-4 ml-2" /></>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Step Components ──

function StepEmpresa({ formData, onChange }) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[var(--pagsmile-blue)]">Dados da Empresa</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>CNPJ <span className="text-red-500">*</span></Label>
          <Input placeholder="00.000.000/0000-00" value={formData.cnpj} onChange={e => onChange('cnpj', e.target.value)} />
        </div>
        <div>
          <Label>Razão Social <span className="text-red-500">*</span></Label>
          <Input placeholder="Nome da empresa" value={formData.razaoSocial} onChange={e => onChange('razaoSocial', e.target.value)} />
        </div>
        <div>
          <Label>CNAE</Label>
          <Input placeholder="Código CNAE" value={formData.cnae} onChange={e => onChange('cnae', e.target.value)} />
        </div>
        <div>
          <Label>MCC</Label>
          <Input placeholder="Código MCC" value={formData.mcc} onChange={e => onChange('mcc', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label>Site</Label>
          <Input placeholder="https://www.exemplo.com.br" value={formData.site} onChange={e => onChange('site', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function StepResponsavel({ formData, onChange }) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[var(--pagsmile-blue)]">Responsável Legal</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label>Nome completo <span className="text-red-500">*</span></Label>
          <Input placeholder="Nome do responsável" value={formData.nomeResponsavel} onChange={e => onChange('nomeResponsavel', e.target.value)} />
        </div>
        <div>
          <Label>Telefone</Label>
          <Input placeholder="(11) 99999-0000" value={formData.telefoneResponsavel} onChange={e => onChange('telefoneResponsavel', e.target.value)} />
        </div>
        <div>
          <Label>E-mail <span className="text-red-500">*</span></Label>
          <Input placeholder="email@empresa.com.br" type="email" value={formData.emailResponsavel} onChange={e => onChange('emailResponsavel', e.target.value)} />
        </div>
      </div>
    </div>
  );
}

function StepNegocio({ formData, onChange, onCanaisChange }) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[var(--pagsmile-blue)]">Modelo de Negócio</h2>
      <div>
        <Label>Modelo de Negócios <span className="text-red-500">*</span></Label>
        <Select value={formData.modeloNegocio} onValueChange={v => onChange('modeloNegocio', v)}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="B2C">B2C - Venda direta ao consumidor</SelectItem>
            <SelectItem value="B2B">B2B - Venda para empresas</SelectItem>
            <SelectItem value="B2B2C">B2B2C - Plataforma intermediária</SelectItem>
            <SelectItem value="D2C">D2C - Direto ao consumidor</SelectItem>
            <SelectItem value="Marketplace">Marketplace</SelectItem>
            <SelectItem value="SaaS">SaaS / Recorrência</SelectItem>
            <SelectItem value="Outro">Outro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Quais são os canais de venda?</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          {CANAIS_VENDA.map(canal => (
            <label key={canal} className="flex items-center gap-2 cursor-pointer">
              <Checkbox 
                checked={formData.canaisVenda.includes(canal)}
                onCheckedChange={checked => onCanaisChange(canal, checked)}
              />
              <span className="text-sm">{canal}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepDocumentos({ documents, uploading, onUpload, onRemove }) {
  const REQUIRED_DOCS = [
    { key: 'contratoSocial', label: 'Contrato Social', accept: '.pdf', desc: 'Envie o contrato social ou estatuto da empresa (PDF).' },
    { key: 'cartaoCnpj', label: 'Cartão CNPJ', accept: '.pdf,.jpg,.jpeg,.png', desc: 'Comprovante de inscrição e situação cadastral.' },
    { key: 'docResponsavel', label: 'Documento do Responsável Legal', accept: '.jpg,.jpeg,.png', desc: 'Foto da frente e verso do RG ou CNH.' },
    { key: 'selfieResponsavel', label: 'Selfie do Responsável Legal', accept: '.jpg,.jpeg,.png', desc: 'Selfie segurando o documento de identidade.' },
  ];

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[var(--pagsmile-blue)]">Envio de Documentos</h2>
      <p className="text-sm text-[var(--pagsmile-blue)]/60">Todos os documentos abaixo são obrigatórios.</p>
      
      <div className="space-y-4">
        {REQUIRED_DOCS.map(doc => (
          <div key={doc.key} className="border border-slate-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="font-semibold text-sm text-[var(--pagsmile-blue)]">{doc.label} <span className="text-red-500">*</span></p>
                <p className="text-xs text-[var(--pagsmile-blue)]/50 mt-1">{doc.desc}</p>
              </div>
              {documents[doc.key]?.url ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--pagsmile-green)] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Enviado
                  </span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(doc.key)}>
                    <X className="w-4 h-4 text-red-400" />
                  </Button>
                </div>
              ) : uploading[doc.key] ? (
                <Loader2 className="w-5 h-5 animate-spin text-[var(--pagsmile-green)]" />
              ) : null}
            </div>
            {!documents[doc.key]?.url && !uploading[doc.key] && (
              <label className="mt-3 flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-lg p-4 cursor-pointer hover:border-[var(--pagsmile-green)] transition-colors">
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-sm text-slate-500">Clique para enviar</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept={doc.accept}
                  onChange={e => {
                    if (e.target.files?.[0]) onUpload(doc.key, e.target.files[0]);
                  }}
                />
              </label>
            )}
            {documents[doc.key]?.name && (
              <p className="text-xs text-slate-400 mt-2 truncate">{documents[doc.key].name}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}