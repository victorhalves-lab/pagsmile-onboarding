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
  Filter, ChevronLeft, ChevronRight, Play, Pause, User, Building2,
  History, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function GestaoRevalidacao() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
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
      toast.success(t('gr.scheduled_success'));
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
      toast.success(t('gr.status_updated_success'));
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
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: t('gr.status_pending') },
      'in_progress': { color: 'bg-blue-100 text-blue-800', icon: Play, label: t('gr.status_in_progress') },
      'completed': { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: t('gr.status_completed') },
      'cancelled': { color: 'bg-slate-100 text-[var(--pagsmile-blue)]', icon: XCircle, label: t('gr.status_cancelled') },
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
      'periodic': t('gr.type_periodic'),
      'risk_based': t('gr.type_risk'),
      'regulatory': t('gr.type_regulatory'),
      'manual': t('gr.type_manual')
    };
    return <Badge variant="outline">{labels[type] || type}</Badge>;
  };

  const getFrequencyLabel = (freq) => {
    const labels = {
      'monthly': t('gr.freq_monthly'),
      'quarterly': t('gr.freq_quarterly'),
      'semi_annual': t('gr.freq_semi_annual'),
      'annual': t('gr.freq_annual')
    };
    return labels[freq] || freq;
  };

  const filteredSchedules = React.useMemo(() => {
    const now = new Date();
    return schedules.filter(s => {
      const merchant = merchantMap[s.merchantId];
      const matchesSearch = !searchTerm || 
        merchant?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        merchant?.cpfCnpj?.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      
      let matchesDateRange = true;
      if (dateRangeFilter !== 'all' && s.scheduledDate) {
        const schedDate = new Date(s.scheduledDate);
        if (dateRangeFilter === '7days') {
          matchesDateRange = schedDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) && schedDate >= now;
        } else if (dateRangeFilter === '30days') {
          matchesDateRange = schedDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) && schedDate >= now;
        } else if (dateRangeFilter === 'overdue') {
          matchesDateRange = schedDate < now && s.status === 'pending';
        }
      }
      
      return matchesSearch && matchesStatus && matchesDateRange;
    });
  }, [schedules, searchTerm, statusFilter, dateRangeFilter, merchantMap]);

  const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);
  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSchedule = () => {
    if (!formData.merchantId || !formData.scheduledDate) {
      toast.error(t('gr.fill_required'));
      return;
    }
    createScheduleMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-white/10">
              <History className="w-6 h-6 text-[#5cf7cf]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('gr.title')}</h1>
              <p className="text-white/60 text-sm mt-1">{t('gr.subtitle')}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} className="border-white/20 text-white hover:bg-white/10 rounded-xl bg-transparent">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('gr.refresh')}
            </Button>
            <Button 
              onClick={() => setShowScheduleDialog(true)}
              className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white rounded-xl shadow-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('gr.schedule')}
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: t('gr.total'), value: stats.total, color: 'text-[#002443]' },
          { label: t('gr.pending'), value: stats.pending, color: 'text-yellow-600' },
          { label: t('gr.in_progress'), value: stats.inProgress, color: 'text-blue-600' },
          { label: t('gr.completed'), value: stats.completed, color: 'text-green-600' },
          { label: t('gr.this_month'), value: stats.thisMonth, color: 'text-purple-600' },
          { label: t('gr.overdue'), value: stats.overdue, color: 'text-red-600', alert: stats.overdue > 0 },
        ].map((s, i) => (
          <Card key={i} className={`rounded-2xl border-[#002443]/5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all ${s.alert ? 'border-red-300 bg-red-50/50' : ''}`}>
            <CardContent className="pt-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-[#282828]/50">{s.label}</p>
              {s.alert && <p className="text-[10px] text-red-500 font-medium mt-1">{t('gr.requires_attention')}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-2 flex-wrap items-center">
            <Filter className="w-4 h-4 text-[#002443]/50" />
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('gr.all')}</SelectItem>
                <SelectItem value="pending">{t('gr.pending')}</SelectItem>
                <SelectItem value="in_progress">{t('gr.in_progress')}</SelectItem>
                <SelectItem value="completed">{t('gr.completed')}</SelectItem>
                <SelectItem value="cancelled">{t('gr.status_cancelled')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('gr.all_dates')}</SelectItem>
                <SelectItem value="7days">{t('gr.next_7_days')}</SelectItem>
                <SelectItem value="30days">{t('gr.next_30_days')}</SelectItem>
                <SelectItem value="overdue">{t('gr.overdue')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pagsmile-blue)]/50" />
            <Input
              placeholder={t('gr.search_placeholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--pagsmile-green)]" />
          </div>
        ) : paginatedSchedules.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 mx-auto text-[var(--pagsmile-blue)]/40 mb-4" />
            <p className="text-[var(--pagsmile-blue)]/70">{t('gr.no_schedules')}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f4f4f4]">
                <TableHead>{t('gr.merchant')}</TableHead>
                <TableHead>{t('gr.scheduled_date')}</TableHead>
                <TableHead>{t('gr.type')}</TableHead>
                <TableHead>{t('gr.frequency')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead>{t('gr.case')}</TableHead>
                <TableHead className="text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSchedules.map((schedule) => {
                const merchant = merchantMap[schedule.merchantId];
                const isOverdue = schedule.status === 'pending' && new Date(schedule.scheduledDate) < new Date();
                return (
                  <TableRow key={schedule.id} className={`hover:bg-[#f4f4f4] transition-colors ${isOverdue ? 'bg-red-50/50' : ''}`}>
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
                        {isOverdue && <Badge className="bg-red-100 text-red-800 text-xs">{t('gr.overdue')}</Badge>}
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(schedule.revalidationType)}</TableCell>
                    <TableCell className="text-sm text-[var(--pagsmile-blue)]/80">
                      {getFrequencyLabel(schedule.frequency)}
                    </TableCell>
                    <TableCell>{getStatusBadge(schedule.status)}</TableCell>
                    <TableCell>
                      {schedule.onboardingCaseId ? (
                        <Link to={createPageUrl('AnaliseDeCasos') + `?id=${schedule.onboardingCaseId}`}>
                          <Button variant="ghost" size="sm" className="text-[#2bc196] hover:text-[#2bc196] text-xs">
                            <Eye className="w-3.5 h-3.5 mr-1" />
                            {t('gr.view_case')}
                          </Button>
                        </Link>
                      ) : (
                        <span className="text-xs text-[#282828]/30">-</span>
                      )}
                    </TableCell>
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
              {t('gr.showing', { from: ((currentPage - 1) * itemsPerPage) + 1, to: Math.min(currentPage * itemsPerPage, filteredSchedules.length), total: filteredSchedules.length })}
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
                {t('gr.page', { page: currentPage, total: totalPages || 1 })}
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
            <DialogTitle>{t('gr.dialog_title')}</DialogTitle>
            <DialogDescription>{t('gr.dialog_desc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Merchant <span className="text-red-500">*</span></Label>
              <Select 
                value={formData.merchantId} 
                onValueChange={(v) => setFormData(prev => ({ ...prev, merchantId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('gr.select_merchant')} />
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
                min={new Date().toISOString().split('T')[0]}
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
                    <SelectItem value="periodic">{t('gr.type_periodic')}</SelectItem>
                    <SelectItem value="risk_based">{t('gr.type_risk')}</SelectItem>
                    <SelectItem value="regulatory">{t('gr.type_regulatory')}</SelectItem>
                    <SelectItem value="manual">{t('gr.type_manual')}</SelectItem>
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
                    <SelectItem value="monthly">{t('gr.freq_monthly')}</SelectItem>
                    <SelectItem value="quarterly">{t('gr.freq_quarterly')}</SelectItem>
                    <SelectItem value="semi_annual">{t('gr.freq_semi_annual')}</SelectItem>
                    <SelectItem value="annual">{t('gr.freq_annual')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>{t('gr.notes')}</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder={t('gr.notes_placeholder')}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleSchedule}
              disabled={createScheduleMutation.isPending}
              className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90"
            >
              {createScheduleMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {t('gr.schedule')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}