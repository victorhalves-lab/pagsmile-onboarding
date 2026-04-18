import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Copy, Check, Loader2, ScanFace, ClipboardList, Link2,
  CheckCircle2, AlertTriangle, XCircle, FileText, MessageCircle, Mail,
  Info, ExternalLink
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

/**
 * CafLinkGeneratorModal
 * -----------------------------------------------------------
 * Gera 2 tipos de link que Compliance pode enviar ao cliente:
 *   1) Docs + CAF (liveness, facematch, documentoscopia)
 *   2) Questionário COMPLETO (refaz tudo: perguntas + docs + CAF)
 *
 * Mostra status atual (o que já tem / o que falta) e permite copiar + enviar.
 */

function StatusPill({ done, label }) {
  if (done === true) {
    return (
      <Badge className="bg-green-100 text-green-700 border border-green-200 gap-1 text-[11px]">
        <CheckCircle2 className="w-3 h-3" /> {label}
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-700 border border-red-200 gap-1 text-[11px]">
      <XCircle className="w-3 h-3" /> {label}
    </Badge>
  );
}

function CopyableLink({ url, label }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success(`${label} copiado para a área de transferência`);
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <div className="flex items-center gap-2">
      <Input value={url} readOnly className="font-mono text-xs bg-slate-50" />
      <Button onClick={handleCopy} size="sm" className="shrink-0 gap-1.5">
        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        {copied ? 'Copiado' : 'Copiar'}
      </Button>
      <Button variant="outline" size="sm" className="shrink-0" onClick={() => window.open(url, '_blank')}>
        <ExternalLink className="w-4 h-4" />
      </Button>
    </div>
  );
}

