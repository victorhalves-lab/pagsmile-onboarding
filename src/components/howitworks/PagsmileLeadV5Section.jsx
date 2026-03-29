import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Zap, Hash, ShieldAlert, Store, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const STEPS = [
  {
    id: '1', title: 'Etapa 1 — Segmento (10 opções)', objective: 'O lead seleciona seu segmento dentre 10 cards visuais com ícone + descrição. Agrupados em 2 categorias: Intermediários (Gateway, Marketplace, Plataforma Vertical) e Merchants (E-commerce, Dropshipping, Infoprodutos, SaaS, Educação, Link de Pagamento, MPE).',
    questions: [
      { order: 1, text: 'Selecione o segmento que melhor descreve seu negócio', type: 'SEGMENT_CARDS', required: true, note: '10 cards: Gateway/PSP, Marketplace, Plataforma Vertical, E-commerce, Dropshipping, Infoprodutos, SaaS, Educação, Link de Pagamento, MPE. Cada card tem ícone, label, descrição explicativa e grupo (intermediário vs merchant).' },
    ]
  },
  {
    id: '2', title: 'Etapa 2 — Dados da Empresa', objective: 'Coleta CNPJ com autocomplete BrasilAPI (14+ campos), e-mail corporativo com detecção de domínio pessoal, telefone, nome do contato e cargo.',
    questions: [
      { order: 2, text: 'CNPJ', type: 'CPF_CNPJ', required: true, note: 'Autocomplete BrasilAPI: Razão Social, Nome Fantasia, CNAE, Capital Social, Situação, UF, Município, Logradouro, CEP, Data Abertura, Porte, Natureza Jurídica, Sócios' },
      { order: 3, text: 'Razão Social', type: 'TEXT', required: true, note: 'Auto-preenchido via CNPJ. Read-only após enriquecimento.' },
      { order: 4, text: 'Nome Fantasia', type: 'TEXT', required: false, note: 'Auto-preenchido se disponível na Receita Federal' },
      { order: 5, text: 'E-mail do contato', type: 'EMAIL', required: true, note: 'Detecta domínio pessoal (Gmail/Hotmail) → flag PERSONAL_EMAIL. Se corporativo, sugere website.' },
      { order: 6, text: 'Telefone/WhatsApp', type: 'PHONE', required: true },
      { order: 7, text: 'Nome do contato', type: 'TEXT', required: true },
      { order: 8, text: 'Cargo', type: 'SELECT', required: true, note: '6 opções: Sócio/Proprietário, CEO/Diretor, Gerente, Financeiro, TI, Marketing' },
    ]
  },
  {
    id: '3', title: 'Etapa 3 — Modelo de Negócio (Condicional por Segmento)', objective: 'Perguntas condicionais baseadas no segmento selecionado. Gateway: licença BCB, split, sub-sellers. Marketplace: take rate, KYC sellers. Infoprodutos: afiliados, garantia. SaaS: churn, pricing. Plataforma Vertical: vertical, estabelecimentos.',
    questions: [
      { order: 9, text: 'Modelo de Cobrança', type: 'BUTTON_SELECT', required: true, note: '4 opções: Venda única, Parcelado 2-12x, Assinatura/Recorrência, Ambos' },
      { order: 10, text: 'Presença Digital (site)', type: 'TEXT', required: false, note: 'Se vazio → flag NO_WEBSITE' },
      { order: 11, text: '[Gateway] Licença BCB?', type: 'SELECT', required: false, note: 'CONDICIONAL: só aparece se segmento=gateway. 4 opções: Sim licença própria, Via BaaS, Não, Não sei' },
      { order: 12, text: '[Gateway] Split de pagamento?', type: 'SELECT', required: false, note: 'CONDICIONAL: 3 opções: Automático, Manual, Não' },
      { order: 13, text: '[Gateway/Marketplace/Plataforma] Quantidade sub-sellers/sellers/estabelecimentos', type: 'SELECT', required: false, note: 'CONDICIONAL para intermediários. 5 opções: Até 50, 51-200, 201-1k, 1k-5k, >5k' },
      { order: 14, text: '[Marketplace] Take rate (%)', type: 'SELECT', required: false, note: 'CONDICIONAL: <5%, 5-10%, 10-20%, 20-30%, >30%' },
      { order: 15, text: '[Marketplace] KYC dos sellers?', type: 'SELECT', required: false, note: 'CONDICIONAL: Sim completo, Sim básico, Não faço, Em implantação' },
      { order: 16, text: '[Infoprodutos] Rede de afiliados?', type: 'SELECT', required: false, note: 'CONDICIONAL: Sem afiliados, Até 10, 10-100, >100, Rede (Hotmart/Eduzz)' },
      { order: 17, text: '[Infoprodutos] Garantia de reembolso?', type: 'SELECT', required: false, note: 'CONDICIONAL: 7d, 15d, 30d, Sem, Condicional. 30d+ → flag HIGH_REFUND_POLICY' },
      { order: 18, text: '[Infoprodutos] % vendas via afiliados', type: 'SELECT', required: false, note: 'CONDICIONAL: 0%, <20%, 20-50%, >50%' },
      { order: 19, text: '[SaaS] Churn mensal', type: 'SELECT', required: false, note: 'CONDICIONAL: <2%, 2-5%, 5-10%, >10%, Não sei' },
      { order: 20, text: '[SaaS] Modelo de pricing', type: 'SELECT', required: false, note: 'CONDICIONAL: Flat mensal, Per-user, Tiers/planos, Usage-based, Freemium + paid' },
      { order: 21, text: '[Plataforma Vertical] Vertical', type: 'SELECT', required: false, note: 'CONDICIONAL: Foodtech/Delivery, PDV/Loja, Agendamento, Ticketing, Fitness' },
      { order: 22, text: '[E-commerce/Dropshipping/Infoprodutos/Plataforma] Plataforma', type: 'SELECT', required: false, note: 'CONDICIONAL: opções variam por segmento. E-commerce: VTEX, Nuvemshop, Tray, Shopify, WooCommerce, etc.' },
    ]
  },
  {
    id: '4', title: 'Etapa 4 — Volumetria', objective: 'TPV mensal, ticket médio, transações calculadas automaticamente. SliderDistribution para split PIX/Crédito/Débito/Boleto.',
    questions: [
      { order: 23, text: 'TPV Mensal (R$)', type: 'CURRENCY', required: true, note: 'CurrencyNumberInput com formatação automática' },
      { order: 24, text: 'Ticket Médio (R$)', type: 'CURRENCY', required: true },
      { order: 25, text: 'Transações/mês (calculado)', type: 'NUMBER', required: false, note: 'Auto-calculado: TPV ÷ Ticket Médio. Read-only.' },
    ]
  },
  {
    id: '5', title: 'Etapa 5 — Distribuição de Pagamentos', objective: 'Slider visual para distribuição % entre PIX, Crédito, Débito e Boleto (soma = 100%). Componente SliderDistribution interativo.',
    questions: [
      { order: 26, text: 'Distribuição % por método (PIX/Crédito/Débito/Boleto)', type: 'SLIDER_DISTRIBUTION', required: true, note: 'SliderDistribution: 4 sliders acoplados que somam 100%. Visual e intuitivo.' },
    ]
  },
  {
    id: '6', title: 'Etapa 6 — Taxas Atuais', objective: 'Captura se já processa, processador atual, satisfação, sabe suas taxas. Se sabe: MDR por bandeira × 3 faixas.',
    questions: [
      { order: 27, text: 'Já processa pagamentos?', type: 'BUTTON_SELECT', required: true, note: '2 opções: Sim / Não estou começando. Se "Não" → flag NEW_MERCHANT' },
      { order: 28, text: '[Se já processa] Processador atual', type: 'SELECT', required: false, note: 'CONDICIONAL: 14 opções (Cielo, Rede, Stone, PagSeguro, etc.)' },
      { order: 29, text: '[Se já processa] Satisfação', type: 'SELECT', required: false, note: 'CONDICIONAL: 5 opções. Insatisfeito/Muito insatisfeito → bônus score' },
      { order: 30, text: '[Se já processa] Sabe suas taxas?', type: 'SELECT', required: false, note: 'CONDICIONAL: 3 opções: Sei exatamente, Mais ou menos, Não sei' },
      { order: 31, text: '[Se sabe taxas] MDR Crédito 1x (%)', type: 'PERCENT', required: false, note: 'CONDICIONAL duplo: só aparece se já processa + sabe taxas' },
      { order: 32, text: '[Se sabe taxas] MDR 2-6x (%)', type: 'PERCENT', required: false },
      { order: 33, text: '[Se sabe taxas] MDR 7-12x (%)', type: 'PERCENT', required: false },
      { order: 34, text: '[Se sabe taxas] Antecipação', type: 'SELECT', required: false, note: 'CONDICIONAL: D+0/D+1, D+15/D+30, Não uso, Não sei' },
    ]
  },
  {
    id: '7', title: 'Etapa 7 — Compliance & Risco (Flags Silenciosas)', objective: 'Perguntas de compliance: antifraude, chargeback, MED PIX, conta encerrada. Respostas alimentam as 16 flags silenciosas invisíveis ao lead.',
    questions: [
      { order: 35, text: '[Segmentos com cartão] Antifraude', type: 'SELECT', required: false, note: 'CONDICIONAL por segmento. 4 opções: Antifraude + 3DS, Só antifraude, Só 3DS, Não possuo. Sem antifraude + TPV>100k → flag NO_ANTIFRAUDE' },
      { order: 36, text: 'Taxa de chargeback (últimos 3 meses)', type: 'SELECT', required: true, note: '5 opções: <1% (saudável), 1-2% (atenção), >2% (crítico), Não sei, N/A. >2% → flag HIGH_CHARGEBACK' },
      { order: 37, text: 'MED PIX (contestações)', type: 'SELECT', required: true, note: '5 opções: N/A, <0,3%, 0,3-0,5%, 0,5-1%, >1%. >1% → flag HIGH_MED_PIX' },
      { order: 38, text: 'Já teve conta encerrada/cancelada?', type: 'SELECT', required: true, note: '3 opções: Nunca, Sim 1 vez, Sim mais de 1 vez. Se ≠ Nunca → flag TERMINATED_BEFORE' },
    ]
  },
  {
    id: '8', title: 'Etapa 8 — Endereço', objective: 'CEP com autocomplete automático. Preenche logradouro, bairro, cidade, UF.',
    questions: [
      { order: 39, text: 'CEP', type: 'TEXT', required: true, note: 'Autocomplete: ao digitar 8 dígitos, busca ViaCEP e preenche endereço automaticamente' },
      { order: 40, text: 'Endereço completo (auto-preenchido)', type: 'TEXT', required: true, note: 'Logradouro, bairro, cidade, UF preenchidos automaticamente' },
    ]
  },
  {
    id: '9', title: 'Etapa 9 — Porte & Marketing', objective: 'Faturamento anual, funcionários, como conheceu a Pagsmile.',
    questions: [
      { order: 41, text: 'Faturamento anual', type: 'SELECT', required: true, note: '6 faixas: Até R$81k (MEI), Até R$360k (ME), Até R$4,8M (EPP), R$4,8M-R$20M, R$20M-R$100M, Acima R$100M. Cruza com TPV → flag TPV_EXCEEDS_REVENUE' },
      { order: 42, text: 'Funcionários', type: 'SELECT', required: true, note: '6 opções: Só eu, 2-5, 6-20, 21-100, 101-500, >500' },
      { order: 43, text: 'Como conheceu a Pagsmile?', type: 'SELECT', required: false, note: '5 opções: Google, Indicação, LinkedIn, Evento, Parceiro' },
    ]
  },
  {
    id: '10', title: 'Etapa 10 — Fechamento & Score', objective: 'Urgência, expectativa de crescimento, dores. Score calculado em tempo real (0-100) com label (Muito Quente/Quente/Morno/Frio).',
    questions: [
      { order: 44, text: 'Urgência', type: 'SELECT', required: true, note: '4 opções: Imediato (<1 semana) → +15 score, Este mês, Próximos 2-3 meses, Estou apenas cotando → flag JUST_QUOTING' },
      { order: 45, text: 'Expectativa de crescimento', type: 'SELECT', required: true, note: '4 opções: Manter estável, Até 30%, 30-100%, Mais que dobrar → +5 score' },
      { order: 46, text: 'Principais dores com o processador atual', type: 'MULTI_SELECT', required: false, note: '6 opções: Taxas altas, Suporte ruim, Instabilidade, Demora liquidação, Falta funcionalidades, Chargeback alto' },
    ]
  },
];

