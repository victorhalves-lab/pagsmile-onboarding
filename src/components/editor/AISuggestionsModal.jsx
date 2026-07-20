import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Brain, Plus, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function AISuggestionsModal({ open, onClose, templateId, template, existingQuestions }) {
  const [suggestions, setSuggestions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const fetchSuggestions = async () => {
    setLoading(true);
    setSuggestions([]);
    setSelected([]);
    const result = await base44.functions.invoke('suggestQuestionsAI', {
      category: template?.category || 'COMPLIANCE',
      merchantType: template?.merchantType || 'PJ',
      model: template?.model || 'geral',
      existingQuestions: existingQuestions.map(q => ({ text: q.text, type: q.type }))
    });
    setSuggestions(result.data?.suggestions || []);
    setLoading(false);
  };

  const addMutation = useMutation({
    mutationFn: async () => {
      const ops = selected.map((q, i) =>
        base44.entities.Question.create({
          questionnaireTemplateId: templateId,
          order: existingQuestions.length + i + 1,
          text: q.text,
          type: q.type || 'TEXT',
          options: q.options || [],
          isRequired: q.isRequired || false,
          helpText: q.helpText || '',
          riskWeight: q.riskWeight || 0,
        })
      );
      return Promise.all(ops);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', templateId] });
      toast.success(`${selected.length} sugestão(ões) adicionada(s)!`);
      onClose();
    }
  });

  const toggleSelect = (idx) => {
    const q = suggestions[idx];
    setSelected(prev =>
      prev.includes(q) ? prev.filter(s => s !== q) : [...prev, q]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600" />
            Sugestões da IA
          </DialogTitle>
        </DialogHeader>

        {suggestions.length === 0 && !loading && (
          <div className="text-center py-8">
            <Sparkles className="w-12 h-12 mx-auto text-purple-300 mb-3" />
            <p className="text-sm text-[var(--pinbank-blue)]/60 mb-4">
              A IA vai sugerir perguntas com base no contexto do seu questionário.
            </p>
            <Button onClick={fetchSuggestions} className="bg-purple-600 hover:bg-purple-700">
              <Sparkles className="w-4 h-4 mr-2" />
              Gerar Sugestões
            </Button>
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center py-8 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            <p className="text-sm text-[var(--pinbank-blue)]/60">Analisando e gerando sugestões...</p>
          </div>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {suggestions.map((q, idx) => {
              const isSelected = selected.includes(q);
              return (
                <div
                  key={idx}
                  onClick={() => toggleSelect(idx)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'border-purple-400 bg-purple-50' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox checked={isSelected} className="mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--pinbank-blue)]">{q.text}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{q.type}</Badge>
                        {q.isRequired && <Badge className="bg-red-100 text-red-700 text-[10px]">Obrigatória</Badge>}
                        {q.riskWeight > 0 && <Badge className="bg-amber-100 text-amber-700 text-[10px]">Peso: {q.riskWeight}</Badge>}
                      </div>
                      {q.helpText && <p className="text-[10px] text-[var(--pinbank-blue)]/50 mt-1">{q.helpText}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {suggestions.length > 0 && (
          <DialogFooter>
            <Button variant="outline" onClick={fetchSuggestions} disabled={loading}>
              <Sparkles className="w-4 h-4 mr-1" /> Gerar Novamente
            </Button>
            <Button
              onClick={() => addMutation.mutate()}
              disabled={selected.length === 0 || addMutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {addMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              <Plus className="w-4 h-4 mr-1" />
              Adicionar {selected.length > 0 ? `(${selected.length})` : ''}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}