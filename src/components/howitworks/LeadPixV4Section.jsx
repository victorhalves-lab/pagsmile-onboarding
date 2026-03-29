import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Zap, Hash, ShieldAlert, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const STEPS = [
  {
    id: '1', title: 'Etapa 1 — Tipo de Negócio PIX', objective: 'O lead seleciona entre 2 perfis: Merchant Direto (recebe PIX para a própria empresa) ou Intermediário (recebe PIX em nome de merchants/sellers e faz split/repasse). Essa escolha determina quais perguntas condicionais aparecem.',
    questions: [
      { order: 1, text: 'Seu modelo de PIX', type: 'BUTTON_SELECT', required: true, note: '2 cards: 🏪 Merchant Direto ("Recebo PIX para minha própria empresa, sem split") e 🔗 Intermediário ("Recebo PIX em nome de outros e faço split/repasse"). Cada card tem ícone, título, descrição e exemplos.' },
    ]
  },
  {
    id: '2', title: 'Etapa 2 — Dados da Empresa', objective: 'Coleta CNPJ com autocomplete BrasilAPI (14+ campos), e-mail com detecção de domínio pessoal, telefone, nome do contato e cargo. Dispara flags PERSONAL_EMAIL, YOUNG_COMPANY, SPECIAL_SITUATION, REGULATED_SECTOR, CNAE_SEGMENT_MISMATCH.',
    questions: [
      { order: 2, text: 'CNPJ', type: 'CPF_CNPJ', required: true, note: 'Autocomplete BrasilAPI: Razão Social, Nome Fantasia, CNAE, Capital Social, Situação Cadastral, UF, Município, Data Abertura, Porte, Natureza Jurídica, Sócios. Flag YOUNG_COMPANY se <1 ano.' },
      { order: 3, text: 'Razão Social', type: 'TEXT', required: true, note: 'Auto-preenchido via CNPJ. Read-only após enriquecimento.' },
      { order: 4, text: 'Nome Fantasia', type: 'TEXT', required: false, note: 'Auto-preenchido se disponível na Receita Federal' },
      { order: 5, text: 'E-mail do contato', type: 'EMAIL', required: true, note: 'Detecta domínio pessoal (Gmail/Hotmail) → flag PERSONAL_EMAIL. Se corporativo, +10 no score.' },
      { order: 6, text: 'Telefone/WhatsApp', type: 'PHONE', required: true },
      { order: 7, text: 'Nome do contato', type: 'TEXT', required: true },
      { order: 8, text: 'Cargo', type: 'SELECT', required: true, note: '6 opções: Sócio/Proprietário, CEO/Diretor, Gerente, Financeiro, TI, Outro. Decisores (Sócio/CEO) → +10 score.' },
    ]
  },
  {
    id: '3', title: 'Etapa 3 — Modelo de Negócio PIX', objective: 'Perguntas condicionais baseadas no tipo selecionado. Merchant: modelo de cobrança PIX, presença digital, finalidade da conta, já teve conta encerrada. Intermediário: quantidade de merchants, finalidade, modelo de cobrança, presença digital.',
    questions: [
      { order: 9, text: 'Modelo de cobrança PIX', type: 'BUTTON_SELECT', required: true, note: '4 opções: PIX avulso (venda única), PIX recorrente (mensalidade), PIX parcelado (PIX Garantido), Ambos' },
      { order: 10, text: 'Presença Digital (site/app)', type: 'TEXT', required: false, note: 'Se vazio → não marca flag (diferente do v5). Score +5 se preenchido.' },
      { order: 11, text: '[Intermediário] Quantidade de merchants ativos', type: 'SELECT', required: false, note: 'CONDICIONAL: só aparece se tipoNegocio="intermediario". 5 opções: Até 50, 51-200, 201-1k, 1k-5k, >5k. >1k → +5 score. Flag MEI_AS_INTERMEDIARY se porte=MEI.' },
      { order: 12, text: 'Finalidade da conta PIX', type: 'BUTTON_SELECT', required: true, note: '3 opções: Só receber PIX, Receber + pagamentos (fornecedores), Receber + split/repasse. Flag INTERMEDIARY_WANTS_SPLIT se intermediário + Split PIX.' },
      { order: 13, text: 'Já teve conta encerrada/cancelada?', type: 'SELECT', required: true, note: '2 opções: Sim, Não. Se Sim → flag ACCOUNT_TERMINATED → -15 no score.' },
    ]
  },
  {
    id: '4', title: 'Etapa 4 — Volume PIX', objective: 'TPV mensal em PIX, ticket médio, transações calculadas automaticamente. Flags HIGH_PIX_VOLUME_MEI e TPV_EXCEEDS_REVENUE com cruzamento de porte Receita Federal.',
    questions: [
      { order: 14, text: 'TPV Mensal em PIX (R$)', type: 'CURRENCY', required: true, note: 'CurrencyNumberInput com formatação automática. TPV ≥ R$1M → +15 score, ≥500k → +10, ≥100k → +5. Flag TPV_EXCEEDS_REVENUE se TPV×12 > limite porte (MEI:81k, ME:360k, EPP:4.8M) × 1.3. Flag HIGH_PIX_VOLUME_MEI se TPV>R$6.750 + porte MEI.' },
      { order: 15, text: 'Ticket Médio PIX (R$)', type: 'CURRENCY', required: true },
      { order: 16, text: 'Transações/mês (calculado)', type: 'NUMBER', required: false, note: 'Auto-calculado: TPV ÷ Ticket Médio. Read-only.' },
      { order: 17, text: 'Horário de pico das transações', type: 'SELECT', required: false, note: '4 opções: Comercial 8-18h, Noturno 18-23h, 24 horas, Não sei.' },
    ]
  },
  {
    id: '5', title: 'Etapa 5 — Situação Atual', objective: 'Captura se já usa PIX, há quanto tempo, custo atual, parceiro atual e motivo da busca. Dados para benchmark e calibração da proposta PIX.',
    questions: [
      { order: 18, text: 'Quanto tempo usando PIX comercial?', type: 'SELECT', required: false, note: '5 opções: <6 meses, 6-12 meses, 1-2 anos, >2 anos, É o primeiro. Score bônus se >2 anos (empresa madura).' },
      { order: 19, text: 'Custo atual por PIX', type: 'SELECT', required: false, note: '6 faixas: Até R$0,50, R$0,50-1,00, R$1,00-2,00, >R$2,00, % sobre valor, Não sei/primeiro.' },
      { order: 20, text: 'Parceiro atual de PIX', type: 'TEXT', required: false },
      { order: 21, text: 'Motivo da busca', type: 'MULTI_SELECT', required: false, note: '8 opções: Taxa alta, Instabilidade, Atendimento ruim, Falta funcionalidades, Prazo liquidação, Split/repasse, Primeiro parceiro, Outro.' },
    ]
  },
  {
    id: '6', title: 'Etapa 6 — Serviços PIX Desejados', objective: 'Seleção de serviços PIX que o lead precisa. Define funcionalidades requeridas e alimenta a proposta.',
    questions: [
      { order: 22, text: 'Serviços PIX desejados', type: 'MULTI_SELECT', required: true, note: '9 opções: PIX Recebimentos, PIX Pagamentos (cash-out), QR Code estático, QR Code dinâmico, PIX Cobrança (com vencimento), PIX Garantido (parcelado), Split PIX, Conta Digital PagSmile, Outro. Flag INTERMEDIARY_WANTS_SPLIT se intermediário selecionar Split PIX.' },
    ]
  },
  {
    id: '7', title: 'Etapa 7 — Contato & Fechamento', objective: 'Urgência, como conheceu a Pagsmile e upload opcional de proposta concorrente. Score finalizado e label atribuído (Muito Quente/Quente/Morno/Frio).',
    questions: [
      { order: 23, text: 'Urgência para integração', type: 'SELECT', required: true, note: '4 opções: Imediato, Até 30 dias, 1-3 meses, Pesquisando.' },
      { order: 24, text: 'Como conheceu a PagSmile?', type: 'SELECT', required: false, note: '6 opções: Google, Indicação, LinkedIn, Evento, Parceiro, Outro.' },
      { order: 25, text: 'Upload de proposta concorrente', type: 'FILE_UPLOAD', required: false, note: 'PDF, JPG, PNG. Upload via base44.integrations.Core.UploadFile.' },
    ]
  },
];