const FLAGS_LIST = [
  { key: 'PERSONAL_EMAIL', desc: 'E-mail de domínio pessoal (Gmail, Hotmail, etc.)', trigger: 'Domínio do e-mail está na lista FREE_EMAIL_DOMAINS' },
  { key: 'NO_WEBSITE', desc: 'Lead não tem website/presença digital', trigger: 'Campo presencaDigital vazio ou "Não possuo"' },
  { key: 'NO_ANTIFRAUDE', desc: 'Sem antifraude com TPV >R$100k', trigger: 'antifraude="Não possuo" + segmento e-commerce/dropshipping + TPV>100k' },
  { key: 'HIGH_CHARGEBACK', desc: 'Chargeback >2% (nível crítico)', trigger: 'chargeback=">2% (crítico)"' },
  { key: 'HIGH_MED_PIX', desc: 'MED PIX >1% (contestações altas)', trigger: 'medPix=">1%"' },
  { key: 'TERMINATED_BEFORE', desc: 'Já teve conta encerrada/cancelada', trigger: 'encerrado ≠ "Nunca"' },
  { key: 'TPV_EXCEEDS_REVENUE', desc: 'TPV mensal × 12 > faturamento anual', trigger: 'Cálculo: TPV×12 > limite da faixa de faturamento' },
  { key: 'NEW_MERCHANT', desc: 'Nunca processou pagamentos', trigger: 'jaProcessa="Não, estou começando"' },
  { key: 'CNPJ_SITUACAO_IRREGULAR', desc: 'CNPJ com situação ≠ Ativa na Receita', trigger: 'Dados BrasilAPI: situacao_cadastral não contém "ativa"' },
  { key: 'EMPRESA_NOVA', desc: 'Empresa aberta há menos de 6 meses', trigger: 'Dados BrasilAPI: data_abertura < 6 meses atrás' },
  { key: 'SETOR_REGULADO', desc: 'CNAE principal em setor financeiro (64/65/66)', trigger: 'Primeiros 2 dígitos do cnae_fiscal = 64, 65 ou 66' },
  { key: 'CNAE_MISMATCH', desc: 'CNAE inconsistente com segmento selecionado', trigger: 'Componente CnaeCoherenceAlert detecta incompatibilidade' },
  { key: 'VOLUME_INCOMPATIVEL', desc: 'Volume declarado incompatível com porte', trigger: 'Cruzamento porte × volume (regras complexas)' },
  { key: 'JUST_QUOTING', desc: 'Lead apenas cotando (sem urgência)', trigger: 'urgencia="Estou apenas cotando"' },
  { key: 'LOW_TICKET', desc: 'Ticket médio < R$10', trigger: 'ticketMedio > 0 e ticketMedio < 10' },
  { key: 'HIGH_REFUND_POLICY', desc: 'Garantia 30d+ (alto risco de reembolso)', trigger: 'garantia="30 dias" ou "Garantia condicional"' },
];

