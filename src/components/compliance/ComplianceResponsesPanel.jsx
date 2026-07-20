import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, FileCheck, Search, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import ResponsesSectionNav from './ResponsesSectionNav';
import ResponseCard from './ResponseCard';

function cleanSectionName(rawSection) {
  if (!rawSection) return 'Geral';
  // Remove leading numbers, dots, dashes
  let name = rawSection.replace(/^\d+[\.\-\s]*/, '').trim();
  // Capitalize first letter
  if (name) name = name.charAt(0).toUpperCase() + name.slice(1);
  return name || 'Geral';
}

function extractSection(questionText) {
  if (!questionText) return 'Geral';
  // Detect "Top 5 maiores clientes" group (gateways/marketplaces)
  if (/top\s*5\s*maior(es)?\s*cliente|maior\s*cliente.*top\s*5/i.test(questionText)) {
    return 'Top 5 Maiores Clientes';
  }
  // Try "Section - Question" pattern
  const dashSplit = questionText.split(' - ');
  if (dashSplit.length > 1) return cleanSectionName(dashSplit[0]);
  // Try "1. Section" pattern
  const dotSplit = questionText.match(/^(\d+\.?\s+.+?)(?:\s*[-:])(.+)/);
  if (dotSplit) return cleanSectionName(dotSplit[1]);
  return 'Geral';
}

function deduplicateResponses(responses) {
  const seen = new Map();
  
  for (const r of responses) {
    // Create a normalized key from the question text (lowercased, trimmed)
    const qText = (r.questionText || '').toLowerCase().trim();
    // Also check the actual question portion (after section separator)
    const parts = qText.split(' - ');
    const questionPart = parts.length > 1 ? parts.slice(1).join(' - ').trim() : qText;
    
    // Use question text as dedup key
    const key = questionPart;
    
    if (!seen.has(key)) {
      seen.set(key, r);
    } else {
      // Keep the one with a value, or the most recent one
      const existing = seen.get(key);
      const existingHasValue = existing.valueText || existing.valueNumber !== undefined || existing.valueBoolean !== undefined || (existing.valueArray && existing.valueArray.length > 0);
      const newHasValue = r.valueText || r.valueNumber !== undefined || r.valueBoolean !== undefined || (r.valueArray && r.valueArray.length > 0);
      
      if (!existingHasValue && newHasValue) {
        seen.set(key, r);
      }
    }
  }
  
  return Array.from(seen.values());
}

function getDisplayValue(response) {
  if (response.valueText) return response.valueText;
  if (response.valueNumber !== undefined && response.valueNumber !== null) return response.valueNumber;
  if (response.valueBoolean !== undefined && response.valueBoolean !== null) return response.valueBoolean;
  if (response.valueArray && response.valueArray.length > 0) {
    // Ensure no objects in array — stringify them
    return response.valueArray.map(item => 
      (item && typeof item === 'object') ? JSON.stringify(item) : item
    );
  }
  return null;
}

function getDisplayQuestion(response, section) {
  const q = response.questionText || 'Pergunta';
  // Remove section prefix if present
  const prefix = section + ' - ';
  if (q.startsWith(prefix)) return q.slice(prefix.length);
  // Also try with numbers
  const cleanQ = q.replace(/^\d+[\.\-\s]*/, '').trim();
  if (cleanQ.startsWith(section)) {
    return cleanQ.slice(section.length).replace(/^\s*[-:]\s*/, '').trim() || q;
  }
  return q;
}

