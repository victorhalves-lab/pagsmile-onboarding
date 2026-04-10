import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Loader2, Search, RefreshCw, CheckCircle2, XCircle, Building2, User,
  TrendingUp, TrendingDown, Minus, AlertTriangle, Shield
} from 'lucide-react';
import { toast } from 'sonner';

export default function RevalidationSinglePanel({ onComplete }) {
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [result, setResult] = useState(null);

  const { data: cases = [], isLoading: loadingCases } = useQuery({
    queryKey: ['onboarding-cases-for-reval'],
    queryFn: () => base44.entities.OnboardingCase.list('-created_date', 500),
  });

  const { data: merchants = [] } = useQuery({
    queryKey: ['merchants-for-reval'],
    queryFn: () => base44.entities.Merchant.list('-created_date', 500),
  });

  const merchantMap = useMemo(() => {
    const m = {};
    merchants.forEach(mer => { m[mer.id] = mer; });
    return m;
  }, [merchants]);

  // Filter cases with merchants
  const casesWithMerchants = useMemo(() => {
    return cases
      .filter(c => c.merchantId && merchantMap[c.merchantId])
      .map(c => ({
        ...c,
        merchant: merchantMap[c.merchantId],
      }));
  }, [cases, merchantMap]);

  const filteredCases = useMemo(() => {
    if (!searchTerm) return casesWithMerchants;
    const q = searchTerm.toLowerCase();
    return casesWithMerchants.filter(c =>
      c.merchant?.fullName?.toLowerCase().includes(q) ||
      c.merchant?.cpfCnpj?.includes(q) ||
      c.merchant?.companyName?.toLowerCase().includes(q)
    );
  }, [casesWithMerchants, searchTerm]);

  const revalidateMutation = useMutation({
    mutationFn: async (caseId) => {
      const res = await base44.functions.invoke('revalidateBdc', { caseId });
      return res.data;
    },
    onSuccess: (data) => {
      setResult(data.result);
      if (data.result?.status === 'success') {
        toast.success(`Revalidação concluída: Score ${data.result.oldScore} → ${data.result.newScore}`);
        onComplete?.();
      } else {
        toast.error('Erro: ' + (data.result?.error || 'Falha desconhecida'));
      }
    },
    onError: (err) => toast.error('Erro: ' + err.message),
  });

  const selectedCase = casesWithMerchants.find(c => c.id === selectedCaseId);

  const getSubfaixaColor = (sf) => {
    const colors = {
      '1A': 'bg-green-100 text-green-700',
      '1B': 'bg-green-50 text-green-600',
      '2A': 'bg-blue-100 text-blue-700',
      '2B': 'bg-blue-50 text-blue-600',
      '3A': 'bg-amber-100 text-amber-700',
      '3B': 'bg-orange-100 text-orange-700',
      '4': 'bg-red-100 text-red-700',
      '5': 'bg-red-200 text-red-800',
    };
    return colors[sf] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="space-y-5">
      {/* Search & Select */}
      <div className="bg-white rounded-2xl border border-[#002443]/8 p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-blue-50">
            <Search className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#002443]">Revalidação Unitária</h3>
            <p className="text-xs text-[#002443]/50">Selecione um cliente para consultar a BDC e recalcular o score</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#002443]/40" />
            <Input
              placeholder="Buscar por nome, CNPJ/CPF..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="max-h-60 overflow-y-auto border rounded-xl divide-y">
            {loadingCases ? (
              <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-[#2bc196]" /></div>
            ) : filteredCases.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#002443]/40">Nenhum case encontrado</div>
            ) : (
              filteredCases.slice(0, 30).map(c => {
                const isSelected = selectedCaseId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => { setSelectedCaseId(c.id); setResult(null); }}
                    className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                      isSelected ? 'bg-[#2bc196]/10 border-l-2 border-l-[#2bc196]' : 'hover:bg-[#f4f4f4]'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg ${c.merchant?.type === 'PF' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                      {c.merchant?.type === 'PF' 
                        ? <User className="w-3.5 h-3.5 text-blue-600" /> 
                        : <Building2 className="w-3.5 h-3.5 text-purple-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#002443] truncate">{c.merchant?.fullName}</p>
                      <p className="text-[10px] text-[#002443]/50">{c.merchant?.cpfCnpj} • {c.status}</p>
                    </div>
                    {c.riskScoreV4 != null && (
                      <div className="text-right">
                        <p className="text-xs font-mono font-bold text-[#002443]">{c.riskScoreV4}</p>
                        {c.subfaixa && <Badge className={`${getSubfaixaColor(c.subfaixa)} text-[10px] border-0`}>{c.subfaixa}</Badge>}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Selected case info */}
        {selectedCase && (
          <div className="mt-4 p-4 rounded-xl bg-[#f4f4f4] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#002443]">{selectedCase.merchant?.fullName}</p>
                <p className="text-xs text-[#002443]/50">{selectedCase.merchant?.cpfCnpj} • {selectedCase.merchant?.type}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#002443]/50">Score Atual</p>
                <p className="text-lg font-bold text-[#002443]">{selectedCase.riskScoreV4 ?? 'N/A'}</p>
                {selectedCase.subfaixa && (
                  <Badge className={`${getSubfaixaColor(selectedCase.subfaixa)} text-xs border-0`}>
                    {selectedCase.subfaixaNome || selectedCase.subfaixa}
                  </Badge>
                )}
              </div>
            </div>

            <Button
              onClick={() => revalidateMutation.mutate(selectedCaseId)}
              disabled={revalidateMutation.isPending}
              className="w-full bg-[#2bc196] hover:bg-[#2bc196]/90 text-white h-11 rounded-xl"
            >
              {revalidateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Consultando BDC...</>
              ) : (
                <><RefreshCw className="w-4 h-4 mr-2" /> Revalidar este Cliente</>
              )}
            </Button>
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className={`bg-white rounded-2xl border p-5 ${
          result.alert === 'CRITICAL' ? 'border-red-300' : result.alert === 'WARNING' ? 'border-amber-300' : 'border-[#002443]/8'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            {result.status === 'success' ? (
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            ) : (
              <XCircle className="w-6 h-6 text-red-500" />
            )}
            <div>
              <h3 className="text-sm font-bold text-[#002443]">
                {result.status === 'success' ? 'Revalidação Concluída' : 'Erro na Revalidação'}
              </h3>
              {result.error && <p className="text-xs text-red-600">{result.error}</p>}
            </div>
          </div>

          {result.status === 'success' && (
            <div className="space-y-4">
              {/* Score comparison */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 rounded-xl bg-[#f4f4f4]">
                  <p className="text-[10px] text-[#002443]/50 uppercase tracking-wide">Score Anterior</p>
                  <p className="text-2xl font-bold text-[#002443]">{result.oldScore ?? 'N/A'}</p>
                  {result.oldSubfaixa && <Badge className={`${getSubfaixaColor(result.oldSubfaixa)} text-xs border-0 mt-1`}>{result.oldSubfaixa}</Badge>}
                </div>
                <div className="flex flex-col items-center justify-center">
                  {result.scoreDelta > 0 ? (
                    <TrendingUp className="w-8 h-8 text-red-500" />
                  ) : result.scoreDelta < 0 ? (
                    <TrendingDown className="w-8 h-8 text-green-500" />
                  ) : (
                    <Minus className="w-8 h-8 text-slate-400" />
                  )}
                  <span className={`text-sm font-mono font-bold mt-1 ${
                    result.scoreDelta > 0 ? 'text-red-600' : result.scoreDelta < 0 ? 'text-green-600' : 'text-slate-500'
                  }`}>
                    {result.scoreDelta >= 0 ? '+' : ''}{result.scoreDelta}
                  </span>
                </div>
                <div className="text-center p-3 rounded-xl bg-[#f4f4f4]">
                  <p className="text-[10px] text-[#002443]/50 uppercase tracking-wide">Score Novo</p>
                  <p className="text-2xl font-bold text-[#002443]">{result.newScore ?? 'N/A'}</p>
                  {result.newSubfaixa && <Badge className={`${getSubfaixaColor(result.newSubfaixa)} text-xs border-0 mt-1`}>{result.newSubfaixa}</Badge>}
                </div>
              </div>

              {/* Alerts */}
              {result.alert === 'CRITICAL' && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-red-800"><strong>Alerta Crítico:</strong> O score piorou mais de 50 pontos. Recomenda-se revisão manual imediata.</p>
                </div>
              )}
              {result.alert === 'WARNING' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800"><strong>Atenção:</strong> O score piorou mais de 20 pontos. Recomenda-se acompanhamento.</p>
                </div>
              )}
              {result.subfaixaChanged && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2">
                  <Shield className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-800"><strong>Mudança de Subfaixa:</strong> O cliente mudou de {result.oldSubfaixa} para {result.newSubfaixa}.</p>
                </div>
              )}
              {!result.alert && !result.subfaixaChanged && (
                <div className="p-3 rounded-xl bg-green-50 border border-green-200 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-green-800">Nenhuma alteração significativa detectada. O perfil de risco permanece estável.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}