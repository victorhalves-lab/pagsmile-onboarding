import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ExternalLink, Link as LinkIcon, Plus, Check, Zap, Loader2, ArrowRight, UserPlus, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import IntroducerLinkGeneratorModal from '../components/introducers/IntroducerLinkGeneratorModal';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function LinksQuestionariosLeads() {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(null);
  const [introducerModalOpen, setIntroducerModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Links genéricos — apenas v5 Pagsmile e PIX v4
  const genericLinks = {
    LEAD_PAGSMILE: `${window.location.origin}/QuestionarioLeadsPagsmile`,
    LEAD_PIX_V4: `${window.location.origin}/LeadPixV4`,
  };

  const handleCopy = async (text, id) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success(t('lql.link_copied'));
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-8 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-white/10">
            <LinkIcon className="w-6 h-6 text-[#5cf7cf]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('lql.title')}</h1>
            <p className="text-white/60 text-sm mt-1">{t('lql.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Questionário Leads Pagsmile v5.0 */}
        <Card className="rounded-2xl border border-[#002443]/5 shadow-sm hover:shadow-md transition-shadow overflow-hidden ring-2 ring-[#2bc196]/30 lg:col-span-2">
          <div className="h-2 bg-gradient-to-r from-[#002443] via-[#2bc196] to-[#5cf7cf]" />
          <CardHeader className="pt-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#002443] to-[#2bc196] shadow-md">
                  <Crown className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base font-bold text-[#002443]">Questionário de Leads Pagsmile</CardTitle>
                    <Badge className="bg-[#002443] text-white border-0 text-[10px]">v5.0</Badge>
                    <Badge className="bg-[#2bc196]/10 text-[#2bc196] border-0 text-[10px]">{t('lql.autocomplete')}</Badge>
                    <Badge className="bg-amber-400/10 text-amber-600 border-0 text-[10px]">10 SEGMENTOS</Badge>
                  </div>
                  <CardDescription className="text-[#282828]/50 text-xs mt-0.5">
                    45 perguntas + 18 condicionais dinâmicas por segmento + 16 flags silenciosas + Lead Score 0-100. UI 100% botões.
                  </CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.open(genericLinks.LEAD_PAGSMILE, '_blank')} className="border-[#002443]/10 text-[#002443] hover:bg-[#002443]/5 rounded-lg">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                {t('lql.view')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-[#002443]/40">{t('lql.default_link')}</Label>
              <div className="flex gap-2">
                <Input readOnly value={genericLinks.LEAD_PAGSMILE} className="font-mono text-xs bg-[#f4f4f4] border-[#002443]/5 rounded-lg" />
                <Button 
                  onClick={() => handleCopy(genericLinks.LEAD_PAGSMILE, 'lead-pagsmile')}
                  className={`rounded-lg ${copied === 'lead-pagsmile' ? 'bg-[#2bc196]' : 'bg-[#002443] hover:bg-[#002443]/90'}`}
                >
                  {copied === 'lead-pagsmile' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-[#002443]/5 to-[#2bc196]/5 p-4 rounded-xl text-sm text-[#002443]/80 border border-[#002443]/5">
              <p className="font-semibold text-[#002443] text-xs mb-2">Novidades v5.0:</p>
              <ul className="list-disc pl-4 space-y-1 text-xs text-[#282828]/60">
                <li>10 segmentos com descrições detalhadas (Gateway, Marketplace, Plat. Vertical, E-commerce, Dropshipping, Infoprodutos, SaaS, Educação, Link Pagamento, MPE)</li>
                <li>Condicionais dinâmicas por segmento: licença BCB, take rate, churn, afiliados, vertical</li>
                <li>Autocomplete CNPJ (3 APIs cascata), validação de site, e-mail e telefone</li>
                <li>Sliders interativos para distribuição de meios de pagamento (soma = 100%)</li>
                <li>16 flags silenciosas de risco + Lead Score automático 0-100</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <LinkGenerator 
              type="LEAD_QUESTIONNAIRE" 
              label="Gerar Link Rastreável" 
              basePage="QuestionarioLeadsPagsmile"
              icon={Crown}
            />
          </CardFooter>
        </Card>

        {/* Card Lead PIX v4.0 */}
        <Card className="rounded-2xl border border-[#002443]/5 shadow-sm hover:shadow-md transition-shadow overflow-hidden ring-2 ring-emerald-400/30 lg:col-span-2">
          <div className="h-2 bg-gradient-to-r from-[#2bc196] via-emerald-400 to-[#5cf7cf]" />
          <CardHeader className="pt-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-[#2bc196] shadow-md">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <CardTitle className="text-base font-bold text-[#002443]">Questionário Lead PIX</CardTitle>
                    <Badge className="bg-emerald-600 text-white border-0 text-[10px]">v4.0</Badge>
                    <Badge className="bg-[#2bc196]/10 text-[#2bc196] border-0 text-[10px]">{t('lql.autocomplete')}</Badge>
                    <Badge className="bg-amber-400/10 text-amber-600 border-0 text-[10px]">11 FLAGS</Badge>
                  </div>
                  <CardDescription className="text-[#282828]/50 text-xs mt-0.5">
                    28 perguntas + condicionais por tipo (Merchant/Intermediário) • Autocomplete CNPJ (3 APIs) • 11 flags silenciosas • Lead Score 0-100 • UI 100% botões
                  </CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.open(genericLinks.LEAD_PIX_V4, '_blank')} className="border-[#002443]/10 text-[#002443] hover:bg-[#002443]/5 rounded-lg">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                {t('lql.view')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-[#002443]/40">{t('lql.default_link')}</Label>
              <div className="flex gap-2">
                <Input readOnly value={genericLinks.LEAD_PIX_V4} className="font-mono text-xs bg-[#f4f4f4] border-[#002443]/5 rounded-lg" />
                <Button 
                  onClick={() => handleCopy(genericLinks.LEAD_PIX_V4, 'lead-pix-v4')}
                  className={`rounded-lg ${copied === 'lead-pix-v4' ? 'bg-[#2bc196]' : 'bg-[#002443] hover:bg-[#002443]/90'}`}
                >
                  {copied === 'lead-pix-v4' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-emerald-50 to-[#2bc196]/5 p-4 rounded-xl text-sm text-[#002443]/80 border border-emerald-200/30">
              <p className="font-semibold text-[#002443] text-xs mb-2">Exclusivo PIX — Redesign completo:</p>
              <ul className="list-disc pl-4 space-y-1 text-xs text-[#282828]/60">
                <li>Pergunta-chave: Merchant Direto vs Intermediário (determina compliance PIX)</li>
                <li>Segmentação: 8 segmentos merchant + 3 intermediário com condicionais</li>
                <li>Autocomplete CNPJ (3 APIs cascata) + validação e-mail/telefone</li>
                <li>11 flags silenciosas PIX (ACCOUNT_TERMINATED, MEI_AS_INTERMEDIARY, etc.)</li>
                <li>Lead Score 0-100 com bônus/penalidades específicos para PIX</li>
                <li>Serviços PIX: Recebimentos, Pagamentos, QR estático/dinâmico, Cobrança, Garantido, Split, Conta Digital</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <LinkGenerator 
              type="LEAD_QUESTIONNAIRE" 
              label="Gerar Link Rastreável" 
              basePage="LeadPixV4"
              icon={Zap}
            />
          </CardFooter>
        </Card>
      </div>

      {/* Card Gerar Link por Introducer */}
      <Card className="rounded-2xl border border-[#002443]/5 shadow-sm hover:shadow-md transition-shadow overflow-hidden lg:col-span-2">
        <div className="h-1.5 bg-gradient-to-r from-purple-500 to-[#2bc196]" />
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-100">
                <UserPlus className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#002443]">{t('lql.introducer_title')}</h3>
                <p className="text-[#282828]/50 text-xs mt-0.5">{t('lql.introducer_desc')}</p>
              </div>
            </div>
            <Button
              onClick={() => setIntroducerModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {t('lql.introducer_btn')}
            </Button>
          </div>
        </CardContent>
      </Card>

      <IntroducerLinkGeneratorModal
        open={introducerModalOpen}
        onOpenChange={setIntroducerModalOpen}
      />
    </div>
  );
}

function LinkGenerator({ type, label, basePage, baseParams, icon: Icon }) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [generatedLink, setGeneratedLink] = useState(null);
  const [copied, setCopied] = useState(false);
  
  const queryClient = useQueryClient();

  const createLinkMutation = useMutation({
    mutationFn: async () => {
      const uniqueCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      return base44.entities.OnboardingLink.create({
        linkType: type,
        uniqueCode,
        commercialAgentName: agentName,
        isActive: true,
        clickCount: 0,
        submissionCount: 0,
        completedCount: 0,
        complianceType: 'GENERIC' // Default
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['onboardingLinks'] });
      let url = `${window.location.origin}/${basePage}?ref=${data.uniqueCode}`;
      if (baseParams) url += `&${baseParams}`;
      setGeneratedLink(url);
      toast.success(t('lg.success'));
    },
    onError: (error) => {
      toast.error('Erro ao gerar link');
    }
  });

  const handleGenerate = () => {
    createLinkMutation.mutate();
  };

  const handleCopy = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success(t('lg.copied'));
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) {
    return (
      <Button variant="ghost" className="w-full justify-between" onClick={() => setIsOpen(true)}>
        <span className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {t('lg.trackable_link')}
        </span>
        <ArrowRight className="w-4 h-4 text-slate-400" />
      </Button>
    );
  }

  return (
    <div className="w-full space-y-4 pt-4 border-t border-[#002443]/5 animate-in slide-in-from-top-2">
      <div className="space-y-2">
        <Label className="text-xs">{t('lg.seller_name')}</Label>
        <Input 
          placeholder={t('lg.seller_placeholder')} 
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          className="h-9 text-sm"
        />
      </div>
      
      {generatedLink ? (
        <div className="space-y-2">
          <Label className="text-xs text-green-600 font-bold">{t('lg.generated_link')}</Label>
          <div className="flex gap-2">
            <Input readOnly value={generatedLink} className="font-mono text-xs bg-[#5cf7cf]/10 border-[#2bc196]/30 rounded-lg" />
            <Button size="sm" onClick={handleCopy} className={copied ? 'bg-green-600' : ''}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs text-slate-500 h-6 mt-1"
            onClick={() => {
              setGeneratedLink(null);
              setAgentName('');
            }}
          >
            {t('lg.generate_another')}
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setIsOpen(false)}>
            {t('lg.cancel')}
          </Button>
          <Button 
            size="sm" 
            className="flex-1 bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-lg"
            onClick={handleGenerate}
            disabled={createLinkMutation.isPending}
          >
            {createLinkMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
            {t('lg.generate')}
          </Button>
        </div>
      )}
    </div>
  );
}