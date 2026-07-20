import React, { useState } from 'react';
import { Copy, Check, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createPageUrl } from '../../utils';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function IntroducerShareLink({ introducer }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(null);

  const base = window.location.origin;
  const links = [
    {
      key: 'completo',
      label: t('idash.complete_quest'),
      desc: t('idash.complete_quest_desc'),
      url: `${base}${createPageUrl('LeadQuestionnaire')}?utm_source=${introducer.referralCode}&utm_medium=referral`,
    },
    {
      key: 'simplificado',
      label: t('idash.simplified_quest'),
      desc: t('idash.simplified_quest_desc'),
      url: `${base}${createPageUrl('QuestionarioSimplificadoPublico')}?utm_source=${introducer.referralCode}&utm_medium=referral`,
    },
  ];

  const handleCopy = async (url, key) => {
    await navigator.clipboard.writeText(url);
    setCopied(key);
    toast.success(t('idash.link_copied'));
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 p-5">
      <div className="flex items-center gap-2 mb-4">
        <LinkIcon className="w-5 h-5 text-[#1356E2]" />
        <h3 className="text-sm font-bold text-[#0A0A0A]">{t('idash.your_referral_links')}</h3>
      </div>
      <p className="text-xs text-[#0A0A0A]/50 mb-4">
        {t('idash.share_links_desc')}
      </p>
      <div className="space-y-3">
        {links.map(link => (
          <div key={link.key} className="flex items-center gap-3 p-3 rounded-xl bg-[#f4f4f4] border border-[#0A0A0A]/5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#0A0A0A]">{link.label}</p>
              <p className="text-[10px] text-[#0A0A0A]/40">{link.desc}</p>
              <p className="text-[9px] font-mono text-[#0A0A0A]/30 truncate mt-1">{link.url}</p>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleCopy(link.url, link.key)}
                className={`h-8 px-3 rounded-lg ${copied === link.key ? 'bg-[#1356E2] text-white' : ''}`}
              >
                {copied === link.key ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(link.url, '_blank')}
                className="h-8 px-2 rounded-lg"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}