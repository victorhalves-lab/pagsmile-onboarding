import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Handshake, Loader2 } from 'lucide-react';
import PartnerDashboardKPIs from '../components/partner-portal/PartnerDashboardKPIs';
import PartnerCasesTable from '../components/partner-portal/PartnerCasesTable';

export default function ComplianceParceiro() {
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['partner-cases', status, search],
    queryFn: async () => {
      const res = await base44.functions.invoke('partnerListMyCases', { status, search, page: 1, pageSize: 200 });
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    refetchOnWindowFocus: false
  });

  const assignments = data?.assignments || [];
  const partners = data?.partners || [];

  return (
    <div className="min-h-screen p-4 lg:p-0">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Handshake className="w-6 h-6 text-[#2bc196]" />
              <h1 className="text-2xl font-bold text-[#002443]">Compliance Parceiro</h1>
            </div>
            <p className="text-sm text-slate-500">
              Casos de clientes Pagsmile atribuídos para a sua análise de compliance.
            </p>
            {partners.length > 0 && (
              <div className="text-xs text-slate-400 mt-1">
                {partners.length === 1 ? (
                  <>Vinculado a: <strong className="text-slate-600">{partners[0].name}</strong></>
                ) : (
                  <>Vinculado a {partners.length} parceiros</>
                )}
              </div>
            )}
          </div>
        </div>

        {/* KPIs */}
        <PartnerDashboardKPIs assignments={assignments} />

        {/* Filters */}
        <Card className="mb-4">
          <CardContent className="p-4 flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                placeholder="Buscar por nome do cliente ou CPF/CNPJ..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Aguardando análise</SelectItem>
                <SelectItem value="viewed">Visualizado</SelectItem>
                <SelectItem value="in_review">Em análise</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="expired">Vencido</SelectItem>
                <SelectItem value="revoked">Revogado</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16 bg-white rounded-lg border border-slate-200">
            <Loader2 className="w-6 h-6 animate-spin text-[#2bc196]" />
          </div>
        ) : error ? (
          <Card>
            <CardContent className="p-8 text-center text-red-600">
              Erro ao carregar: {error.message}
            </CardContent>
          </Card>
        ) : (
          <PartnerCasesTable assignments={assignments} />
        )}
      </div>
    </div>
  );
}