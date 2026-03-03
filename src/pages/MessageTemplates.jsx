import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Loader2, Mail, MessageSquare, FileText } from 'lucide-react';
import { toast } from 'sonner';

const TYPE_CONFIG = {
  EMAIL: { label: 'E-mail', icon: Mail, color: 'bg-blue-100 text-blue-700' },
  SMS: { label: 'SMS', icon: MessageSquare, color: 'bg-green-100 text-green-700' },
  WHATSAPP: { label: 'WhatsApp', icon: MessageSquare, color: 'bg-emerald-100 text-emerald-700' },
};

const PLACEHOLDERS = ['{{leadName}}', '{{linkUrl}}', '{{agentName}}', '{{companyName}}', '{{protocolo}}'];

export default function MessageTemplates() {
  const queryClient = useQueryClient();
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [form, setForm] = useState({ name: '', subject: '', body: '', type: 'EMAIL', category: 'GENERAL', isActive: true });

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['messageTemplates'],
    queryFn: () => base44.entities.MessageTemplate.list('-created_date')
  });

  const saveMutation = useMutation({
    mutationFn: (data) => editing
      ? base44.entities.MessageTemplate.update(editing.id, data)
      : base44.entities.MessageTemplate.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messageTemplates'] });
      toast.success(editing ? 'Template atualizado!' : 'Template criado!');
      setShowEditor(false);
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.MessageTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messageTemplates'] });
      toast.success('Template excluído');
      setDeleteId(null);
    }
  });

  const resetForm = () => { setForm({ name: '', subject: '', body: '', type: 'EMAIL', category: 'GENERAL', isActive: true }); setEditing(null); };

  const handleEdit = (t) => {
    setEditing(t);
    setForm({ name: t.name, subject: t.subject || '', body: t.body, type: t.type, category: t.category || 'GENERAL', isActive: t.isActive !== false });
    setShowEditor(true);
  };

  const insertPlaceholder = (ph) => setForm(f => ({ ...f, body: f.body + ph }));

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[var(--pagsmile-blue)]">Templates de Mensagem</h1>
          <p className="text-sm text-[var(--pagsmile-blue)]/70">{templates.length} templates cadastrados</p>
        </div>
        <Button onClick={() => { resetForm(); setShowEditor(true); }} className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90">
          <Plus className="w-4 h-4 mr-2" /> Novo Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-[var(--pagsmile-blue)]/30 mb-3" />
          <p className="text-[var(--pagsmile-blue)]/60">Nenhum template criado ainda.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {templates.map(t => {
            const cfg = TYPE_CONFIG[t.type] || TYPE_CONFIG.EMAIL;
            const Icon = cfg.icon;
            return (
              <Card key={t.id}>
                <CardContent className="p-4 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-[var(--pagsmile-blue)]">{t.name}</h3>
                      <Badge className={`${cfg.color} gap-1 text-xs`}><Icon className="w-3 h-3" />{cfg.label}</Badge>
                      {!t.isActive && <Badge variant="outline" className="text-xs">Inativo</Badge>}
                    </div>
                    {t.subject && <p className="text-xs text-[var(--pagsmile-blue)]/60 mb-1">Assunto: {t.subject}</p>}
                    <p className="text-sm text-[var(--pagsmile-blue)]/70 line-clamp-2">{t.body}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(t)}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(t.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showEditor} onOpenChange={(o) => { if (!o) resetForm(); setShowEditor(o); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Novo'} Template</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2"><Label>Nome *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Follow-up Dia 1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="EMAIL">E-mail</SelectItem><SelectItem value="SMS">SMS</SelectItem><SelectItem value="WHATSAPP">WhatsApp</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Categoria</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="GENERAL">Geral</SelectItem><SelectItem value="FOLLOW_UP">Follow-up</SelectItem><SelectItem value="WELCOME">Boas-vindas</SelectItem><SelectItem value="PROPOSAL">Proposta</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            {form.type === 'EMAIL' && <div className="space-y-2"><Label>Assunto</Label><Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Assunto do e-mail" /></div>}
            <div className="space-y-2">
              <Label>Corpo da Mensagem *</Label>
              <Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={5} placeholder="Olá {{leadName}}, ..." />
              <div className="flex gap-1 flex-wrap">
                <span className="text-[10px] text-[var(--pagsmile-blue)]/50">Placeholders:</span>
                {PLACEHOLDERS.map(ph => (
                  <button key={ph} onClick={() => insertPlaceholder(ph)} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-[var(--pagsmile-blue)]/70">{ph}</button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name || !form.body || saveMutation.isPending} className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90">
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editing ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir template?</AlertDialogTitle><AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-red-500">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}