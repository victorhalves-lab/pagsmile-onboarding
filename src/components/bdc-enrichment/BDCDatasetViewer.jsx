import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

// Maps BDC dataset keys to friendly names and categories
const DATASET_LABELS = {
  // Cadastrais
  'basic_data': { label: 'Dados Básicos', category: 'cadastral' },
  'BasicData': { label: 'Dados Básicos', category: 'cadastral' },
  'empresa_basico': { label: 'Dados Básicos Empresa', category: 'cadastral' },
  'registration_data': { label: 'Dados de Registro (Receita Federal)', category: 'cadastral' },
  'RegistrationData': { label: 'Dados de Registro (Receita Federal)', category: 'cadastral' },
  'history_basic_data': { label: 'Histórico de Alterações Cadastrais', category: 'cadastral' },
  'HistoryBasicData': { label: 'Histórico de Alterações Cadastrais', category: 'cadastral' },
  'company_evolution': { label: 'Evolução da Empresa', category: 'cadastral' },
  'CompanyEvolution': { label: 'Evolução da Empresa', category: 'cadastral' },
  'addresses': { label: 'Endereços', category: 'contato' },
  'Addresses': { label: 'Endereços', category: 'contato' },
  'addresses_extended': { label: 'Endereços (Completo)', category: 'contato' },
  'AddressesExtended': { label: 'Endereços (Completo)', category: 'contato' },
  'emails': { label: 'E-mails', category: 'contato' },
  'Emails': { label: 'E-mails', category: 'contato' },
  'emails_extended': { label: 'E-mails (Completo)', category: 'contato' },
  'EmailsExtended': { label: 'E-mails (Completo)', category: 'contato' },
  'phones': { label: 'Telefones', category: 'contato' },
  'Phones': { label: 'Telefones', category: 'contato' },
  'phones_extended': { label: 'Telefones (Completo)', category: 'contato' },
  'PhonesExtended': { label: 'Telefones (Completo)', category: 'contato' },
  'related_people_phones': { label: 'Telefones dos Sócios', category: 'contato' },
  'RelatedPeoplePhones': { label: 'Telefones dos Sócios', category: 'contato' },
  'related_people_emails': { label: 'E-mails dos Sócios', category: 'contato' },
  'RelatedPeopleEmails': { label: 'E-mails dos Sócios', category: 'contato' },
  'related_people_addresses': { label: 'Endereços dos Sócios', category: 'contato' },
  'RelatedPeopleAddresses': { label: 'Endereços dos Sócios', category: 'contato' },
  // Societário
  'owners': { label: 'Quadro Societário (QSA)', category: 'societario' },
  'Relationships': { label: 'Quadro Societário (QSA)', category: 'societario' },
  'relationships': { label: 'Quadro Societário (QSA)', category: 'societario' },
  'related_people': { label: 'Pessoas Relacionadas', category: 'societario' },
  'related_companies': { label: 'Empresas Relacionadas', category: 'societario' },
  'owners_kyc': { label: 'KYC dos Sócios (PEP/Sanções)', category: 'societario' },
  'OwnersKyc': { label: 'KYC dos Sócios (PEP/Sanções)', category: 'societario' },
  'owners_lawsuits': { label: 'Processos dos Sócios', category: 'societario' },
  'OwnersLawsuits': { label: 'Processos dos Sócios', category: 'societario' },
  'owners_influence': { label: 'Influência dos Sócios', category: 'societario' },
  'OwnersInfluence': { label: 'Influência dos Sócios', category: 'societario' },
  'owners_electoral_donors': { label: 'Doações Eleitorais dos Sócios', category: 'societario' },
  'OwnersElectoralDonors': { label: 'Doações Eleitorais dos Sócios', category: 'societario' },
  'owners_industrial_property': { label: 'Propriedade Industrial dos Sócios', category: 'societario' },
  'OwnersIndustrialProperty': { label: 'Propriedade Industrial dos Sócios', category: 'societario' },
  'political_involvement': { label: 'Envolvimento Político', category: 'societario' },
  'PoliticalInvolvement': { label: 'Envolvimento Político', category: 'societario' },
  // Compliance
  'kyc': { label: 'KYC Empresa (Sanções/PEP)', category: 'compliance' },
  'Kyc': { label: 'KYC Empresa (Sanções/PEP)', category: 'compliance' },
  'processes': { label: 'Processos Judiciais', category: 'compliance' },
  'Processes': { label: 'Processos Judiciais', category: 'compliance' },
  'lawsuits': { label: 'Ações Judiciais', category: 'compliance' },
  'Lawsuits': { label: 'Ações Judiciais', category: 'compliance' },
  'sanctions': { label: 'Sanções / Listas Restritivas', category: 'compliance' },
  'pep': { label: 'PEP (Pessoa Politicamente Exposta)', category: 'compliance' },
  'government_debtors': { label: 'Dívida Ativa / Devedores do Governo', category: 'compliance' },
  'GovernmentDebtors': { label: 'Dívida Ativa / Devedores do Governo', category: 'compliance' },
  'collections': { label: 'Negativação / Cobranças', category: 'compliance' },
  'Collections': { label: 'Negativação / Cobranças', category: 'compliance' },
  // Financeiro
  'debts': { label: 'Dívidas Ativas', category: 'financeiro' },
  'protests': { label: 'Protestos', category: 'financeiro' },
  'bankruptcies': { label: 'Falências / Recuperação Judicial', category: 'financeiro' },
  'financial_market': { label: 'Mercado Financeiro (BCB/CVM)', category: 'financeiro' },
  'FinancialMarket': { label: 'Mercado Financeiro (BCB/CVM)', category: 'financeiro' },
  'economic_group': { label: 'Grupo Econômico', category: 'financeiro' },
  'EconomicGroup': { label: 'Grupo Econômico', category: 'financeiro' },
  'merchant_category_data': { label: 'MCC / Categoria Merchant', category: 'financeiro' },
  'MerchantCategoryData': { label: 'MCC / Categoria Merchant', category: 'financeiro' },
  'licenses_and_authorizations': { label: 'Licenças e Autorizações', category: 'financeiro' },
  'LicensesAndAuthorizations': { label: 'Licenças e Autorizações', category: 'financeiro' },
  'industrial_property': { label: 'Propriedade Industrial (INPI)', category: 'financeiro' },
  'IndustrialProperty': { label: 'Propriedade Industrial (INPI)', category: 'financeiro' },
  'credit_score': { label: 'Score de Crédito', category: 'financeiro' },
  'revenue': { label: 'Faturamento Estimado', category: 'financeiro' },
  'company_size': { label: 'Porte da Empresa', category: 'financeiro' },
  // Digital
  'online_presence': { label: 'Presença Online', category: 'digital' },
  'OnlinePresence': { label: 'Presença Online', category: 'digital' },
  'domains': { label: 'Domínios', category: 'digital' },
  'Domains': { label: 'Domínios', category: 'digital' },
  'online_ads': { label: 'Anúncios Online', category: 'digital' },
  'OnlineAds': { label: 'Anúncios Online', category: 'digital' },
  'passages': { label: 'Passagens Web', category: 'digital' },
  'Passages': { label: 'Passagens Web', category: 'digital' },
  'activity_indicators': { label: 'Indicadores de Atividade', category: 'digital' },
  'ActivityIndicators': { label: 'Indicadores de Atividade', category: 'digital' },
  'marketplace_data': { label: 'Dados de Marketplace', category: 'digital' },
  'MarketplaceData': { label: 'Dados de Marketplace', category: 'digital' },
  'social_media': { label: 'Redes Sociais', category: 'digital' },
  // Reputação
  'media_profile_and_exposure': { label: 'Perfil de Mídia / Adverse Media', category: 'reputacao' },
  'MediaProfileAndExposure': { label: 'Perfil de Mídia / Adverse Media', category: 'reputacao' },
  'reputations_and_reviews': { label: 'Reputação e Avaliações (Reclame Aqui)', category: 'reputacao' },
  'ReputationsAndReviews': { label: 'Reputação e Avaliações (Reclame Aqui)', category: 'reputacao' },
  'awards_and_certifications': { label: 'Prêmios e Certificações', category: 'reputacao' },
  'AwardsAndCertifications': { label: 'Prêmios e Certificações', category: 'reputacao' },
  'adverse_media': { label: 'Mídia Adversa', category: 'reputacao' },
  'negative_media': { label: 'Mídia Negativa', category: 'reputacao' },
  'complaints': { label: 'Reclamações', category: 'reputacao' },
};

