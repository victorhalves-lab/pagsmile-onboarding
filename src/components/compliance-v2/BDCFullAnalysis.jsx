import React, { useState, useMemo } from 'react';
import { Database, ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle, HelpCircle, Eye, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const DATASET_META = {
  empresas_basic_data: { label: 'Dados Cadastrais Básicos', desc: 'Razão social, CNPJ, situação na Receita Federal, data de abertura, porte, capital social, natureza jurídica, CNAEs principal e secundários.', what: 'Confirma se a empresa existe legalmente, está ativa e seus dados cadastrais estão atualizados.' },
  empresas_kyc: { label: 'KYC Empresa (Básico)', desc: 'Verificação rápida de conformidade empresarial com checagens de PEP, sanções e protestos.', what: 'Triagem inicial de riscos regulatórios.' },
  empresas_kyc_real: { label: 'KYC Empresa (Completo)', desc: 'Verificação completa incluindo PEPs, sanções (CEIS/CNEP/OFAC), processos judiciais, dívida ativa da União, protestos, Reclame Aqui.', what: 'Análise aprofundada de compliance: cruza dados com dezenas de bases públicas e privadas para identificar riscos regulatórios, judiciais e reputacionais.' },
  empresas_owners_kyc: { label: 'KYC dos Sócios (QSA)', desc: 'Análise individual de cada sócio: CPF, participação, PEP, sanções, processos, vínculos com outras empresas.', what: 'Verifica a idoneidade de cada sócio/administrador. Identifica PEPs, sancionados, ou vínculos com empresas problemáticas.' },
  empresas_relationships: { label: 'Relacionamentos Empresariais', desc: 'Participações societárias cruzadas, grupo econômico, empresas coligadas e controladas.', what: 'Mapeia o grupo econômico para identificar riscos ocultos em empresas relacionadas.' },
  empresas_phones: { label: 'Telefones da Empresa', desc: 'Telefones associados ao CNPJ em diferentes bases de dados.', what: 'Confirma se os canais de contato são reais e ativos.' },
  empresas_emails: { label: 'E-mails da Empresa', desc: 'E-mails associados ao CNPJ em cadastros públicos e privados.', what: 'Verifica se a empresa usa e-mails corporativos ou provedores anônimos/suspeitos.' },
  empresas_addresses: { label: 'Endereços Registrados', desc: 'Endereços registrados na Receita Federal e outras bases.', what: 'Confirma o endereço declarado e identifica mudanças recentes ou endereços virtuais.' },
  empresas_activity_indicators: { label: 'Indicadores de Atividade', desc: 'Notas fiscais emitidas, licitações, importação/exportação, movimentação fiscal.', what: 'Verifica se a empresa tem atividade real ou se é uma "shell company" sem operação.' },
  empresas_domains: { label: 'Domínios Web', desc: 'Sites e domínios registrados pela empresa.', what: 'Confirma presença digital e verifica se tem website ativo compatível com a atividade declarada.' },
  empresas_mcc: { label: 'MCC (Código de Categoria)', desc: 'Código de categoria do estabelecimento comercial atribuído pela indústria.', what: 'Verifica se o MCC atribuído é compatível com a atividade declarada no questionário.' },
  empresas_basic_enrichment: { label: 'Enriquecimento Básico', desc: 'Faturamento estimado, número de funcionários, segmento de mercado.', what: 'Cruza dados de faturamento e porte com os valores declarados para identificar discrepâncias.' },
  pessoas_kyc: { label: 'KYC Pessoa Física', desc: 'CPF, situação na Receita, óbito, PEP, sanções, processos, protestos do representante legal.', what: 'Verifica a identidade e idoneidade do representante legal ou sócio principal.' },
  // ── PF Datasets (Subseller) ──
  basic_data: { label: 'Dados Cadastrais PF', desc: 'CPF, nome, data de nascimento, nome da mãe, situação na Receita Federal, gênero.', what: 'Base da verificação de identidade: confirma que a pessoa existe e que o CPF está regular.' },
  kyc: { label: 'KYC Pessoa Física', desc: 'PEP (Pessoa Politicamente Exposta), sanções internacionais (OFAC, UE, ONU), listas restritivas brasileiras.', what: 'Detecta se a pessoa é PEP ou está em listas de sanções — obrigatório pela Circular BCB 3.978/2020.' },
  processes: { label: 'Processos Judiciais PF', desc: 'Processos cíveis, criminais, trabalhistas em todas as instâncias e tribunais do Brasil.', what: 'Identifica histórico litigioso: processos criminais são sinalizados como risco CRÍTICO para operação financeira.' },
  collections: { label: 'Cobranças e Protestos PF', desc: 'Protestos em cartórios, cobranças registradas, inadimplência pública.', what: 'Revela histórico de inadimplência: protestos indicam risco de calote e dificuldade de recuperação de crédito.' },
  government_debtors: { label: 'Dívida Ativa PF', desc: 'Inscrição em dívida ativa da União (Procuradoria-Geral da Fazenda Nacional).', what: 'Pessoa com dívida ativa tem restrições legais e indica risco financeiro elevado.' },
  first_level_family_kyc: { label: 'KYC Familiar (1º Grau)', desc: 'Verificação de PEP e sanções em familiares de primeiro nível (cônjuge, pais, filhos).', what: 'PEP por extensão: familiares de PEPs também exigem monitoramento reforçado (BCB 3.978 Art.14§2).' },
  social_assistance: { label: 'Programas Sociais', desc: 'Bolsa Família, BPC (Benefício de Prestação Continuada), e outros programas do CadÚnico.', what: 'Beneficiário de programas sociais declarando alto TPV é incompatível — indica possível fraude ou laranja.' },
  electoral_donors: { label: 'Doações Eleitorais PF', desc: 'Histórico de doações a campanhas eleitorais (TSE).', what: 'Doações altas indicam vínculos políticos — pode exigir monitoramento como pessoa exposta.' },
  public_servants: { label: 'Servidor Público', desc: 'Vínculo funcional com órgãos públicos federais, estaduais e municipais.', what: 'Servidor público pode ter vedação legal para atividade empresarial (Lei 8.112/1990 Art. 117).' },
  presumed_income: { label: 'Renda Presumida', desc: 'Estimativa de renda mensal baseada em dados cadastrais, patrimônio e movimentação.', what: 'Cross-check: confronta renda presumida vs TPV declarado. Diferenças grandes indicam risco de lavagem.' },
  financial_interests: { label: 'Interesses Financeiros', desc: 'Participações em fundos, investimentos, seguros, previdência, consórcios.', what: 'Zero interesses financeiros em pessoa que opera pagamentos indica perfil incompatível com a atividade.' },
  scr_positive_score: { label: 'SCR Score Positivo (BCB)', desc: 'Score de crédito do Sistema de Informações de Crédito do Banco Central — padrão ouro.', what: 'Score BCB é a referência máxima de risco de crédito no Brasil. Valores baixos (<300) indicam inadimplência grave.' },
  simples_nacional_collection: { label: 'Arrecadação Simples/MEI', desc: 'Histórico de arrecadação mensal no Simples Nacional e MEI via DAS.', what: 'Cross-check fiscal: verifica se o faturamento real (DAS) é compatível com o TPV declarado. MEI acima de R$ 6.750/mês está irregular.' },
  personal_relationships: { label: 'Relacionamentos Pessoais', desc: 'Rede de relacionamentos pessoais, coabitação, vínculos familiares e profissionais.', what: 'Detecta redes de laranjas: 3+ pessoas no mesmo endereço com CNPJs/MEIs é padrão de fraude em pagamentos.' },
  media_profile_and_exposure: { label: 'Perfil de Mídia PF', desc: 'Exposição em mídia online, menções, notícias associadas à pessoa.', what: 'Identifica menções negativas em mídia que podem indicar envolvimento em fraudes ou escândalos públicos.' },
  online_presence: { label: 'Presença Digital PF', desc: 'Perfis em redes sociais, sites, e-commerce vinculados à pessoa.', what: 'Pessoa sem presença digital operando pagamentos de alto volume é sinal de alerta para atividade suspeita.' },
  risk_data: { label: 'Dados de Risco PF', desc: 'Indicadores de risco consolidados: inadimplência, restrições, negativação.', what: 'Visão consolidada do perfil de risco da pessoa física.' },
};

function statusIcon(status) {
  const s = (status || '').toLowerCase();
  if (['sucesso', 'success'].includes(s)) return { Icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', label: 'Dados Retornados' };
  if (['falha', 'failed'].includes(s)) return { Icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', label: 'Falhou' };
  if (['pendente', 'pending', 'processing'].includes(s)) return { Icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Pendente' };
  return { Icon: HelpCircle, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', label: status || 'N/D' };
}

function extractTopFields(data, limit = 15) {
  if (!data || typeof data !== 'object') return [];
  const fields = [];
  function walk(obj, prefix = '', depth = 0) {
    if (depth > 2 || !obj) return;
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;
      const path = prefix ? `${prefix}.${key}` : key;
      if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length <= 10) {
        walk(value, path, depth + 1);
      } else if (Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] !== 'object') fields.push({ key: path, value: value.join(', ') });
        else if (value.length > 0) fields.push({ key: path, value: `${value.length} registro(s)`, complex: true });
      } else {
        fields.push({ key: path, value: String(value) });
      }
      if (fields.length >= limit) return;
    }
  }
  walk(data);
  return fields;
}

function humanize(key) {
  return key.split('.').pop().replace(/_/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, s => s.toUpperCase());
}

function DatasetCard({ record }) {
  const [open, setOpen] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const svcType = record.service_type || record.validationType || 'unknown';
  const meta = DATASET_META[svcType] || { label: svcType.replace(/_/g, ' '), desc: '', what: '' };
  const st = statusIcon(record.status || record.result_status);
  const data = record.resultData || record.response_payload || {};
  const hasData = data && Object.keys(data).length > 0;
  const fields = useMemo(() => open ? extractTopFields(data) : [], [open, data]);
  const date = new Date(record.created_date || record.timestamp);

  return (
    <div className={`rounded-xl border-2 ${st.border} overflow-hidden`}>
      <button onClick={() => setOpen(!open)} className={`w-full flex items-center gap-4 p-4 text-left hover:bg-white/50 transition-colors ${st.bg}`}>
        <st.Icon className={`w-5 h-5 ${st.color} flex-shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-[var(--pinbank-blue)]">{meta.label}</span>
            <Badge className={`${st.bg} ${st.color} text-[9px] border ${st.border}`}>{st.label}</Badge>
            {record.score != null && <Badge className="bg-slate-100 text-slate-600 text-[9px] border-0">Score: {record.score}</Badge>}
            {record.red_flags?.length > 0 && <Badge className="bg-red-100 text-red-700 text-[9px] border-0">{record.red_flags.length} flags</Badge>}
          </div>
          <p className="text-[10px] text-[var(--pinbank-blue)]/40 mt-0.5">
            {date.toLocaleDateString('pt-BR')} {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            {record.duration_ms ? ` · ${record.duration_ms}ms` : ''}
          </p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {open && (
        <div className="border-t border-slate-100 p-5 space-y-4">
          {/* What this dataset does */}
          <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider mb-1">O Que Este Dataset Consulta</p>
            <p className="text-xs text-blue-700/80 leading-relaxed">{meta.desc}</p>
          </div>

          {meta.what && (
            <div className="p-3.5 bg-indigo-50 rounded-xl border border-indigo-200">
              <p className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider mb-1">Por Que É Importante</p>
              <p className="text-xs text-indigo-700/80 leading-relaxed">{meta.what}</p>
            </div>
          )}

          {/* Red flags */}
          {record.red_flags?.length > 0 && (
            <div className="p-3.5 bg-red-50 rounded-xl border border-red-200">
              <p className="text-[10px] font-bold text-red-700 uppercase tracking-wider mb-2">Sinalizações de Risco</p>
              <ul className="space-y-1">
                {record.red_flags.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-red-700/80">
                    <XCircle className="w-3 h-3 flex-shrink-0 mt-0.5 text-red-500" />{f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Data returned */}
          {fields.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-[var(--pinbank-blue)]/50 uppercase tracking-wider mb-2">Dados Retornados</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                {fields.filter(f => !f.complex).map((f, i) => (
                  <div key={i} className="text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-[var(--pinbank-blue)]/40 text-[10px]">{humanize(f.key)}</span>
                    <p className="font-medium text-[var(--pinbank-blue)] mt-0.5 break-words">{f.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!hasData && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
              <AlertTriangle className="w-5 h-5 mx-auto mb-1.5 text-amber-500" />
              <p className="text-xs font-bold text-amber-700 mb-1">Nenhum dado retornado</p>
              <p className="text-[11px] text-amber-600/70">Este dataset foi consultado mas não retornou dados. Possíveis causas: empresa não encontrada na base, timeout na consulta, ou dados indisponíveis para este CNPJ.</p>
            </div>
          )}

          {/* Raw JSON */}
          {hasData && (
            <div>
              <button onClick={() => setShowJson(!showJson)} className="text-[10px] text-[var(--pinbank-blue)]/30 hover:text-[var(--pinbank-blue)]/60 flex items-center gap-1">
                <Eye className="w-3 h-3" />{showJson ? 'Ocultar JSON bruto' : 'Ver JSON bruto completo'}
              </button>
              {showJson && (
                <pre className="mt-2 p-3 bg-slate-900 text-green-300 text-[10px] rounded-lg overflow-auto max-h-[300px] font-mono">{JSON.stringify(data, null, 2)}</pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BDCFullAnalysis({ integrationLogs = [], validations = [] }) {
  const records = useMemo(() => {
    const map = new Map();
    [...validations.filter(v => v.provider === 'BigDataCorp'), ...integrationLogs.filter(l => l.provider === 'BigDataCorp')].forEach(r => map.set(r.id, r));
    return Array.from(map.values()).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [validations, integrationLogs]);

  if (!records.length) return null;

  const okCount = records.filter(r => ['Sucesso', 'success'].includes(r.status)).length;
  const failCount = records.filter(r => ['Falha', 'failed'].includes(r.status)).length;
  const distinctTypes = new Set(records.map(r => r.service_type || r.validationType)).size;

  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100"><Database className="w-5 h-5 text-blue-600" /></div>
          <div>
            <h3 className="text-base font-bold text-[var(--pinbank-blue)]">Big Data Corp — Análise Completa</h3>
            <p className="text-xs text-[var(--pinbank-blue)]/40 mt-0.5">Bureau de dados: Receita Federal, Juntas Comerciais, Tribunais, Serasa, CEIS/CNEP</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge className="bg-blue-100 text-blue-700 text-[10px]">{distinctTypes} datasets</Badge>
            <Badge className="bg-green-100 text-green-700 text-[10px]">{okCount} com dados</Badge>
            {failCount > 0 && <Badge className="bg-red-100 text-red-700 text-[10px]">{failCount} falhou</Badge>}
          </div>
        </div>
      </div>

      {/* Coverage bar */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-[var(--pinbank-blue)]/50 uppercase">Cobertura de Dados</span>
          <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${(okCount / Math.max(records.length, 1)) * 100}%` }} />
          </div>
          <span className="text-[10px] font-bold text-[var(--pinbank-blue)]/60">{okCount}/{records.length}</span>
        </div>
      </div>

      <div className="p-5 space-y-3">
        {records.map(r => <DatasetCard key={r.id} record={r} />)}
      </div>
    </div>
  );
}