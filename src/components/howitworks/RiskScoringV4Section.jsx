import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Shield, AlertTriangle, Zap, Layers, BarChart3, Lock, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SUBFAIXAS = [
  { id: '1A', nome: 'VERDE EXPRESS', range: '0-99', rr: '0%', auto: true, mon: 'PADRÃO', color: 'bg-green-100 text-green-800', desc: 'Aprovação automática imediata. Monitoramento padrão. Sem rolling reserve.' },
  { id: '1B', nome: 'VERDE', range: '100-199', rr: '0%', auto: true, mon: 'PADRÃO', color: 'bg-green-50 text-green-700', desc: 'Aprovação automática. Monitoramento padrão. Promoção possível para 1A após 180d sem incidentes.' },
  { id: '2A', nome: 'AZUL LEVE', range: '200-299', rr: '0%', auto: true, mon: 'REFORÇADO LEVE', color: 'bg-blue-100 text-blue-700', desc: 'Aprovação automática com monitoramento reforçado leve. Promoção para 1B em 180 dias.' },
  { id: '2B', nome: 'AZUL', range: '300-399', rr: '5%', auto: true, mon: 'REFORÇADO', color: 'bg-blue-50 text-blue-600', desc: 'Aprovação automática com Rolling Reserve 5%. Monitoramento reforçado. Promoção para 2A em 90 dias.' },
  { id: '3A', nome: 'AMARELO', range: '400-499', rr: '10%', auto: true, mon: 'INTENSO', color: 'bg-yellow-100 text-yellow-800', desc: 'Aprovação automática com RR 10%. Monitoramento intenso. Promoção para 2B em 60 dias.' },
  { id: '3B', nome: 'AMARELO INTENSO', range: '500-599', rr: '15%', auto: true, mon: 'INTENSO+', color: 'bg-amber-100 text-amber-800', desc: 'Aprovação automática com RR 15%. Monitoramento intenso plus. Promoção para 3A em 30 dias.' },
  { id: '4', nome: 'LARANJA — ANÁLISE', range: '600-849', rr: '15%', auto: false, mon: 'MÁXIMO', color: 'bg-orange-100 text-orange-800', desc: 'Revisão MANUAL obrigatória. RR 15%. Monitoramento máximo. Analista decide.' },
  { id: '5', nome: 'VERMELHO — BLOQUEIO', range: '850-1000', rr: 'N/A', auto: false, mon: 'MÁXIMO', color: 'bg-red-100 text-red-800', desc: 'BLOQUEIO automático. Só ativado por B01-B10. Score fixado em 1000.' },
];

const SEGMENTS = [
  { name: 'Gateway / PSP', base: 175, risk: 'Muito Alto' },
  { name: 'Marketplace', base: 150, risk: 'Alto' },
  { name: 'Plataforma Vertical', base: 140, risk: 'Alto' },
  { name: 'Dropshipping', base: 125, risk: 'Médio-Alto' },
  { name: 'Infoprodutos', base: 110, risk: 'Médio-Alto' },
  { name: 'PIX Intermediário', base: 205, risk: 'Muito Alto (fixo)' },
  { name: 'E-commerce', base: 75, risk: 'Médio' },
  { name: 'Link Pagamento', base: 65, risk: 'Médio' },
  { name: 'PIX Merchant', base: 80, risk: 'Médio (fixo)' },
  { name: 'SaaS', base: 50, risk: 'Baixo-Médio' },
  { name: 'Foodtech', base: 50, risk: 'Baixo-Médio' },
  { name: 'Educação', base: 40, risk: 'Baixo' },
  { name: 'MPE', base: 35, risk: 'Baixo' },
];

