import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileUp, RotateCcw, Shield } from 'lucide-react';

/**
 * HowItWorks Section — Escalações Questionáveis + Doc-Only Link + Bulk Reprocess (v9.0)
 * Fontes:
 *   pages/EscalationsReview.jsx, pages/BulkReprocess.jsx, pages/ComplianceDocOnly.jsx
 *   functions/generateDocOnlyLink.js, functions/publicComplianceDocUpload.js, functions/cafVerifaiDocs.js
 *   functions/bulkReprocessCompliance.js, functions/bulkRecomputeDecisions.js
 *   OnboardingCase.escalationSource (enum) + escalationReason (texto)
 */
export default function EscalacoesDocOnlySection() {
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-[#0A0A0A] to-[#003366] rounded-2xl p-5 text-white">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#E84B1C]" /> Governança Operacional do Compliance
        </h3>
        <p className="text-white/80 text-sm leading-relaxed">
          Três telas de operação que mantêm o compliance saudável: monitorar escalações desnecessárias,
          gerar links acelerados de documentos sem CAF, e reprocessar casos em lote quando regras mudam.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Escalações Questionáveis */}
        <Card className="border-amber-200">
          <CardHeader className="bg-amber-50/60 pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" /> /EscalationsReview
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-2 text-xs text-[#0A0A0A]/75">
            <p>Lista casos com <code>status="Manual"</code> mas subfaixa V4 ∈ &#123;1A, 1B, 2A, 2B, 3A, 3B&#125; — escalações <strong>questionáveis</strong>.</p>
            <p><strong>Origens (escalationSource):</strong></p>
            <ul className="ml-3 space-y-0.5">
              <li>✅ V4_BLOCK / V4_SUBFAIXA_4 / CAF_FRAUD — legítimas</li>
              <li>⚠️ CAF_QUALITY — captura ruim, monitorar &lt; 5%</li>
              <li>⚠️ SAFETY_NET — acúmulo sem bloqueio, monitorar &lt; 2%</li>
              <li>🔴 NONE — casos legados/bug, deve ser 0%</li>
            </ul>
            <p><strong>Recaptura automática (CAF):</strong> <code>cafRecaptureRequested</code>, <code>cafRecaptureAttempts</code>, e-mail com novo token CAF.</p>
            <p><strong>Meta:</strong> revisão semanal pelo time de compliance — ritual de governança.</p>
          </CardContent>
        </Card>

        {/* Doc-Only Link */}
        <Card className="border-blue-200">
          <CardHeader className="bg-blue-50/60 pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileUp className="w-4 h-4 text-blue-600" /> Link de Docs Exclusivos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-2 text-xs text-[#0A0A0A]/75">
            <p>Cliente envia documentos <strong>sem refazer biometria CAF</strong> — útil para revalidação anual ou docs adicionais pós-aprovação.</p>
            <p><strong>Geração:</strong> botão FileUp em <code>ComplianceCasesCardsGrid</code> → modal <code>DocOnlyLinkModal</code> → <code>generateDocOnlyLink</code> cria token cripto-seguro 256 bits e grava em <code>OnboardingCase.docLinkToken</code>.</p>
            <p><strong>Bloqueios:</strong> 409 se já <code>docCompleted</code>; 400 se template sem <code>requiredDocuments</code>.</p>
            <p><strong>URL:</strong> <code>/ComplianceDocOnly?caseId=X&amp;token=Y&amp;mode=docs_only</code> — pula CAF SDK mas mantém VerifAI obrigatório (fire-and-forget).</p>
            <p><strong>VerifAI:</strong> análise de manipulação digital roda em background mesmo sem CAF SDK — conformidade preservada.</p>
          </CardContent>
        </Card>

        {/* Bulk Reprocess */}
        <Card className="border-purple-200">
          <CardHeader className="bg-purple-50/60 pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-purple-600" /> /BulkReprocess
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-3 space-y-2 text-xs text-[#0A0A0A]/75">
            <p>Reexecuta o pipeline de compliance em <strong>múltiplos casos</strong> de uma vez quando regras V4 mudam, datasets BDC ficam disponíveis ou framework é atualizado.</p>
            <p><strong>2 modos:</strong></p>
            <ul className="ml-3 space-y-0.5">
              <li><code>bulkReprocessCompliance</code> — reroda autoEnrichOnboarding (BDC + CAF + SENTINEL).</li>
              <li><code>bulkRecomputeDecisions</code> — só recomputa decisão a partir do score V4 existente (mais rápido, sem chamadas externas).</li>
            </ul>
            <p><strong>UI:</strong> <code>CaseSelectionTable</code> com filtros + <code>ProcessingQueue</code> com progresso ao vivo.</p>
            <p><strong>Auditoria:</strong> cada reprocessamento gera <code>AuditLog</code> com antes/depois do score e da decisão.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}