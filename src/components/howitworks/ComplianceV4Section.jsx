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
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          <div className="bg-white/15 rounded-xl p-2.5 text-center">
            <p className="text-xl font-extrabold">10</p>
            <p className="text-[10px] text-white/70">Templates v4 (PJ)</p>
          </div>
          <div className="bg-white/15 rounded-xl p-2.5 text-center">
            <p className="text-xl font-extrabold">+2</p>
            <p className="text-[10px] text-white/70">Templates Subseller (PF+PJ)</p>
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
            <p className="text-xl font-extrabold">PF</p>
            <p className="text-[10px] text-white/70">Upload direto (sem CAF)</p>
          </div>
          <div className="bg-white/15 rounded-xl p-2.5 text-center">
            <p className="text-xl font-extrabold">PJ</p>
            <p className="text-[10px] text-white/70">CAF (Liveness+Facematch)</p>
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
            'Redirect para CAF (biometria) ao finalizar questionário PJ — PF vai direto para upload de documentos',
            'MerchantTypeSelector: seleção PF/PJ no fluxo de subseller antes do questionário',
            'Detecção automática de tipo PF: cria Merchant com dateOfBirth, nationality, motherName',
            'Upload de documentos na plataforma: DocumentUploadFull reutiliza IDs do Merchant/Case já criados (sem duplicação)',
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

      {/* Fluxo PJ (Pessoa Jurídica) */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />Fluxo PJ: Lead v5 → Compliance v4 → Documentos → Biometria CAF
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

      {/* Fluxo PF (Pessoa Física) — Subseller PF */}
      <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
        <h4 className="text-xs font-bold text-pink-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />Fluxo PF (Subseller Pessoa Física): Seleção Tipo → Questionário 33 perguntas → Upload Documentos na Plataforma (sem CAF)
        </h4>
        <p className="text-[10px] text-pink-700/60 mb-3">
          A Pessoa Física (PF) segue um fluxo diferente da PJ: não há redirecionamento para biometria CAF. Os documentos são enviados diretamente na plataforma via upload. O Merchant é criado com type="PF" e campos exclusivos (data de nascimento, nacionalidade, nome da mãe). O template usado é <code className="bg-pink-100 px-1 rounded">subseller_pf</code> com 33 perguntas obrigatórias.
        </p>
        <div className="space-y-2">
          {[
            { step: '1', text: 'Subseller PF acessa SubsellerQuestionnaire?ref=xxx (link gerado pelo merchant/admin)', actor: 'Subseller PF' },
            { step: '2', text: 'MerchantTypeSelector exibe 2 cards: "Pessoa Física (CPF)" vs "Pessoa Jurídica (CNPJ)". Subseller seleciona PF.', actor: 'Subseller PF' },
            { step: '3', text: 'Sistema carrega template subseller_pf (merchantType=PF) com 33 perguntas agrupadas em steps de 4', actor: 'Sistema' },
            { step: '4', text: 'DynamicQuestionnaire renderiza com branding white-label do merchant (se configurado no OnboardingLink)', actor: 'Sistema' },
            { step: '5', text: 'Subseller PF preenche dados pessoais: CPF, Nome Completo, Data de Nascimento, Nacionalidade, Nome da Mãe, E-mail, Telefone, Endereço completo (CEP autocomplete)', actor: 'Subseller PF' },
            { step: '6', text: 'Preenche perguntas de compliance PF: atividade, renda, PEP, sanções, fonte de renda, etc. (Complemento é campo opcional)', actor: 'Subseller PF' },
            { step: '7', text: 'Ao finalizar questionário → DynamicQuestionnaire.createMerchantAndCase() cria Merchant (type=PF, dateOfBirth, nationality, motherName) + OnboardingCase + QuestionnaireResponses. IDs salvos em localStorage.', actor: 'Sistema' },
            { step: '8', text: 'Redirect para DocumentUploadFull (SEM redirect para CAF — fluxo PF não usa biometria externa)', actor: 'Sistema' },
            { step: '9', text: 'DynamicDocumentUploadPage detecta IDs do Merchant/Case já criados via localStorage (created_merchant_id, created_onboarding_case_id). NÃO duplica registros.', actor: 'Sistema' },
            { step: '10', text: 'Subseller PF faz upload dos 4 documentos obrigatórios: Selfie com Documento, RG ou CNH (Frente), RG ou CNH (Verso), Comprovante de Endereço. Formatos: PDF/JPG/PNG, max 10MB.', actor: 'Subseller PF' },
            { step: '11', text: 'Ao clicar "Concluir Submissão" → DocumentUpload[] criados vinculados ao OnboardingCase existente. localStorage limpo.', actor: 'Sistema' },
            { step: '12', text: 'Redirect para OnboardingCompletion?caseId=xxx. Caso aparece em QuestionariosRecebidos → aba Subsellers → sub-aba PF com badge "PF".', actor: 'Sistema' },
            { step: '13', text: 'Admin visualiza caso na aba Subsellers (SubsellerCasesTab). Clica no ícone de olho para abrir SubsellerPFResponsesModal com respostas categorizadas. Aba "Documentos" do caso mostra todos os uploads com visualização e download ZIP.', actor: 'Admin' },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-2 p-2 bg-white rounded-lg">
              <Badge className="bg-pink-200 text-pink-800 border-0 text-[10px] shrink-0 w-6 justify-center">{s.step}</Badge>
              <div className="flex-1">
                <p className="text-[11px] text-[#002443]/80">{s.text}</p>
                <Badge className="text-[8px] bg-slate-100 text-slate-500 border-0 mt-0.5">{s.actor}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Diferenças PF vs PJ */}
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
        <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Comparativo: Fluxo PF vs PJ (Subseller Compliance)</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-amber-200">
                <th className="text-left py-1.5 text-amber-900 font-bold">Aspecto</th>
                <th className="text-center py-1.5 text-pink-700 font-bold">Pessoa Física (PF)</th>
                <th className="text-center py-1.5 text-blue-700 font-bold">Pessoa Jurídica (PJ)</th>
              </tr>
            </thead>
            <tbody className="text-[#002443]/70">
              {[
                ['Template', 'subseller_pf (33 perguntas)', 'subseller_v2 (template PJ dinâmico)'],
                ['Documento identificador', 'CPF', 'CNPJ'],
                ['Campos exclusivos', 'Data nascimento, Nacionalidade, Nome da mãe', 'Razão Social, Nome Fantasia, CNAE'],
                ['Seleção de tipo', 'MerchantTypeSelector → card "Pessoa Física"', 'MerchantTypeSelector → card "Pessoa Jurídica"'],
                ['Biometria CAF', '❌ Não — upload direto na plataforma', '✅ Sim — redirect para CAF (Liveness + Facematch)'],
                ['Upload de documentos', '✅ Na plataforma (DocumentUploadFull)', '✅ Na plataforma (DocumentUploadFull) + CAF'],
                ['Documentos obrigatórios', 'Selfie, RG/CNH Frente, RG/CNH Verso, Comprovante Endereço', 'Contrato Social, Comprovante CNPJ, etc.'],
                ['Merchant.type', 'PF', 'PJ'],
                ['Criação de Merchant', 'createMerchantAndCase com dateOfBirth, nationality, motherName', 'createMerchantAndCase com companyName, CNAE'],
                ['Duplicação evitada', '✅ IDs salvos em localStorage (created_merchant_id, created_onboarding_case_id)', '✅ Mesma lógica'],
                ['Admin: visualização respostas', 'SubsellerPFResponsesModal (6 categorias)', 'ComplianceResponsesPanel (padrão)'],
                ['Admin: aba na tabela', 'Sub-aba "PF" em SubsellerCasesTab', 'Sub-aba "PJ" em SubsellerCasesTab'],
                ['Badge visual', '🟣 PF (roxo)', '🔵 PJ (azul)'],
              ].map((row, i) => (
                <tr key={i} className="border-b border-amber-100">
                  <td className="py-1.5 font-semibold text-[#002443]">{row[0]}</td>
                  <td className="text-center py-1.5">{row[1]}</td>
                  <td className="text-center py-1.5">{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Perguntas-Chave por Template v4 */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <h4 className="text-sm font-bold text-[#002443] mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-purple-600" />Perguntas-Chave Específicas por Template v4 (Diferenciação)
        </h4>
        <p className="text-[10px] text-[#002443]/50 mb-3">Todos os templates compartilham um tronco comum (identificação, endereço, estrutura societária, PLD/sanções). Abaixo, as perguntas EXCLUSIVAS que diferem por segmento — responsáveis pelo scoring diferenciado e classificação de risco.</p>
        <div className="space-y-3">
          {[
            { tmpl: 'Gateway v4', color: 'border-l-indigo-500', qs: ['Possui licença/autorização do BCB para operar como instituição de pagamento?', 'Qual modelo de split de pagamentos utiliza?', 'Quantos sub-merchants ativos processam por sua plataforma?', 'Implementa KYC de sub-merchants? Descreva o processo.', 'Possui certificação PCI DSS? Qual nível?', 'Qual o % de transações CNP (Card Not Present)?', 'Possui política formal de onboarding e offboarding de sub-merchants?', 'Monitora transações em tempo real para detecção de fraude?', 'Utiliza modelo BaaS? Qual instituição parceira?', 'Taxa de chargeback dos últimos 12 meses? (V28/V29 do motor v4)'] },
            { tmpl: 'Marketplace v4', color: 'border-l-amber-500', qs: ['Quantos sellers ativos na plataforma?', 'Qual a taxa de take rate média?', 'Como é o processo de KYC dos sellers?', 'Sellers transferem valores para terceiros?', 'Possui política de onboarding e offboarding de sellers?', 'Monitora contestações (chargebacks) por seller?', 'Sellers vendem produtos regulados?', 'Possui programa de proteção ao comprador?'] },
            { tmpl: 'E-commerce v4', color: 'border-l-rose-500', qs: ['Qual plataforma de e-commerce utiliza? (VTEX/Shopify/WooCommerce/Nuvemshop/própria)', 'Modelo de entrega: estoque próprio, dropshipping, digital?', 'Prazo médio de entrega ao consumidor?', 'Política de cancelamento e reembolso?', 'Taxa de chargeback últimos 12 meses?', 'Possui solução antifraude integrada? Qual?', 'Vende para outros países?', 'Ticket médio e faixa de preço?'] },
            { tmpl: 'Infoprodutos v4', color: 'border-l-amber-500', qs: ['Utiliza rede de afiliados? Quantos afiliados ativos?', 'Oferece garantia de reembolso? Qual prazo?', 'Modelo de co-produção com outros infoprodutores?', 'Plataforma de distribuição (Hotmart/Eduzz/Monetizze/Kiwify/própria)?', 'Taxa de reembolso nos últimos 6 meses?', 'Produz conteúdo próprio ou revende?', 'Valor médio dos produtos e faixa de preço?'] },
            { tmpl: 'SaaS v4', color: 'border-l-cyan-500', qs: ['Modelo de pricing: mensal, anual, freemium, trial?', 'Taxa de churn mensal?', 'Faturamento por recorrência vs avulso (%)?', 'Possui período trial/gratuito? Conversão trial→pago?', 'Mercado: B2B, B2C ou ambos?', 'Ticket médio mensal por cliente?'] },
            { tmpl: 'Dropshipping v4', color: 'border-l-orange-500', qs: ['Fornecedores: nacionais, internacionais ou ambos?', 'Prazo médio de entrega ao consumidor?', 'Como gerencia garantias e devoluções?', 'Taxa de chargeback últimos 12 meses? (alto risco)', 'Possui contrato com fornecedores?', 'Já teve conta encerrada por outro processador?'] },
            { tmpl: 'Educação v4', color: 'border-l-sky-500', qs: ['Tipo: escola, faculdade, curso técnico, curso livre?', 'Modelo de cobrança: mensalidade, matrícula, módulo?', 'Emite boleto educacional?', 'Possui inadimplência estruturada (renegociação)?', 'Parcela em quantas vezes no máximo?'] },
            { tmpl: 'Plat. Vertical v4', color: 'border-l-violet-500', qs: ['Qual vertical atende? (foodtech, PDV, agendamento, ticketing, fitness)', 'Rede de estabelecimentos: quantos?', 'Modelo de split com estabelecimentos?', 'Possui funcionalidade de antecipação para estabelecimentos?', 'Integração com PDV/POS? Qual?'] },
            { tmpl: 'Merchant Link v4', color: 'border-l-green-500', qs: ['Canal principal de vendas: Instagram, WhatsApp, site próprio?', 'Gera links de pagamento manualmente ou automatizado?', 'Volume médio de transações por mês?', 'Já utilizou outro processador de link?'] },
            { tmpl: 'MPE v4', color: 'border-l-amber-500', qs: ['Regime tributário: MEI, Simples Nacional, Lucro Presumido?', 'Faturamento anual declarado?', 'Atividade principal presencial ou online?', 'Já processou pagamentos por cartão/PIX anteriormente?', 'Possui maquininha? De qual operadora?'] },
          ].map((t, i) => (
            <div key={i} className={`border-l-4 ${t.color} pl-3`}>
              <Badge className="text-[10px] bg-slate-100 text-slate-700 border-0 mb-1">{t.tmpl}</Badge>
              <div className="space-y-0.5">
                {t.qs.map((q, j) => (
                  <p key={j} className="text-[9px] text-[#002443]/60 flex items-start gap-1">
                    <span className="text-purple-400 shrink-0">Q{j+1}.</span>{q}
                  </p>
                ))}
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