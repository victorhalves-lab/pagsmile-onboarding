import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Settings, FileText, AlertTriangle, Save,
  CheckCircle2, XCircle, Info
} from 'lucide-react';

export default function AdminSettings() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
        <p className="text-slate-500">Configure as regras e parâmetros do sistema de compliance</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-white border border-slate-200">
          <TabsTrigger value="general" className="gap-2">
            <Settings className="w-4 h-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="w-4 h-4" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="risk" className="gap-2">
            <AlertTriangle className="w-4 h-4" />
            Regras de Risco
          </TabsTrigger>
        </TabsList>

        {/* Tab: Geral */}
        <TabsContent value="general">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-800">Configurações Gerais</h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                <div>
                  <Label className="font-medium">Notificações por E-mail</Label>
                  <p className="text-sm text-slate-500">Enviar e-mails automáticos sobre status do onboarding</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                <div>
                  <Label className="font-medium">Aprovação Automática</Label>
                  <p className="text-sm text-slate-500">Aprovar automaticamente casos com score acima do threshold</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                <div>
                  <Label className="font-medium">Rejeição Automática</Label>
                  <p className="text-sm text-slate-500">Rejeitar automaticamente casos com score abaixo do threshold</p>
                </div>
                <Switch />
              </div>
            </div>

            <Button className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90">
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </TabsContent>

        {/* Tab: Documentos */}
        <TabsContent value="documents">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-800">Configurações de Documentos</h2>
            
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Configure os tipos de documentos aceitos e suas regras de validação.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-slate-200">
                <Label className="font-medium">Tamanho Máximo de Arquivo</Label>
                <p className="text-sm text-slate-500 mb-3">Limite máximo em MB para upload de documentos</p>
                <Input type="number" defaultValue={10} className="w-32" />
              </div>

              <div className="p-4 rounded-lg border border-slate-200">
                <Label className="font-medium">Formatos Aceitos</Label>
                <p className="text-sm text-slate-500 mb-3">Extensões de arquivo permitidas</p>
                <div className="flex gap-2 flex-wrap">
                  {['PDF', 'JPG', 'JPEG', 'PNG'].map(format => (
                    <span key={format} className="px-3 py-1 bg-slate-100 rounded-full text-sm">
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <Button className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90">
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </TabsContent>

        {/* Tab: Regras de Risco */}
        <TabsContent value="risk">
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
            <h2 className="text-lg font-semibold text-slate-800">Regras de Risco e Scoring</h2>
            
            <div className="space-y-6">
              {/* Threshold de Aprovação */}
              <div className="p-4 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label className="font-medium">Threshold de Aprovação</Label>
                    <p className="text-sm text-slate-500">Score mínimo para aprovação automática</p>
                  </div>
                  <span className="text-2xl font-bold text-green-600">75</span>
                </div>
                <Slider defaultValue={[75]} max={100} step={1} className="w-full" />
                <div className="flex justify-between text-xs text-slate-400 mt-2">
                  <span>0</span>
                  <span>100</span>
                </div>
              </div>

              {/* Threshold de Revisão Manual */}
              <div className="p-4 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label className="font-medium">Threshold de Revisão Manual</Label>
                    <p className="text-sm text-slate-500">Score mínimo para enviar à revisão manual</p>
                  </div>
                  <span className="text-2xl font-bold text-orange-600">40</span>
                </div>
                <Slider defaultValue={[40]} max={100} step={1} className="w-full" />
                <div className="flex justify-between text-xs text-slate-400 mt-2">
                  <span>0</span>
                  <span>100</span>
                </div>
              </div>

              {/* Visualização das Faixas */}
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <Label className="font-medium mb-4 block">Faixas de Decisão</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <div className="flex-1 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-slate-600 w-32">≥ 75: Aprovado</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <div className="flex-1 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-sm text-slate-600 w-32">40-74: Manual</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-red-600" />
                    <div className="flex-1 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm text-slate-600 w-32">≤ 39: Recusado</span>
                  </div>
                </div>
              </div>
            </div>

            <Button className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90">
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}