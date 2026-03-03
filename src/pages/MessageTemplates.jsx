import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  EMAIL: { label: 'E-mail', icon: Mail, bg: 'bg-[#002443]/5', text: 'text-[#002443]' },
  SMS: { label: 'SMS', icon: MessageSquare, bg: 'bg-[#2bc196]/10', text: 'text-[#2bc196]' },
  WHATSAPP: { label: 'WhatsApp', icon: MessageSquare, bg: 'bg-[#36706c]/10', text: 'text-[#36706c]' },
};

const CATEGORY_CONFIG = {
  GENERAL: { label: 'Geral', bg: 'bg-[#f4f4f4]', text: 'text-[#002443]/60' },
  FOLLOW_UP: { label: 'Follow-up', bg: 'bg-[#36706c]/10', text: 'text-[#36706c]' },
  WELCOME: { label: 'Boas-vindas', bg: 'bg-[#2bc196]/10', text: 'text-[#2bc196]' },
  PROPOSAL: { label: 'Proposta', bg: 'bg-[#002443]/5', text: 'text-[#002443]' },
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

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" />
    </div>
  );

  const stats = [
    { label: 'Total', value: templates.length, color: '#002443' },
    { label: 'E-mail', value: templates.filter(t => t.type === 'EMAIL').length, color: '#002443' },
    { label: 'SMS', value: templates.filter(t => t.type === 'SMS').length, color: '#2bc196' },
    { label: 'WhatsApp', value: templates.filter(t => t.type === 'WHATSAPP').length, color: '#36706c' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002443]">Templates de Mensagem</h1>
          <p className="text-sm text-[#002443]/60">{templates.length} templates cadastrados</p>
        </div>
        <Button onClick={() => { resetForm(); setShowEditor(true); }} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Novo Template
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#002443]/5 p-4">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-[#002443]/50">{s.label}</p>
          </div>
        ))}
      </div>

      {/* List */}
      {templates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#002443]/5 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#f4f4f4] flex items-center justify-center mx-auto mb-4">
            <FileText className="w-7 h-7 text-[#002443]/20" />
          </div>
          <h3 className="text-base font-semibold text-[#002443] mb-1">Nenhum template criado</h3>
          <p className="text-sm text-[#002443]/50 mb-6">Crie seu primeiro template de mensagem.</p>
          <Button onClick={() => { resetForm(); setShowEditor(true); }} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Criar Template
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {templates.map(t => {
            const cfg = TYPE_CONFIG[t.type] || TYPE_CONFIG.EMAIL;
            const catCfg = CATEGORY_CONFIG[t.category] || CATEGORY_CONFIG.GENERAL;
            const Icon = cfg.icon;
            return (
              <div key={t.id} className="bg-white rounded-2xl border border-[#002443]/5 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                      <Icon className={`w-5 h-5 ${cfg.text}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-[#002443]">{t.name}</h3>
                        <Badge className={`${cfg.bg} ${cfg.text} gap-1 text-xs border-0`}>
                          <Icon className="w-3 h-3" />{cfg.label}
                        </Badge>
                        <Badge className={`${catCfg.bg} ${catCfg.text} text-xs border-0`}>
                          {catCfg.label}
                        </Badge>
                        {t.isActive === false && (
                          <Badge className="bg-[#f4f4f4] text-[#002443]/40 text-xs border-0">Inativo</Badge>
                        )}
                      </div>
                      {t.subject && <p className="text-xs text-[#002443]/40 mb-1">Assunto: {t.subject}</p>}
                      <p className="text-sm text-[#002443]/60 line-clamp-2">{t.body}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(t)} className="h-8 w-8 p-0">
                      <Edit className="w-4 h-4 text-[#002443]/40" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteId(t.id)} className="h-8 w-8 p-0 text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor */}
      <Dialog open={showEditor} onOpenChange={(o) => { if (!o) resetForm(); setShowEditor(o); }}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#002443]">{editing ? 'Editar' : 'Novo'} Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs text-[#002443]/50">Nome *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Follow-up Dia 1" className="border-[#002443]/10" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#002443]/50">Tipo</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger className="border-[#002443]/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMAIL">E-mail</SelectItem>
                    <SelectItem value="SMS">SMS</SelectItem>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#002443]/50">Categoria</Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="border-[#002443]/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GENERAL">Geral</SelectItem>
                    <SelectItem value="FOLLOW_UP">Follow-up</SelectItem>
                    <SelectItem value="WELCOME">Boas-vindas</SelectItem>
                    <SelectItem value="PROPOSAL">Proposta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.type === 'EMAIL' && (
              <div className="space-y-1.5">
                <Label className="text-xs text-[#002443]/50">Assunto</Label>
                <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Assunto do e-mail" className="border-[#002443]/10" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs text-[#002443]/50">Corpo da Mensagem *</Label>
              <Textarea value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={5} placeholder="Olá {{leadName}}, ..." className="border-[#002443]/10" />
              <div className="flex gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-[#002443]/30">Placeholders:</span>
                {PLACEHOLDERS.map(ph => (
                  <button key={ph} onClick={() => insertPlaceholder(ph)} className="text-[10px] px-2 py-0.5 rounded-lg bg-[#f4f4f4] hover:bg-[#2bc196]/10 text-[#002443]/50 hover:text-[#2bc196] transition-colors border border-[#002443]/5">
                    {ph}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)} className="rounded-xl border-[#002443]/10">Cancelar</Button>
            <Button onClick={() => saveMutation.mutate(form)} disabled={!form.name || !form.body || saveMutation.isPending} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl">
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editing ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#002443]">Excluir template?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#002443]/60">Esta ação é irreversível.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(deleteId)} className="bg-red-500 hover:bg-red-600 rounded-xl">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}