const BLOQUEIOS = [
  { id: 'B01', desc: 'CNPJ com situação cadastral ≠ Ativa', check: 'V01' },
  { id: 'B02', desc: 'CNPJ com situação especial na Receita', check: 'V02' },
  { id: 'B04', desc: 'Sanção OFAC / ONU / UE', check: 'V18' },
  { id: 'B05', desc: 'CPF com óbito registrado', check: 'V22' },
  { id: 'B06', desc: 'Deepfake detectado (CAF Liveness)', check: 'E08' },
  { id: 'B07', desc: 'Documento falsificado (CAF Documentoscopy)', check: 'E10' },
  { id: 'B08', desc: 'Face Match < 50% (CAF)', check: 'E09' },
  { id: 'B09', desc: 'MEI intermediando pagamentos (Gateway/Marketplace/Plataforma/PIX Interm.)', check: 'V09' },
];

const VARIAVEIS_CATEGORIAS = [
  {
    cat: 'Identidade & Presença Digital', color: 'border-l-blue-500', items: [
      { id: 'V06', pts: '+30', desc: 'Empresa < 6 meses', segs: 'TODOS' },
      { id: 'V07', pts: '+15', desc: 'Empresa 6-12 meses', segs: 'TODOS' },
      { id: 'V10', pts: '+20', desc: 'E-mail domínio gratuito (Gmail, etc.)', segs: 'Intermediários' },
      { id: 'V11', pts: '+40', desc: 'Zero presença digital (sem site)', segs: 'TODOS' },
      { id: 'V12', pts: '-100', desc: 'Google Maps ≥50 avaliações + ≥4★', segs: 'TODOS', positive: true },
      { id: 'V13', pts: '-80', desc: 'Sede verificada (BDC)', segs: 'TODOS', positive: true },
      { id: 'V14', pts: '-60', desc: 'Site ativo + SSL + plataforma reconhecida', segs: 'E-commerce/SaaS/etc.', positive: true },
      { id: 'V15', pts: '-40', desc: 'Empresa > 5 anos', segs: 'TODOS', positive: true },
    ]
  },
  {
    cat: 'PEP & Sanções', color: 'border-l-red-500', items: [
      { id: 'V16', pts: '+80', desc: 'PEP direto (declarado ou BDC)', segs: 'TODOS' },
      { id: 'V17', pts: '+30', desc: 'PEP parente (BDC)', segs: 'TODOS' },
      { id: 'V19', pts: '+60', desc: 'CEIS / CNEP', segs: 'TODOS' },
      { id: 'V20', pts: '+120', desc: 'Processos crimes financeiros', segs: 'TODOS' },
      { id: 'V23', pts: '+100', desc: 'CPF irregular', segs: 'TODOS' },
      { id: 'V24', pts: '+80', desc: 'Mídia adversa (BDC/CAF)', segs: 'TODOS' },
      { id: 'V25', pts: '+100', desc: 'PEP divergente (declarou "Não" mas BDC encontrou)', segs: 'TODOS' },
      { id: 'V26', pts: '-50', desc: 'Todos checks PEP/sanções/processos limpos', segs: 'TODOS', positive: true },
      { id: 'V27', pts: '-80', desc: '>10 anos + nenhum achado negativo', segs: 'TODOS', positive: true },
    ]
  },
  {
    cat: 'Transacional', color: 'border-l-amber-500', items: [
      { id: 'V28', pts: '+100', desc: 'Chargeback > 2% (crítico)', segs: 'TODOS' },
      { id: 'V29', pts: '+50', desc: 'Chargeback 1-2% (atenção)', segs: 'TODOS' },
      { id: 'V30', pts: '-30', desc: 'Chargeback < 0,5% (saudável)', segs: 'TODOS', positive: true },
      { id: 'V31', pts: '+100', desc: 'MED PIX > 1%', segs: 'PIX' },
      { id: 'V32', pts: '+50', desc: 'MED PIX 0,5-1%', segs: 'PIX' },
      { id: 'V33', pts: '-30', desc: 'MED PIX < 0,1%', segs: 'PIX', positive: true },
      { id: 'V35', pts: '+80', desc: 'Conta encerrada/cancelada', segs: 'TODOS' },
      { id: 'V37', pts: '+200', desc: 'Notificado COAF', segs: 'PIX' },
    ]
  },
  {
    cat: 'Compliance & Governança (Intermediários)', color: 'border-l-purple-500', items: [
      { id: 'V42', pts: '+150', desc: 'Sem autorização BCB e sem BaaS', segs: 'Intermediários' },
      { id: 'V43', pts: '+80', desc: 'Sem política PLD/FT', segs: 'Intermediários' },
      { id: 'V44', pts: '+100', desc: 'Sem KYC de merchants', segs: 'Intermediários' },
      { id: 'V45', pts: '+60', desc: 'Sem monitoramento de transações', segs: 'Intermediários' },
      { id: 'V46', pts: '+80', desc: 'Sem anti-bolção (Res. 518)', segs: 'PIX Intermediário' },
      { id: 'V47', pts: '+80', desc: 'Split não validado', segs: 'PIX Intermediário' },
      { id: 'V48', pts: '+60', desc: 'Merchants transferem para terceiros', segs: 'PIX Intermediário' },
      { id: 'V52', pts: '-100', desc: 'Todos controles OK (BCB + PLD + KYC + TM + CO)', segs: 'Intermediários', positive: true },
      { id: 'V53', pts: '-30', desc: 'Compliance Officer nomeado', segs: 'Intermediários', positive: true },
    ]
  },
  {
    cat: 'Enriquecimento (E01-E11)', color: 'border-l-cyan-500', items: [
      { id: 'E01', pts: '+100', desc: 'PEP divergente (enriquecimento)', segs: 'TODOS' },
      { id: 'E06', pts: '+30', desc: 'Site declarado mas offline (BDC)', segs: 'TODOS' },
      { id: 'E07', pts: '+60', desc: 'Negativação não mencionada (BDC)', segs: 'TODOS' },
      { id: 'E11', pts: '-150', desc: 'Tudo confirma BDC + CAF (dados + liveness 80+ + facematch 85+)', segs: 'TODOS', positive: true },
    ]
  },
];

