import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  FileText, Search, Filter, Plus, Eye, Edit, Clock, 
  CheckCircle2, Send, XCircle, AlertTriangle, ChevronRight,
  FileCheck
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const STATUS_CONFIG = {
  pre_generated: { label: 'Pré-gerado', color: 'bg-amber-100 text-amber-800', icon: Clock },
  under_review: { label: 'Em Revisão', color: 'bg-blue-100 text-blue-800', icon: Edit },
  ready: { label: 'Pronto', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  sent: { label: 'Enviado', color: 'bg-purple-100 text-purple-800', icon: Send },
  signed: { label: 'Assinado', color: 'bg-emerald-100 text-emerald-800', icon: FileCheck },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function GestaoContratos() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: () => base44.entities.Contract.list('-created_date', 100),
  });

  const filtered = contracts.filter(c => {
    const matchSearch = !search || 
      (c.clientName || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.clientCnpj || '').includes(search) ||
      (c.codigo || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: contracts.length,
    preGenerated: contracts.filter(c => c.status === 'pre_generated').length,
    underReview: contracts.filter(c => c.status === 'under_review').length,
    ready: contracts.filter(c => c.status === 'ready').length,
    sent: contracts.filter(c => c.status === 'sent').length,
    signed: contracts.filter(c => c.status === 'signed').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#002443]">Gestão de Contratos</h1>
          <p className="text-sm text-[#002443]/60 mt-1">Gerencie contratos pré-gerados e finalizados</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {[
          { label: 'Total', value: stats.total, color: 'text-[#002443]' },
          { label: 'Pré-gerados', value: stats.preGenerated, color: 'text-amber-600' },
          { label: 'Em Revisão', value: stats.underReview, color: 'text-blue-600' },
          { label: 'Prontos', value: stats.ready, color: 'text-green-600' },
          { label: 'Enviados', value: stats.sent, color: 'text-purple-600' },
          { label: 'Assinados', value: stats.signed, color: 'text-emerald-600' },
        ].map((s, i) => (
          <Card key={i} className="bg-white border border-[#002443]/5">
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-[#002443]/50 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/40" />
          <Input 
            placeholder="Buscar por nome, CNPJ ou código..." 
            value={search} 
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="pre_generated">Pré-gerados</SelectItem>
            <SelectItem value="under_review">Em Revisão</SelectItem>
            <SelectItem value="ready">Prontos</SelectItem>
            <SelectItem value="sent">Enviados</SelectItem>
            <SelectItem value="signed">Assinados</SelectItem>
            <SelectItem value="cancelled">Cancelados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contracts List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-[#2bc196] border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="bg-white border border-[#002443]/5">
          <CardContent className="py-16 text-center">
            <FileText className="w-12 h-12 text-[#002443]/20 mx-auto mb-3" />
            <p className="text-[#002443]/60 font-medium">Nenhum contrato encontrado</p>
            <p className="text-sm text-[#002443]/40 mt-1">Contratos são pré-gerados automaticamente quando o compliance é aprovado.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(contract => {
            const statusCfg = STATUS_CONFIG[contract.status] || STATUS_CONFIG.pre_generated;
            const StatusIcon = statusCfg.icon;
            const missingCount = contract.missingFields?.length || 0;
            const preFilledCount = contract.preFilledFields?.length || 0;

            return (
              <Link key={contract.id} to={createPageUrl(`EditorContrato?id=${contract.id}`)}>
                <Card className="bg-white border border-[#002443]/5 hover:border-[#2bc196]/30 hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#2bc196]/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-[#2bc196]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[#002443] truncate">{contract.clientName || 'Sem nome'}</h3>
                        <Badge className={`${statusCfg.color} text-xs`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-[#002443]/50">
                        <span>{contract.codigo || '---'}</span>
                        <span>CNPJ: {contract.clientCnpj || '---'}</span>
                        <span>Criado: {contract.created_date ? new Date(contract.created_date).toLocaleDateString('pt-BR') : '---'}</span>
                      </div>
                    </div>

                    <div className="hidden md:flex items-center gap-4 shrink-0">
                      {missingCount > 0 && (
                        <div className="flex items-center gap-1 text-amber-600">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span className="text-xs font-medium">{missingCount} pendentes</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">{preFilledCount} preenchidos</span>
                      </div>
                    </div>

                    <ChevronRight className="w-5 h-5 text-[#002443]/20 group-hover:text-[#2bc196] transition-colors shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}