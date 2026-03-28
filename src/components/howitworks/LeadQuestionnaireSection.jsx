import React, { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle, FileText, Hash, Zap, ClipboardList, CreditCard, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// ═══════════════════════════════════════════════════════════
// 1. LEAD COMPLETO v2.0 — Autocomplete (35 perguntas, 10 etapas)
// ═══════════════════════════════════════════════════════════
const LEAD_COMPLETO_V2_SECTIONS = [
  {
    id: 'A', title: 'Etapa 1 — Tipo de Empresa + CNPJ (Autocomplete)', objective: 'Identificar o tipo de negócio e acionar o autocomplete via BrasilAPI. Ao digitar o CNPJ, o sistema preenche automaticamente: Razão Social, Nome Fantasia, CNAE, Capital Social, Situação Cadastral, MCC sugerido, Site sugerido.', questions: [
      { order: 1, text: 'Sua empresa é principalmente um(a):', type: 'SELECT', required: true, options: ['Merchant (Varejista, E-commerce, SaaS, Serviços)', 'Gateway de Pagamentos / PSP', 'Marketplace'], note: 'Após CNPJ, exibe alerta de coerência CNAE vs tipo selecionado' },
      { order: 2, text: 'CNPJ', type: 'CPF_CNPJ', required: true, note: 'CAMPO GATILHO: ao digitar 14 dígitos, aciona BrasilAPI → preenche 12+ campos' },
      { order: 3, text: 'Razão Social', type: 'TEXT', required: true, note: 'Preenchido automaticamente via CNPJ' },
      { order: 4, text: 'Nome Fantasia', type: 'TEXT', required: false, note: 'Preenchido automaticamente se disponível na Receita Federal' },
      { order: 5, text: 'Site da Empresa', type: 'TEXT', required: false, note: 'Sugestão automática baseada no e-mail da Receita. Validação em background (SiteValidationBadge)' },
    ]
  },
  {
    id: 'B', title: 'Etapa 2 — MCC + Contato', objective: 'Coletar dados de identificação do contato comercial e código MCC (sugerido automaticamente pelo CNAE do CNPJ). Inclui busca interativa de MCC com modal de pesquisa.', questions: [
      { order: 6, text: 'Código MCC', type: 'TEXT', required: true, note: 'Sugerido pelo CNAE do CNPJ. Campo com busca interativa (MCCSearchModal)' },
      { order: 7, text: 'E-mail de Contato', type: 'EMAIL', required: true, note: 'Validação background: domínio corporativo vs pessoal. Se corporativo, sugere site automaticamente' },
      { order: 8, text: 'Celular / WhatsApp', type: 'PHONE', required: true },
      { order: 9, text: 'Nome do Contato', type: 'TEXT', required: true },
      { order: 10, text: 'Cargo do Contato', type: 'SELECT', required: true, options: ['Sócio / Dono', 'Diretor / C-Level', 'Gerente', 'Coordenador', 'Analista', 'Outro'] },
    ]
  },
  {
    id: 'C', title: 'Etapa 3 — Modelo de Negócio + Produto', objective: 'Classificar produtos/serviços e modelo de negócio para qualificação de risco e segmento.', questions: [
      { order: 11, text: 'Tipos de Produtos/Serviços', type: 'MULTI_SELECT', required: true, options: ['Produtos Físicos', 'Produtos Digitais', 'Infoprodutos', 'Serviços Presenciais', 'Serviços Online/Remotos', 'Assinaturas/Recorrência', 'Ingressos/Eventos', 'Educação/Cursos', 'Software/SaaS', 'Marketplace', 'Outro'], note: 'Ao selecionar, exige percentual de cada tipo (soma=100%). Componente ProductTypePercentages' },
      { order: 12, text: 'Segmento de atuação', type: 'SELECT', required: true, options: ['Varejo / E-commerce', 'SaaS / Tecnologia', 'Serviços Financeiros', 'Educação', 'Saúde', 'Alimentação', 'Entretenimento', 'Viagem / Turismo', 'Logística', 'Outro'] },
      { order: 13, text: 'Endereço da Empresa', type: 'TEXT', required: true, note: 'Campo com autocomplete por CEP (LeadAddressField): preenche logradouro, bairro, cidade, UF. Requer confirmação' },
      { order: 14, text: 'Descrição detalhada dos produtos/serviços', type: 'TEXT', required: true, note: 'Textarea com mínimo 75 caracteres + contador' },
      { order: 15, text: 'Canais de venda', type: 'MULTI_SELECT', required: true, options: ['E-commerce Próprio', 'App', 'Link de Pagamento', 'Marketplace', 'Loja Física', 'Redes Sociais', 'WhatsApp', 'Outro'] },
    ]
  },
  {
    id: 'D', title: 'Etapa 4 — Volume Financeiro', objective: 'Capturar TPV, ticket médio e volume. Transações/mês é calculado automaticamente (TPV ÷ Ticket Médio).', questions: [
      { order: 16, text: 'TPV Mensal (R$)', type: 'NUMBER', required: true, note: 'Campo monetário com formatação automática (CurrencyInput)' },
      { order: 17, text: 'Ticket Médio (R$)', type: 'NUMBER', required: true, note: 'Campo monetário. Ao preencher, calcula transações/mês automaticamente' },
      { order: 18, text: 'Estimativa de Transações/Mês', type: 'NUMBER', required: false, note: 'Campo CALCULADO AUTOMATICAMENTE (TPV ÷ Ticket Médio). Read-only' },
      { order: 19, text: 'Expectativa de Crescimento', type: 'SELECT', required: true, options: ['Estável', 'Crescimento moderado (10-30%)', 'Crescimento acelerado (30-100%)', 'Hipercrescimento (100%+)'] },
    ]
  },
  {
    id: 'E', title: 'Etapa 5 — Distribuição TPV + Bandeiras + Parcelamento', objective: 'Capturar a distribuição percentual do volume: por meio de pagamento, por bandeira e por faixa de parcelamento. Cada grupo soma 100%.', questions: [
      { order: 20, text: '% Cartão de Crédito no TPV', type: 'NUMBER', required: true, note: 'Grupo 1 (soma 100%): Crédito + PIX + Boleto. PercentDistributionRow' },
      { order: 21, text: '% PIX no TPV', type: 'NUMBER', required: true },
      { order: 22, text: '% Boleto no TPV', type: 'NUMBER', required: true },
      { order: 23, text: '% Visa nas vendas em cartão', type: 'NUMBER', required: false, note: 'Grupo 2 (soma 100%): Visa + Mastercard + Elo/Outras' },
      { order: 24, text: '% Mastercard nas vendas em cartão', type: 'NUMBER', required: false },
      { order: 25, text: '% Elo / Amex / Outras', type: 'NUMBER', required: false },
      { order: 26, text: '% À Vista (1x) no crédito', type: 'NUMBER', required: false, note: 'Grupo 3 (soma 100%): À Vista + 2-6x + 7-12x' },
      { order: 27, text: '% 2 a 6x no crédito', type: 'NUMBER', required: false },
      { order: 28, text: '% 7 a 12x no crédito', type: 'NUMBER', required: false },
    ]
  },
  {
    id: 'F', title: 'Etapa 6 — Meios de Pagamento + Antecipação', objective: 'Auto-seleciona meios de pagamento baseado nos percentuais preenchidos. Coleta dados de antecipação se aplicável.', questions: [
      { order: 29, text: 'Meios de Pagamento Desejados', type: 'MULTI_SELECT', required: true, options: ['Cartão de Crédito', 'PIX', 'Boleto', 'Cartão de Débito'], note: 'Preenchido automaticamente com base nos % > 0 da etapa anterior' },
      { order: 30, text: 'Sua empresa realiza antecipação de recebíveis?', type: 'BOOLEAN', required: true },
      { order: 31, text: '% do TPV antecipado', type: 'NUMBER', required: false, note: 'Condicional: só aparece se antecipação = Sim' },
      { order: 32, text: 'Taxa de antecipação (% a.m.)', type: 'NUMBER', required: false, note: 'Condicional' },
    ]
  },
  {
    id: 'G', title: 'Etapa 7 — Processador Atual + Taxas de Cartão', objective: 'Capturar processador atual e taxas MDR praticadas por bandeira × faixa de parcelamento (15 campos via CardRatesGroup).', questions: [
      { order: 33, text: 'Processa cartão de crédito/débito hoje?', type: 'BOOLEAN', required: true, note: 'Se Sim → exibe CardRatesGroup (MDR por bandeira). Se Não → exibe ExpectedRatesInput' },
      { order: 34, text: 'Processador de pagamento atual', type: 'SELECT', required: false, options: ['Cielo', 'Rede', 'GetNet', 'Stone', 'PagSeguro', 'Mercado Pago', 'Stripe', 'Adyen', 'Outro'], note: 'Se "Outro", exige descrição' },
      { order: 35, text: 'MDR por bandeira × parcelamento', type: 'CARD_RATES_GROUP', required: false, note: '15 campos: 5 bandeiras × 3 faixas (1x, 2-6x, 7-12x). Componente CardRatesGroup' },
    ]
  },
  {
    id: 'H', title: 'Etapa 8 — Taxas Extras (PIX, Antifraude, Fee)', objective: 'Capturar taxa PIX (% ou fixo), custo antifraude por transação, e fee fixo por transação.', questions: [
      { order: 36, text: 'Taxa PIX atual (tipo + valor)', type: 'SELECT+NUMBER', required: false, note: 'Toggle percentual/fixo + valor numérico' },
      { order: 37, text: 'Custo antifraude por transação (R$)', type: 'NUMBER', required: false },
      { order: 38, text: 'Fee por transação (R$)', type: 'NUMBER', required: false },
      { order: 39, text: 'Taxa 3DS por transação (R$)', type: 'NUMBER', required: false },
    ]
  },
  {
    id: 'I', title: 'Etapa 9 — Informações Complementares', objective: 'Coletar informações qualitativas: dores, motivo de mudança, expectativas.', questions: [
      { order: 40, text: 'Principais dores com o processador atual', type: 'TEXT', required: false },
      { order: 41, text: 'O que espera da PagSmile?', type: 'TEXT', required: false },
      { order: 42, text: 'Upload de proposta de concorrente', type: 'FILE_UPLOAD', required: false, note: 'Aceita PDF, JPG, PNG. Upload via base44.integrations.Core.UploadFile' },
    ]
  },
  {
    id: 'CONF', title: 'Etapa 10 — Confirmação e Envio', objective: 'Revisão completa de todas as respostas (ConfirmationReview), aceite de termos e envio. Gera protocolo PAG-QL-YYYY-NNNNN.', questions: [
      { order: 43, text: 'Revisão de todas as respostas', type: 'REVIEW', required: true, note: 'Componente ConfirmationReview: mostra todas as respostas em formato resumido com botão "Editar" por seção' },
      { order: 44, text: 'Aceite dos Termos e Condições', type: 'BOOLEAN', required: true },
      { order: 45, text: 'Aceite da Política de Privacidade', type: 'BOOLEAN', required: true },
    ]
  },
];

const LEAD_COMPLETO_V2_FEATURES = [
  'Autocomplete CNPJ via BrasilAPI (12+ campos)',
  'Alerta de coerência CNAE vs tipo de empresa',
  'Validação de e-mail corporativo vs pessoal',
  'Sugestão automática de site a partir do e-mail',
  'Autocomplete de endereço por CEP',
  'Cálculo automático de transações/mês',
  'Auto-seleção de meios de pagamento',
  'CardRatesGroup: 15 campos MDR por bandeira',
  'ProductTypePercentages: soma obrigatória 100%',
  'PercentDistributionRow: 3 grupos com soma 100%',
  'Auto-save a cada 2 segundos (localStorage)',
  'Silent Flags: 15+ flags invisíveis ao lead',
  'Enriquecimento CNPJ completo para análise interna',
  'Geração de protocolo PAG-QL-YYYY-NNNNN',
];

// ═══════════════════════════════════════════════════════════
// 2. QUESTIONÁRIO PIX (15 campos, página única)
// ═══════════════════════════════════════════════════════════
const LEAD_PIX_SECTIONS = [
  {
    id: 'A', title: 'Dados da Empresa', objective: 'Coleta rápida de dados cadastrais para qualificação de lead focado exclusivamente em PIX.', questions: [
      { order: 1, text: 'Nome da Empresa / Razão Social', type: 'TEXT', required: true },
      { order: 2, text: 'CNPJ', type: 'CPF_CNPJ', required: false },
      { order: 3, text: 'Nome do Contato', type: 'TEXT', required: false },
      { order: 4, text: 'E-mail de Contato', type: 'EMAIL', required: true },
      { order: 5, text: 'Telefone de Contato', type: 'PHONE', required: false },
      { order: 6, text: 'Modelo de atuação principal', type: 'SELECT', required: true, options: ['Gateway', 'Seller', 'Marketplace'] },
    ]
  },
  {
    id: 'B', title: 'Volume PIX', objective: 'Capturar volume transacional em PIX e modelo de negócio.', questions: [
      { order: 7, text: 'TPV Mensal em PIX (R$)', type: 'NUMBER', required: true },
      { order: 8, text: 'Ticket Médio PIX (R$)', type: 'NUMBER', required: true },
      { order: 9, text: 'Volume Transações/Mês', type: 'NUMBER', required: false, note: 'Calculado automaticamente (TPV ÷ Ticket Médio)' },
      { order: 10, text: 'Modelo de Negócio', type: 'TEXT', required: false },
      { order: 11, text: 'O que vende/comercializa?', type: 'TEXT', required: false },
    ]
  },
  {
    id: 'C', title: 'Situação Atual', objective: 'Entender a situação competitiva para calibrar a proposta PIX.', questions: [
      { order: 12, text: 'Parceiros atuais de PIX', type: 'TEXT', required: false },
      { order: 13, text: 'Quanto paga por PIX atualmente? (R$ ou %)', type: 'TEXT', required: false },
      { order: 14, text: 'Principais dores', type: 'TEXT', required: false },
      { order: 15, text: 'Upload de proposta de concorrente', type: 'FILE_UPLOAD', required: false, note: 'PDF, JPG, PNG, DOC' },
    ]
  },
];

// ═══════════════════════════════════════════════════════════
// 3. QUESTIONÁRIO SIMPLIFICADO (Pós-Reunião, 18 campos)
// ═══════════════════════════════════════════════════════════
const LEAD_SIMPLIFICADO_SECTIONS = [
  {
    id: 'A', title: 'Dados da Empresa', objective: 'Coleta de dados básicos da empresa para vínculo com lead.', questions: [
      { order: 1, text: 'Nome da Empresa', type: 'TEXT', required: true },
      { order: 2, text: 'CNPJ', type: 'CPF_CNPJ', required: true, note: 'Com formatação automática' },
    ]
  },
  {
    id: 'B', title: 'Dados do Respondente', objective: 'Dados da pessoa que preencheu (quem participou da reunião).', questions: [
      { order: 3, text: 'Nome', type: 'TEXT', required: true },
      { order: 4, text: 'E-mail', type: 'EMAIL', required: true },
      { order: 5, text: 'Telefone', type: 'PHONE', required: true, note: 'Com formatação automática' },
      { order: 6, text: 'Cargo', type: 'TEXT', required: true },
    ]
  },
  {
    id: 'C', title: 'Taxas de Crédito Atuais (%)', objective: 'Coletar taxas MDR por bandeira que o cliente paga hoje para benchmark. Usa componente TaxasPorBandeiraInput (Visa, Master, Elo, Amex, Outras).', questions: [
      { order: 7, text: 'Crédito 1x (À Vista) por bandeira', type: 'RATES_BY_BRAND', required: false, note: 'TaxasPorBandeiraInput: 5 bandeiras (Visa, Master, Elo, Amex, Outras)' },
      { order: 8, text: 'Crédito 2-6x por bandeira', type: 'RATES_BY_BRAND', required: false },
      { order: 9, text: 'Crédito 7-12x por bandeira', type: 'RATES_BY_BRAND', required: false },
    ]
  },
  {
    id: 'D', title: 'Antecipação', objective: 'Capturar se o cliente usa antecipação e a que taxa.', questions: [
      { order: 10, text: 'Utiliza antecipação?', type: 'BOOLEAN', required: false },
      { order: 11, text: '% do TPV antecipado', type: 'NUMBER', required: false, note: 'Condicional: apenas se usa antecipação' },
      { order: 12, text: 'Taxa de antecipação (% a.m.)', type: 'NUMBER', required: false },
    ]
  },
  {
    id: 'E', title: 'Distribuição de Pagamentos (%)', objective: 'Mix de vendas por faixa de parcelamento.', questions: [
      { order: 13, text: '% À Vista', type: 'NUMBER', required: false },
      { order: 14, text: '% 2-6x', type: 'NUMBER', required: false },
      { order: 15, text: '% 7-12x', type: 'NUMBER', required: false },
    ]
  },
  {
    id: 'F', title: 'Outras Taxas', objective: 'PIX, antifraude e fee por transação.', questions: [
      { order: 16, text: 'Taxa PIX (tipo: percentual ou fixo + valor)', type: 'SELECT+NUMBER', required: false },
      { order: 17, text: 'Taxa Antifraude (centavos)', type: 'NUMBER', required: false },
      { order: 18, text: 'Fee por transação (centavos)', type: 'NUMBER', required: false, note: 'Toggle: paga fee? Sim/Não → campo valor' },
    ]
  },
];

// ═══════════════════════════════════════════════════════════
// 4. QUESTIONÁRIO DE REUNIÃO (IA) — 25+ campos
// ═══════════════════════════════════════════════════════════
const LEAD_REUNIAO_SECTIONS = [
  {
    id: 'A', title: 'Dados Básicos', objective: 'Informações iniciais do lead coletadas na reunião comercial.', questions: [
      { order: 1, text: 'Nome da Empresa', type: 'TEXT', required: true },
      { order: 2, text: 'CNPJ', type: 'CPF_CNPJ', required: false },
      { order: 3, text: 'Nome do Contato', type: 'TEXT', required: true },
      { order: 4, text: 'E-mail do Contato', type: 'EMAIL', required: true },
      { order: 5, text: 'Telefone', type: 'PHONE', required: false },
      { order: 6, text: 'Cargo', type: 'TEXT', required: false },
    ]
  },
  {
    id: 'B', title: 'Detalhes do Negócio', objective: 'Classificação comercial do lead.', questions: [
      { order: 7, text: 'Tipo de Empresa', type: 'SELECT', required: true, options: ['Merchant', 'Gateway', 'Marketplace'] },
      { order: 8, text: 'Segmento', type: 'SELECT', required: false, options: ['E-commerce', 'SaaS', 'Educação', 'Infoprodutos', 'Serviços', 'Marketplace', 'Dropshipping', 'Outro'] },
      { order: 9, text: 'Descrição do negócio', type: 'TEXT', required: false },
      { order: 10, text: 'MCC', type: 'TEXT', required: false },
    ]
  },
  {
    id: 'C', title: 'Volume & Financeiro', objective: 'Dados volumétricos para dimensionamento da proposta.', questions: [
      { order: 11, text: 'TPV Mensal (R$)', type: 'NUMBER', required: true },
      { order: 12, text: 'Ticket Médio (R$)', type: 'NUMBER', required: false },
      { order: 13, text: 'Transações/Mês', type: 'NUMBER', required: false, note: 'Calculado automaticamente' },
      { order: 14, text: 'Expectativa de Crescimento', type: 'SELECT', required: false },
    ]
  },
  {
    id: 'D', title: 'Taxas Atuais', objective: 'Taxas praticadas pelo lead para benchmark e calibração da proposta.', questions: [
      { order: 15, text: 'MDR Crédito 1x (%)', type: 'NUMBER', required: false },
      { order: 16, text: 'MDR Crédito 2-6x (%)', type: 'NUMBER', required: false },
      { order: 17, text: 'MDR Crédito 7-12x (%)', type: 'NUMBER', required: false },
      { order: 18, text: 'Taxa Antecipação (% a.m.)', type: 'NUMBER', required: false },
      { order: 19, text: 'Fee por Transação (R$)', type: 'NUMBER', required: false },
      { order: 20, text: 'Taxa Antifraude (R$)', type: 'NUMBER', required: false },
      { order: 21, text: 'Taxa 3DS (R$)', type: 'NUMBER', required: false },
      { order: 22, text: 'Taxa PIX (tipo + valor)', type: 'SELECT+NUMBER', required: false },
    ]
  },
  {
    id: 'E', title: 'Dores & Expectativas', objective: 'Informações qualitativas para personalização do approach comercial.', questions: [
      { order: 23, text: 'Processador atual', type: 'TEXT', required: false },
      { order: 24, text: 'Principais dores', type: 'TEXT', required: false },
      { order: 25, text: 'O que busca na PagSmile', type: 'TEXT', required: false },
    ]
  },
];

const LEAD_REUNIAO_FEATURES = [
  'Aba "Questionário Manual": preenchimento pelo time comercial durante/após reunião',
  'Aba "Robô IA": cola notas brutas de reunião → IA extrai dados estruturados automaticamente',
  'IA (ProcessMeetingNotes) gera lead completo a partir de texto livre',
  'Versão PIX: QuestionarioReuniaoPix com campos simplificados focados em PIX',
];

// ═══════════════════════════════════════════════════════════
// UI COMPONENTS (SectionBlock / DocumentsList)
// ═══════════════════════════════════════════════════════════

function SectionBlock({ section, isOpen, onToggle }) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-2">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-3 hover:bg-slate-50/50 transition-colors text-left">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Badge className="bg-[#002443] text-white border-0 text-[10px] shrink-0">{section.id}</Badge>
          <span className="text-xs font-bold text-[#002443] truncate">{section.title}</span>
          <Badge variant="outline" className="text-[10px] shrink-0">{section.questions.length} campos</Badge>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {isOpen && (
        <div className="px-3 pb-3 border-t border-slate-100">
          <div className="bg-blue-50 rounded-lg p-2.5 my-2 border border-blue-100">
            <p className="text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-0.5">Objetivo</p>
            <p className="text-xs text-blue-700 leading-relaxed">{section.objective}</p>
          </div>
          <div className="space-y-1">
            {section.questions.map((q, i) => (
              <div key={i} className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-slate-50 text-xs">
                <Badge variant="outline" className="text-[9px] shrink-0 mt-0.5 font-mono w-7 justify-center">{q.order}</Badge>
                <div className="flex-1 min-w-0">
                  <span className="text-[#002443]/80">{q.text}</span>
                  <div className="flex gap-1 mt-0.5 flex-wrap">
                    <Badge className="text-[8px] bg-slate-100 text-slate-600 border-0">{q.type}</Badge>
                    {q.required && <Badge className="text-[8px] bg-green-50 text-green-700 border-0">Obrigatório</Badge>}
                    {!q.required && <Badge className="text-[8px] bg-slate-50 text-slate-400 border-0">Opcional</Badge>}
                    {q.options && <Badge className="text-[8px] bg-purple-50 text-purple-600 border-0">{q.options.length} opções</Badge>}
                  </div>
                  {q.note && (
                    <p className="text-[9px] text-[#2bc196] mt-0.5 leading-tight italic">⚡ {q.note}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function FeaturesList({ features, color = 'emerald' }) {
  return (
    <div className={`bg-${color}-50 rounded-xl p-4 border border-${color}-100`}>
      <h5 className={`text-xs font-bold text-${color}-800 uppercase tracking-wider mb-2 flex items-center gap-1.5`}>
        <Zap className="w-3.5 h-3.5" />Features Especiais
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
        {features.map((f, i) => (
          <div key={i} className="flex items-start gap-1.5 text-[10px] text-[#002443]/70">
            <span className="text-[#2bc196] shrink-0 mt-0.5">✓</span>
            <span>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════

export default function LeadQuestionnaireSection() {
  const [openSections, setOpenSections] = useState({});
  const [activeTab, setActiveTab] = useState('completo_v2');

  const toggle = (id) => setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));

  const tabs = [
    {
      id: 'completo_v2',
      label: 'Lead Completo v2.0',
      badge: '45 campos',
      badgeColor: 'bg-blue-100 text-blue-700',
      desc: '10 etapas • Autocomplete CNPJ • Wizard',
      color: 'blue',
      icon: ClipboardList,
      sections: LEAD_COMPLETO_V2_SECTIONS,
      features: LEAD_COMPLETO_V2_FEATURES,
      summary: 'Questionário principal para captação de leads via link público. 10 etapas tipo wizard com auto-save, autocomplete de CNPJ via BrasilAPI (12+ campos preenchidos automaticamente), validações em background, cálculos automáticos, e silent flags invisíveis ao lead. Gera protocolo PAG-QL-YYYY-NNNNN.',
    },
    {
      id: 'pix',
      label: 'Lead PIX',
      badge: '15 campos',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      desc: '3 seções • Página única',
      color: 'emerald',
      icon: Zap,
      sections: LEAD_PIX_SECTIONS,
      features: [
        'Página única (sem wizard multi-step)',
        'Upload de proposta de concorrente',
        'Cálculo automático de transações/mês',
        'Gera protocolo PIX-YYYY-NNNNN',
        'Vinculação automática com Introducer via link',
      ],
      summary: 'Questionário simplificado focado exclusivamente em PIX. Página única com 3 seções (empresa, volume PIX, situação atual). Ideal para leads que não precisam de cartão de crédito.',
    },
    {
      id: 'simplificado',
      label: 'Simplificado (Pós-Reunião)',
      badge: '18 campos',
      badgeColor: 'bg-amber-100 text-amber-700',
      desc: '6 seções • Taxas por bandeira',
      color: 'amber',
      icon: CreditCard,
      sections: LEAD_SIMPLIFICADO_SECTIONS,
      features: [
        'Foco em taxas praticadas (benchmark)',
        'TaxasPorBandeiraInput: 5 bandeiras × 3 faixas',
        'Toggle de antecipação com campos condicionais',
        'Distribuição de parcelamento (%)',
        'Gera protocolo PAG-QS-YYYY-NNNNN',
        'Entidade separada: QuestionarioSimplificado',
      ],
      summary: 'Usado pelo time comercial após reunião para registrar as taxas que o cliente paga hoje. Foco total em benchmark: taxas MDR por bandeira, antecipação, distribuição de pagamentos, PIX e fees.',
    },
    {
      id: 'reuniao',
      label: 'Questionário de Reunião',
      badge: '25 campos',
      badgeColor: 'bg-purple-100 text-purple-700',
      desc: '5 seções • Manual + Robô IA',
      color: 'purple',
      icon: FileText,
      sections: LEAD_REUNIAO_SECTIONS,
      features: LEAD_REUNIAO_FEATURES,
      summary: 'Questionário para uso interno do time comercial durante ou após reunião. Possui duas abas: preenchimento manual (dados estruturados) e "Robô IA" (cola notas brutas → ProcessMeetingNotes extrai dados automaticamente). Versão PIX também disponível.',
    },
  ];

  const active = tabs.find(t => t.id === activeTab);

  return (
    <div className="space-y-4">
      {/* Tab selector */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => { setActiveTab(tab.id); setOpenSections({}); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${activeTab === tab.id ? 'bg-[#002443] text-white border-[#002443]' : 'bg-white text-[#002443] border-slate-200 hover:border-[#2bc196]'}`}
          >
            <div className="flex items-center gap-2">
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              <Badge className={`${tab.badgeColor} border-0 text-[10px]`}>{tab.badge}</Badge>
            </div>
            <p className={`text-[10px] mt-0.5 ${activeTab === tab.id ? 'text-white/60' : 'text-[#002443]/40'}`}>{tab.desc}</p>
          </button>
        ))}
      </div>

      {/* Info card */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <div className="flex items-center gap-2 mb-1">
          <Hash className="w-4 h-4" />
          <h4 className="font-bold text-sm">Lead — {active.label}</h4>
          <Badge className="bg-blue-200 text-blue-800 border-0 text-[10px]">{active.badge}</Badge>
        </div>
        <p className="text-xs text-[#002443]/60 leading-relaxed">{active.summary}</p>
      </div>

      {/* Sections */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-[#002443]">Todas as Seções e Campos</h4>
          <button onClick={() => {
            const allOpen = {};
            active.sections.forEach(s => allOpen[s.id] = true);
            setOpenSections(allOpen);
          }} className="text-[10px] text-[#2bc196] font-bold hover:underline">Expandir todas</button>
        </div>
        {active.sections.map(section => (
          <SectionBlock key={section.id} section={section} isOpen={openSections[section.id]} onToggle={() => toggle(section.id)} />
        ))}
      </div>

      {/* Features */}
      {active.features && <FeaturesList features={active.features} />}
    </div>
  );
}