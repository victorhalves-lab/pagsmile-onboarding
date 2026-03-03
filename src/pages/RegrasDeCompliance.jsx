import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Settings, Plus, Edit, Trash2, Loader2, RefreshCw,
  CheckCircle2, XCircle, AlertTriangle, Mail, Flag,
  FileText, Zap, Play
} from 'lucide-react';
import { toast } from 'sonner';
import RuleSimulatorModal from '../components/compliance/RuleSimulatorModal';

export default function RegrasDeCompliance() {
  const [showEditor, setShowEditor] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [simulateRule, setSimulateRule] = useState(null);
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading, refetch } = useQuery({
    queryKey: ['complianceRules'],
    queryFn: () => base44.entities.ComplianceRule.list('-priority')
  });

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'auto_approve',
    priority: 50,
    isActive: true,
    conditions: [{ field: 'riskScore', operator: 'greater_than_or_equal', value: '' }],
    logicOperator: 'AND',
    actions: [{ actionType: 'set_status', parameters: { status: 'Aprovado' } }]
  });

  const resetForm = () => {
    setFormData({
      name: '', description: '', type: 'auto_approve', priority: 50, isActive: true,
      conditions: [{ field: 'riskScore', operator: 'greater_than_or_equal', value: '' }],
      logicOperator: 'AND',
      actions: [{ actionType: 'set_status', parameters: { status: 'Aprovado' } }]
    });
    setEditingRule(null);
  };

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const isNew = !editingRule;
      let result;
      if (editingRule) {
        result = await base44.entities.ComplianceRule.update(editingRule.id, data);
      } else {
        result = await base44.entities.ComplianceRule.create(data);
      }
      await base44.entities.AuditLog.create({
        entityName: 'ComplianceRule',
        entityId: editingRule?.id || result?.id || 'unknown',
        actionType: isNew ? 'CREATE' : 'UPDATE',
        actionDescription: `Regra "${data.name}" ${isNew ? 'criada' : 'atualizada'}`,
        changedBy: 'admin',
        changeDate: new Date().toISOString(),
        details: { name: data.name, type: data.type, conditions: data.conditions }
      });
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complianceRules'] });
      toast.success(editingRule ? 'Regra atualizada!' : 'Regra criada!');
      setShowEditor(false);
      resetForm();
    },
    onError: (error) => {
      toast.error('Erro ao salvar: ' + error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const rule = rules.find(r => r.id === id);
      await base44.entities.ComplianceRule.delete(id);
      await base44.entities.AuditLog.create({
        entityName: 'ComplianceRule', entityId: id, actionType: 'DELETE',
        actionDescription: `Regra "${rule?.name || id}" excluída`,
        changedBy: 'admin', changeDate: new Date().toISOString(),
        details: { name: rule?.name, type: rule?.type }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complianceRules'] });
      toast.success('Regra excluída');
      setDeleteId(null);
    }
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }) => base44.entities.ComplianceRule.update(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['complianceRules'] })
  });

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name || '', description: rule.description || '', type: rule.type || 'auto_approve',
      priority: rule.priority || 50, isActive: rule.isActive !== false,
      conditions: rule.conditions || [{ field: 'riskScore', operator: 'greater_than_or_equal', value: '' }],
      logicOperator: rule.logicOperator || 'AND',
      actions: rule.actions || [{ actionType: 'set_status', parameters: {} }]
    });
    setShowEditor(true);
  };

  const handleSave = () => {
    if (!formData.name) { toast.error('Nome é obrigatório'); return; }
    saveMutation.mutate(formData);
  };

  const typeConfig = {
    'auto_approve': { bg: 'bg-[#2bc196]/10', text: 'text-[#2bc196]', icon: CheckCircle2, label: 'Auto-aprovar' },
    'auto_reject': { bg: 'bg-red-50', text: 'text-red-500', icon: XCircle, label: 'Auto-rejeitar' },
    'manual_review': { bg: 'bg-[#36706c]/10', text: 'text-[#36706c]', icon: AlertTriangle, label: 'Revisão Manual' },
    'request_documents': { bg: 'bg-[#002443]/5', text: 'text-[#002443]', icon: FileText, label: 'Solicitar Docs' },
    'notification': { bg: 'bg-[#5cf7cf]/10', text: 'text-[#36706c]', icon: Mail, label: 'Notificação' },
    'add_flag': { bg: 'bg-[#002443]/5', text: 'text-[#002443]', icon: Flag, label: 'Adicionar Flag' },
  };

  const getTypeBadge = (type) => {
    const config = typeConfig[type] || typeConfig['auto_approve'];
    const Icon = config.icon;
    return (
      <Badge className={`${config.bg} ${config.text} gap-1 border-0`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const fieldOptions = [
    { value: 'riskScore', label: 'Score de Risco' },
    { value: 'merchant.type', label: 'Tipo de Merchant (PF/PJ)' },
    { value: 'status', label: 'Status do Caso' },
    { value: 'iaDecision', label: 'Decisão da IA' },
    { value: 'validationsCompleted', label: 'Validações Completas' },
    { value: 'bigDataCorpCompleted', label: 'BigDataCorp Completo' },
    { value: 'cafCompleted', label: 'CAF Completo' },
  ];

  const operatorOptions = [
    { value: 'equals', label: 'Igual a' },
    { value: 'not_equals', label: 'Diferente de' },
    { value: 'greater_than', label: 'Maior que' },
    { value: 'less_than', label: 'Menor que' },
    { value: 'greater_than_or_equal', label: 'Maior ou igual a' },
    { value: 'less_than_or_equal', label: 'Menor ou igual a' },
    { value: 'contains', label: 'Contém' },
    { value: 'in', label: 'Está em' },
  ];

  const ruleStats = [
    { label: 'Total', value: rules.length, color: '#002443' },
    { label: 'Ativas', value: rules.filter(r => r.isActive).length, color: '#2bc196' },
    { label: 'Inativas', value: rules.filter(r => !r.isActive).length, color: '#002443' },
    { label: 'Execuções', value: rules.reduce((sum, r) => sum + (r.executionCount || 0), 0), color: '#36706c' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#002443]/5 flex items-center justify-center">
            <Settings className="w-5 h-5 text-[#002443]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#002443]">Regras de Compliance</h1>
            <p className="text-sm text-[#002443]/60">Configure automações e fluxos de trabalho</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()} className="border-[#002443]/10 hover:bg-[#f4f4f4] rounded-xl">
            <RefreshCw className="w-4 h-4 mr-2 text-[#002443]/50" />
            <span className="text-[#002443]/70">Atualizar</span>
          </Button>
          <Button onClick={() => { resetForm(); setShowEditor(true); }} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl">
            <Plus className="w-4 h-4 mr-2" />
            Nova Regra
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {ruleStats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#002443]/5 p-4">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-[#002443]/50">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Rules List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" />
        </div>
      ) : rules.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#002443]/5 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#f4f4f4] flex items-center justify-center mx-auto mb-4">
            <Settings className="w-7 h-7 text-[#002443]/20" />
          </div>
          <h3 className="text-base font-semibold text-[#002443] mb-1">Nenhuma regra configurada</h3>
          <p className="text-sm text-[#002443]/50 mb-6">Crie sua primeira regra de automação.</p>
          <Button onClick={() => { resetForm(); setShowEditor(true); }} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl">
            <Plus className="w-4 h-4 mr-2" /> Criar Regra
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className={`bg-white rounded-2xl border border-[#002443]/5 p-5 hover:shadow-sm transition-shadow ${!rule.isActive ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="text-base font-semibold text-[#002443]">{rule.name}</h3>
                    {getTypeBadge(rule.type)}
                    <Badge variant="outline" className="font-normal border-[#002443]/10 text-[#002443]/50 text-xs">
                      Prioridade: {rule.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-[#002443]/50 mb-3">{rule.description || 'Sem descrição'}</p>
                  
                  {rule.conditions && rule.conditions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="text-xs text-[#002443]/30">Condições:</span>
                      {rule.conditions.map((cond, idx) => (
                        <Badge key={idx} variant="outline" className="text-[10px] font-mono border-[#002443]/10 text-[#002443]/50">
                          {cond.field} {cond.operator} {String(cond.value)}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-4 text-xs text-[#002443]/40">
                    <span className="flex items-center gap-1">
                      <Zap className="w-3 h-3 text-[#2bc196]" />
                      {rule.executionCount || 0} execuções
                    </span>
                    {rule.lastExecutedAt && (
                      <span>Última: {new Date(rule.lastExecutedAt).toLocaleDateString('pt-BR')}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#002443]/40">Ativa</span>
                    <Switch
                      checked={rule.isActive}
                      onCheckedChange={(checked) => toggleMutation.mutate({ id: rule.id, isActive: checked })}
                      className="data-[state=checked]:bg-[#2bc196]"
                    />
                  </div>

                  <div className="h-6 w-px bg-[#002443]/5" />
                  
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(rule)} title="Editar">
                    <Edit className="w-4 h-4 text-[#002443]/40" />
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSimulateRule(rule)} title="Simular">
                    <Play className="w-4 h-4 text-[#2bc196]" />
                  </Button>
                  
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400 hover:text-red-600" onClick={() => setDeleteId(rule.id)} title="Excluir">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor */}
      <Dialog open={showEditor} onOpenChange={(open) => { if (!open) resetForm(); setShowEditor(open); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#002443]">{editingRule ? 'Editar Regra' : 'Nova Regra'}</DialogTitle>
            <DialogDescription className="text-[#002443]/50">Configure as condições e ações da regra.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#002443]/50">Nome da Regra <span className="text-red-400">*</span></Label>
                <Input value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} placeholder="Ex: Auto-aprovar PF com Score > 90" className="border-[#002443]/10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#002443]/50">Tipo de Ação</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}>
                  <SelectTrigger className="border-[#002443]/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto_approve">Auto-aprovar</SelectItem>
                    <SelectItem value="auto_reject">Auto-rejeitar</SelectItem>
                    <SelectItem value="manual_review">Enviar p/ Revisão Manual</SelectItem>
                    <SelectItem value="request_documents">Solicitar Documentos</SelectItem>
                    <SelectItem value="notification">Enviar Notificação</SelectItem>
                    <SelectItem value="add_flag">Adicionar Flag de Risco</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-[#002443]/50">Descrição</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Descreva o propósito desta regra..." rows={2} className="border-[#002443]/10" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-[#002443]/50">Prioridade (1-100)</Label>
                <Input type="number" value={formData.priority} onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 50 }))} min={1} max={100} className="border-[#002443]/10" />
                <p className="text-[10px] text-[#002443]/30">Maior = executada primeiro</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-[#002443]/50">Operador Lógico</Label>
                <Select value={formData.logicOperator} onValueChange={(v) => setFormData(prev => ({ ...prev, logicOperator: v }))}>
                  <SelectTrigger className="border-[#002443]/10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">E (todas as condições)</SelectItem>
                    <SelectItem value="OR">OU (qualquer condição)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Conditions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-[#002443]/50">Condições</Label>
                <Button variant="outline" size="sm" className="rounded-lg border-[#002443]/10 text-xs" onClick={() => setFormData(prev => ({
                  ...prev, conditions: [...prev.conditions, { field: 'riskScore', operator: 'equals', value: '' }]
                }))}>
                  <Plus className="w-3 h-3 mr-1" /> Adicionar
                </Button>
              </div>
              
              {formData.conditions.map((cond, idx) => (
                <div key={idx} className="flex gap-2 items-center p-3 bg-[#f4f4f4] rounded-xl border border-[#002443]/5">
                  <Select value={cond.field} onValueChange={(v) => {
                    const newConds = [...formData.conditions]; newConds[idx].field = v;
                    setFormData(prev => ({ ...prev, conditions: newConds }));
                  }}>
                    <SelectTrigger className="w-40 border-[#002443]/10 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {fieldOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={cond.operator} onValueChange={(v) => {
                    const newConds = [...formData.conditions]; newConds[idx].operator = v;
                    setFormData(prev => ({ ...prev, conditions: newConds }));
                  }}>
                    <SelectTrigger className="w-36 border-[#002443]/10 bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {operatorOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Input value={cond.value} onChange={(e) => {
                    const newConds = [...formData.conditions]; newConds[idx].value = e.target.value;
                    setFormData(prev => ({ ...prev, conditions: newConds }));
                  }} placeholder="Valor" className="flex-1 border-[#002443]/10 bg-white" />

                  {formData.conditions.length > 1 && (
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-400" onClick={() => {
                      setFormData(prev => ({ ...prev, conditions: prev.conditions.filter((_, i) => i !== idx) }));
                    }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-[#002443]/5 bg-[#f4f4f4]">
              <div>
                <Label className="text-sm font-medium text-[#002443]">Regra Ativa</Label>
                <p className="text-xs text-[#002443]/40">Regras inativas não serão executadas</p>
              </div>
              <Switch checked={formData.isActive} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))} className="data-[state=checked]:bg-[#2bc196]" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)} className="rounded-xl border-[#002443]/10">Cancelar</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl">
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingRule ? 'Atualizar' : 'Criar'} Regra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RuleSimulatorModal open={!!simulateRule} onClose={() => setSimulateRule(null)} rule={simulateRule} />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#002443]">Excluir regra?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#002443]/60">Esta ação não pode ser desfeita.</AlertDialogDescription>
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