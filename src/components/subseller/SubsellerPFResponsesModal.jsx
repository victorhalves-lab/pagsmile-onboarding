import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, User, MapPin, Briefcase, Shield, FileCheck, CheckCircle2 } from 'lucide-react';

const SECTIONS = [
  { key: 'identificacao', label: 'Identificação Pessoal', icon: User, orders: [1, 2, 3, 4, 5] },
  { key: 'contato', label: 'Contato', icon: User, orders: [6, 7] },
  { key: 'endereco', label: 'Endereço', icon: MapPin, orders: [8, 9, 10, 11, 12, 13, 14] },
  { key: 'atividade', label: 'Atividade e Negócio', icon: Briefcase, orders: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28] },
  { key: 'compliance', label: 'Compliance / PLD', icon: Shield, orders: [29, 30, 31, 32] },
  { key: 'declaracoes', label: 'Declarações', icon: FileCheck, orders: [33, 34] },
];

function getDisplayValue(r) {
  if (r.valueText) return r.valueText;
  if (r.valueNumber !== undefined && r.valueNumber !== null) return `R$ ${Number(r.valueNumber).toLocaleString('pt-BR')}`;
  if (r.valueBoolean === true) return 'Sim';
  if (r.valueBoolean === false) return 'Não';
  if (r.valueArray?.length > 0) return r.valueArray.join(', ');
  return '—';
}

export default function SubsellerPFResponsesModal({ open, onClose, caseId, merchantName }) {
  const [activeSection, setActiveSection] = useState('identificacao');

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ['pf-responses', caseId],
    queryFn: () => base44.entities.QuestionnaireResponse.filter({ onboardingCaseId: caseId }),
    enabled: !!caseId && open,
  });

  const { data: questions = [] } = useQuery({
    queryKey: ['pf-questions', '69d3a6f9c4e4c1914cdb8602'],
    queryFn: () => base44.entities.Question.filter({ questionnaireTemplateId: '69d3a6f9c4e4c1914cdb8602' }, 'order'),
    enabled: open,
  });

  // Map questionId -> order
  const questionOrderMap = useMemo(() => {
    const m = {};
    questions.forEach(q => { m[q.id] = q.order; });
    return m;
  }, [questions]);

  // Map responses by question order
  const responseByOrder = useMemo(() => {
    const m = {};
    responses.forEach(r => {
      const order = questionOrderMap[r.questionId];
      if (order) m[order] = r;
    });
    return m;
  }, [responses, questionOrderMap]);

  const currentSection = SECTIONS.find(s => s.key === activeSection) || SECTIONS[0];
  const sectionResponses = currentSection.orders
    .map(order => responseByOrder[order])
    .filter(Boolean);

  const totalAnswered = responses.filter(r => r.valueText || r.valueNumber !== undefined || r.valueBoolean !== undefined || r.valueArray?.length > 0).length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-100">
              <User className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <DialogTitle className="text-lg">{merchantName || 'Subseller PF'}</DialogTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">PESSOA FÍSICA</Badge>
                <span className="text-xs text-[var(--pinbank-blue)]/50">
                  {totalAnswered} respostas
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--pinbank-blue)]" />
          </div>
        ) : (
          <div className="flex gap-4 flex-1 min-h-0 mt-4">
            {/* Section navigation */}
            <div className="w-48 flex-shrink-0 space-y-1 overflow-y-auto">
              {SECTIONS.map(s => {
                const Icon = s.icon;
                const answered = s.orders.filter(o => responseByOrder[o]).length;
                const isActive = activeSection === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => setActiveSection(s.key)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all
                      ${isActive ? 'bg-[var(--pinbank-blue)] text-white' : 'text-[var(--pinbank-blue)]/70 hover:bg-[#f4f4f4]'}`}
                  >
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-[var(--pinbank-blue)]' : ''}`} />
                    <span className="flex-1 truncate">{s.label}</span>
                    <span className={`text-[10px] ${isActive ? 'text-white/60' : 'text-[var(--pinbank-blue)]/30'}`}>{answered}</span>
                  </button>
                );
              })}
            </div>

            {/* Responses */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--pinbank-blue)]/5">
                {React.createElement(currentSection.icon, { className: 'w-4 h-4 text-[var(--pinbank-blue)]' })}
                <h3 className="text-sm font-bold text-[var(--pinbank-blue)]">{currentSection.label}</h3>
              </div>

              {sectionResponses.length === 0 ? (
                <p className="text-sm text-[var(--pinbank-blue)]/40 text-center py-8">Nenhuma resposta nesta seção.</p>
              ) : (
                sectionResponses.map((r, idx) => (
                  <div key={r.id || idx} className="bg-[#f4f4f4] rounded-xl p-3.5">
                    <p className="text-xs font-medium text-[var(--pinbank-blue)]/60 mb-1">{r.questionText}</p>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[var(--pinbank-blue)] mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-semibold text-[var(--pinbank-blue)]">{getDisplayValue(r)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}