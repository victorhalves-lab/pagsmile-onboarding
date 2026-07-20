import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, User, MapPin, Briefcase, Shield, FileCheck, CheckCircle2, Phone, Globe, FileText } from 'lucide-react';
import { toast } from 'sonner';

const SECTIONS = [
  { key: 'identificacao', label: 'Identificação Pessoal', icon: User, orders: [1, 2, 3, 4, 5] },
  { key: 'contato', label: 'Contato', icon: Phone, orders: [6, 7] },
  { key: 'endereco', label: 'Endereço', icon: MapPin, orders: [8, 9, 10, 11, 12, 13, 14] },
  { key: 'atividade', label: 'Atividade e Negócio', icon: Briefcase, orders: [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28] },
  { key: 'compliance', label: 'Compliance / PLD', icon: Shield, orders: [29, 30, 31, 32] },
  { key: 'declaracoes', label: 'Declarações', icon: FileCheck, orders: [33, 34] },
];

// PF template ID
const PF_TEMPLATE_ID = '69d3a6f9c4e4c1914cdb8602';

function getDisplayValue(r) {
  if (r.valueText) return r.valueText;
  if (r.valueNumber !== undefined && r.valueNumber !== null) {
    return `R$ ${Number(r.valueNumber).toLocaleString('pt-BR')}`;
  }
  if (r.valueBoolean === true) return 'Sim';
  if (r.valueBoolean === false) return 'Não';
  if (r.valueArray?.length > 0) return r.valueArray.join(', ');
  return '—';
}

export default function SubsellerPFResponsesInline({ caseId, merchantName }) {
  const [activeSection, setActiveSection] = useState('identificacao');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const handleExportPdf = async () => {
    setDownloadingPdf(true);
    try {
      const response = await base44.functions.fetch('generateCompliancePdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingCaseId: caseId })
      });
      if (!response.ok) throw new Error('Erro ao gerar PDF');
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance_pf_${merchantName || caseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF gerado com sucesso!');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Erro ao gerar PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ['pf-responses-inline', caseId],
    queryFn: () => base44.entities.QuestionnaireResponse.filter({ onboardingCaseId: caseId }),
    enabled: !!caseId,
  });

  // Try to get template ID from the onboarding case
  const { data: onboardingCase } = useQuery({
    queryKey: ['pf-case-for-template', caseId],
    queryFn: async () => {
      const cases = await base44.entities.OnboardingCase.filter({ id: caseId });
      return cases[0] || null;
    },
    enabled: !!caseId,
  });

  const templateId = onboardingCase?.questionnaireTemplateId || PF_TEMPLATE_ID;

  const { data: questions = [] } = useQuery({
    queryKey: ['pf-questions-inline', templateId],
    queryFn: () => base44.entities.Question.filter({ questionnaireTemplateId: templateId }, 'order'),
    enabled: !!templateId,
  });

  const questionOrderMap = useMemo(() => {
    const m = {};
    questions.forEach(q => { m[q.id] = q.order; });
    return m;
  }, [questions]);

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

  const totalAnswered = responses.filter(r =>
    r.valueText || r.valueNumber !== undefined || r.valueBoolean !== undefined || r.valueArray?.length > 0
  ).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--pinbank-blue)]" />
      </div>
    );
  }

  if (responses.length === 0) {
    return (
      <div className="text-center py-12">
        <FileCheck className="w-12 h-12 mx-auto text-[#0A0A0A]/15 mb-4" />
        <p className="text-[#0A0A0A]/50 font-medium">Nenhuma resposta registrada</p>
      </div>
    );
  }

  return (
    <div>
      {/* PF Header badge */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[var(--pinbank-blue)]/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-100">
            <User className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--pinbank-blue)]">{merchantName || 'Subseller PF'}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge className="bg-purple-100 text-purple-700 border-0 text-xs">PESSOA FÍSICA</Badge>
              <span className="text-xs text-[var(--pinbank-blue)]/50">
                {totalAnswered} respostas
              </span>
            </div>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportPdf}
          disabled={downloadingPdf}
          className="text-[#0A0A0A]/70 border-[#0A0A0A]/10 hover:bg-[#1356E2]/5 hover:border-[#1356E2]/30 hover:text-[#1356E2] text-xs rounded-lg"
        >
          {downloadingPdf ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-1.5" />}
          Exportar PDF
        </Button>
      </div>

      <div className="flex gap-4 min-h-[400px]">
        {/* Section navigation */}
        <div className="w-52 flex-shrink-0 space-y-1">
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
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[var(--pinbank-blue)]/5">
            {React.createElement(currentSection.icon, { className: 'w-4 h-4 text-[var(--pinbank-blue)]' })}
            <h3 className="text-sm font-bold text-[var(--pinbank-blue)]">{currentSection.label}</h3>
          </div>

          {sectionResponses.length === 0 ? (
            <p className="text-sm text-[var(--pinbank-blue)]/40 text-center py-8">Nenhuma resposta nesta seção.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sectionResponses.map((r, idx) => (
                <div key={r.id || idx} className="bg-[#f4f4f4] rounded-xl p-3.5">
                  <p className="text-xs font-medium text-[var(--pinbank-blue)]/60 mb-1">{r.questionText}</p>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[var(--pinbank-blue)] mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-semibold text-[var(--pinbank-blue)]">{getDisplayValue(r)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}