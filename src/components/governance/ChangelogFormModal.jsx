import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function ChangelogFormModal({ onClose, onSaved, initialData }) {
  const [data, setData] = useState(initialData || {
    title: '',
    category: 'FEATURE',
    severity: 'MEDIUM',
    userRequest: '',
    summary: '',
    businessImpact: '',
    technicalDetails: '',
    testingNotes: '',
    rollbackInstructions: '',
    breakingChanges: false,
    tags: '',
    filesChanged: '',
    entitiesAffected: '',
    functionsAffected: '',
    pagesAffected: '',
    implementedAt: new Date().toISOString().slice(0, 16),
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  const submit = async () => {
    if (!data.title || !data.summary) {
      toast.error('Título e resumo são obrigatórios');
      return;
    }
    setSaving(true);
    try {
      const user = await base44.auth.me().catch(() => null);
      const payload = {
        title: data.title,
        category: data.category,
        severity: data.severity,
        userRequest: data.userRequest,
        summary: data.summary,
        businessImpact: data.businessImpact,
        technicalDetails: data.technicalDetails,
        testingNotes: data.testingNotes,
        rollbackInstructions: data.rollbackInstructions,
        breakingChanges: data.breakingChanges,
        implementedBy: user?.email || 'sistema',
        implementedAt: new Date(data.implementedAt).toISOString(),
        tags: (data.tags || '').split(',').map(s => s.trim()).filter(Boolean),
        entitiesAffected: (data.entitiesAffected || '').split(',').map(s => s.trim()).filter(Boolean),
        functionsAffected: (data.functionsAffected || '').split(',').map(s => s.trim()).filter(Boolean),
        pagesAffected: (data.pagesAffected || '').split(',').map(s => s.trim()).filter(Boolean),
        filesChanged: (data.filesChanged || '').split('\n').map(line => {
          const trimmed = line.trim();
          if (!trimmed) return null;
          const [action, path, ...descParts] = trimmed.split(/\s+/);
          return { action: ['created', 'modified', 'deleted'].includes(action) ? action : 'modified', path: path || trimmed, description: descParts.join(' ') };
        }).filter(Boolean),
      };
      await base44.entities.CodeChangelog.create(payload);
      toast.success('Mudança registrada no changelog');
      onSaved();
    } catch (e) {
      toast.error('Erro ao salvar: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Registrar Mudança no Changelog</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Título *</Label>
            <Input value={data.title} onChange={(e) => set('title', e.target.value)} placeholder="Ex: Bloqueio B10 — recusa automática para CNPJ ≤ 1 mês" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select value={data.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="FEATURE">Feature</SelectItem>
                  <SelectItem value="BUGFIX">Bugfix</SelectItem>
                  <SelectItem value="REFACTOR">Refactor</SelectItem>
                  <SelectItem value="SECURITY">Segurança</SelectItem>
                  <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                  <SelectItem value="INTEGRATION">Integração</SelectItem>
                  <SelectItem value="UI_UX">UI/UX</SelectItem>
                  <SelectItem value="PERFORMANCE">Performance</SelectItem>
                  <SelectItem value="GOVERNANCE">Governança</SelectItem>
                  <SelectItem value="DATA_MODEL">Modelo de Dados</SelectItem>
                  <SelectItem value="INFRA">Infra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Severidade</Label>
              <Select value={data.severity} onValueChange={(v) => set('severity', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Baixa</SelectItem>
                  <SelectItem value="MEDIUM">Média</SelectItem>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="CRITICAL">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data/Hora</Label>
              <Input type="datetime-local" value={data.implementedAt} onChange={(e) => set('implementedAt', e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Pedido original do usuário</Label>
            <Textarea rows={2} value={data.userRequest} onChange={(e) => set('userRequest', e.target.value)} placeholder="Cole o pedido feito no chat" />
          </div>

          <div>
            <Label>Resumo executivo *</Label>
            <Textarea rows={2} value={data.summary} onChange={(e) => set('summary', e.target.value)} placeholder="O que foi implementado em 1-2 frases" />
          </div>

          <div>
            <Label>Impacto de negócio</Label>
            <Textarea rows={2} value={data.businessImpact} onChange={(e) => set('businessImpact', e.target.value)} placeholder="Por que isso importa, qual problema resolve" />
          </div>

          <div>
            <Label>Detalhes técnicos (Markdown permitido)</Label>
            <Textarea rows={6} value={data.technicalDetails} onChange={(e) => set('technicalDetails', e.target.value)} placeholder="Arquitetura, decisões, lógica, fluxos..." className="font-mono text-xs" />
          </div>

          <div>
            <Label>Arquivos modificados (um por linha: "ação caminho descrição")</Label>
            <Textarea rows={3} value={data.filesChanged} onChange={(e) => set('filesChanged', e.target.value)} placeholder="modified functions/bdcEnrichCase Adicionado bloco B10\ncreated pages/Governanca Nova página" className="font-mono text-xs" />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Entidades (vírgula)</Label>
              <Input value={data.entitiesAffected} onChange={(e) => set('entitiesAffected', e.target.value)} placeholder="OnboardingCase, ComplianceScore" />
            </div>
            <div>
              <Label>Functions (vírgula)</Label>
              <Input value={data.functionsAffected} onChange={(e) => set('functionsAffected', e.target.value)} placeholder="bdcEnrichCase" />
            </div>
            <div>
              <Label>Páginas (vírgula)</Label>
              <Input value={data.pagesAffected} onChange={(e) => set('pagesAffected', e.target.value)} placeholder="Governanca" />
            </div>
          </div>

          <div>
            <Label>Tags (vírgula)</Label>
            <Input value={data.tags} onChange={(e) => set('tags', e.target.value)} placeholder="bdc, scoring, recusa-automatica" />
          </div>

          <div>
            <Label>Como testar</Label>
            <Textarea rows={2} value={data.testingNotes} onChange={(e) => set('testingNotes', e.target.value)} />
          </div>

          <div>
            <Label>Como reverter</Label>
            <Textarea rows={2} value={data.rollbackInstructions} onChange={(e) => set('rollbackInstructions', e.target.value)} />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox checked={data.breakingChanges} onCheckedChange={(v) => set('breakingChanges', !!v)} id="breaking" />
            <Label htmlFor="breaking" className="cursor-pointer">Esta é uma breaking change</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit} disabled={saving} className="bg-[#1356E2] hover:bg-[#1356E2]/90">{saving ? 'Salvando...' : 'Registrar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}