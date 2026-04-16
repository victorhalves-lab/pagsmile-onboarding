import React, { useMemo } from 'react';
import { Users, Shield, AlertTriangle, CheckCircle2, Building2, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

function maskCpf(cpf) {
  if (!cpf || cpf.length < 6) return cpf || '—';
  return `•••.•••.${cpf.slice(-6, -2)}-${cpf.slice(-2)}`;
}

function SocioCard({ socio, index }) {
  const nome = socio.nome || socio.name || socio.Nome || '—';
  const cpfCnpj = socio.cpf || socio.cnpj || socio.CPF || socio.CNPJ || socio.documento || '';
  const qualificacao = socio.qualificacao || socio.qualification || socio.Qualificacao || socio.cargo || '';
  const participacao = socio.participacao || socio.percentual || socio.share || socio['%'] || null;
  const desde = socio.dataEntrada || socio.data_entrada || socio.since || '';
  const isPep = socio.pep === true || socio.is_pep === true;
  const hasSancoes = socio.sancoes === true || socio.sanctions === true;
  const hasProcessos = (socio.processos || socio.lawsuits || 0) > 0;
  const otherCompanies = socio.outras_empresas || socio.other_companies || socio.empresas_vinculadas || 0;

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
          <UserCheck className="w-5 h-5 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h4 className="text-sm font-bold text-[var(--pagsmile-blue)]">{nome}</h4>
            {isPep && <Badge className="bg-red-100 text-red-700 text-[9px] border-0">PEP</Badge>}
            {hasSancoes && <Badge className="bg-red-100 text-red-700 text-[9px] border-0">Sancionado</Badge>}
            {hasProcessos && <Badge className="bg-amber-100 text-amber-700 text-[9px] border-0">{socio.processos || socio.lawsuits} processos</Badge>}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
            <div>
              <span className="text-[var(--pagsmile-blue)]/40">CPF/CNPJ</span>
              <p className="font-medium text-[var(--pagsmile-blue)]">{maskCpf(cpfCnpj)}</p>
            </div>
            {participacao != null && (
              <div>
                <span className="text-[var(--pagsmile-blue)]/40">Participação</span>
                <p className="font-bold text-[var(--pagsmile-blue)]">{participacao}%</p>
              </div>
            )}
            {qualificacao && (
              <div>
                <span className="text-[var(--pagsmile-blue)]/40">Qualificação</span>
                <p className="font-medium text-[var(--pagsmile-blue)]">{qualificacao}</p>
              </div>
            )}
            {desde && (
              <div>
                <span className="text-[var(--pagsmile-blue)]/40">Desde</span>
                <p className="font-medium text-[var(--pagsmile-blue)]">{desde}</p>
              </div>
            )}
          </div>

          {/* Verification checks */}
          <div className="flex flex-wrap gap-2 mt-2">
            <VerifBadge label="PEP" ok={!isPep} />
            <VerifBadge label="Sanções" ok={!hasSancoes} />
            <VerifBadge label="Processos" ok={!hasProcessos} />
            {otherCompanies > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-[var(--pagsmile-blue)]/50 px-2 py-0.5 rounded bg-slate-50 border border-slate-100">
                <Building2 className="w-3 h-3" />{otherCompanies} empresas vinculadas
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function VerifBadge({ label, ok }) {
  return (
    <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border ${ok ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      {label}: {ok ? 'Limpo' : 'Alerta'}
    </span>
  );
}

export default function BDCQSAPanel({ integrationLogs = [], validations = [] }) {
  const qsaData = useMemo(() => {
    const records = [...validations.filter(v => v.provider === 'BigDataCorp'), ...integrationLogs.filter(l => l.provider === 'BigDataCorp')];
    const ownersRecord = records.find(r => (r.service_type || r.validationType || '').includes('owners_kyc'));
    if (!ownersRecord) return null;
    const data = ownersRecord.resultData || ownersRecord.response_payload || {};
    // Try to find socios array in various paths
    const socios = data.socios || data.partners || data.owners || data.qsa ||
      (data.Result && Array.isArray(data.Result) ? data.Result : null) ||
      (Array.isArray(data) ? data : null);
    if (!socios || !Array.isArray(socios) || socios.length === 0) return null;
    return { socios, record: ownersRecord };
  }, [integrationLogs, validations]);

  if (!qsaData) return null;

  const { socios } = qsaData;
  const singleOwner = socios.length === 1;
  const pepCount = socios.filter(s => s.pep === true || s.is_pep === true).length;

  return (
    <div className="bg-white rounded-xl border border-[var(--pagsmile-blue)]/8 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-100"><Users className="w-5 h-5 text-indigo-600" /></div>
          <div>
            <h3 className="text-sm font-bold text-[var(--pagsmile-blue)]">Quadro Societário (QSA) — {socios.length} sócio(s)</h3>
            <p className="text-[10px] text-[var(--pagsmile-blue)]/40">Dados confirmados pela Receita Federal via Big Data Corp</p>
          </div>
          <div className="ml-auto flex gap-2">
            {singleOwner && <Badge className="bg-amber-100 text-amber-700 text-[9px] border-0">Sócio Único — Risco de concentração</Badge>}
            {pepCount > 0 && <Badge className="bg-red-100 text-red-700 text-[9px] border-0">{pepCount} PEP(s)</Badge>}
          </div>
        </div>
      </div>
      <div className="p-5 space-y-3">
        {socios.map((s, i) => <SocioCard key={i} socio={s} index={i} />)}
        {singleOwner && (
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-700/80 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
            <span>Empresa com sócio único (100%). Risco de concentração: não há separação entre patrimônio pessoal e empresarial.</span>
          </div>
        )}
      </div>
    </div>
  );
}