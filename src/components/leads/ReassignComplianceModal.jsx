import React, { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Shield, Copy, ExternalLink, Loader2, ArrowRight, Check } from 'lucide-react';
import { toast } from 'sonner';
import { SEGMENTS, getSegmentLabel, normalizeSegment } from '@/lib/segmentConfig';
import { resolveComplianceModel } from '@/components/compliance/segmentToComplianceV4Map';

/**
 * Modal para alterar segmento de um lead e gerar/copiar o link de compliance correto.
 * 
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - lead: objeto Lead (precisa de id, businessSubCategory, email, fullName)
 *  - entityName: 'Lead' | 'LandingPageLead' | 'IntroducerLead' (qual entidade atualizar)
 *  - segmentField: campo do segmento na entidade (default: 'businessSubCategory')
 *  - invalidateKeys: array de queryKeys para invalidar após salvar
 */
export default function ReassignComplianceModal({
  open, onClose, lead, entityName = 'Lead',
  segmentField = 'businessSubCategory',
  invalidateKeys = [],
}) {
  const queryClient = useQueryClient();
  const currentSegment = normalizeSegment(lead?.[segmentField] || lead?.businessSubCategory || lead?.segment || '');
  const [newSegment, setNewSegment] = useState('');
  const [copied, setCopied] = useState(false);

  // Reset when opening
  React.useEffect(() => {
    if (open) {
      setNewSegment('');
      setCopied(false);
    }
  }, [open]);

  const selectedSegment = newSegment || currentSegment;

  const complianceLink = useMemo(() => {
    if (!selectedSegment) return '';
    // Build a fake lead object with the selected segment to resolve compliance model
    const fakeLead = { ...lead, businessSubCategory: selectedSegment };
    const model = resolveComplianceModel(fakeLead);
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({ model });
    if (lead?.id) params.set('leadId', lead.id);
    return `${baseUrl}/ComplianceDinamico?${params.toString()}`;
  }, [selectedSegment, lead]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const updateData = { [segmentField]: newSegment };
      
      // For Lead entity, also update questionnaireData and log activity
      if (entityName === 'Lead') {
        updateData.lastInteractionDate = new Date().toISOString();
        if (lead.questionnaireData) {
          const seg = SEGMENTS.find(s => s.id === newSegment);
          updateData.questionnaireData = {
            ...lead.questionnaireData,
            segmento: newSegment,
            segmentoLandingPage: seg?.label || lead.questionnaireData?.segmentoLandingPage,
          };
        }
        await base44.entities.Lead.update(lead.id, updateData);
        try {
          const me = await base44.auth.me();
          await base44.entities.LeadActivity.create({
            leadId: lead.id,
            activityType: 'nota_adicionada',
            description: `🔀 Segmento alterado de "${getSegmentLabel(currentSegment)}" para "${getSegmentLabel(newSegment)}" — link de compliance reagendado`,
            performedBy: me?.email || 'admin',
            activityDate: new Date().toISOString(),
            details: { event: 'segment_changed', from: currentSegment, to: newSegment },
          });
        } catch (_) {}
      } else if (entityName === 'LandingPageLead') {
        updateData.segment = getSegmentLabel(newSegment);
        updateData.businessSubCategory = newSegment;
        await base44.entities.LandingPageLead.update(lead.id, updateData);
        // Also update the linked Lead if exists
        if (lead.leadId) {
          await base44.entities.Lead.update(lead.leadId, {
            businessSubCategory: newSegment,
            lastInteractionDate: new Date().toISOString(),
          });
        }
      } else if (entityName === 'IntroducerLead') {
        updateData.businessSubCategory = newSegment;
        await base44.entities.IntroducerLead.update(lead.id, updateData);
        if (lead.leadId) {
          await base44.entities.Lead.update(lead.leadId, {
            businessSubCategory: newSegment,
            lastInteractionDate: new Date().toISOString(),
          });
        }
      }
    },
    onSuccess: () => {
      invalidateKeys.forEach(key => queryClient.invalidateQueries({ queryKey: key }));
      toast.success(`Segmento atualizado para ${getSegmentLabel(newSegment)}`);
    },
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(complianceLink);
    setCopied(true);
    toast.success('Link de compliance copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveAndCopy = async () => {
    if (newSegment && newSegment !== currentSegment) {
      await updateMutation.mutateAsync();
    }
    handleCopyLink();
  };

  if (!lead) return null;

  const segmentChanged = newSegment && newSegment !== currentSegment;

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <AlertDialogContent className="max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-[#002443]">
            <Shield className="w-5 h-5 text-[#2bc196]" />
            Reenviar Compliance
          </AlertDialogTitle>
          <AlertDialogDescription className="text-[#002443]/60">
            Altere o segmento do cliente se necessário e copie o link de compliance correto para enviar.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          {/* Client info */}
          <div className="bg-slate-50 rounded-xl p-3 space-y-1">
            <p className="text-sm font-semibold text-[#002443]">{lead.fullName || lead.razaoSocial || lead.email}</p>
            <p className="text-xs text-[#002443]/50">{lead.cpfCnpj || lead.cnpj || lead.email}</p>
          </div>

          {/* Current segment */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#002443]/60 w-24 shrink-0">Segmento atual:</span>
            <Badge className="bg-[#002443]/5 text-[#002443] border-0">
              {currentSegment ? getSegmentLabel(currentSegment) : 'Não definido'}
            </Badge>
          </div>

          {/* New segment selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#002443]/60 w-24 shrink-0">Novo segmento:</span>
            <Select value={newSegment} onValueChange={setNewSegment}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione o segmento correto" />
              </SelectTrigger>
              <SelectContent>
                {SEGMENTS.map(seg => (
                  <SelectItem key={seg.id} value={seg.id} disabled={seg.id === currentSegment}>
                    {seg.label} {seg.id === currentSegment ? '(atual)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Arrow showing change */}
          {segmentChanged && (
            <div className="flex items-center justify-center gap-2 py-1">
              <Badge className="bg-red-50 text-red-600 border-red-200">{getSegmentLabel(currentSegment)}</Badge>
              <ArrowRight className="w-4 h-4 text-[#002443]/40" />
              <Badge className="bg-green-50 text-green-700 border-green-200">{getSegmentLabel(newSegment)}</Badge>
            </div>
          )}

          {/* Generated compliance link */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-[#002443]/60">Link de compliance:</span>
            <div className="bg-slate-50 rounded-lg p-3 flex items-center gap-2">
              <code className="text-[10px] text-[#002443]/70 flex-1 break-all leading-relaxed">{complianceLink}</code>
              <Button variant="ghost" size="sm" className="shrink-0 h-7" onClick={handleCopyLink}>
                {copied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
              </Button>
            </div>
          </div>
        </div>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="text-[#002443]/60">Cancelar</AlertDialogCancel>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(complianceLink, '_blank')}
            className="gap-1"
          >
            <ExternalLink className="w-3 h-3" /> Abrir Link
          </Button>
          <Button
            onClick={handleSaveAndCopy}
            disabled={updateMutation.isPending}
            className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white gap-1"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                {segmentChanged ? 'Salvar & Copiar Link' : 'Copiar Link'}
                <Copy className="w-3 h-3" />
              </>
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}