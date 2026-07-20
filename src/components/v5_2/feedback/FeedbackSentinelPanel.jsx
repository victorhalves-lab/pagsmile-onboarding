import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  MessageSquare, Send, CheckCircle2, History, Loader2, ShieldCheck, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  FEEDBACK_TYPES,
  getCategoriesForFeedbackType,
} from './feedbackCategoriesCatalog';

/**
 * [V5.2 Fase 6.5.6] Painel de Feedback Estruturado do SENTINEL
 * (DOC4 Cap. 19.8 + DOC6 §2.6.6 + Q55).
 *
 * Permite ao analista, ao final da análise:
 *   1. Marcar se a recomendação do SENTINEL Acertou / Errou / Parcial
 *   2. Selecionar 1+ categorias específicas de erro/acerto (catálogo canônico)
 *   3. Escrever um comentário livre (obrigatório quando errou/parcialmente)
 *   4. Persistir em SentinelFeedback (loop de melhoria contínua da IA)
 *
 * O painel também exibe histórico de feedbacks anteriores no mesmo caso
 * (caso já tenha sido reanalisado) — útil para auditoria.
 *
 * Props:
 *   - latestCase:  OnboardingCase mais recente (obrigatório)
 *   - latestScore: ComplianceScore vinculado (obrigatório)
 */
