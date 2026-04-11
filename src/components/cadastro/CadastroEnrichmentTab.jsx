import React, { useState } from 'react';
import { Database, Fingerprint, Building2, ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle, Clock, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const STATUS_ICON = {
  'Sucesso': <CheckCircle2 className="w-4 h-4 text-green-600" />,
  'APPROVED': <CheckCircle2 className="w-4 h-4 text-green-600" />,
  'success': <CheckCircle2 className="w-4 h-4 text-green-600" />,
  'Falha': <XCircle className="w-4 h-4 text-red-600" />,
  'REPROVED': <XCircle className="w-4 h-4 text-red-600" />,
  'failed': <XCircle className="w-4 h-4 text-red-600" />,
  'Pendente': <Clock className="w-4 h-4 text-amber-600" />,
  'pending': <Clock className="w-4 h-4 text-amber-600" />,
  'PENDING_REVIEW': <AlertTriangle className="w-4 h-4 text-amber-600" />,
};

function JsonViewer({ data, maxHeight = '300px' }) {
  if (!data) return <span className="text-xs text-[var(--pagsmile-blue)]/40">Sem dados</span>;
  return (
    <pre className="text-[11px] text-[var(--pagsmile-blue)]/70 bg-gray-50 p-3 rounded-lg overflow-auto font-mono" style={{ maxHeight }}>
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function ResultCard({ result, type }) {
  const [expanded, setExpanded] = useState(false);
  const isBDC = type === 'bdc';
  const icon = isBDC ? <Database className="w-4 h-4 text-blue-600" /> : <Fingerprint className="w-4 h-4 text-purple-600" />;
  const bg = isBDC ? 'bg-blue-50' : 'bg-purple-50';
  const status = result.status || result.result_status || 'Pendente';
  const statusIcon = STATUS_ICON[status] || STATUS_ICON['Pendente'];
  const date = new Date(result.timestamp || result.created_date);

  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8">
      <button onClick={() => setExpanded(!expanded)} className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/50 transition-colors rounded-xl">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${bg}`}>{icon}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-[var(--pagsmile-blue)] truncate">{result.validationType || result.service_type || 'Resultado'}</span>
              <div className="flex items-center gap-1">{statusIcon}<span className="text-[10px] text-[var(--pagsmile-blue)]/50">{status}</span></div>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-[var(--pagsmile-blue)]/40 mt-0.5">
              <span>{result.provider || (isBDC ? 'BigDataCorp' : 'CAF')}</span>
              <span>• {date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              {result.responseTime && <span>• {result.responseTime}ms</span>}
              {result.duration_ms && <span>• {result.duration_ms}ms</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {result.score != null && (
            <Badge variant="outline" className="text-[10px]">Score: {result.score}</Badge>
          )}
          {result.similarity != null && (
            <Badge variant="outline" className="text-[10px]">Similaridade: {(result.similarity * 100).toFixed(1)}%</Badge>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-[var(--pagsmile-blue)]/30" /> : <ChevronDown className="w-4 h-4 text-[var(--pagsmile-blue)]/30" />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-[var(--pagsmile-blue)]/5 pt-3 space-y-3">
          {/* Key metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {result.is_alive != null && (
              <div className="p-2 bg-gray-50 rounded-lg">
                <span className="text-[var(--pagsmile-blue)]/50">Liveness: </span>
                <span className={`font-semibold ${result.is_alive ? 'text-green-700' : 'text-red-700'}`}>{result.is_alive ? 'Vivo' : 'Falhou'}</span>
              </div>
            )}
            {result.probability != null && (
              <div className="p-2 bg-gray-50 rounded-lg">
                <span className="text-[var(--pagsmile-blue)]/50">Probabilidade: </span>
                <span className="font-semibold">{(result.probability * 100).toFixed(1)}%</span>
              </div>
            )}
            {result.endpoint && (
              <div className="p-2 bg-gray-50 rounded-lg col-span-2">
                <span className="text-[var(--pagsmile-blue)]/50">Endpoint: </span>
                <span className="font-mono text-[11px]">{result.endpoint}</span>
              </div>
            )}
          </div>

          {/* Red flags */}
          {result.red_flags?.length > 0 && (
            <div className="p-3 bg-red-50 rounded-lg">
              <p className="text-xs font-semibold text-red-700 mb-1">Red Flags ({result.red_flags.length})</p>
              <ul className="space-y-0.5">
                {result.red_flags.map((f, i) => (
                  <li key={i} className="text-[11px] text-red-700/80 flex items-start gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Images */}
          {result.image_urls?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--pagsmile-blue)]/60 mb-2">Imagens Capturadas</p>
              <div className="flex gap-2 flex-wrap">
                {result.image_urls.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden border border-[var(--pagsmile-blue)]/10 hover:border-[var(--pagsmile-green)] transition-colors">
                    <img src={url} alt={`Imagem ${i+1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Raw data */}
          <div>
            <p className="text-xs font-semibold text-[var(--pagsmile-blue)]/60 mb-2 flex items-center gap-1">
              <Eye className="w-3 h-3" /> Dados Completos
            </p>
            <JsonViewer data={result.resultData || result.response_payload} />
          </div>

          {/* Error */}
          {(result.errorMessage || result.error_message) && (
            <div className="p-3 bg-red-50 rounded-lg text-xs text-red-700">
              <span className="font-semibold">Erro: </span>{result.errorMessage || result.error_message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CadastroEnrichmentTab({ validations = [], integrationLogs = [] }) {
  const bdcResults = validations.filter(v => v.provider === 'BigDataCorp');
  const cafResults = [...validations.filter(v => v.provider === 'CAF'), ...integrationLogs.filter(l => l.provider === 'CAF')];
  // Dedupe by id
  const cafMap = new Map();
  cafResults.forEach(r => cafMap.set(r.id, r));
  const uniqueCaf = Array.from(cafMap.values());

  const bdcLogs = integrationLogs.filter(l => l.provider === 'BigDataCorp');
  const allBdc = [...bdcResults, ...bdcLogs];
  const bdcMap = new Map();
  allBdc.forEach(r => bdcMap.set(r.id, r));
  const uniqueBdc = Array.from(bdcMap.values()).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  const sortedCaf = uniqueCaf.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));

  if (!uniqueBdc.length && !sortedCaf.length) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 p-10 text-center mt-4">
        <Database className="w-10 h-10 mx-auto mb-3 text-[var(--pagsmile-blue)]/20" />
        <p className="text-sm text-[var(--pagsmile-blue)]/50">Nenhum resultado de enriquecimento externo encontrado</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-4">
      {/* BDC Section */}
      {uniqueBdc.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)] mb-3 flex items-center gap-2">
            <Database className="w-4 h-4 text-blue-600" />
            BigDataCorp ({uniqueBdc.length} consultas)
          </h3>
          <div className="space-y-2">
            {uniqueBdc.map(r => <ResultCard key={r.id} result={r} type="bdc" />)}
          </div>
        </div>
      )}

      {/* CAF Section */}
      {sortedCaf.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)] mb-3 flex items-center gap-2">
            <Fingerprint className="w-4 h-4 text-purple-600" />
            CAF — Verificação de Identidade ({sortedCaf.length} resultados)
          </h3>
          <div className="space-y-2">
            {sortedCaf.map(r => <ResultCard key={r.id} result={r} type="caf" />)}
          </div>
        </div>
      )}
    </div>
  );
}