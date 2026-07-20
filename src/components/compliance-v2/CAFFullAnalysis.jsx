import React, { useState, useMemo } from 'react';
import { Fingerprint, ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle, Clock, Eye, ScanFace, Camera, FileCheck, Shield, AlertOctagon, HelpCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const SERVICE_META = {
  face_liveness: { label: 'Prova de Vida', icon: ScanFace, desc: 'Confirma que a pessoa na selfie é real (não foto, vídeo ou deepfake). Usa IA para detectar sinais de vida.', what: 'Previne fraude de identidade onde criminosos usam fotos ou vídeos para se passar por outra pessoa.', getResult: r => r.is_alive === true ? { ok: true, text: `Pessoa real confirmada${r.probability ? ` com ${(r.probability * 100).toFixed(0)}% de confiança` : ''}. Não é foto, vídeo ou máscara.` } : r.is_alive === false ? { ok: false, text: 'Prova de vida FALHOU. Pode indicar foto, vídeo gravado ou deepfake.' } : { ok: null, text: 'Resultado pendente.' } },
  face_authentication: { label: 'Correspondência Facial', icon: ScanFace, desc: 'Compara a selfie capturada com a foto do documento para confirmar que é a mesma pessoa.', what: 'Garante que quem está fazendo o onboarding é realmente o titular do documento.', getResult: r => { const sim = r.similarity != null ? (r.similarity * 100).toFixed(0) : null; const ok = ['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status); return ok ? { ok: true, text: `Selfie corresponde ao documento${sim ? ` com ${sim}% de similaridade` : ''}. Identidade confirmada.` } : { ok: false, text: `Selfie NÃO corresponde ao documento${sim ? ` (${sim}% similaridade)` : ''}. Risco de fraude.` }; } },
  facematch: { label: 'Face Match', icon: ScanFace, desc: 'Comparação facial entre selfie e documento.', what: 'Confirma identidade.', getResult: r => { const sim = r.similarity != null ? (r.similarity * 100).toFixed(0) : null; const ok = ['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status); return ok ? { ok: true, text: `Correspondência confirmada${sim ? ` (${sim}%)` : ''}.` } : { ok: false, text: `Divergência facial${sim ? ` (${sim}%)` : ''}.` }; } },
  documentscopy: { label: 'Autenticidade do Documento', icon: FileCheck, desc: 'Análise forense digital do documento para detectar adulterações, montagens ou falsificações.', what: 'Detecta documentos fraudulentos antes que sejam aceitos no processo de onboarding.', getResult: r => ['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status) ? { ok: true, text: 'Sem sinais de adulteração, montagem ou falsificação.' } : { ok: false, text: 'Indícios de adulteração ou falsificação documental detectados.' } },
  deepfake_detection: { label: 'Detecção de Deepfake', icon: Shield, desc: 'IA especializada em detectar manipulação digital por deepfake, face swap ou geração por IA.', what: 'Protege contra ataques sofisticados usando inteligência artificial generativa para fraudes.', getResult: r => ['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status) ? { ok: true, text: 'Nenhum sinal de deepfake, face swap ou manipulação por IA.' } : { ok: false, text: 'ALERTA — detectada manipulação digital (deepfake/face swap).' } },
  document_detector_front: { label: 'Captura Documento (Frente)', icon: Camera, desc: 'Captura e validação da frente do documento de identidade.', what: 'Garante que o documento é legível para extração de dados.', getResult: r => ['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status) ? { ok: true, text: 'Frente capturada com qualidade suficiente.' } : { ok: false, text: 'Captura falhou — documento ilegível ou de baixa qualidade.' } },
  document_detector_back: { label: 'Captura Documento (Verso)', icon: Camera, desc: 'Captura e validação do verso do documento.', what: 'Completa a captura do documento para análise integral.', getResult: r => ['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status) ? { ok: true, text: 'Verso capturado e legível.' } : { ok: false, text: 'Captura do verso falhou.' } },
  ocr_sync: { label: 'Leitura do Documento (OCR)', icon: Eye, desc: 'Extração automática de dados do documento: nome, CPF, data de nascimento.', what: 'Permite comparação automática dos dados do documento com as informações declaradas.', getResult: r => { const d = r.resultData || r.response_payload || {}; const ext = [d.name, d.cpf, d.birthDate].filter(Boolean); return ext.length > 0 ? { ok: true, text: `${ext.length} dados extraídos (${[d.name && 'nome', d.cpf && 'CPF', d.birthDate && 'nascimento'].filter(Boolean).join(', ')}).` } : { ok: null, text: 'Dados não puderam ser extraídos automaticamente.' }; } },
  pep_international: { label: 'PEP Internacional', icon: AlertOctagon, desc: 'Verifica se a pessoa é Politicamente Exposta em bases internacionais.', what: 'PEPs exigem monitoramento reforçado por regulação do Banco Central (Circular 3.978/2020).', getResult: r => { const has = (r.red_flags || []).some(f => f.toLowerCase().includes('pep')); if (has) return { ok: false, text: 'SIM — identificada como PEP. Exige monitoramento reforçado.' }; return ['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status) ? { ok: true, text: 'Não identificada como PEP em bases internacionais.' } : { ok: null, text: 'Verificação em processamento.' }; } },
  sanctions_international: { label: 'Sanções Internacionais', icon: AlertOctagon, desc: 'Busca em listas de sanções OFAC (EUA), UE, ONU e UK Treasury.', what: 'Presença em listas de sanções pode PROIBIR operações financeiras por lei.', getResult: r => { const has = (r.red_flags || []).some(f => f.toLowerCase().includes('sanc') || f.toLowerCase().includes('ofac')); if (has) return { ok: false, text: 'PRESENTE em listas de sanções internacionais.' }; return ['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status) ? { ok: true, text: 'Não consta em OFAC, UE ou ONU.' } : { ok: null, text: 'Em processamento.' }; } },
  warnings_interpol: { label: 'Alertas Interpol', icon: AlertOctagon, desc: 'Consulta bases da Interpol para alertas e mandados internacionais.', what: 'Alerta Interpol representa risco reputacional e regulatório máximo.', getResult: r => { const has = (r.red_flags || []).some(f => f.toLowerCase().includes('interpol')); if (has) return { ok: false, text: 'Alerta encontrado na Interpol.' }; return ['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status) ? { ok: true, text: 'Sem alertas na Interpol.' } : { ok: null, text: 'Em processamento.' }; } },
  official_biometrics: { label: 'Biometria Oficial (Gov)', icon: Shield, desc: 'Compara selfie com bases biométricas oficiais do governo (TSE, CNH, Passaporte).', what: 'Máximo nível de confiança na verificação de identidade — dados governamentais.', getResult: r => ['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status) ? { ok: true, text: 'Selfie corresponde à biometria oficial. Máxima confiança.' } : { ok: false, text: 'Biometria não confirmada por bases oficiais.' } },
  cpf_cross_validation: { label: 'Validação Cruzada CPF', icon: Shield, desc: 'Compara dados do CPF na Receita Federal com documento e selfie.', what: 'Garante consistência entre nome, nascimento e CPF em todas as fontes.', getResult: r => ['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status) ? { ok: true, text: 'Nome, nascimento e CPF conferem entre documento, selfie e RF.' } : { ok: false, text: 'Divergência nos dados do CPF.' } },
  document_liveness: { label: 'Liveness do Documento', icon: FileCheck, desc: 'Verifica se o documento é um original físico (não foto de tela, cópia ou impressão).', what: 'Evita uso de cópias ou documentos fotografados de telas.', getResult: r => ['Sucesso', 'success', 'APPROVED'].includes(r.status || r.result_status) ? { ok: true, text: 'Documento é original físico.' } : { ok: false, text: 'Documento parece ser cópia, foto de tela ou impressão.' } },
  kyb_company_search: { label: 'KYB — Busca Empresa', icon: Shield, desc: 'Dados cadastrais da empresa no CNPJ via bureau CAF.', what: 'Confirma existência e dados básicos da empresa no bureau.', getResult: r => genericResult(r) },
  kyb_business_identity: { label: 'KYB — Identidade Empresarial', icon: Shield, desc: 'Sócios, representantes e estrutura societária via CAF.', what: 'Verifica se o perfil da empresa existe no bureau de identidade.', getResult: r => genericResult(r) },
  kyb_credit_report: { label: 'KYB — Crédito PJ', icon: Shield, desc: 'Score de crédito, protestos, cheques devolvidos e capacidade financeira via CAF.', what: 'Avalia a saúde financeira e capacidade de honrar compromissos.', getResult: r => genericResult(r) },
  pf_credit_profile: { label: 'Credit Profile — PF', icon: Fingerprint, desc: 'Score de crédito e histórico financeiro da pessoa física (sócio/representante).', what: 'Avalia risco de crédito individual do sócio ou representante legal.', getResult: r => genericResult(r) },
  pj_credit_profile: { label: 'Credit Profile — PJ', icon: Fingerprint, desc: 'Score de crédito, probabilidade de inadimplência, limite sugerido e indicadores financeiros da empresa.', what: 'Avalia capacidade financeira da empresa para operar os volumes declarados. Score alto indica baixo risco de inadimplência.', getResult: r => genericResult(r) },
};

function genericResult(r) {
  const s = (r.status || r.result_status || '').toLowerCase();
  if (['sucesso', 'success', 'approved'].includes(s)) return { ok: true, text: 'Verificação concluída com sucesso.' };
  if (['falha', 'failed', 'reproved'].includes(s)) return { ok: false, text: 'Verificação falhou ou foi reprovada.' };
  return { ok: null, text: 'Em processamento ou pendente.' };
}

function ServiceCard({ svcType, record }) {
  const [open, setOpen] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const meta = SERVICE_META[svcType] || { label: svcType.replace(/_/g, ' '), icon: Fingerprint, desc: '', what: '', getResult: genericResult };
  const result = meta.getResult(record);
  const Icon = meta.icon;
  const data = record.resultData || record.response_payload || {};
  const hasData = data && Object.keys(data).length > 0;

  const statusStyle = result.ok === true ? { bg: 'bg-green-50', border: 'border-green-200', color: 'text-green-700', SIcon: CheckCircle2 }
    : result.ok === false ? { bg: 'bg-red-50', border: 'border-red-200', color: 'text-red-700', SIcon: XCircle }
    : { bg: 'bg-amber-50', border: 'border-amber-200', color: 'text-amber-700', SIcon: Clock };

  return (
    <div className={`rounded-xl border-2 ${statusStyle.border} overflow-hidden`}>
      <button onClick={() => setOpen(!open)} className={`w-full flex items-center gap-4 p-4 text-left hover:bg-white/50 transition-colors ${statusStyle.bg}`}>
        <statusStyle.SIcon className={`w-5 h-5 ${statusStyle.color} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-[var(--pinbank-blue)]">{meta.label}</span>
            {record.duration_ms && <span className="text-[10px] text-[var(--pinbank-blue)]/30">{record.duration_ms}ms</span>}
          </div>
          <p className={`text-xs leading-relaxed ${statusStyle.color}`}>{result.text}</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 p-5 space-y-4">
          <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200">
            <p className="text-[10px] font-bold text-purple-700 uppercase tracking-wider mb-1">O Que Este Serviço Faz</p>
            <p className="text-xs text-purple-700/80 leading-relaxed">{meta.desc}</p>
          </div>
          {meta.what && (
            <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-200">
              <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1">Por Que É Importante</p>
              <p className="text-xs text-indigo-700/80 leading-relaxed">{meta.what}</p>
            </div>
          )}

          {/* Biometric & score metrics */}
          {(record.is_alive != null || record.similarity != null || record.probability != null || record.score != null) && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {record.is_alive != null && (
                <div className={`p-3 rounded-xl border ${record.is_alive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <p className="text-[10px] font-bold opacity-60">Prova de Vida</p>
                  <p className={`text-sm font-bold ${record.is_alive ? 'text-green-700' : 'text-red-700'}`}>{record.is_alive ? 'Aprovada ✓' : 'Reprovada ✗'}</p>
                </div>
              )}
              {record.similarity != null && (
                <div className="p-3 rounded-xl border bg-blue-50 border-blue-200">
                  <p className="text-[10px] font-bold opacity-60">Similaridade Facial</p>
                  <p className="text-sm font-bold text-blue-700">{(record.similarity * 100).toFixed(0)}%</p>
                  <div className="h-1.5 bg-blue-100 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${record.similarity * 100}%` }} />
                  </div>
                </div>
              )}
              {record.probability != null && (
                <div className="p-3 rounded-xl border bg-indigo-50 border-indigo-200">
                  <p className="text-[10px] font-bold opacity-60">Probabilidade</p>
                  <p className="text-sm font-bold text-indigo-700">{(record.probability * 100).toFixed(0)}%</p>
                  <div className="h-1.5 bg-indigo-100 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${record.probability * 100}%` }} />
                  </div>
                </div>
              )}
              {record.score != null && (
                <div className="p-3 rounded-xl border bg-emerald-50 border-emerald-200">
                  <p className="text-[10px] font-bold opacity-60">Score</p>
                  <p className="text-sm font-bold text-emerald-700">{record.score}/1000</p>
                  <div className="h-1.5 bg-emerald-100 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(record.score / 1000) * 100}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Red flags */}
          {record.red_flags?.length > 0 && (
            <div className="p-3.5 bg-red-50 rounded-xl border border-red-200">
              <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-2">Sinalizações de Risco</p>
              <ul className="space-y-1">
                {record.red_flags.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-red-700/80"><XCircle className="w-3 h-3 flex-shrink-0 mt-0.5 text-red-500" />{f}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Images */}
          {record.image_urls?.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {record.image_urls.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="w-20 h-20 rounded-lg overflow-hidden border-2 border-slate-200 hover:border-[var(--pinbank-blue)]">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                </a>
              ))}
            </div>
          )}

          {/* Raw JSON */}
          {hasData && (
            <div>
              <button onClick={() => setShowJson(!showJson)} className="text-[10px] text-[var(--pinbank-blue)]/30 hover:text-[var(--pinbank-blue)]/60 flex items-center gap-1">
                <Eye className="w-3 h-3" />{showJson ? 'Ocultar JSON' : 'Ver JSON bruto'}
              </button>
              {showJson && <pre className="mt-2 p-3 bg-slate-900 text-green-300 text-[10px] rounded-lg overflow-auto max-h-[300px] font-mono">{JSON.stringify(data, null, 2)}</pre>}
            </div>
          )}

          {!hasData && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
              <AlertTriangle className="w-5 h-5 mx-auto mb-1.5 text-amber-500" />
              <p className="text-xs font-bold text-amber-700 mb-1">Nenhum dado detalhado retornado</p>
              <p className="text-[11px] text-amber-600/70">O serviço foi consultado mas não retornou payload detalhado. O status acima reflete o resultado da consulta.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function CAFFullAnalysis({ integrationLogs = [], validations = [] }) {
  const allCaf = useMemo(() => {
    const map = new Map();
    [...validations.filter(v => v.provider === 'CAF'), ...integrationLogs.filter(l => l.provider === 'CAF')].forEach(r => map.set(r.id, r));
    return Array.from(map.values());
  }, [validations, integrationLogs]);

  // Latest per service type
  const byType = useMemo(() => {
    const m = {};
    for (const r of allCaf) {
      const svc = r.service_type || r.validationType || 'unknown';
      if (!m[svc] || new Date(r.created_date) > new Date(m[svc].created_date)) m[svc] = r;
    }
    return Object.entries(m).sort((a, b) => {
      const order = Object.keys(SERVICE_META);
      return (order.indexOf(a[0]) === -1 ? 999 : order.indexOf(a[0])) - (order.indexOf(b[0]) === -1 ? 999 : order.indexOf(b[0]));
    });
  }, [allCaf]);

  if (!byType.length) return null;

  const okCount = byType.filter(([t, r]) => { const m = SERVICE_META[t]; const res = m ? m.getResult(r) : genericResult(r); return res.ok === true; }).length;
  const failCount = byType.filter(([t, r]) => { const m = SERVICE_META[t]; const res = m ? m.getResult(r) : genericResult(r); return res.ok === false; }).length;

  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-purple-50/50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-100"><Fingerprint className="w-5 h-5 text-purple-600" /></div>
          <div>
            <h3 className="text-base font-bold text-[var(--pinbank-blue)]">CAF — Verificação de Identidade & Antifraude</h3>
            <p className="text-xs text-[var(--pinbank-blue)]/40 mt-0.5">Cada serviço explicado: o que verifica, resultado, interpretação e impacto</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge className="bg-purple-100 text-purple-700 text-[10px]">{byType.length} verificações</Badge>
            <Badge className="bg-green-100 text-green-700 text-[10px]">{okCount} ok</Badge>
            {failCount > 0 && <Badge className="bg-red-100 text-red-700 text-[10px]">{failCount} falha</Badge>}
          </div>
        </div>
      </div>
      <div className="p-5 space-y-3">
        {byType.map(([svcType, record]) => <ServiceCard key={svcType} svcType={svcType} record={record} />)}
      </div>
    </div>
  );
}