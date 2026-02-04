import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Eye, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

export default function OnboardingDashboard() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [activeTab, setActiveTab] = React.useState('all');

  const { data: cases = [], isLoading, refetch } = useQuery({
    queryKey: ['onboarding-cases'],
    queryFn: async () => {
      return await base44.entities.OnboardingCase.list('-created_date', 100);
    }
  });

  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants'],
    queryFn: async () => {
      return await base44.entities.Merchant.list();
    }
  });

  const merchantsMap = React.useMemo(() => {
    const map = {};
    merchants.forEach(m => map[m.id] = m);
    return map;
  }, [merchants]);

  const getStatusBadge = (status) => {
    const variants = {
      'Pendente': { variant: 'secondary', icon: Clock, text: 'Pendente' },
      'Em Análise': { variant: 'default', icon: RefreshCw, text: 'Em Análise' },
      'Aprovado': { variant: 'default', icon: CheckCircle, text: 'Aprovado', color: 'bg-green-100 text-green-800' },
      'Manual': { variant: 'default', icon: AlertCircle, text: 'Revisão Manual', color: 'bg-yellow-100 text-yellow-800' },
      'Recusado': { variant: 'destructive', icon: XCircle, text: 'Recusado' }
    };
    
    const config = variants[status] || variants['Pendente'];
    const Icon = config.icon;
    
    return (
      <Badge className={config.color || ''}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  const filteredCases = React.useMemo(() => {
    let filtered = cases;

    if (activeTab !== 'all') {
      filtered = filtered.filter(c => c.status === activeTab);
    }

    if (searchTerm) {
      filtered = filtered.filter(c => {
        const merchant = merchantsMap[c.merchantId];
        return (
          merchant?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          merchant?.cpfCnpj?.includes(searchTerm) ||
          merchant?.email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    return filtered;
  }, [cases, activeTab, searchTerm, merchantsMap]);

  const stats = React.useMemo(() => {
    return {
      total: cases.length,
      pending: cases.filter(c => c.status === 'Pendente').length,
      inAnalysis: cases.filter(c => c.status === 'Em Análise').length,
      manual: cases.filter(c => c.status === 'Manual').length,
      approved: cases.filter(c => c.status === 'Aprovado').length,
      rejected: cases.filter(c => c.status === 'Recusado').length
    };
  }, [cases]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin text-[var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard de Onboarding</h1>
            <p className="text-slate-600 mt-1">Gerencie e monitore todos os casos de onboarding</p>
          </div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
            <div className="text-sm text-slate-600">Total</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-2xl font-bold text-slate-600">{stats.pending}</div>
            <div className="text-sm text-slate-600">Pendentes</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-2xl font-bold text-blue-600">{stats.inAnalysis}</div>
            <div className="text-sm text-slate-600">Em Análise</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-2xl font-bold text-yellow-600">{stats.manual}</div>
            <div className="text-sm text-slate-600">Rev. Manual</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-slate-600">Aprovados</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-slate-200">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-slate-600">Recusados</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar por nome, CPF/CNPJ ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">Todos ({stats.total})</TabsTrigger>
          <TabsTrigger value="Pendente">Pendentes ({stats.pending})</TabsTrigger>
          <TabsTrigger value="Em Análise">Em Análise ({stats.inAnalysis})</TabsTrigger>
          <TabsTrigger value="Manual">Revisão Manual ({stats.manual})</TabsTrigger>
          <TabsTrigger value="Aprovado">Aprovados ({stats.approved})</TabsTrigger>
          <TabsTrigger value="Recusado">Recusados ({stats.rejected})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Merchant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      CPF/CNPJ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Score IA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredCases.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                        Nenhum caso encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredCases.map((onboardingCase) => {
                      const merchant = merchantsMap[onboardingCase.merchantId];
                      return (
                        <tr key={onboardingCase.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-900">{merchant?.fullName || 'N/A'}</div>
                            <div className="text-sm text-slate-500">{merchant?.email}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {merchant?.cpfCnpj || 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline">{merchant?.type || 'N/A'}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(onboardingCase.status)}
                          </td>
                          <td className="px-6 py-4">
                            {onboardingCase.riskScore ? (
                              <div className="flex items-center gap-2">
                                <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${
                                      onboardingCase.riskScore >= 75 ? 'bg-green-500' :
                                      onboardingCase.riskScore >= 40 ? 'bg-yellow-500' :
                                      'bg-red-500'
                                    }`}
                                    style={{ width: `${onboardingCase.riskScore}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{onboardingCase.riskScore}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-700">
                            {new Date(onboardingCase.created_date).toLocaleDateString('pt-BR')}
                          </td>
                          <td className="px-6 py-4">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => navigate(createPageUrl('OnboardingCaseDetails') + `?id=${onboardingCase.id}`)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Detalhes
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}