import React, { useState } from 'react';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Link as LinkIcon, Copy, Check, ExternalLink, RefreshCw,
  Shield, Zap, ShoppingCart, Cloud, CreditCard, Globe, Briefcase,
  TrendingUp, MousePointer, FileCheck, Loader2, Trash2,
  BarChart3, ChevronDown, ChevronUp, Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import LinkAnalyticsDashboard from '../components/analytics/LinkAnalyticsDashboard';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function LinksCompliance() {
  const { t } = useTranslation();
  const [copiedKey, setCopiedKey] = useState(null);
  const [expandedLinkId, setExpandedLinkId] = useState(null);
  const [activeTab, setActiveTab] = useState('links');
  const queryClient = useQueryClient();
  const base = window.location.origin;

  const { data: links = [], isLoading, refetch } = useQuery({
    queryKey: ['complianceLinks'],
    queryFn: async () => {
      const all = await base44.entities.OnboardingLink.list('-created_date', 100);
      return all.filter(l => !['LEAD_QUESTIONNAIRE', 'LEAD_SIMPLIFICADO'].includes(l.linkType));
    }
  });

  const deleteLinkMutation = useMutation({
    mutationFn: (id) => base44.entities.OnboardingLink.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['complianceLinks'] }); toast.success(t('lc.link_deleted')); }
  });

  const handleCopy = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    toast.success(t('lc.copied'));
  };

  const quickLinksByBusiness = [
    { key: 'MERCHANT', label: 'Merchant', desc: t('lc.merchant_desc'), icon: CreditCard, color: '#2bc196', url: `${base}${createPageUrl('ComplianceDinamico')}?model=merchant` },
    { key: 'GATEWAY', label: 'Gateway', desc: t('lc.gateway_desc'), icon: Globe, color: '#002443', url: `${base}${createPageUrl('ComplianceDinamico')}?model=gateway` },
    { key: 'MARKETPLACE', label: 'Marketplace', desc: t('lc.marketplace_desc'), icon: ShoppingCart, color: '#36706c', url: `${base}${createPageUrl('ComplianceDinamico')}?model=marketplace` },
  ];

  const quickLinksV2 = [
    { key: 'MERCHANT_V2', label: 'Merchant v2.0', desc: t('lc.merchant_v2_desc'), icon: CreditCard, color: '#2bc196', url: `${base}${createPageUrl('ComplianceDinamico')}?model=ComplianceMerchantAutocomplete` },
    { key: 'GATEWAY_V2', label: 'Gateway v2.0', desc: t('lc.gateway_v2_desc'), icon: Globe, color: '#002443', url: `${base}${createPageUrl('ComplianceDinamico')}?model=ComplianceGatewayAutocomplete` },
    { key: 'MARKETPLACE_V2', label: 'Marketplace v2.0', desc: t('lc.marketplace_v2_desc'), icon: ShoppingCart, color: '#36706c', url: `${base}${createPageUrl('ComplianceDinamico')}?model=ComplianceMarketplaceAutocomplete` },
  ];

  const quickLinksV4 = [
    { key: 'GATEWAY_V4', label: 'Gateway v4', desc: '85 perguntas em 12 blocos. Pré-preenchimento automático do Lead v5. Cobertura regulatória ~98%.', icon: Globe, color: '#4f46e5', url: `${base}${createPageUrl('ComplianceDinamico')}?model=ComplianceGatewayV4` },
    { key: 'MARKETPLACE_V4', label: 'Marketplace v4', desc: '75 perguntas em 11 blocos. Foco em sellers, split e anti-bolsão. Pré-preenchimento Lead v5.', icon: ShoppingCart, color: '#d97706', url: `${base}${createPageUrl('ComplianceDinamico')}?model=ComplianceMarketplaceV4` },
    { key: 'PLATAFORMA_VERTICAL_V4', label: 'Plataforma Vertical v4', desc: '52 perguntas em 9 blocos. Verticais de nicho (food, saúde, eventos). Pré-preenchimento Lead v5.', icon: Briefcase, color: '#7c3aed', url: `${base}${createPageUrl('ComplianceDinamico')}?model=CompliancePlataformaVerticalV4` },
  ];

  const quickLinksByType = [
    { key: 'GENERIC', label: 'Genérico', desc: t('lc.generic_desc'), icon: Globe, color: '#002443', url: `${base}${createPageUrl('ComplianceOnboardingStart')}` },
    { key: 'PIX', label: 'Pix', desc: t('lc.pix_desc'), icon: CreditCard, color: '#2bc196', url: `${base}${createPageUrl('CompliancePixOnly')}` },
    { key: 'FULL', label: 'Full KYC', desc: t('lc.full_desc'), icon: Shield, color: '#002443', url: `${base}${createPageUrl('ComplianceFullKYC')}` },
    { key: 'LITE', label: 'Lite', desc: t('lc.lite_desc'), icon: Zap, color: '#36706c', url: `${base}${createPageUrl('ComplianceLite')}` },
    { key: 'ECOMMERCE', label: 'E-commerce', desc: t('lc.ecommerce_desc'), icon: ShoppingCart, color: '#002443', url: `${base}${createPageUrl('ComplianceEcommerce')}` },
    { key: 'SAAS', label: 'SaaS', desc: t('lc.saas_desc'), icon: Cloud, color: '#36706c', url: `${base}${createPageUrl('ComplianceSaaS')}` },
  ];

  const stats = React.useMemo(() => {
    const tc = links.reduce((s, l) => s + (l.clickCount || 0), 0);
    const ts = links.reduce((s, l) => s + (l.submissionCount || 0), 0);
    const tco = links.reduce((s, l) => s + (l.completedCount || 0), 0);
    return { total: links.length, clicks: tc, submissions: ts, completed: tco, conv: tc > 0 ? ((ts / tc) * 100).toFixed(1) : 0 };
  }, [links]);

  const getLinkLabel = (link) => {
    const ct = link.complianceType;
    if (ct === 'PIX') return '💳 Pix'; if (ct === 'FULL') return '🔒 Full';
    if (ct === 'LITE') return '⚡ Lite'; if (ct === 'ECOMMERCE') return '🛒 E-comm';
    if (ct === 'SAAS') return '☁️ SaaS'; return '🌐 Genérico';
  };

  const getPageByLink = (link) => {
    switch (link.complianceType) {
      case 'PIX': return 'CompliancePixOnly'; case 'FULL': return 'ComplianceFullKYC';
      case 'LITE': return 'ComplianceLite'; case 'ECOMMERCE': return 'ComplianceEcommerce';
      case 'SAAS': return 'ComplianceSaaS'; default: return 'ComplianceOnboardingStart';
    }
  };

  const generateLinkUrl = (link) => {
    const page = getPageByLink(link);
    let url = `${base}${createPageUrl(page)}?ref=${link.uniqueCode}`;
    if (link.utmSource) url += `&utm_source=${link.utmSource}`;
    return url;
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
          {copiedKey === item.key ? t('lc.copied') : t('lc.copy')}
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
          <div className="w-10 h-10 rounded-xl bg-[#002443]/5 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#002443]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#002443]">{t('lc.title')}</h1>
            <p className="text-sm text-[#002443]/60">{t('lc.subtitle')}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="border-[#002443]/10 hover:bg-[#f4f4f4] rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2 text-[#002443]/50" /> <span className="text-[#002443]/70">{t('lc.refresh')}</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: t('lc.links'), value: stats.total, icon: LinkIcon, color: '#002443' },
          { label: t('lc.clicks'), value: stats.clicks, icon: MousePointer, color: '#36706c' },
          { label: t('lc.submissions'), value: stats.submissions, icon: FileCheck, color: '#2bc196' },
          { label: t('lc.completed'), value: stats.completed, icon: Check, color: '#2bc196' },
          { label: t('lc.conversion'), value: `${stats.conv}%`, icon: TrendingUp, color: '#36706c' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#002443]/5 p-4">
            <div className="flex items-center gap-2 mb-1"><s.icon className="w-4 h-4" style={{ color: s.color }} /><p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p></div>
            <p className="text-[10px] text-[#002443]/40">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-[#f4f4f4] rounded-2xl p-1.5 border border-[#002443]/5">
        {[
          { id: 'links', label: t('lc.quick_links') },
          { id: 'historico', label: t('lc.history', { count: links.length }) },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab.id ? 'bg-white text-[#002443] shadow-sm' : 'text-[#002443]/40 hover:text-[#002443]/60'
            }`}>{tab.label}</button>
        ))}
      </div>

      {/* Links Rápidos */}
      {activeTab === 'links' && (
        <div className="space-y-6">
          {/* v4.0 Por Segmento — Com pré-preenchimento Lead v5 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center"><Shield className="w-4 h-4 text-indigo-600" /></div>
              <div>
                <h2 className="text-base font-bold text-[#002443]">Por Segmento v4 — Pré-preenchimento Lead</h2>
                <p className="text-xs text-[#002443]/40">Questionários específicos por segmento com dados pré-preenchidos do questionário de lead</p>
              </div>
              <Badge className="bg-indigo-100 text-indigo-700 border-0 text-[10px] ml-2">NOVO</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickLinksV4.map(item => <QuickLinkCard key={item.key} item={item} />)}
            </div>
          </div>

          {/* v2.0 Autocomplete */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#2bc196]/10 flex items-center justify-center"><Briefcase className="w-4 h-4 text-[#2bc196]" /></div>
              <div>
                <h2 className="text-base font-bold text-[#002443]">{t('lc.v2_title')}</h2>
                <p className="text-xs text-[#002443]/40">{t('lc.v2_desc')}</p>
              </div>
              <Badge className="bg-[#2bc196]/10 text-[#2bc196] border-0 text-[10px] ml-2">{t('lc.new')}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickLinksV2.map(item => <QuickLinkCard key={item.key} item={item} />)}
            </div>
          </div>

          {/* Por Tipo de Negócio (v1) */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#002443]/5 flex items-center justify-center"><Briefcase className="w-4 h-4 text-[#002443]/60" /></div>
              <div>
                <h2 className="text-base font-bold text-[#002443]">{t('lc.by_business')}</h2>
                <p className="text-xs text-[#002443]/40">{t('lc.by_business_desc')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickLinksByBusiness.map(item => <QuickLinkCard key={item.key} item={item} />)}
            </div>
          </div>

          {/* Por Tipo de Compliance */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#002443]/5 flex items-center justify-center"><Shield className="w-4 h-4 text-[#002443]" /></div>
              <div>
                <h2 className="text-base font-bold text-[#002443]">{t('lc.by_compliance')}</h2>
                <p className="text-xs text-[#002443]/40">{t('lc.by_compliance_desc')}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickLinksByType.map(item => <QuickLinkCard key={item.key} item={item} />)}
            </div>
          </div>
        </div>
      )}

      {/* Histórico */}
      {activeTab === 'historico' && (
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#2bc196]" /></div>
          ) : links.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-[#002443]/5">
              <div className="w-16 h-16 rounded-2xl bg-[#f4f4f4] flex items-center justify-center mx-auto mb-4"><LinkIcon className="w-7 h-7 text-[#002443]/20" /></div>
              <p className="text-sm text-[#002443]/50">{t('lc.no_links')}</p>
              <p className="text-xs text-[#002443]/30 mt-1">{t('lc.no_links_hint')}</p>
            </div>
          ) : (
            links.map(link => {
              const isExpanded = expandedLinkId === link.id;
              const conversion = link.clickCount > 0 ? ((link.submissionCount / link.clickCount) * 100).toFixed(1) : 0;
              return (
                <div key={link.id} className="bg-white border border-[#002443]/5 rounded-2xl overflow-hidden hover:shadow-sm transition-shadow">
                  <div className="p-4 cursor-pointer" onClick={() => setExpandedLinkId(isExpanded ? null : link.id)}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="outline" className="font-mono text-sm border-[#002443]/10">{link.uniqueCode}</Badge>
                        <Badge className="bg-[#002443]/10 text-[#002443] text-xs border-0">{getLinkLabel(link)}</Badge>
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
                  </div>
                  {isExpanded && (
                    <div className="border-t border-[#002443]/5 bg-[#f4f4f4] p-4">
                      <h4 className="text-xs font-bold text-[#002443]/50 mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#2bc196]" /> Analytics</h4>
                      <LinkAnalyticsDashboard linkId={link.id} linkCode={link.uniqueCode} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}