const FLAGS_LIST = [
  { key: 'ACCOUNT_TERMINATED', desc: 'Já teve conta PIX encerrada/cancelada', trigger: 'contaEncerrada="Sim"', penalty: '-15 score' },
  { key: 'TPV_EXCEEDS_REVENUE', desc: 'TPV PIX mensal × 12 excede faturamento do porte', trigger: 'TPV×12 > limite porte × 1.3 (MEI:81k, ME:360k, EPP:4.8M)', penalty: 'Flag para análise' },
  { key: 'YOUNG_COMPANY', desc: 'Empresa aberta há menos de 1 ano', trigger: 'Data abertura CNPJ < 1 ano atrás', penalty: 'Flag para análise' },
  { key: 'SPECIAL_SITUATION', desc: 'CNPJ com situação especial na Receita', trigger: 'cnpjData.situacao_especial não vazio', penalty: 'Flag para análise' },
  { key: 'PERSONAL_EMAIL', desc: 'E-mail de domínio pessoal (Gmail, Hotmail, etc.)', trigger: 'Domínio do e-mail está na lista FREE_EMAIL_DOMAINS (15 domínios)', penalty: 'Sem bônus de +10' },
  { key: 'REGULATED_SECTOR', desc: 'CNAE de setor financeiro + tipo=merchant', trigger: 'CNAE divisão 64/65/66 + tipoNegocio="merchant"', penalty: 'Flag para análise' },
  { key: 'RESTRICTED_ACTIVITY', desc: 'Atividade restrita (Anexo I Bacen)', trigger: 'Verificação contra lista de atividades restritas', penalty: 'Flag para análise' },
  { key: 'CNAE_SEGMENT_MISMATCH', desc: 'CNAE inconsistente com tipo de negócio', trigger: 'CnaeCoherenceAlert detecta incompatibilidade', penalty: 'Flag para análise' },
  { key: 'MEI_AS_INTERMEDIARY', desc: 'MEI declarando-se intermediário de PIX', trigger: 'tipoNegocio="intermediario" + porte=MEI', penalty: 'Flag de alto risco' },
  { key: 'HIGH_PIX_VOLUME_MEI', desc: 'MEI com TPV PIX > R$6.750/mês', trigger: 'tpvPix > 6750 + porte=MEI', penalty: '-10 score' },
  { key: 'INTERMEDIARY_WANTS_SPLIT', desc: 'Intermediário solicitando Split PIX', trigger: 'tipoNegocio="intermediario" + servicosPix inclui "Split PIX"', penalty: 'Informativo (requer arquitetura)' },
];

