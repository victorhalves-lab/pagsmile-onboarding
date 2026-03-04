import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Link as LinkIcon, Copy, Check, ExternalLink, Info,
  Plus, BarChart3, Trash2, Loader2, RefreshCw,
  TrendingUp, MousePointer, FileCheck, ChevronDown, ChevronUp,
  ClipboardList, Shield, Zap, ShoppingCart, Cloud, CreditCard, Globe
} from 'lucide-react';
import { toast } from 'sonner';
import LinkAnalyticsDashboard from '../components/analytics/LinkAnalyticsDashboard';

export default function GerarLinkOnboarding() {
  const [copiedKey, setCopiedKey] = useState(null);
  const [expandedLinkId, setExpandedLinkId] = useState(null);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [activeSection, setActiveSection] = useState('leads');
  const [showPersonalizado, setShowPersonalizado] = useState(false);
  const queryClient = useQueryClient();

  // Personalizado form
  const [pForm, setPForm] = useState({
    linkType: 'LEAD_QUESTIONNAIRE', complianceType: 'GENERIC',
    commercialAgentName: '', utmSource: '', utmMedium: '', utmCampaign: '', utmContent: '', expiresAt: '',
    questionnaireTemplateId: ''
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
      return base44.entities.OnboardingLink.create({ ...data, uniqueCode, isActive: true, clickCount: 0, submissionCount: 0, completedCount: 0 });
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['onboardingLinks'] }); toast.success('Link criado!'); setShowPersonalizado(false); }
  });

  const deleteLinkMutation = useMutation({
    mutationFn: (id) => base44.entities.OnboardingLink.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['onboardingLinks'] }); toast.success('Link excluído'); }
  });

  const getPageByLinkType = (link) => {
    if (link.linkType === 'LEAD_QUESTIONNAIRE') return 'LeadQuestionnaire';
    if (link.linkType === 'LEAD_SIMPLIFICADO') return 'QuestionarioSimplificadoPublico';
    switch (link.complianceType) {
      case 'PIX': return 'CompliancePixOnly'; case 'FULL': return 'ComplianceFullKYC';
      case 'LITE': return 'ComplianceLite'; case 'ECOMMERCE': return 'ComplianceEcommerce';
      case 'SAAS': return 'ComplianceSaaS'; default: return 'ComplianceOnboardingStart';
    }
  };

  const base = window.location.origin;
  const quickLinks = {
    leads: [
      { key: 'LEAD', label: 'Questionário Comercial', desc: 'Formulário completo para captação de leads', icon: ClipboardList, color: '#2bc196', url: `${base}${createPageUrl('LeadQuestionnaire')}?templateId=69a5ccbeafab70a7ca2184ad` },
      { key: 'LEAD_SIMP', label: 'Questionário Simplificado', desc: 'Versão rápida pós-reunião com taxas', icon: Zap, color: '#36706c', url: `${base}${createPageUrl('QuestionarioSimplificadoPublico')}` },
    ],
    compliance_by_type: [
      { key: 'GENERIC', label: 'Genérico', desc: 'Merchant escolhe o perfil', icon: Globe, color: '#002443', url: `${base}${createPageUrl('ComplianceOnboardingStart')}` },
      { key: 'PIX', label: 'Pix', desc: 'Compliance simplificado Pix', icon: CreditCard, color: '#2bc196', url: `${base}${createPageUrl('CompliancePixOnly')}` },
      { key: 'FULL', label: 'Full KYC', desc: 'Compliance completo', icon: Shield, color: '#002443', url: `${base}${createPageUrl('ComplianceFullKYC')}` },
      { key: 'LITE', label: 'Lite', desc: 'PMEs simplificado', icon: Zap, color: '#36706c', url: `${base}${createPageUrl('ComplianceLite')}` },
      { key: 'ECOMMERCE', label: 'E-commerce', desc: 'Lojas virtuais', icon: ShoppingCart, color: '#002443', url: `${base}${createPageUrl('ComplianceEcommerce')}` },
      { key: 'SAAS', label: 'SaaS', desc: 'Recorrência / fast track', icon: Cloud, color: '#36706c', url: `${base}${createPageUrl('ComplianceSaaS')}` },
    ],
    compliance_by_business: [
      { key: 'MERCHANT', label: 'Merchant', desc: 'Estabelecimento comercial padrão', icon: CreditCard, color: '#2bc196', url: `${base}${createPageUrl('ComplianceOnboardingStart')}?businessSubCategory=MERCHAN` },
      { key: 'GATEWAY', label: 'Gateway', desc: 'Integrador / facilitador de pagamentos', icon: Globe, color: '#002443', url: `${base}${createPageUrl('ComplianceOnboardingStart')}?businessSubCategory=GATEWAY` },
      { key: 'MARKETPLACE', label: 'Marketplace', desc: 'Plataforma com sellers / sub-merchants', icon: ShoppingCart, color: '#36706c', url: `${base}${createPageUrl('ComplianceOnboardingStart')}?businessSubCategory=MARKETPLACE` },
    ]
  };

  const generateLinkUrl = (link) => {
    const page = getPageByLinkType(link);
    let url = `${base}${createPageUrl(page)}?ref=${link.uniqueCode}`;
    if (link.utmSource) url += `&utm_source=${link.utmSource}`;
    if (link.utmMedium) url += `&utm_medium=${link.utmMedium}`;
    if (link.utmCampaign) url += `&utm_campaign=${link.utmCampaign}`;
    return url;
  };

  const handleCopy = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    toast.success('Copiado!');
  };

  const stats = React.useMemo(() => {
    const tc = links.reduce((s, l) => s + (l.clickCount || 0), 0);
    const ts = links.reduce((s, l) => s + (l.submissionCount || 0), 0);
    const tco = links.reduce((s, l) => s + (l.completedCount || 0), 0);
    return { totalLinks: links.length, totalClicks: tc, totalSubmissions: ts, totalCompleted: tco, convRate: tc > 0 ? ((ts / tc) * 100).toFixed(1) : 0 };
  }, [links]);

  const getLinkLabel = (link) => {
    if (link.linkType === 'LEAD_QUESTIONNAIRE') return '📋 Lead';
    if (link.linkType === 'LEAD_SIMPLIFICADO') return '⚡ Simplificado';
    const ct = link.complianceType;
    if (ct === 'PIX') return '💳 Pix'; if (ct === 'FULL') return '🔒 Full';
    if (ct === 'LITE') return '⚡ Lite'; if (ct === 'ECOMMERCE') return '🛒 E-comm';
    if (ct === 'SAAS') return '☁️ SaaS'; return '🌐 Genérico';
  };

  const getLinkBadgeStyle = (link) => {
    if (link.linkType === 'LEAD_QUESTIONNAIRE') return 'bg-[#2bc196]/10 text-[#2bc196]';
    if (link.linkType === 'LEAD_SIMPLIFICADO') return 'bg-[#36706c]/10 text-[#36706c]';
    return 'bg-[#002443]/10 text-[#002443]';
  };

  const QuickLinkCard = ({ item }) => (
    <div className="bg-white rounded-2xl border border-[#002443]/5 p-4 hover:shadow-md transition-all group">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}10` }}>
          <item.icon className="w-4 h-4" style={{ color: item.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#002443]">{item.label}</h3>
          <p className="text-[10px] text-[#002443]/40">{item.desc}</p>
        </div>
      </div>
      <div className="flex gap-1.5">
        <button onClick={() => handleCopy(item.url, item.key)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
            copiedKey === item.key ? 'bg-[#2bc196] text-white' : 'bg-[#f4f4f4] text-[#002443]/60 hover:bg-[#2bc196]/10 hover:text-[#2bc196]'
          }`}>
          {copiedKey === item.key ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copiedKey === item.key ? 'Copiado!' : 'Copiar'}
        </button>
        <button onClick={() => window.open(item.url, '_blank')}
          className="px-3 py-2 rounded-xl bg-[#f4f4f4] text-[#002443]/40 hover:bg-[#002443]/5 hover:text-[#002443] transition-all">
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#2bc196]/10 flex items-center justify-center">
            <LinkIcon className="w-5 h-5 text-[#2bc196]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#002443]">Gerar Link</h1>
            <p className="text-sm text-[#002443]/60">Links rápidos e personalizados para onboarding</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="border-[#002443]/10 hover:bg-[#f4f4f4] rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2 text-[#002443]/50" /> <span className="text-[#002443]/70">Atualizar</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Links', value: stats.totalLinks, icon: LinkIcon, color: '#002443' },
          { label: 'Cliques', value: stats.totalClicks, icon: MousePointer, color: '#36706c' },
          { label: 'Submissões', value: stats.totalSubmissions, icon: FileCheck, color: '#2bc196' },
          { label: 'Completados', value: stats.totalCompleted, icon: Check, color: '#2bc196' },
          { label: 'Conversão', value: `${stats.convRate}%`, icon: TrendingUp, color: '#36706c' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#002443]/5 p-4">
            <div className="flex items-center gap-2 mb-1"><s.icon className="w-4 h-4" style={{ color: s.color }} /><p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p></div>
            <p className="text-[10px] text-[#002443]/40">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Section Tabs */}
      <div className="flex gap-2 bg-[#f4f4f4] rounded-2xl p-1.5 border border-[#002443]/5">
        {[
          { id: 'leads', label: '📋 Links de Leads', icon: ClipboardList },
          { id: 'compliance', label: '🔒 Links de Compliance', icon: Shield },
          { id: 'personalizado', label: '✨ Link Personalizado', icon: Plus },
          { id: 'historico', label: `📊 Histórico (${links.length})`, icon: BarChart3 },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveSection(tab.id)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeSection === tab.id
                ? 'bg-white text-[#002443] shadow-sm'
                : 'text-[#002443]/40 hover:text-[#002443]/60'
            }`}>{tab.label}</button>
        ))}
      </div>

      {/* === SECTION: Links de Leads === */}
      {activeSection === 'leads' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-[#2bc196]/10 flex items-center justify-center"><ClipboardList className="w-4 h-4 text-[#2bc196]" /></div>
            <div>
              <h2 className="text-base font-bold text-[#002443]">Links de Leads</h2>
              <p className="text-xs text-[#002443]/40">Questionários para captação e qualificação de leads</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quickLinks.leads.map(item => <QuickLinkCard key={item.key} item={item} />)}
          </div>
          <div className="bg-[#2bc196]/5 border border-[#2bc196]/10 rounded-2xl p-3 flex items-start gap-2">
            <Info className="w-4 h-4 text-[#2bc196] mt-0.5 shrink-0" />
            <p className="text-[10px] text-[#002443]/50">Links diretos sem rastreamento. Para rastrear origem, crie um Link Personalizado na aba dedicada.</p>
          </div>
        </div>
      )}

      {/* === SECTION: Links de Compliance === */}
      {activeSection === 'compliance' && (
        <div className="space-y-6">
          {/* Por Sub-Categoria de Negócio */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#2bc196]/10 flex items-center justify-center"><Briefcase className="w-4 h-4 text-[#2bc196]" /></div>
              <div>
                <h2 className="text-base font-bold text-[#002443]">Por Tipo de Negócio</h2>
                <p className="text-xs text-[#002443]/40">Links diretos por sub-categoria: Merchant, Gateway ou Marketplace</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickLinks.compliance_by_business.map(item => <QuickLinkCard key={item.key} item={item} />)}
            </div>
          </div>

          {/* Por Tipo de Compliance */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#002443]/5 flex items-center justify-center"><Shield className="w-4 h-4 text-[#002443]" /></div>
              <div>
                <h2 className="text-base font-bold text-[#002443]">Por Tipo de Compliance</h2>
                <p className="text-xs text-[#002443]/40">Questionários KYC/KYB específicos por modelo</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickLinks.compliance_by_type.map(item => <QuickLinkCard key={item.key} item={item} />)}
            </div>
          </div>
        </div>
      )}

      {/* === SECTION: Link Personalizado === */}
      {activeSection === 'personalizado' && (
        <div className="bg-white rounded-2xl border border-[#002443]/5 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#002443]/5 flex items-center justify-center"><Plus className="w-5 h-5 text-[#002443]" /></div>
            <div>
              <h2 className="text-base font-bold text-[#002443]">Criar Link Personalizado</h2>
              <p className="text-xs text-[#002443]/40">Com rastreamento UTM, agente e expiração</p>
            </div>
          </div>

          {/* Tipo de Link */}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-[#002443]/30 uppercase tracking-[0.15em]">Tipo de Link</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'LEAD_QUESTIONNAIRE', label: '📋 Lead', desc: 'Questionário comercial', color: '#2bc196' },
                { value: 'LEAD_SIMPLIFICADO', label: '⚡ Simplificado', desc: 'Pós-reunião', color: '#36706c' },
                { value: 'KYC_AVULSO', label: '🔒 Compliance', desc: 'KYC/KYB avulso', color: '#002443' },
                { value: 'PROPOSAL', label: '📄 Proposta', desc: 'Link de proposta', color: '#36706c' },
              ].map(opt => (
                <button key={opt.value} onClick={() => setPForm(prev => ({ ...prev, linkType: opt.value }))}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    pForm.linkType === opt.value ? 'border-[#2bc196] bg-[#2bc196]/5 shadow-sm' : 'border-[#002443]/5 hover:border-[#002443]/15'
                  }`}>
                  <p className="font-bold text-sm" style={{ color: opt.color }}>{opt.label}</p>
                  <p className="text-[10px] text-[#002443]/40 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Compliance sub-type */}
          {pForm.linkType === 'KYC_AVULSO' && (
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-[#002443]/30 uppercase tracking-[0.15em]">Perfil de Compliance</Label>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {[
                  { v: 'GENERIC', l: '🌐 Genérico' }, { v: 'PIX', l: '💳 Pix' }, { v: 'FULL', l: '🔒 Full' },
                  { v: 'LITE', l: '⚡ Lite' }, { v: 'ECOMMERCE', l: '🛒 E-comm' }, { v: 'SAAS', l: '☁️ SaaS' },
                ].map(opt => (
                  <button key={opt.v} onClick={() => setPForm(prev => ({ ...prev, complianceType: opt.v }))}
                    className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold transition-all ${
                      pForm.complianceType === opt.v ? 'border-[#2bc196] bg-[#2bc196]/5 text-[#002443]' : 'border-[#002443]/5 text-[#002443]/40 hover:border-[#002443]/15'
                    }`}>{opt.l}</button>
                ))}
              </div>
            </div>
          )}

          {/* Questionário selector as buttons */}
          {(pForm.linkType === 'LEAD_QUESTIONNAIRE' || pForm.linkType === 'KYC_AVULSO') && templates.length > 0 && (
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-[#002443]/30 uppercase tracking-[0.15em]">Questionário (opcional)</Label>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => setPForm(prev => ({ ...prev, questionnaireTemplateId: '' }))}
                  className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                    !pForm.questionnaireTemplateId ? 'border-[#2bc196] bg-[#2bc196]/5 text-[#2bc196]' : 'border-[#002443]/5 text-[#002443]/40 hover:border-[#002443]/15'
                  }`}>Padrão</button>
                {templates.map(t => (
                  <button key={t.id} onClick={() => setPForm(prev => ({ ...prev, questionnaireTemplateId: t.id }))}
                    className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                      pForm.questionnaireTemplateId === t.id ? 'border-[#2bc196] bg-[#2bc196]/5 text-[#2bc196]' : 'border-[#002443]/5 text-[#002443]/40 hover:border-[#002443]/15'
                    }`}>{t.name}</button>
                ))}
              </div>
            </div>
          )}

          {/* Agente + UTM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1"><Label className="text-[10px] font-bold text-[#002443]/30 uppercase tracking-[0.15em]">Agente Comercial</Label>
              <Input value={pForm.commercialAgentName} onChange={(e) => setPForm(prev => ({ ...prev, commercialAgentName: e.target.value }))} placeholder="Nome do agente" className="border-[#002443]/10 rounded-xl h-10" /></div>
            <div className="space-y-1"><Label className="text-[10px] font-bold text-[#002443]/30 uppercase tracking-[0.15em]">Expiração</Label>
              <Input type="date" value={pForm.expiresAt} onChange={(e) => setPForm(prev => ({ ...prev, expiresAt: e.target.value }))} className="border-[#002443]/10 rounded-xl h-10" /></div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-[#002443]/30 uppercase tracking-[0.15em]">Parâmetros UTM</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { k: 'utmSource', l: 'Source', p: 'google, facebook' },
                { k: 'utmMedium', l: 'Medium', p: 'email, cpc' },
                { k: 'utmCampaign', l: 'Campaign', p: 'black_friday' },
                { k: 'utmContent', l: 'Content', p: 'banner_top' },
              ].map(f => (
                <div key={f.k} className="space-y-1">
                  <p className="text-[9px] text-[#002443]/30 font-medium">{f.l}</p>
                  <Input value={pForm[f.k]} onChange={(e) => setPForm(prev => ({ ...prev, [f.k]: e.target.value }))} placeholder={f.p} className="border-[#002443]/10 rounded-xl h-9 text-xs" />
                </div>
              ))}
            </div>
          </div>

          <Button onClick={() => createLinkMutation.mutate(pForm)} disabled={createLinkMutation.isPending}
            className="w-full bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl h-11 font-bold">
            {createLinkMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            Criar Link Personalizado
          </Button>
        </div>
      )}

      {/* === SECTION: Histórico === */}
      {activeSection === 'historico' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { key: 'all', label: `Todos (${links.length})` },
              { key: 'lead', label: `📋 Leads (${links.filter(l => l.linkType === 'LEAD_QUESTIONNAIRE').length})` },
              { key: 'simplificado', label: `⚡ Simpl. (${links.filter(l => l.linkType === 'LEAD_SIMPLIFICADO').length})` },
              { key: 'compliance', label: `🔒 Compliance (${links.filter(l => !['LEAD_QUESTIONNAIRE', 'LEAD_SIMPLIFICADO'].includes(l.linkType)).length})` },
            ].map(f => (
              <button key={f.key} onClick={() => setHistoryFilter(f.key)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  historyFilter === f.key ? 'bg-white shadow-sm text-[#002443] border border-[#002443]/5' : 'text-[#002443]/30 hover:text-[#002443]/50 bg-[#f4f4f4] border border-transparent'
                }`}>{f.label}</button>
            ))}
          </div>

          {/* Links List */}
          {linksLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#2bc196]" /></div>
          ) : links.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-[#002443]/5">
              <div className="w-16 h-16 rounded-2xl bg-[#f4f4f4] flex items-center justify-center mx-auto mb-4"><LinkIcon className="w-7 h-7 text-[#002443]/20" /></div>
              <p className="text-sm text-[#002443]/50">Nenhum link personalizado criado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {links.filter(link => {
                if (historyFilter === 'lead') return link.linkType === 'LEAD_QUESTIONNAIRE';
                if (historyFilter === 'simplificado') return link.linkType === 'LEAD_SIMPLIFICADO';
                if (historyFilter === 'compliance') return !['LEAD_QUESTIONNAIRE', 'LEAD_SIMPLIFICADO'].includes(link.linkType);
                return true;
              }).map((link) => {
                const conversion = link.clickCount > 0 ? ((link.submissionCount / link.clickCount) * 100).toFixed(1) : 0;
                const isExpanded = expandedLinkId === link.id;
                return (
                  <div key={link.id} className="bg-white border border-[#002443]/5 rounded-2xl overflow-hidden hover:shadow-sm transition-shadow">
                    <div className="p-4 cursor-pointer" onClick={() => setExpandedLinkId(isExpanded ? null : link.id)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-wrap">
                          <Badge variant="outline" className="font-mono text-sm border-[#002443]/10">{link.uniqueCode}</Badge>
                          <Badge className={`${getLinkBadgeStyle(link)} text-xs border-0`}>{getLinkLabel(link)}</Badge>
                          {link.commercialAgentName && <span className="text-xs text-[#002443]/40">{link.commercialAgentName}</span>}
                          <span className="text-[10px] text-[#002443]/20">{link.created_date ? new Date(link.created_date).toLocaleDateString('pt-BR') : ''}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="hidden md:flex items-center gap-3 text-xs">
                            <span className="text-[#36706c] font-bold">{link.clickCount || 0} <span className="font-normal text-[#002443]/30">cliq</span></span>
                            <span className="text-[#2bc196] font-bold">{link.submissionCount || 0} <span className="font-normal text-[#002443]/30">sub</span></span>
                            <Badge className="text-[10px] bg-[#f4f4f4] text-[#002443]/50 border-0">{conversion}%</Badge>
                          </div>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => handleCopy(generateLinkUrl(link), link.id)} className="p-1.5 rounded-lg hover:bg-[#f4f4f4] transition-colors">
                              {copiedKey === link.id ? <Check className="w-4 h-4 text-[#2bc196]" /> : <Copy className="w-4 h-4 text-[#002443]/30" />}
                            </button>
                            <button onClick={() => window.open(generateLinkUrl(link), '_blank')} className="p-1.5 rounded-lg hover:bg-[#f4f4f4] transition-colors">
                              <ExternalLink className="w-4 h-4 text-[#002443]/30" />
                            </button>
                            <button onClick={() => deleteLinkMutation.mutate(link.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                              <Trash2 className="w-4 h-4 text-red-300" />
                            </button>
                          </div>
                          <button className="text-[#002443]/20">{isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}</button>
                        </div>
                      </div>
                      {(link.utmSource || link.utmMedium || link.utmCampaign) && (
                        <div className="flex gap-1.5 mt-2">
                          {link.utmSource && <Badge variant="outline" className="text-[9px] border-[#002443]/5 text-[#002443]/30">source: {link.utmSource}</Badge>}
                          {link.utmMedium && <Badge variant="outline" className="text-[9px] border-[#002443]/5 text-[#002443]/30">medium: {link.utmMedium}</Badge>}
                          {link.utmCampaign && <Badge variant="outline" className="text-[9px] border-[#002443]/5 text-[#002443]/30">campaign: {link.utmCampaign}</Badge>}
                        </div>
                      )}
                    </div>
                    {isExpanded && (
                      <div className="border-t border-[#002443]/5 bg-[#f4f4f4] p-4">
                        <h4 className="text-xs font-bold text-[#002443]/50 mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#2bc196]" /> Analytics</h4>
                        <LinkAnalyticsDashboard linkId={link.id} linkCode={link.uniqueCode} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}