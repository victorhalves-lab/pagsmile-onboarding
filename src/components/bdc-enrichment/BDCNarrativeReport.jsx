import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { 
  FileText, Loader2, RefreshCw, AlertTriangle, CheckCircle2, 
  AlertOctagon, Info, ChevronDown, ChevronUp, Sparkles
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

/**
 * BDCNarrativeReport — Generates a clear, human-readable narrative from BDC analysis data.
 * Uses InvokeLLM to transform technical data into an executive report.
 */

const RISK_COLORS = {
  'CRITICO': { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: AlertOctagon },
  'ALTO': { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: AlertTriangle },
  'MEDIO': { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: AlertTriangle },
  'OK': { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: CheckCircle2 },
};

function buildNarrativePrompt(analysis) {
  const isPF = analysis.type === 'PF';
  const sections = analysis.sections || {};
  
  // Extract all items with risk levels for the LLM
  const allItems = [];
  const extractItems = (sectionName, section) => {
    if (section?.items) {
      for (const item of section.items) {
        allItems.push({ section: sectionName, label: item.label, value: item.value, risk: item.risk, points: item.points });
      }
    }
  };

  if (isPF) {
    extractItems('Identidade', sections.identity);
    extractItems('Compliance', sections.compliance);
    extractItems('Reputação', sections.reputation);
  } else {
    extractItems('Dados Cadastrais', sections.identity);
    extractItems('Quadro Societário', sections.owners);
    extractItems('Presença Digital', sections.digital);
    extractItems('Compliance/PLD', sections.compliance);
    extractItems('Reputação', sections.reputation);
    extractItems('Financeiro', sections.financial);
  }

  const blocksText = (analysis.blocks || []).map(b => `- BLOQUEIO ${b.code}: ${b.label} — ${b.detail}`).join('\n');
  const itemsText = allItems.map(i => `[${i.section}] ${i.label}: ${i.value} (risco: ${i.risk}, pontos: ${i.points > 0 ? '+' : ''}${i.points})`).join('\n');

  return `Você é um analista de compliance sênior que precisa explicar os resultados de uma consulta Big Data Corp para um DIRETOR NÃO-TÉCNICO que precisa tomar uma decisão sobre este caso.

DADOS DA ANÁLISE BDC:
- Tipo: ${analysis.type} (${isPF ? 'Pessoa Física' : 'Pessoa Jurídica'})
- Score Final: ${analysis.scoring?.finalScore}/849
- Subfaixa: ${analysis.scoring?.subfaixa} — ${analysis.scoring?.subfaixaNome}
- Composição: Base ${analysis.scoring?.baseScore} + Variáveis ${analysis.scoring?.variablesScore} + Enriquecimento ${analysis.scoring?.enrichmentScore}
- Datasets consultados: ${analysis.datasetsQueried}

${blocksText ? `BLOQUEIOS ATIVOS:\n${blocksText}\n` : 'BLOQUEIOS: Nenhum'}

ITENS ANALISADOS:
${itemsText}

INSTRUÇÕES:
Escreva um relatório em português brasileiro com estas SEÇÕES OBRIGATÓRIAS:

## 📊 Resumo Executivo
Um parágrafo de 3-4 linhas resumindo a situação geral: quem é esta ${isPF ? 'pessoa' : 'empresa'}, seu nível de risco e a recomendação principal.

## 🏢 ${isPF ? 'Perfil da Pessoa' : 'Perfil da Empresa'}
Descreva de forma narrativa os dados cadastrais. Nome, situação, idade, porte, setor — como se estivesse contando a história desta ${isPF ? 'pessoa' : 'empresa'}.

## 👥 ${isPF ? 'Situação Legal' : 'Sócios e Governança'}
${isPF ? 'Explique a situação legal, processos e negativações.' : 'Explique o quadro societário, se há PEPs, sancionados, processos dos sócios.'}

## ⚠️ Pontos de Atenção
Liste CADA item com risco ALTO ou CRITICO, explicando:
1. **O que foi encontrado** (dado objetivo)
2. **Por que é relevante** (impacto regulatório ou operacional)  
3. **O que recomenda** (ação sugerida)

## ✅ Pontos Positivos
Liste os aspectos favoráveis encontrados.

## 📋 Recomendação Final
Parecer conclusivo em 2-3 linhas com a decisão sugerida e eventuais condições.

REGRAS:
- Use linguagem CLARA e DIRETA, como se explicasse para alguém que não entende de compliance
- NÃO use jargão técnico sem explicar o que significa
- NÃO use siglas sem explicar (PEP = Pessoa Politicamente Exposta, etc.)
- Cada achado de risco DEVE ter uma explicação de POR QUE é relevante
- Seja COMPLETO mas LEGÍVEL — cada parágrafo deve ter no máximo 3-4 linhas
- Use negrito para destacar informações importantes`;
}

export default function BDCNarrativeReport({ analysis, complianceScore }) {
  const [narrative, setNarrative] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [error, setError] = useState(null);

  // Auto-generate on mount if analysis available
  useEffect(() => {
    if (analysis && !narrative && !generating) {
      // Check if we have a cached narrative in complianceScore
      if (complianceScore?.analise_completa_ia && complianceScore.analise_completa_ia.length > 200) {
        setNarrative(complianceScore.analise_completa_ia);
        return;
      }
      generateNarrative();
    }
  }, [analysis]);

  const generateNarrative = async () => {
    if (!analysis) return;
    setGenerating(true);
    setError(null);
    try {
      const prompt = buildNarrativePrompt(analysis);
      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        model: 'gemini_3_flash',
      });
      setNarrative(result);
    } catch (e) {
      console.error('Narrative generation error:', e);
      setError('Não foi possível gerar o relatório narrativo. Tente novamente.');
    }
    setGenerating(false);
  };

  if (!analysis) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 hover:bg-slate-50/50 transition-colors text-left"
      >
        <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-50 to-purple-50">
          <Sparkles className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-[#002443]">📝 Relatório Narrativo — Análise BDC em Linguagem Clara</h4>
          <p className="text-[10px] text-[#002443]/40">
            Explicação completa dos dados da Big Data Corp em formato legível
          </p>
        </div>
        <div className="flex items-center gap-2">
          {narrative && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); generateNarrative(); }}
              disabled={generating}
              className="text-[10px] h-7 px-2"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${generating ? 'animate-spin' : ''}`} />
              Regerar
            </Button>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-[#002443]/30" /> : <ChevronDown className="w-4 h-4 text-[#002443]/30" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 p-5">
          {generating && (
            <div className="flex items-center justify-center gap-3 py-8">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
              <p className="text-sm text-[#002443]/60">Gerando relatório narrativo com IA...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
              <p className="text-xs text-red-700 mb-2">{error}</p>
              <Button size="sm" onClick={generateNarrative} className="bg-red-600 hover:bg-red-700 text-white text-xs h-8">
                <RefreshCw className="w-3 h-3 mr-1" /> Tentar Novamente
              </Button>
            </div>
          )}

          {narrative && !generating && (
            <div className="prose prose-sm max-w-none text-[#002443]">
              <ReactMarkdown
                components={{
                  h2: ({ children }) => <h2 className="text-base font-bold text-[#002443] mt-5 mb-2 pb-1 border-b border-slate-100">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-bold text-[#002443] mt-4 mb-1.5">{children}</h3>,
                  p: ({ children }) => <p className="text-[13px] text-[#002443]/80 leading-relaxed my-1.5">{children}</p>,
                  strong: ({ children }) => <strong className="text-[#002443] font-semibold">{children}</strong>,
                  li: ({ children }) => <li className="text-[13px] text-[#002443]/80 leading-relaxed my-1">{children}</li>,
                  ul: ({ children }) => <ul className="list-disc pl-5 my-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 my-2">{children}</ol>,
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-3 border-indigo-300 pl-3 my-3 bg-indigo-50/30 py-2 pr-3 rounded-r-lg text-[13px]">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {narrative}
              </ReactMarkdown>
            </div>
          )}

          {!narrative && !generating && !error && (
            <div className="text-center py-6">
              <FileText className="w-8 h-8 text-[#002443]/20 mx-auto mb-3" />
              <p className="text-sm text-[#002443]/50 mb-3">Clique para gerar um relatório explicativo dos dados BDC</p>
              <Button onClick={generateNarrative} className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 px-4 rounded-lg">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Gerar Relatório Narrativo
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}