function StepBlock({ step, isOpen, onToggle }) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-2">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-3 hover:bg-slate-50/50 transition-colors text-left">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Badge className="bg-[#2bc196] text-white border-0 text-[10px] shrink-0">{step.id}</Badge>
          <span className="text-xs font-bold text-[#002443] truncate">{step.title}</span>
          <Badge variant="outline" className="text-[10px] shrink-0">{step.questions.length} campos</Badge>
          {step.questions.some(q => q.note?.includes('CONDICIONAL')) && <Badge className="bg-purple-50 text-purple-600 border-0 text-[10px] shrink-0">Condicional</Badge>}
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {isOpen && (
        <div className="px-3 pb-3 border-t border-slate-100">
          <div className="bg-[#2bc196]/5 rounded-lg p-2.5 my-2 border border-[#2bc196]/20">
            <p className="text-[10px] font-bold text-[#2bc196] uppercase tracking-wider mb-0.5">Objetivo</p>
            <p className="text-xs text-[#002443]/70 leading-relaxed">{step.objective}</p>
          </div>
          <div className="space-y-1">
            {step.questions.map((q, i) => (
              <div key={i} className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-slate-50 text-xs">
                <Badge variant="outline" className="text-[9px] shrink-0 mt-0.5 font-mono w-7 justify-center">{q.order}</Badge>
                <div className="flex-1 min-w-0">
                  <span className="text-[#002443]/80">{q.text}</span>
                  <div className="flex gap-1 mt-0.5 flex-wrap">
                    <Badge className="text-[8px] bg-slate-100 text-slate-600 border-0">{q.type}</Badge>
                    {q.required && <Badge className="text-[8px] bg-green-50 text-green-700 border-0">Obrigatório</Badge>}
                    {!q.required && <Badge className="text-[8px] bg-slate-50 text-slate-400 border-0">Opcional</Badge>}
                  </div>
                  {q.note && <p className="text-[9px] text-[#2bc196] mt-0.5 leading-tight italic">⚡ {q.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PagsmileLeadV5Section() {
  const [openSteps, setOpenSteps] = useState({});
  const toggle = (id) => setOpenSteps(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#2bc196] to-[#36706c] rounded-2xl p-5 text-white">
        <h3 className="text-lg font-bold mb-2">Questionário Pagsmile v5.0 — Questionário de Leads com Segmentação</h3>
        <p className="text-white/90 text-sm leading-relaxed mb-3">
          Questionário avançado com 10 segmentos granulares, perguntas condicionais por vertical, 
          scoring automático 0-100, 16 flags silenciosas invisíveis ao lead, autocomplete CNPJ/CEP 
          e pré-preenchimento inteligente para compliance v4.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          <div className="bg-white/15 rounded-xl p-2.5 text-center">
            <p className="text-xl font-extrabold">10</p>
            <p className="text-[10px] text-white/70">Segmentos</p>
          </div>
          <div className="bg-white/15 rounded-xl p-2.5 text-center">
            <p className="text-xl font-extrabold">46</p>
            <p className="text-[10px] text-white/70">Perguntas base</p>
          </div>
          <div className="bg-white/15 rounded-xl p-2.5 text-center">
            <p className="text-xl font-extrabold">18</p>
            <p className="text-[10px] text-white/70">Condicionais</p>
          </div>
          <div className="bg-white/15 rounded-xl p-2.5 text-center">
            <p className="text-xl font-extrabold">16</p>
            <p className="text-[10px] text-white/70">Flags silenciosas</p>
          </div>
          <div className="bg-white/15 rounded-xl p-2.5 text-center">
            <p className="text-xl font-extrabold">0-100</p>
            <p className="text-[10px] text-white/70">Score automático</p>
          </div>
        </div>
      </div>

      {/* Segmentos */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <h4 className="text-sm font-bold text-[#002443] mb-3 flex items-center gap-2"><Store className="w-4 h-4 text-[#2bc196]" />10 Segmentos Disponíveis</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[
            { icon: '🔗', name: 'Gateway/PSP', group: 'Intermediário' },
            { icon: '🏪', name: 'Marketplace', group: 'Intermediário' },
            { icon: '📱', name: 'Plataforma Vertical', group: 'Intermediário' },
            { icon: '🛒', name: 'E-commerce', group: 'Merchant' },
            { icon: '📦', name: 'Dropshipping', group: 'Merchant' },
            { icon: '🎓', name: 'Infoprodutos', group: 'Merchant' },
            { icon: '💻', name: 'SaaS', group: 'Merchant' },
            { icon: '🏫', name: 'Educação', group: 'Merchant' },
            { icon: '🔗', name: 'Link Pagamento', group: 'Merchant' },
            { icon: '🏠', name: 'MPE', group: 'Merchant' },
          ].map((s, i) => (
            <div key={i} className="p-2 bg-slate-50 rounded-lg text-center border border-slate-100">
              <p className="text-lg">{s.icon}</p>
              <p className="text-[10px] font-bold text-[#002443]">{s.name}</p>
              <Badge className={`text-[8px] border-0 ${s.group === 'Intermediário' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>{s.group}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Etapas */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-[#002443]">Todas as 10 Etapas — Campo por Campo</h4>
          <button onClick={() => { const all = {}; STEPS.forEach(s => all[s.id] = true); setOpenSteps(all); }} className="text-[10px] text-[#2bc196] font-bold hover:underline">Expandir todas</button>
        </div>
        {STEPS.map(step => (
          <StepBlock key={step.id} step={step} isOpen={openSteps[step.id]} onToggle={() => toggle(step.id)} />
        ))}
      </div>

      {/* Flags silenciosas */}
      <div className="bg-red-50 rounded-xl p-4 border border-red-100">
        <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" />16 Flags Silenciosas (Invisíveis ao Lead)
        </h4>
        <div className="space-y-2">
          {FLAGS_LIST.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-[10px]">
              <Badge className="bg-red-200 text-red-800 border-0 text-[8px] shrink-0 mt-0.5 font-mono">{f.key}</Badge>
              <div className="flex-1">
                <span className="text-[#002443]/80 font-medium">{f.desc}</span>
                <span className="text-[#002443]/40 ml-1">— {f.trigger}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Score */}
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
        <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5" />Sistema de Score (0-100)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px]">
          <div>
            <p className="font-bold text-amber-700 mb-1">Bônus</p>
            <ul className="space-y-0.5 text-[#002443]/70">
              <li>• Base: 40 pontos</li>
              <li>• E-mail corporativo: +10</li>
              <li>• Cargo decisor (Sócio/CEO): +10</li>
              <li>• TPV ≥ R$200k: +10</li>
              <li>• Sub-sellers 1k+: +5</li>
              <li>• Urgência imediata: +15</li>
              <li>• Hipercrescimento: +5</li>
              <li>• Insatisfeito com processador: +5</li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-red-700 mb-1">Penalidades</p>
            <ul className="space-y-0.5 text-[#002443]/70">
              <li>• Conta encerrada antes: -15</li>
              <li>• Chargeback crítico: -10</li>
              <li>• MED PIX alto: -10</li>
              <li>• Garantia 30d+: -5</li>
              <li>• Apenas cotando: -5</li>
            </ul>
            <p className="font-bold text-[#002443]/50 mt-2 mb-1">Labels</p>
            <ul className="space-y-0.5 text-[#002443]/70">
              <li>• ≥80: 🔥 Muito Quente</li>
              <li>• ≥60: 🟠 Quente</li>
              <li>• ≥40: 🟡 Morno</li>
              <li>• &lt;40: 🔵 Frio</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
        <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" />Features & Integrações
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {[
            'Autocomplete CNPJ via BrasilAPI (14+ campos)',
            'Autocomplete CEP via ViaCEP',
            'Detecção e-mail pessoal vs corporativo',
            'Perguntas condicionais por segmento (18 campos)',
            'SliderDistribution visual para split de pagamentos',
            'Score calculado em tempo real ao preencher',
            '16 flags silenciosas computadas automaticamente',
            'Auto-save a cada mudança (localStorage)',
            'Dados fluem para Dados & Insights (3 seções: Inteligência Mercado, Risco Operacional, Jornada Compliance)',
            'Pré-preenchimento de Compliance v4 via useLeadPrefill',
            'Mapeamento segmento → template de compliance correto',
            'Protocolo PAG-QL-YYYY-NNNNN ao submeter',
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[10px] text-[#002443]/70">
              <span className="text-[#2bc196] shrink-0 mt-0.5">✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}