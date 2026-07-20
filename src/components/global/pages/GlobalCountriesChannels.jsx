import React, { useState, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Upload, Search, Filter, Globe2, AlertTriangle, CheckCircle2, Trash2, Database, RefreshCw, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Tela admin do catálogo Global de canais por país. Permite importar XLSX,
 * filtrar canais, ver detalhes e marcar como ativo/inativo.
 */
export default function GlobalCountriesChannels() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [usageFilter, setUsageFilter] = useState('all');
  const [importing, setImporting] = useState(false);
  const [seedingFees, setSeedingFees] = useState(false);
  const [seedingFull, setSeedingFull] = useState(false);
  const fileInputRef = useRef(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['globalCountryChannels'],
    queryFn: () => base44.entities.GlobalCountryChannel.list('-created_date', 2000),
    initialData: [],
  });

  const { data: fees = [] } = useQuery({
    queryKey: ['globalCountryFees'],
    queryFn: () => base44.entities.GlobalCountryFee.list('-created_date', 200),
    initialData: [],
  });

  const countries = useMemo(() => {
    const set = new Map();
    items.forEach(i => set.set(i.country, i.country_name));
    return Array.from(set.entries()).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return items.filter(c => {
      if (countryFilter !== 'all' && c.country !== countryFilter) return false;
      if (methodFilter !== 'all' && c.method_category !== methodFilter) return false;
      if (usageFilter !== 'all' && c.usage_status !== usageFilter) return false;
      if (!s) return true;
      return [c.provider, c.payment_method, c.collection_points, c.country_name]
        .some(v => (v || '').toLowerCase().includes(s));
    });
  }, [items, search, countryFilter, methodFilter, usageFilter]);

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const upload = await base44.integrations.Core.UploadFile({ file });
      const replace = confirm('Substituir TODOS os canais existentes? (Cancelar = apenas adicionar)');
      const res = await base44.functions.invoke('importGlobalChannelsXlsx', {
        file_url: upload.file_url,
        replace_existing: replace,
      });
      if (res.data?.success) {
        toast.success(`${res.data.inserted} canais importados!`);
        qc.invalidateQueries({ queryKey: ['globalCountryChannels'] });
      } else {
        toast.error(res.data?.error || 'Erro na importação');
      }
    } catch (err) {
      toast.error(err.message || 'Falha no upload');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSeedFullCatalog = async () => {
    if (!confirm('Isto vai SUBSTITUIR todos os canais e impostos pelo catálogo completo (PDF Roblox + XLSX consolidados, sem Brasil). Continuar?')) return;
    setSeedingFull(true);
    try {
      const res = await base44.functions.invoke('seedGlobalCatalogComplete', {});
      if (res.data?.success) {
        toast.success(`Catálogo carregado: ${res.data.channels_inserted} canais + ${res.data.fees_inserted} impostos em ${res.data.countries_covered?.length || 0} países.`);
        qc.invalidateQueries({ queryKey: ['globalCountryChannels'] });
        qc.invalidateQueries({ queryKey: ['globalCountryFees'] });
      } else toast.error(res.data?.error || 'Erro');
    } finally { setSeedingFull(false); }
  };

  const handleSeedFees = async () => {
    setSeedingFees(true);
    try {
      const res = await base44.functions.invoke('seedGlobalCountryFees', {});
      if (res.data?.success) {
        toast.success(`${res.data.inserted} impostos catalogados.`);
        qc.invalidateQueries({ queryKey: ['globalCountryFees'] });
      } else toast.error(res.data?.error || 'Erro');
    } finally { setSeedingFees(false); }
  };

  const deleteM = useMutation({
    mutationFn: (id) => base44.entities.GlobalCountryChannel.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['globalCountryChannels'] }); toast.success('Canal removido'); },
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 shadow-sm p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#1356E2]/10">
              <Database className="w-5 h-5 text-[#1356E2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0A0A0A]">Catálogo de Canais por País</h2>
              <p className="text-xs text-[#0A0A0A]/60 mt-0.5">
                {items.length} canais · {countries.length} países · {fees.length} regras de imposto
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImport} />
            <Button variant="outline" size="sm" onClick={handleSeedFullCatalog} disabled={seedingFull} className="gap-1.5 border-[#1356E2] text-[#1356E2] hover:bg-[#1356E2]/10">
              <Sparkles className={`w-4 h-4 ${seedingFull ? 'animate-pulse' : ''}`} />
              Carregar Catálogo Completo
            </Button>
            <Button variant="outline" size="sm" onClick={handleSeedFees} disabled={seedingFees} className="gap-1.5">
              <RefreshCw className={`w-4 h-4 ${seedingFees ? 'animate-spin' : ''}`} />
              Atualizar Impostos
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} disabled={importing} className="gap-1.5">
              <Upload className={`w-4 h-4 ${importing ? 'animate-pulse' : ''}`} />
              {importing ? 'Importando...' : 'Importar XLSX'}
            </Button>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 text-[#0A0A0A]/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input placeholder="Provider, método, banco, loja..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-10" />
        </div>
        <Select value={countryFilter} onValueChange={setCountryFilter}>
          <SelectTrigger className="w-44 h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos países</SelectItem>
            {countries.map(([code, name]) => <SelectItem key={code} value={code}>{name} ({code})</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={methodFilter} onValueChange={setMethodFilter}>
          <SelectTrigger className="w-44 h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos métodos</SelectItem>
            <SelectItem value="cards">Cards</SelectItem>
            <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
            <SelectItem value="qr_code">QR Code</SelectItem>
            <SelectItem value="wallet">Wallet</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={usageFilter} onValueChange={setUsageFilter}>
          <SelectTrigger className="w-36 h-10"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="PRIMARY">PRIMARY</SelectItem>
            <SelectItem value="BACK UP">BACK UP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#f4f4f4] text-[#0A0A0A]/70 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">País</th>
              <th className="text-left px-4 py-3">Provider</th>
              <th className="text-left px-4 py-3">Método</th>
              <th className="text-left px-4 py-3">Pontos de Coleta</th>
              <th className="text-center px-4 py-3">Status</th>
              <th className="text-center px-4 py-3">HR</th>
              <th className="text-center px-4 py-3">Onboarding</th>
              <th className="text-right px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#0A0A0A]/5">
            {filtered.map(c => (
              <tr key={c.id} className="hover:bg-[#f4f4f4]/40">
                <td className="px-4 py-3">
                  <div className="font-mono text-xs text-[#0A0A0A]/60">{c.country}</div>
                  <div className="text-xs font-medium text-[#0A0A0A]">{c.country_name}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-[#0A0A0A]">{c.provider}</div>
                  <div className="text-[10px] text-[#0A0A0A]/50">{c.integration_type}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-[#0A0A0A]">{c.payment_method}</div>
                  <div className="text-[10px] text-[#1356E2] uppercase">{c.method_category}</div>
                </td>
                <td className="px-4 py-3 max-w-[280px]">
                  <div className="text-xs text-[#0A0A0A]/70 truncate" title={c.collection_points}>{c.collection_points || '—'}</div>
                  {c.transaction_limits && <div className="text-[10px] text-[#0A0A0A]/50 mt-0.5 truncate">{c.transaction_limits}</div>}
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge className={c.usage_status === 'PRIMARY' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>
                    {c.usage_status}
                  </Badge>
                  <div className="text-[10px] text-[#0A0A0A]/50 mt-1">{c.operational_status}</div>
                </td>
                <td className="px-4 py-3 text-center">
                  {(c.allowed_hr_industries || []).length > 0 ? (
                    <div className="text-[10px] text-amber-700">{c.allowed_hr_industries.length}</div>
                  ) : <span className="text-[#0A0A0A]/30">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  {c.requires_onboarding
                    ? <Badge className="bg-blue-100 text-blue-700 text-[9px]">{c.onboarding_type}</Badge>
                    : <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mx-auto" />
                  }
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="icon" variant="ghost" onClick={() => {
                    if (confirm(`Remover canal ${c.provider} (${c.country})?`)) deleteM.mutate(c.id);
                  }}>
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </Button>
                </td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-[#0A0A0A]/50">
                <Globe2 className="w-8 h-8 mx-auto mb-2 text-[#0A0A0A]/30" />
                {items.length === 0 ? 'Nenhum canal cadastrado. Importe o XLSX para começar.' : 'Nenhum canal corresponde aos filtros.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Aviso de configuração */}
      {items.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-semibold text-amber-900">Catálogo vazio</div>
            <div className="text-amber-800 mt-1">
              Importe a planilha <strong>GLOBAL PAYMENTS PUBLIC VERSION.xlsx</strong> para popular o catálogo.
              Em seguida, clique em <strong>Atualizar Impostos</strong> para registrar VAT/IOF/GMF por país.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}