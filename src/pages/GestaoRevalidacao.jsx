import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { 
  RefreshCw, Plus, Loader2, Calendar, Clock,
  CheckCircle2, XCircle, AlertTriangle, Search,
  Filter, ChevronLeft, ChevronRight, Play, Pause, User, Building2
} from 'lucide-react';
import { toast } from 'sonner';

export default function GestaoRevalidacao() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    merchantId: '',
    scheduledDate: '',
    revalidationType: 'periodic',
    frequency: 'annual',
    notes: ''
  });

  const { data: schedules = [], isLoading, refetch } = useQuery({
    queryKey: ['revalidationSchedules'],
    queryFn: () => base44.entities.RevalidationSchedule.list('-scheduledDate', 200)
  });

  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => base44.entities.Merchant.list()
  });

  // Apenas merchants aprovados
  const approvedMerchants = merchants.filter(m => m.onboardingStatus === 'Aprovado');

  const merchantMap = React.useMemo(() => {
    const map = {};
    merchants.forEach(m => { map[m.id] = m; });
    return map;
  }, [merchants]);

  const createScheduleMutation = useMutation({
    mutationFn: async (data) => {
      return base44.entities.RevalidationSchedule.create({
        ...data,
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revalidationSchedules'] });
      toast.success('Revalidação agendada!');
      setShowScheduleDialog(false);
      setFormData({
        merchantId: '',
        scheduledDate: '',
        revalidationType: 'periodic',
        frequency: 'annual',
        notes: ''
      });
    },
    onError: (error) => {
      toast.error('Erro ao agendar: ' + error.message);
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return base44.entities.RevalidationSchedule.update(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['revalidationSchedules'] });
      toast.success('Status atualizado!');
    }
  });

  const stats = React.useMemo(() => {
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    
    return {
      total: schedules.length,
      pending: schedules.filter(s => s.status === 'pending').length,
      inProgress: schedules.filter(s => s.status === 'in_progress').length,
      completed: schedules.filter(s => s.status === 'completed').length,
      thisMonth: schedules.filter(s => {
        const date = new Date(s.scheduledDate);
        return date >= thisMonth && date < nextMonth;
      }).length,
      overdue: schedules.filter(s => {
        return s.status === 'pending' && new Date(s.scheduledDate) < now;
      }).length
    };
  }, [schedules]);

  const getStatusBadge = (status) => {
    const config = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pendente' },
      'in_progress': { color: 'bg-blue-100 text-blue-800', icon: Play, label: 'Em Andamento' },
      'completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Concluído' },
      'cancelled': { color: 'bg-slate-100 text-[var(--pagsmile-blue)]', icon: XCircle, label: 'Cancelado' },
    };
    const c = config[status] || config['pending'];
    const Icon = c.icon;
    return (
      <Badge className={`${c.color} gap-1 border-0`}>
        <Icon className="w-3 h-3" />
        {c.label}
      </Badge>
    );
  };

  const getTypeBadge = (type) => {
    const labels = {
      'periodic': 'Periódica',
      'risk_based': 'Baseada em Risco',
      'regulatory': 'Regulatória',
      'manual': 'Manual'
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  const getFrequencyLabel = (freq) => {
    const labels = {
      'monthly': 'Mensal',
      'quarterly': 'Trimestral',
      'semi_annual': 'Semestral',
      'annual': 'Anual'
    };
    return labels[freq] || freq;
  };

  const filteredSchedules = React.useMemo(() => {
    return schedules.filter(s => {
      const merchant = merchantMap[s.merchantId];
      const matchesSearch = !searchTerm || 
        merchant?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        merchant?.cpfCnpj?.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [schedules, searchTerm, statusFilter, merchantMap]);

  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);
  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSchedule = () => {
    if (!formData.merchantId || !formData.scheduledDate) {
      toast.error('Preencha os campos obrigatórios');
      return;
    }
    createScheduleMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-teal-100">
            <RefreshCw className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--pagsmile-blue)]">Revalidação de Clientes</h1>
            <p className="text-[var(--pagsmile-blue)]/70">Gerencie a recertificação periódica de merchants</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button 
            onClick={() => setShowScheduleDialog(true)}
            className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agendar Revalidação
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-[var(--pagsmile-blue)]">{stats.total}</p>
            <p className="text-xs text-[var(--pagsmile-blue)]/70">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
            <p className="text-xs text-[var(--pagsmile-blue)]/70">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
            <p className="text-xs text-[var(--pagsmile-blue)]/70">Em Andamento</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            <p className="text-xs text-[var(--pagsmile-blue)]/70">Concluídas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-purple-600">{stats.thisMonth}</p>
            <p className="text-xs text-[var(--pagsmile-blue)]/70">Este Mês</p>
          </CardContent>
        </Card>
        <Card className={stats.overdue > 0 ? 'border-red-200 bg-red-50' : ''}>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
            <p className="text-xs text-[var(--pagsmile-blue)]/70">Atrasadas</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-2 flex-wrap items-center">
            <Filter className="w-4 h-4 text-[var(--pagsmile-blue)]/50" />
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="in_progress">Em Andamento</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pagsmile-blue)]/50" />
            <Input
              placeholder="Buscar por merchant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" />
          </div>
        ) : paginatedSchedules.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-[var(--pagsmile-blue)]/40 mb-4" />
            <p className="text-[var(--pagsmile-blue)]/70">Nenhuma revalidação agendada</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Merchant</TableHead>
                <TableHead>Data Programada</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Frequência</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSchedules.map((schedule) => {
                const merchant = merchantMap[schedule.merchantId];
                const isOverdue = schedule.status === 'pending' && new Date(schedule.scheduledDate) < new Date();
                return (
                  <TableRow key={schedule.id} className={`hover:bg-slate-50 ${isOverdue ? 'bg-red-50' : ''}`}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          merchant?.type === 'PF' ? 'bg-blue-100' : 'bg-purple-100'
                        }`}>
                          {merchant?.type === 'PF' ? (
                            <User className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Building2 className="w-4 h-4 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-[var(--pagsmile-blue)]">{merchant?.fullName || '-'}</p>
                          <p className="text-xs text-[var(--pagsmile-blue)]/70">{merchant?.cpfCnpj || ''}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[var(--pagsmile-blue)]/50" />
                        <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                          {schedule.scheduledDate ? new Date(schedule.scheduledDate).toLocaleDateString('pt-BR') : '-'}
                        </span>
                        {isOverdue && <Badge className="bg-red-100 text-red-800 text-xs">Atrasada</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(schedule.revalidationType)}</TableCell>
                    <TableCell className="text-sm text-[var(--pagsmile-blue)]/80">
                      {getFrequencyLabel(schedule.frequency)}
                    </TableCell>
                    <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {schedule.status === 'pending' && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({ id: schedule.id, status: 'in_progress' })}
                              className="text-blue-600"
                            >
                              <Play className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => updateStatusMutation.mutate({ id: schedule.id, status: 'cancelled' })}
                              className="text-[var(--pagsmile-blue)]/80"
                            >
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {schedule.status === 'in_progress' && (
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ id: schedule.id, status: 'completed' })}
                            className="text-green-600"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        {/* Paginação */}
        {filteredSchedules.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-[var(--pagsmile-blue)]/70">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredSchedules.length)} de {filteredSchedules.length}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-[var(--pagsmile-blue)]/80">
                Página {currentPage} de {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog de Agendamento */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agendar Revalidação</DialogTitle>
            <DialogDescription>Programe uma revalidação de compliance para um merchant aprovado.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Merchant <span className="text-red-500">*</span></Label>
              <Select 
                value={formData.merchantId} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, merchantId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o merchant" />
                </SelectTrigger>
                <SelectContent>
                  {approvedMerchants.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.fullName} ({m.cpfCnpj})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Programada <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => setFormData(prev => ({ ...prev, scheduledDate: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Revalidação</Label>
                <Select 
                  value={formData.revalidationType} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, revalidationType: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="periodic">Periódica</SelectItem>
                    <SelectItem value="risk_based">Baseada em Risco</SelectItem>
                    <SelectItem value="regulatory">Regulatória</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Frequência</Label>
                <Select 
                  value={formData.frequency} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, frequency: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Mensal</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                    <SelectItem value="semi_annual">Semestral</SelectItem>
                    <SelectItem value="annual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas adicionais sobre esta revalidação..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSchedule}
              disabled={createScheduleMutation.isPending}
              className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
            >
              {createScheduleMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Agendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}