export default function CafLinkGeneratorModal({ open, onOpenChange, caseData, merchant }) {
  const [generating, setGenerating] = useState(false);
  const [docLink, setDocLink] = useState('');
  const [fullLink, setFullLink] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');

  const hasLiveness = caseData?.cafCompleted === true;
  const hasDocs = caseData?.docCompleted === true;
  const hasBdc = caseData?.bigDataCorpCompleted === true;
  const hasQuestionnaire = caseData?.validationsCompleted === true;

  useEffect(() => {
    if (!open || !caseData) return;
    setDocLink('');
    setFullLink('');
    const name = merchant?.fullName || merchant?.companyName || 'Cliente';
    setMessageTemplate(
      `Olá ${name}, tudo bem?\n\n` +
      `Para concluir sua análise de compliance na Pagsmile, precisamos que você acesse o link abaixo:\n\n` +
      `[COLE O LINK AQUI]\n\n` +
      `O processo leva cerca de 5 minutos. Qualquer dúvida estamos à disposição.\n\n` +
      `Atenciosamente,\nEquipe Pagsmile`
    );
  }, [open, caseData, merchant]);

  // ── Gera link de Docs + CAF (usa docLinkToken no OnboardingCase) ──
  const generateDocLink = async () => {
    if (!caseData?.id) return;
    setGenerating(true);
    try {
      let token = caseData.docLinkToken;
      if (!token) {
        token = crypto.randomUUID().replace(/-/g, '').slice(0, 24);
      }
      await base44.entities.OnboardingCase.update(caseData.id, {
        docLinkToken: token,
        docCompleted: false,
        cafCompleted: false,
      });
      const link = `${window.location.origin}/ComplianceDocOnly?caseId=${caseData.id}&token=${token}`;
      setDocLink(link);
      toast.success('Link Docs + CAF gerado');
    } catch (err) {
      toast.error('Erro ao gerar link: ' + (err?.message || 'desconhecido'));
    } finally {
      setGenerating(false);
    }
  };

  // ── Gera link do QUESTIONÁRIO COMPLETO (perguntas + docs + CAF) ──
  const generateFullLink = async () => {
    if (!caseData?.questionnaireTemplateId) {
      toast.error('Este caso não tem template de questionário vinculado.');
      return;
    }
    setGenerating(true);
    try {
      let code = caseData.onboardingLinkCode;
      if (!code) {
        code = 'FULL_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
        await base44.entities.OnboardingLink.create({
          uniqueCode: code,
          questionnaireTemplateId: caseData.questionnaireTemplateId,
          complianceType: 'GENERIC',
          isActive: true,
          linkType: 'COMPLIANCE_RESUBMISSION',
        });
        await base44.entities.OnboardingCase.update(caseData.id, { onboardingLinkCode: code });
      }
      await base44.entities.OnboardingCase.update(caseData.id, {
        validationsCompleted: false,
        docCompleted: false,
        cafCompleted: false,
      });
      const link = `${window.location.origin}/ComplianceDinamico?link=${code}&resumeCaseId=${caseData.id}`;
      setFullLink(link);
      toast.success('Link do questionário completo gerado');
    } catch (err) {
      toast.error('Erro ao gerar link: ' + (err?.message || 'desconhecido'));
    } finally {
      setGenerating(false);
    }
  };

  const openWhatsApp = (link) => {
    const phone = (merchant?.phone || '').replace(/\D/g, '');
    const msg = encodeURIComponent(messageTemplate.replace('[COLE O LINK AQUI]', link));
    const url = phone ? `https://wa.me/55${phone}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  };

  const openEmail = (link) => {
    const email = merchant?.email || '';
    const subject = encodeURIComponent('Pagsmile — Etapa de compliance pendente');
    const body = encodeURIComponent(messageTemplate.replace('[COLE O LINK AQUI]', link));
    window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#002443]">
            <Link2 className="w-5 h-5 text-[#2bc196]" />
            Gerar link para o cliente
          </DialogTitle>
          <p className="text-sm text-[#002443]/60 mt-1">
            {merchant?.fullName || merchant?.companyName || 'Cliente'} · {merchant?.cpfCnpj || ''}
          </p>
        </DialogHeader>

        {/* STATUS ATUAL */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-[#002443]/60" />
            <p className="text-xs font-bold uppercase tracking-wider text-[#002443]/70">Status atual do caso</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill done={hasQuestionnaire} label={hasQuestionnaire ? 'Questionário preenchido' : 'Questionário pendente'} />
            <StatusPill done={hasBdc} label={hasBdc ? 'BDC completo' : 'BDC pendente'} />
            <StatusPill done={hasDocs} label={hasDocs ? 'Documentos enviados' : 'Documentos pendentes'} />
            <StatusPill done={hasLiveness} label={hasLiveness ? 'CAF (liveness/facematch) completo' : 'CAF pendente'} />
          </div>
        </div>

        {/* TABS */}
        <Tabs defaultValue="docs" className="mt-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="docs" className="gap-2">
              <ScanFace className="w-4 h-4" /> Docs + CAF
            </TabsTrigger>
            <TabsTrigger value="full" className="gap-2">
              <ClipboardList className="w-4 h-4" /> Processo completo
            </TabsTrigger>
          </TabsList>

          {/* DOCS + CAF */}
          <TabsContent value="docs" className="space-y-4 mt-4">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
              <div className="flex items-start gap-3">
                <ScanFace className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-blue-900">Apenas documentos + verificação biométrica</p>
                  <p className="text-xs text-blue-700/80 mt-1 leading-relaxed">
                    O cliente é direcionado direto para o envio de documentos pendentes e para o fluxo CAF
                    (selfie com prova de vida, facematch e documentoscopia).
                    O questionário já respondido <strong>NÃO</strong> é solicitado de novo.
                  </p>
                  <p className="text-xs text-blue-700/80 mt-2 leading-relaxed">
                    <strong>Use quando:</strong> o cliente já respondeu o questionário mas não completou liveness,
                    facematch ou documentoscopia — ou você precisa de recaptura biométrica.
                  </p>
                </div>
              </div>
            </div>

            {!docLink ? (
              <Button onClick={generateDocLink} disabled={generating} className="w-full gap-2">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanFace className="w-4 h-4" />}
                {generating ? 'Gerando...' : 'Gerar link Docs + CAF'}
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#002443]/70">Link gerado</p>
                <CopyableLink url={docLink} label="Link Docs + CAF" />
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button variant="outline" onClick={() => openWhatsApp(docLink)} className="gap-2">
                    <MessageCircle className="w-4 h-4 text-green-600" /> Enviar por WhatsApp
                  </Button>
                  <Button variant="outline" onClick={() => openEmail(docLink)} className="gap-2">
                    <Mail className="w-4 h-4 text-blue-600" /> Enviar por E-mail
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* FULL QUESTIONNAIRE */}
          <TabsContent value="full" className="space-y-4 mt-4">
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-start gap-3">
                <ClipboardList className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-amber-900">Refazer o processo inteiro (questionário + docs + CAF)</p>
                  <p className="text-xs text-amber-700/80 mt-1 leading-relaxed">
                    O cliente preenche novamente <strong>todas as perguntas</strong> do questionário, envia documentos
                    e passa por liveness + facematch. As respostas anteriores serão substituídas.
                  </p>
                  <p className="text-xs text-amber-700/80 mt-2 leading-relaxed">
                    <strong>Use quando:</strong> houver inconsistências graves no questionário, necessidade de atualizar
                    dados declarados, ou o cliente precise revalidar tudo do zero.
                  </p>
                </div>
              </div>
            </div>

            {!fullLink ? (
              <Button onClick={generateFullLink} disabled={generating} className="w-full gap-2">
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardList className="w-4 h-4" />}
                {generating ? 'Gerando...' : 'Gerar link do Processo Completo'}
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#002443]/70">Link gerado</p>
                <CopyableLink url={fullLink} label="Link Processo Completo" />
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button variant="outline" onClick={() => openWhatsApp(fullLink)} className="gap-2">
                    <MessageCircle className="w-4 h-4 text-green-600" /> Enviar por WhatsApp
                  </Button>
                  <Button variant="outline" onClick={() => openEmail(fullLink)} className="gap-2">
                    <Mail className="w-4 h-4 text-blue-600" /> Enviar por E-mail
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* MENSAGEM PADRÃO */}
        {(docLink || fullLink) && (
          <div className="space-y-2 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#002443]/60" />
              <p className="text-xs font-bold uppercase tracking-wider text-[#002443]/70">
                Mensagem para enviar (editável)
              </p>
            </div>
            <Textarea
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              rows={6}
              className="text-xs font-mono"
            />
            <p className="text-[10px] text-[#002443]/50">
              Dica: "[COLE O LINK AQUI]" é substituído automaticamente quando você clica em WhatsApp ou E-mail.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}