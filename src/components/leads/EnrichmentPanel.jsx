import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import {
  Shield, AlertTriangle, CheckCircle, Globe, Mail, Clock,
  Users, FileSearch, Loader2, RefreshCw, ChevronDown, ChevronRight,
  AlertOctagon, Building2, Scale
} from 'lucide-react';

const RISK_COLORS = {
  OK: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  CRITICAL: 'bg-red-50 text-red-700 border-red-200',
};

const RISK_ICONS = {
  OK: CheckCircle,
  MEDIUM: AlertTriangle,
  HIGH: AlertTriangle,
  CRITICAL: AlertOctagon,
};

function EnrichmentSection({ title, icon: Icon, riskLevel, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const RiskIcon = RISK_ICONS[riskLevel] || CheckCircle;
  const riskColor = RISK_COLORS[riskLevel] || RISK_COLORS.OK;
  
  return (
    <div className="border border-[#e2e8f0] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-[#f8fafc] hover:bg-[#f1f5f9] transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-[#002443]/5 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4 text-[#002443]/60" />
        </div>
        <span className="text-sm font-semibold text-[#002443] flex-1 text-left">{title}</span>
        {riskLevel && (
          <Badge variant="outline" className={`text-[10px] gap-1 ${riskColor}`}>
            <RiskIcon className="w-3 h-3" />
            {riskLevel}
          </Badge>
        )}
        {open ? <ChevronDown className="w-4 h-4 text-[#002443]/30" /> : <ChevronRight className="w-4 h-4 text-[#002443]/30" />}
      </button>
      {open && <div className="px-4 py-3 border-t border-[#e2e8f0] bg-white">{children}</div>}
    </div>
  );
}

function DataRow({ label, value, valueClass }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex items-start justify-between gap-2 py-1.5 border-b border-[#e2e8f0] last:border-0">
      <span className="text-xs text-[#002443]/50">{label}</span>
      <span className={`text-xs font-medium text-[#002443] text-right ${valueClass || ''}`}>
        {typeof value === 'boolean' ? (value ? 'Sim' : 'Não') : String(value)}
      </span>
    </div>
  );
}

export default function EnrichmentPanel({ lead }) {
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const enrichment = lead?.questionnaireData?._enrichment;
  const cnpjEnrichment = lead?.questionnaireData?._cnpjEnrichment;

  const handleRunEnrichment = async () => {
    if (!lead?.id || !lead?.cpfCnpj) return;
    setLoading(true);
    try {
      await base44.functions.invoke('enrichLeadData', {
        leadId: lead.id,
        cnpj: lead.cpfCnpj,
        email: lead.email,
        site: lead.website,
        qsa: cnpjEnrichment?.qsa || []
      });
      // Invalidate any cached lead/leads queries instead of full page reload
      queryClient.invalidateQueries();
    } finally {
      setLoading(false);
    }
  };

  if (!enrichment) {
    return (
      <div className="text-center py-8 space-y-3">
        <FileSearch className="w-10 h-10 mx-auto text-[#002443]/15" />
        <p className="text-sm text-[#002443]/40">Enriquecimento ainda não executado</p>
        <Button onClick={handleRunEnrichment} disabled={loading} variant="outline" className="rounded-xl gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Executar Enriquecimento
        </Button>
      </div>
    );
  }

  const flags = enrichment._consolidatedFlags || [];
  const overallRisk = enrichment._overallRisk || 'OK';

  return (
    <div className="space-y-4">
      {/* Header com risk consolidado */}
      <div className={`rounded-xl p-4 border ${RISK_COLORS[overallRisk]}`}>
        <div className="flex items-center gap-3">
          {React.createElement(RISK_ICONS[overallRisk], { className: 'w-5 h-5' })}
          <div className="flex-1">
            <p className="text-sm font-bold">
              Risco Geral: {overallRisk === 'OK' ? 'Sem flags' : `${flags.length} flag(s) detectada(s)`}
            </p>
            <p className="text-[10px] opacity-70">
              Enriquecido em {new Date(enrichment._enrichedAt).toLocaleString('pt-BR')}
            </p>
          </div>
          <Button onClick={handleRunEnrichment} disabled={loading} variant="ghost" size="sm" className="h-7 gap-1">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Re-executar
          </Button>
        </div>
        {flags.length > 0 && (
          <div className="mt-3 space-y-1">
            {flags.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <AlertTriangle className="w-3 h-3 shrink-0" /> {f}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 1. Sanções CGU */}
      {enrichment.sancoesCGU && !enrichment.sancoesCGU.error && (
        <EnrichmentSection title="Sanções CGU (CEIS/CNEP)" icon={Shield} riskLevel={enrichment.sancoesCGU.riskLevel} defaultOpen={enrichment.sancoesCGU.hasFlags}>
          <div className="space-y-2">
            <DataRow label="CEIS (Empresas Inidôneas)" value={enrichment.sancoesCGU.ceis?.found ? `${enrichment.sancoesCGU.ceis.count} registro(s)` : 'Limpo'} 
              valueClass={enrichment.sancoesCGU.ceis?.found ? 'text-red-600 font-bold' : 'text-emerald-600'} />
            <DataRow label="CNEP (Empresas Punidas)" value={enrichment.sancoesCGU.cnep?.found ? `${enrichment.sancoesCGU.cnep.count} registro(s)` : 'Limpo'} 
              valueClass={enrichment.sancoesCGU.cnep?.found ? 'text-red-600 font-bold' : 'text-emerald-600'} />
            {enrichment.sancoesCGU.ceis?.records?.map((r, i) => (
              <div key={i} className="text-[10px] bg-red-50 rounded-lg p-2 border border-red-100">
                <span className="font-bold">{r.tipo}</span> — Órgão: {r.orgao} | {r.inicio} a {r.fim || 'vigente'}
              </div>
            ))}
          </div>
        </EnrichmentSection>
      )}

      {/* 2. Dados Societários (OpenCNPJ) */}
      {enrichment.openCnpj && !enrichment.openCnpj.error && (
        <EnrichmentSection title="Dados Societários Detalhados" icon={Users} riskLevel="OK">
          <div className="space-y-2">
            <DataRow label="Capital Social" value={enrichment.openCnpj.capitalSocial ? `R$ ${Number(enrichment.openCnpj.capitalSocial).toLocaleString('pt-BR')}` : null} />
            <DataRow label="Porte" value={enrichment.openCnpj.porte} />
            <DataRow label="Natureza Jurídica" value={enrichment.openCnpj.naturezaJuridica} />
            <DataRow label="Simples Nacional" value={enrichment.openCnpj.simplesNacional} />
            <DataRow label="MEI" value={enrichment.openCnpj.mei} />
            {enrichment.openCnpj.socios?.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] font-bold text-[#002443]/50 mb-1">Quadro Societário ({enrichment.openCnpj.socios.length})</p>
                {enrichment.openCnpj.socios.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 border-b border-[#e2e8f0] last:border-0">
                    <div className="w-6 h-6 rounded-full bg-[#002443]/5 flex items-center justify-center text-[8px] font-bold text-[#002443]/40">{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-[#002443] truncate">{s.nome}</p>
                      <p className="text-[10px] text-[#002443]/40">{s.qualificacao} {s.dataEntrada ? `· desde ${s.dataEntrada}` : ''}</p>
                    </div>
                    <span className="text-[10px] text-[#002443]/30">{s.pais}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </EnrichmentSection>
      )}

      {/* 3. DNS MX */}
      {enrichment.dnsMx && !enrichment.dnsMx.error && !enrichment.dnsMx.skipped && (
        <EnrichmentSection title="Validação E-mail (DNS MX)" icon={Mail} riskLevel={enrichment.dnsMx.riskLevel}>
          <div className="space-y-2">
            <DataRow label="Domínio" value={enrichment.dnsMx.domain} />
            <DataRow label="Registros MX" value={enrichment.dnsMx.hasMx ? 'Válidos' : 'Não encontrados'} 
              valueClass={enrichment.dnsMx.hasMx ? 'text-emerald-600' : 'text-red-600 font-bold'} />
            {enrichment.dnsMx.mxRecords?.map((mx, i) => (
              <p key={i} className="text-[10px] text-[#002443]/40 font-mono">{mx}</p>
            ))}
          </div>
        </EnrichmentSection>
      )}

      {/* 4. WHOIS Domínio */}
      {enrichment.whois && !enrichment.whois.error && !enrichment.whois.skipped && (
        <EnrichmentSection title="WHOIS Domínio" icon={Globe} riskLevel={enrichment.whois.riskLevel}>
          <div className="space-y-2">
            <DataRow label="Domínio" value={enrichment.whois.domain} />
            <DataRow label="Data de Registro" value={enrichment.whois.registrationDate ? new Date(enrichment.whois.registrationDate).toLocaleDateString('pt-BR') : 'N/A'} />
            <DataRow label="Idade do Domínio" value={enrichment.whois.domainAgeYears ? `${enrichment.whois.domainAgeYears} anos (${enrichment.whois.domainAgeDays} dias)` : 'N/A'}
              valueClass={enrichment.whois.domainAgeDays < 30 ? 'text-red-600 font-bold' : enrichment.whois.domainAgeDays < 180 ? 'text-amber-600' : 'text-emerald-600'} />
            <DataRow label="Expiração" value={enrichment.whois.expirationDate ? new Date(enrichment.whois.expirationDate).toLocaleDateString('pt-BR') : 'N/A'} />
            <DataRow label="Registrante" value={enrichment.whois.registrantName} />
            {enrichment.whois.nameservers?.length > 0 && (
              <DataRow label="Nameservers" value={enrichment.whois.nameservers.join(', ')} />
            )}
          </div>
        </EnrichmentSection>
      )}

      {/* 6. Trabalho Escravo / CEPIM */}
      {enrichment.trabalhoEscravo && !enrichment.trabalhoEscravo.error && (
        <EnrichmentSection title="Screening Trabalhista (CEPIM)" icon={Scale} riskLevel={enrichment.trabalhoEscravo.riskLevel}>
          <div className="space-y-2">
            <DataRow label="CEPIM (Impedidas)" value={enrichment.trabalhoEscravo.cepim?.found ? `${enrichment.trabalhoEscravo.cepim.count} registro(s)` : 'Limpo'}
              valueClass={enrichment.trabalhoEscravo.cepim?.found ? 'text-red-600 font-bold' : 'text-emerald-600'} />
            {enrichment.trabalhoEscravo.note && (
              <p className="text-[10px] text-[#002443]/40 italic">{enrichment.trabalhoEscravo.note}</p>
            )}
          </div>
        </EnrichmentSection>
      )}

      {/* 7. OFAC / ONU */}
      {enrichment.ofacOnu && !enrichment.ofacOnu.error && !enrichment.ofacOnu.skipped && (
        <EnrichmentSection title="Screening OFAC / ONU" icon={AlertOctagon} riskLevel={enrichment.ofacOnu.riskLevel} defaultOpen={enrichment.ofacOnu.hasFlags}>
          <div className="space-y-2">
            <DataRow label="Sócios analisados" value={enrichment.ofacOnu.sociosScreened} />
            {enrichment.ofacOnu.results?.map((r, i) => (
              <div key={i} className="bg-[#f8fafc] rounded-lg p-2 border border-[#e2e8f0]">
                <p className="text-xs font-medium text-[#002443]">{r.nome}</p>
                <div className="flex gap-3 mt-1">
                  <span className={`text-[10px] ${r.checks.paisSancionado ? 'text-red-600 font-bold' : 'text-emerald-600'}`}>
                    País: {r.checks.pais} {r.checks.paisSancionado ? '⚠️ SANCIONADO' : '✓'}
                  </span>
                  {r.checks.ofac?.searched && (
                    <span className={`text-[10px] ${r.checks.ofac.matchCount > 0 ? 'text-red-600 font-bold' : 'text-emerald-600'}`}>
                      OFAC: {r.checks.ofac.matchCount > 0 ? `${r.checks.ofac.matchCount} match(es)` : 'Limpo'}
                    </span>
                  )}
                </div>
                {r.checks.ofac?.topMatches?.map((m, j) => (
                  <p key={j} className="text-[10px] text-red-500 mt-1">
                    Match: {m.name} (score: {m.score}) — {m.program}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </EnrichmentSection>
      )}
    </div>
  );
}