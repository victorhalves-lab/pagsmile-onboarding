import React, { useState } from 'react';
import { Building2, Users, Globe, Shield, TrendingUp, DollarSign, History, Leaf, Phone, UserCheck, BarChart3, Landmark, CreditCard, ChevronDown, ChevronUp, HelpCircle, Info } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const RISK_COLORS = {
  'CRITICO': 'bg-red-50 text-red-700 border-red-200',
  'ALTO': 'bg-orange-50 text-orange-700 border-orange-200',
  'MEDIO': 'bg-amber-50 text-amber-700 border-amber-200',
  'BAIXO': 'bg-blue-50 text-blue-700 border-blue-200',
  'OK': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'INFO': 'bg-slate-50 text-slate-600 border-slate-200',
};

const RISK_DOT = {
  'CRITICO': 'bg-red-500', 'ALTO': 'bg-orange-500', 'MEDIO': 'bg-amber-500',
  'BAIXO': 'bg-blue-400', 'OK': 'bg-emerald-500', 'INFO': 'bg-slate-400',
};

const DIMENSION_CONFIG = {
  identity: { icon: Building2, label: 'Identidade & Cadastro', desc: 'CNPJ, situação cadastral, CNAE, capital social, endereço' },
  owners: { icon: Users, label: 'Quadro Societário', desc: 'Sócios, PEP, sanções, processos judiciais, grupo econômico' },
  digital: { icon: Globe, label: 'Presença Digital', desc: 'Website, atividade online, shell company, passagens web' },
  compliance: { icon: Shield, label: 'Compliance & PLD', desc: 'Sanções, dívida ativa, processos, negativação, cobrança' },
  reputation: { icon: TrendingUp, label: 'Reputação', desc: 'Mídia, avaliações, prêmios, certificações' },
  financial: { icon: DollarSign, label: 'Financeiro', desc: 'Grupo econômico, MCC, licenças, propriedade industrial' },
  evolution: { icon: History, label: 'Evolução Histórica', desc: 'Alterações cadastrais, evolução de capital, mudanças de CNAE' },
  esg: { icon: Leaf, label: 'ESG / Lista Suja MTE', desc: 'Trabalho escravo, embargos IBAMA, indicadores ambientais' },
  contacts: { icon: Phone, label: 'Validação de Contatos', desc: 'Telefones, e-mails, endereços encontrados pela BDC' },
  employeesKyc: { icon: UserCheck, label: 'KYC Funcionários', desc: 'Faixa de empregados RAIS/CAGED' },
  sectorial: { icon: BarChart3, label: 'Dados Setoriais', desc: 'MCC, CNAEs financeiros, registros BCB/CVM, marketplaces' },
  assets: { icon: Landmark, label: 'Ativos Patrimoniais', desc: 'Propriedade industrial, licenças, prêmios, capital social' },
  creditRisk: { icon: CreditCard, label: 'Análise de Crédito', desc: 'Score de crédito PJ, protestos, inadimplência, cheques' },
};

// Item-level explanation map for common BDC items
const ITEM_EXPLANATIONS = {
  'Nível de atividade': 'Mede o quanto a empresa está operando no mundo real. Combina: transações, notas fiscais, movimentação em bases de crédito e presença em diretórios. 0-25%=muito baixo, 26-50%=baixo, 51-75%=moderado, 76-100%=alto.',
  'Shell Company score': 'Probabilidade calculada pela BDC de que a empresa seja uma "empresa de fachada". Combina: zero empregados, sem domínio, sem atividade web, capital mínimo. 0-20%=baixa, 21-40%=moderada, 41-60%=alta, 61-80%=muito alta, 81-100%=bloqueante.',
  'Domínio ativo': 'Indica se existe algum website registrado e ativo em nome da empresa. "NÃO" não significa necessariamente fraude — muitas empresas B2B legítimas não têm site público.',
  'Faixa de empregados': 'Dados do CAGED/eSocial sobre funcionários registrados (CLT). "SEM VÍNCULOS" significa zero CLT, mas a empresa pode usar prestadores/PJ.',
  'Faixa de receita': 'Receita mensal estimada pela BDC com base em dados fiscais e econômicos. É uma ESTIMATIVA, não um valor exato.',
  'Passagens web': '"Passagens" são o número de vezes que a empresa apareceu em sites, portais, redes sociais e buscadores. Proxy de visibilidade online.',
};

