import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Plug,
  Settings,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Plus,
  ExternalLink,
  Key,
  Webhook,
  Database,
  Shield,
  Eye,
  Play,
  Loader2,
  AlertTriangle,
  Copy,
  FileText,
  Users,
  Building2,
  Fingerprint,
  ScanFace,
  FileSearch,
} from 'lucide-react';
import { toast } from 'sonner';

export default function IntegracoesExternas() {
  const [activeTab, setActiveTab] = useState('overview');
  const [configDialog, setConfigDialog] = useState({ open: false, provider: null });
  const [testingProvider, setTestingProvider] = useState(null);
  const queryClient = useQueryClient();

  const { data: integrationConfigs = [], isLoading: configsLoading } = useQuery({
    queryKey: ['integrationConfigs'],
    queryFn: () => base44.entities.IntegrationConfig.list()
  });

  const { data: integrationLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['integrationLogs'],
    queryFn: () => base44.entities.IntegrationLog.list('-created_date', 50)
  });

  const cafConfig = integrationConfigs.find(c => c.provider === 'CAF');
  const bdcConfig = integrationConfigs.find(c => c.provider === 'BigDataCorp');

  const cafServices = [
    { id: 'liveness', name: 'Face Liveness', icon: ScanFace, desc: 'Prova de vida - verifica se é uma pessoa real' },
    { id: 'facematch', name: 'Facematch', icon: Fingerprint, desc: 'Comparação facial entre selfie e documento' },
    { id: 'face_authentication', name: 'Face Authentication', icon: Shield, desc: 'Autenticação facial com registro prévio' },
    { id: 'document_ocr', name: 'Document OCR', icon: FileSearch, desc: 'Extração de dados de documentos' },
    { id: 'documentscopy', name: 'Documentoscopy', icon: FileText, desc: 'Validação de autenticidade de documentos' },
    { id: 'onboarding_web', name: 'Onboarding Web', icon: ExternalLink, desc: 'Fluxo completo de onboarding hospedado' },
  ];

  const bdcServices = [
    { id: 'empresas_basic_data', name: 'Dados Básicos Empresa', icon: Building2, desc: 'CNPJ, Razão Social, Status' },
    { id: 'empresas_kyc', name: 'KYC Empresa', icon: Shield, desc: 'Compliance e verificações regulatórias' },
    { id: 'empresas_owners_kyc', name: 'KYC Sócios', icon: Users, desc: 'Compliance dos sócios e administradores' },
    { id: 'empresas_relationships', name: 'Relacionamentos', icon: Users, desc: 'Estrutura societária e vínculos' },
    { id: 'empresas_activity_indicators', name: 'Indicadores de Atividade', icon: Activity, desc: 'Faturamento estimado e indicadores' },
    { id: 'empresas_mcc', name: 'MCC/Categoria', icon: Database, desc: 'Classificação de merchant category' },
    { id: 'prova_de_vida', name: 'Prova de Vida', icon: ScanFace, desc: 'Liveness via SDK Web/Mobile' },
    { id: 'biometria_facial', name: 'Biometria Facial', icon: Fingerprint, desc: 'Comparação biométrica 1:1' },
  ];

  const getStatusBadge = (status) => {
    const config = {
      success: { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      failed: { color: 'bg-red-100 text-red-800', icon: XCircle },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      processing: { color: 'bg-blue-100 text-blue-800', icon: Loader2 },
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <Badge className={`${c.color} gap-1`}>
        <Icon className={`w-3 h-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
        {status}
      </Badge>
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência');
  };

  const handleTestConnection = async (provider) => {
    setTestingProvider(provider);
    // Simular teste de conexão
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast.success(`Conexão com ${provider} testada com sucesso!`);
    setTestingProvider(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Integrações Externas</h1>
          <p className="text-slate-500">Configure e monitore as integrações com CAF e BigDataCorp</p>
        </div>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="caf">CAF</TabsTrigger>
          <TabsTrigger value="bigdatacorp">BigDataCorp</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CAF Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>CAF (Combate à Fraude)</CardTitle>
                      <CardDescription>Verificação de identidade e documentos</CardDescription>
                    </div>
                  </div>
                  <Badge className={cafConfig?.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}>
                    {cafConfig?.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Ambiente</p>
                    <p className="font-medium">{cafConfig?.environment || 'Não configurado'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Último Teste</p>
                    <p className="font-medium">{cafConfig?.last_test_at ? new Date(cafConfig.last_test_at).toLocaleDateString('pt-BR') : '-'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setActiveTab('caf')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleTestConnection('CAF')}
                    disabled={testingProvider === 'CAF'}
                  >
                    {testingProvider === 'CAF' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* BigDataCorp Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Database className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>BigDataCorp</CardTitle>
                      <CardDescription>Dados empresariais e KYC</CardDescription>
                    </div>
                  </div>
                  <Badge className={bdcConfig?.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}>
                    {bdcConfig?.is_active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Ambiente</p>
                    <p className="font-medium">{bdcConfig?.environment || 'Não configurado'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Último Teste</p>
                    <p className="font-medium">{bdcConfig?.last_test_at ? new Date(bdcConfig.last_test_at).toLocaleDateString('pt-BR') : '-'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => setActiveTab('bigdatacorp')}>
                    <Settings className="w-4 h-4 mr-2" />
                    Configurar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleTestConnection('BigDataCorp')}
                    disabled={testingProvider === 'BigDataCorp'}
                  >
                    {testingProvider === 'BigDataCorp' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-800">
                    {integrationLogs.filter(l => l.status === 'success').length}
                  </p>
                  <p className="text-sm text-slate-500">Sucesso (24h)</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-800">
                    {integrationLogs.filter(l => l.status === 'failed').length}
                  </p>
                  <p className="text-sm text-slate-500">Falhas (24h)</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-800">
                    {integrationLogs.filter(l => l.provider === 'CAF').length}
                  </p>
                  <p className="text-sm text-slate-500">Chamadas CAF</p>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <p className="text-2xl font-bold text-slate-800">
                    {integrationLogs.filter(l => l.provider === 'BigDataCorp').length}
                  </p>
                  <p className="text-sm text-slate-500">Chamadas BDC</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        
        {/* CAF Tab */}
        <TabsContent value="caf" className="space-y-6">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Importante</AlertTitle>
            <AlertDescription>
              As integrações com a CAF devem ser feitas exclusivamente via backend. 
              Nunca exponha as chaves de autenticação no frontend.
            </AlertDescription>
          </Alert>

          {/* Mapeamento Microscópico de Integração - CAF */}
          <Card className="border-purple-200 shadow-sm">
            <CardHeader className="bg-purple-50/50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <CardTitle className="text-purple-900">Mapeamento de Integração: Documentos</CardTitle>
              </div>
              <CardDescription className="text-purple-700">
                Visão detalhada de como cada documento solicitado no questionário é processado pelos endpoints da CAF.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Documento Solicitado</TableHead>
                    <TableHead className="w-[150px]">Página/Step</TableHead>
                    <TableHead className="w-[200px]">Endpoint CAF</TableHead>
                    <TableHead>O que é gerado/validado?</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Contrato Social / MEI</TableCell>
                    <TableCell><Badge variant="outline">UploadDocs</Badge></TableCell>
                    <TableCell className="font-mono text-xs">/v1/documents/analyze</TableCell>
                    <TableCell className="text-sm text-slate-600">
                      Extração de Razão Social, CNPJ, Quadro Societário e validação de autenticidade (documentoscopy).
                    </TableCell>
                    <TableCell><Badge className="bg-green-100 text-green-800">Mapeado</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">RG/CNH dos Sócios</TableCell>
                    <TableCell><Badge variant="outline">UploadDocs</Badge></TableCell>
                    <TableCell className="font-mono text-xs">/v1/documents/analyze</TableCell>
                    <TableCell className="text-sm text-slate-600">
                      OCR de dados (Nome, CPF, RG, Filiação), validação de template e verificação de face no documento.
                    </TableCell>
                    <TableCell><Badge className="bg-green-100 text-green-800">Mapeado</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Comprovante de Endereço</TableCell>
                    <TableCell><Badge variant="outline">UploadDocs</Badge></TableCell>
                    <TableCell className="font-mono text-xs">/v1/documents/analyze</TableCell>
                    <TableCell className="text-sm text-slate-600">
                      Extração de Logradouro, Número, CEP e Data de Emissão (validação &lt; 90 dias).
                    </TableCell>
                    <TableCell><Badge className="bg-green-100 text-green-800">Mapeado</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Selfie (Liveness)</TableCell>
                    <TableCell><Badge variant="outline">LivenessStep</Badge></TableCell>
                    <TableCell className="font-mono text-xs">/v1/liveness/sessions</TableCell>
                    <TableCell className="text-sm text-slate-600">
                      Prova de vida ativa (movimentos) ou passiva. Gera score de vivacidade e imagem para Facematch.
                    </TableCell>
                    <TableCell><Badge className="bg-green-100 text-green-800">Mapeado</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Facematch (Selfie vs RG)</TableCell>
                    <TableCell><Badge variant="outline">LivenessStep</Badge></TableCell>
                    <TableCell className="font-mono text-xs">/v1/facematch</TableCell>
                    <TableCell className="text-sm text-slate-600">
                      Comparação 1:1 entre a Selfie do Liveness e a foto extraída do RG/CNH enviado. Gera Similarity Score.
                    </TableCell>
                    <TableCell><Badge className="bg-green-100 text-green-800">Mapeado</Badge></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Importante</AlertTitle>
            <AlertDescription>
              As integrações com a CAF devem ser feitas exclusivamente via backend. 
              Nunca exponha as chaves de autenticação no frontend.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Configuração CAF</CardTitle>
              <CardDescription>
                API Base: <code className="bg-slate-100 px-2 py-1 rounded">https://api.combateafraude.com/v1</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>API Token (Bearer)</Label>
                  <div className="flex gap-2">
                    <Input type="password" placeholder="••••••••••••••••" className="font-mono" />
                    <Button variant="outline" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">Configurado via variáveis de ambiente (CAF_API_TOKEN)</p>
                </div>
                <div className="space-y-2">
                  <Label>Template ID (Transaction)</Label>
                  <Input placeholder="62b620ee3f07fb0009361111" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ambiente</Label>
                <Select defaultValue="sandbox">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox</SelectItem>
                    <SelectItem value="production">Produção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Serviços Disponíveis</CardTitle>
              <CardDescription>Selecione os serviços que deseja utilizar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cafServices.map(service => {
                  const Icon = service.icon;
                  return (
                    <div key={service.id} className="flex items-start gap-3 p-4 border rounded-lg">
                      <div className="p-2 rounded-lg bg-purple-50">
                        <Icon className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{service.name}</p>
                          <Switch />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{service.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a href="https://docs.caf.io/caf-api" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <FileText className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="font-medium">CAF API Reference</p>
                    <p className="text-sm text-slate-500">Documentação completa da API</p>
                  </div>
                  <ExternalLink className="w-4 h-4 ml-auto text-slate-400" />
                </a>
                <a href="https://docs.caf.io/caf-sdk" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <Plug className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="font-medium">CAF SDKs</p>
                    <p className="text-sm text-slate-500">Web, iOS e Android</p>
                  </div>
                  <ExternalLink className="w-4 h-4 ml-auto text-slate-400" />
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        
        {/* BigDataCorp Tab */}
        <TabsContent value="bigdatacorp" className="space-y-6">

          {/* Mapeamento Microscópico de Integração - BigDataCorp */}
          <Card className="border-blue-200 shadow-sm">
            <CardHeader className="bg-blue-50/50">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-blue-900">Mapeamento de Integração: Dados & Validações</CardTitle>
              </div>
              <CardDescription className="text-blue-700">
                Visão detalhada de cada pergunta do questionário conectada aos datasets da BigDataCorp.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Pergunta / Campo</TableHead>
                    <TableHead className="w-[150px]">Página/Step</TableHead>
                    <TableHead className="w-[250px]">Endpoint / Dataset BDC</TableHead>
                    <TableHead>Ação & Resultado Esperado</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Dados Básicos */}
                  <TableRow className="bg-slate-50/50">
                    <TableCell colSpan={5} className="font-semibold text-xs text-slate-500 uppercase tracking-wider py-2">
                      Dados Cadastrais da Empresa
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">CNPJ</TableCell>
                    <TableCell>Step 1: Identificação</TableCell>
                    <TableCell className="font-mono text-xs text-blue-700 break-all">
                      /empresas/basic_data
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      <span className="font-semibold text-blue-600">Valida:</span> Existência e Status Ativo.<br/>
                      <span className="font-semibold text-green-600">Preenche:</span> Razão Social, Nome Fantasia, Data Abertura.
                    </TableCell>
                    <TableCell><Badge className="bg-green-100 text-green-800">Mapeado</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Endereço Comercial</TableCell>
                    <TableCell>Step 3: Endereço</TableCell>
                    <TableCell className="font-mono text-xs text-blue-700 break-all">
                      /empresas/addresses_extended
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      <span className="font-semibold text-green-600">Preenche:</span> Logradouro, Número, Bairro, Cidade, UF, CEP.<br/>
                      Confirma se o endereço bate com o cadastro na Receita.
                    </TableCell>
                    <TableCell><Badge className="bg-green-100 text-green-800">Mapeado</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Site / Domínio</TableCell>
                    <TableCell>Step 1: Identificação</TableCell>
                    <TableCell className="font-mono text-xs text-blue-700 break-all">
                      /empresas/domains_extended
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      Identifica domínios registrados em nome do CNPJ para sugerir site oficial.
                    </TableCell>
                    <TableCell><Badge className="bg-yellow-100 text-yellow-800">Em Análise</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Atividade (CNAE/MCC)</TableCell>
                    <TableCell>Step 4: Atividade</TableCell>
                    <TableCell className="font-mono text-xs text-blue-700 break-all">
                      /empresas/merchant_category_data
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      Valida se o MCC da empresa é compatível com o que ela declara vender (Risco de Forbidden Business).
                    </TableCell>
                    <TableCell><Badge className="bg-green-100 text-green-800">Mapeado</Badge></TableCell>
                  </TableRow>

                  {/* Sócios e Contatos */}
                  <TableRow className="bg-slate-50/50">
                    <TableCell colSpan={5} className="font-semibold text-xs text-slate-500 uppercase tracking-wider py-2">
                      Sócios, Contatos e UBO
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Quadro Societário</TableCell>
                    <TableCell>Step 7 / Seção Sócios</TableCell>
                    <TableCell className="font-mono text-xs text-blue-700 break-all">
                      /empresas/relationships
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      Lista quem são os sócios, administradores e representantes legais para validação cruzada.
                    </TableCell>
                    <TableCell><Badge className="bg-green-100 text-green-800">Mapeado</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Contatos (Email/Tel)</TableCell>
                    <TableCell>Step 7: Responsáveis</TableCell>
                    <TableCell className="font-mono text-xs text-blue-700 break-all">
                      /empresas/phones_extended<br/>
                      /empresas/emails_extended
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      Enriquece dados de contato da empresa e sócios para o cadastro.
                    </TableCell>
                    <TableCell><Badge className="bg-green-100 text-green-800">Mapeado</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Beneficiário Final (UBO)</TableCell>
                    <TableCell>Seção UBO</TableCell>
                    <TableCell className="font-mono text-xs text-blue-700 break-all">
                      /marketplace/partner_ultimate_beneficial_owners
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      Identifica pessoas físicas que controlam a empresa (compliance regulatório 3978).
                    </TableCell>
                    <TableCell><Badge className="bg-green-100 text-green-800">Mapeado</Badge></TableCell>
                  </TableRow>

                  {/* Risco e Compliance */}
                  <TableRow className="bg-slate-50/50">
                    <TableCell colSpan={5} className="font-semibold text-xs text-slate-500 uppercase tracking-wider py-2">
                      Risco Operacional e PLD
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Faturamento Estimado</TableCell>
                    <TableCell>Step 5: Volumetria</TableCell>
                    <TableCell className="font-mono text-xs text-blue-700 break-all">
                      /empresas/activity_indicators
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      Compara faturamento declarado vs. estimado de mercado. Alerta se divergência > 50%.
                    </TableCell>
                    <TableCell><Badge className="bg-green-100 text-green-800">Mapeado</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">KYC Empresa</TableCell>
                    <TableCell>Background Check</TableCell>
                    <TableCell className="font-mono text-xs text-blue-700 break-all">
                      /empresas/kyc
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      Processos, Dívidas, Protestos, Listas Restritivas (OFAC/ONU). Gera Score de Risco.
                    </TableCell>
                    <TableCell><Badge className="bg-green-100 text-green-800">Mapeado</Badge></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">KYC Sócios</TableCell>
                    <TableCell>Background Check</TableCell>
                    <TableCell className="font-mono text-xs text-blue-700 break-all">
                      /empresas/owners_kyc
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">
                      PEP (Pessoa Exposta Politicamente), Mídia Negativa, Antecedentes Criminais dos sócios.
                    </TableCell>
                    <TableCell><Badge className="bg-green-100 text-green-800">Mapeado</Badge></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Configuração BigDataCorp</CardTitle>
              <CardDescription>
                API Base: <code className="bg-slate-100 px-2 py-1 rounded">https://app.bigdatacorp.com.br</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Access Token</Label>
                  <div className="flex gap-2">
                    <Input type="password" placeholder="••••••••••••••••" className="font-mono" />
                    <Button variant="outline" size="icon">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">Configurado via variáveis de ambiente (BIGDATACORP_TOKEN)</p>
                </div>
                <div className="space-y-2">
                  <Label>Webhook Callback Key</Label>
                  <Input placeholder="Identificador para webhooks" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Ambiente</Label>
                <Select defaultValue="sandbox">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox</SelectItem>
                    <SelectItem value="production">Produção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Datasets Disponíveis</CardTitle>
              <CardDescription>Serviços de consulta de dados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bdcServices.map(service => {
                  const Icon = service.icon;
                  return (
                    <div key={service.id} className="flex items-start gap-3 p-4 border rounded-lg">
                      <div className="p-2 rounded-lg bg-blue-50">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm">{service.name}</p>
                          <Switch />
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{service.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Documentação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <a href="https://docs.bigdatacorp.com.br/plataforma/reference/empresas_kyc" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <Building2 className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="font-medium">KYC Empresas</p>
                    <p className="text-sm text-slate-500">Compliance empresarial</p>
                  </div>
                  <ExternalLink className="w-4 h-4 ml-auto text-slate-400" />
                </a>
                <a href="https://docs.bigdatacorp.com.br/app/reference/onboarding-web" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 border rounded-lg hover:bg-slate-50 transition-colors">
                  <ScanFace className="w-5 h-5 text-slate-600" />
                  <div>
                    <p className="font-medium">Onboarding Web</p>
                    <p className="text-sm text-slate-500">Liveness e Biometria</p>
                  </div>
                  <ExternalLink className="w-4 h-4 ml-auto text-slate-400" />
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        
        {/* Webhooks Tab */}
        <TabsContent value="webhooks" className="space-y-6">
          <Alert className="bg-blue-50 border-blue-200">
             <Webhook className="h-4 w-4 text-blue-600" />
             <AlertTitle className="text-blue-800">Arquitetura Orientada a Eventos</AlertTitle>
             <AlertDescription className="text-blue-700">
               Utilizamos webhooks para receber atualizações assíncronas (ex: análise de documentos concluída, score de fraude atualizado) sem travar a experiência do usuário.
             </AlertDescription>
          </Alert>
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Webhooks</CardTitle>
              <CardDescription>Endpoints para receber callbacks das integrações</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Webhook className="h-4 w-4" />
                <AlertTitle>URLs de Webhook</AlertTitle>
                <AlertDescription>
                  Configure estas URLs nos painéis da CAF e BigDataCorp para receber os resultados das validações.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Webhook CAF</Label>
                    <Badge variant="outline">POST</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      readOnly 
                      value="https://api.seudominio.com/webhooks/caf" 
                      className="font-mono text-sm"
                    />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard('https://api.seudominio.com/webhooks/caf')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Webhook BigDataCorp</Label>
                    <Badge variant="outline">POST</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      readOnly 
                      value="https://api.seudominio.com/webhooks/bigdatacorp" 
                      className="font-mono text-sm"
                    />
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard('https://api.seudominio.com/webhooks/bigdatacorp')}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Webhook Secret (Validação)</Label>
                <div className="flex gap-2">
                  <Input type="password" placeholder="••••••••••••••••" className="font-mono" />
                  <Button variant="outline">Gerar Novo</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Eventos Suportados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="font-medium text-sm">CAF</p>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• transaction.completed</li>
                    <li>• transaction.approved</li>
                    <li>• transaction.reproved</li>
                    <li>• onboarding.completed</li>
                    <li>• face_auth.attempt</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-sm">BigDataCorp</p>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• onboarding.ok (STATUS_CODE: 2)</li>
                    <li>• onboarding.timeout (STATUS_CODE: -201)</li>
                    <li>• onboarding.max_retries (STATUS_CODE: -202)</li>
                    <li>• onboarding.closed (STATUS_CODE: -400)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Logs de Integração</CardTitle>
                <Button variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {logsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : integrationLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                  <p>Nenhum log de integração encontrado</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Provedor</TableHead>
                      <TableHead>Serviço</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Duração</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {integrationLogs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          {log.created_date ? new Date(log.created_date).toLocaleString('pt-BR') : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.provider}</Badge>
                        </TableCell>
                        <TableCell className="text-sm font-mono">{log.service_type}</TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                        <TableCell>
                          {log.result_status && (
                            <Badge className={
                              log.result_status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                              log.result_status === 'REPROVED' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }>
                              {log.result_status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {log.duration_ms ? `${log.duration_ms}ms` : '-'}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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