import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import SelectionButton from '../components/compliance/SelectionButton';
import { 
  Link as LinkIcon, Copy, CheckCircle2, ArrowLeft,
  User, Building2, Mail, Info
} from 'lucide-react';
import { toast } from 'sonner';

export default function GenerateOnboardingLink() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    merchantType: null,
    email: '',
    fullName: ''
  });
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  const createMerchantMutation = useMutation({
    mutationFn: async (data) => {
      // Criar merchant inicial
      const merchant = await base44.entities.Merchant.create({
        type: data.merchantType,
        email: data.email,
        fullName: data.fullName,
        cpfCnpj: '',
        onboardingStatus: 'Pendente'
      });

      // Criar caso de onboarding
      const onboardingCase = await base44.entities.OnboardingCase.create({
        merchantId: merchant.id,
        questionnaireTemplateId: '',
        status: 'Pendente'
      });

      return { merchant, onboardingCase };
    },
    onSuccess: (data) => {
      // Gerar link público
      const baseUrl = window.location.origin;
      const link = `${baseUrl}${createPageUrl('ComplianceOnboardingStart')}?caseId=${data.onboardingCase.id}`;
      setGeneratedLink(link);
      toast.success('Link gerado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao gerar link: ' + error.message);
    }
  });

  const handleGenerateLink = () => {
    if (!formData.merchantType || !formData.email) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    createMerchantMutation.mutate(formData);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setLinkCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Reset link quando dados mudam
    if (generatedLink) {
      setGeneratedLink('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl('AdminDashboard'))}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar ao Dashboard
        </Button>
        <h1 className="text-2xl font-bold text-slate-800">Gerar Link de Onboarding</h1>
        <p className="text-slate-500">Crie um link único para enviar ao merchant iniciar o processo de compliance.</p>
      </div>

      {/* Formulário */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        {/* Tipo de Merchant */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            Tipo de Merchant <span className="text-red-500">*</span>
          </Label>
          <SelectionButton
            options={[
              { 
                value: 'PF', 
                label: 'Pessoa Física', 
                description: 'CPF',
                icon: <User className="w-5 h-5" />
              },
              { 
                value: 'PJ', 
                label: 'Pessoa Jurídica', 
                description: 'CNPJ',
                icon: <Building2 className="w-5 h-5" />
              }
            ]}
            value={formData.merchantType}
            onChange={(value) => handleChange('merchantType', value)}
            columns={2}
          />
        </div>

        {/* E-mail */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-slate-700">
            E-mail do Merchant <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="email@empresa.com"
              className="pl-10"
            />
          </div>
        </div>

        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">
            Nome Completo / Razão Social
          </Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            placeholder="Nome do merchant"
          />
        </div>

        {/* Botão Gerar */}
        <Button
          onClick={handleGenerateLink}
          disabled={createMerchantMutation.isPending || !formData.merchantType || !formData.email}
          className="w-full bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
        >
          <LinkIcon className="w-4 h-4 mr-2" />
          {createMerchantMutation.isPending ? 'Gerando...' : 'Gerar Link de Onboarding'}
        </Button>

        {/* Link Gerado */}
        {generatedLink && (
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Link gerado com sucesso! Copie e envie para o merchant.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Link de Onboarding</Label>
              <div className="flex gap-2">
                <Input
                  value={generatedLink}
                  readOnly
                  className="bg-slate-50 text-sm"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className={linkCopied ? 'text-green-600 border-green-600' : ''}
                >
                  {linkCopied ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            O merchant poderá acessar este link para completar o questionário de compliance, 
            enviar documentos e realizar a verificação de identidade.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}