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
  Paperclip, Download, Copy, CheckCircle,
  Globe, Package, ArrowRight
} from 'lucide-react';
import CardRatesDisplay, { CARD_RATE_QUESTION_IDS } from './CardRatesDisplay';
import PercentDistributionDisplay, { DISTRIBUTION_QUESTION_IDS } from './PercentDistributionDisplay';

const SECTION_CONFIG = [
  { id: 'empresa', label: 'Dados da Empresa', icon: Building2, accent: 'bg-blue-500', orderRange: [1, 6] },
  { id: 'contato', label: 'Contato', icon: User, accent: 'bg-violet-500', orderRange: [7, 9.99] },
  { id: 'negocio', label: 'Modelo de Negócio', icon: Briefcase, accent: 'bg-amber-500', orderRange: [10, 17] },
  { id: 'financeiro', label: 'Volume & Financeiro', icon: DollarSign, accent: 'bg-emerald-500', orderRange: [18, 22] },
  { id: 'distribuicao', label: 'Distribuição TPV', icon: PieChart, accent: 'bg-indigo-500', orderRange: [23, 31] },
  { id: 'antecipacao', label: 'Antecipação & Débito', icon: Clock, accent: 'bg-cyan-500', orderRange: [32, 37] },
  { id: 'processador', label: 'Processador Atual', icon: CreditCard, accent: 'bg-rose-500', orderRange: [38, 40] },
  { id: 'taxas_cartao', label: 'Taxas de Cartão', icon: CreditCard, accent: 'bg-pink-500', orderRange: [41, 50] },
  { id: 'taxas_outras', label: 'PIX, Boleto & Outras', icon: DollarSign, accent: 'bg-teal-500', orderRange: [51, 58] },
  { id: 'produtos', label: 'Produtos & Integrações', icon: Package, accent: 'bg-orange-500', orderRange: [59, 65] },
  { id: 'complementar', label: 'Complementares', icon: FileText, accent: 'bg-slate-500', orderRange: [66, 80] },
  { id: 'arquivos', label: 'Arquivos Enviados', icon: Paperclip, accent: 'bg-emerald-500', orderRange: [-1, -1] },
  { id: 'extras', label: 'Dados Extras', icon: ShoppingBag, accent: 'bg-gray-500', orderRange: [-2, -2] },
];

const SPECIAL_IDS = new Set([...CARD_RATE_QUESTION_IDS, ...DISTRIBUTION_QUESTION_IDS]);

// Keys to ignore from questionnaireData (internal/system keys)
const IGNORED_KEYS = new Set(['aceite_termos', 'aceite_privacidade']);

function assignSection(order) {
  for (const sec of SECTION_CONFIG) {
    if (sec.orderRange[0] >= 0 && order >= sec.orderRange[0] && order <= sec.orderRange[1]) return sec.id;
  }
  return 'complementar';
}

function formatValue(value, questionText) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (Array.isArray(value)) return value;
  if (typeof value === 'object') return Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(' | ');

  const str = String(value);
  const num = parseFloat(str);
  const qLower = (questionText || '').toLowerCase();

  // ── BLACKLIST: campos que NUNCA devem ser formatados como moeda ──
  const isNeverMoney =
    qLower.includes('celular') || qLower.includes('telefone') || qLower.includes('phone') ||
    qLower.includes('whatsapp') || qLower.includes('fone') ||
    qLower.includes('transaç') || qLower.includes('transac') ||  // transações, transacao
    qLower.includes('quantidade') || qLower.includes('quantas') ||
    qLower.includes('cnpj') || qLower.includes('cpf') ||
    qLower.includes('cep') || qLower.includes('número') || qLower.includes('numero') ||
    qLower.includes('mcc') ||
    qLower.includes('prazo') || qLower.includes('dias') || qLower.includes('meses');
  if (isNeverMoney && !isNaN(num)) {
    return num % 1 === 0 ? num.toLocaleString('pt-BR') : str;
  }

  // ── PERCENTUAL: detectar campos de taxa/percentual ──
  const isPercent = qLower.includes('(%)') || qLower.includes('percentual') ||
    qLower.includes('distribuição') || qLower.includes('% ') ||
    qLower.includes('taxa de cartão') || qLower.includes('taxa de débito') ||
    qLower.includes('taxa pix') || qLower.includes('taxa antifraude');
  if (isPercent && !isNaN(num)) return `${num.toFixed(2).replace('.', ',')}%`;

  // ── WHITELIST: campos que SÃO valor monetário ──
  const isMoney =
    qLower.includes('tpv') || qLower.includes('ticket') || qLower.includes('faturamento') ||
    qLower.includes('(r$)') || qLower.includes('r$') ||
    qLower.includes('valor') || qLower.includes('receita') ||
    qLower.includes('custo') || qLower.includes('preço') || qLower.includes('preco') ||
    qLower.includes('boleto') || qLower.includes('fee') || qLower.includes('3ds') ||
    qLower.includes('chargeback') || qLower.includes('mínimo garantido');
  if (isMoney && !isNaN(num) && num > 0) {
    return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  return str;
}

