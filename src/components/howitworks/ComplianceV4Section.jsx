import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, ArrowRight, Zap, Layers } from 'lucide-react';

const V4_TEMPLATES = [
  { id: 'ComplianceGatewayV4', label: 'Gateway v4', badge: 'bg-indigo-100 text-indigo-700', risk: 'ALTO', targetSegment: 'gateway', desc: 'PSPs, facilitadores, gateways que processam para sub-merchants. Foco: licença BCB, due diligence sub-merchants, PCI DSS, split de pagamentos.' },
  { id: 'ComplianceMarketplaceV4', label: 'Marketplace v4', badge: 'bg-amber-100 text-amber-700', risk: 'MÉDIO-ALTO', targetSegment: 'marketplace', desc: 'Plataformas com sellers (tipo Mercado Livre). Foco: onboarding sellers, take rate, KYC sellers, monitoramento, offboarding.' },
  { id: 'CompliancePlataformaVerticalV4', label: 'Plataforma Vertical v4', badge: 'bg-violet-100 text-violet-700', risk: 'MÉDIO', targetSegment: 'plataforma_vertical', desc: 'Foodtech, PDV, agendamento, ticketing, fitness. Foco: split, rede de estabelecimentos, modelo vertical específico.' },
  { id: 'ComplianceEcommerceV4', label: 'E-commerce v4', badge: 'bg-rose-100 text-rose-700', risk: 'MÉDIO', targetSegment: 'ecommerce', desc: 'Lojas virtuais com estoque e logística. Foco: plataforma (VTEX/Shopify), antifraude, chargeback, modelo de entrega.' },
  { id: 'ComplianceInfoprodutosV4', label: 'Infoprodutos v4', badge: 'bg-amber-100 text-amber-700', risk: 'MÉDIO-ALTO', targetSegment: 'infoprodutos', desc: 'Cursos, e-books, mentorias. Foco: rede de afiliados, garantia reembolso, co-produção, plataformas (Hotmart/Eduzz).' },
  { id: 'ComplianceEducacaoV4', label: 'Educação v4', badge: 'bg-sky-100 text-sky-700', risk: 'BAIXO', targetSegment: 'educacao', desc: 'Escolas, faculdades, cursos presenciais. Foco: mensalidades, matrículas, modelo de cobrança recorrente.' },
  { id: 'ComplianceSaaSV4', label: 'SaaS v4', badge: 'bg-cyan-100 text-cyan-700', risk: 'BAIXO-MÉDIO', targetSegment: 'saas', desc: 'Software por assinatura. Foco: churn, modelo de pricing, recorrência, trial/freemium.' },
  { id: 'ComplianceMerchantLinkV4', label: 'Merchant Link v4', badge: 'bg-green-100 text-green-700', risk: 'BAIXO', targetSegment: 'link_pagamento', desc: 'Vendedores por Instagram/WhatsApp via link. Foco: presença digital mínima, volume individual, modelo de venda.' },
  { id: 'ComplianceMPEV4', label: 'MPE v4', badge: 'bg-amber-100 text-amber-700', risk: 'BAIXO', targetSegment: 'mpe', desc: 'Micro e Pequenas Empresas locais. Foco: faturamento simplificado, processo enxuto, regime MEI/ME.' },
  { id: 'ComplianceDropshippingV4', label: 'Dropshipping v4', badge: 'bg-orange-100 text-orange-700', risk: 'ALTO', targetSegment: 'dropshipping', desc: 'Lojas sem estoque (fornecedor envia direto). Foco: fornecedores, prazo entrega, garantias, chargeback alto, plataformas.' },
];

