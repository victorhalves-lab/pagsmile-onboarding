import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Link as LinkIcon, Copy, Check, ExternalLink, RefreshCw,
  Shield, ShoppingCart, Cloud, CreditCard, Globe, Briefcase, BookOpen, Store,
  TrendingUp, MousePointer, FileCheck, Loader2, Trash2,
  BarChart3, ChevronDown, ChevronUp
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



  const quickLinksPixV4 = [
    { key: 'PIX_MERCHANT_V4', label: 'PIX Merchant v4', desc: '40 perguntas em 8 blocos. Compliance PIX + Conta para merchants. Foco em volume, natureza, PLD/FT e UBOs. Pré-preenchimento Lead.', icon: CreditCard, color: '#2bc196', url: `${base}/ComplianceDinamico?model=CompliancePixMerchantV4` },
    { key: 'PIX_INTERMEDIARIO_V4', label: 'PIX Intermediário v4', desc: '47 perguntas em 8 blocos. Compliance PIX + Conta para intermediários (Gateway/PSP, Marketplace, Plataforma). Foco em split, anti-bolção, MED e regulatório BCB.', icon: Globe, color: '#4f46e5', url: `${base}/ComplianceDinamico?model=CompliancePixIntermediarioV4` },
  ];

  const quickLinksV4 = [
    { key: 'GATEWAY_V4', label: 'Gateway v4', desc: '85 perguntas em 12 blocos. Pré-preenchimento automático do Lead v5. Cobertura regulatória ~98%.', icon: Globe, color: '#4f46e5', url: `${base}/ComplianceDinamico?model=ComplianceGatewayV4` },
    { key: 'MARKETPLACE_V4', label: 'Marketplace v4', desc: '75 perguntas em 11 blocos. Foco em sellers, split e anti-bolsão. Pré-preenchimento Lead v5.', icon: ShoppingCart, color: '#d97706', url: `${base}/ComplianceDinamico?model=ComplianceMarketplaceV4` },
    { key: 'PLATAFORMA_VERTICAL_V4', label: 'Plataforma Vertical v4', desc: '52 perguntas em 9 blocos. Verticais de nicho (food, saúde, eventos). Pré-preenchimento Lead v5.', icon: Briefcase, color: '#7c3aed', url: `${base}/ComplianceDinamico?model=CompliancePlataformaVerticalV4` },
    { key: 'ECOMMERCE_V4', label: 'E-commerce v4', desc: '44 perguntas em 8 blocos. Foco em produtos, logística e entrega. Pré-preenchimento Lead v5.', icon: ShoppingCart, color: '#e11d48', url: `${base}/ComplianceDinamico?model=ComplianceEcommerceV4` },
    { key: 'INFOPRODUTOS_V4', label: 'Infoprodutos v4', desc: '56 perguntas em 11 blocos. Foco em produto digital, afiliados e práticas de vendas. Pré-preenchimento Lead v5.', icon: BookOpen, color: '#d97706', url: `${base}/ComplianceDinamico?model=ComplianceInfoprodutosV4` },
    { key: 'EDUCACAO_V4', label: 'Educação v4', desc: '37 perguntas em 8 blocos. Foco em reconhecimento MEC, modalidade de ensino e perfil de alunos. Pré-preenchimento Lead v5.', icon: BookOpen, color: '#0284c7', url: `${base}/ComplianceDinamico?model=ComplianceEducacaoV4` },
    { key: 'SAAS_V4', label: 'SaaS v4', desc: '40 perguntas em 9 blocos. Foco em modelo de negócio, recorrência, segurança de dados e triagem fintech. Pré-preenchimento Lead v5.', icon: Cloud, color: '#0891b2', url: `${base}/ComplianceDinamico?model=ComplianceSaaSV4` },
    { key: 'MERCHANT_LINK_V4', label: 'Merchant Link Pagamento v4', desc: '41 perguntas em 9 blocos. Foco em micro-merchants (MEI/SLU), canais social, entrega presencial e triagem de reclassificação. Pré-preenchimento Lead v5.', icon: Store, color: '#16a34a', url: `${base}/ComplianceDinamico?model=ComplianceMerchantLinkV4` },
    { key: 'MPE_V4', label: 'Micro e Pequenas Empresas v4', desc: '38 perguntas em 9 blocos. Foco em MEI/ME, ponto físico, atividade local e triagem de reclassificação. Pré-preenchimento Lead v5.', icon: Briefcase, color: '#d97706', url: `${base}/ComplianceDinamico?model=ComplianceMPEV4` },
    { key: 'DROPSHIPPING_V4', label: 'Dropshipping v4', desc: '52 perguntas em 11 blocos. Foco em fornecedor/logística, prazo de entrega, rastreamento, afiliados e risco de chargeback. Pré-preenchimento Lead v5.', icon: ShoppingCart, color: '#ea580c', url: `${base}/ComplianceDinamico?model=ComplianceDropshippingV4` },
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

  const getV4ModelByComplianceType = (type) => {
    switch (type) {
      case 'PIX': return 'CompliancePixMerchantV4';
      case 'FULL': return 'ComplianceEcommerceV4';
      case 'LITE': return 'ComplianceSaaSV4';
      case 'ECOMMERCE': return 'ComplianceEcommerceV4';
      case 'SAAS': return 'ComplianceSaaSV4';
      default: return 'ComplianceEcommerceV4';
    }
  };

  const generateLinkUrl = (link) => {
    const model = getV4ModelByComplianceType(link.complianceType);
    let url = `${base}/ComplianceDinamico?model=${model}&ref=${link.uniqueCode}`;
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
          {/* PIX v4 — Merchants e Intermediários */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center"><CreditCard className="w-4 h-4 text-emerald-600" /></div>
              <div>
                <h2 className="text-base font-bold text-[#002443]">PIX v4 — Merchants & Intermediários</h2>
                <p className="text-xs text-[#002443]/40">Questionários específicos para operação PIX + Conta de pagamento. Conformidade Res. BCB 80/494/501/518.</p>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px] ml-2">NOVO</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickLinksPixV4.map(item => <QuickLinkCard key={item.key} item={item} />)}
            </div>
          </div>

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