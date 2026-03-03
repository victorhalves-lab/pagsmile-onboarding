import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Search, Loader2, BookOpen, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function QuestionLibraryModal({ open, onClose, templateId, existingQuestionCount }) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState([]);
  const queryClient = useQueryClient();

  const { data: libraryQuestions = [], isLoading } = useQuery({
    queryKey: ['libraryQuestions'],
    queryFn: () => base44.entities.Question.filter({ isLibraryQuestion: true }),
    enabled: open
  });

  const addMutation = useMutation({
    mutationFn: async (questions) => {
      const ops = questions.map((q, i) => {
        const { id, created_date, updated_date, created_by, ...data } = q;
        return base44.entities.Question.create({
          ...data,
          questionnaireTemplateId: templateId,
          isLibraryQuestion: false,
          order: existingQuestionCount + i + 1
        });
      });
      return Promise.all(ops);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['questions', templateId] });
      toast.success(`${selected.length} pergunta(s) adicionada(s)!`);
      setSelected([]);
      onClose();
    }
  });

  const filtered = libraryQuestions.filter(q =>
    !search || q.text.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = (q) => {
    setSelected(prev =>
      prev.find(s => s.id === q.id)
        ? prev.filter(s => s.id !== q.id)
        : [...prev, q]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[var(--pagsmile-green)]" />
            Biblioteca de Perguntas
          </DialogTitle>
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pagsmile-blue)]/40" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar perguntas..." className="pl-10" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <BookOpen className="w-10 h-10 mx-auto text-[var(--pagsmile-blue)]/30 mb-2" />
            <p className="text-sm text-[var(--pagsmile-blue)]/60">
              {libraryQuestions.length === 0
                ? 'Nenhuma pergunta na biblioteca. Crie perguntas com "Biblioteca" ativo.'
                : 'Nenhum resultado para a busca.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[40vh] overflow-y-auto">
            {filtered.map(q => {
              const isSelected = selected.some(s => s.id === q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => toggleSelect(q)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5' : 'border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox checked={isSelected} className="mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[var(--pagsmile-blue)]">{q.text}</p>
                      <div className="flex gap-1 mt-1">
                        <Badge variant="outline" className="text-[10px]">{q.type}</Badge>
                        {q.isRequired && <Badge className="bg-red-100 text-red-700 text-[10px]">Obrigatória</Badge>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button
            onClick={() => addMutation.mutate(selected)}
            disabled={selected.length === 0 || addMutation.isPending}
            className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
          >
            {addMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            <Plus className="w-4 h-4 mr-1" />
            Adicionar {selected.length > 0 ? `(${selected.length})` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}