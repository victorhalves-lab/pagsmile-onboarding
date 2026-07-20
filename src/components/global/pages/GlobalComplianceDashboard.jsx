import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Shield, Globe, Copy, Check, ExternalLink, RefreshCw,
  Link as LinkIcon, FileCheck, MousePointer, TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

/**
 * Dashboard de Links de KYC/Compliance Global. Segue o mesmo padrão visual de
 * pages/LinksCompliance (header com ícone, KPIs, quick-link cards com Copy/Preview).
 */
export default function GlobalComplianceDashboard() {
  const [copiedKey, setCopiedKey] = useState(null);
  const base = window.location.origin;

  const handleCopy = async (text, key) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    toast.success('Link copiado!');
  };

  const { data: items = [], refetch, isFetching } = useQuery({
    queryKey: ['globalComplianceCount'],
    queryFn: () => base44.entities.GlobalComplianceQuestionnaire.list('-created_date', 500),
    initialData: [],
  });

  const stats = useMemo(() => {
    const total = items.length;
    const submitted = items.filter(i => i.status === 'submitted' || i.status === 'in_review').length;
    const approved = items.filter(i => i.status === 'approved').length;
    const rejected = items.filter(i => i.status === 'rejected').length;
    const conv = total > 0 ? ((approved / total) * 100).toFixed(1) : 0;
    return { total, submitted, approved, rejected, conv };
  }, [items]);

  const quickLinks = [
    {
      key: 'kyc_en',
      label: 'KYC Global — English',
      desc: 'International KYC questionnaire (UBOs, Directors, Documents, Sanctions). For LATAM/APAC/MEA merchants.',
      icon: Shield,
      color: '#1356E2',
      url: `${base}/GlobalComplianceForm?lang=en`,
    },
    {
      key: 'kyc_pt',
      label: 'KYC Global — Português',
      desc: 'Questionário KYC internacional trilíngue. Cliente brasileiro fazendo onboarding em operação Global.',
      icon: Shield,
      color: '#E84B1C',
      url: `${base}/GlobalComplianceForm?lang=pt`,
    },
    {
      key: 'kyc_zh',
      label: 'KYC Global — 中文',
      desc: '国际 KYC 问卷(UBO、董事、文件、制裁名单)。面向中国客户的全球业务入驻。',
      icon: Shield,
      color: '#0A0A0A',
      url: `${base}/GlobalComplianceForm?lang=zh`,
    },
  ];

  const QuickLinkCard = ({ item }) => (
    <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 p-4 hover:shadow-md transition-all group">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${item.color}10` }}>
          <item.icon className="w-4 h-4" style={{ color: item.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-[#0A0A0A]">{item.label}</h3>
          <p className="text-[10px] text-[#0A0A0A]/40">{item.desc}</p>
        </div>
      </div>
      <div className="flex gap-1.5">
        <button onClick={() => handleCopy(item.url, item.key)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
            copiedKey === item.key ? 'bg-[#1356E2] text-white' : 'bg-[#f4f4f4] text-[#0A0A0A]/60 hover:bg-[#1356E2]/10 hover:text-[#1356E2]'
          }`}>
          {copiedKey === item.key ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copiedKey === item.key ? 'Copiado!' : 'Copiar'}
        </button>
        <button onClick={() => window.open(item.url, '_blank')}
          className="px-3 py-2 rounded-xl bg-[#f4f4f4] text-[#0A0A0A]/40 hover:bg-[#0A0A0A]/5 hover:text-[#0A0A0A] transition-all">
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0A0A0A]/5 flex items-center justify-center">
            <Globe className="w-5 h-5 text-[#0A0A0A]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0A0A0A]">Links de Compliance — Global</h1>
            <p className="text-sm text-[#0A0A0A]/60">KYC internacional trilíngue (EN / PT / ZH) para mercados LATAM, APAC e MEA.</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#0A0A0A]/10 hover:bg-[#f4f4f4] text-[#0A0A0A]/70 text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 text-[#0A0A0A]/50 ${isFetching ? 'animate-spin' : ''}`} /> Atualizar
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Links Ativos', value: quickLinks.length, icon: LinkIcon, color: '#0A0A0A' },
          { label: 'Recebidos', value: stats.total, icon: MousePointer, color: '#E84B1C' },
          { label: 'Em revisão', value: stats.submitted, icon: FileCheck, color: '#1356E2' },
          { label: 'Aprovados', value: stats.approved, icon: Check, color: '#1356E2' },
          { label: 'Aprovação', value: `${stats.conv}%`, icon: TrendingUp, color: '#E84B1C' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#0A0A0A]/5 p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="w-4 h-4" style={{ color: s.color }} />
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
            <p className="text-[10px] text-[#0A0A0A]/40">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#1356E2]/10 flex items-center justify-center">
            <Shield className="w-4 h-4 text-[#1356E2]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#0A0A0A]">Links Rápidos por Idioma</h2>
            <p className="text-xs text-[#0A0A0A]/40">
              Compartilhe o link no idioma preferido do cliente. Mesmo formulário, mesma persistência.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickLinks.map(item => <QuickLinkCard key={item.key} item={item} />)}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-900">
        <strong>ℹ️ Como funciona:</strong> O link é o mesmo formulário (`GlobalComplianceForm`) — só o parâmetro
        <code className="bg-white px-1.5 py-0.5 rounded mx-1">?lang=...</code>
        muda o idioma inicial. O cliente pode trocar de idioma dentro do form. Tudo é persistido em
        <code className="bg-white px-1.5 py-0.5 rounded mx-1">GlobalComplianceQuestionnaire</code>
        e aparece em <strong>KYC Recebidos</strong> para revisão.
      </div>
    </div>
  );
}