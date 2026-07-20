import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { 
  History, Search, Download, RefreshCw, Loader2,
  Eye, Filter, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, AlertTriangle, Edit, Plus, Trash2,
  User, Bot, Settings
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

export default function Auditoria() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [actorTypeFilter, setActorTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const itemsPerPage = 20;

  React.useEffect(() => { setCurrentPage(1); }, [searchTerm, actionFilter, actorTypeFilter, dateFilter, entityFilter]);

  const { data: auditLogs = [], isLoading, refetch } = useQuery({
    queryKey: ['allAuditLogs'],
    queryFn: () => base44.entities.AuditLog.list('-changeDate', 500)
  });

  const actionConfig = {
    'CREATE': { bg: 'bg-[#E84B1C]/10', text: 'text-[#E84B1C]', icon: Plus, label: t('aud.action_create') },
    'UPDATE': { bg: 'bg-[#0A0A0A]/5', text: 'text-[#0A0A0A]', icon: Edit, label: t('aud.action_update') },
    'DELETE': { bg: 'bg-red-50', text: 'text-red-500', icon: Trash2, label: t('aud.action_delete') },
    'VIEW': { bg: 'bg-[#f4f4f4]', text: 'text-[#0A0A0A]/60', icon: Eye, label: t('aud.action_view') },
    'APPROVAL': { bg: 'bg-[#1356E2]/10', text: 'text-[#1356E2]', icon: CheckCircle2, label: t('aud.action_approval') },
    'REJECTION': { bg: 'bg-red-50', text: 'text-red-500', icon: XCircle, label: t('aud.action_rejection') },
    'VALIDATION': { bg: 'bg-[#E84B1C]/10', text: 'text-[#E84B1C]', icon: AlertTriangle, label: t('aud.action_validation') },
  };

  const getActionBadge = (action) => {
    const config = actionConfig[action] || actionConfig['UPDATE'];
    const Icon = config.icon;
    return <Badge className={`${config.bg} ${config.text} gap-1 border-0`}><Icon className="w-3 h-3" />{config.label}</Badge>;
  };

  const getActorIcon = (changedBy) => {
    if (changedBy === 'HELENA_AI') return <Bot className="w-4 h-4 text-[#1356E2]" />;
    if (changedBy === 'System') return <Settings className="w-4 h-4 text-[#0A0A0A]/40" />;
    return <User className="w-4 h-4 text-[#0A0A0A]/40" />;
  };

  const filteredLogs = React.useMemo(() => {
    return auditLogs.filter(log => {
      const matchesSearch = !searchTerm || 
        log.actionDescription?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.changedBy?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.entityId?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesAction = actionFilter === 'all' || log.actionType === actionFilter;
      const matchesActorType = actorTypeFilter === 'all' || 
        (actorTypeFilter === 'helena_ai' && log.changedBy === 'HELENA_AI') ||
        (actorTypeFilter === 'system' && log.changedBy === 'System') ||
        (actorTypeFilter === 'user' && log.changedBy !== 'HELENA_AI' && log.changedBy !== 'System');
      let matchesDate = true;
      if (dateFilter !== 'all' && log.changeDate) {
        const logDate = new Date(log.changeDate);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (dateFilter === 'today') matchesDate = logDate >= today;
        else if (dateFilter === 'week') matchesDate = logDate >= new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        else if (dateFilter === 'month') matchesDate = logDate >= new Date(now.getFullYear(), now.getMonth(), 1);
      }
      const matchesEntity = !entityFilter || log.entityName === entityFilter;
      return matchesSearch && matchesAction && matchesActorType && matchesDate && matchesEntity;
    });
  }, [auditLogs, searchTerm, actionFilter, actorTypeFilter, dateFilter, entityFilter]);

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleExport = () => {
    const csvContent = [
      [t('aud.csv_date'), t('aud.csv_action'), t('aud.csv_description'), t('aud.csv_actor'), t('aud.csv_entity'), t('aud.csv_id')].join(','),
      ...filteredLogs.map(log => [
        log.changeDate ? new Date(log.changeDate).toLocaleString() : '',
        log.actionType, `"${log.actionDescription || ''}"`, log.changedBy, log.entityName, log.entityId
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const stats = [
    { label: t('aud.total_records'), value: auditLogs.length, color: '#0A0A0A' },
    { label: t('aud.approvals'), value: auditLogs.filter(l => l.actionType === 'APPROVAL').length, color: '#1356E2' },
    { label: t('aud.rejections'), value: auditLogs.filter(l => l.actionType === 'REJECTION').length, color: '#0A0A0A' },
    { label: t('aud.helena_actions'), value: auditLogs.filter(l => l.changedBy === 'HELENA_AI').length, color: '#E84B1C' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#0A0A0A]/5 flex items-center justify-center">
            <History className="w-5 h-5 text-[#0A0A0A]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#0A0A0A]">{t('aud.title')}</h1>
            <p className="text-sm text-[#0A0A0A]/60">{t('aud.subtitle')}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} className="border-[#0A0A0A]/10 hover:bg-[#f4f4f4] rounded-xl">
            <Download className="w-4 h-4 mr-2 text-[#0A0A0A]/50" /> <span className="text-[#0A0A0A]/70">{t('aud.export')}</span>
          </Button>
          <Button variant="outline" onClick={() => refetch()} className="border-[#0A0A0A]/10 hover:bg-[#f4f4f4] rounded-xl">
            <RefreshCw className="w-4 h-4 mr-2 text-[#0A0A0A]/50" /> <span className="text-[#0A0A0A]/70">{t('aud.refresh')}</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#0A0A0A]/5 p-4">
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs text-[#0A0A0A]/50">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 p-4">
        <div className="flex flex-col md:flex-row gap-3 justify-between">
          <div className="flex gap-2 flex-wrap items-center">
            <Filter className="w-4 h-4 text-[#0A0A0A]/30" />
            {[
              { value: actionFilter, onChange: setActionFilter, placeholder: t('aud.col_action'), width: 'w-40', options: [
                { v: 'all', l: t('aud.all_actions') }, { v: 'CREATE', l: t('aud.action_create') }, { v: 'UPDATE', l: t('aud.action_update') }, { v: 'DELETE', l: t('aud.action_delete') }, { v: 'APPROVAL', l: t('aud.action_approval') }, { v: 'REJECTION', l: t('aud.action_rejection') }, { v: 'VALIDATION', l: t('aud.action_validation') }
              ]},
              { value: entityFilter || 'all', onChange: (v) => setEntityFilter(v === 'all' ? null : v), placeholder: t('aud.col_entity'), width: 'w-44', options: [
                { v: 'all', l: t('aud.all_entities') }, { v: 'Proposal', l: t('aud.proposals') }, { v: 'ComplianceRule', l: t('aud.rules') }, { v: 'OnboardingCase', l: t('aud.onboarding') }, { v: 'Lead', l: t('aud.leads') }
              ]},
              { value: actorTypeFilter, onChange: setActorTypeFilter, placeholder: t('aud.col_actor'), width: 'w-36', options: [
                { v: 'all', l: t('aud.all_actors') }, { v: 'user', l: t('aud.users') }, { v: 'helena_ai', l: 'Helena IA' }, { v: 'system', l: t('aud.system') }
              ]},
              { value: dateFilter, onChange: setDateFilter, placeholder: t('aud.all_period'), width: 'w-36', options: [
                { v: 'all', l: t('aud.all_period') }, { v: 'today', l: t('aud.today') }, { v: 'week', l: t('aud.this_week') }, { v: 'month', l: t('aud.this_month') }
              ]},
            ].map((filter, idx) => (
              <Select key={idx} value={filter.value} onValueChange={filter.onChange}>
                <SelectTrigger className={`${filter.width} border-[#0A0A0A]/10 text-sm`}><SelectValue placeholder={filter.placeholder} /></SelectTrigger>
                <SelectContent>{filter.options.map(o => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}</SelectContent>
              </Select>
            ))}
            {(actionFilter !== 'all' || actorTypeFilter !== 'all' || dateFilter !== 'all' || entityFilter) && (
              <button onClick={() => { setActionFilter('all'); setActorTypeFilter('all'); setDateFilter('all'); setEntityFilter(null); }} className="text-xs text-[#1356E2] hover:text-[#E84B1C] font-medium">
                {t('aud.clear_filters')}
              </button>
            )}
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A0A0A]/30" />
            <Input placeholder={t('aud.search_placeholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 border-[#0A0A0A]/10" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-[#1356E2]" /></div>
        ) : paginatedLogs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-[#f4f4f4] flex items-center justify-center mx-auto mb-4"><History className="w-7 h-7 text-[#0A0A0A]/20" /></div>
            <p className="text-sm text-[#0A0A0A]/50">{t('aud.no_records')}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-[#f4f4f4]">
                {[t('aud.col_datetime'), t('aud.col_action'), t('aud.col_description'), t('aud.col_actor'), t('aud.col_entity'), ''].map((h, i) => (
                  <TableHead key={i} className={`text-[10px] font-bold text-[#0A0A0A]/40 uppercase ${i === 5 ? 'text-right' : ''}`}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-[#f4f4f4]/50">
                  <TableCell className="text-sm">
                    <p className="font-medium text-[#0A0A0A]">{log.changeDate ? new Date(log.changeDate).toLocaleDateString() : '-'}</p>
                    <p className="text-[10px] text-[#0A0A0A]/30">{log.changeDate ? new Date(log.changeDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : ''}</p>
                  </TableCell>
                  <TableCell>{getActionBadge(log.actionType)}</TableCell>
                  <TableCell className="max-w-xs truncate text-xs text-[#0A0A0A]/60">{log.actionDescription || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActorIcon(log.changedBy)}
                      <span className="text-xs text-[#0A0A0A]/60">{log.changedBy || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[10px] border-[#0A0A0A]/10 text-[#0A0A0A]/50">{log.entityName}</Badge></TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setSelectedLog(log)}>
                      <Eye className="w-4 h-4 text-[#0A0A0A]/30" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {filteredLogs.length > 0 && (
          <div className="px-5 py-3 border-t border-[#0A0A0A]/5 flex items-center justify-between">
            <p className="text-xs text-[#0A0A0A]/40">
              {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredLogs.length)} de {filteredLogs.length}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="rounded-lg border-[#0A0A0A]/10" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs text-[#0A0A0A]/50">{currentPage} / {totalPages || 1}</span>
              <Button variant="outline" size="sm" className="rounded-lg border-[#0A0A0A]/10" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages || totalPages === 0}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader><DialogTitle className="text-[#0A0A0A]">{t('aud.detail_title')}</DialogTitle></DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-[#0A0A0A]/40">{t('aud.detail_datetime')}</p><p className="font-medium text-sm text-[#0A0A0A]">{selectedLog.changeDate ? new Date(selectedLog.changeDate).toLocaleString() : '-'}</p></div>
                <div><p className="text-xs text-[#0A0A0A]/40 mb-1">{t('aud.detail_action')}</p>{getActionBadge(selectedLog.actionType)}</div>
                <div><p className="text-xs text-[#0A0A0A]/40">{t('aud.detail_actor')}</p><p className="font-medium text-sm text-[#0A0A0A]">{selectedLog.changedBy}</p></div>
                <div><p className="text-xs text-[#0A0A0A]/40">{t('aud.detail_entity')}</p><p className="font-medium text-sm text-[#0A0A0A]">{selectedLog.entityName}</p></div>
              </div>
              <div><p className="text-xs text-[#0A0A0A]/40">{t('aud.detail_description')}</p><p className="text-sm text-[#0A0A0A]">{selectedLog.actionDescription}</p></div>
              <div><p className="text-xs text-[#0A0A0A]/40">{t('aud.detail_entity_id')}</p><p className="font-mono text-xs bg-[#f4f4f4] p-2 rounded-xl text-[#E84B1C]">{selectedLog.entityId}</p></div>
              {selectedLog.details && (
                <div><p className="text-xs text-[#0A0A0A]/40 mb-1">{t('aud.detail_additional')}</p><pre className="bg-[#f4f4f4] p-3 rounded-xl text-xs overflow-auto max-h-40 text-[#0A0A0A]/70">{JSON.stringify(selectedLog.details, null, 2)}</pre></div>
              )}
              {selectedLog.ipAddress && (
                <div><p className="text-xs text-[#0A0A0A]/40">{t('aud.detail_ip')}</p><p className="font-mono text-xs text-[#0A0A0A]/60">{selectedLog.ipAddress}</p></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}