export default function ComplianceV4Section() {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-purple-900 to-purple-700 rounded-2xl p-5 text-white">
        <h3 className="text-lg font-bold mb-2">10 Templates de Compliance v4 — Segmentados por Vertical</h3>
        <p className="text-white/80 text-sm leading-relaxed mb-3">
          A geração v4 introduz questionários de compliance específicos para cada um dos 10 segmentos do Lead Pagsmile v5.
          Cada template é carregado dinamicamente no <code className="bg-white/10 px-1 rounded">ComplianceDinamico</code> com 
          <code className="bg-white/10 px-1 rounded">?model=ComplianceXxxV4</code>. As perguntas vêm da entidade Question vinculada ao
          QuestionnaireTemplate correspondente, agrupadas semanticamente em steps de 4 perguntas pelo DynamicQuestionnaire.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="bg-white/15 rounded-xl p-2.5 text-center">
            <p className="text-xl font-extrabold">10</p>
            <p className="text-[10px] text-white/70">Templates v4</p>
          </div>
          <div className="bg-white/15 rounded-xl p-2.5 text-center">
            <p className="text-xl font-extrabold">1:1</p>
            <p className="text-[10px] text-white/70">Lead Segmento → Compliance</p>
          </div>
          <div className="bg-white/15 rounded-xl p-2.5 text-center">
            <p className="text-xl font-extrabold">Auto</p>
            <p className="text-[10px] text-white/70">Prefill via useLeadPrefill</p>
          </div>
          <div className="bg-white/15 rounded-xl p-2.5 text-center">
            <p className="text-xl font-extrabold">CNPJ</p>
            <p className="text-[10px] text-white/70">Autocomplete + CEP</p>
          </div>
          <div className="bg-white/15 rounded-xl p-2.5 text-center">
            <p className="text-xl font-extrabold">CAF</p>
            <p className="text-[10px] text-white/70">Redirect biometria</p>
          </div>
        </div>
      </div>

      {/* Mapeamento */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <h4 className="text-sm font-bold text-[#002443] mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#2bc196]" />Mapeamento Segmento Lead v5 → Compliance v4
        </h4>
        <div className="space-y-2">
          {V4_TEMPLATES.map((t, i) => (
            <div key={i} className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <Badge className={`${t.badge} border-0 text-[10px] shrink-0 w-36 justify-center`}>{t.label}</Badge>
              <ArrowRight className="w-3 h-3 text-slate-300 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#002443]/80 font-medium">{t.desc}</p>
                <div className="flex gap-1 mt-1">
                  <Badge className="text-[8px] bg-blue-50 text-blue-600 border-0">Segmento: {t.targetSegment}</Badge>
                  <Badge className={`text-[8px] border-0 ${t.risk.includes('ALTO') ? 'bg-red-50 text-red-600' : t.risk.includes('MÉDIO') ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>Risco: {t.risk}</Badge>
                  <Badge className="text-[8px] bg-slate-100 text-slate-600 border-0 font-mono">{t.id}</Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Funcionalidades compartilhadas */}
      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
        <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" />Funcionalidades Compartilhadas (DynamicQuestionnaire)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {[
            'Perguntas carregadas da entidade Question (filtradas por questionnaireTemplateId)',
            'Agrupamento semântico automático em steps de 4 perguntas',
            'Autocomplete CNPJ via BrasilAPI (preenchimento de 12+ campos)',
            'Autocomplete CEP via ViaCEP (endereço completo)',
            'Validação de CPF, CNPJ, e-mail, telefone em tempo real',
            'Top5CnpjField: campo de CNPJ com enriquecimento completo',
            'useLeadPrefill: pré-preenche campos com dados do Lead v5 (match por texto semântico)',
            'ComplianceSession: salva progresso (sessionToken, currentPhase, currentStep, formData)',
            'ComplianceResume: retomar sessão de onde parou',
            'Lógica condicional: conditionalLogic (dependsOn, operator, value) em cada Question',
            'riskWeight e riskValues por pergunta (para scoring SENTINEL)',
            'Redirect para CAF (biometria) ao finalizar questionário',
            'Bloqueio de segurança: CNPJ com situação cadastral ≠ Ativa é bloqueado',
            'StepNavigation visual: indicadores de progresso com ícones semânticos',
            'ComplianceFieldAlerts: alertas visuais para respostas de risco',
            'Auto-save em localStorage + backend (saveComplianceProgress)',
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[10px] text-[#002443]/70">
              <span className="text-[#2bc196] shrink-0 mt-0.5">✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Fluxo */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />Fluxo: Lead v5 → Compliance v4 → Documentos → Biometria
        </h4>
        <div className="space-y-2">
          {[
            { step: '1', text: 'Lead preenche questionário Pagsmile v5 e seleciona segmento (ex: "E-commerce")', actor: 'Lead' },
            { step: '2', text: 'Proposta é enviada e aceita pelo lead', actor: 'Comercial + Lead' },
            { step: '3', text: 'Sistema redireciona para ComplianceDinamico?model=ComplianceEcommerceV4', actor: 'Sistema' },
            { step: '4', text: 'useLeadPrefill carrega dados do Lead v5 e enrichment CNPJ → pré-preenche campos do compliance', actor: 'Sistema' },
            { step: '5', text: 'Lead preenche perguntas restantes (não pré-preenchidas) do compliance v4', actor: 'Lead' },
            { step: '6', text: 'Ao finalizar questionário → redirect para DocumentUploadFull', actor: 'Sistema' },
            { step: '7', text: 'Lead faz upload dos documentos obrigatórios', actor: 'Lead' },
            { step: '8', text: 'Redirect para CAF: Liveness + Facematch (biometria)', actor: 'Lead + CAF' },
            { step: '9', text: 'OnboardingCase criado → IA SENTINEL analisa em 3 fases → ComplianceScore', actor: 'Sistema + IA' },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-2 p-2 bg-white rounded-lg">
              <Badge className="bg-blue-200 text-blue-800 border-0 text-[10px] shrink-0 w-6 justify-center">{s.step}</Badge>
              <div className="flex-1">
                <p className="text-[11px] text-[#002443]/80">{s.text}</p>
                <Badge className="text-[8px] bg-slate-100 text-slate-500 border-0 mt-0.5">{s.actor}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Versões anteriores */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <h4 className="text-xs font-bold text-[#002443]/50 uppercase tracking-wider mb-2">Gerações Anteriores (ainda disponíveis)</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[10px] text-[#002443]/60">
          <div className="p-2 bg-white rounded-lg border border-slate-100">
            <p className="font-bold">v1 (Legados)</p>
            <p>merchant, gateway, marketplace — Perguntas fixas no código. Seções A-K hardcoded.</p>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-100">
            <p className="font-bold">v2.0 (Autocomplete)</p>
            <p>ComplianceMerchantAutocomplete, etc. — v1 + autocomplete CNPJ/CEP.</p>
          </div>
          <div className="p-2 bg-white rounded-lg border border-slate-100">
            <p className="font-bold">Especializados</p>
            <p>PIX Only, Lite, SaaS, E-commerce — Questionários reduzidos por modelo de negócio.</p>
          </div>
        </div>
      </div>
    </div>
  );
}