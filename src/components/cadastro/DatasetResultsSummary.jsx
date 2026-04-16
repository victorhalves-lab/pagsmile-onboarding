import React, { useState } from 'react';
import { Database, ChevronDown, ChevronUp, CheckCircle2, AlertTriangle, XCircle, Shield, Building2, Users, Globe, TrendingUp, User, Phone, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SECTION_META = {
  identity: { label: 'Dados Cadastrais', icon: Building2, color: 'blue', desc: 'Razão social, CNPJ, situação na Receita, data de fundação, porte, capital social, natureza jurídica e CNAEs.' },
  owners: { label: 'Quadro Societário / UBOs', icon: Users, color: 'violet', desc: 'Sócios, administradores, participações cruzadas, PEP entre sócios, grupo econômico.' },
  digital: { label: 'Presença Digital', icon: Globe, color: 'cyan', desc: 'Domínios registrados, websites ativos, presença em redes sociais, atividade online.' },
  compliance: { label: 'Compliance / PLD', icon: Shield, color: 'red', desc: 'Sanções (CEIS/CNEP/OFAC), processos judiciais, dívida ativa da União, protestos, PEPs.' },
  reputation: { label: 'Reputação / Mídia', icon: TrendingUp, color: 'amber', desc: 'Notícias na mídia, avaliações públicas, Reclame Aqui, menções negativas.' },
  financial: { label: 'Financeiro / Mercado', icon: TrendingUp, color: 'emerald', desc: 'Registro BCB/CVM, grupo econômico, MCC, ativos, indicadores de mercado.' },
  evolution: { label: 'Evolução Histórica', icon: TrendingUp, color: 'indigo', desc: 'Evolução de capital social, funcionários, alterações cadastrais ao longo do tempo.' },
  esg: { label: 'ESG / Lista Suja', icon: Shield, color: 'red', desc: 'Lista Suja do MTE (trabalho escravo), autuações IBAMA, indicadores ESG.' },
  contacts: { label: 'Validação de Contatos', icon: Phone, color: 'blue', desc: 'Telefones e e-mails validados, confirmação de canais de contato.' },
  employeesKyc: { label: 'KYC Funcionários', icon: Users, color: 'violet', desc: 'PEP e sanções entre funcionários-chave da empresa.' },
  sectorial: { label: 'Dados Setoriais', icon: Database, color: 'slate', desc: 'ANVISA, CVM, ANS, OAB, CRM, CREA — registros setoriais específicos.' },
  assets: { label: 'Ativos Patrimoniais', icon: Database, color: 'slate', desc: 'Imóveis, veículos, aeronaves, embarcações registradas.' },
  creditRisk: { label: 'Risco de Crédito', icon: Shield, color: 'orange', desc: 'Score de crédito, inadimplência, protestos, cheques devolvidos, capacidade financeira.' },
};

const RISK_CONFIG = {
  CRITICO: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-700', label: 'Crítico' },
  ALTO: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700', label: 'Alto' },
  MEDIO: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700', label: 'Moderado' },
  BAIXO: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700', label: 'Baixo' },
  OK: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-700', label: 'OK' },
  INFO: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-600', badge: 'bg-slate-100 text-slate-600', label: 'Info' },
};

function getSectionOverallRisk(items) {
  if (!items?.length) return 'OK';
  const hasCritical = items.some(i => i.risk === 'CRITICO');
  const hasHigh = items.some(i => i.risk === 'ALTO');
  const hasMedium = items.some(i => i.risk === 'MEDIO');
  if (hasCritical) return 'CRITICO';
  if (hasHigh) return 'ALTO';
  if (hasMedium) return 'MEDIO';
  return 'OK';
}

function translateItemToBusinessLanguage(item) {
  if (!item) return '';
  const label = item.label || item.key || '';
  const val = item.value ?? '';
  const risk = item.risk || 'OK';
  const points = item.points || 0;

  // Build a natural sentence
  if (risk === 'OK' || risk === 'INFO' || risk === 'BAIXO') {
    if (points < 0) return `${label}: ${val} (favorável, -${Math.abs(points)} pts no score)`;
    return `${label}: ${val}`;
  }
  if (risk === 'CRITICO' || risk === 'ALTO') {
    return `${label}: ${val} (+${points} pts no score — requer atenção)`;
  }
  return `${label}: ${val} (+${points} pts)`;
}

const SECTION_ORDER = ['compliance', 'creditRisk', 'owners', 'identity', 'reputation', 'digital', 'financial', 'evolution', 'esg', 'contacts', 'employeesKyc', 'sectorial', 'assets'];

// Map analise_dimensional to a sections-like format for fallback display
function buildSectionsFromDimensional(dim) {
  if (!dim || typeof dim !== 'object') return {};
  const MAP = {
    identidade: 'identity',
    socios: 'owners',
    compliance: 'compliance',
    digital: 'digital',
    reputacao: 'reputation',
    financeiro: 'financial',
    biometria: null,
  };
  const result = {};
  for (const [dimKey, data] of Object.entries(dim)) {
    const sectionKey = MAP[dimKey];
    if (!sectionKey || !data) continue;
    const items = (data.findings || []).map((f, i) => ({
      key: `finding_${i}`,
      label: f.replace(/\[FONTE:\s*[^\]]*\]\s*/gi, '').trim(),
      value: '',
      risk: data.veredicto === 'REPROVADO' ? 'CRITICO' : data.veredicto === 'ATENCAO' ? 'MEDIO' : 'OK',
      points: 0,
    }));
    if (items.length > 0) {
      result[sectionKey] = { items, score: 0 };
    }
  }
  return result;
}

