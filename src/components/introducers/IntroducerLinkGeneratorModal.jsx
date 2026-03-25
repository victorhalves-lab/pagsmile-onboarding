import React, { useState } from 'react';
import { createPageUrl } from '../../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Copy, Check, Loader2, UserPlus, Briefcase, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function IntroducerLinkGeneratorModal({ open, onOpenChange }) {
  const queryClient = useQueryClient();
  const [selectedIntroducerId, setSelectedIntroducerId] = useState('');
  const [linkType, setLinkType] = useState('LEAD_QUESTIONNAIRE');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [agentName, setAgentName] = useState('');
  const [utmMedium, setUtmMedium] = useState('referral');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [generatedLink, setGeneratedLink] = useState(null);
  const [copied, setCopied] = useState(false);

  const { data: introducers = [], isLoading } = useQuery({
    queryKey: ['introducers-active'],
    queryFn: () => base44.entities.Introducer.filter({ status: 'active' }),
    enabled: open,
  });

  const { data: leadTemplates = [] } = useQuery({
    queryKey: ['lead-templates-active'],
    queryFn: async () => {
      const all = await base44.entities.QuestionnaireTemplate.filter({ category: 'LEAD_GENERATION', isActive: true });
      return all.filter(t => !t.isArchived);
    },
    enabled: open,
  });

  const selectedIntroducer = introducers.find(i => i.id === selectedIntroducerId);

  const createMutation = useMutation({
    mutationFn: async () => {
      const uniqueCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const basePage = linkType === 'LEAD_QUESTIONNAIRE' ? 'LeadQuestionnaire' : 'QuestionarioSimplificadoPublico';
      
      const link = await base44.entities.OnboardingLink.create({
        linkType: linkType,
        uniqueCode,
        commercialAgentName: agentName || undefined,
        introducerId: selectedIntroducer.id,
        introducerReferralCode: selectedIntroducer.referralCode,
        utmSource: selectedIntroducer.referralCode,
        utmMedium: utmMedium || 'referral',
        utmCampaign: utmCampaign || undefined,
        isActive: true,
        clickCount: 0,
        submissionCount: 0,
        completedCount: 0,
        complianceType: 'GENERIC',
      });

      const url = `${window.location.origin}${createPageUrl(basePage)}?ref=${link.uniqueCode}`;
      return url;
    },
    onSuccess: (url) => {
      queryClient.invalidateQueries({ queryKey: ['onboardingLinks'] });
      setGeneratedLink(url);
      toast.success('Link gerado com sucesso para o Introducer!');
    },
    onError: () => {
      toast.error('Erro ao gerar link');
    }
  });

  const handleCopy = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setSelectedIntroducerId('');
    setLinkType('LEAD_QUESTIONNAIRE');
    setAgentName('');
    setUtmMedium('referral');
    setUtmCampaign('');
    setGeneratedLink(null);
    setCopied(false);
  };

  const handleClose = (val) => {
    if (!val) handleReset();
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#2bc196]" />
            Gerar Link por Introducer
          </DialogTitle>
          <DialogDescription>
            Selecione um Introducer e gere um link rastreável vinculado a ele.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Introducer Select */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Introducer *</Label>
            {isLoading ? (
              <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Carregando...
              </div>
            ) : introducers.length === 0 ? (
              <p className="text-xs text-red-500">Nenhum Introducer ativo cadastrado.</p>
            ) : (
              <Select value={selectedIntroducerId} onValueChange={setSelectedIntroducerId}>
                <SelectTrigger><SelectValue placeholder="Selecione um Introducer" /></SelectTrigger>
                <SelectContent>
                  {introducers.map(i => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name} ({i.referralCode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Link Type */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Tipo de Questionário</Label>
            <Select value={linkType} onValueChange={setLinkType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="LEAD_QUESTIONNAIRE">
                  <span className="flex items-center gap-2"><Briefcase className="w-3 h-3" /> Completo</span>
                </SelectItem>
                <SelectItem value="LEAD_SIMPLIFICADO">
                  <span className="flex items-center gap-2"><Zap className="w-3 h-3" /> Simplificado</span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Optional fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Vendedor (Opcional)</Label>
              <Input placeholder="Ex: João Silva" value={agentName} onChange={e => setAgentName(e.target.value)} className="h-9 text-sm" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">UTM Medium</Label>
              <Input placeholder="referral" value={utmMedium} onChange={e => setUtmMedium(e.target.value)} className="h-9 text-sm" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">UTM Campaign (Opcional)</Label>
            <Input placeholder="Ex: campanha-marco-2026" value={utmCampaign} onChange={e => setUtmCampaign(e.target.value)} className="h-9 text-sm" />
          </div>

          {/* UTM Source preview */}
          {selectedIntroducer && (
            <div className="bg-[#f4f4f4] p-3 rounded-xl border border-[#002443]/5 text-xs space-y-1">
              <p className="font-semibold text-[#002443]">UTM Source (automático):</p>
              <code className="text-[#2bc196] font-mono">{selectedIntroducer.referralCode}</code>
            </div>
          )}

          {/* Generated Link */}
          {generatedLink ? (
            <div className="space-y-2 pt-2 border-t border-[#002443]/5">
              <Label className="text-xs text-green-600 font-bold">Link Gerado:</Label>
              <div className="flex gap-2">
                <Input readOnly value={generatedLink} className="font-mono text-xs bg-[#5cf7cf]/10 border-[#2bc196]/30 rounded-lg" />
                <Button size="sm" onClick={handleCopy} className={copied ? 'bg-green-600' : ''}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <Button variant="ghost" size="sm" className="w-full text-xs text-slate-500 h-6 mt-1" onClick={handleReset}>
                Gerar outro
              </Button>
            </div>
          ) : (
            <Button
              className="w-full bg-[#2bc196] hover:bg-[#2bc196]/90 text-white"
              onClick={() => createMutation.mutate()}
              disabled={!selectedIntroducerId || createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Gerar Link para Introducer
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}