function CollapsibleSection({ title, badge, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-3 hover:bg-slate-50/50 transition-colors text-left">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-[#0A0A0A]">{title}</span>
          {badge && <Badge variant="outline" className="text-[10px]">{badge}</Badge>}
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <div className="px-3 pb-3 border-t border-slate-100">{children}</div>}
    </div>
  );
}

export default function RiskScoringV4Section() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-700 rounded-2xl p-5 text-white">
        <h3 className="text-lg font-bold mb-2">Framework de Risk Scoring v4.0 — Motor Determinístico</h3>
        <p className="text-white/90 text-sm leading-relaxed mb-3">
          Sistema de scoring com 3 camadas aditivas (Segmento Base + Variáveis + Enriquecimento), 
          60 variáveis de risco (V01-V53 + E01-E11), 10 bloqueios automáticos (B01-B10) que fixam score em 1000,
          8 subfaixas de decisão com Rolling Reserve progressivo (0-20%) e 6 níveis de monitoramento.
          Substitui a análise qualitativa por um modelo 100% determinístico e reprodutível.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {[
            { val: '0-1000', label: 'Escala (0=melhor)' },
            { val: '3', label: 'Camadas aditivas' },
            { val: '60', label: 'Variáveis de risco' },
            { val: '10', label: 'Bloqueios (B01-B10)' },
            { val: '8', label: 'Subfaixas' },
            { val: '13', label: 'Segmentos' },
          ].map((m, i) => (
            <div key={i} className="bg-white/15 rounded-xl p-2.5 text-center">
              <p className="text-lg font-extrabold">{m.val}</p>
              <p className="text-[9px] text-white/70">{m.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fórmula */}
      <div className="bg-white rounded-xl p-4 border-2 border-[#0A0A0A]/20">
        <h4 className="text-sm font-bold text-[#0A0A0A] mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#1356E2]" /> Fórmula: 3 Camadas Aditivas
        </h4>
        <div className="bg-slate-50 rounded-lg p-4 font-mono text-sm text-center mb-3">
          <span className="text-blue-600 font-bold">Score Final</span> = <span className="text-emerald-600">max(0, min(849,</span> <span className="text-purple-600">C1</span> + <span className="text-amber-600">C2</span> + <span className="text-cyan-600">C3</span><span className="text-emerald-600">))</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
            <Badge className="bg-purple-200 text-purple-800 border-0 text-[10px] mb-1">C1 — Score Base Segmento</Badge>
            <p className="text-[10px] text-[#0A0A0A]/70">Valor fixo por segmento (35-205 pts). PIX: score fixo. Cartão + addon PIX se misto.</p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
            <Badge className="bg-amber-200 text-amber-800 border-0 text-[10px] mb-1">C2 — Variáveis (V01-V53)</Badge>
            <p className="text-[10px] text-[#0A0A0A]/70">Soma das variáveis ativas. Positivas (redutoras, até -100) e Negativas (penalizadoras, até +200). Aplicadas condicionalmente por segmento.</p>
          </div>
          <div className="p-3 bg-cyan-50 rounded-lg border border-cyan-100">
            <Badge className="bg-cyan-200 text-cyan-800 border-0 text-[10px] mb-1">C3 — Enriquecimento (E01-E11)</Badge>
            <p className="text-[10px] text-[#0A0A0A]/70">Dados de BDC/CAF. Confronta declarado vs encontrado. Bônus máximo -150 se tudo confirma.</p>
          </div>
        </div>
        <div className="mt-3 bg-red-50 rounded-lg p-3 border border-red-100">
          <p className="text-[10px] text-red-700 font-bold">⚠️ Exceção: Se qualquer bloqueio B01-B10 for ativado → Score = 1000 (Subfaixa 5 — BLOQUEIO). Não passa pela fórmula.</p>
        </div>
      </div>

      {/* Segmentos Base */}
      <CollapsibleSection title="Camada 1 — Scores Base por Segmento (13 segmentos)" badge="35-205 pts" defaultOpen>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
          {SEGMENTS.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Badge className="bg-[#0A0A0A] text-white border-0 text-[10px] w-8 justify-center">{s.base}</Badge>
                <span className="text-[11px] text-[#0A0A0A]/80 font-medium">{s.name}</span>
              </div>
              <Badge className={`text-[8px] border-0 ${s.risk.includes('Muito Alto') || s.risk.includes('Alto') ? 'bg-red-50 text-red-600' : s.risk.includes('Médio') ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>{s.risk}</Badge>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-[#0A0A0A]/40 mt-2">* PIX Merchant (fixo 80) e PIX Intermediário (fixo 205) não usam cartao + pix_addon. Demais segmentos: cartao + 30 se PIX habilitado.</p>
      </CollapsibleSection>

      {/* Variáveis */}
      <CollapsibleSection title="Camada 2+3 — 60 Variáveis de Risco (V01-V53 + E01-E11)" badge="Positivas + Negativas">
        <div className="space-y-3 mt-2">
          {VARIAVEIS_CATEGORIAS.map((cat, i) => (
            <div key={i}>
              <h5 className="text-[10px] font-bold text-[#0A0A0A]/50 uppercase tracking-wider mb-1.5 flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${cat.color.replace('border-l-', 'bg-')}`} />{cat.cat}
              </h5>
              <div className="space-y-1">
                {cat.items.map((v, j) => (
                  <div key={j} className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-slate-50 text-[10px]">
                    <Badge className="bg-slate-200 text-slate-700 border-0 text-[8px] font-mono shrink-0 mt-0.5 w-8 justify-center">{v.id}</Badge>
                    <Badge className={`text-[8px] border-0 shrink-0 mt-0.5 w-10 justify-center ${v.positive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{v.pts}</Badge>
                    <span className="text-[#0A0A0A]/70 flex-1">{v.desc}</span>
                    <Badge className="text-[7px] bg-slate-50 text-slate-400 border-0 shrink-0">{v.segs}</Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Bloqueios */}
      <div className="bg-red-50 rounded-xl p-4 border border-red-200">
        <h4 className="text-xs font-bold text-red-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />Bloqueios Automáticos (B01-B10) — Score → 1000
        </h4>
        <div className="space-y-2">
          {BLOQUEIOS.map((b, i) => (
            <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-lg">
              <Badge className="bg-red-200 text-red-800 border-0 text-[10px] font-mono shrink-0 w-8 justify-center">{b.id}</Badge>
              <span className="text-[11px] text-[#0A0A0A]/80 flex-1">{b.desc}</span>
              <Badge className="text-[8px] bg-slate-100 text-slate-500 border-0 font-mono">{b.check}</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* Subfaixas */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <h4 className="text-sm font-bold text-[#0A0A0A] mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-[#1356E2]" /> 8 Subfaixas de Decisão
        </h4>
        <div className="space-y-2">
          {SUBFAIXAS.map((sf, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <Badge className={`${sf.color} border-0 text-[10px] shrink-0 w-8 justify-center`}>{sf.id}</Badge>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-[#0A0A0A]">{sf.nome}</span>
                  <Badge variant="outline" className="text-[8px] font-mono">{sf.range}</Badge>
                  <Badge className="text-[8px] bg-blue-50 text-blue-600 border-0">RR: {sf.rr}</Badge>
                  <Badge className={`text-[8px] border-0 ${sf.auto ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>{sf.auto ? 'Automática' : 'Manual'}</Badge>
                  <Badge className="text-[8px] bg-slate-100 text-slate-500 border-0">{sf.mon}</Badge>
                </div>
                <p className="text-[9px] text-[#0A0A0A]/50 mt-0.5">{sf.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monitoramento */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
        <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5" />6 Níveis de Monitoramento
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { nivel: 'PADRÃO', desc: 'Revisão anual. Alertas CB>1%. MED padrão.' },
            { nivel: 'REFORÇADO LEVE', desc: 'Revisão semestral. Alertas CB>0.8%. Pico transacional 150%.' },
            { nivel: 'REFORÇADO', desc: 'Revisão trimestral. Alertas CB>0.5%. Pico 120%.' },
            { nivel: 'INTENSO', desc: 'Revisão bimestral. Alertas CB>0.3%. MED diário. Pico 110%.' },
            { nivel: 'INTENSO+', desc: 'Revisão mensal. Alertas CB>0.2%. MED por transação. Pico 105%.' },
            { nivel: 'MÁXIMO', desc: 'Revisão contínua. Todos alertas. Bloqueio automático se limites excedidos.' },
          ].map((m, i) => (
            <div key={i} className="p-2 bg-white rounded-lg border border-blue-100">
              <Badge className="bg-blue-200 text-blue-800 border-0 text-[8px] mb-1">{m.nivel}</Badge>
              <p className="text-[9px] text-[#0A0A0A]/60">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fluxo técnico */}
      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
        <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5" />Fluxo Técnico: Compliance → Score v4 → SENTINEL
        </h4>
        <div className="space-y-2">
          {[
            { step: '1', text: 'Merchant completa questionário de compliance (v4 ou legado)', actor: 'Merchant' },
            { step: '2', text: 'OnboardingCase criado → status "Em Processamento"', actor: 'Sistema' },
            { step: '3', text: 'Backend calculateRiskScoreV4 dispara: identifica segmento pelo template, carrega respostas, enriquece CNPJ, consulta BDC/CAF', actor: 'Motor v4' },
            { step: '4', text: 'Camada 1: Score Base do Segmento (ex: Gateway=175, MPE=35, PIX Intermediário=205)', actor: 'Motor v4' },
            { step: '5', text: 'Camada 2: Itera 53 variáveis V01-V53 → aplica somente se ativa + segmento compatível → soma pontos positivos e negativos', actor: 'Motor v4' },
            { step: '6', text: 'Camada 3: Se enriquecimento BDC/CAF disponível, itera E01-E11 → confronta declarado vs encontrado', actor: 'Motor v4' },
            { step: '7', text: 'Verifica bloqueios B01-B10: se qualquer um ativo → Score = 1000, Subfaixa = 5 (BLOQUEIO)', actor: 'Motor v4' },
            { step: '8', text: 'Se sem bloqueio: ScoreFinal = max(0, min(849, C1+C2+C3)) → mapeia para subfaixa 1A-4', actor: 'Motor v4' },
            { step: '9', text: 'Salva ComplianceScore (score_base, score_variaveis, score_enriquecimento, score_final, subfaixa, rr, monitoramento, variáveis detalhadas)', actor: 'Motor v4' },
            { step: '10', text: 'Atualiza OnboardingCase (riskScoreV4, subfaixa, rollingReservePercent, status, iaDecision)', actor: 'Motor v4' },
            { step: '11', text: 'SENTINEL usa score v4 como base quantitativa para parecer qualitativo final', actor: 'IA SENTINEL' },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-2 p-2 bg-white rounded-lg">
              <Badge className="bg-emerald-200 text-emerald-800 border-0 text-[10px] shrink-0 w-6 justify-center">{s.step}</Badge>
              <div className="flex-1">
                <p className="text-[11px] text-[#0A0A0A]/80">{s.text}</p>
                <Badge className="text-[8px] bg-slate-100 text-slate-500 border-0 mt-0.5">{s.actor}</Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Condições automáticas */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <h4 className="text-xs font-bold text-[#0A0A0A]/50 uppercase tracking-wider mb-2">Condições Automáticas Aplicadas pelo Motor</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-[10px] text-[#0A0A0A]/60">
          {[
            'RR 5% mínimo se Chargeback > 2% (proteção financeira)',
            'KYC merchants em 60 dias (se V44 ativo)',
            'Implementar PLD em 90 dias (se V43 ativo)',
            'Implementar TM em 90 dias (se V45 ativo)',
            'Implementar anti-bolção em 90 dias (se V46 ativo)',
            'Validar contas em 30 dias (se V47 ativo)',
            'Desabilitar transferências a terceiros (se V48 ativo)',
            'Formalizar arranjo BaaS (se V42 ativo)',
            'Investigar motivo encerramento de conta (se V35 ativo)',
          ].map((c, i) => (
            <div key={i} className="flex items-start gap-1.5">
              <span className="text-amber-500 shrink-0 mt-0.5">⚠️</span>
              <span>{c}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Backend & Entidades */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <h4 className="text-xs font-bold text-[#0A0A0A]/50 uppercase tracking-wider mb-2">Implementação Técnica</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px] text-[#0A0A0A]/60">
          {[
            { name: 'calculateRiskScoreV4', desc: 'Backend function: motor completo (400+ linhas)' },
            { name: 'analyzeOnboarding', desc: 'SENTINEL: chama v4 antes da análise qualitativa' },
            { name: 'ComplianceScore', desc: 'Entidade: score_final, subfaixa, variaveis_aplicadas, bloqueios' },
            { name: 'OnboardingCase', desc: 'Campos: riskScoreV4, subfaixa, rollingReservePercent, monitoramentoNivel' },
            { name: 'lib/riskScoringV4/config.js', desc: 'Configuração: segmentos, subfaixas, variáveis' },
            { name: 'lib/riskScoringV4/engine.js', desc: 'Motor frontend: cálculo para simulações' },
            { name: 'RiskScoringDashboard', desc: 'Dashboard: ScoreGauge + ScoringBreakdown' },
            { name: 'ScoreGauge + SubfaixaBadge', desc: 'Componentes visuais de exibição' },
          ].map((c, i) => (
            <div key={i} className="p-2 bg-white rounded-lg border border-slate-100">
              <Badge className="bg-[#0A0A0A] text-white font-mono text-[7px] border-0 mb-1">{c.name}</Badge>
              <p className="text-[8px] text-[#0A0A0A]/50">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}