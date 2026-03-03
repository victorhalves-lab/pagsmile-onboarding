import React, { useState } from 'react';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ExternalLink, Link as LinkIcon, Plus, Check, Briefcase, Zap, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function LinksQuestionariosLeads() {
  const [copied, setCopied] = useState(null);
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--pagsmile-blue)]">Links de Questionários</h1>
        <p className="text-[var(--pagsmile-blue)]/70">Acesse e gere links para coleta de dados de leads</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card Questionário Completo */}
        <Card className="border-l-4 border-l-[var(--pagsmile-green)]">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--pagsmile-green)]/10">
                  <Briefcase className="w-6 h-6 text-[var(--pagsmile-green)]" />
                </div>
                <div>
                  <CardTitle className="text-lg">Questionário Completo</CardTitle>
                  <CardDescription>Para qualificação comercial detalhada</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.open(genericLinks.LEAD, '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Visualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-[var(--pagsmile-blue)]/60">Link Padrão</Label>
              <div className="flex gap-2">
                <Input readOnly value={genericLinks.LEAD} className="font-mono text-xs bg-slate-50" />
                <Button 
                  onClick={() => handleCopy(genericLinks.LEAD, 'lead-standard')}
                  className={copied === 'lead-standard' ? 'bg-green-600' : ''}
                >
                  {copied === 'lead-standard' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            <div className="bg-slate-50 p-4 rounded-lg text-sm text-[var(--pagsmile-blue)]/80">
              <p><strong>Use este questionário quando:</strong></p>
              <ul className="list-disc pl-4 mt-1 space-y-1 text-xs">
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
        <Card className="border-l-4 border-l-amber-500">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Zap className="w-6 h-6 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">Questionário Simplificado</CardTitle>
                  <CardDescription>Para coleta rápida de taxas e proposta</CardDescription>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.open(genericLinks.LEAD_SIMPLIFICADO, '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Visualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-[var(--pagsmile-blue)]/60">Link Padrão</Label>
              <div className="flex gap-2">
                <Input readOnly value={genericLinks.LEAD_SIMPLIFICADO} className="font-mono text-xs bg-slate-50" />
                <Button 
                  onClick={() => handleCopy(genericLinks.LEAD_SIMPLIFICADO, 'lead-simple')}
                  className={copied === 'lead-simple' ? 'bg-green-600' : ''}
                >
                  {copied === 'lead-simple' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg text-sm text-[var(--pagsmile-blue)]/80">
              <p><strong>Use este questionário quando:</strong></p>
              <ul className="list-disc pl-4 mt-1 space-y-1 text-xs">
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
    <div className="w-full space-y-4 pt-4 border-t border-slate-100 animate-in slide-in-from-top-2">
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
            <Input readOnly value={generatedLink} className="font-mono text-xs bg-green-50 border-green-200" />
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
            className="flex-1 bg-[var(--pagsmile-blue)] hover:bg-[var(--pagsmile-blue)]/90"
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