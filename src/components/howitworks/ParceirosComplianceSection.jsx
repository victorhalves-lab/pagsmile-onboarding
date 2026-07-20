import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Handshake, Eye, EyeOff, FileSpreadsheet, Building2 } from 'lucide-react';

/**
 * HowItWorks Section — Parceiros de Compliance + Pré-KYC + Coleta Bancária (v9.0)
 * Fontes:
 *   pages/AdminGestaoParceiros.jsx, pages/ComplianceParceiro.jsx, pages/ComplianceParceiroDetalhe.jsx
 *   pages/DocCompParceiros.jsx, pages/BankDataCollect.jsx
 *   functions/exportPartnerComplianceDoc.js, functions/generateBankDataLink.js
 *   entities/CompliancePartner, CompliancePartnerUser, PartnerAssignment, PartnerAssignmentActivity, BankDataCollection
 */
export default function ParceirosComplianceSection() {
  return (
    <div className="space-y-5">
      <div className="bg-gradient-to-r from-[#0A0A0A] to-[#003366] rounded-2xl p-5 text-white">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
          <Handshake className="w-5 h-5 text-[#E84B1C]" /> Dois Módulos Distintos
        </h3>
        <p className="text-white/80 text-sm leading-relaxed">
          (1) <strong>Parceiros Externos de Compliance</strong> — bureaus, escritórios de auditoria que ANALISAM o dossiê e
          recomendam decisão. (2) <strong>Doc Compliance Parceiros</strong> — extração de Pré-KYC (XLSX) que a equipe interna
          envia aos bancos parceiros (BaaS) para abrir conta operacional do cliente.
        </p>
      </div>

      {/* Módulo 1 — Parceiros Externos */}
      <div>
        <h4 className="font-bold text-[#0A0A0A] text-sm mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#1356E2]" /> Módulo 1 — Parceiros Externos de Compliance
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="border-slate-200">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Entidades</CardTitle></CardHeader>
            <CardContent className="pt-2 space-y-1.5 text-xs text-[#0A0A0A]/75">
              <p><strong>CompliancePartner:</strong> name, cnpj, slaHours, allowedOnboardingCaseModels[], defaultVisibilityLevel, notificationChannels.</p>
              <p><strong>CompliancePartnerUser:</strong> userId + partnerId + partnerRole (viewer/analyst/manager).</p>
              <p><strong>PartnerAssignment:</strong> caso atribuído, status (pending/viewed/in_review/completed/expired/revoked), dueDate, partnerRecommendation (approve/reject/request_docs/escalate), partnerComments.</p>
              <p><strong>PartnerAssignmentActivity:</strong> log auditável de cada interação (assigned, viewed, documents_downloaded, recommendation_submitted, sla_breached).</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Níveis de Visibilidade (mascaramento)
            </CardTitle></CardHeader>
            <CardContent className="pt-2 space-y-1.5 text-xs text-[#0A0A0A]/75">
              <p><strong>full:</strong> dossiê completo (questionário, BDC, CAF, documentos, SENTINEL, score V4).</p>
              <p><strong>redacted:</strong> CPF parcial (123.XXX.XXX-45), e-mail/telefone parciais. Demais dados visíveis.</p>
              <p><strong>summary_only:</strong> apenas nome, CNPJ, modelo, subfaixa V4, score V4, status, top red flags.</p>
              <p>O componente <code>MaskedField</code> aplica o nível antes de renderizar.</p>
            </CardContent>
          </Card>

          <Card className="border-slate-200 md:col-span-2">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Funções Backend</CardTitle></CardHeader>
            <CardContent className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#0A0A0A]/75">
              <p><code>adminAssignCaseToPartner</code> — atribuir 1 caso (valida modelo permitido + duplicatas).</p>
              <p><code>adminBulkAssignPartner</code> — atribuição em massa.</p>
              <p><code>adminRevokeAssignment</code> — revogar com motivo.</p>
              <p><code>partnerGetCaseDetail</code> — carrega caso aplicando visibilityLevel.</p>
              <p><code>partnerDownloadDocument</code> — URL assinada de 5min, registra evento.</p>
              <p><code>partnerSubmitRecommendation</code> — recebe approve/reject/request_docs/escalate.</p>
              <p><code>partnerListMyCases</code> — lista filtrada por usuário do parceiro.</p>
              <p><code>partnerSlaMonitor</code> — automation horária: warnings + sla_breached.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Módulo 2 — Doc Comp Parceiros + Pré-KYC */}
      <div>
        <h4 className="font-bold text-[#0A0A0A] text-sm mb-3 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-[#1356E2]" /> Módulo 2 — Doc Compliance Parceiros + Coleta Bancária + Pré-KYC
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="border-emerald-200">
            <CardHeader className="bg-emerald-50/60 pb-2"><CardTitle className="text-sm">1. Coleta Bancária</CardTitle></CardHeader>
            <CardContent className="pt-2 space-y-1 text-xs text-[#0A0A0A]/75">
              <p>Admin gera link via <code>generateBankDataLink</code> (token 192 bits / 48 chars hex).</p>
              <p>Cliente acessa <code>/BankDataCollect?token=...</code>, preenche banco, agência, dígito, conta, dígito conta.</p>
              <p><code>publicBankDataSubmit</code> sanitiza, valida (≥20 chars, obrigatórios), persiste em <code>BankDataCollection</code> com clientIp.</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardHeader className="bg-blue-50/60 pb-2"><CardTitle className="text-sm">2. Resolução de CNPJ</CardTitle></CardHeader>
            <CardContent className="pt-2 space-y-1 text-xs text-[#0A0A0A]/75">
              <p>Cadeia de fallback: Merchant.cpfCnpj → OnboardingCase.cpfCnpj → respostas do questionário (regex /\bcnpj\b/) → Lead por email → Lead por cpfCnpj.</p>
              <p>Resolução em chunks de 10 paralelos, atualização progressiva da UI.</p>
              <p>Casos sem CNPJ: badge vermelho "CNPJ não encontrado".</p>
            </CardContent>
          </Card>
          <Card className="border-purple-200">
            <CardHeader className="bg-purple-50/60 pb-2"><CardTitle className="text-sm">3. Export "Pré KYC Pin Bank"</CardTitle></CardHeader>
            <CardContent className="pt-2 space-y-1 text-xs text-[#0A0A0A]/75">
              <p><code>exportPartnerComplianceDoc</code> gera XLSX com 15 colunas (CPF/CNPJ, Razão Social, Nome Fantasia, Banco, Agência, Conta, Email, CEP, Cidade, Rua, Número, Bairro, Estado).</p>
              <p>BDC enriquece on-demand somente quando: PJ + CNPJ válido + algum campo vazio.</p>
              <p>Sanity checks: zera CEP/Numero/Rua se vier CNPJ. Pendências bancárias retornam em <code>missingBankData[]</code>.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-xs font-bold text-blue-900 mb-1 flex items-center gap-1.5">
          <EyeOff className="w-3.5 h-3.5" /> Diferença crítica entre os 2 módulos
        </p>
        <p className="text-xs text-blue-800 leading-relaxed">
          <strong>Módulo 1</strong> é colaboração externa: parceiro recomenda decisão. <strong>Módulo 2</strong> é extração interna: equipe Pin Bank pega dados estruturados e envia aos bancos BaaS para abrir conta operacional. O Módulo 2 não persiste nada além dos <code>BankDataCollection</code> criados — o XLSX é base64 encoded e baixado localmente.
        </p>
      </div>
    </div>
  );
}