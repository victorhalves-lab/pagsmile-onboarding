import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Server, Camera, ShieldAlert, Plug, Send, Webhook } from 'lucide-react';
import CafBackendTests from '@/components/caf-lab/CafBackendTests';
import CafSdkTests from '@/components/caf-lab/CafSdkTests';
import CafConnectTests from '@/components/caf-lab/CafConnectTests';
import CafComplianceSubmitTests from '@/components/caf-lab/CafComplianceSubmitTests';
import CafWebhookSetup from '@/components/caf-lab/CafWebhookSetup';

/**
 * CafTestLab — página admin para testar cada camada CAF isoladamente.
 * 
 * Tabs:
 *   - Backend Tests: funções server-side (token, health, face match, enrichment).
 *   - Frontend SDK: Document Detector + Face Liveness com câmera real.
 */

export default function CafTestLab() {
  const [tab, setTab] = useState('backend');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100">
              <FlaskConical className="w-5 h-5 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#002443]">CAF Test Lab</h1>
            <Badge className="bg-amber-100 text-amber-700 border-amber-200">Admin</Badge>
          </div>
          <p className="text-sm text-[#002443]/60 max-w-2xl">
            Teste cada camada da integração CAF individualmente. Útil para diagnosticar problemas
            sem precisar rodar o fluxo completo de onboarding.
          </p>
        </div>
      </div>

      {/* Warning */}
      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <p className="font-bold">Atenção — testes reais consomem créditos CAF</p>
            <p className="mt-1 opacity-80">
              Cada teste de Face Match ou Full Enrichment cria uma transação real na CAF. Use CPFs
              de teste (12345678909) quando possível. Os testes de SDK (câmera) não consomem créditos
              apenas para inicialização — só quando você conclui a captura.
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="backend" className="data-[state=active]:bg-white data-[state=active]:text-[#002443]">
            <Server className="w-4 h-4 mr-2" /> Core API (atual)
          </TabsTrigger>
          <TabsTrigger value="connect" className="data-[state=active]:bg-white data-[state=active]:text-[#002443]">
            <Plug className="w-4 h-4 mr-2" /> Connect API <Badge className="ml-2 bg-purple-100 text-purple-700 text-[9px] h-4">novo</Badge>
          </TabsTrigger>
          <TabsTrigger value="submit" className="data-[state=active]:bg-white data-[state=active]:text-[#002443]">
            <Send className="w-4 h-4 mr-2" /> Submit Compliance <Badge className="ml-2 bg-emerald-100 text-emerald-700 text-[9px] h-4">PF/PJ</Badge>
          </TabsTrigger>
          <TabsTrigger value="webhook" className="data-[state=active]:bg-white data-[state=active]:text-[#002443]">
            <Webhook className="w-4 h-4 mr-2" /> Webhook Setup <Badge className="ml-2 bg-blue-100 text-blue-700 text-[9px] h-4">novo</Badge>
          </TabsTrigger>
          <TabsTrigger value="sdk" className="data-[state=active]:bg-white data-[state=active]:text-[#002443]">
            <Camera className="w-4 h-4 mr-2" /> Frontend SDK (câmera)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="backend" className="mt-4">
          <CafBackendTests />
        </TabsContent>

        <TabsContent value="connect" className="mt-4">
          <CafConnectTests />
        </TabsContent>

        <TabsContent value="submit" className="mt-4">
          <CafComplianceSubmitTests />
        </TabsContent>

        <TabsContent value="webhook" className="mt-4">
          <CafWebhookSetup />
        </TabsContent>

        <TabsContent value="sdk" className="mt-4">
          <CafSdkTests />
        </TabsContent>
      </Tabs>
    </div>
  );
}