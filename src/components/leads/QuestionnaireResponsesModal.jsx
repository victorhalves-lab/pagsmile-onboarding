import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Building2, User, Briefcase, DollarSign, PieChart, Clock, ShoppingBag, FileText, ExternalLink, X, CreditCard, Paperclip, History, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SECTION_CONFIG = [
  { id: 'empresa', label: 'Dados da Empresa', icon: Building2, orderRange: [1, 6] },
  { id: 'contato', label: 'Dados do Contato', icon: User, orderRange: [7, 10] },
  { id: 'negocio', label: 'Modelo de Negócio', icon: Briefcase, orderRange: [11, 20] },
  { id: 'financeiro', label: 'Dados Financeiros', icon: DollarSign, orderRange: [21, 31] },
  { id: 'antecipacao', label: 'Antecipação', icon: Clock, orderRange: [32, 37] },
  { id: 'processador', label: 'Processador / Taxas', icon: CreditCard, orderRange: [38, 58] },
  { id: 'produtos', label: 'Produtos', icon: ShoppingBag, orderRange: [59, 65] },
  { id: 'complementar', label: 'Complementares', icon: FileText, orderRange: [66, 80] },
  { id: 'arquivos', label: 'Arquivos', icon: Paperclip, orderRange: [-1, -1] }, // virtual section for file uploads
  { id: 'historico', label: 'Histórico', icon: History, orderRange: [81, 999] },
];

function assignSection(order) {
  for (const sec of SECTION_CONFIG) {
    if (order >= sec.orderRange[0] && order <= sec.orderRange[1]) return sec.id;
  }
  return 'outros';
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'object') {
    return Object.entries(value)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' | ');
  }
  const num = Number(value);
  if (!isNaN(num) && typeof value === 'string' && /^\d+$/.test(value) && num > 10000) {
    return `R$ ${num.toLocaleString('pt-BR')}`;
  }
  return String(value);
}

export default function QuestionnaireResponsesModal({ open, onClose, lead }) {
  const [activeSection, setActiveSection] = useState(null);

  const { data: questions = [], isLoading } = useQuery({
    queryKey: ['questions-for-modal', lead?.leadQuestionnaireTemplateId],
    queryFn: () => base44.entities.Question.filter(
      { questionnaireTemplateId: lead.leadQuestionnaireTemplateId },
      'order',
      200
    ),
    enabled: !!lead?.leadQuestionnaireTemplateId && open,
  });

  const questionnaireData = lead?.questionnaireData || {};

  const { sections, mappedQuestions } = useMemo(() => {
    if (!questions.length) return { sections: [], mappedQuestions: [] };

    const mapped = questions
      .filter(q => questionnaireData[q.id] !== undefined && questionnaireData[q.id] !== '')
      .map(q => ({
        id: q.id,
        text: q.text,
        value: questionnaireData[q.id],
        order: q.order,
        type: q.type,
        section: assignSection(q.order),
      }));

    const usedSections = [...new Set(mapped.map(m => m.section))];
    const orderedSections = SECTION_CONFIG.filter(s => usedSections.includes(s.id));

    return { sections: orderedSections, mappedQuestions: mapped };
  }, [questions, questionnaireData]);

  const activeSec = activeSection || sections[0]?.id;
  const filteredQuestions = mappedQuestions.filter(q => q.section === activeSec);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden bg-[#0d1b2a] border-[#1b2d45] max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white">{lead?.fullName || lead?.companyName || 'Lead'}</h2>
            <p className="text-xs text-white/50">{lead?.cpfCnpj ? `CNPJ: ${lead.cpfCnpj}` : ''} {lead?.protocolo ? `| ${lead.protocolo}` : ''}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onClose(false)} className="text-white/60 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex max-h-[calc(85vh-72px)]">
          {/* Sidebar nav */}
          <div className="w-56 shrink-0 border-r border-white/10 bg-[#0a1628]">
            <ScrollArea className="h-full py-2">
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-[#2bc196]" />
                </div>
              ) : (
                <nav className="space-y-0.5 px-2">
                  {sections.map(sec => {
                    const Icon = sec.icon;
                    const isActive = activeSec === sec.id;
                    const count = mappedQuestions.filter(q => q.section === sec.id).length;
                    return (
                      <button
                        key={sec.id}
                        onClick={() => setActiveSection(sec.id)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${
                          isActive
                            ? 'bg-[#2bc196] text-white font-semibold'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-white/40'}`} />
                        <span className="flex-1 text-left truncate">{sec.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'}`}>{count}</span>
                      </button>
                    );
                  })}
                </nav>
              )}
            </ScrollArea>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <ScrollArea className="h-full">
              <div className="p-6">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-[#2bc196] mb-3" />
                    <p className="text-white/50 text-sm">Carregando respostas...</p>
                  </div>
                ) : filteredQuestions.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-10 h-10 mx-auto text-white/20 mb-2" />
                    <p className="text-white/40 text-sm">Nenhuma resposta nesta seção</p>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {/* Section title */}
                    <h3 className="text-base font-semibold text-white mb-5">
                      {sections.find(s => s.id === activeSec)?.label}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                      {filteredQuestions.map(q => (
                        <div key={q.id} className="space-y-1">
                          <p className="text-xs text-white/40 font-medium">{q.text}</p>
                          <p className="text-sm text-white font-medium leading-relaxed">
                            {q.type === 'TEXT' && String(q.value).startsWith('http') ? (
                              <a href={String(q.value)} target="_blank" rel="noopener noreferrer" className="text-[#2bc196] hover:underline flex items-center gap-1">
                                {String(q.value)} <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              formatValue(q.value)
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
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