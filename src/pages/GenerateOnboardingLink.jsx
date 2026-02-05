import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, Link as LinkIcon, Copy, Check, ExternalLink, Info,
  Plus, QrCode, BarChart3, Eye, Trash2, Loader2, RefreshCw,
  TrendingUp, MousePointer, FileCheck
} from 'lucide-react';
import { toast } from 'sonner';

export default function GenerateOnboardingLink() {
  const [copied, setCopied] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    questionnaireTemplateId: '',
    commercialAgentId: '',
    commercialAgentName: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    utmContent: '',
    expiresAt: ''
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['questionnaireTemplates'],
    queryFn: () => base44.entities.QuestionnaireTemplate.filter({ isActive: true })
  });

  const { data: links = [], isLoading: linksLoading, refetch } = useQuery({
    queryKey: ['onboardingLinks'],
    queryFn: () => base44.entities.OnboardingLink.list('-created_date', 100)
  });

  const createLinkMutation = useMutation({
    mutationFn: async (data) => {
      const uniqueCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      return base44.entities.OnboardingLink.create({
        ...data,
        uniqueCode,
        isActive: true,
        clickCount: 0,
        submissionCount: 0,
        completedCount: 0
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingLinks'] });
      toast.success('Link criado com sucesso!');
      setFormData({
        questionnaireTemplateId: '',
        commercialAgentId: '',
        commercialAgentName: '',
        utmSource: '',
        utmMedium: '',
        utmCampaign: '',
        utmContent: '',
        expiresAt: ''
      });
      setActiveTab('history');
    },
    onError: (error) => {
      toast.error('Erro ao criar link: ' + error.message);
    }
  });

  const deleteLinkMutation = useMutation({
    mutationFn: (id) => base44.entities.OnboardingLink.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboardingLinks'] });
      toast.success('Link excluído');
    }
  });

  // Link genérico (sem código)
  const genericLink = `${window.location.origin}${createPageUrl('ComplianceOnboardingStart')}`;

  const generateLinkUrl = (link) => {
    let url = `${window.location.origin}${createPageUrl('ComplianceOnboardingStart')}?ref=${link.uniqueCode}`;
    if (link.utmSource) url += `&utm_source=${link.utmSource}`;
    if (link.utmMedium) url += `&utm_medium=${link.utmMedium}`;
    if (link.utmCampaign) url += `&utm_campaign=${link.utmCampaign}`;
    if (link.utmContent) url += `&utm_content=${link.utmContent}`;
    return url;
  };

  const handleCopy = async (text, id = null) => {
    await navigator.clipboard.writeText(text);
    if (id) {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
    toast.success('Link copiado!');
  };

  const handleCreateLink = () => {
    createLinkMutation.mutate(formData);
  };

  // Stats
  const stats = React.useMemo(() => {
    const totalClicks = links.reduce((sum, l) => sum + (l.clickCount || 0), 0);
    const totalSubmissions = links.reduce((sum, l) => sum + (l.submissionCount || 0), 0);
    const totalCompleted = links.reduce((sum, l) => sum + (l.completedCount || 0), 0);
    const conversionRate = totalClicks > 0 ? ((totalSubmissions / totalClicks) * 100).toFixed(1) : 0;
    
    return { totalClicks, totalSubmissions, totalCompleted, conversionRate, totalLinks: links.length };
  }, [links]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('AdminDashboard')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Links de Onboarding</h1>
            <p className="text-slate-500">Gere e gerencie links para novos merchants</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-slate-800">{stats.totalLinks}</p>
            <p className="text-xs text-slate-500">Links Criados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MousePointer className="w-4 h-4 text-blue-500" />
              <p className="text-2xl font-bold text-blue-600">{stats.totalClicks}</p>
            </div>
            <p className="text-xs text-slate-500">Total de Cliques</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-purple-500" />
              <p className="text-2xl font-bold text-purple-600">{stats.totalSubmissions}</p>
            </div>
            <p className="text-xs text-slate-500">Submissões</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <p className="text-2xl font-bold text-green-600">{stats.totalCompleted}</p>
            </div>
            <p className="text-xs text-slate-500">Completados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-500" />
              <p className="text-2xl font-bold text-teal-600">{stats.conversionRate}%</p>
            </div>
            <p className="text-xs text-slate-500">Taxa de Conversão</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generate">Gerar Link</TabsTrigger>
          <TabsTrigger value="history">Histórico ({links.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          {/* Link Genérico */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[var(--pagsmile-green)]/10">
                  <LinkIcon className="w-5 h-5 text-[var(--pagsmile-green)]" />
                </div>
                <div>
                  <CardTitle>Link Genérico</CardTitle>
                  <CardDescription>Link padrão sem rastreamento personalizado</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input readOnly value={genericLink} className="font-mono text-sm bg-slate-50" />
                <Button variant="outline" onClick={() => handleCopy(genericLink)} className="shrink-0">
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
                <Button variant="outline" onClick={() => window.open(genericLink, '_blank')} className="shrink-0">
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Criar Link Personalizado */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100">
                    <Plus className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle>Link Personalizado</CardTitle>
                    <CardDescription>Crie um link com rastreamento e parâmetros</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setShowAdvanced(!showAdvanced)}>
                  {showAdvanced ? 'Ocultar Avançado' : 'Mostrar Avançado'}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Questionário (opcional)</Label>
                  <Select 
                    value={formData.questionnaireTemplateId} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, questionnaireTemplateId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o questionário" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Padrão (qualquer)</SelectItem>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Agente Comercial</Label>
                  <Input
                    value={formData.commercialAgentName}
                    onChange={(e) => setFormData(prev => ({ ...prev, commercialAgentName: e.target.value }))}
                    placeholder="Nome do agente"
                  />
                </div>
              </div>

              {showAdvanced && (
                <>
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-slate-700 mb-3">Parâmetros UTM</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Source</Label>
                        <Input
                          value={formData.utmSource}
                          onChange={(e) => setFormData(prev => ({ ...prev, utmSource: e.target.value }))}
                          placeholder="google, facebook"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Medium</Label>
                        <Input
                          value={formData.utmMedium}
                          onChange={(e) => setFormData(prev => ({ ...prev, utmMedium: e.target.value }))}
                          placeholder="email, cpc"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Campaign</Label>
                        <Input
                          value={formData.utmCampaign}
                          onChange={(e) => setFormData(prev => ({ ...prev, utmCampaign: e.target.value }))}
                          placeholder="black_friday"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Content</Label>
                        <Input
                          value={formData.utmContent}
                          onChange={(e) => setFormData(prev => ({ ...prev, utmContent: e.target.value }))}
                          placeholder="banner_top"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Data de Expiração (opcional)</Label>
                    <Input
                      type="date"
                      value={formData.expiresAt}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiresAt: e.target.value }))}
                    />
                  </div>
                </>
              )}

              <Button 
                onClick={handleCreateLink}
                disabled={createLinkMutation.isPending}
                className="w-full bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
              >
                {createLinkMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Criar Link Personalizado
              </Button>
            </CardContent>
          </Card>

          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              Links personalizados permitem rastrear a origem das submissões e medir a performance de campanhas e agentes comerciais.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Links Gerados</CardTitle>
              <CardDescription>Histórico de todos os links criados</CardDescription>
            </CardHeader>
            <CardContent>
              {linksLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : links.length === 0 ? (
                <div className="text-center py-8">
                  <LinkIcon className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500">Nenhum link personalizado criado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Agente</TableHead>
                      <TableHead>Cliques</TableHead>
                      <TableHead>Submissões</TableHead>
                      <TableHead>Conversão</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {links.map((link) => {
                      const conversion = link.clickCount > 0 
                        ? ((link.submissionCount / link.clickCount) * 100).toFixed(1) 
                        : 0;
                      return (
                        <TableRow key={link.id}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">{link.uniqueCode}</Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {link.commercialAgentName || '-'}
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-blue-600">{link.clickCount || 0}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-purple-600">{link.submissionCount || 0}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium text-teal-600">{conversion}%</span>
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">
                            {link.created_date ? new Date(link.created_date).toLocaleDateString('pt-BR') : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleCopy(generateLinkUrl(link), link.id)}
                              >
                                {copiedId === link.id ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => window.open(generateLinkUrl(link), '_blank')}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => deleteLinkMutation.mutate(link.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}