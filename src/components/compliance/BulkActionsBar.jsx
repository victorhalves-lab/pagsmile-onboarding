import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  RefreshCw, ScanFace, Loader2, X, Link2, Send, Copy, Check, CheckCircle2, AlertTriangle
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';

/**
 * Barra de ações em massa para casos de compliance selecionados.
 * - Revalidar (re-rodar pipeline BDC + SENTINEL)
 * - Gerar links de re-coleta de Docs + CAF
 */
export default function BulkActionsBar({ selectedRows, setSelectedRows, casesMap, merchantMap, onRefresh }) {
  const [revalidating, setRevalidating] = useState(false);
  const [revalidateProgress, setRevalidateProgress] = useState({ done: 0, total: 0, errors: [] });
  const [showDocLinksDialog, setShowDocLinksDialog] = useState(false);
  const [generatingLinks, setGeneratingLinks] = useState(false);
  const [generatedLinks, setGeneratedLinks] = useState([]);
  const [sendingEmails, setSendingEmails] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  if (selectedRows.length === 0) return null;

  // ── Revalidar em massa ──
  const handleBulkRevalidate = async () => {
    const count = selectedRows.length;
    if (!confirm(`Revalidar ${count} caso(s)? Isso vai re-executar o pipeline completo (BDC + SENTINEL + CAF) para cada um.`)) return;

    setRevalidating(true);
    setRevalidateProgress({ done: 0, total: count, errors: [] });
    const errors = [];

    for (let i = 0; i < selectedRows.length; i++) {
      const caseId = selectedRows[i];
      try {
        // Reset flags to allow re-processing
        await base44.entities.OnboardingCase.update(caseId, {
          bigDataCorpCompleted: false,
          validationsCompleted: false,
          status: 'Em Processamento',
        });
        // Trigger pipeline
        await base44.functions.invoke('autoEnrichOnboarding', { onboardingCaseId: caseId });
      } catch (err) {
        const merchant = merchantMap[casesMap[caseId]?.merchantId];
        errors.push({ caseId, name: merchant?.fullName || caseId, error: err.message });
      }
      setRevalidateProgress(prev => ({ ...prev, done: i + 1, errors: [...errors] }));
    }

    setRevalidating(false);
    if (errors.length === 0) {
      toast.success(`${count} caso(s) revalidados com sucesso!`);
    } else {
      toast.warning(`${count - errors.length} OK, ${errors.length} com erro`);
    }
    setSelectedRows([]);
    onRefresh?.();
  };

  // ── Gerar links Docs+CAF em massa ──
  const handleBulkGenerateLinks = async () => {
    setShowDocLinksDialog(true);
    setGeneratingLinks(true);
    setGeneratedLinks([]);

    const links = [];
    for (const caseId of selectedRows) {
      const caseData = casesMap[caseId];
      if (!caseData) continue;
      const merchant = merchantMap[caseData.merchantId];
      try {
        let token = caseData.docLinkToken;
        if (!token) {
          token = crypto.randomUUID().replace(/-/g, '').slice(0, 24);
          await base44.entities.OnboardingCase.update(caseId, { docLinkToken: token });
        }
        // Reset doc/caf flags to allow re-submission
        await base44.entities.OnboardingCase.update(caseId, {
          docCompleted: false,
          cafCompleted: false,
        });
        const url = `${window.location.origin}/ComplianceDocOnly?caseId=${caseId}&token=${token}`;
        links.push({
          caseId,
          name: merchant?.fullName || 'N/A',
          email: merchant?.email || '',
          url,
        });
      } catch (err) {
        links.push({
          caseId,
          name: merchant?.fullName || 'N/A',
          email: merchant?.email || '',
          url: null,
          error: err.message,
        });
      }
    }
    setGeneratedLinks(links);
    setGeneratingLinks(false);
  };

  // ── Copiar todos os links ──
  const handleCopyAll = () => {
    const validLinks = generatedLinks.filter(l => l.url);
    const text = validLinks.map(l => `${l.name} | ${l.email || '-'} | ${l.url}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast.success(`${validLinks.length} link(s) copiados!`);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // ── Enviar e-mails em massa ──
  const handleSendAllEmails = async () => {
    const withEmail = generatedLinks.filter(l => l.url && l.email);
    if (withEmail.length === 0) {
      toast.error('Nenhum caso com e-mail disponível');
      return;
    }
    if (!confirm(`Enviar e-mail de solicitação de documentos para ${withEmail.length} cliente(s)?`)) return;

    setSendingEmails(true);
    let sent = 0;
    for (const link of withEmail) {
      try {
        await base44.integrations.Core.SendEmail({
          to: link.email,
          subject: 'Complemento de Documentos — Pin Bank',
          body: `<p>Olá <strong>${link.name}</strong>,</p><p>Para dar continuidade ao seu processo de onboarding, precisamos que envie os documentos solicitados e complete a verificação de identidade.</p><p><a href="${link.url}" style="display:inline-block;padding:12px 24px;background:#1356E2;color:white;text-decoration:none;border-radius:8px;font-weight:600;">Enviar Documentos e Verificar Identidade</a></p><p>Se o botão não funcionar, copie e cole o link abaixo:</p><p>${link.url}</p><p>Atenciosamente,<br/>Equipe Pin Bank</p>`,
        });
        sent++;
      } catch (err) {
        console.warn(`Erro ao enviar para ${link.email}:`, err);
      }
    }
    setSendingEmails(false);
    toast.success(`${sent} e-mail(s) enviado(s) com sucesso!`);
  };

  return (
    <>
      {/* Barra de ações */}
      <div className="bg-[#0A0A0A] rounded-xl p-3 flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-3">
          <Badge className="bg-white/15 text-white border-0 text-sm font-bold px-3 py-1">
            {selectedRows.length} selecionado{selectedRows.length !== 1 ? 's' : ''}
          </Badge>
          <Button
            size="sm"
            className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white rounded-lg text-xs gap-1.5"
            onClick={handleBulkRevalidate}
            disabled={revalidating}
          >
            {revalidating ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Revalidando {revalidateProgress.done}/{revalidateProgress.total}...</>
            ) : (
              <><RefreshCw className="w-3.5 h-3.5" /> Revalidar Pipeline</>
            )}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10 rounded-lg text-xs gap-1.5 bg-transparent"
            onClick={handleBulkGenerateLinks}
            disabled={generatingLinks}
          >
            <ScanFace className="w-3.5 h-3.5" /> Gerar Links Docs+CAF
          </Button>
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="text-white/60 hover:text-white hover:bg-white/10 rounded-lg"
          onClick={() => setSelectedRows([])}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Dialog de links gerados */}
      <Dialog open={showDocLinksDialog} onOpenChange={setShowDocLinksDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanFace className="w-5 h-5 text-purple-600" />
              Links de Re-coleta Docs + CAF
            </DialogTitle>
            <DialogDescription>
              Links gerados para {selectedRows.length} caso(s). O cliente poderá enviar documentos e fazer liveness/facematch.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-2 py-2">
            {generatingLinks ? (
              <div className="flex items-center justify-center py-8 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-[var(--pinbank-blue)]" />
                <span className="text-sm text-[#0A0A0A]/70">Gerando links e resetando flags...</span>
              </div>
            ) : (
              generatedLinks.map((link, i) => (
                <div key={i} className={`p-3 rounded-lg border ${link.error ? 'bg-red-50 border-red-200' : 'bg-white border-[#0A0A0A]/8'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#0A0A0A] truncate">{link.name}</p>
                      <p className="text-xs text-[#0A0A0A]/50">{link.email || 'Sem e-mail'}</p>
                    </div>
                    {link.error ? (
                      <Badge className="bg-red-100 text-red-700 border-0 text-xs gap-1">
                        <AlertTriangle className="w-3 h-3" /> Erro
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1 shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText(link.url);
                          toast.success(`Link copiado para ${link.name}`);
                        }}
                      >
                        <Copy className="w-3 h-3" /> Copiar
                      </Button>
                    )}
                  </div>
                  {link.url && (
                    <p className="text-[10px] text-[#0A0A0A]/40 mt-1 font-mono truncate">{link.url}</p>
                  )}
                </div>
              ))
            )}
          </div>

          {!generatingLinks && generatedLinks.length > 0 && (
            <DialogFooter className="flex-col sm:flex-row gap-2 border-t pt-4">
              <Button
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={handleCopyAll}
              >
                {copiedAll ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedAll ? 'Copiados!' : `Copiar Todos (${generatedLinks.filter(l => l.url).length})`}
              </Button>
              <Button
                className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white gap-1.5 text-xs"
                onClick={handleSendAllEmails}
                disabled={sendingEmails || generatedLinks.filter(l => l.url && l.email).length === 0}
              >
                {sendingEmails ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Enviando...</>
                ) : (
                  <><Send className="w-3.5 h-3.5" /> Enviar E-mails ({generatedLinks.filter(l => l.url && l.email).length})</>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}