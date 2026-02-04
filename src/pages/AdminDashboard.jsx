import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, RefreshCw, Eye, Clock, CheckCircle2, 
  AlertTriangle, XCircle, Users, FileCheck, Link as LinkIcon,
  Loader2
} from 'lucide-react';

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  const { data: onboardingCases = [], isLoading: casesLoading, refetch: refetchCases } = useQuery({
    queryKey: ['onboardingCases'],
    queryFn: () => base44.entities.OnboardingCase.list('-created_date', 100)
  });

  const { data: merchants = [], isLoading: merchantsLoading } = useQuery({
    queryKey: ['merchants'],
    queryFn: () => base44.entities.Merchant.list()
  });

  const merchantMap = React.useMemo(() => {
    const map = {};
    merchants.forEach(m => { map[m.id] = m; });
    return map;
  }, [merchants]);

  const getStatusBadge = (status) => {
    const config = {
      'Pendente': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'Em Processamento': { color: 'bg-blue-100 text-blue-800', icon: Loader2 },
      'Aprovado': { color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
      'Manual': { color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
      'Recusado': { color: 'bg-red-100 text-red-800', icon: XCircle }
    };
    const { color, icon: Icon } = config[status] || config['Pendente'];
    return (
      <Badge className={`${color} gap-1`}>
        <Icon className="w-3 h-3" />
        {status}
      </Badge>
    );
  };

  const filteredCases = onboardingCases.filter(c => {
    const merchant = merchantMap[c.merchantId];
    const matchesSearch = !searchTerm || 
      merchant?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      merchant?.cpfCnpj?.includes(searchTerm);
    
    const matchesTab = activeTab === 'all' || c.status === activeTab;
    
    return matchesSearch && matchesTab;
  });

  const stats = {
    total: onboardingCases.length,
    pendente: onboardingCases.filter(c => c.status === 'Pendente').length,
    processando: onboardingCases.filter(c => c.status === 'Em Processamento').length,
    manual: onboardingCases.filter(c => c.status === 'Manual').length,
    aprovado: onboardingCases.filter(c => c.status === 'Aprovado').length,
    recusado: onboardingCases.filter(c => c.status === 'Recusado').length
  };

  const isLoading = casesLoading || merchantsLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard de Onboarding</h1>
          <p className="text-slate-500">Gerencie e monitore os casos de compliance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetchCases()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Link to={createPageUrl('GenerateOnboardingLink')}>
            <Button className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90">
              <LinkIcon className="w-4 h-4 mr-2" />
              Gerar Link
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-slate-100">
              <Users className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              <p className="text-xs text-slate-500">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.pendente}</p>
              <p className="text-xs text-slate-500">Pendentes</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Loader2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.processando}</p>
              <p className="text-xs text-slate-500">Processando</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.manual}</p>
              <p className="text-xs text-slate-500">Revisão Manual</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.aprovado}</p>
              <p className="text-xs text-slate-500">Aprovados</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-800">{stats.recusado}</p>
              <p className="text-xs text-slate-500">Recusados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="Pendente">Pendentes</TabsTrigger>
              <TabsTrigger value="Em Processamento">Processando</TabsTrigger>
              <TabsTrigger value="Manual">Manual</TabsTrigger>
              <TabsTrigger value="Aprovado">Aprovados</TabsTrigger>
              <TabsTrigger value="Recusado">Recusados</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou CNPJ..."
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
        ) : filteredCases.length === 0 ? (
          <div className="text-center py-12">
            <FileCheck className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">Nenhum caso encontrado</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Merchant</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCases.map((c) => {
                const merchant = merchantMap[c.merchantId];
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-800">
                          {merchant?.fullName || 'N/A'}
                        </p>
                        <p className="text-sm text-slate-500">
                          {merchant?.cpfCnpj || '-'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {merchant?.type || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(c.status)}</TableCell>
                    <TableCell>
                      {c.riskScore !== undefined ? (
                        <span className={`font-medium ${
                          c.riskScore >= 75 ? 'text-green-600' :
                          c.riskScore >= 40 ? 'text-orange-600' : 'text-red-600'
                        }`}>
                          {c.riskScore}
                        </span>
                      ) : '-'}
                    </TableCell>
                    <TableCell className="text-slate-500 text-sm">
                      {c.created_date ? new Date(c.created_date).toLocaleDateString('pt-BR') : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={createPageUrl('OnboardingCaseDetails') + `?id=${c.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}