import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, GitCompare, Layers, Brain, Rocket } from 'lucide-react';

import HeroVerdictV5_2 from './HeroVerdictV5_2';
import Tab1ResumoDecisao from './Tab1ResumoDecisao';
import Tab2Evidencias from './Tab2Evidencias';
import Tab3DimensionalBDC from './Tab3DimensionalBDC';
import Tab4SentinelAuditoria from './Tab4SentinelAuditoria';
import V5_2ShortcutsProvider from '@/components/v5_2/shortcuts/V5_2ShortcutsProvider';

/**
 * [V5.2 Fase 6.4-B] Container da nova tela DOC6 — Hero Verdict + 4 abas.
 * Usado APENAS para casos com framework_version='v5.2'. Roteado por AnaliseCompleta.
 */
export default function AnaliseCompletaV5_2({
  merchant,
  latestCase,
  latestScore,
  cafValidations,
  cafLogs,
  bdcValidations,
  bdcLogs,
  integrationLogs,
  validations,
  responses,
}) {
  const [activeTab, setActiveTab] = useState('resumo');

  const numAlerts = latestScore?.impact_score_top_alerts?.length || 0;
  const numBloqueios = (latestCase?.bloqueiosAtivos?.length) || (latestScore?.bloqueios_v5_1_ativos?.length) || 0;
  const numDatasets = (bdcValidations?.length || 0) + (bdcLogs?.length || 0);

  return (
    <div className="space-y-4">
      {/* [V5.2 Fase 6.5.5] Atalhos de teclado: 15 atalhos canônicos DOC6 §5.5.
          Provider renderiza badge fixo + painel "?" + busca "/" + binding global. */}
      <V5_2ShortcutsProvider
        caseId={latestCase?.id}
        merchantId={merchant?.id}
        merchantName={merchant?.companyName || merchant?.fullName}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* V5.2 Banner */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1356E2]/10 border border-[#1356E2]/30 w-fit">
        <Rocket className="w-3.5 h-3.5 text-[#1356E2]" />
        <span className="text-[11px] font-bold uppercase tracking-wide text-[#1356E2]">
          Análise V5.2 — Layout DOC6 (Hero + 4 abas)
        </span>
      </div>

      {/* Hero Verdict */}
      <HeroVerdictV5_2 latestCase={latestCase} latestScore={latestScore} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full bg-white border border-[#0A0A0A]/8 p-1 h-auto">
          <TabsTrigger value="resumo" className="data-[state=active]:bg-[#1356E2]/10 data-[state=active]:text-[#1356E2] py-2.5">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold hidden md:inline">Resumo & Decisão</span>
              <span className="text-xs font-semibold md:hidden">1</span>
              {numAlerts > 0 && (
                <Badge className="bg-red-100 text-red-700 border-red-200 text-[9px] ml-1 px-1.5 py-0">
                  {numAlerts}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger value="evidencias" className="data-[state=active]:bg-[#1356E2]/10 data-[state=active]:text-[#1356E2] py-2.5">
            <div className="flex items-center gap-2">
              <GitCompare className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold hidden md:inline">Evidências</span>
              <span className="text-xs font-semibold md:hidden">2</span>
              {numBloqueios > 0 && (
                <Badge className="bg-red-100 text-red-700 border-red-200 text-[9px] ml-1 px-1.5 py-0">
                  {numBloqueios}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger value="dimensional" className="data-[state=active]:bg-[#1356E2]/10 data-[state=active]:text-[#1356E2] py-2.5">
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold hidden md:inline">Dimensional BDC</span>
              <span className="text-xs font-semibold md:hidden">3</span>
              {numDatasets > 0 && (
                <Badge variant="outline" className="text-[9px] ml-1 px-1.5 py-0">
                  {numDatasets}
                </Badge>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger value="sentinel" className="data-[state=active]:bg-[#1356E2]/10 data-[state=active]:text-[#1356E2] py-2.5">
            <div className="flex items-center gap-2">
              <Brain className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold hidden md:inline">SENTINEL & Auditoria</span>
              <span className="text-xs font-semibold md:hidden">4</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="mt-4">
          <div data-shortcut-item data-shortcut-label="Resumo e Decisão">
            <Tab1ResumoDecisao latestCase={latestCase} latestScore={latestScore} />
          </div>
        </TabsContent>

        <TabsContent value="evidencias" className="mt-4">
          <div data-shortcut-item data-shortcut-label="Evidências e Cross-Validation">
            <Tab2Evidencias
              latestCase={latestCase}
              latestScore={latestScore}
              cafValidations={cafValidations}
              cafLogs={cafLogs}
              merchant={merchant}
            />
          </div>
        </TabsContent>

        <TabsContent value="dimensional" className="mt-4">
          <div data-shortcut-item data-shortcut-label="Dimensional BDC">
            <Tab3DimensionalBDC
              bdcValidations={bdcValidations}
              bdcLogs={bdcLogs}
              merchant={merchant}
              latestScore={latestScore}
              responses={responses}
            />
          </div>
        </TabsContent>

        <TabsContent value="sentinel" className="mt-4">
          <div data-shortcut-item data-shortcut-label="SENTINEL e Auditoria">
            <Tab4SentinelAuditoria
              latestCase={latestCase}
              latestScore={latestScore}
              integrationLogs={integrationLogs}
              validations={validations}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}