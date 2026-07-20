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
  const [tab, setTab] = useState('connect');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-purple-100">
              <FlaskConical className="w-5 h-5 text-purple-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#0A0A0A]">CAF Test Lab</h1>
            <Badge className="bg-amber-100 text-amber-700 border-amber-200">Admin</Badge>
          </div>
          <p className="text-sm text-[#0A0A0A]/60 max-w-2xl">
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
              Toda a integração usa a <strong>Connect API</strong> (api.us.prd.caf.io) via OAuth2 client_credentials.
              Cada Submit Compliance ou Create Transaction cria uma transação real na CAF e consome créditos.
              Use CPFs de teste (12345678909) quando possível. Os testes de SDK (câmera) só consomem créditos
              quando você conclui a captura.
            </p>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-slate-100">
          <TabsTrigger value="connect" className="data-[state=active]:bg-white data-[state=active]:text-[#0A0A0A]">
            <Plug className="w-4 h-4 mr-2" /> Connect API <Badge className="ml-2 bg-[#1356E2] text-white text-[9px] h-4">principal</Badge>
          </TabsTrigger>
          <TabsTrigger value="submit" className="data-[state=active]:bg-white data-[state=active]:text-[#0A0A0A]">
            <Send className="w-4 h-4 mr-2" /> Submit Compliance <Badge className="ml-2 bg-emerald-100 text-emerald-700 text-[9px] h-4">PF/PJ</Badge>
          </TabsTrigger>
          <TabsTrigger value="sdk" className="data-[state=active]:bg-white data-[state=active]:text-[#0A0A0A]">
            <Camera className="w-4 h-4 mr-2" /> Frontend SDK (câmera)
          </TabsTrigger>
          <TabsTrigger value="webhook" className="data-[state=active]:bg-white data-[state=active]:text-[#0A0A0A]">
            <Webhook className="w-4 h-4 mr-2" /> Webhook Setup
          </TabsTrigger>
          <TabsTrigger value="backend" className="data-[state=active]:bg-white data-[state=active]:text-[#0A0A0A]">
            <Server className="w-4 h-4 mr-2" /> Backend Helpers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connect" className="mt-4">
          <CafConnectTests />
        </TabsContent>

        <TabsContent value="submit" className="mt-4">
          <CafComplianceSubmitTests />
        </TabsContent>

        <TabsContent value="sdk" className="mt-4">
          <CafSdkTests />
        </TabsContent>

        <TabsContent value="webhook" className="mt-4">
          <CafWebhookSetup />
        </TabsContent>

        <TabsContent value="backend" className="mt-4">
          <CafBackendTests />
        </TabsContent>
      </Tabs>
    </div>
  );
}