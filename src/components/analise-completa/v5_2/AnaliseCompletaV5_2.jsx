import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, GitCompare, Layers, Brain, Rocket } from 'lucide-react';

import HeroVerdictV5_2 from './HeroVerdictV5_2';
import Tab1ResumoDecisao from './Tab1ResumoDecisao';
import Tab2Evidencias from './Tab2Evidencias';
import Tab3DimensionalBDC from './Tab3DimensionalBDC';
import Tab4SentinelAuditoria from './Tab4SentinelAuditoria';

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
      {/* V5.2 Banner */}
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2bc196]/10 border border-[#2bc196]/30 w-fit">
        <Rocket className="w-3.5 h-3.5 text-[#2bc196]" />
        <span className="text-[11px] font-bold uppercase tracking-wide text-[#2bc196]">
          Análise V5.2 — Layout DOC6 (Hero + 4 abas)
        </span>
      </div>

      {/* Hero Verdict */}
      <HeroVerdictV5_2 latestCase={latestCase} latestScore={latestScore} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full bg-white border border-[#002443]/8 p-1 h-auto">
          <TabsTrigger value="resumo" className="data-[state=active]:bg-[#2bc196]/10 data-[state=active]:text-[#2bc196] py-2.5">
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
          <TabsTrigger value="evidencias" className="data-[state=active]:bg-[#2bc196]/10 data-[state=active]:text-[#2bc196] py-2.5">
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
          <TabsTrigger value="dimensional" className="data-[state=active]:bg-[#2bc196]/10 data-[state=active]:text-[#2bc196] py-2.5">
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
          <TabsTrigger value="sentinel" className="data-[state=active]:bg-[#2bc196]/10 data-[state=active]:text-[#2bc196] py-2.5">
            <div className="flex items-center gap-2">
              <Brain className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold hidden md:inline">SENTINEL & Auditoria</span>
              <span className="text-xs font-semibold md:hidden">4</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumo" className="mt-4">
          <Tab1ResumoDecisao latestCase={latestCase} latestScore={latestScore} />
        </TabsContent>

        <TabsContent value="evidencias" className="mt-4">
          <Tab2Evidencias
            latestCase={latestCase}
            latestScore={latestScore}
            cafValidations={cafValidations}
            cafLogs={cafLogs}
            merchant={merchant}
          />
        </TabsContent>

        <TabsContent value="dimensional" className="mt-4">
          <Tab3DimensionalBDC
            bdcValidations={bdcValidations}
            bdcLogs={bdcLogs}
            merchant={merchant}
            latestScore={latestScore}
            responses={responses}
          />
        </TabsContent>

        <TabsContent value="sentinel" className="mt-4">
          <Tab4SentinelAuditoria
            latestCase={latestCase}
            latestScore={latestScore}
            integrationLogs={integrationLogs}
            validations={validations}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}