function DimensionSection({ sectionKey, section }) {
  const [expanded, setExpanded] = useState(false);
  const dimCfg = DIMENSION_CONFIG[sectionKey];
  if (!dimCfg || !section?.items || section.items.length === 0) return null;

  const Icon = dimCfg.icon;
  const totalPts = section.score || 0;
  const critCount = section.items.filter(i => i.risk === 'CRITICO').length;
  const altoCount = section.items.filter(i => i.risk === 'ALTO').length;
  const okCount = section.items.filter(i => i.risk === 'OK' || i.risk === 'BAIXO' || !i.risk).length;
  const totalItems = section.items.length;
  const overallRisk = critCount > 0 ? 'CRITICO' : altoCount > 0 ? 'ALTO' : totalPts > 20 ? 'MEDIO' : 'OK';
  const okPct = totalItems > 0 ? Math.round((okCount / totalItems) * 100) : 0;

  return (
    <div data-dimension-anchor={sectionKey} className="border border-[#0A0A0A]/8 rounded-xl overflow-hidden scroll-mt-20">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-slate-50/50 transition-colors text-left"
      >
        <div className={`p-2 rounded-lg ${RISK_COLORS[overallRisk]?.split(' ')[0] || 'bg-slate-50'}`}>
          <Icon className="w-4 h-4 text-[#0A0A0A]/60" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#0A0A0A]">{dimCfg.label}</span>
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help"><Info className="w-3 h-3 text-[#0A0A0A]/30" /></span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs bg-[#0A0A0A] text-white">
                  <p className="text-[11px] leading-relaxed">{dimCfg.desc}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[10px] text-[#0A0A0A]/40">{totalItems} itens • {totalPts > 0 ? '+' : ''}{totalPts} pts</span>
            {/* Progress bar: % of items with OK/low risk */}
            <div className="flex-1 max-w-[140px] flex items-center gap-1.5">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${okPct >= 70 ? 'bg-emerald-400' : okPct >= 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                  style={{ width: `${okPct}%` }}
                />
              </div>
              <span className="text-[9px] font-mono text-[#0A0A0A]/40 shrink-0">{okCount}/{totalItems} OK</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {critCount > 0 && <Badge className="bg-red-50 text-red-700 border-red-200 border text-[9px]">{critCount} crítico</Badge>}
          {altoCount > 0 && <Badge className="bg-orange-50 text-orange-700 border-orange-200 border text-[9px]">{altoCount} alto</Badge>}
          <div className={`w-2.5 h-2.5 rounded-full ${RISK_DOT[overallRisk]}`} />
          {expanded ? <ChevronUp className="w-4 h-4 text-[#0A0A0A]/30" /> : <ChevronDown className="w-4 h-4 text-[#0A0A0A]/30" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-[#0A0A0A]/5 p-4 space-y-2">
          <p className="text-[10px] text-[#0A0A0A]/40 mb-3">{dimCfg.desc}</p>
          {section.items.map((item, idx) => (
            <DimensionItem key={idx} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function DimensionItem({ item }) {
  const [showHelp, setShowHelp] = useState(false);
  const explanation = ITEM_EXPLANATIONS[item.label];
  const riskColor = RISK_COLORS[item.risk] || RISK_COLORS['INFO'];
  const isCritical = item.risk === 'CRITICO';
  const isAlto = item.risk === 'ALTO';
  const emphasisBorder = isCritical ? 'border-l-4 border-l-red-500' : isAlto ? 'border-l-4 border-l-orange-500' : '';

  return (
    <div className={`rounded-lg p-3 border ${riskColor} ${emphasisBorder}`}>
      <div className="flex items-start gap-2">
        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${RISK_DOT[item.risk] || 'bg-slate-400'}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold">{item.label}</span>
            {item.points !== 0 && (
              <span className={`text-[10px] font-mono ${item.points > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {item.points > 0 ? '+' : ''}{item.points} pts
              </span>
            )}
            <Badge className={`text-[8px] ${riskColor} border`}>{item.risk}</Badge>
            {explanation && (
              <button onClick={() => setShowHelp(!showHelp)} className="text-blue-400 hover:text-blue-600">
                <HelpCircle className="w-3 h-3" />
              </button>
            )}
          </div>
          <p className="text-xs mt-1 leading-relaxed opacity-80">{item.value}</p>
          {showHelp && explanation && (
            <div className="mt-2 p-2.5 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-[11px] text-blue-800 leading-relaxed"><strong>O que isso significa:</strong> {explanation}</p>
            </div>
          )}
          {item.details && typeof item.details === 'object' && (
            <div className="mt-2 text-[10px] opacity-60 space-y-0.5">
              {Object.entries(item.details).map(([k, v]) => (
                <div key={k}><strong>{k}:</strong> {typeof v === 'object' ? JSON.stringify(v) : String(v)}</div>
              ))}
            </div>
          )}
          {item.lawsuits && item.lawsuits.length > 0 && (
            <LawsuitsList lawsuits={item.lawsuits} />
          )}
        </div>
      </div>
    </div>
  );
}

function LawsuitsList({ lawsuits }) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? lawsuits : lawsuits.slice(0, 3);

  return (
    <div className="mt-2 space-y-1.5">
      {displayed.map((lw, i) => (
        <div key={i} className="p-2 bg-white/60 rounded border border-[#0A0A0A]/5 text-[10px]">
          <div className="font-bold text-[#0A0A0A]">📄 {lw.number}</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 mt-1 text-[#0A0A0A]/60">
            {lw.type && <div><strong>Tipo:</strong> {lw.type}</div>}
            {lw.subject && <div><strong>Assunto:</strong> {lw.subject}</div>}
            {lw.court && <div><strong>Tribunal:</strong> {lw.court}</div>}
            {lw.status && <div><strong>Status:</strong> {lw.status}</div>}
            {lw.value != null && <div><strong>Valor:</strong> R$ {Number(lw.value).toLocaleString('pt-BR')}</div>}
            {lw.startDate && <div><strong>Distribuição:</strong> {lw.startDate}</div>}
            {lw.ownerName && <div><strong>Sócio:</strong> {lw.ownerName}</div>}
          </div>
          {lw.parties && lw.parties.length > 0 && (
            <div className="mt-1 text-[#0A0A0A]/50">
              <strong>Partes:</strong> {lw.parties.slice(0, 3).map(p => `${p.name} (${p.specificType || p.type || 'N/I'})`).join(', ')}
            </div>
          )}
        </div>
      ))}
      {lawsuits.length > 3 && (
        <button onClick={() => setShowAll(!showAll)} className="text-[10px] text-blue-600 hover:underline">
          {showAll ? 'Mostrar menos' : `Ver todos os ${lawsuits.length} processos`}
        </button>
      )}
    </div>
  );
}

export default function RiskDimensionalAnalysis({ complianceScore, merchant }) {
  if (!complianceScore?.variaveis_aplicadas) return null;

  const sections = complianceScore.variaveis_aplicadas;
  const sectionKeys = Object.keys(DIMENSION_CONFIG);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <h3 className="text-sm font-bold text-[#0A0A0A]">Análise Dimensional — Dados BDC por Área</h3>
        <Badge className="bg-blue-50 text-blue-700 border-blue-200 border text-[9px]">Dados Objetivos</Badge>
      </div>
      <p className="text-[10px] text-[#0A0A0A]/40 mb-3">
        Cada dimensão mostra dados reais da Big Data Corp, organizados por área de análise. Clique para expandir e ver cada item com explicação.
      </p>
      {sectionKeys.map(key => {
        const section = sections[key];
        if (!section || !section.items || section.items.length === 0) return null;
        return <DimensionSection key={key} sectionKey={key} section={section} />;
      })}
    </div>
  );
}