export default function FeedbackSentinelPanel({ latestCase, latestScore }) {
  const queryClient = useQueryClient();
  const caseId = latestCase?.id;
  const scoreId = latestScore?.id;

  // ── Estado do formulário ──
  const [feedbackType, setFeedbackType] = useState(null);  // 'acertou' | 'errou' | 'parcialmente'
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [comment, setComment] = useState('');
  const [touched, setTouched] = useState(false);

  // ── Busca feedbacks anteriores deste caso ──
  const { data: existingFeedbacks = [], isLoading: feedbacksLoading } = useQuery({
    queryKey: ['sentinelFeedback', caseId],
    queryFn: async () => {
      if (!caseId) return [];
      return await base44.entities.SentinelFeedback.filter(
        { onboarding_case_id: caseId },
        '-created_date',
        20
      );
    },
    enabled: !!caseId,
  });

  // ── Quando troca o feedback_type, reseta categorias incompatíveis ──
  const availableCategories = useMemo(
    () => getCategoriesForFeedbackType(feedbackType),
    [feedbackType]
  );

  useEffect(() => {
    if (!feedbackType) return;
    const availableCodes = new Set(availableCategories.map(c => c.code));
    setSelectedCategories(prev => prev.filter(code => availableCodes.has(code)));
  }, [feedbackType, availableCategories]);

  // ── Validação ──
  const commentRequired = feedbackType === 'errou' || feedbackType === 'parcialmente';
  const commentMissing = commentRequired && comment.trim().length < 5;
  const canSubmit = !!feedbackType && !commentMissing && !!latestScore?.sentinel_recommendation;

  // ── Mutation ──
  const submitMutation = useMutation({
    mutationFn: async () => {
      // Buscar user logado para denormalizar contexto
      const user = await base44.auth.me();

      // Decidir final_decision: usa iaDecision do caso se já houve revisão manual,
      // senão considera Manual (ainda em análise).
      const finalDecision = latestCase?.iaDecision || latestCase?.status || 'Manual';

      const payload = {
        onboarding_case_id: caseId,
        compliance_score_id: scoreId,
        analyst_email: user?.email,
        analyst_role: 'compliance_l1', // default — pode ser refinado depois com perfil real
        sentinel_recommendation: latestScore.sentinel_recommendation,
        final_decision: finalDecision === 'Manual' || finalDecision === 'Docs Solicitados'
          ? 'Revisão Manual'
          : finalDecision,
        decision_match: feedbackType === 'acertou',
        feedback_type: feedbackType,
        comment: comment.trim() || null,
        sentinel_version: latestScore?.versao_agente,
        framework_version: latestScore?.framework_version || latestCase?.framework_version || 'v5.2',
        tier: latestCase?.tier,
        segmento: latestCase?.segmento_v5_1 || latestScore?.segmento,
        morfologia: latestCase?.morfologia,
        feedback_categories: selectedCategories,
      };

      return await base44.entities.SentinelFeedback.create(payload);
    },
    onSuccess: () => {
      toast.success('Feedback registrado', {
        description: 'Obrigado! Sua avaliação alimenta o loop de melhoria contínua do SENTINEL.',
      });
      // Reseta formulário e refaz fetch do histórico
      setFeedbackType(null);
      setSelectedCategories([]);
      setComment('');
      setTouched(false);
      queryClient.invalidateQueries({ queryKey: ['sentinelFeedback', caseId] });
    },
    onError: (err) => {
      console.error('[FeedbackSentinelPanel] erro:', err);
      toast.error('Erro ao registrar feedback', {
        description: err?.message || 'Tente novamente em instantes.',
      });
    },
  });

  // ── Early returns ──
  if (!latestScore || !latestScore.sentinel_recommendation) {
    return null; // sem recomendação SENTINEL, não há o que avaliar
  }

  const handleToggleCategory = (code) => {
    setSelectedCategories(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
    );
  };

  const handleSubmit = () => {
    setTouched(true);
    if (!canSubmit) return;
    submitMutation.mutate();
  };

  return (
    <Card data-shortcut-item data-shortcut-label="Feedback SENTINEL">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-[#1356E2]" />
            Feedback do Analista sobre o SENTINEL
          </CardTitle>
          <Badge variant="outline" className="text-[10px] text-[#0A0A0A]/60 border-[#0A0A0A]/15">
            Loop melhoria contínua — DOC4 §19.8
          </Badge>
        </div>
        <p className="text-[11px] text-[#0A0A0A]/55 mt-1.5 leading-relaxed">
          Avalie se a recomendação do SENTINEL bateu com sua decisão final.
          O dado é registrado de forma estruturada para análise de precisão, drift e calibração dos prompts.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* ── Step 1: Botões 👍 🤔 👎 ── */}
        <div>
          <Label className="text-[10px] uppercase font-bold tracking-wide text-[#0A0A0A]/60 mb-2 block">
            1. A recomendação do SENTINEL...
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {FEEDBACK_TYPES.map(ft => {
              const isActive = feedbackType === ft.code;
              return (
                <button
                  key={ft.code}
                  type="button"
                  onClick={() => setFeedbackType(ft.code)}
                  className={`text-left p-3 rounded-lg border-2 transition-all ${
                    isActive
                      ? `${ft.activeBg} ${ft.borderColor} ring-2 ring-offset-1 ring-[#1356E2]/30`
                      : `bg-white border-[#0A0A0A]/10 hover:${ft.bgColor} hover:${ft.borderColor}`
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg leading-none">{ft.emoji}</span>
                    <span className={`text-xs font-bold ${isActive ? ft.color : 'text-[#0A0A0A]'}`}>
                      {ft.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#0A0A0A]/55 leading-tight">{ft.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Step 2: Categorias específicas ── */}
        {feedbackType && availableCategories.length > 0 && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <Label className="text-[10px] uppercase font-bold tracking-wide text-[#0A0A0A]/60 mb-2 block">
              2. Categorias específicas <span className="font-normal normal-case text-[#0A0A0A]/40">(opcional, marque todas que se aplicam)</span>
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
              {availableCategories.map(cat => {
                const checked = selectedCategories.includes(cat.code);
                return (
                  <label
                    key={cat.code}
                    htmlFor={`fbcat-${cat.code}`}
                    className={`flex items-start gap-2 p-2 rounded-md border cursor-pointer transition-colors ${
                      checked
                        ? 'bg-[#1356E2]/8 border-[#1356E2]/40'
                        : 'bg-white border-[#0A0A0A]/8 hover:border-[#0A0A0A]/20'
                    }`}
                  >
                    <Checkbox
                      id={`fbcat-${cat.code}`}
                      checked={checked}
                      onCheckedChange={() => handleToggleCategory(cat.code)}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-[#0A0A0A] leading-tight">{cat.label}</p>
                      <p className="text-[10px] text-[#0A0A0A]/55 leading-tight mt-0.5">{cat.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Step 3: Comentário ── */}
        {feedbackType && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-300">
            <Label htmlFor="fb-comment" className="text-[10px] uppercase font-bold tracking-wide text-[#0A0A0A]/60 mb-2 block">
              3. Comentário {commentRequired && <span className="text-red-600 normal-case font-bold">* obrigatório</span>}
            </Label>
            <Textarea
              id="fb-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={
                commentRequired
                  ? 'Descreva o que faltou ou o que estava incorreto na recomendação do SENTINEL...'
                  : 'Comentário opcional sobre a análise...'
              }
              rows={3}
              className={`text-xs resize-none ${
                touched && commentMissing ? 'border-red-400 focus-visible:ring-red-300' : ''
              }`}
            />
            {touched && commentMissing && (
              <p className="text-[10px] text-red-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Mínimo 5 caracteres quando o feedback é "errou" ou "parcialmente".
              </p>
            )}
          </div>
        )}

        {/* ── Submit ── */}
        {feedbackType && (
          <div className="flex items-center justify-between pt-3 border-t border-[#0A0A0A]/8 animate-in fade-in duration-300">
            <p className="text-[10px] text-[#0A0A0A]/50 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#1356E2]" />
              Registrado em <span className="font-mono">SentinelFeedback</span> com seu e-mail + timestamp
            </p>
            <Button
              onClick={handleSubmit}
              disabled={!canSubmit || submitMutation.isPending}
              size="sm"
              className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Enviando…
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  Registrar feedback
                </>
              )}
            </Button>
          </div>
        )}

        {/* ── Histórico de feedbacks anteriores ── */}
        {existingFeedbacks.length > 0 && (
          <div className="pt-4 border-t border-[#0A0A0A]/8">
            <div className="flex items-center gap-2 mb-2">
              <History className="w-3.5 h-3.5 text-[#0A0A0A]/40" />
              <span className="text-[10px] uppercase font-bold tracking-wide text-[#0A0A0A]/50">
                Feedbacks anteriores deste caso ({existingFeedbacks.length})
              </span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {existingFeedbacks.map(fb => <FeedbackHistoryItem key={fb.id} fb={fb} />)}
            </div>
          </div>
        )}
        {feedbacksLoading && (
          <div className="flex items-center gap-2 text-[10px] text-[#0A0A0A]/40">
            <Loader2 className="w-3 h-3 animate-spin" /> Carregando histórico…
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Linha compacta de um feedback anterior — usada no histórico.
 */
function FeedbackHistoryItem({ fb }) {
  const ft = FEEDBACK_TYPES.find(t => t.code === fb.feedback_type);
  const when = fb.created_date ? new Date(fb.created_date).toLocaleString('pt-BR') : '—';

  return (
    <div className="flex items-start gap-2 p-2 rounded-md bg-[#0A0A0A]/3 border border-[#0A0A0A]/8 text-xs">
      <span className="text-base leading-none mt-0.5">{ft?.emoji || '•'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold uppercase ${ft?.color || 'text-[#0A0A0A]'}`}>
            {ft?.label || fb.feedback_type}
          </span>
          {fb.decision_match === true && (
            <Badge className="bg-green-100 text-green-700 border-green-200 text-[9px] px-1.5 py-0">
              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" /> match
            </Badge>
          )}
          <span className="text-[9px] text-[#0A0A0A]/45 font-mono ml-auto">{when}</span>
        </div>
        <p className="text-[10px] text-[#0A0A0A]/60 mt-0.5">
          <span className="font-mono">{fb.analyst_email || '—'}</span>
          {fb.framework_version && (
            <span className="ml-2 px-1 py-0.5 rounded bg-[#0A0A0A]/5">{fb.framework_version}</span>
          )}
        </p>
        {fb.comment && (
          <p className="text-[10px] text-[#0A0A0A]/75 mt-1 italic leading-tight border-l-2 border-[#0A0A0A]/10 pl-2">
            "{fb.comment}"
          </p>
        )}
        {Array.isArray(fb.feedback_categories) && fb.feedback_categories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1">
            {fb.feedback_categories.map(cat => (
              <span key={cat} className="text-[9px] px-1 py-0.5 rounded bg-[#0A0A0A]/8 text-[#0A0A0A]/60">
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}