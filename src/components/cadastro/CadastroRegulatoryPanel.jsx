import React from 'react';
import { Shield, CheckCircle2, XCircle, AlertTriangle, Scale, Users, FileText, Fingerprint } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * CadastroRegulatoryPanel — Painel de conformidade regulatória
 * Mostra checklist de requisitos regulatórios BC 475, 3988, 96, 3978
 * + Organograma societário + Documentoscopia x Biometria
 */

function CheckItem({ label, description, status, detail }) {
  const config = {
    ok: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', badge: 'bg-green-100 text-green-700', label: 'Conforme' },
    warning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700', label: 'Atenção' },
    fail: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700', label: 'Pendente' },
    na: { icon: Shield, color: 'text-gray-400', bg: 'bg-gray-50', badge: 'bg-gray-100 text-gray-600', label: 'N/A' },
  };
  const c = config[status] || config.na;
  const Icon = c.icon;

  return (
    <div className={`rounded-xl border border-[var(--pinbank-blue)]/8 p-4 ${c.bg}`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-5 h-5 ${c.color} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--pinbank-blue)]">{label}</span>
            <Badge className={`text-[10px] ${c.badge}`}>{c.label}</Badge>
          </div>
          <p className="text-xs text-[var(--pinbank-blue)]/60 mt-0.5">{description}</p>
          {detail && <p className="text-xs text-[var(--pinbank-blue)]/80 mt-1 font-medium">{detail}</p>}
        </div>
      </div>
    </div>
  );
}

