import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Link as LinkIcon, Copy, Check, ExternalLink, Info } from 'lucide-react';
import { toast } from 'sonner';

export default function GenerateOnboardingLink() {
  const [copied, setCopied] = useState(false);

  // Link direto para a página inicial do onboarding
  const onboardingLink = `${window.location.origin}${createPageUrl('ComplianceOnboardingStart')}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(onboardingLink);
    setCopied(true);
    toast.success('Link copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenLink = () => {
    window.open(onboardingLink, '_blank');
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('AdminDashboard')}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gerar Link de Onboarding</h1>
          <p className="text-slate-500">Compartilhe o link com o merchant para iniciar o processo</p>
        </div>
      </div>

      {/* Card Principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--pagsmile-green)]/10">
              <LinkIcon className="w-5 h-5 text-[var(--pagsmile-green)]" />
            </div>
            <div>
              <CardTitle>Link de Onboarding</CardTitle>
              <CardDescription>Use este link para novos merchants iniciarem o cadastro</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              readOnly
              value={onboardingLink}
              className="font-mono text-sm bg-slate-50"
            />
            <Button
              variant="outline"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button
              variant="outline"
              onClick={handleOpenLink}
              className="shrink-0"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>

          <Button 
            onClick={handleCopy} 
            className="w-full bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
          >
            <Copy className="w-4 h-4 mr-2" />
            Copiar Link
          </Button>
        </CardContent>
      </Card>

      {/* Info */}
      <Alert>
        <Info className="w-4 h-4" />
        <AlertDescription>
          O merchant será guiado pelo processo completo de onboarding, onde irá informar seus dados, 
          tipo de pessoa (PF ou PJ), serviços desejados e realizar as validações necessárias.
        </AlertDescription>
      </Alert>
    </div>
  );
}