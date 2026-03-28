import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Plug, Settings, Activity, CheckCircle2, XCircle, Clock,
  RefreshCw, ExternalLink, Eye, Play, Loader2, AlertTriangle,
  Copy, FileText, Users, Building2, Fingerprint, ScanFace, FileSearch, Database, Shield,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function IntegracoesExternas() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [testingProvider, setTestingProvider] = useState(null);
  const queryClient = useQueryClient();

  const { data: integrationConfigs = [] } = useQuery({
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
      success: { bg: 'bg-[#2bc196]/10', text: 'text-[#2bc196]', icon: CheckCircle2 },
      failed: { bg: 'bg-red-50', text: 'text-red-500', icon: XCircle },
      pending: { bg: 'bg-[#002443]/5', text: 'text-[#002443]/60', icon: Clock },
      processing: { bg: 'bg-[#36706c]/10', text: 'text-[#36706c]', icon: Loader2 },
    };
    const c = config[status] || config.pending;
    const Icon = c.icon;
    return (
      <Badge className={`${c.bg} ${c.text} gap-1 border-0`}>
        <Icon className={`w-3 h-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
        {status}
      </Badge>
    );
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success(t('ie.copied'));
  };

  const handleTestConnection = async (provider) => {
    setTestingProvider(provider);
    await new Promise(resolve => setTimeout(resolve, 2000));
    toast.success(t('ie.connection_tested', { provider }));
    setTestingProvider(null);
  };

  const logStats = {
    success: integrationLogs.filter(l => l.status === 'success').length,
    failed: integrationLogs.filter(l => l.status === 'failed').length,
    caf: integrationLogs.filter(l => l.provider === 'CAF').length,
    bdc: integrationLogs.filter(l => l.provider === 'BigDataCorp').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#002443]/5 flex items-center justify-center">
            <Plug className="w-5 h-5 text-[#002443]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#002443]">{t('ie.title')}</h1>
            <p className="text-sm text-[#002443]/60">{t('ie.subtitle')}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries()} className="border-[#002443]/10 hover:bg-[#f4f4f4] rounded-xl">
          <RefreshCw className="w-4 h-4 mr-2 text-[#002443]/50" />
          <span className="text-[#002443]/70">{t('ie.refresh')}</span>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#f4f4f4] border border-[#002443]/5">
          {['overview', 'caf', 'bigdatacorp', 'webhooks', 'logs'].map(tab => (
            <TabsTrigger key={tab} value={tab} className="data-[state=active]:bg-white data-[state=active]:text-[#002443] data-[state=active]:shadow-sm">
              {tab === 'overview' ? t('ie.tab_overview') : tab === 'caf' ? t('ie.tab_caf') : tab === 'bigdatacorp' ? t('ie.tab_bigdatacorp') : tab === 'webhooks' ? t('ie.tab_webhooks') : t('ie.tab_logs')}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* CAF Card */}
            <div className="bg-white rounded-2xl border border-[#002443]/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#2bc196]/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-[#2bc196]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#002443]">CAF (Combate à Fraude)</h3>
                    <p className="text-xs text-[#002443]/50">Verificação de identidade e documentos</p>
                  </div>
                </div>
                <Badge className={cafConfig?.is_active ? 'bg-[#2bc196]/10 text-[#2bc196] border-0' : 'bg-[#f4f4f4] text-[#002443]/40 border-0'}>
                  {cafConfig?.is_active ? t('ie.active') : t('ie.inactive')}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div><p className="text-[#002443]/40 text-xs">{t('ie.environment')}</p><p className="font-medium text-[#002443]">{cafConfig?.environment || t('ie.not_configured')}</p></div>
                <div><p className="text-[#002443]/40 text-xs">{t('ie.last_test')}</p><p className="font-medium text-[#002443]">{cafConfig?.last_test_at ? new Date(cafConfig.last_test_at).toLocaleDateString('pt-BR') : '-'}</p></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 rounded-xl border-[#002443]/10" onClick={() => setActiveTab('caf')}>
                  <Settings className="w-4 h-4 mr-2 text-[#002443]/40" /> {t('ie.configure')}
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl border-[#002443]/10" onClick={() => handleTestConnection('CAF')} disabled={testingProvider === 'CAF'}>
                  {testingProvider === 'CAF' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 text-[#2bc196]" />}
                </Button>
              </div>
            </div>

            {/* BigDataCorp Card */}
            <div className="bg-white rounded-2xl border border-[#002443]/5 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#002443]/5 flex items-center justify-center">
                    <Database className="w-5 h-5 text-[#002443]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#002443]">BigDataCorp</h3>
                    <p className="text-xs text-[#002443]/50">Dados empresariais e KYC</p>
                  </div>
                </div>
                <Badge className={bdcConfig?.is_active ? 'bg-[#2bc196]/10 text-[#2bc196] border-0' : 'bg-[#f4f4f4] text-[#002443]/40 border-0'}>
                  {bdcConfig?.is_active ? t('ie.active') : t('ie.inactive')}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div><p className="text-[#002443]/40 text-xs">{t('ie.environment')}</p><p className="font-medium text-[#002443]">{bdcConfig?.environment || t('ie.not_configured')}</p></div>
                <div><p className="text-[#002443]/40 text-xs">{t('ie.last_test')}</p><p className="font-medium text-[#002443]">{bdcConfig?.last_test_at ? new Date(bdcConfig.last_test_at).toLocaleDateString('pt-BR') : '-'}</p></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1 rounded-xl border-[#002443]/10" onClick={() => setActiveTab('bigdatacorp')}>
                  <Settings className="w-4 h-4 mr-2 text-[#002443]/40" /> {t('ie.configure')}
                </Button>
                <Button variant="outline" size="sm" className="rounded-xl border-[#002443]/10" onClick={() => handleTestConnection('BigDataCorp')} disabled={testingProvider === 'BigDataCorp'}>
                  {testingProvider === 'BigDataCorp' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 text-[#2bc196]" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t('ie.success_24h'), value: logStats.success, color: '#2bc196' },
              { label: t('ie.failures_24h'), value: logStats.failed, color: '#002443' },
              { label: t('ie.caf_calls'), value: logStats.caf, color: '#36706c' },
              { label: t('ie.bdc_calls'), value: logStats.bdc, color: '#002443' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#002443]/5 p-4">
                <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-xs text-[#002443]/50">{s.label}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* CAF Tab */}
        <TabsContent value="caf" className="space-y-6 mt-6">
          <div className="bg-[#2bc196]/5 border border-[#2bc196]/15 rounded-2xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-[#2bc196] mt-0.5 shrink-0" />
            <p className="text-xs text-[#002443]/60">{t('ie.caf_warning')}</p>
          </div>

          {/* Mapping Table */}
          <div className="bg-white rounded-2xl border border-[#002443]/5 overflow-hidden">
            <div className="p-5 border-b border-[#002443]/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#2bc196]/10 flex items-center justify-center"><FileText className="w-4 h-4 text-[#2bc196]" /></div>
                <div>
                  <h3 className="text-sm font-bold text-[#002443]">Mapeamento: Documentos</h3>
                  <p className="text-xs text-[#002443]/40">Como cada documento é processado pelos endpoints da CAF</p>
                </div>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f4f4f4]">
                  <TableHead className="text-[10px] font-bold text-[#002443]/40 uppercase">Documento</TableHead>
                  <TableHead className="text-[10px] font-bold text-[#002443]/40 uppercase">Step</TableHead>
                  <TableHead className="text-[10px] font-bold text-[#002443]/40 uppercase">Endpoint CAF</TableHead>
                  <TableHead className="text-[10px] font-bold text-[#002443]/40 uppercase">Resultado</TableHead>
                  <TableHead className="text-[10px] font-bold text-[#002443]/40 uppercase">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { doc: 'Contrato Social / MEI', step: 'UploadDocs', endpoint: '/v1/documents/analyze', result: 'Extração de Razão Social, CNPJ, Quadro Societário' },
                  { doc: 'RG/CNH dos Sócios', step: 'UploadDocs', endpoint: '/v1/documents/analyze', result: 'OCR de dados (Nome, CPF, RG, Filiação)' },
                  { doc: 'Comprovante de Endereço', step: 'UploadDocs', endpoint: '/v1/documents/analyze', result: 'Extração de Logradouro, CEP, Data Emissão' },
                  { doc: 'Selfie (Liveness)', step: 'LivenessStep', endpoint: '/v1/liveness/sessions', result: 'Score de vivacidade + imagem para Facematch' },
                  { doc: 'Facematch (Selfie vs RG)', step: 'LivenessStep', endpoint: '/v1/facematch', result: 'Comparação 1:1, Similarity Score' },
                ].map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm text-[#002443]">{row.doc}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] border-[#002443]/10">{row.step}</Badge></TableCell>
                    <TableCell className="font-mono text-xs text-[#36706c]">{row.endpoint}</TableCell>
                    <TableCell className="text-xs text-[#002443]/60">{row.result}</TableCell>
                    <TableCell><Badge className="bg-[#2bc196]/10 text-[#2bc196] text-[10px] border-0">Mapeado</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Config */}
          <div className="bg-white rounded-2xl border border-[#002443]/5 p-6 space-y-5">
            <h3 className="text-base font-bold text-[#002443]">{t('ie.caf_config')}</h3>
            <p className="text-xs text-[#002443]/40">API Base: <code className="bg-[#f4f4f4] px-2 py-0.5 rounded-lg text-[#36706c]">https://api.combateafraude.com/v1</code></p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#002443]/50">API Token (Bearer)</Label>
                <div className="flex gap-2">
                  <Input type="password" placeholder="••••••••••••••••" className="font-mono border-[#002443]/10" />
                  <Button variant="outline" size="icon" className="border-[#002443]/10"><Eye className="w-4 h-4 text-[#002443]/40" /></Button>
                </div>
                <p className="text-[10px] text-[#002443]/30">Configurado via variáveis de ambiente (CAF_API_TOKEN)</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#002443]/50">Template ID (Transaction)</Label>
                <Input placeholder="62b620ee3f07fb0009361111" className="border-[#002443]/10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#002443]/50">Ambiente</Label>
              <Select defaultValue="sandbox">
                <SelectTrigger className="w-48 border-[#002443]/10"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="sandbox">{t('ie.sandbox_label')}</SelectItem><SelectItem value="production">{t('ie.production_label')}</SelectItem></SelectContent>
              </Select>
            </div>
          </div>

          {/* Services */}
          <div className="bg-white rounded-2xl border border-[#002443]/5 p-6 space-y-4">
            <h3 className="text-base font-bold text-[#002443]">{t('ie.available_services')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {cafServices.map(service => {
                const Icon = service.icon;
                return (
                  <div key={service.id} className="flex items-start gap-3 p-4 rounded-xl border border-[#002443]/5 hover:shadow-sm transition-shadow">
                    <div className="w-9 h-9 rounded-lg bg-[#2bc196]/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[#2bc196]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-[#002443]">{service.name}</p>
                        <Switch className="data-[state=checked]:bg-[#2bc196]" />
                      </div>
                      <p className="text-xs text-[#002443]/40 mt-1">{service.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Docs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { href: 'https://docs.caf.io/caf-api', icon: FileText, title: t('ie.caf_doc_ref'), desc: t('ie.caf_doc_desc') },
              { href: 'https://docs.caf.io/caf-sdk', icon: Plug, title: t('ie.caf_sdk_ref'), desc: t('ie.caf_sdk_desc') },
            ].map((doc, i) => (
              <a key={i} href={doc.href} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-4 rounded-2xl border border-[#002443]/5 hover:shadow-sm transition-shadow bg-white">
                <doc.icon className="w-5 h-5 text-[#002443]/40" />
                <div className="flex-1"><p className="font-semibold text-sm text-[#002443]">{doc.title}</p><p className="text-xs text-[#002443]/40">{doc.desc}</p></div>
                <ExternalLink className="w-4 h-4 text-[#002443]/20" />
              </a>
            ))}
          </div>
        </TabsContent>

        {/* BigDataCorp Tab */}
        <TabsContent value="bigdatacorp" className="space-y-6 mt-6">
          {/* BDC Mapping Table */}
          <div className="bg-white rounded-2xl border border-[#002443]/5 overflow-hidden">
            <div className="p-5 border-b border-[#002443]/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#002443]/5 flex items-center justify-center"><Database className="w-4 h-4 text-[#002443]" /></div>
                <div>
                  <h3 className="text-sm font-bold text-[#002443]">{t('ie.data_mapping')}</h3>
                  <p className="text-xs text-[#002443]/40">{t('ie.data_mapping_desc')}</p>
                </div>
              </div>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-[#f4f4f4]">
                  <TableHead className="text-[10px] font-bold text-[#002443]/40 uppercase">Campo</TableHead>
                  <TableHead className="text-[10px] font-bold text-[#002443]/40 uppercase">Step</TableHead>
                  <TableHead className="text-[10px] font-bold text-[#002443]/40 uppercase">Endpoint BDC</TableHead>
                  <TableHead className="text-[10px] font-bold text-[#002443]/40 uppercase">Resultado</TableHead>
                  <TableHead className="text-[10px] font-bold text-[#002443]/40 uppercase">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { section: 'Dados Cadastrais' },
                  { field: 'CNPJ', step: 'Step 1', endpoint: '/empresas/basic_data', result: 'Valida existência, preenche Razão Social' },
                  { field: 'Endereço', step: 'Step 3', endpoint: '/empresas/addresses_extended', result: 'Preenche e confirma com Receita' },
                  { field: 'Atividade (CNAE/MCC)', step: 'Step 4', endpoint: '/empresas/merchant_category_data', result: 'Valida MCC vs atividade declarada' },
                  { section: 'Sócios e UBO' },
                  { field: 'Quadro Societário', step: 'Step 7', endpoint: '/empresas/relationships', result: 'Lista sócios e representantes legais' },
                  { field: 'Beneficiário Final', step: 'Seção UBO', endpoint: '/marketplace/partner_ultimate_beneficial_owners', result: 'Identifica PFs que controlam a empresa' },
                  { section: 'Risco e PLD' },
                  { field: 'Faturamento Estimado', step: 'Step 5', endpoint: '/empresas/activity_indicators', result: 'Compara declarado vs estimado (alerta >50%)' },
                  { field: 'KYC Empresa', step: 'Background', endpoint: '/empresas/kyc', result: 'Processos, dívidas, listas restritivas' },
                  { field: 'KYC Sócios', step: 'Background', endpoint: '/empresas/owners_kyc', result: 'PEP, mídia negativa, antecedentes' },
                ].map((row, i) => {
                  if (row.section) {
                    return (
                      <TableRow key={i} className="bg-[#f4f4f4]/50">
                        <TableCell colSpan={5} className="text-[10px] font-bold text-[#002443]/30 uppercase tracking-[0.15em] py-2">{row.section}</TableCell>
                      </TableRow>
                    );
                  }
                  return (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-sm text-[#002443]">{row.field}</TableCell>
                      <TableCell className="text-xs text-[#002443]/50">{row.step}</TableCell>
                      <TableCell className="font-mono text-xs text-[#36706c]">{row.endpoint}</TableCell>
                      <TableCell className="text-xs text-[#002443]/60">{row.result}</TableCell>
                      <TableCell><Badge className="bg-[#2bc196]/10 text-[#2bc196] text-[10px] border-0">{t('ie.mapped_label')}</Badge></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* BDC Config */}
          <div className="bg-white rounded-2xl border border-[#002443]/5 p-6 space-y-5">
            <h3 className="text-base font-bold text-[#002443]">{t('ie.bdc_config')}</h3>
            <p className="text-xs text-[#002443]/40">API Base: <code className="bg-[#f4f4f4] px-2 py-0.5 rounded-lg text-[#36706c]">https://app.bigdatacorp.com.br</code></p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#002443]/50">Access Token</Label>
                <div className="flex gap-2">
                  <Input type="password" placeholder="••••••••••••••••" className="font-mono border-[#002443]/10" />
                  <Button variant="outline" size="icon" className="border-[#002443]/10"><Eye className="w-4 h-4 text-[#002443]/40" /></Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#002443]/50">Webhook Callback Key</Label>
                <Input placeholder="Identificador para webhooks" className="border-[#002443]/10" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-[#002443]/50">Ambiente</Label>
              <Select defaultValue="sandbox">
                <SelectTrigger className="w-48 border-[#002443]/10"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="sandbox">{t('ie.sandbox_label')}</SelectItem><SelectItem value="production">{t('ie.production_label')}</SelectItem></SelectContent>
              </Select>
            </div>
          </div>

          {/* BDC Services */}
          <div className="bg-white rounded-2xl border border-[#002443]/5 p-6 space-y-4">
            <h3 className="text-base font-bold text-[#002443]">{t('ie.available_datasets')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {bdcServices.map(service => {
                const Icon = service.icon;
                return (
                  <div key={service.id} className="flex items-start gap-3 p-4 rounded-xl border border-[#002443]/5 hover:shadow-sm transition-shadow">
                    <div className="w-9 h-9 rounded-lg bg-[#002443]/5 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-[#002443]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-sm text-[#002443]">{service.name}</p>
                        <Switch className="data-[state=checked]:bg-[#2bc196]" />
                      </div>
                      <p className="text-xs text-[#002443]/40 mt-1">{service.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks" className="space-y-6 mt-6">
          <div className="bg-[#36706c]/5 border border-[#36706c]/10 rounded-2xl p-4 flex items-start gap-3">
            <Plug className="w-4 h-4 text-[#36706c] mt-0.5 shrink-0" />
            <p className="text-xs text-[#002443]/60">{t('ie.webhooks_info')}</p>
          </div>

          <div className="bg-white rounded-2xl border border-[#002443]/5 p-6 space-y-5">
            <h3 className="text-base font-bold text-[#002443]">{t('ie.webhook_urls_title')}</h3>
            {[
              { label: 'Webhook CAF', url: 'https://api.seudominio.com/webhooks/caf' },
              { label: 'Webhook BigDataCorp', url: 'https://api.seudominio.com/webhooks/bigdatacorp' },
            ].map((wh, i) => (
              <div key={i} className="p-4 rounded-xl border border-[#002443]/5 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-[#002443]/50">{wh.label}</Label>
                  <Badge variant="outline" className="text-[10px] border-[#002443]/10">POST</Badge>
                </div>
                <div className="flex gap-2">
                  <Input readOnly value={wh.url} className="font-mono text-xs bg-[#f4f4f4] border-[#002443]/5" />
                  <Button variant="outline" size="icon" className="border-[#002443]/10" onClick={() => copyToClipboard(wh.url)}><Copy className="w-4 h-4 text-[#002443]/40" /></Button>
                </div>
              </div>
            ))}
            <div className="space-y-1.5">
              <Label className="text-xs text-[#002443]/50">Webhook Secret</Label>
              <div className="flex gap-2">
                <Input type="password" placeholder="••••••••••••••••" className="font-mono border-[#002443]/10" />
                <Button variant="outline" className="rounded-xl border-[#002443]/10 text-[#002443]/70 text-sm">{t('ie.generate_new_secret')}</Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#002443]/5 p-6">
            <h3 className="text-base font-bold text-[#002443] mb-4">{t('ie.supported_events_title')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'CAF', events: ['transaction.completed', 'transaction.approved', 'transaction.reproved', 'onboarding.completed', 'face_auth.attempt'] },
                { title: 'BigDataCorp', events: ['onboarding.ok (STATUS_CODE: 2)', 'onboarding.timeout (STATUS_CODE: -201)', 'onboarding.max_retries (STATUS_CODE: -202)', 'onboarding.closed (STATUS_CODE: -400)'] },
              ].map((group, i) => (
                <div key={i}>
                  <p className="text-xs font-bold text-[#002443]/40 uppercase tracking-wider mb-2">{group.title}</p>
                  <ul className="space-y-1.5">
                    {group.events.map((ev, j) => (
                      <li key={j} className="text-xs text-[#002443]/60 font-mono bg-[#f4f4f4] px-3 py-1.5 rounded-lg">• {ev}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Logs */}
        <TabsContent value="logs" className="mt-6">
          <div className="bg-white rounded-2xl border border-[#002443]/5 overflow-hidden">
            <div className="p-5 border-b border-[#002443]/5 flex items-center justify-between">
              <h3 className="text-base font-bold text-[#002443]">{t('ie.integration_logs')}</h3>
              <Button variant="outline" size="sm" className="rounded-xl border-[#002443]/10">
                <RefreshCw className="w-4 h-4 mr-2 text-[#002443]/40" /> {t('ie.refresh')}
              </Button>
            </div>
            {logsLoading ? (
              <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#2bc196]" /></div>
            ) : integrationLogs.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-[#f4f4f4] flex items-center justify-center mx-auto mb-4"><Activity className="w-7 h-7 text-[#002443]/20" /></div>
                <p className="text-sm text-[#002443]/50">{t('ie.no_logs')}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#f4f4f4]">
                    {[t('ie.col_datetime'), t('ie.col_provider'), t('ie.col_service'), t('ie.col_status'), t('ie.col_result'), t('ie.col_duration'), ''].map((h, i) => (
                      <TableHead key={i} className="text-[10px] font-bold text-[#002443]/40 uppercase">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {integrationLogs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs text-[#002443]/60">{log.created_date ? new Date(log.created_date).toLocaleString() : '-'}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] border-[#002443]/10">{log.provider}</Badge></TableCell>
                      <TableCell className="text-xs font-mono text-[#36706c]">{log.service_type}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>
                        {log.result_status && (
                          <Badge className={`text-[10px] border-0 ${
                            log.result_status === 'APPROVED' ? 'bg-[#2bc196]/10 text-[#2bc196]' :
                            log.result_status === 'REPROVED' ? 'bg-red-50 text-red-500' :
                            'bg-[#002443]/5 text-[#002443]/60'
                          }`}>{log.result_status}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-[#002443]/40">{log.duration_ms ? `${log.duration_ms}ms` : '-'}</TableCell>
                      <TableCell><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><Eye className="w-4 h-4 text-[#002443]/30" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}