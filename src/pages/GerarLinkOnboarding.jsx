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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Link as LinkIcon, Copy, Check, ExternalLink, Info,
  Plus, BarChart3, Trash2, Loader2, RefreshCw,
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

  const getPageByLinkType = (link) => {
    if (link.linkType === 'LEAD_QUESTIONNAIRE') return 'LeadQuestionnaire';
    if (link.linkType === 'LEAD_SIMPLIFICADO') return 'QuestionarioSimplificadoPublico';
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
    LEAD: `${window.location.origin}${createPageUrl('LeadQuestionnaire')}?templateId=69a5ccbeafab70a7ca2184ad`,
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

  const stats = React.useMemo(() => {
    const totalClicks = links.reduce((sum, l) => sum + (l.clickCount || 0), 0);
    const totalSubmissions = links.reduce((sum, l) => sum + (l.submissionCount || 0), 0);
    const totalCompleted = links.reduce((sum, l) => sum + (l.completedCount || 0), 0);
    const conversionRate = totalClicks > 0 ? ((totalSubmissions / totalClicks) * 100).toFixed(1) : 0;
    const bestLink = links.reduce((best, l) => {
      if (!l.clickCount) return best;
      const rate = (l.submissionCount || 0) / l.clickCount;
      if (!best || rate > best.rate) return { code: l.uniqueCode, rate, agent: l.commercialAgentName };
      return best;
    }, null);
    return { totalClicks, totalSubmissions, totalCompleted, conversionRate, totalLinks: links.length, bestLink };
  }, [links]);

  const LINK_TYPE_STYLES = {
    LEAD_QUESTIONNAIRE: { label: '📋 Lead', bg: 'bg-[#2bc196]/10', border: 'border-[#2bc196]/20', text: 'text-[#2bc196]' },
    LEAD_SIMPLIFICADO: { label: '⚡ Simplificado', bg: 'bg-[#36706c]/10', border: 'border-[#36706c]/20', text: 'text-[#36706c]' },
    KYC_AVULSO: { label: '🔒 Compliance', bg: 'bg-[#002443]/5', border: 'border-[#002443]/10', text: 'text-[#002443]' },
    PROPOSAL: { label: '📄 Proposta', bg: 'bg-[#5cf7cf]/10', border: 'border-[#5cf7cf]/30', text: 'text-[#36706c]' },
  };

  const getLinkBadgeStyle = (link) => {
    if (link.linkType === 'LEAD_QUESTIONNAIRE') return 'bg-[#2bc196]/10 text-[#2bc196]';
    if (link.linkType === 'LEAD_SIMPLIFICADO') return 'bg-[#36706c]/10 text-[#36706c]';
    return 'bg-[#002443]/10 text-[#002443]';
  };

  const getLinkLabel = (link) => {
    if (link.linkType === 'LEAD_QUESTIONNAIRE') return '📋 Lead';
    if (link.linkType === 'LEAD_SIMPLIFICADO') return '⚡ Simplificado';
    const ct = link.complianceType;
    if (ct === 'PIX') return 'Pix';
    if (ct === 'FULL') return 'Full';
    if (ct === 'LITE') return 'Lite';
    if (ct === 'ECOMMERCE') return 'E-commerce';
    if (ct === 'SAAS') return 'SaaS';
    return 'Genérico';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002443]">Links de Onboarding</h1>
          <p className="text-sm text-[#002443]/60">Gere e gerencie links para novos merchants</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="border-[#002443]/10 hover:bg-[#f4f4f4]">
          <RefreshCw className="w-4 h-4 mr-2 text-[#002443]/50" />
          <span className="text-[#002443]/70">Atualizar</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Links Criados', value: stats.totalLinks, icon: LinkIcon, color: '#002443' },
          { label: 'Total de Cliques', value: stats.totalClicks, icon: MousePointer, color: '#36706c' },
          { label: 'Submissões', value: stats.totalSubmissions, icon: FileCheck, color: '#2bc196' },
          { label: 'Completados', value: stats.totalCompleted, icon: Check, color: '#2bc196' },
          { label: 'Clique → Submissão', value: `${stats.conversionRate}%`, icon: TrendingUp, color: '#36706c' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#002443]/5 p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
              <p className="text-2xl font-bold text-[#002443]">{s.value}</p>
            </div>
            <p className="text-xs text-[#002443]/50">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Best link */}
      {stats.bestLink && stats.bestLink.rate > 0 && (
        <div className="bg-[#2bc196]/5 border border-[#2bc196]/15 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#2bc196]/10 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-[#2bc196]" />
          </div>
          <p className="text-sm text-[#002443]">
            Melhor link: <span className="font-mono font-semibold">{stats.bestLink.code}</span> — {(stats.bestLink.rate * 100).toFixed(0)}% de conversão
            {stats.bestLink.agent && <span className="text-[#002443]/50 ml-1">({stats.bestLink.agent})</span>}
          </p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#f4f4f4] border border-[#002443]/5">
          <TabsTrigger value="generate" className="data-[state=active]:bg-white data-[state=active]:text-[#002443] data-[state=active]:shadow-sm">Gerar Link</TabsTrigger>
          <TabsTrigger value="history" className="data-[state=active]:bg-white data-[state=active]:text-[#002443] data-[state=active]:shadow-sm">Histórico ({links.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6 mt-6">
          {/* Links Rápidos */}
          <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#002443]/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2bc196]/10 flex items-center justify-center">
                  <LinkIcon className="w-5 h-5 text-[#2bc196]" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#002443]">Links Rápidos</h2>
                  <p className="text-xs text-[#002443]/50">Links diretos para cada tipo (sem rastreamento)</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Leads & Simplificado */}
              {[
                { key: 'LEAD', label: '📋 Questionário de Leads (Comercial)', accent: '#2bc196' },
                { key: 'LEAD_SIMPLIFICADO', label: '⚡ Questionário Simplificado (Pós-reunião)', accent: '#36706c' },
              ].map(item => (
                <div key={item.key} className="space-y-1.5">
                  <Label className="text-xs font-semibold" style={{ color: item.accent }}>{item.label}</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={genericLinks[item.key]} className="font-mono text-xs bg-[#f4f4f4] border-[#002443]/5" />
                    <Button variant="outline" size="sm" onClick={() => handleCopy(genericLinks[item.key])} className="shrink-0 border-[#002443]/10 hover:bg-[#f4f4f4]">
                      <Copy className="w-4 h-4" style={{ color: item.accent }} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open(genericLinks[item.key], '_blank')} className="shrink-0 border-[#002443]/10 hover:bg-[#f4f4f4]">
                      <ExternalLink className="w-4 h-4" style={{ color: item.accent }} />
                    </Button>
                  </div>
                </div>
              ))}

              <div className="border-t border-[#002443]/5 pt-4">
                <p className="text-[10px] font-bold text-[#002443]/30 uppercase tracking-[0.15em] mb-3">Links de Compliance</p>
              </div>

              {[
                { key: 'GENERIC', label: 'Genérico (escolha na página)' },
                { key: 'PIX', label: 'Compliance Pix (simplificado)' },
                { key: 'FULL', label: 'Full Compliance (completo)' },
                { key: 'LITE', label: 'Perfil Lite (PMEs simplificado)' },
                { key: 'ECOMMERCE', label: 'E-commerce Known (lojas virtuais)' },
                { key: 'SAAS', label: 'SaaS Fast Track (recorrência)' },
              ].map(item => (
                <div key={item.key} className="space-y-1.5">
                  <Label className="text-xs font-medium text-[#002443]/60">{item.label}</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={genericLinks[item.key]} className="font-mono text-xs bg-[#f4f4f4] border-[#002443]/5" />
                    <Button variant="outline" size="sm" onClick={() => handleCopy(genericLinks[item.key])} className="shrink-0 border-[#002443]/10 hover:bg-[#f4f4f4]">
                      <Copy className="w-4 h-4 text-[#002443]/40" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open(genericLinks[item.key], '_blank')} className="shrink-0 border-[#002443]/10 hover:bg-[#f4f4f4]">
                      <ExternalLink className="w-4 h-4 text-[#002443]/40" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Link Personalizado */}
          <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#002443]/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#002443]/5 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-[#002443]" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#002443]">Link Personalizado</h2>
                    <p className="text-xs text-[#002443]/50">Crie um link com rastreamento e parâmetros</p>
                  </div>
                </div>
                <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-xs font-medium text-[#2bc196] hover:text-[#36706c] transition-colors">
                  {showAdvanced ? 'Ocultar Avançado' : 'Mostrar Avançado'}
                </button>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {/* Tipo de Link */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-[#002443]">Tipo de Link *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'LEAD_QUESTIONNAIRE', emoji: '📋', label: 'Lead', desc: 'Questionário comercial', accent: '#2bc196' },
                    { value: 'LEAD_SIMPLIFICADO', emoji: '⚡', label: 'Simplificado', desc: 'Pós-reunião (taxas)', accent: '#36706c' },
                    { value: 'KYC_AVULSO', emoji: '🔒', label: 'Compliance', desc: 'KYC/KYB avulso', accent: '#002443' },
                    { value: 'PROPOSAL', emoji: '📄', label: 'Proposta', desc: 'Link de proposta', accent: '#36706c' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, linkType: opt.value }))}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        formData.linkType === opt.value 
                          ? 'border-[#2bc196] bg-[#2bc196]/5 shadow-sm' 
                          : 'border-[#002443]/5 hover:border-[#002443]/15 bg-white'
                      }`}
                    >
                      <p className="font-semibold text-sm" style={{ color: opt.accent }}>{opt.emoji} {opt.label}</p>
                      <p className="text-xs text-[#002443]/40 mt-1">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Compliance Type */}
              {formData.linkType === 'KYC_AVULSO' && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-[#002443]">Tipo de Compliance *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                    {[
                      { value: 'GENERIC', label: 'Genérico', desc: 'Merchant escolhe' },
                      { value: 'PIX', label: 'Pix', desc: 'Simplificado' },
                      { value: 'FULL', label: 'Full', desc: 'KYC completo' },
                      { value: 'LITE', label: 'Lite', desc: 'PMEs' },
                      { value: 'ECOMMERCE', label: 'E-commerce', desc: 'Lojas virtuais' },
                      { value: 'SAAS', label: 'SaaS', desc: 'Recorrência' },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, complianceType: opt.value }))}
                        className={`p-3 rounded-xl border-2 transition-all text-left ${
                          formData.complianceType === opt.value 
                            ? 'border-[#2bc196] bg-[#2bc196]/5' 
                            : 'border-[#002443]/5 hover:border-[#002443]/15'
                        }`}
                      >
                        <p className="font-semibold text-xs text-[#002443]">{opt.label}</p>
                        <p className="text-[10px] text-[#002443]/40 mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Questionário e Agente */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#002443]/50">Questionário (opcional)</Label>
                  <Select 
                    value={formData.questionnaireTemplateId} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, questionnaireTemplateId: v }))}
                  >
                    <SelectTrigger className="border-[#002443]/10 bg-white">
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
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#002443]/50">Agente Comercial</Label>
                  <Input
                    value={formData.commercialAgentName}
                    onChange={(e) => setFormData(prev => ({ ...prev, commercialAgentName: e.target.value }))}
                    placeholder="Nome do agente"
                    className="border-[#002443]/10"
                  />
                </div>
              </div>

              {showAdvanced && (
                <>
                  <div className="border-t border-[#002443]/5 pt-4">
                    <p className="text-xs font-semibold text-[#002443]/70 mb-3">Parâmetros UTM</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {['Source', 'Medium', 'Campaign', 'Content'].map((field) => (
                        <div key={field} className="space-y-1.5">
                          <Label className="text-xs text-[#002443]/40">{field}</Label>
                          <Input
                            value={formData[`utm${field}`]}
                            onChange={(e) => setFormData(prev => ({ ...prev, [`utm${field}`]: e.target.value }))}
                            placeholder={field === 'Source' ? 'google, facebook' : field === 'Medium' ? 'email, cpc' : field === 'Campaign' ? 'black_friday' : 'banner_top'}
                            className="border-[#002443]/10"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#002443]/40">Data de Expiração (opcional)</Label>
                    <Input
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                      className="border-[#002443]/10"
                    />
                  </div>
                </>
              )}

              <Button 
                onClick={handleCreateLink}
                disabled={createLinkMutation.isPending}
                className="w-full bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl h-11"
              >
                {createLinkMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Criar Link Personalizado
              </Button>
            </div>
          </div>

          <div className="bg-[#002443]/5 rounded-2xl p-4 flex items-start gap-3">
            <Info className="w-4 h-4 text-[#002443]/40 mt-0.5 shrink-0" />
            <p className="text-xs text-[#002443]/60">
              Links personalizados permitem rastrear a origem das submissões e medir a performance de campanhas e agentes comerciais.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#002443]/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-[#002443]">Links Gerados</h2>
                  <p className="text-xs text-[#002443]/50">Histórico de todos os links criados</p>
                </div>
                <div className="flex items-center gap-1 bg-[#f4f4f4] rounded-xl p-1 border border-[#002443]/5">
                  {[
                    { key: 'all', label: `Todos (${links.length})` },
                    { key: 'lead', label: `📋 Leads (${links.filter(l => l.linkType === 'LEAD_QUESTIONNAIRE').length})` },
                    { key: 'simplificado', label: `⚡ Simpl. (${links.filter(l => l.linkType === 'LEAD_SIMPLIFICADO').length})` },
                    { key: 'onboarding', label: `🔒 Onb. (${links.filter(l => !['LEAD_QUESTIONNAIRE', 'LEAD_SIMPLIFICADO'].includes(l.linkType)).length})` },
                  ].map(f => (
                    <button
                      key={f.key}
                      onClick={() => setHistoryFilter(f.key)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        historyFilter === f.key 
                          ? 'bg-white shadow-sm text-[#002443]' 
                          : 'text-[#002443]/40 hover:text-[#002443]/70'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6">
              {linksLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#2bc196]" />
                </div>
              ) : links.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-[#f4f4f4] flex items-center justify-center mx-auto mb-4">
                    <LinkIcon className="w-7 h-7 text-[#002443]/20" />
                  </div>
                  <p className="text-sm text-[#002443]/50">Nenhum link personalizado criado</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {links.filter(link => {
                    if (historyFilter === 'lead') return link.linkType === 'LEAD_QUESTIONNAIRE';
                    if (historyFilter === 'simplificado') return link.linkType === 'LEAD_SIMPLIFICADO';
                    if (historyFilter === 'onboarding') return !['LEAD_QUESTIONNAIRE', 'LEAD_SIMPLIFICADO'].includes(link.linkType);
                    return true;
                  }).map((link) => {
                    const conversion = link.clickCount > 0 
                      ? ((link.submissionCount / link.clickCount) * 100).toFixed(1) 
                      : 0;
                    const isExpanded = expandedLinkId === link.id;
                    
                    return (
                      <div key={link.id} className="border border-[#002443]/5 rounded-2xl overflow-hidden bg-white hover:shadow-sm transition-shadow">
                        <div 
                          className="p-4 cursor-pointer transition-colors"
                          onClick={() => setExpandedLinkId(isExpanded ? null : link.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-wrap">
                              <Badge variant="outline" className="font-mono text-sm border-[#002443]/10">{link.uniqueCode}</Badge>
                              <Badge className={`${getLinkBadgeStyle(link)} text-xs border-0`}>
                                {getLinkLabel(link)}
                              </Badge>
                              {link.commercialAgentName && (
                                <span className="text-sm text-[#002443]/60">{link.commercialAgentName}</span>
                              )}
                              <span className="text-xs text-[#002443]/30">
                                {link.created_date ? new Date(link.created_date).toLocaleDateString('pt-BR') : ''}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="hidden md:flex items-center gap-3 text-sm">
                                <div className="flex items-center gap-1">
                                  <MousePointer className="w-3 h-3 text-[#36706c]" />
                                  <span className="font-medium text-[#36706c]">{link.clickCount || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <FileCheck className="w-3 h-3 text-[#2bc196]" />
                                  <span className="font-medium text-[#2bc196]">{link.submissionCount || 0}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Check className="w-3 h-3 text-[#2bc196]" />
                                  <span className="font-medium text-[#2bc196]">{link.completedCount || 0}</span>
                                </div>
                                <Badge className="text-xs bg-[#f4f4f4] text-[#002443]/60 border-0">
                                  {conversion}%
                                </Badge>
                              </div>

                              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                <Button variant="ghost" size="sm" onClick={() => handleCopy(generateLinkUrl(link), link.id)} className="h-8 w-8 p-0">
                                  {copiedId === link.id ? <Check className="w-4 h-4 text-[#2bc196]" /> : <Copy className="w-4 h-4 text-[#002443]/40" />}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => window.open(generateLinkUrl(link), '_blank')} className="h-8 w-8 p-0">
                                  <ExternalLink className="w-4 h-4 text-[#002443]/40" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => deleteLinkMutation.mutate(link.id)} className="h-8 w-8 p-0 text-red-400 hover:text-red-600">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>

                              <button className="text-[#002443]/30">
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>

                          {(link.utmSource || link.utmMedium || link.utmCampaign) && (
                            <div className="flex gap-2 mt-2">
                              {link.utmSource && <Badge variant="outline" className="text-[10px] border-[#002443]/10 text-[#002443]/40">source: {link.utmSource}</Badge>}
                              {link.utmMedium && <Badge variant="outline" className="text-[10px] border-[#002443]/10 text-[#002443]/40">medium: {link.utmMedium}</Badge>}
                              {link.utmCampaign && <Badge variant="outline" className="text-[10px] border-[#002443]/10 text-[#002443]/40">campaign: {link.utmCampaign}</Badge>}
                            </div>
                          )}
                        </div>

                        {isExpanded && (
                          <div className="border-t border-[#002443]/5 bg-[#f4f4f4] p-4">
                            <h4 className="text-sm font-semibold text-[#002443]/70 mb-4 flex items-center gap-2">
                              <BarChart3 className="w-4 h-4 text-[#2bc196]" />
                              Analytics Detalhado
                            </h4>
                            <LinkAnalyticsDashboard linkId={link.id} linkCode={link.uniqueCode} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}