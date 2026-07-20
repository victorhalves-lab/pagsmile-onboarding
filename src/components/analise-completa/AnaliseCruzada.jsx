import React from 'react';
import { GitBranch, CheckCircle2, XCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * Cross-analysis between CAF identity verification and BDC data enrichment.
 * Shows concordances and discrepancies in business language.
 */

export default function AnaliseCruzada({ merchant, cafValidations, cafLogs, bdcValidations, bdcLogs, responses }) {
  const allCaf = [...cafValidations, ...cafLogs];
  const allBdc = [...bdcValidations, ...bdcLogs];

  // Extract key data points from CAF
  const cafData = extractCafData(allCaf);
  // Extract key data points from BDC
  const bdcData = extractBdcData(allBdc);
  // Merchant declared data
  const declared = {
    name: merchant?.fullName || '',
    cpfCnpj: merchant?.cpfCnpj || '',
    email: merchant?.email || '',
    phone: merchant?.phone || '',
    companyName: merchant?.companyName || '',
  };

  // Build cross-check items
  const checks = [];

  // 1. Identity verified?
  const identityVerified = allCaf.some(r => 
    ['face_liveness', 'liveness'].includes(r.service_type) && 
    ['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status)
  );
  checks.push({
    label: 'Identidade Verificada (Prova de Vida)',
    source1: 'CAF Liveness',
    source2: '—',
    status: identityVerified ? 'ok' : allCaf.length > 0 ? 'fail' : 'pending',
    detail: identityVerified 
      ? 'A prova de vida foi aprovada pela CAF. A pessoa confirmou ser real e presente durante a verificação.' 
      : allCaf.length > 0 
      ? 'A prova de vida não foi aprovada. Pode indicar uso de foto, vídeo ou deepfake.' 
      : 'A verificação de identidade ainda não foi realizada.',
  });

  // 2. Face match
  const faceMatched = allCaf.some(r => 
    ['face_authentication', 'facematch'].includes(r.service_type) && 
    ['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status)
  );
  if (allCaf.some(r => ['face_authentication', 'facematch'].includes(r.service_type))) {
    checks.push({
      label: 'Correspondência Facial (Selfie vs Documento)',
      source1: 'CAF FaceMatch',
      source2: '—',
      status: faceMatched ? 'ok' : 'fail',
      detail: faceMatched 
        ? 'O rosto na selfie corresponde ao rosto do documento. Alta confiança na identidade.' 
        : 'A selfie NÃO corresponde ao documento. Risco de fraude de identidade.',
    });
  }

  // 3. Document authenticity
  const docApproved = allCaf.some(r => 
    ['documentscopy'].includes(r.service_type) && 
    ['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status)
  );
  if (allCaf.some(r => r.service_type === 'documentscopy')) {
    checks.push({
      label: 'Autenticidade do Documento (Documentoscopia)',
      source1: 'CAF Documentoscopy',
      source2: '—',
      status: docApproved ? 'ok' : 'fail',
      detail: docApproved 
        ? 'A análise forense digital não encontrou evidências de adulteração no documento.' 
        : 'Foram identificados indícios de adulteração ou falsificação no documento apresentado.',
    });
  }

  // 4. CPF name match (CAF OCR vs BDC vs Declared)
  if (cafData.ocrName && declared.name) {
    const namesMatch = normalizeStr(cafData.ocrName).includes(normalizeStr(declared.name).substring(0, 10)) ||
                       normalizeStr(declared.name).includes(normalizeStr(cafData.ocrName).substring(0, 10));
    checks.push({
      label: 'Nome: Documento OCR vs Declarado',
      source1: `CAF OCR: "${cafData.ocrName}"`,
      source2: `Declarado: "${declared.name}"`,
      status: namesMatch ? 'ok' : 'attention',
      detail: namesMatch 
        ? 'O nome extraído do documento por OCR corresponde ao nome declarado no cadastro.' 
        : 'Divergência detectada entre o nome no documento (via OCR) e o nome declarado. Verificar se é variação de grafia ou se há inconsistência real.',
    });
  }

  // 5. CPF status (BDC)
  const bdcCpfOk = allBdc.some(r => {
    const data = r.resultData || r.response_payload || {};
    return data.situacaoCPF === 'REGULAR' || data.statusCPF === 'REGULAR';
  });
  if (allBdc.length > 0 && merchant?.type === 'PF') {
    checks.push({
      label: 'Situação do CPF na Receita Federal',
      source1: 'BDC KYC',
      source2: '—',
      status: bdcCpfOk ? 'ok' : 'attention',
      detail: bdcCpfOk 
        ? 'O CPF está REGULAR na Receita Federal. Sem pendências cadastrais.' 
        : 'Não foi possível confirmar que o CPF está regular. Verificar se há restrições ou irregularidades.',
    });
  }

  // 6. CNPJ status
  if (merchant?.type === 'PJ') {
    const cnpjOk = allBdc.some(r => {
      const data = r.resultData || r.response_payload || {};
      const situation = data.situacaoCadastral || data.status || '';
      return situation.toUpperCase().includes('ATIV');
    });
    checks.push({
      label: 'Situação Cadastral do CNPJ',
      source1: 'BDC / Receita Federal',
      source2: '—',
      status: cnpjOk ? 'ok' : allBdc.length > 0 ? 'attention' : 'pending',
      detail: cnpjOk 
        ? 'O CNPJ está com situação ATIVA na Receita Federal.' 
        : 'Não foi possível confirmar que o CNPJ está ativo. Verificar se a empresa está inapta, suspensa ou baixada.',
    });
  }

  // 7. PEP / Sanctions
  const hasPepFlag = allCaf.some(r => (r.red_flags || []).some(f => f.toLowerCase().includes('pep')));
  const hasSanctionFlag = allCaf.some(r => (r.red_flags || []).some(f => f.toLowerCase().includes('sanc') || f.toLowerCase().includes('ofac')));
  
  checks.push({
    label: 'PEP & Sanções Internacionais',
    source1: 'CAF Screening',
    source2: 'BDC KYC',
    status: hasPepFlag || hasSanctionFlag ? 'fail' : 'ok',
    detail: hasPepFlag && hasSanctionFlag 
      ? 'ALERTA: Identificada como PEP e presente em listas de sanções internacionais. Risco regulatório máximo.' 
      : hasPepFlag 
      ? 'Identificada como Pessoa Politicamente Exposta (PEP). Exige monitoramento reforçado conforme regulamentação BACEN.' 
      : hasSanctionFlag 
      ? 'Presente em listas de sanções internacionais. Operações financeiras podem estar proibidas.' 
      : 'Sem identificação como PEP ou em listas de sanções. Perfil de compliance favorável neste quesito.',
  });

  if (checks.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50">
            <GitBranch className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[var(--pinbank-blue)]">Análise Cruzada — CAF × BDC × Dados Declarados</h2>
            <p className="text-xs text-[var(--pinbank-blue)]/40">Cruzamento de dados entre diferentes fontes para identificar concordâncias e divergências</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-3">
        {checks.map((check, i) => {
          const StatusIcon = check.status === 'ok' ? CheckCircle2 : check.status === 'fail' ? XCircle : check.status === 'attention' ? AlertTriangle : AlertTriangle;
          const statusColor = check.status === 'ok' ? 'text-green-600' : check.status === 'fail' ? 'text-red-600' : 'text-amber-600';
          const statusBg = check.status === 'ok' ? 'bg-green-50 border-green-200' : check.status === 'fail' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200';
          const statusLabel = check.status === 'ok' ? 'Conforme' : check.status === 'fail' ? 'Divergência' : check.status === 'attention' ? 'Atenção' : 'Pendente';
          
          return (
            <div key={i} className={`p-4 rounded-xl border ${statusBg}`}>
              <div className="flex items-start gap-3">
                <StatusIcon className={`w-5 h-5 ${statusColor} flex-shrink-0 mt-0.5`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-[var(--pinbank-blue)]">{check.label}</span>
                    <Badge className={`text-[10px] ${check.status === 'ok' ? 'bg-green-100 text-green-700' : check.status === 'fail' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                      {statusLabel}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--pinbank-blue)]/40 mb-2">
                    <span>{check.source1}</span>
                    {check.source2 !== '—' && <><ArrowRight className="w-3 h-3" /><span>{check.source2}</span></>}
                  </div>
                  <p className={`text-xs leading-relaxed ${statusColor} opacity-80`}>{check.detail}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function extractCafData(records) {
  const data = { ocrName: '', ocrCpf: '', ocrBirth: '', ocrMotherName: '' };
  for (const r of records) {
    const rd = r.resultData || r.response_payload || {};
    if (rd.name && !data.ocrName) data.ocrName = rd.name;
    if (rd.cpf && !data.ocrCpf) data.ocrCpf = rd.cpf;
    if (rd.birthDate && !data.ocrBirth) data.ocrBirth = rd.birthDate;
    if (rd.motherName && !data.ocrMotherName) data.ocrMotherName = rd.motherName;
  }
  return data;
}

function extractBdcData(records) {
  const data = {};
  for (const r of records) {
    const rd = r.resultData || r.response_payload || {};
    Object.assign(data, rd);
  }
  return data;
}

function normalizeStr(s) {
  return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}