import React, { useState, useMemo } from 'react';
import { Database, ChevronDown, ChevronUp, Building2, Users, Globe, Shield, TrendingUp, Newspaper, User, CheckCircle2, XCircle, AlertTriangle, Eye, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import BdcDatasetDetail from './BdcDatasetDetail';

const DATASET_INFO = {
  empresas_basic_data: { label: 'Dados Básicos da Empresa', cat: 'Cadastro', desc: 'Razão social, nome fantasia, data de abertura, situação cadastral na Receita Federal, porte, capital social, natureza jurídica e CNAEs principal e secundários.', icon: Building2, color: 'blue' },
  empresas_kyc: { label: 'KYC Empresa (Básico)', cat: 'Compliance', desc: 'Verificação rápida de conformidade da empresa: situação cadastral, atividade econômica, e indicadores básicos de risco.', icon: Shield, color: 'indigo' },
  empresas_kyc_real: { label: 'KYC Empresa (Completo)', cat: 'Compliance', desc: 'Verificação completa de compliance empresarial incluindo PEPs entre sócios, sanções, processos judiciais, dívida ativa da União e protestos.', icon: Shield, color: 'red' },
  empresas_owners_kyc: { label: 'KYC dos Sócios', cat: 'Compliance', desc: 'Análise individual de cada sócio e administrador: CPF regular, PEP, sanções, processos e mandados judiciais.', icon: Users, color: 'violet' },
  empresas_relationships: { label: 'Relacionamentos Empresariais', cat: 'Cadastro', desc: 'Mapa de participações societárias, empresas relacionadas, grupo econômico e vínculos entre sócios e outras empresas.', icon: Users, color: 'cyan' },
  empresas_phones: { label: 'Telefones da Empresa', cat: 'Contato', desc: 'Telefones fixos e celulares associados ao CNPJ em diferentes bases de dados.', icon: Phone, color: 'blue' },
  empresas_emails: { label: 'E-mails da Empresa', cat: 'Contato', desc: 'Endereços de e-mail associados ao CNPJ para validação de contato.', icon: Globe, color: 'blue' },
  empresas_addresses: { label: 'Endereços', cat: 'Cadastro', desc: 'Endereços registrados na Receita Federal e em outras bases, incluindo CEP, logradouro e geolocalização.', icon: Building2, color: 'blue' },
  empresas_activity_indicators: { label: 'Indicadores de Atividade', cat: 'Financeiro', desc: 'Indicadores de movimentação da empresa: emissão de notas fiscais, participação em licitações, importações/exportações.', icon: TrendingUp, color: 'emerald' },
  empresas_domains: { label: 'Domínios Web', cat: 'Digital', desc: 'Sites e domínios registrados em nome da empresa ou dos sócios, incluindo data de registro e status.', icon: Globe, color: 'cyan' },
  empresas_mcc: { label: 'MCC (Merchant Category Code)', cat: 'Cadastro', desc: 'Código de categoria do estabelecimento comercial, usado para classificação do tipo de negócio no sistema de pagamentos.', icon: Building2, color: 'blue' },
  empresas_basic_enrichment: { label: 'Enriquecimento Básico', cat: 'Cadastro', desc: 'Conjunto de dados enriquecidos: faturamento estimado, número de funcionários, segmento de mercado.', icon: Database, color: 'blue' },
  pessoas_kyc: { label: 'KYC Pessoa Física', cat: 'Compliance', desc: 'Verificação completa do CPF: situação na RF, óbito, PEP, sanções, processos judiciais, protestos e dívida ativa.', icon: User, color: 'purple' },
  biometria_facial: { label: 'Biometria Facial', cat: 'Identidade', desc: 'Comparação biométrica facial contra bases oficiais ou registradas.', icon: User, color: 'purple' },
  prova_de_vida: { label: 'Prova de Vida', cat: 'Identidade', desc: 'Verificação de que a pessoa está viva e presente durante a verificação.', icon: User, color: 'purple' },
};

function getDatasetInfo(serviceType) {
  return DATASET_INFO[serviceType] || { label: serviceType?.replace(/_/g, ' ') || 'Dataset', cat: 'Outros', desc: 'Dataset da Big Data Corp.', icon: Database, color: 'slate' };
}

export default function AnaliseBdcCompleta({ bdcValidations, bdcLogs, merchant, latestScore, responses }) {
  const [expandedDataset, setExpandedDataset] = useState(null);

  const allRecords = React.useMemo(() => {
    const map = new Map();
    [...bdcValidations, ...bdcLogs].forEach(r => map.set(r.id, r));
    return Array.from(map.values()).sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [bdcValidations, bdcLogs]);

  // Group by service_type or validationType
  const grouped = React.useMemo(() => {
    const groups = {};
    for (const record of allRecords) {
      const key = record.service_type || record.validationType || 'unknown';
      if (!groups[key]) groups[key] = [];
      groups[key].push(record);
    }
    return groups;
  }, [allRecords]);

  // Group by category
  const byCategory = React.useMemo(() => {
    const cats = {};
    for (const [svcType, records] of Object.entries(grouped)) {
      const info = getDatasetInfo(svcType);
      const cat = info.cat;
      if (!cats[cat]) cats[cat] = [];
      cats[cat].push({ svcType, records, info });
    }
    return cats;
  }, [grouped]);

  const categoryOrder = ['Compliance', 'Cadastro', 'Identidade', 'Financeiro', 'Digital', 'Contato', 'Outros'];

  if (allRecords.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 p-8 text-center">
        <Database className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <p className="text-sm text-[var(--pinbank-blue)]/50 font-medium">Nenhum resultado da Big Data Corp encontrado</p>
        <p className="text-xs text-[var(--pinbank-blue)]/30 mt-1">O enriquecimento BDC ainda não foi executado para este cadastro.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--pinbank-blue)]/8 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--pinbank-blue)]">Big Data Corp — Enriquecimento de Dados</h2>
              <p className="text-xs text-[var(--pinbank-blue)]/40">Análise microscópica de todos os datasets consultados, com explicação de cada resultado</p>
            </div>
          </div>
          <Badge className="bg-blue-100 text-blue-700 text-xs">{allRecords.length} consultas</Badge>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* Explanation */}
        <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
          <h3 className="text-xs font-bold text-blue-800 mb-2">O que é a Big Data Corp?</h3>
          <p className="text-xs text-blue-700/70 leading-relaxed">
            A Big Data Corp é um bureau de dados que agrega informações de <strong>mais de 34 datasets</strong> incluindo Receita Federal, Juntas Comerciais, 
            Tribunais de Justiça, Serasa, CEIS/CNEP, OFAC, e bases proprietárias. Cada dataset retorna um conjunto específico de informações que, 
            quando cruzadas, permitem uma visão <strong>360°</strong> do risco do cliente: identificação cadastral, quadro societário e UBOs, 
            presença digital, compliance/PLD, reputação, e indicadores financeiros.
          </p>
        </div>

        {/* Categories */}
        {categoryOrder.map(catName => {
          const datasets = byCategory[catName];
          if (!datasets || datasets.length === 0) return null;
          
          return (
            <div key={catName}>
              <h3 className="text-sm font-bold text-[var(--pinbank-blue)] mb-2 flex items-center gap-2">
                <CategoryIcon category={catName} />
                {catName}
                <span className="text-[10px] text-[var(--pinbank-blue)]/40 font-normal">({datasets.reduce((sum, d) => sum + d.records.length, 0)} consultas)</span>
              </h3>
              <div className="space-y-2 ml-6">
                {datasets.map(({ svcType, records, info }) => {
                  const isExpanded = expandedDataset === svcType;
                  const latest = records[0];
                  const hasData = latest?.resultData || latest?.response_payload;
                  const successCount = records.filter(r => ['Sucesso', 'success'].includes(r.status)).length;
                  
                  return (
                    <div key={svcType} className="border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setExpandedDataset(isExpanded ? null : svcType)}
                        className="w-full flex items-center gap-3 p-3.5 hover:bg-slate-50/50 transition-colors text-left"
                      >
                        <div className={`p-1.5 rounded-lg bg-${info.color}-50`}>
                          <info.icon className={`w-4 h-4 text-${info.color}-600`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-[var(--pinbank-blue)]">{info.label}</span>
                          <p className="text-[10px] text-[var(--pinbank-blue)]/40">{records.length} consulta(s) • {successCount} com retorno</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {hasData ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-slate-300" />}
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </button>
                      {isExpanded && (
                        <div className="border-t border-slate-100">
                          <BdcDatasetDetail records={records} info={info} merchant={merchant} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CategoryIcon({ category }) {
  const map = {
    'Compliance': Shield,
    'Cadastro': Building2,
    'Identidade': User,
    'Financeiro': TrendingUp,
    'Digital': Globe,
    'Contato': Phone,
  };
  const Icon = map[category] || Database;
  return <Icon className="w-4 h-4 text-[var(--pinbank-blue)]/40" />;
}