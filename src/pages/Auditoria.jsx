import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  History, Search, Download, RefreshCw, Loader2,
  Eye, Filter, ChevronLeft, ChevronRight,
  CheckCircle2, XCircle, AlertTriangle, Edit, Plus, Trash2,
  User, Bot, Settings
} from 'lucide-react';

export default function Auditoria() {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [actorTypeFilter, setActorTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const itemsPerPage = 20;

  const { data: auditLogs = [], isLoading, refetch } = useQuery({
    queryKey: ['allAuditLogs'],
    queryFn: () => base44.entities.AuditLog.list('-changeDate', 500)
  });

  const actionConfig = {
    'CREATE': { color: 'bg-blue-100 text-blue-800', icon: Plus, label: 'Criação' },
    'UPDATE': { color: 'bg-yellow-100 text-yellow-800', icon: Edit, label: 'Atualização' },
    'DELETE': { color: 'bg-red-100 text-red-800', icon: Trash2, label: 'Exclusão' },
    'VIEW': { color: 'bg-slate-100 text-slate-800', icon: Eye, label: 'Visualização' },
    'APPROVAL': { color: 'bg-green-100 text-green-800', icon: CheckCircle2, label: 'Aprovação' },
    'REJECTION': { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejeição' },
    'VALIDATION': { color: 'bg-purple-100 text-purple-800', icon: AlertTriangle, label: 'Validação' },
  };

  const actorTypeConfig = {
    'user': { icon: User, label: 'Usuário' },
    'system': { icon: Settings, label: 'Sistema' },
    'helena_ai': { icon: Bot, label: 'Helena IA' },
  };

  const getActionBadge = (action) => {
    const config = actionConfig[action] || actionConfig['UPDATE'];
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} gap-1 border-0`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getActorIcon = (actorType) => {
    const config = actorTypeConfig[actorType] || actorTypeConfig['user'];
    const Icon = config.icon;
    return <Icon className="w-4 h-4 text-slate-400" />;
  };

  // Filtrar logs
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
        
        if (dateFilter === 'today') {
          matchesDate = logDate >= today;
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = logDate >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          matchesDate = logDate >= monthStart;
        }
      }
      
      return matchesSearch && matchesAction && matchesActorType && matchesDate;
    });
  }, [auditLogs, searchTerm, actionFilter, actorTypeFilter, dateFilter]);

  // Paginação
  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
  const paginatedLogs = filteredLogs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExport = () => {
    const csvContent = [
      ['Data', 'Ação', 'Descrição', 'Ator', 'Entidade', 'ID'].join(','),
      ...filteredLogs.map(log => [
        log.changeDate ? new Date(log.changeDate).toLocaleString('pt-BR') : '',
        log.actionType,
        `"${log.actionDescription || ''}"`,
        log.changedBy,
        log.entityName,
        log.entityId
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100">
            <History className="w-6 h-6 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Auditoria de Compliance</h1>
            <p className="text-slate-500">Registro completo de todas as ações do sistema</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total de Registros', value: auditLogs.length, color: 'bg-slate-100', textColor: 'text-slate-800' },
          { label: 'Aprovações', value: auditLogs.filter(l => l.actionType === 'APPROVAL').length, color: 'bg-green-100', textColor: 'text-green-800' },
          { label: 'Rejeições', value: auditLogs.filter(l => l.actionType === 'REJECTION').length, color: 'bg-red-100', textColor: 'text-red-800' },
          { label: 'Ações Helena IA', value: auditLogs.filter(l => l.changedBy === 'HELENA_AI').length, color: 'bg-purple-100', textColor: 'text-purple-800' },
        ].map((stat, idx) => (
          <div key={idx} className={`${stat.color} rounded-xl p-4`}>
            <p className={`text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
            <p className="text-sm text-slate-600">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex gap-2 flex-wrap items-center">
            <Filter className="w-4 h-4 text-slate-400" />
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tipo de Ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Ações</SelectItem>
                <SelectItem value="CREATE">Criação</SelectItem>
                <SelectItem value="UPDATE">Atualização</SelectItem>
                <SelectItem value="APPROVAL">Aprovação</SelectItem>
                <SelectItem value="REJECTION">Rejeição</SelectItem>
                <SelectItem value="VALIDATION">Validação</SelectItem>
              </SelectContent>
            </Select>

            <Select value={actorTypeFilter} onValueChange={setActorTypeFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Ator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="user">Usuários</SelectItem>
                <SelectItem value="helena_ai">Helena IA</SelectItem>
                <SelectItem value="system">Sistema</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
              </SelectContent>
            </Select>

            {(actionFilter !== 'all' || actorTypeFilter !== 'all' || dateFilter !== 'all') && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setActionFilter('all');
                  setActorTypeFilter('all');
                  setDateFilter('all');
                }}
              >
                Limpar filtros
              </Button>
            )}
          </div>
          
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por descrição, ator ou ID..."
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
        ) : paginatedLogs.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">Nenhum registro encontrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Data/Hora</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Ator</TableHead>
                <TableHead>Entidade</TableHead>
                <TableHead className="text-right">Detalhes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedLogs.map((log) => (
                <TableRow key={log.id} className="hover:bg-slate-50">
                  <TableCell className="text-sm">
                    <div>
                      <p className="font-medium">
                        {log.changeDate ? new Date(log.changeDate).toLocaleDateString('pt-BR') : '-'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {log.changeDate ? new Date(log.changeDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>{getActionBadge(log.actionType)}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm">
                    {log.actionDescription || '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getActorIcon(log.changedBy === 'HELENA_AI' ? 'helena_ai' : log.changedBy === 'System' ? 'system' : 'user')}
                      <span className="text-sm">{log.changedBy || '-'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal text-xs">
                      {log.entityName}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setSelectedLog(log)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Paginação */}
        {filteredLogs.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filteredLogs.length)} de {filteredLogs.length} registros
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
              <span className="text-sm text-slate-600">
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

      {/* Modal de Detalhes */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Detalhes do Registro</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Data/Hora</p>
                  <p className="font-medium">
                    {selectedLog.changeDate ? new Date(selectedLog.changeDate).toLocaleString('pt-BR') : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Tipo de Ação</p>
                  {getActionBadge(selectedLog.actionType)}
                </div>
                <div>
                  <p className="text-sm text-slate-500">Ator</p>
                  <p className="font-medium">{selectedLog.changedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Entidade</p>
                  <p className="font-medium">{selectedLog.entityName}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">Descrição</p>
                <p className="font-medium">{selectedLog.actionDescription}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">ID da Entidade</p>
                <p className="font-mono text-sm bg-slate-50 p-2 rounded">{selectedLog.entityId}</p>
              </div>
              {selectedLog.details && (
                <div>
                  <p className="text-sm text-slate-500 mb-2">Detalhes Adicionais</p>
                  <pre className="bg-slate-50 p-3 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.ipAddress && (
                <div>
                  <p className="text-sm text-slate-500">Endereço IP</p>
                  <p className="font-mono text-sm">{selectedLog.ipAddress}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}