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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  Settings, Plus, Edit, Trash2, Loader2, RefreshCw,
  CheckCircle2, XCircle, AlertTriangle, Mail, Flag, UserPlus,
  FileText, Zap, Play, History
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
      name: '',
      description: '',
      type: 'auto_approve',
      priority: 50,
      isActive: true,
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
      // Audit log
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
        entityName: 'ComplianceRule',
        entityId: id,
        actionType: 'DELETE',
        actionDescription: `Regra "${rule?.name || id}" excluída`,
        changedBy: 'admin',
        changeDate: new Date().toISOString(),
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['complianceRules'] });
    }
  });

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name || '',
      description: rule.description || '',
      type: rule.type || 'auto_approve',
      priority: rule.priority || 50,
      isActive: rule.isActive !== false,
      conditions: rule.conditions || [{ field: 'riskScore', operator: 'greater_than_or_equal', value: '' }],
      logicOperator: rule.logicOperator || 'AND',
      actions: rule.actions || [{ actionType: 'set_status', parameters: {} }]
    });
    setShowEditor(true);
  };

  const handleSave = () => {
    if (!formData.name) {
      toast.error('Nome é obrigatório');
      return;
    }
    saveMutation.mutate(formData);
  };

  const typeConfig = {
    'auto_approve': { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Auto-aprovar' },
    'auto_reject': { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Auto-rejeitar' },
    'manual_review': { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle, label: 'Revisão Manual' },
    'request_documents': { color: 'bg-blue-100 text-blue-800', icon: FileText, label: 'Solicitar Docs' },
    'notification': { color: 'bg-purple-100 text-purple-800', icon: Mail, label: 'Notificação' },
    'add_flag': { color: 'bg-yellow-100 text-yellow-800', icon: Flag, label: 'Adicionar Flag' },
  };

  const getTypeBadge = (type) => {
    const config = typeConfig[type] || typeConfig['auto_approve'];
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} gap-1 border-0`}>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Settings className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--pagsmile-blue)]">Regras de Compliance</h1>
            <p className="text-[var(--pagsmile-blue)]/70">Configure automações e fluxos de trabalho</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button 
            onClick={() => {
              resetForm();
              setShowEditor(true);
            }}
            className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nova Regra
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-[var(--pagsmile-blue)]">{rules.length}</p>
            <p className="text-sm text-[var(--pagsmile-blue)]/70">Total de Regras</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-green-600">{rules.filter(r => r.isActive).length}</p>
            <p className="text-sm text-[var(--pagsmile-blue)]/70">Ativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-[var(--pagsmile-blue)]/80">{rules.filter(r => !r.isActive).length}</p>
            <p className="text-sm text-[var(--pagsmile-blue)]/70">Inativas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-2xl font-bold text-purple-600">
              {rules.reduce((sum, r) => sum + (r.executionCount || 0), 0)}
            </p>
            <p className="text-sm text-[var(--pagsmile-blue)]/70">Execuções Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Regras */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" />
        </div>
      ) : rules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Settings className="w-12 h-12 mx-auto text-[var(--pagsmile-blue)]/40 mb-4" />
            <h3 className="text-lg font-medium text-[var(--pagsmile-blue)] mb-2">Nenhuma regra configurada</h3>
            <p className="text-[var(--pagsmile-blue)]/70 mb-6">Crie sua primeira regra de automação.</p>
            <Button 
              onClick={() => {
                resetForm();
                setShowEditor(true);
              }}
              className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar Regra
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => (
            <Card key={rule.id} className={!rule.isActive ? 'opacity-60' : ''}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-[var(--pagsmile-blue)]">{rule.name}</h3>
                      {getTypeBadge(rule.type)}
                      <Badge variant="outline" className="font-normal">
                        Prioridade: {rule.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-[var(--pagsmile-blue)]/70 mb-3">{rule.description || 'Sem descrição'}</p>
                    
                    {/* Condições resumidas */}
                    {rule.conditions && rule.conditions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="text-xs text-[var(--pagsmile-blue)]/70">Condições:</span>
                        {rule.conditions.map((cond, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs font-mono">
                            {cond.field} {cond.operator} {String(cond.value)}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Estatísticas */}
                    <div className="flex gap-4 text-sm text-[var(--pagsmile-blue)]/70">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3 h-3" />
                        {rule.executionCount || 0} execuções
                      </span>
                      {rule.lastExecutedAt && (
                        <span>
                          Última: {new Date(rule.lastExecutedAt).toLocaleDateString('pt-BR')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-[var(--pagsmile-blue)]/70">Ativa</span>
                      <Switch
                        checked={rule.isActive}
                        onCheckedChange={(checked) => 
                          toggleMutation.mutate({ id: rule.id, isActive: checked })
                        }
                      />
                    </div>
                    
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(rule)} title="Editar">
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button variant="ghost" size="icon" onClick={() => setSimulateRule(rule)} title="Simular">
                      <Play className="w-4 h-4 text-blue-600" />
                    </Button>
                    
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setDeleteId(rule.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Editor de Regra */}
      <Dialog open={showEditor} onOpenChange={(open) => {
        if (!open) resetForm();
        setShowEditor(open);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Editar Regra' : 'Nova Regra'}</DialogTitle>
            <DialogDescription>Configure as condições e ações da regra de compliance.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Informações básicas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Regra <span className="text-red-500">*</span></Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Auto-aprovar PF com Score > 90"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Ação</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o propósito desta regra..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prioridade (1-100)</Label>
                <Input
                  type="number"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 50 }))}
                  min={1}
                  max={100}
                />
                <p className="text-xs text-[var(--pagsmile-blue)]/70">Maior = executada primeiro</p>
              </div>
              <div className="space-y-2">
                <Label>Operador Lógico</Label>
                <Select 
                  value={formData.logicOperator} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, logicOperator: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AND">E (todas as condições)</SelectItem>
                    <SelectItem value="OR">OU (qualquer condição)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Condições */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Condições</Label>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    conditions: [...prev.conditions, { field: 'riskScore', operator: 'equals', value: '' }]
                  }))}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Adicionar
                </Button>
              </div>
              
              {formData.conditions.map((cond, idx) => (
                <div key={idx} className="flex gap-2 items-center p-3 bg-slate-50 rounded-lg">
                  <Select 
                    value={cond.field} 
                    onValueChange={(v) => {
                      const newConds = [...formData.conditions];
                      newConds[idx].field = v;
                      setFormData(prev => ({ ...prev, conditions: newConds }));
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {fieldOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select 
                    value={cond.operator} 
                    onValueChange={(v) => {
                      const newConds = [...formData.conditions];
                      newConds[idx].operator = v;
                      setFormData(prev => ({ ...prev, conditions: newConds }));
                    }}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {operatorOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    value={cond.value}
                    onChange={(e) => {
                      const newConds = [...formData.conditions];
                      newConds[idx].value = e.target.value;
                      setFormData(prev => ({ ...prev, conditions: newConds }));
                    }}
                    placeholder="Valor"
                    className="flex-1"
                  />

                  {formData.conditions.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          conditions: prev.conditions.filter((_, i) => i !== idx)
                        }));
                      }}
                      className="text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Status Ativo */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
              <div>
                <Label className="font-medium">Regra Ativa</Label>
                <p className="text-sm text-[var(--pagsmile-blue)]/70">Regras inativas não serão executadas</p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditor(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
            >
              {saveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingRule ? 'Atualizar' : 'Criar'} Regra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rule Simulator */}
      <RuleSimulatorModal
        open={!!simulateRule}
        onClose={() => setSimulateRule(null)}
        rule={simulateRule}
      />

      {/* Dialog de Exclusão */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir regra?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A regra será permanentemente removida.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}