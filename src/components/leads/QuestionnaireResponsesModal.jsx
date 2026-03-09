import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import {
  Loader2, Building2, User, Briefcase, DollarSign, PieChart,
  Clock, ShoppingBag, FileText, ExternalLink, X, CreditCard,
  Paperclip, History, Download, Copy, CheckCircle,
  Globe, Phone, Mail, Hash, ToggleLeft, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import CardRatesDisplay, { CARD_RATE_QUESTION_IDS } from './CardRatesDisplay';
import PercentDistributionDisplay, { DISTRIBUTION_QUESTION_IDS } from './PercentDistributionDisplay';

const SECTION_CONFIG = [
  { id: 'empresa', label: 'Dados da Empresa', icon: Building2, color: 'from-blue-500/20 to-blue-600/10', accent: 'text-blue-400', orderRange: [1, 6] },
  { id: 'contato', label: 'Contato', icon: User, color: 'from-violet-500/20 to-violet-600/10', accent: 'text-violet-400', orderRange: [7, 9.9] },
  { id: 'negocio', label: 'Modelo de Negócio', icon: Briefcase, color: 'from-amber-500/20 to-amber-600/10', accent: 'text-amber-400', orderRange: [10, 17] },
  { id: 'financeiro', label: 'Volume & Financeiro', icon: DollarSign, color: 'from-emerald-500/20 to-emerald-600/10', accent: 'text-emerald-400', orderRange: [18, 22] },
  { id: 'distribuicao', label: 'Distribuição TPV', icon: PieChart, color: 'from-indigo-500/20 to-indigo-600/10', accent: 'text-indigo-400', orderRange: [23, 31] },
  { id: 'antecipacao', label: 'Antecipação & Débito', icon: Clock, color: 'from-cyan-500/20 to-cyan-600/10', accent: 'text-cyan-400', orderRange: [32, 37] },
  { id: 'processador', label: 'Processador Atual', icon: CreditCard, color: 'from-rose-500/20 to-rose-600/10', accent: 'text-rose-400', orderRange: [38, 40] },
  { id: 'taxas_cartao', label: 'Taxas de Cartão', icon: CreditCard, color: 'from-pink-500/20 to-pink-600/10', accent: 'text-pink-400', orderRange: [41, 50] },
  { id: 'taxas_outras', label: 'PIX, Boleto & Outras', icon: DollarSign, color: 'from-teal-500/20 to-teal-600/10', accent: 'text-teal-400', orderRange: [51, 58] },
  { id: 'produtos', label: 'Produtos & Integrações', icon: ShoppingBag, color: 'from-orange-500/20 to-orange-600/10', accent: 'text-orange-400', orderRange: [59, 65] },
  { id: 'complementar', label: 'Complementares', icon: FileText, color: 'from-slate-500/20 to-slate-600/10', accent: 'text-slate-400', orderRange: [66, 80] },
  { id: 'arquivos', label: 'Arquivos Enviados', icon: Paperclip, color: 'from-emerald-500/20 to-emerald-600/10', accent: 'text-emerald-400', orderRange: [-1, -1] },
];

// IDs handled by special components (won't render as individual rows)
const SPECIAL_IDS = new Set([...CARD_RATE_QUESTION_IDS, ...DISTRIBUTION_QUESTION_IDS]);

function assignSection(order) {
  for (const sec of SECTION_CONFIG) {
    if (order >= sec.orderRange[0] && order <= sec.orderRange[1]) return sec.id;
  }
  return 'complementar';
}

function formatDisplayValue(value, questionText) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') {
    return Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(' | ');
  }

  const str = String(value);
  const num = parseFloat(str);
  const qLower = (questionText || '').toLowerCase();

  const isMoney = qLower.includes('tpv') || qLower.includes('ticket') || qLower.includes('faturamento') ||
    qLower.includes('(r$)') || qLower.includes('r$') || qLower.includes('valor');
  if (isMoney && !isNaN(num) && num > 0) {
    return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const isPercent = qLower.includes('(%)') || qLower.includes('percentual') || qLower.includes('distribuição') || qLower.includes('% ');
  if (isPercent && !isNaN(num)) {
    return `${num.toFixed(2).replace('.', ',')}%`;
  }

  if (!isNaN(num) && /^\d+\.?\d*$/.test(str.trim()) && num >= 1000) {
    return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return str;
}

function ValueDisplay({ question }) {
  const { value, text, type } = question;
  const formatted = formatDisplayValue(value, text);

  if (formatted === null) {
    return <span className="text-white/20 italic text-sm">Não informado</span>;
  }

  const isUrl = typeof value === 'string' && (value.startsWith('http') || value.startsWith('www'));
  const isLongText = typeof formatted === 'string' && formatted.length > 120;

  if (Array.isArray(formatted)) {
    return (
      <div className="flex flex-wrap gap-1.5 mt-1">
        {formatted.map((item, i) => (
          <span key={i} className="inline-flex px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/80">
            {item}
          </span>
        ))}
      </div>
    );
  }

  if (isUrl) {
    return (
      <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-[#2bc196] hover:text-[#5cf7cf] text-sm font-medium transition-colors break-all">
        <Globe className="w-3.5 h-3.5 shrink-0" />
        {value}
        <ExternalLink className="w-3 h-3 shrink-0" />
      </a>
    );
  }

  if (type === 'BOOLEAN') {
    const boolVal = value === true || value === 'true';
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${boolVal ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
        <span className={`w-2 h-2 rounded-full ${boolVal ? 'bg-emerald-400' : 'bg-red-400'}`} />
        {boolVal ? 'Sim' : 'Não'}
      </span>
    );
  }

  if (typeof formatted === 'string' && formatted.startsWith('R$')) {
    return <span className="text-lg font-bold text-emerald-400 tracking-tight">{formatted}</span>;
  }

  if (typeof formatted === 'string' && formatted.endsWith('%')) {
    return <span className="text-base font-bold text-cyan-400">{formatted}</span>;
  }

  return (
    <p className={`text-sm text-white/90 font-medium leading-relaxed ${isLongText ? 'whitespace-pre-wrap' : ''}`}>
      {formatted}
    </p>
  );
}

export default function QuestionnaireResponsesModal({ open, onClose, lead }) {
  const [activeSection, setActiveSection] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions-for-modal', lead?.leadQuestionnaireTemplateId],
    queryFn: () => base44.entities.Question.filter(
      { questionnaireTemplateId: lead.leadQuestionnaireTemplateId },
      'order', 200
    ),
    enabled: !!lead?.leadQuestionnaireTemplateId && open,
  });

  const questionnaireData = lead?.questionnaireData || {};

  const { sections, mappedQuestions, allQuestions } = useMemo(() => {
    if (!questions.length) return { sections: [], mappedQuestions: [], allQuestions: [] };

    // Map ALL questions — answered or not — but skip special IDs (card rates, distributions)
    const mapped = questions
      .filter(q => !SPECIAL_IDS.has(q.id))
      .map(q => {
        const rawValue = questionnaireData[q.id];
        const hasValue = rawValue !== undefined && rawValue !== null && rawValue !== '';
        const isFile = q.type === 'FILE_UPLOAD' || (typeof rawValue === 'string' && String(rawValue).match(/\.(pdf|png|jpg|jpeg|doc|docx)$/i));
        return {
          id: q.id,
          text: q.text,
          value: hasValue ? rawValue : null,
          hasValue,
          order: q.order,
          type: q.type,
          section: isFile && hasValue ? 'arquivos' : assignSection(q.order),
        };
      });

    // Detect "_outro_descricao" keys
    const allMapped = [...mapped];
    Object.keys(questionnaireData).forEach(key => {
      if (key.endsWith('_outro_descricao') && questionnaireData[key]) {
        const parentQ = questions.find(q => q.id === key.replace('_outro_descricao', ''));
        if (parentQ) {
          allMapped.push({
            id: key,
            text: `${parentQ.text} — Detalhes "Outros"`,
            value: questionnaireData[key],
            hasValue: true,
            order: parentQ.order + 0.5,
            type: 'TEXT',
            section: assignSection(parentQ.order),
          });
        }
      }
    });

    allMapped.sort((a, b) => a.order - b.order);
    const usedSections = [...new Set(allMapped.map(m => m.section))];

    // Add distribuicao section if any distribution data exists
    const hasDistributionQuestions = questions.some(q => DISTRIBUTION_QUESTION_IDS.includes(q.id));
    if (hasDistributionQuestions && !usedSections.includes('distribuicao')) {
      usedSections.push('distribuicao');
    }

    // Add processador section if card rate questions exist
    const hasCardRateQuestions = questions.some(q => CARD_RATE_QUESTION_IDS.includes(q.id));
    if (hasCardRateQuestions && !usedSections.includes('processador')) {
      usedSections.push('processador');
    }

    const orderedSections = SECTION_CONFIG.filter(s => usedSections.includes(s.id));

    const totalAnswered = allMapped.filter(q => q.hasValue).length;

    return { sections: orderedSections, mappedQuestions: allMapped, allQuestions: questions };
  }, [questions, questionnaireData]);

  const activeSec = activeSection || sections[0]?.id;
  const filteredQuestions = mappedQuestions.filter(q => q.section === activeSec);
  const currentSectionConfig = SECTION_CONFIG.find(s => s.id === activeSec);
  const totalAnswered = mappedQuestions.filter(q => q.hasValue).length;
  const totalQuestions = mappedQuestions.length;

  const copyValue = (id, value) => {
    const text = Array.isArray(value) ? value.join(', ') : String(value);
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Check if current section has special components
  const showCardRates = activeSec === 'processador' && allQuestions.some(q => CARD_RATE_QUESTION_IDS.includes(q.id));
  const showDistribution = activeSec === 'distribuicao';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden bg-[#0a0f1a] border-[#1a2540] max-h-[90vh] rounded-2xl">
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-white/[0.06] bg-gradient-to-r from-[#0d1b2a] to-[#142236]">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#2bc196]/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#2bc196]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{lead?.fullName || lead?.companyName || 'Lead'}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {lead?.cpfCnpj && <span className="text-xs text-white/40 font-mono">{lead.cpfCnpj}</span>}
                    {lead?.protocolo && (
                      <Badge className="bg-[#2bc196]/10 text-[#2bc196] border-[#2bc196]/20 text-[10px] px-1.5 py-0">
                        {lead.protocolo}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/40">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-[#2bc196]" />
                  {totalAnswered}/{totalQuestions} respondidas
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  {sections.length} seções
                </span>
                {lead?.tpvMensal > 0 && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <DollarSign className="w-3 h-3" />
                    TPV R$ {lead.tpvMensal.toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onClose(false)}
              className="text-white/40 hover:text-white hover:bg-white/5 rounded-xl -mt-1 -mr-1">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex max-h-[calc(90vh-110px)]">
          {/* Sidebar */}
          <div className="w-60 shrink-0 border-r border-white/[0.06] bg-[#080d18] flex flex-col">
            <ScrollArea className="flex-1 py-3">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-[#2bc196]" />
                </div>
              ) : (
                <nav className="space-y-0.5 px-2">
                  {sections.map(sec => {
                    const Icon = sec.icon;
                    const isActive = activeSec === sec.id;
                    const sectionQs = mappedQuestions.filter(q => q.section === sec.id);
                    const answered = sectionQs.filter(q => q.hasValue).length;
                    const total = sectionQs.length;
                    // For special sections, show special count
                    let countLabel = `${answered}/${total}`;
                    if (sec.id === 'distribuicao') countLabel = '3 grupos';
                    if (sec.id === 'processador') {
                      const cardAnswered = CARD_RATE_QUESTION_IDS.filter(id => {
                        const v = questionnaireData[id];
                        return v !== undefined && v !== null && v !== '';
                      }).length;
                      countLabel = `${answered}/${total} + ${cardAnswered} taxas`;
                    }

                    return (
                      <button key={sec.id} onClick={() => setActiveSection(sec.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all duration-200 ${
                          isActive
                            ? 'bg-gradient-to-r ' + sec.color + ' text-white font-semibold shadow-lg shadow-black/20'
                            : 'text-white/50 hover:text-white/80 hover:bg-white/[0.03]'
                        }`}>
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? sec.accent : 'text-white/30'}`} />
                        <span className="flex-1 text-left truncate">{sec.label}</span>
                        <span className={`text-[10px] tabular-nums px-1.5 py-0.5 rounded-md font-medium ${
                          isActive ? 'bg-white/10 text-white/80' : 'text-white/30'
                        }`}>{countLabel}</span>
                      </button>
                    );
                  })}
                </nav>
              )}
            </ScrollArea>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 bg-[#0a0f1a]">
            <ScrollArea className="h-full">
              <div className="p-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-[#2bc196] mb-3" />
                    <p className="text-white/40 text-sm">Carregando respostas...</p>
                  </div>
                ) : (
                  <div>
                    {/* Section header */}
                    {currentSectionConfig && (
                      <div className="flex items-center gap-3 mb-6">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${currentSectionConfig.color} flex items-center justify-center`}>
                          <currentSectionConfig.icon className={`w-4 h-4 ${currentSectionConfig.accent}`} />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-white">{currentSectionConfig.label}</h3>
                          <p className="text-[11px] text-white/30">
                            {activeSec === 'distribuicao' 
                              ? 'Distribuição percentual do volume de transações'
                              : `${filteredQuestions.filter(q => q.hasValue).length} de ${filteredQuestions.length} respondidas nesta seção`
                            }
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Special: Distribution section */}
                    {showDistribution && (
                      <div className="mb-6">
                        <PercentDistributionDisplay questionnaireData={questionnaireData} />
                      </div>
                    )}

                    {/* Special: Card rates in processador section */}
                    {showCardRates && (
                      <div className="mb-6 bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
                        <CardRatesDisplay questions={allQuestions} questionnaireData={questionnaireData} />
                      </div>
                    )}

                    {/* File section */}
                    {activeSec === 'arquivos' ? (
                      filteredQuestions.length === 0 ? (
                        <div className="text-center py-16">
                          <Paperclip className="w-12 h-12 mx-auto text-white/10 mb-3" />
                          <p className="text-white/30 text-sm">Nenhum arquivo enviado</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredQuestions.map(q => (
                            <div key={q.id} className="flex items-center justify-between bg-white/[0.03] rounded-xl px-5 py-4 border border-white/[0.06] hover:border-white/10 transition-colors">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0">
                                  <Paperclip className="w-4 h-4 text-teal-400" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm text-white font-medium truncate">{q.text}</p>
                                  <p className="text-[11px] text-white/30 truncate font-mono">{q.value ? String(q.value).split('/').pop() : 'Não enviado'}</p>
                                </div>
                              </div>
                              {q.value && (
                                <div className="flex gap-1.5 shrink-0 ml-3">
                                  <a href={String(q.value)} target="_blank" rel="noopener noreferrer">
                                    <Button size="sm" className="bg-[#2bc196]/10 text-[#2bc196] hover:bg-[#2bc196]/20 border-0 h-8 text-xs rounded-lg">
                                      <ExternalLink className="w-3 h-3 mr-1" /> Abrir
                                    </Button>
                                  </a>
                                  <a href={String(q.value)} download>
                                    <Button size="sm" variant="ghost" className="text-white/40 hover:text-white hover:bg-white/5 h-8 text-xs rounded-lg">
                                      <Download className="w-3 h-3 mr-1" /> Baixar
                                    </Button>
                                  </a>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )
                    ) : (
                      /* Regular questions */
                      filteredQuestions.length === 0 && !showCardRates && !showDistribution ? (
                        <div className="text-center py-16">
                          <FileText className="w-12 h-12 mx-auto text-white/10 mb-3" />
                          <p className="text-white/30 text-sm">Nenhuma pergunta nesta seção</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {filteredQuestions.map(q => (
                            <div key={q.id}
                              className={`group relative border rounded-xl px-5 py-4 transition-all duration-200 ${
                                q.hasValue
                                  ? 'bg-white/[0.02] hover:bg-white/[0.04] border-white/[0.04] hover:border-white/[0.08]'
                                  : 'bg-white/[0.01] border-white/[0.02] opacity-60'
                              }`}>
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1.5">
                                    <p className="text-[11px] text-white/35 font-medium leading-relaxed">{q.text}</p>
                                    {!q.hasValue && (
                                      <span className="text-[9px] bg-amber-500/10 text-amber-400/70 px-1.5 py-0.5 rounded-md font-medium shrink-0">
                                        NÃO RESPONDIDA
                                      </span>
                                    )}
                                  </div>
                                  <ValueDisplay question={q} />
                                </div>
                                {q.hasValue && (
                                  <button onClick={() => copyValue(q.id, q.value)}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/5 shrink-0 mt-0.5">
                                    {copiedId === q.id
                                      ? <CheckCircle className="w-3.5 h-3.5 text-[#2bc196]" />
                                      : <Copy className="w-3.5 h-3.5 text-white/30" />}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}