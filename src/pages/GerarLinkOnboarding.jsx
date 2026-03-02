import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, Link as LinkIcon, Copy, Check, ExternalLink, Info,
  Plus, QrCode, BarChart3, Eye, Trash2, Loader2, RefreshCw,
  TrendingUp, MousePointer, FileCheck, ChevronDown, ChevronUp
} from 'lucide-react';
import { toast } from 'sonner';
import LinkAnalyticsDashboard from '../components/analytics/LinkAnalyticsDashboard';

export default function GerarLinkOnboarding() {
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  const [expandedLinkId, setExpandedLinkId] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('all');
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    linkType: 'LEAD_QUESTIONNAIRE',
    questionnaireTemplateId: '',
    commercialAgentId: '',
    commercialAgentName: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    utmContent: '',
    expiresAt: '',
    complianceType: 'GENERIC'
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['questionnaireTemplates'],
    queryFn: () => base44.entities.QuestionnaireTemplate.filter({ isActive: true })
  });

  const { data: links = [], isLoading: linksLoading, refetch } = useQuery({
    queryKey: ['onboardingLinks'],
    queryFn: () => base44.entities.OnboardingLink.list('-created_date', 100)
  });

  const createLinkMutation = useMutation({
    mutationFn: async (data) => {
      const uniqueCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      return base44.entities.OnboardingLink.create({
        ...data,
        uniqueCode,
        isActive: true,
        clickCount: 0,
        submissionCount: 0,
        completedCount: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingLinks'] });
      toast.success('Link criado com sucesso!');
      setFormData({
        linkType: 'LEAD_QUESTIONNAIRE',
        questionnaireTemplateId: '',
        commercialAgentId: '',
        commercialAgentName: '',
        utmSource: '',
        utmMedium: '',
        utmCampaign: '',
        utmContent: '',
        expiresAt: '',
        complianceType: 'GENERIC'
      });
      setActiveTab('history');
    },
    onError: (error) => {
      toast.error('Erro ao criar link: ' + error.message);
    }
  });

  const deleteLinkMutation = useMutation({
    mutationFn: (id) => base44.entities.OnboardingLink.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingLinks'] });
      toast.success('Link excluído');
    }
  });

  // Links por tipo de compliance
  const getPageByLinkType = (link) => {
    if (link.linkType === 'LEAD_QUESTIONNAIRE') return 'LeadQuestionnaire';
    switch (link.complianceType) {
      case 'PIX': return 'CompliancePixOnly';
      case 'FULL': return 'ComplianceFullKYC';
      case 'LITE': return 'ComplianceLite';
      case 'ECOMMERCE': return 'ComplianceEcommerce';
      case 'SAAS': return 'ComplianceSaaS';
      default: return 'ComplianceOnboardingStart';
    }
  };

  const genericLinks = {
    LEAD: `${window.location.origin}${createPageUrl('LeadQuestionnaire')}`,
    LEAD_SIMPLIFICADO: `${window.location.origin}${createPageUrl('QuestionarioSimplificadoPublico')}`,
    GENERIC: `${window.location.origin}${createPageUrl('ComplianceOnboardingStart')}`,
    PIX: `${window.location.origin}${createPageUrl('CompliancePixOnly')}`,
    FULL: `${window.location.origin}${createPageUrl('ComplianceFullKYC')}`,
    LITE: `${window.location.origin}${createPageUrl('ComplianceLite')}`,
    ECOMMERCE: `${window.location.origin}${createPageUrl('ComplianceEcommerce')}`,
    SAAS: `${window.location.origin}${createPageUrl('ComplianceSaaS')}`
  };

  const generateLinkUrl = (link) => {
    const page = getPageByLinkType(link);
    let url = `${window.location.origin}${createPageUrl(page)}?ref=${link.uniqueCode}`;
    if (link.utmSource) url += `&utm_source=${link.utmSource}`;
    if (link.utmMedium) url += `&utm_medium=${link.utmMedium}`;
    if (link.utmCampaign) url += `&utm_campaign=${link.utmCampaign}`;
    if (link.utmContent) url += `&utm_content=${link.utmContent}`;
    return url;
  };

  const handleCopy = async (text, id = null) => {
    await navigator.clipboard.writeText(text);
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    toast.success('Link copiado!');
  };

  const handleCreateLink = () => {
    createLinkMutation.mutate(formData);
  };

  // Stats
  const stats = React.useMemo(() => {
    const totalClicks = links.reduce((sum, l) => sum + (l.clickCount || 0), 0);
    const totalSubmissions = links.reduce((sum, l) => sum + (l.submissionCount || 0), 0);
    const totalCompleted = links.reduce((sum, l) => sum + (l.completedCount || 0), 0);
    const conversionRate = totalClicks > 0 ? ((totalSubmissions / totalClicks) * 100).toFixed(1) : 0;
    
    return { totalClicks, totalSubmissions, totalCompleted, conversionRate, totalLinks: links.length };
  }, [links]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('AdminDashboard')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--pagsmile-blue)]">Links de Onboarding</h1>
            <p className="text-[var(--pagsmile-blue)]/70">Gere e gerencie links para novos merchants</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-[var(--pagsmile-blue)]">{stats.totalLinks}</p>
            <p className="text-xs text-[var(--pagsmile-blue)]/70">Links Criados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-blue-500" />
              <p className="text-2xl font-bold text-blue-600">{stats.totalClicks}</p>
            </div>
            <p className="text-xs text-[var(--pagsmile-blue)]/70">Total de Cliques</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-purple-500" />
              <p className="text-2xl font-bold text-purple-600">{stats.totalSubmissions}</p>
            </div>
            <p className="text-xs text-[var(--pagsmile-blue)]/70">Submissões</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <p className="text-2xl font-bold text-green-600">{stats.totalCompleted}</p>
            </div>
            <p className="text-xs text-[var(--pagsmile-blue)]/70">Completados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-500" />
              <p className="text-2xl font-bold text-teal-600">{stats.conversionRate}%</p>
            </div>
            <p className="text-xs text-[var(--pagsmile-blue)]/70">Taxa de Conversão</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generate">Gerar Link</TabsTrigger>
          <TabsTrigger value="history">Histórico ({links.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          {/* Links Rápidos por Tipo */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--pagsmile-green)]/10">
                  <LinkIcon className="w-5 h-5 text-[var(--pagsmile-green)]" />
                </div>
                <div>
                  <CardTitle>Links Rápidos</CardTitle>
                  <CardDescription>Links diretos para cada tipo de compliance (sem rastreamento)</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Link Questionário de Leads */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-[var(--pagsmile-green)] font-bold">📋 Questionário de Leads (Comercial)</Label>
                <div className="flex gap-2">
                  <Input readOnly value={genericLinks.LEAD} className="font-mono text-xs bg-green-50 border-green-200" />
                  <Button variant="outline" size="sm" onClick={() => handleCopy(genericLinks.LEAD)} className="shrink-0 border-green-200 hover:bg-green-50">
                    <Copy className="w-4 h-4 text-[var(--pagsmile-green)]" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(genericLinks.LEAD, '_blank')} className="shrink-0 border-green-200 hover:bg-green-50">
                    <ExternalLink className="w-4 h-4 text-[var(--pagsmile-green)]" />
                  </Button>
                </div>
              </div>

              {/* Link Questionário Simplificado */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-amber-600 font-bold">⚡ Questionário Simplificado (Pós-reunião)</Label>
                <div className="flex gap-2">
                  <Input readOnly value={genericLinks.LEAD_SIMPLIFICADO} className="font-mono text-xs bg-amber-50 border-amber-200" />
                  <Button variant="outline" size="sm" onClick={() => handleCopy(genericLinks.LEAD_SIMPLIFICADO)} className="shrink-0 border-amber-200 hover:bg-amber-50">
                    <Copy className="w-4 h-4 text-amber-600" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(genericLinks.LEAD_SIMPLIFICADO, '_blank')} className="shrink-0 border-amber-200 hover:bg-amber-50">
                    <ExternalLink className="w-4 h-4 text-amber-600" />
                  </Button>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <p className="text-xs font-semibold text-[var(--pagsmile-blue)]/50 uppercase tracking-wider mb-3">Links de Compliance</p>
              </div>

              {/* Link Genérico */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-[var(--pagsmile-blue)]/70">Genérico (escolha na página)</Label>
                <div className="flex gap-2">
                  <Input readOnly value={genericLinks.GENERIC} className="font-mono text-xs bg-slate-50" />
                  <Button variant="outline" size="sm" onClick={() => handleCopy(genericLinks.GENERIC)} className="shrink-0">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(genericLinks.GENERIC, '_blank')} className="shrink-0">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Link Compliance Pix */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-blue-600">Compliance Pix (simplificado)</Label>
                <div className="flex gap-2">
                  <Input readOnly value={genericLinks.PIX} className="font-mono text-xs bg-blue-50 border-blue-200" />
                  <Button variant="outline" size="sm" onClick={() => handleCopy(genericLinks.PIX)} className="shrink-0 border-blue-200 hover:bg-blue-50">
                    <Copy className="w-4 h-4 text-blue-600" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(genericLinks.PIX, '_blank')} className="shrink-0 border-blue-200 hover:bg-blue-50">
                    <ExternalLink className="w-4 h-4 text-blue-600" />
                  </Button>
                </div>
              </div>

              {/* Link Full Compliance */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-purple-600">Full Compliance (completo)</Label>
                <div className="flex gap-2">
                  <Input readOnly value={genericLinks.FULL} className="font-mono text-xs bg-purple-50 border-purple-200" />
                  <Button variant="outline" size="sm" onClick={() => handleCopy(genericLinks.FULL)} className="shrink-0 border-purple-200 hover:bg-purple-50">
                    <Copy className="w-4 h-4 text-purple-600" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(genericLinks.FULL, '_blank')} className="shrink-0 border-purple-200 hover:bg-purple-50">
                    <ExternalLink className="w-4 h-4 text-purple-600" />
                  </Button>
                </div>
              </div>

              {/* Link Perfil Lite */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-teal-600">Perfil Lite (PMEs simplificado)</Label>
                <div className="flex gap-2">
                  <Input readOnly value={genericLinks.LITE} className="font-mono text-xs bg-teal-50 border-teal-200" />
                  <Button variant="outline" size="sm" onClick={() => handleCopy(genericLinks.LITE)} className="shrink-0 border-teal-200 hover:bg-teal-50">
                    <Copy className="w-4 h-4 text-teal-600" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(genericLinks.LITE, '_blank')} className="shrink-0 border-teal-200 hover:bg-teal-50">
                    <ExternalLink className="w-4 h-4 text-teal-600" />
                  </Button>
                </div>
              </div>

              {/* Link E-commerce */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-orange-600">E-commerce Known (lojas virtuais)</Label>
                <div className="flex gap-2">
                  <Input readOnly value={genericLinks.ECOMMERCE} className="font-mono text-xs bg-orange-50 border-orange-200" />
                  <Button variant="outline" size="sm" onClick={() => handleCopy(genericLinks.ECOMMERCE)} className="shrink-0 border-orange-200 hover:bg-orange-50">
                    <Copy className="w-4 h-4 text-orange-600" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(genericLinks.ECOMMERCE, '_blank')} className="shrink-0 border-orange-200 hover:bg-orange-50">
                    <ExternalLink className="w-4 h-4 text-orange-600" />
                  </Button>
                </div>
              </div>

              {/* Link SaaS */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-violet-600">SaaS Fast Track (recorrência)</Label>
                <div className="flex gap-2">
                  <Input readOnly value={genericLinks.SAAS} className="font-mono text-xs bg-violet-50 border-violet-200" />
                  <Button variant="outline" size="sm" onClick={() => handleCopy(genericLinks.SAAS)} className="shrink-0 border-violet-200 hover:bg-violet-50">
                    <Copy className="w-4 h-4 text-violet-600" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(genericLinks.SAAS, '_blank')} className="shrink-0 border-violet-200 hover:bg-violet-50">
                    <ExternalLink className="w-4 h-4 text-violet-600" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Criar Link Personalizado */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Plus className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Link Personalizado</CardTitle>
                    <CardDescription>Crie um link com rastreamento e parâmetros</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
                  {showAdvanced ? 'Ocultar Avançado' : 'Mostrar Avançado'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tipo de Link */}
              <div className="space-y-2">
                <Label className="font-semibold">Tipo de Link *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, linkType: 'LEAD_QUESTIONNAIRE' }))}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      formData.linkType === 'LEAD_QUESTIONNAIRE' 
                        ? 'border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-semibold text-sm text-[var(--pagsmile-green)]">📋 Lead</p>
                    <p className="text-xs text-[var(--pagsmile-blue)]/60 mt-1">Questionário comercial</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, linkType: 'KYC_AVULSO' }))}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      formData.linkType === 'KYC_AVULSO' 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-semibold text-sm text-purple-600">🔒 Compliance</p>
                    <p className="text-xs text-[var(--pagsmile-blue)]/60 mt-1">KYC/KYB avulso</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, linkType: 'PROPOSAL' }))}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      formData.linkType === 'PROPOSAL' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="font-semibold text-sm text-blue-600">📄 Proposta</p>
                    <p className="text-xs text-[var(--pagsmile-blue)]/60 mt-1">Link de proposta</p>
                  </button>
                </div>
              </div>

              {/* Tipo de Compliance (só se KYC_AVULSO) */}
              {formData.linkType === 'KYC_AVULSO' && (
                <div className="space-y-2">
                  <Label className="font-semibold">Tipo de Compliance *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, complianceType: 'GENERIC' }))} className={`p-4 rounded-lg border-2 transition-all text-left ${formData.complianceType === 'GENERIC' ? 'border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5' : 'border-slate-200 hover:border-slate-300'}`}>
                      <p className="font-semibold text-sm text-[var(--pagsmile-blue)]">Genérico</p>
                      <p className="text-xs text-[var(--pagsmile-blue)]/60 mt-1">Merchant escolhe o tipo</p>
                    </button>
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, complianceType: 'PIX' }))} className={`p-4 rounded-lg border-2 transition-all text-left ${formData.complianceType === 'PIX' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <p className="font-semibold text-sm text-blue-600">Compliance Pix</p>
                      <p className="text-xs text-[var(--pagsmile-blue)]/60 mt-1">Fluxo simplificado</p>
                    </button>
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, complianceType: 'FULL' }))} className={`p-4 rounded-lg border-2 transition-all text-left ${formData.complianceType === 'FULL' ? 'border-purple-500 bg-purple-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <p className="font-semibold text-sm text-purple-600">Full Compliance</p>
                      <p className="text-xs text-[var(--pagsmile-blue)]/60 mt-1">KYC completo</p>
                    </button>
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, complianceType: 'LITE' }))} className={`p-4 rounded-lg border-2 transition-all text-left ${formData.complianceType === 'LITE' ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <p className="font-semibold text-sm text-teal-600">Perfil Lite</p>
                      <p className="text-xs text-[var(--pagsmile-blue)]/60 mt-1">PMEs simplificado</p>
                    </button>
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, complianceType: 'ECOMMERCE' }))} className={`p-4 rounded-lg border-2 transition-all text-left ${formData.complianceType === 'ECOMMERCE' ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <p className="font-semibold text-sm text-orange-600">E-commerce</p>
                      <p className="text-xs text-[var(--pagsmile-blue)]/60 mt-1">Lojas virtuais</p>
                    </button>
                    <button type="button" onClick={() => setFormData(prev => ({ ...prev, complianceType: 'SAAS' }))} className={`p-4 rounded-lg border-2 transition-all text-left ${formData.complianceType === 'SAAS' ? 'border-violet-500 bg-violet-50' : 'border-slate-200 hover:border-slate-300'}`}>
                      <p className="font-semibold text-sm text-violet-600">SaaS</p>
                      <p className="text-xs text-[var(--pagsmile-blue)]/60 mt-1">Recorrência</p>
                    </button>
                  </div>
                </div>
              )}

              {/* Questionário e Agente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Questionário (opcional)</Label>
                  <Select 
                    value={formData.questionnaireTemplateId} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, questionnaireTemplateId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o questionário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">Padrão (qualquer)</SelectItem>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Agente Comercial</Label>
                  <Input
                    value={formData.commercialAgentName}
                    onChange={(e) => setFormData(prev => ({ ...prev, commercialAgentName: e.target.value }))}
                    placeholder="Nome do agente"
                  />
                </div>
              </div>

              {showAdvanced && (
                <>
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-[var(--pagsmile-blue)]/90 mb-3">Parâmetros UTM</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Source</Label>
                        <Input
                          value={formData.utmSource}
                          onChange={(e) => setFormData(prev => ({ ...prev, utmSource: e.target.value }))}
                          placeholder="google, facebook"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Medium</Label>
                        <Input
                          value={formData.utmMedium}
                          onChange={(e) => setFormData(prev => ({ ...prev, utmMedium: e.target.value }))}
                          placeholder="email, cpc"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Campaign</Label>
                        <Input
                          value={formData.utmCampaign}
                          onChange={(e) => setFormData(prev => ({ ...prev, utmCampaign: e.target.value }))}
                          placeholder="black_friday"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Content</Label>
                        <Input
                          value={formData.utmContent}
                          onChange={(e) => setFormData(prev => ({ ...prev, utmContent: e.target.value }))}
                          placeholder="banner_top"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Expiração (opcional)</Label>
                    <Input
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <Button 
                onClick={handleCreateLink}
                disabled={createLinkMutation.isPending}
                className="w-full bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
              >
                {createLinkMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Criar Link Personalizado
              </Button>
            </CardContent>
          </Card>

          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              Links personalizados permitem rastrear a origem das submissões e medir a performance de campanhas e agentes comerciais.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle>Links Gerados</CardTitle>
                  <CardDescription>Histórico de todos os links criados</CardDescription>
                </div>
                <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setHistoryFilter('all')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${historyFilter === 'all' ? 'bg-white shadow-sm text-[var(--pagsmile-blue)]' : 'text-[var(--pagsmile-blue)]/60 hover:text-[var(--pagsmile-blue)]'}`}
                  >
                    Todos ({links.length})
                  </button>
                  <button
                    onClick={() => setHistoryFilter('lead')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${historyFilter === 'lead' ? 'bg-white shadow-sm text-green-700' : 'text-[var(--pagsmile-blue)]/60 hover:text-[var(--pagsmile-blue)]'}`}
                  >
                    📋 Leads ({links.filter(l => l.linkType === 'LEAD_QUESTIONNAIRE').length})
                  </button>
                  <button
                    onClick={() => setHistoryFilter('onboarding')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${historyFilter === 'onboarding' ? 'bg-white shadow-sm text-purple-700' : 'text-[var(--pagsmile-blue)]/60 hover:text-[var(--pagsmile-blue)]'}`}
                  >
                    🔒 Onboarding ({links.filter(l => l.linkType !== 'LEAD_QUESTIONNAIRE').length})
                  </button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {linksLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--pagsmile-blue)]/50" />
                </div>
              ) : links.length === 0 ? (
                <div className="text-center py-8">
                  <LinkIcon className="w-12 h-12 mx-auto text-[var(--pagsmile-blue)]/40 mb-4" />
                  <p className="text-[var(--pagsmile-blue)]/70">Nenhum link personalizado criado</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {links.filter(link => {
                    if (historyFilter === 'lead') return link.linkType === 'LEAD_QUESTIONNAIRE';
                    if (historyFilter === 'onboarding') return link.linkType !== 'LEAD_QUESTIONNAIRE';
                    return true;
                  }).map((link) => {
                    const conversion = link.clickCount > 0 
                      ? ((link.submissionCount / link.clickCount) * 100).toFixed(1) 
                      : 0;
                    const isExpanded = expandedLinkId === link.id;
                    
                    return (
                      <div key={link.id} className="border border-slate-200 rounded-lg overflow-hidden">
                        {/* Link Header */}
                        <div 
                          className="p-4 bg-white hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() => setExpandedLinkId(isExpanded ? null : link.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <Badge variant="outline" className="font-mono text-sm">{link.uniqueCode}</Badge>
                              <Badge 
                                className={`text-xs ${
                                  link.linkType === 'LEAD_QUESTIONNAIRE' ? 'bg-green-100 text-green-700' :
                                  link.complianceType === 'PIX' ? 'bg-blue-100 text-blue-700' :
                                  link.complianceType === 'FULL' ? 'bg-purple-100 text-purple-700' :
                                  link.complianceType === 'LITE' ? 'bg-teal-100 text-teal-700' :
                                  link.complianceType === 'ECOMMERCE' ? 'bg-orange-100 text-orange-700' :
                                  link.complianceType === 'SAAS' ? 'bg-violet-100 text-violet-700' :
                                  'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {link.linkType === 'LEAD_QUESTIONNAIRE' ? '📋 Lead' :
                                 link.complianceType === 'PIX' ? 'Pix' : 
                                 link.complianceType === 'FULL' ? 'Full' : 
                                 link.complianceType === 'LITE' ? 'Lite' : 
                                 link.complianceType === 'ECOMMERCE' ? 'E-commerce' : 
                                 link.complianceType === 'SAAS' ? 'SaaS' : 'Genérico'}
                              </Badge>
                              {link.commercialAgentName && (
                                <span className="text-sm text-[var(--pagsmile-blue)]/80">{link.commercialAgentName}</span>
                              )}
                              <span className="text-xs text-[var(--pagsmile-blue)]/50">
                                {link.created_date ? new Date(link.created_date).toLocaleDateString('pt-BR') : ''}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-6">
                              {/* Métricas resumidas */}
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1">
                                  <MousePointer className="w-3 h-3 text-blue-500" />
                                  <span className="font-medium text-blue-600">{link.clickCount || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <FileCheck className="w-3 h-3 text-purple-500" />
                                  <span className="font-medium text-purple-600">{link.submissionCount || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Check className="w-3 h-3 text-green-500" />
                                  <span className="font-medium text-green-600">{link.completedCount || 0}</span>
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  {conversion}% conv.
                                </Badge>
                              </div>

                              {/* Ações */}
                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleCopy(generateLinkUrl(link), link.id)}
                                >
                                  {copiedId === link.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => window.open(generateLinkUrl(link), '_blank')}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => deleteLinkMutation.mutate(link.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>

                              {/* Expand/Collapse */}
                              <Button variant="ghost" size="sm">
                                {isExpanded ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          </div>

                          {/* UTM Tags */}
                          {(link.utmSource || link.utmMedium || link.utmCampaign) && (
                            <div className="flex gap-2 mt-2">
                              {link.utmSource && <Badge variant="outline" className="text-xs">source: {link.utmSource}</Badge>}
                              {link.utmMedium && <Badge variant="outline" className="text-xs">medium: {link.utmMedium}</Badge>}
                              {link.utmCampaign && <Badge variant="outline" className="text-xs">campaign: {link.utmCampaign}</Badge>}
                            </div>
                          )}
                        </div>

                        {/* Analytics Dashboard Expandido */}
                        {isExpanded && (
                          <div className="border-t border-slate-200 bg-slate-50 p-4">
                            <h4 className="text-sm font-semibold text-[var(--pagsmile-blue)]/90 mb-4 flex items-center gap-2">
                              <BarChart3 className="w-4 h-4" />
                              Analytics Detalhado - Funil de Conversão
                            </h4>
                            <LinkAnalyticsDashboard linkId={link.id} linkCode={link.uniqueCode} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}