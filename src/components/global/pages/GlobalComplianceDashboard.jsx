import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function GlobalComplianceDashboard() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const link = `${window.location.origin}/GlobalComplianceForm`;

  const copyLink = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success(t('common.link_copied') || 'Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 rounded-xl bg-[#2bc196]/10">
            <ShieldCheck className="w-6 h-6 text-[#2bc196]" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#002443]">
              {t('global.compliance_link.title') || 'Link do KYC Global'}
            </h2>
            <p className="text-sm text-[#002443]/60 mt-1">
              {t('global.compliance_link.subtitle') || 'Compartilhe este link para que o cliente preencha o KYC internacional (UBOs, Diretores, Documentos, Sanctions).'}
            </p>
          </div>
        </div>

        <div className="bg-[#f4f4f4] rounded-xl p-4 mb-4">
          <code className="text-sm text-[#002443] font-mono break-all">{link}</code>
        </div>

        <div className="flex gap-2">
          <Button onClick={copyLink} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white gap-2">
            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? (t('common.copied') || 'Copiado!') : (t('common.copy_link') || 'Copiar Link')}
          </Button>
          <Button variant="outline" onClick={() => window.open(link, '_blank')} className="gap-2">
            <ExternalLink className="w-4 h-4" />
            {t('common.preview') || 'Visualizar'}
          </Button>
        </div>
      </div>
    </div>
  );
}