import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { Search, Building2, User, ChevronRight, Filter, Users, Shield, FileCheck, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const STATUS_CONFIG = {
  'Pendente': { color: 'bg-gray-100 text-gray-700', label: 'Pendente' },
  'Em Análise': { color: 'bg-blue-100 text-blue-700', label: 'Em Análise' },
  'Aprovado': { color: 'bg-green-100 text-green-700', label: 'Aprovado' },
  'Manual': { color: 'bg-amber-100 text-amber-700', label: 'Revisão Manual' },
  'Recusado': { color: 'bg-red-100 text-red-700', label: 'Recusado' },
};

function formatDoc(doc) {
  if (!doc) return '—';
  if (doc.length === 14) return doc.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  if (doc.length === 11) return doc.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  return doc;
}

export default function Cadastro() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: merchants = [], isLoading: loadingMerchants } = useQuery({
    queryKey: ['cadastro-merchants'],
    queryFn: () => base44.entities.Merchant.list('-created_date', 200),
  });

  const { data: cases = [] } = useQuery({
    queryKey: ['cadastro-cases'],
    queryFn: () => base44.entities.OnboardingCase.list('-created_date', 500),
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['cadastro-leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 500),
  });

  // Separate sellers and subsellers
  const sellers = useMemo(() => merchants.filter(m => !m.isSubseller), [merchants]);
  const subsellers = useMemo(() => merchants.filter(m => m.isSubseller), [merchants]);

  // Count subsellers per seller
  const subsellerCountMap = useMemo(() => {
    const map = {};
    subsellers.forEach(s => {
      if (s.parentMerchantId) {
        map[s.parentMerchantId] = (map[s.parentMerchantId] || 0) + 1;
      }
    });
    return map;
  }, [subsellers]);

  // Map merchant to its latest case
  const caseMap = useMemo(() => {
    const map = {};
    cases.forEach(c => {
      if (!map[c.merchantId] || new Date(c.created_date) > new Date(map[c.merchantId].created_date)) {
        map[c.merchantId] = c;
      }
    });
    return map;
  }, [cases]);

  // Map merchant to lead (via case -> merchantId matching lead's onboardingCaseId or cpfCnpj)
  const leadMap = useMemo(() => {
    const map = {};
    leads.forEach(l => {
      if (l.onboardingCaseId) {
        const c = cases.find(c => c.id === l.onboardingCaseId);
        if (c) map[c.merchantId] = l;
      }
      if (l.cpfCnpj) {
        const m = merchants.find(m => m.cpfCnpj === l.cpfCnpj);
        if (m) map[m.id] = l;
      }
    });
    return map;
  }, [leads, cases, merchants]);

  // Filter sellers
  const filtered = useMemo(() => {
    return sellers.filter(m => {
      const q = search.toLowerCase();
      const matchSearch = !q || 
        (m.fullName || '').toLowerCase().includes(q) ||
        (m.companyName || '').toLowerCase().includes(q) ||
        (m.cpfCnpj || '').includes(q) ||
        (m.email || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || m.onboardingStatus === statusFilter;
      const matchType = typeFilter === 'all' || m.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [sellers, search, statusFilter, typeFilter]);

  if (loadingMerchants) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--pagsmile-blue)]">Cadastro de Clientes</h1>
        <p className="text-sm text-[var(--pagsmile-blue)]/60 mt-1">Visão unificada de todos os sellers e subsellers</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Sellers" value={sellers.length} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={Users} label="Subsellers" value={subsellers.length} color="text-purple-600" bg="bg-purple-50" />
        <StatCard icon={Shield} label="Aprovados" value={sellers.filter(s => s.onboardingStatus === 'Aprovado').length} color="text-green-600" bg="bg-green-50" />
        <StatCard icon={AlertTriangle} label="Pendentes" value={sellers.filter(s => ['Pendente', 'Em Análise', 'Manual'].includes(s.onboardingStatus)).length} color="text-amber-600" bg="bg-amber-50" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pagsmile-blue)]/40" />
          <Input
            placeholder="Buscar por nome, CNPJ, e-mail..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="Aprovado">Aprovado</SelectItem>
            <SelectItem value="Manual">Revisão Manual</SelectItem>
            <SelectItem value="Pendente">Pendente</SelectItem>
            <SelectItem value="Em Análise">Em Análise</SelectItem>
            <SelectItem value="Recusado">Recusado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">PF e PJ</SelectItem>
            <SelectItem value="PJ">PJ</SelectItem>
            <SelectItem value="PF">PF</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-[var(--pagsmile-blue)]/50">
            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum seller encontrado</p>
          </div>
        )}
        {filtered.map(m => {
          const sc = STATUS_CONFIG[m.onboardingStatus] || STATUS_CONFIG['Pendente'];
          const subCount = subsellerCountMap[m.id] || 0;
          const oCase = caseMap[m.id];
          const lead = leadMap[m.id];
          return (
            <Link
              key={m.id}
              to={`/CadastroDetalhe?id=${m.id}`}
              className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 hover:border-[var(--pagsmile-green)]/40 hover:shadow-md transition-all group"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${m.type === 'PJ' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                {m.type === 'PJ' ? <Building2 className="w-5 h-5 text-blue-600" /> : <User className="w-5 h-5 text-purple-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[var(--pagsmile-blue)] truncate">
                    {m.companyName || m.fullName}
                  </span>
                  <Badge variant="outline" className="text-[10px] shrink-0">{m.type}</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--pagsmile-blue)]/50 mt-0.5">
                  <span>{formatDoc(m.cpfCnpj)}</span>
                  {m.email && <span className="hidden sm:inline">• {m.email}</span>}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {subCount > 0 && (
                  <div className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                    <Users className="w-3 h-3" />
                    <span>{subCount}</span>
                  </div>
                )}
                {oCase?.riskScore != null && (
                  <div className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    oCase.riskScore <= 40 ? 'bg-green-50 text-green-700' :
                    oCase.riskScore <= 70 ? 'bg-amber-50 text-amber-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    Score {oCase.riskScore}
                  </div>
                )}
                <Badge className={`${sc.color} text-[10px]`}>{sc.label}</Badge>
                <ChevronRight className="w-4 h-4 text-[var(--pagsmile-blue)]/20 group-hover:text-[var(--pagsmile-green)] transition-colors" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-4 flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-[var(--pagsmile-blue)]">{value}</p>
        <p className="text-xs text-[var(--pagsmile-blue)]/50">{label}</p>
      </div>
    </div>
  );
}