function StepBlock({ step, isOpen, onToggle }) {
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden mb-2">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-3 hover:bg-slate-50/50 transition-colors text-left">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Badge className="bg-emerald-500 text-white border-0 text-[10px] shrink-0">{step.id}</Badge>
          <span className="text-xs font-bold text-[#002443] truncate">{step.title}</span>
          <Badge variant="outline" className="text-[10px] shrink-0">{step.questions.length} campos</Badge>
          {step.questions.some(q => q.note?.includes('CONDICIONAL')) && <Badge className="bg-purple-50 text-purple-600 border-0 text-[10px] shrink-0">Condicional</Badge>}
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>
      {isOpen && (
        <div className="px-3 pb-3 border-t border-slate-100">
          <div className="bg-emerald-50 rounded-lg p-2.5 my-2 border border-emerald-100">
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider mb-0.5">Objetivo</p>
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
                  {q.note && <p className="text-[9px] text-emerald-600 mt-0.5 leading-tight italic">⚡ {q.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LeadPixV4Section() {
  const [openSteps, setOpenSteps] = useState({});
  const toggle = (id) => setOpenSteps(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-600 rounded-2xl p-5 text-white">
        <h3 className="text-lg font-bold mb-2">Questionário Lead PIX v4.0 — Qualificação PIX Avançada</h3>
        <p className="text-white/90 text-sm leading-relaxed mb-3">
          Questionário especializado exclusivamente em PIX com bifurcação Merchant Direto vs Intermediário,
          25 perguntas + condicionais, 11 flags silenciosas, scoring 0-100, autocomplete CNPJ/CEP
          e cruzamento de porte Receita Federal para detecção de inconsistências volumétricas.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[
            { val: '2', label: 'Perfis PIX' },
            { val: '25', label: 'Perguntas' },
            { val: '11', label: 'Flags silenciosas' },
            { val: '0-100', label: 'Score automático' },
            { val: '7', label: 'Etapas' },
          ].map((m, i) => (
            <div key={i} className="bg-white/15 rounded-xl p-2.5 text-center">
              <p className="text-xl font-extrabold">{m.val}</p>
              <p className="text-[10px] text-white/70">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bifurcação */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <h4 className="text-sm font-bold text-[#002443] mb-3">Bifurcação: Merchant Direto vs Intermediário</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm font-bold text-[#002443]">🏪 Merchant Direto</p>
            <p className="text-[10px] text-[#002443]/60 mt-1">Recebe PIX para a própria empresa. Não faz split/repasse. Segmentos: E-commerce, Dropshipping, Infoprodutos, SaaS, Educação, Foodtech, Link Pagamento, MPE.</p>
            <div className="mt-2 space-y-0.5">
              {['Modelo de cobrança PIX', 'Presença digital', 'Finalidade da conta', 'Conta encerrada', 'Volume PIX'].map((f, i) => (
                <p key={i} className="text-[9px] text-blue-600 flex items-start gap-1"><span className="text-blue-400">→</span>{f}</p>
              ))}
            </div>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
            <p className="text-sm font-bold text-[#002443]">🔗 Intermediário</p>
            <p className="text-[10px] text-[#002443]/60 mt-1">Recebe PIX em nome de merchants/sellers e faz split/repasse. Segmentos: Gateway/PSP, Marketplace, Plataforma Vertical.</p>
            <div className="mt-2 space-y-0.5">
              {['Quantidade de merchants ativos', 'Modelo de cobrança PIX', 'Presença digital', 'Finalidade (split/repasse)', 'Volume PIX agregado', 'Flag MEI_AS_INTERMEDIARY'].map((f, i) => (
                <p key={i} className="text-[9px] text-purple-600 flex items-start gap-1"><span className="text-purple-400">→</span>{f}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Etapas */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-bold text-[#002443]">Todas as 7 Etapas — Campo por Campo</h4>
          <button onClick={() => { const all = {}; STEPS.forEach(s => all[s.id] = true); setOpenSteps(all); }} className="text-[10px] text-[#2bc196] font-bold hover:underline">Expandir todas</button>
        </div>
        {STEPS.map(step => (
          <StepBlock key={step.id} step={step} isOpen={openSteps[step.id]} onToggle={() => toggle(step.id)} />
        ))}
      </div>

      {/* Flags silenciosas */}
      <div className="bg-red-50 rounded-xl p-4 border border-red-100">
        <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" />11 Flags Silenciosas PIX (Invisíveis ao Lead)
        </h4>
        <div className="space-y-2">
          {FLAGS_LIST.map((f, i) => (
            <div key={i} className="flex items-start gap-2 text-[10px]">
              <Badge className="bg-red-200 text-red-800 border-0 text-[8px] shrink-0 mt-0.5 font-mono">{f.key}</Badge>
              <div className="flex-1">
                <span className="text-[#002443]/80 font-medium">{f.desc}</span>
                <span className="text-[#002443]/40 ml-1">— {f.trigger}</span>
                <Badge className="bg-red-100 text-red-600 border-0 text-[7px] ml-1">{f.penalty}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Score */}
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
        <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5" />Sistema de Score PIX (0-100)
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px]">
          <div>
            <p className="font-bold text-amber-700 mb-1">Bônus</p>
            <ul className="space-y-0.5 text-[#002443]/70">
              <li>• Base: 40 pontos</li>
              <li>• TPV ≥ R$1M: +15 | ≥R$500k: +10 | ≥R$100k: +5</li>
              <li>• Capital Social ≥R$1M: +10 | ≥R$100k: +5</li>
              <li>• Empresa ≥5 anos: +10 | ≥2 anos: +5</li>
              <li>• Cargo decisor (Sócio/CEO): +10</li>
              <li>• E-mail corporativo: +10</li>
              <li>• Presença digital: +5</li>
              <li>• Porte grande (DEMAIS): +5 | EPP: +3</li>
              <li>• Intermediário: +10</li>
              <li>• Merchants >1k: +5</li>
            </ul>
          </div>
          <div>
            <p className="font-bold text-red-700 mb-1">Penalidades</p>
            <ul className="space-y-0.5 text-[#002443]/70">
              <li>• Conta encerrada (ACCOUNT_TERMINATED): -15</li>
              <li>• Volume PIX MEI (HIGH_PIX_VOLUME_MEI): -10</li>
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
          <Zap className="w-3.5 h-3.5" />Features & Diferenças vs Pagsmile v5
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
          {[
            'Bifurcação binária Merchant/Intermediário (vs 10 segmentos no v5)',
            'Foco 100% PIX: sem cartão, sem bandeiras, sem parcelamento',
            'Autocomplete CNPJ via BrasilAPI (14+ campos)',
            'Cruzamento de porte Receita × TPV para detecção de inconsistências',
            'Flag MEI_AS_INTERMEDIARY (MEI não pode intermediar pagamentos)',
            'Flag HIGH_PIX_VOLUME_MEI (R$6.750 = limite mensal MEI/12)',
            'Seleção de serviços PIX (9 opções: QR estático, dinâmico, cobrança, garantido, split, conta digital)',
            'Score ponderado por capital social + idade da empresa',
            '7 etapas compactas vs 10 etapas no v5',
            'Gera protocolo PIX4-YYYY-NNNNN ao submeter',
            'Vinculação automática com Introducer via URL params',
            'Dados fluem para Risk Scoring v4.0 (segmento pix_merchant ou pix_intermediario)',
          ].map((f, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[10px] text-[#002443]/70">
              <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
              <span>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Componentes técnicos */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <h4 className="text-xs font-bold text-[#002443]/50 uppercase tracking-wider mb-2">Componentes Técnicos (7 steps)</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px] text-[#002443]/60">
          {[
            { name: 'StepTipoNegocio', desc: 'Seleção Merchant/Intermediário com cards' },
            { name: 'StepDadosEmpresa', desc: 'CNPJ autocomplete + contato' },
            { name: 'StepModeloNegocio', desc: 'Perguntas condicionais por tipo' },
            { name: 'StepVolumePix', desc: 'TPV, ticket médio, horário pico' },
            { name: 'StepSituacaoAtual', desc: 'Parceiro atual, custo, motivo' },
            { name: 'StepServicosComplementar', desc: 'Multi-select serviços PIX' },
            { name: 'StepContato', desc: 'Urgência, canal, upload proposta' },
            { name: 'pixQuestionnaireData', desc: 'Lógica de flags + score centralizada' },
          ].map((c, i) => (
            <div key={i} className="p-2 bg-white rounded-lg border border-slate-100">
              <Badge className="bg-[#002443] text-white font-mono text-[7px] border-0 mb-1">{c.name}</Badge>
              <p className="text-[8px] text-[#002443]/50">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}