function ResponseValue({ question }) {
  const { value, text, type } = question;
  const formatted = formatValue(value, text);

  if (formatted === null) return <span className="text-[#002443]/30 italic text-sm">Não informado</span>;

  const isUrl = typeof value === 'string' && (value.startsWith('http') || value.startsWith('www'));
  const isLongText = typeof formatted === 'string' && formatted.length > 120;

  if (Array.isArray(formatted)) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {formatted.map((item, i) => (
          <span key={i} className="inline-flex px-3 py-1.5 rounded-lg bg-[#2bc196]/8 border border-[#2bc196]/15 text-xs font-semibold text-[#002443]">
            {item}
          </span>
        ))}
      </div>
    );
  }

  if (isUrl) {
    const isFileUrl = String(value).match(/\.(pdf|png|jpg|jpeg|doc|docx)(\?|$)/i);
    return (
      <div className="flex items-center gap-2">
        <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[#2bc196] hover:text-[#2bc196]/80 text-sm font-medium transition-colors break-all">
          {isFileUrl ? <Paperclip className="w-3.5 h-3.5 shrink-0" /> : <Globe className="w-3.5 h-3.5 shrink-0" />}
          {isFileUrl ? String(value).split('/').pop()?.substring(0, 40) : value}
          <ExternalLink className="w-3 h-3 shrink-0" />
        </a>
      </div>
    );
  }

  if (type === 'BOOLEAN') {
    const boolVal = value === true || value === 'true';
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${
        boolVal ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
      }`}>
        <span className={`w-2 h-2 rounded-full ${boolVal ? 'bg-emerald-500' : 'bg-red-500'}`} />
        {boolVal ? 'Sim' : 'Não'}
      </span>
    );
  }

  if (typeof formatted === 'string' && formatted.startsWith('R$')) {
    return <span className="text-xl font-bold text-emerald-600 tracking-tight">{formatted}</span>;
  }

  if (typeof formatted === 'string' && formatted.endsWith('%')) {
    return <span className="text-lg font-bold text-indigo-600">{formatted}</span>;
  }

  return (
    <p className={`text-sm text-[#002443] font-medium leading-relaxed ${isLongText ? 'whitespace-pre-wrap' : ''}`}>
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

    const questionMap = new Map(questions.map(q => [q.id, q]));
    const mappedIds = new Set();

    // 1. Map all known questions (except special grouped ones)
    const mapped = questions
      .filter(q => !SPECIAL_IDS.has(q.id))
      .map(q => {
        mappedIds.add(q.id);
        const rawValue = questionnaireData[q.id];
        const hasValue = rawValue !== undefined && rawValue !== null && rawValue !== '';
        const isFile = q.type === 'FILE_UPLOAD' || (typeof rawValue === 'string' && String(rawValue).match(/\.(pdf|png|jpg|jpeg|doc|docx)(\?|$)/i));
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

    // 2. Detect "_outro_descricao" keys
    Object.keys(questionnaireData).forEach(key => {
      if (key.endsWith('_outro_descricao') && questionnaireData[key]) {
        mappedIds.add(key);
        const parentId = key.replace('_outro_descricao', '');
        const parentQ = questionMap.get(parentId);
        mapped.push({
          id: key,
          text: `${parentQ?.text || 'Pergunta'} — Detalhes "Outros"`,
          value: questionnaireData[key],
          hasValue: true,
          order: (parentQ?.order || 99) + 0.5,
          type: 'TEXT',
          section: parentQ ? assignSection(parentQ.order) : 'extras',
        });
      }
    });

    // 3. CRITICAL: Catch ALL remaining questionnaireData keys that weren't mapped
    //    This ensures no response is ever lost, even for hidden/removed questions
    Object.keys(questionnaireData).forEach(key => {
      if (mappedIds.has(key) || IGNORED_KEYS.has(key)) return;
      // Check if it's a special ID (distribution/card rates) — skip those
      if (SPECIAL_IDS.has(key)) return;

      const rawValue = questionnaireData[key];
      const hasValue = rawValue !== undefined && rawValue !== null && rawValue !== '';
      if (!hasValue) return;

      // Try to find a matching question for better text display
      const matchedQ = questionMap.get(key);
      mapped.push({
        id: key,
        text: matchedQ?.text || `Resposta (${key.substring(0, 8)}...)`,
        value: rawValue,
        hasValue: true,
        order: matchedQ?.order || 999,
        type: matchedQ?.type || 'TEXT',
        section: matchedQ ? assignSection(matchedQ.order) : 'extras',
      });
    });

    mapped.sort((a, b) => a.order - b.order);
    const usedSections = [...new Set(mapped.map(m => m.section))];

    // Ensure special sections exist
    if (questions.some(q => DISTRIBUTION_QUESTION_IDS.includes(q.id)) && !usedSections.includes('distribuicao')) {
      usedSections.push('distribuicao');
    }
    if (questions.some(q => CARD_RATE_QUESTION_IDS.includes(q.id)) && !usedSections.includes('taxas_cartao')) {
      usedSections.push('taxas_cartao');
    }

    const orderedSections = SECTION_CONFIG.filter(s => usedSections.includes(s.id));
    return { sections: orderedSections, mappedQuestions: mapped, allQuestions: questions };
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

  const showCardRates = activeSec === 'taxas_cartao' && allQuestions.some(q => CARD_RATE_QUESTION_IDS.includes(q.id));
  const showDistribution = activeSec === 'distribuicao';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl p-0 gap-0 overflow-hidden bg-white border-[#e2e8f0] max-h-[92vh] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-[#e2e8f0] bg-gradient-to-r from-[#002443] to-[#003366]">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#2bc196]/20 flex items-center justify-center border border-[#2bc196]/30">
                  <Building2 className="w-5 h-5 text-[#2bc196]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{lead?.fullName || lead?.companyName || 'Lead'}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    {lead?.cpfCnpj && <span className="text-xs text-white/50 font-mono">{lead.cpfCnpj}</span>}
                    {lead?.protocolo && (
                      <Badge className="bg-[#2bc196]/15 text-[#2bc196] border-[#2bc196]/30 text-[10px] px-2 py-0.5">
                        {lead.protocolo}
                      </Badge>
                    )}
                    {lead?.businessSubCategory && (
                      <Badge className="bg-white/10 text-white/80 border-white/20 text-[10px] px-2 py-0.5">
                        {lead.businessSubCategory}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-white/50">
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-[#2bc196]" />
                  <strong className="text-white/90">{totalAnswered}</strong>/{totalQuestions} respondidas
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  {sections.length} seções
                </span>
                {lead?.tpvMensal > 0 && (
                  <span className="flex items-center gap-1.5 text-emerald-300">
                    <DollarSign className="w-3.5 h-3.5" />
                    TPV R$ {lead.tpvMensal.toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onClose(false)}
              className="text-white/50 hover:text-white hover:bg-white/10 rounded-xl -mt-1 -mr-1">
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="flex max-h-[calc(92vh-120px)]">
          {/* Sidebar — light theme */}
          <div className="w-56 shrink-0 border-r border-[#e2e8f0] bg-[#f8fafc] flex flex-col">
            <ScrollArea className="flex-1 py-2">
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

                    let countLabel = `${answered}/${total}`;
                    if (sec.id === 'distribuicao') countLabel = '3 grupos';
                    if (sec.id === 'taxas_cartao') {
                      const cardAnswered = CARD_RATE_QUESTION_IDS.filter(id => {
                        const v = questionnaireData[id];
                        return v !== undefined && v !== null && v !== '';
                      }).length;
                      countLabel = `${cardAnswered} taxas`;
                    }

                    return (
                      <button key={sec.id} onClick={() => setActiveSection(sec.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all duration-150 ${
                          isActive
                            ? 'bg-white text-[#002443] font-bold shadow-sm border border-[#e2e8f0]'
                            : 'text-[#002443]/60 hover:text-[#002443] hover:bg-white/60'
                        }`}>
                        <div className={`w-6 h-6 rounded-lg ${sec.accent} flex items-center justify-center shrink-0 ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                          <Icon className="w-3 h-3 text-white" />
                        </div>
                        <span className="flex-1 text-left truncate">{sec.label}</span>
                        <span className={`text-[10px] tabular-nums font-semibold ${isActive ? 'text-[#2bc196]' : 'text-[#002443]/30'}`}>
                          {countLabel}
                        </span>
                      </button>
                    );
                  })}
                </nav>
              )}
            </ScrollArea>
          </div>

          {/* Content — light theme */}
          <div className="flex-1 min-w-0 bg-white">
            <ScrollArea className="h-full">
              <div className="p-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-[#2bc196] mb-3" />
                    <p className="text-[#002443]/40 text-sm">Carregando respostas...</p>
                  </div>
                ) : (
                  <div>
                    {/* Section header */}
                    {currentSectionConfig && (
                      <div className="flex items-center gap-3 mb-5 pb-4 border-b border-[#e2e8f0]">
                        <div className={`w-9 h-9 rounded-xl ${currentSectionConfig.accent} flex items-center justify-center shadow-sm`}>
                          <currentSectionConfig.icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-[#002443]">{currentSectionConfig.label}</h3>
                          <p className="text-[11px] text-[#002443]/40">
                            {activeSec === 'distribuicao'
                              ? 'Distribuição percentual do volume de transações'
                              : `${filteredQuestions.filter(q => q.hasValue).length} de ${filteredQuestions.length} respondidas`
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

                    {/* Special: Card rates */}
                    {showCardRates && (
                      <div className="mb-6 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-5">
                        <CardRatesDisplay questions={allQuestions} questionnaireData={questionnaireData} />
                      </div>
                    )}

                    {/* File section */}
                    {activeSec === 'arquivos' ? (
                      filteredQuestions.length === 0 ? (
                        <div className="text-center py-16">
                          <Paperclip className="w-12 h-12 mx-auto text-[#002443]/10 mb-3" />
                          <p className="text-[#002443]/30 text-sm">Nenhum arquivo enviado</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredQuestions.map(q => (
                            <div key={q.id} className="flex items-center justify-between bg-[#f8fafc] rounded-xl px-5 py-4 border border-[#e2e8f0] hover:border-[#2bc196]/30 transition-colors">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                                  <Paperclip className="w-4 h-4 text-emerald-600" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm text-[#002443] font-semibold truncate">{q.text}</p>
                                  <p className="text-[11px] text-[#002443]/40 truncate font-mono">{q.value ? String(q.value).split('/').pop() : 'Não enviado'}</p>
                                </div>
                              </div>
                              {q.value && (
                                <div className="flex gap-1.5 shrink-0 ml-3">
                                  <a href={String(q.value)} target="_blank" rel="noopener noreferrer">
                                    <Button size="sm" className="bg-[#2bc196]/10 text-[#2bc196] hover:bg-[#2bc196]/20 border-0 h-8 text-xs rounded-lg font-semibold">
                                      <ExternalLink className="w-3 h-3 mr-1" /> Abrir
                                    </Button>
                                  </a>
                                  <a href={String(q.value)} download>
                                    <Button size="sm" variant="ghost" className="text-[#002443]/40 hover:text-[#002443] h-8 text-xs rounded-lg">
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
                      /* Regular questions — card-based layout */
                      filteredQuestions.length === 0 && !showCardRates && !showDistribution ? (
                        <div className="text-center py-16">
                          <FileText className="w-12 h-12 mx-auto text-[#002443]/10 mb-3" />
                          <p className="text-[#002443]/30 text-sm">Nenhuma pergunta nesta seção</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredQuestions.map((q, idx) => (
                            <div key={q.id}
                              className={`group relative rounded-xl transition-all duration-150 ${
                                q.hasValue
                                  ? 'bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] hover:border-[#2bc196]/30'
                                  : 'bg-[#fafafa] border border-dashed border-[#e2e8f0] opacity-50'
                              }`}>
                              <div className="px-5 py-4">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    {/* Question label */}
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-[10px] font-bold text-[#002443]/25 tabular-nums">
                                        #{String(idx + 1).padStart(2, '0')}
                                      </span>
                                      <p className="text-xs text-[#002443]/60 font-medium leading-relaxed">{q.text}</p>
                                      {!q.hasValue && (
                                        <span className="text-[9px] bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded font-bold shrink-0 uppercase">
                                          Vazio
                                        </span>
                                      )}
                                    </div>
                                    {/* Answer value — prominent */}
                                    <div className="pl-6">
                                      <ResponseValue question={q} />
                                    </div>
                                  </div>
                                  {q.hasValue && (
                                    <button onClick={() => copyValue(q.id, q.value)}
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-2 rounded-lg hover:bg-[#002443]/5 shrink-0 mt-0.5"
                                      title="Copiar">
                                      {copiedId === q.id
                                        ? <CheckCircle className="w-4 h-4 text-[#2bc196]" />
                                        : <Copy className="w-4 h-4 text-[#002443]/25" />}
                                    </button>
                                  )}
                                </div>
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