const CATEGORY_CONFIG = {
  cadastral: { label: 'Dados Cadastrais', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  contato: { label: 'Contato', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  societario: { label: 'Societário', color: 'bg-violet-50 text-violet-700 border-violet-200' },
  compliance: { label: 'Compliance / PLD', color: 'bg-red-50 text-red-700 border-red-200' },
  financeiro: { label: 'Financeiro', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  digital: { label: 'Presença Digital', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  reputacao: { label: 'Reputação', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  outros: { label: 'Outros Dados', color: 'bg-slate-50 text-slate-700 border-slate-200' },
};

function DataValue({ value, depth = 0 }) {
  if (value === null || value === undefined) return <span className="text-[#002443]/30 italic text-xs">N/D</span>;
  if (typeof value === 'boolean') return <Badge variant="outline" className="text-[10px]">{value ? 'Sim' : 'Não'}</Badge>;
  if (typeof value === 'number') return <span className="font-mono text-xs text-[#002443]">{value.toLocaleString('pt-BR')}</span>;
  if (typeof value === 'string') {
    if (value.length > 200) {
      return <p className="text-xs text-[#002443]/80 leading-relaxed whitespace-pre-wrap">{value}</p>;
    }
    return <span className="text-xs text-[#002443]/80">{value}</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-[#002443]/30 italic text-xs">Lista vazia</span>;
    if (typeof value[0] === 'string' || typeof value[0] === 'number') {
      return <span className="text-xs text-[#002443]/80">{value.join(', ')}</span>;
    }
    return (
      <div className="space-y-2 mt-1">
        {value.slice(0, 20).map((item, i) => (
          <div key={i} className="bg-white/50 rounded-lg p-2 border border-[#002443]/5">
            <DataObject data={item} depth={depth + 1} />
          </div>
        ))}
        {value.length > 20 && (
          <p className="text-[10px] text-[#002443]/40">... e mais {value.length - 20} itens</p>
        )}
      </div>
    );
  }
  if (typeof value === 'object') {
    return <DataObject data={value} depth={depth + 1} />;
  }
  return <span className="text-xs">{String(value)}</span>;
}

function DataObject({ data, depth = 0 }) {
  if (!data || typeof data !== 'object') return null;
  const entries = Object.entries(data).filter(([k]) => !k.startsWith('_'));
  if (entries.length === 0) return <span className="text-[#002443]/30 italic text-xs">Objeto vazio</span>;

  return (
    <div className={`space-y-1.5 ${depth > 0 ? 'pl-3 border-l-2 border-[#002443]/5' : ''}`}>
      {entries.map(([key, val]) => (
        <div key={key} className="flex items-start gap-2">
          <span className="text-[10px] font-semibold text-[#002443]/50 min-w-[100px] shrink-0 pt-0.5">
            {key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim()}
          </span>
          <div className="flex-1 min-w-0">
            <DataValue value={val} depth={depth} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function BDCDatasetViewer({ datasetKey, data }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const meta = DATASET_LABELS[datasetKey] || { label: datasetKey, category: 'outros' };
  const catConfig = CATEGORY_CONFIG[meta.category] || CATEGORY_CONFIG.outros;

  const isEmpty = !data || (typeof data === 'object' && Object.keys(data).length === 0);
  const isArray = Array.isArray(data);
  const itemCount = isArray ? data.length : (typeof data === 'object' ? Object.keys(data).length : 0);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true);
    toast.success('JSON copiado');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-[#002443]/8 overflow-hidden">
      <button
        onClick={() => !isEmpty && setExpanded(!expanded)}
        className={`w-full flex items-center gap-3 p-3.5 text-left transition-colors ${isEmpty ? 'opacity-50 cursor-default' : 'hover:bg-[#f4f4f4]/50'}`}
      >
        <div className="flex-1 min-w-0 flex items-center gap-2.5">
          <span className="text-sm font-semibold text-[#002443]">{meta.label}</span>
          <Badge className={`${catConfig.color} border text-[9px] px-1.5`}>{catConfig.label}</Badge>
          {!isEmpty && (
            <span className="text-[10px] text-[#002443]/40">{itemCount} {isArray ? 'registros' : 'campos'}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isEmpty && (
            <button onClick={handleCopy} className="p-1 hover:bg-[#002443]/5 rounded" title="Copiar JSON">
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-[#002443]/30" />}
            </button>
          )}
          {isEmpty ? (
            <span className="text-[10px] text-[#002443]/30">Sem dados</span>
          ) : expanded ? (
            <ChevronUp className="w-4 h-4 text-[#002443]/30" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#002443]/30" />
          )}
        </div>
      </button>

      {expanded && !isEmpty && (
        <div className="border-t border-[#002443]/5 p-4 bg-[#fafafa] max-h-[500px] overflow-y-auto">
          <DataValue value={data} />
        </div>
      )}
    </div>
  );
}