export default function ComplianceResponsesPanel({ caseId, questionnaireTemplateId }) {
  const [activeSection, setActiveSection] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const { data: rawResponses = [], isLoading } = useQuery({
    queryKey: ['responses-panel', caseId],
    queryFn: () => base44.entities.QuestionnaireResponse.filter({ onboardingCaseId: caseId }),
    enabled: !!caseId
  });

  // Fetch questions for ordering
  const { data: questions = [] } = useQuery({
    queryKey: ['questions-order', questionnaireTemplateId],
    queryFn: () => base44.entities.Question.filter({ questionnaireTemplateId }),
    enabled: !!questionnaireTemplateId
  });

  const { sections, groupedResponses, totalAnswered, totalQuestions } = useMemo(() => {
    if (!rawResponses.length) return { sections: [], groupedResponses: {}, totalAnswered: 0, totalQuestions: 0 };

    // Build question order map
    const questionOrderMap = {};
    questions.forEach(q => {
      questionOrderMap[q.id] = q.order ?? 999;
    });

    // Sort responses by question order first
    const orderedResponses = [...rawResponses].sort((a, b) => {
      const orderA = questionOrderMap[a.questionId] ?? 999;
      const orderB = questionOrderMap[b.questionId] ?? 999;
      return orderA - orderB;
    });

    // Deduplicate (preserving order)
    const responses = deduplicateResponses(orderedResponses);

    // Group by section (preserving insertion order from sorted responses)
    const groups = {};
    const sectionInsertionOrder = [];
    for (const r of responses) {
      const section = extractSection(r.questionText);
      if (!groups[section]) {
        groups[section] = [];
        sectionInsertionOrder.push(section);
      }
      groups[section].push(r);
    }

    // Build section list preserving the insertion order (which follows question order)
    const sectionList = sectionInsertionOrder.map(name => ({
      name,
      count: groups[name].filter(r => getDisplayValue(r) !== null).length,
      total: groups[name].length,
    }));

    const totalA = responses.filter(r => getDisplayValue(r) !== null).length;

    return {
      sections: sectionList,
      groupedResponses: groups,
      totalAnswered: totalA,
      totalQuestions: responses.length,
    };
  }, [rawResponses, questions]);

  // Active section
  const currentSection = activeSection || sections[0]?.name;
  const currentResponses = (groupedResponses[currentSection] || []);

  // Search filter
  const filteredResponses = searchTerm
    ? currentResponses.filter(r =>
        (r.questionText || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(getDisplayValue(r) || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    : currentResponses;

  const completionPercent = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-[#1356E2] mb-3" />
        <p className="text-[#0A0A0A]/40 text-sm">Carregando respostas...</p>
      </div>
    );
  }

  if (rawResponses.length === 0) {
    return (
      <div className="text-center py-16">
        <FileCheck className="w-12 h-12 mx-auto text-[#0A0A0A]/15 mb-4" />
        <p className="text-[#0A0A0A]/50 font-medium">Nenhuma resposta registrada</p>
        <p className="text-sm text-[#0A0A0A]/30 mt-1">O questionário ainda não foi preenchido</p>
      </div>
    );
  }

  const handleExportPdf = async () => {
    setDownloadingPdf(true);
    try {
      const response = await base44.functions.fetch('generateCompliancePdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onboardingCaseId: caseId })
      });
      if (!response.ok) {
        throw new Error('Erro ao gerar PDF');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance_respostas_${caseId}.pdf`;
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

  return (
    <div className="space-y-5">
      {/* Stats bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0A0A0A]/[0.03] to-[#1356E2]/[0.05] rounded-xl p-4 border border-[#0A0A0A]/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#1356E2]" />
            <span className="text-sm font-semibold text-[#0A0A0A]">
              {totalAnswered} de {totalQuestions} respondidas
            </span>
          </div>
          <div className="w-32">
            <Progress value={completionPercent} className="h-2" />
          </div>
          <span className="text-xs font-bold text-[#1356E2]">{completionPercent}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-[#0A0A0A]/5 text-[#0A0A0A]/70 border-0 text-xs">
            {sections.length} seções
          </Badge>
          {rawResponses.length !== deduplicateResponses(rawResponses).length && (
            <Badge className="bg-amber-50 text-amber-600 border-0 text-xs">
              <AlertCircle className="w-3 h-3 mr-1" />
              {rawResponses.length - deduplicateResponses(rawResponses).length} duplicadas removidas
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportPdf}
            disabled={downloadingPdf}
            className="text-[#0A0A0A]/70 border-[#0A0A0A]/10 hover:bg-[#1356E2]/5 hover:border-[#1356E2]/30 hover:text-[#1356E2] text-xs rounded-lg ml-2"
          >
            {downloadingPdf ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <FileText className="w-3.5 h-3.5 mr-1.5" />}
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A0A0A]/30" />
        <Input
          placeholder="Buscar pergunta ou resposta..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 bg-white border-[#0A0A0A]/8 focus:border-[#1356E2]/40"
        />
      </div>

      {/* Section navigation */}
      <ResponsesSectionNav
        sections={sections}
        activeSection={currentSection}
        onSelect={(s) => { setActiveSection(s); setSearchTerm(''); }}
      />

      {/* Section content header */}
      {currentSection && (
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-[#0A0A0A]">{currentSection}</h4>
          <span className="text-xs text-[#0A0A0A]/40">
            {filteredResponses.filter(r => getDisplayValue(r) !== null).length} de {filteredResponses.length} preenchidas
          </span>
        </div>
      )}

      {/* Responses grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredResponses.map((r, idx) => (
          <ResponseCard
            key={r.id || idx}
            question={getDisplayQuestion(r, currentSection)}
            value={getDisplayValue(r)}
            type={r.questionType}
          />
        ))}
      </div>

      {filteredResponses.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <Search className="w-8 h-8 mx-auto text-[#0A0A0A]/15 mb-2" />
          <p className="text-sm text-[#0A0A0A]/40">Nenhum resultado para "{searchTerm}"</p>
        </div>
      )}
    </div>
  );
}