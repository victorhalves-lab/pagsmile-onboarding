import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Search as SearchIcon, AlertCircle } from 'lucide-react';

import BdcLookupSearchBar from '@/components/bdc-lookup/BdcLookupSearchBar';
import BdcLookupHeader from '@/components/bdc-lookup/BdcLookupHeader';
import BdcLookupTabs from '@/components/bdc-lookup/BdcLookupTabs';
import BdcLookupHistory from '@/components/bdc-lookup/BdcLookupHistory';

export default function BdcLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [response, setResponse] = useState(null);
  const [historyKey, setHistoryKey] = useState(0); // força reload do histórico após consulta

  const handleSearch = async ({ document, mode }) => {
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const res = await base44.functions.invoke('bdcLookupQuery', { document, mode });
      if (res?.data?.success) {
        setResponse(res.data);
        setHistoryKey(k => k + 1);
        toast.success(`Consulta concluída: ${res.data.datasetsOk?.length || 0} datasets retornados`);
      } else {
        const msg = res?.data?.error || 'Falha ao consultar BDC';
        setError(msg);
        toast.error(msg);
      }
    } catch (e) {
      const msg = e?.response?.data?.error || e?.message || 'Erro na consulta';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#0A0A0A] flex items-center gap-2">
            <SearchIcon className="w-6 h-6 text-[#1356E2]" />
            BDC Lookup
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pesquisa rápida de CNPJ/CPF na BigDataCorp. Todas as consultas são auditadas (LGPD).
          </p>
        </div>
      </div>

      {/* Search */}
      <BdcLookupSearchBar onSearch={handleSearch} loading={loading} />

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
          <div>
            <p className="font-semibold text-sm text-red-900">Erro na consulta</p>
            <p className="text-xs text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Result */}
      {response && response.result && (
        <>
          <BdcLookupHeader
            result={response.result}
            docType={response.docType}
            elapsedMs={response.elapsedMs}
            datasetsOk={response.datasetsOk}
            datasetsError={response.datasetsError}
          />
          <BdcLookupTabs
            result={response.result}
            docType={response.docType}
            status={response.status}
            queryId={response.queryId}
          />
        </>
      )}

      {/* Empty result (no errors but BDC returned no data) */}
      {response && !response.result && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <AlertCircle className="w-6 h-6 text-amber-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-amber-900">Nenhum dado encontrado</p>
          <p className="text-xs text-amber-700 mt-1">A BDC respondeu mas não retornou dados para este documento.</p>
        </div>
      )}

      {/* History (always visible) */}
      <BdcLookupHistory key={historyKey} />
    </div>
  );
}