function OwnershipChart({ validations = [] }) {
  // Extract QSA/Relationships from BDC raw data
  const bdcResult = validations.find(v => v.provider === 'BigDataCorp' && v.status === 'Sucesso');
  const rawData = bdcResult?.resultData || {};
  const rels = rawData?.Relationships || rawData?.relationships;
  
  let owners = [];
  let totalParticipation = 0;
  
  if (rels) {
    const entries = rels?.Relationships || (Array.isArray(rels) ? rels : []);
    if (Array.isArray(entries)) {
      owners = entries.map(e => ({
        name: e.RelatedEntityName || e.Name || 'N/I',
        doc: e.RelatedEntityTaxIdNumber || e.TaxIdNumber || '',
        role: e.RelationshipName || e.Qualification || e.Role || '',
        participation: parseFloat(e.Participation || e.SharePercentage || 0),
      }));
      totalParticipation = owners.reduce((s, o) => s + (o.participation || 0), 0);
    }
  }

  const is100 = Math.abs(totalParticipation - 100) < 0.5;
  
  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-5">
      <h3 className="text-sm font-semibold text-[var(--pinbank-blue)] mb-3 flex items-center gap-2">
        <Users className="w-4 h-4 text-purple-600" />
        Organograma Societário — Beneficiários Finais
        <Badge className={`text-[10px] ${is100 ? 'bg-green-100 text-green-700' : totalParticipation > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'}`}>
          {totalParticipation > 0 ? `${totalParticipation.toFixed(1)}% mapeado` : 'Sem dados'}
        </Badge>
      </h3>
      {owners.length > 0 ? (
        <div className="space-y-2">
          {owners.map((o, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[var(--pinbank-blue)] truncate">{o.name}</p>
                <p className="text-[10px] text-[var(--pinbank-blue)]/50">{o.role} {o.doc ? `• ${o.doc}` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-[var(--pinbank-blue)] rounded-full" style={{ width: `${Math.min(o.participation, 100)}%` }} />
                </div>
                <span className="text-xs font-bold text-[var(--pinbank-blue)] w-12 text-right">{o.participation ? `${o.participation.toFixed(1)}%` : '—'}</span>
              </div>
            </div>
          ))}
          {!is100 && totalParticipation > 0 && (
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs text-amber-700">
                <AlertTriangle className="w-3 h-3 inline mr-1" />
                Participação total: {totalParticipation.toFixed(1)}% — diferença de {Math.abs(100 - totalParticipation).toFixed(1)}% em relação aos 100% obrigatórios para identificação de beneficiários finais.
              </p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-xs text-[var(--pinbank-blue)]/40 text-center py-4">
          Dados de QSA não disponíveis. Execute o enriquecimento BDC para carregar a estrutura societária.
        </p>
      )}
    </div>
  );
}

function BiometryPanel({ validations = [], integrationLogs = [], faceMatchThreshold = 50 }) {
  // Match by internal service_type/validationType (English keys used throughout the system)
  const isLivenessType = (s = '') => /liveness|face_authentication|facematch/i.test(s);
  const isDocFrontType = (s = '') => /document.*front|doc.*front|frente/i.test(s);
  const isDocBackType = (s = '') => /document.*back|doc.*back|verso/i.test(s);

  const allRecords = [...validations, ...integrationLogs];
  const findRec = (fn) => allRecords.find(r => r.provider === 'CAF' && fn(r.validationType || r.service_type || ''));

  const cafLiveness = findRec(isLivenessType);
  const cafDocFront = findRec(isDocFrontType);
  const cafDocBack = findRec(isDocBackType);
  
  // Read from resultData (ExternalValidationResult) or response_payload (IntegrationLog)
  const livenessData = cafLiveness?.resultData || cafLiveness?.response_payload || {};
  const isAlive = livenessData.isAlive ?? cafLiveness?.is_alive;
  const isMatch = livenessData.isMatch;
  const similarity = livenessData.similarity ?? cafLiveness?.similarity;
  const similarityPct = similarity != null ? (similarity * 100).toFixed(1) : null;

  const docFrontData = cafDocFront?.resultData || cafDocFront?.response_payload || {};
  const docBackData = cafDocBack?.resultData || cafDocBack?.response_payload || {};
  const docFrontValid = docFrontData.isCaptureValid ?? (cafDocFront?.status === 'Sucesso' || cafDocFront?.status === 'success' ? true : cafDocFront?.status === 'Falha' ? false : undefined);
  const docBackValid = docBackData.isCaptureValid ?? (cafDocBack?.status === 'Sucesso' || cafDocBack?.status === 'success' ? true : cafDocBack?.status === 'Falha' ? false : undefined);

  const matchAboveThreshold = similarityPct != null ? parseFloat(similarityPct) >= faceMatchThreshold : isMatch;

  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-5">
      <h3 className="text-sm font-semibold text-[var(--pinbank-blue)] mb-3 flex items-center gap-2">
        <Fingerprint className="w-4 h-4 text-purple-600" />
        Documentoscopia × Biometria
        <Badge variant="outline" className="text-[10px]">Threshold: {faceMatchThreshold}%</Badge>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <CheckItem
          label="Prova de Vida (Liveness)"
          description="Verificação CAF de que a pessoa é real"
          status={isAlive === true ? 'ok' : isAlive === false ? 'fail' : 'na'}
          detail={isAlive === true ? 'Pessoa viva confirmada' : isAlive === false ? 'Falhou — possível deepfake/foto' : 'Aguardando verificação'}
        />
        <CheckItem
          label="Face Match (Similaridade)"
          description={`Comparação facial doc × selfie (min ${faceMatchThreshold}%)`}
          status={matchAboveThreshold === true ? 'ok' : matchAboveThreshold === false ? 'fail' : 'na'}
          detail={similarityPct ? `Similaridade: ${similarityPct}% ${parseFloat(similarityPct) >= faceMatchThreshold ? '✓' : `< ${faceMatchThreshold}% ✗`}` : (isMatch === true ? 'Match confirmado' : isMatch === false ? 'Não correspondeu' : 'Aguardando verificação')}
        />
        <CheckItem
          label="Documento Frente"
          description="Captura e validação do documento (frente)"
          status={docFrontValid === true ? 'ok' : docFrontValid === false ? 'fail' : 'na'}
          detail={docFrontValid === true ? 'Captura válida' : docFrontValid === false ? 'Captura inválida' : 'Aguardando envio'}
        />
        <CheckItem
          label="Documento Verso"
          description="Captura e validação do documento (verso)"
          status={docBackValid === true ? 'ok' : docBackValid === false ? 'fail' : 'na'}
          detail={docBackValid === true ? 'Captura válida' : docBackValid === false ? 'Captura inválida' : 'Aguardando envio'}
        />
      </div>
    </div>
  );
}

export default function CadastroRegulatoryPanel({ merchant, latestCase, validations = [], integrationLogs = [], score, faceMatchThreshold = 50 }) {
  // === Determine regulatory compliance statuses ===
  
  // BC 3988: RF irregularities
  const rfCheck = (() => {
    const bdcResult = validations.find(v => v.provider === 'BigDataCorp' && v.status === 'Sucesso');
    if (!bdcResult) return { status: 'na', detail: 'Enriquecimento BDC não realizado' };
    const bd = bdcResult.resultData?.BasicData || bdcResult.resultData?.basic_data;
    const first = Array.isArray(bd) ? bd[0] : bd;
    const taxStatus = first?.TaxIdStatus || first?.TaxIdStatusDescription || '';
    if (String(taxStatus).toUpperCase().includes('ATIV') || String(taxStatus).toUpperCase().includes('REGULAR')) {
      return { status: 'ok', detail: `Situação: ${taxStatus}` };
    }
    return { status: 'fail', detail: `Situação: ${taxStatus || 'Não verificada'} — Impedimento BC 3988` };
  })();

  // BC 475 Protege+: consulta prévia
  const protegeCheck = (() => {
    if (!latestCase?.bigDataCorpCompleted) return { status: 'fail', detail: 'Consulta BDC não realizada antes da abertura' };
    return { status: 'ok', detail: 'Consulta BDC realizada — situação cadastral verificada' };
  })();

  // BC 3978: motivos de rejeição explícitos
  const rejectionCheck = (() => {
    if (!latestCase || latestCase.status !== 'Recusado') return { status: 'na', detail: 'Caso não recusado' };
    const hasBlockReasons = latestCase.bloqueiosAtivos?.length > 0;
    const hasRedFlags = latestCase.redFlags?.length > 0;
    if (hasBlockReasons || hasRedFlags) {
      return { status: 'ok', detail: `${(latestCase.bloqueiosAtivos?.length || 0)} bloqueio(s) + ${(latestCase.redFlags?.length || 0)} flag(s) registrados` };
    }
    return { status: 'warning', detail: 'Motivos de rejeição não explicitados — verificar e-mail enviado ao cliente' };
  })();

  // BC 96: via do contrato disponibilizada
  const contractCheck = (() => {
    if (!latestCase || latestCase.status !== 'Aprovado') return { status: 'na', detail: 'Caso não aprovado' };
    return { status: 'warning', detail: 'Verificar se via do contrato foi disponibilizada ao cliente (Art.6 §1)' };
  })();

  // Organograma: 100% participação
  const bdcResult = validations.find(v => v.provider === 'BigDataCorp' && v.status === 'Sucesso');
  const rawData = bdcResult?.resultData || {};
  const rels = rawData?.Relationships || rawData?.relationships;
  const orgCheck = (() => {
    if (!rels) return { status: 'na', detail: 'Dados QSA não disponíveis' };
    const entries = rels?.Relationships || (Array.isArray(rels) ? rels : []);
    let total = 0;
    if (Array.isArray(entries)) {
      entries.forEach(e => { total += parseFloat(e.Participation || e.SharePercentage || 0); });
    }
    if (Math.abs(total - 100) < 0.5) return { status: 'ok', detail: `Participação total: ${total.toFixed(1)}% — 100% mapeado` };
    if (total > 0) return { status: 'warning', detail: `Participação total: ${total.toFixed(1)}% — diferença de ${Math.abs(100 - total).toFixed(1)}%` };
    return { status: 'warning', detail: 'Percentuais de participação não informados pela RF/BDC' };
  })();

  return (
    <div className="space-y-4 mt-4">
      <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-5">
        <h3 className="text-sm font-semibold text-[var(--pinbank-blue)] mb-4 flex items-center gap-2">
          <Scale className="w-4 h-4 text-[var(--pinbank-blue)]" />
          Checklist Regulatório
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <CheckItem
            label="BC 475 — Protege+"
            description="Consulta obrigatória que antecede abertura de conta (Dez/2025)"
            status={protegeCheck.status}
            detail={protegeCheck.detail}
          />
          <CheckItem
            label="BC 3988 — Irregularidades RF"
            description="Impedir PF/PJ com irregularidades graves na Receita Federal"
            status={rfCheck.status}
            detail={rfCheck.detail}
          />
          <CheckItem
            label="BC 3978 — Motivos de Rejeição"
            description="Motivos da decisão devem ser explicitados ao titular"
            status={rejectionCheck.status}
            detail={rejectionCheck.detail}
          />
          <CheckItem
            label="BC 96 — Via do Contrato"
            description="Disponibilizar via do contrato por meio eletrônico"
            status={contractCheck.status}
            detail={contractCheck.detail}
          />
          <CheckItem
            label="Organograma 100%"
            description="Beneficiários finais com 100% de participação mapeada"
            status={orgCheck.status}
            detail={orgCheck.detail}
          />
        </div>
      </div>

      {/* Ownership Chart */}
      <OwnershipChart validations={validations} />

      {/* Biometry Panel */}
      <BiometryPanel validations={validations} integrationLogs={integrationLogs} faceMatchThreshold={faceMatchThreshold} />
    </div>
  );
}