export default function DatasetResultsSummary({ score }) {
  const [expandedSection, setExpandedSection] = useState(null);
  let sections = score?.variaveis_aplicadas || {};
  
  // Fallback: if variaveis_aplicadas is empty, try analise_dimensional
  if (Object.keys(sections).length === 0 && score?.analise_dimensional) {
    sections = buildSectionsFromDimensional(score.analise_dimensional);
  }
  
  const activeKeys = SECTION_ORDER.filter(k => sections[k]?.items?.length > 0);

  if (activeKeys.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/40 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Layers className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--pagsmile-blue)]">O Que Cada Dataset Encontrou</h3>
            <p className="text-xs text-[var(--pagsmile-blue)]/40">Resumo em linguagem de negócio de cada dimensão analisada pela Big Data Corp</p>
          </div>
          <Badge variant="outline" className="ml-auto text-[10px]">{activeKeys.length} dimensões</Badge>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        {activeKeys.map(key => {
          const section = sections[key];
          const meta = SECTION_META[key] || { label: key, icon: Database, color: 'slate', desc: '' };
          const items = section?.items || [];
          const overallRisk = getSectionOverallRisk(items);
          const riskCfg = RISK_CONFIG[overallRisk] || RISK_CONFIG.OK;
          const sectionScore = section?.score || 0;
          const isExpanded = expandedSection === key;
          const Icon = meta.icon;

          const criticalItems = items.filter(i => i.risk === 'CRITICO' || i.risk === 'ALTO');
          const goodItems = items.filter(i => (i.points || 0) < 0);

          return (
            <div key={key} className={`rounded-xl border ${riskCfg.border} ${riskCfg.bg} overflow-hidden`}>
              <button
                onClick={() => setExpandedSection(isExpanded ? null : key)}
                className="w-full p-4 text-left hover:opacity-90 transition-opacity"
              >
                <div className="flex items-start gap-3">
                  <Icon className={`w-5 h-5 ${riskCfg.text} flex-shrink-0 mt-0.5`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-sm font-bold text-[var(--pagsmile-blue)]">{meta.label}</span>
                      <Badge className={`text-[9px] border-0 ${riskCfg.badge}`}>{riskCfg.label}</Badge>
                      {sectionScore !== 0 && (
                        <span className={`text-[10px] font-bold ${sectionScore > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {sectionScore > 0 ? '+' : ''}{sectionScore} pts
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[var(--pagsmile-blue)]/50 leading-relaxed">{meta.desc}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px]">
                      <span className="text-[var(--pagsmile-blue)]/40">{items.length} itens</span>
                      {criticalItems.length > 0 && <span className="text-red-600 font-semibold">{criticalItems.length} atenção</span>}
                      {goodItems.length > 0 && <span className="text-green-600 font-semibold">{goodItems.length} favoráveis</span>}
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-1.5 border-t border-white/50">
                  {items.map((item, i) => {
                    const itemRisk = RISK_CONFIG[item.risk] || RISK_CONFIG.OK;
                    const StatusIcon = (item.risk === 'CRITICO' || item.risk === 'ALTO') ? XCircle 
                      : (item.risk === 'MEDIO') ? AlertTriangle : CheckCircle2;
                    return (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/70">
                        <StatusIcon className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${itemRisk.text}`} />
                        <span className="text-xs text-[var(--pagsmile-blue)]/80 leading-relaxed">
                          {translateItemToBusinessLanguage(item)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}