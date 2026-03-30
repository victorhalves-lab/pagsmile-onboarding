import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Search, Eye, Loader2, FileText, Clock, CheckCircle2,
  AlertTriangle, XCircle, Send, BarChart3
} from 'lucide-react';

const STATUS_CONFIG = {
  questionario_preenchido: { label: 'Questionário', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: FileText },
  analisado_priscila: { label: 'Analisado IA', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: BarChart3 },
  em_contato_comercial: { label: 'Em Contato', color: 'bg-cyan-100 text-cyan-800 border-cyan-200', icon: Send },
  proposta_enviada: { label: 'Proposta Enviada', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: FileText },
  proposta_aceita: { label: 'Aceita', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
  proposta_recusada: { label: 'Recusada', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  kyc_iniciado: { label: 'KYC Iniciado', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock },
  kyc_aprovado: { label: 'KYC Aprovado', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  kyc_revisao_manual: { label: 'KYC Manual', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle },
  ativado: { label: 'Ativado', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle2 },
  perdido: { label: 'Perdido', color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle },
};

const SUBCATEGORY_LABELS = { MERCHAN: 'Merchant', GATEWAY: 'Gateway', MARKETPLACE: 'Marketplace' };

function formatCompact(value) {
  if (!value) return '-';
  if (value >= 1000000) return `R$ ${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `R$ ${(value / 1000).toFixed(0)}K`;
  return `R$ ${value.toFixed(0)}`;
}

export default function RecentLeadsTable({ leads, isLoading }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const filtered = useMemo(() => {
    return leads.filter(l => {
      const matchesSearch = !searchTerm ||
        l.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.cpfCnpj?.includes(searchTerm) ||
        l.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.companyName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
      const matchesSegment = segmentFilter === 'all' || l.businessSubCategory === segmentFilter;
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const d = new Date(l.created_date);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (dateFilter === 'today') matchesDate = d >= today;
        else if (dateFilter === 'week') matchesDate = d >= new Date(today.getTime() - 7 * 86400000);
        else if (dateFilter === 'month') matchesDate = d >= new Date(now.getFullYear(), now.getMonth(), 1);
      }
      return matchesSearch && matchesStatus && matchesSegment && matchesDate;
    });
  }, [leads, searchTerm, statusFilter, segmentFilter, dateFilter]);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-3 justify-between">
          <div className="flex gap-2 flex-wrap">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={segmentFilter} onValueChange={setSegmentFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Segmento" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="MERCHAN">Merchant</SelectItem>
                <SelectItem value="GATEWAY">Gateway</SelectItem>
                <SelectItem value="MARKETPLACE">Marketplace</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Período" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todo período</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/40" />
            <Input placeholder="Buscar por nome, CNPJ, e-mail..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-[#002443]/30 mb-4" />
            <p className="text-[#002443]/60 font-medium">Nenhum lead encontrado</p>
            <p className="text-sm text-[#002443]/40 mt-1">Ajuste os filtros</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">Lead</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>TPV</TableHead>
                <TableHead>Score IA</TableHead>
                <TableHead>Introducer</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 25).map(lead => {
                const cfg = STATUS_CONFIG[lead.status] || STATUS_CONFIG.questionario_preenchido;
                const Icon = cfg.icon;
                return (
                  <TableRow key={lead.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div>
                        <p className="font-semibold text-[#002443] text-sm">{lead.fullName || lead.companyName || 'N/A'}</p>
                        <p className="text-xs text-[#002443]/50">{lead.cpfCnpj || lead.email || '-'}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${cfg.color} gap-1 border text-[10px]`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-[#002443]/70">{SUBCATEGORY_LABELS[lead.businessSubCategory] || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-[#002443]">{formatCompact(lead.tpvMensal)}</span>
                    </TableCell>
                    <TableCell>
                      {lead.leadQualifierScore ? (
                        <span className={`text-sm font-bold ${lead.leadQualifierScore >= 70 ? 'text-green-600' : lead.leadQualifierScore >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                          {lead.leadQualifierScore}
                        </span>
                      ) : <span className="text-[#002443]/30">-</span>}
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-[#002443]/60">{lead.introducerName || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-[#002443]/60">
                        {lead.created_date ? new Date(lead.created_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={createPageUrl('PipelineComercial') + `?leadId=${lead.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs">
                          <Eye className="w-3.5 h-3.5 mr-1" /> Ver
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-[#002443]/50 font-medium">
              Exibindo {Math.min(filtered.length, 25)} de {filtered.length}
            </p>
            <Link to={createPageUrl('PipelineComercial')}>
              <Button variant="ghost" size="sm" className="text-xs text-[#2bc196] font-semibold">Ver todos →</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}