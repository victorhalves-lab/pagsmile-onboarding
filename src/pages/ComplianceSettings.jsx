import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, FileText, Shield } from 'lucide-react';

export default function ComplianceSettings() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Configurações de Compliance</h1>
        <p className="text-slate-600 mt-1">Configure as regras e parâmetros do sistema</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="w-4 h-4 mr-2" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="w-4 h-4 mr-2" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="risk">
            <Shield className="w-4 h-4 mr-2" />
            Regras de Risco
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Configurações Gerais</h3>
            <p className="text-slate-600">
              Em breve: configurações gerais do sistema de compliance
            </p>
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Tipos de Documentos</h3>
            <p className="text-slate-600">
              Em breve: gestão de tipos de documentos aceitos
            </p>
          </div>
        </TabsContent>

        <TabsContent value="risk">
          <div className="bg-white p-6 rounded-lg border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Regras de Avaliação de Risco</h3>
            <p className="text-slate-600">
              Em breve: configuração de thresholds e regras de decisão automática
            </p>
            <div className="mt-4 p-4 bg-slate-50 rounded-lg">
              <div className="text-sm text-slate-700 space-y-2">
                <div className="flex justify-between">
                  <span>Score ≥ 75:</span>
                  <span className="font-medium text-green-600">Aprovação Automática</span>
                </div>
                <div className="flex justify-between">
                  <span>Score 40-74:</span>
                  <span className="font-medium text-yellow-600">Revisão Manual</span>
                </div>
                <div className="flex justify-between">
                  <span>Score ≤ 39:</span>
                  <span className="font-medium text-red-600">Recusa Automática</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}