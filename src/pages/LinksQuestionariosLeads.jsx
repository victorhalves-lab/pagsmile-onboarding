import React, { useState } from 'react';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ExternalLink, Link as LinkIcon, Plus, Check, Briefcase, Zap, Loader2, ArrowRight, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import IntroducerLinkGeneratorModal from '../components/introducers/IntroducerLinkGeneratorModal';

export default function LinksQuestionariosLeads() {
  const [copied, setCopied] = useState(null);
  const [introducerModalOpen, setIntroducerModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Links genéricos
  const genericLinks = {
    LEAD: `${window.location.origin}${createPageUrl('LeadQuestionnaire')}`,
    LEAD_SIMPLIFICADO: `${window.location.origin}${createPageUrl('QuestionarioSimplificadoPublico')}`,
  };

  const handleCopy = async (text, id) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Link copiado para a área de transferência!');
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
            <h1 className="text-2xl font-bold text-white">Links de Questionários</h1>
            <p className="text-white/60 text-sm mt-1">Acesse e gere links para coleta de dados de leads</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Questionário Completo */}
        <Card className="rounded-2xl border border-[#002443]/5 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#2bc196] to-[#5cf7cf]" />
          <CardHeader className="pt-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#2bc196]/10">
                  <Briefcase className="w-5 h-5 text-[#2bc196]" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-[#002443]">Questionário Completo</CardTitle>
                  <CardDescription className="text-[#282828]/50 text-xs mt-0.5">Para qualificação comercial detalhada</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.open(genericLinks.LEAD, '_blank')} className="border-[#002443]/10 text-[#002443] hover:bg-[#002443]/5 rounded-lg">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Visualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-[#002443]/40">Link Padrão</Label>
              <div className="flex gap-2">
                <Input readOnly value={genericLinks.LEAD} className="font-mono text-xs bg-[#f4f4f4] border-[#002443]/5 rounded-lg" />
                <Button 
                  onClick={() => handleCopy(genericLinks.LEAD, 'lead-standard')}
                  className={`rounded-lg ${copied === 'lead-standard' ? 'bg-[#2bc196]' : 'bg-[#002443] hover:bg-[#002443]/90'}`}
                >
                  {copied === 'lead-standard' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            <div className="bg-[#f4f4f4] p-4 rounded-xl text-sm text-[#002443]/80 border border-[#002443]/5">
              <p className="font-semibold text-[#002443] text-xs mb-2">Use este questionário quando:</p>
              <ul className="list-disc pl-4 space-y-1 text-xs text-[#282828]/60">
                <li>O cliente está iniciando o contato comercial</li>
                <li>Você precisa de dados completos para análise de MCC e Compliance</li>
                <li>É necessário validar documentos e sócios</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <LinkGenerator 
              type="LEAD_QUESTIONNAIRE" 
              label="Gerar Link Rastreável" 
              basePage="LeadQuestionnaire"
              icon={Briefcase}
            />
          </CardFooter>
        </Card>

        {/* Card Questionário Simplificado */}
        <Card className="rounded-2xl border border-[#002443]/5 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-[#36706c] to-[#2bc196]" />
          <CardHeader className="pt-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#36706c]/10">
                  <Zap className="w-5 h-5 text-[#36706c]" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-[#002443]">Questionário Simplificado</CardTitle>
                  <CardDescription className="text-[#282828]/50 text-xs mt-0.5">Para coleta rápida de taxas e proposta</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.open(genericLinks.LEAD_SIMPLIFICADO, '_blank')} className="border-[#002443]/10 text-[#002443] hover:bg-[#002443]/5 rounded-lg">
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                Visualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-[#002443]/40">Link Padrão</Label>
              <div className="flex gap-2">
                <Input readOnly value={genericLinks.LEAD_SIMPLIFICADO} className="font-mono text-xs bg-[#f4f4f4] border-[#002443]/5 rounded-lg" />
                <Button 
                  onClick={() => handleCopy(genericLinks.LEAD_SIMPLIFICADO, 'lead-simple')}
                  className={`rounded-lg ${copied === 'lead-simple' ? 'bg-[#2bc196]' : 'bg-[#002443] hover:bg-[#002443]/90'}`}
                >
                  {copied === 'lead-simple' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-[#f4f4f4] p-4 rounded-xl text-sm text-[#002443]/80 border border-[#002443]/5">
              <p className="font-semibold text-[#002443] text-xs mb-2">Use este questionário quando:</p>
              <ul className="list-disc pl-4 space-y-1 text-xs text-[#282828]/60">
                <li>Você já teve uma reunião e quer enviar uma proposta</li>
                <li>Precisa apenas coletar as taxas atuais do cliente</li>
                <li>O cliente quer agilidade no processo comercial</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter>
            <LinkGenerator 
              type="LEAD_SIMPLIFICADO" 
              label="Gerar Link Rastreável" 
              basePage="QuestionarioSimplificadoPublico"
              icon={Zap}
            />
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

function LinkGenerator({ type, label, basePage, icon: Icon }) {
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
      const url = `${window.location.origin}${createPageUrl(basePage)}?ref=${data.uniqueCode}`;
      setGeneratedLink(url);
      toast.success('Link rastreável gerado!');
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
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) {
    return (
      <Button variant="ghost" className="w-full justify-between" onClick={() => setIsOpen(true)}>
        <span className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          {label}
        </span>
        <ArrowRight className="w-4 h-4 text-slate-400" />
      </Button>
    );
  }

  return (
    <div className="w-full space-y-4 pt-4 border-t border-[#002443]/5 animate-in slide-in-from-top-2">
      <div className="space-y-2">
        <Label className="text-xs">Nome do Vendedor (Opcional)</Label>
        <Input 
          placeholder="Ex: João Silva" 
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          className="h-9 text-sm"
        />
      </div>
      
      {generatedLink ? (
        <div className="space-y-2">
          <Label className="text-xs text-green-600 font-bold">Link Gerado:</Label>
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
            Gerar outro
          </Button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button 
            size="sm" 
            className="flex-1 bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-lg"
            onClick={handleGenerate}
            disabled={createLinkMutation.isPending}
          >
            {createLinkMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : null}
            Gerar Link
          </Button>
        </div>
      )}
    </div>
  );
}