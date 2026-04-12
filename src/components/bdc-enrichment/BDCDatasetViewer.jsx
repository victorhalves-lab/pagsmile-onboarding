import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Copy, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

// Maps BDC dataset keys to friendly names, categories, and human explanations
const DATASET_LABELS = {
  // Cadastrais
  'basic_data': { label: 'Dados Básicos', category: 'cadastral', explanation: 'Consulta os dados cadastrais da Receita Federal: razão social, nome fantasia, CNPJ, situação cadastral (ativa, suspensa, baixada), data de abertura, capital social, natureza jurídica e CNAE (atividade econômica). É a base de toda a análise — se o CNPJ estiver inativo ou com situação especial, é um bloqueio automático.' },
  'BasicData': { label: 'Dados Básicos', category: 'cadastral', explanation: 'Consulta os dados cadastrais da Receita Federal: razão social, nome fantasia, CNPJ, situação cadastral, data de abertura, capital social e CNAE.' },
  'empresa_basico': { label: 'Dados Básicos Empresa', category: 'cadastral', explanation: 'Dados essenciais da empresa na Receita Federal, incluindo situação cadastral e atividade econômica.' },
  'registration_data': { label: 'Dados de Registro (Receita Federal)', category: 'cadastral', explanation: 'Dados complementares de registro na Receita Federal: inscrição estadual, inscrição municipal, situação especial (se em recuperação judicial, liquidação, etc.), porte da empresa (MEI, ME, EPP, Demais), regime tributário (Simples Nacional, Lucro Presumido, Lucro Real) e número de empregados. Empresa sem empregados pode ser sinal de empresa de fachada.' },
  'RegistrationData': { label: 'Dados de Registro (Receita Federal)', category: 'cadastral', explanation: 'Dados complementares de registro incluindo porte, regime tributário e número de empregados.' },
  'history_basic_data': { label: 'Histórico de Alterações Cadastrais', category: 'cadastral', explanation: 'Registra TODAS as alterações que a empresa fez na Receita Federal ao longo do tempo: mudanças de nome, endereço, CNAE, capital social, entrada/saída de sócios. Alterações muito frequentes ou mudanças drásticas de atividade podem indicar tentativa de ocultar atividades irregulares.' },
  'HistoryBasicData': { label: 'Histórico de Alterações Cadastrais', category: 'cadastral', explanation: 'Histórico completo de alterações na Receita Federal ao longo do tempo.' },
  'company_evolution': { label: 'Evolução da Empresa', category: 'cadastral', explanation: 'Traça a evolução cronológica da empresa desde sua fundação: mudanças de capital, entrada/saída de sócios, alterações de endereço. Útil para identificar padrões como "empresa fantasma" que nunca teve atividade real.' },
  'CompanyEvolution': { label: 'Evolução da Empresa', category: 'cadastral', explanation: 'Evolução cronológica desde a fundação da empresa.' },
  'addresses': { label: 'Endereços', category: 'contato', explanation: 'Lista todos os endereços vinculados ao CNPJ, incluindo o endereço oficial na Receita e outros endereços encontrados em fontes públicas. Endereço em escritório virtual ou coworking pode indicar empresa sem sede própria.' },
  'Addresses': { label: 'Endereços', category: 'contato', explanation: 'Endereços vinculados ao CNPJ.' },
  'addresses_extended': { label: 'Endereços (Completo)', category: 'contato', explanation: 'Versão estendida dos endereços com dados complementares como tipo de imóvel, geolocalização e histórico.' },
  'AddressesExtended': { label: 'Endereços (Completo)', category: 'contato', explanation: 'Versão estendida com geolocalização e histórico.' },
  'emails': { label: 'E-mails', category: 'contato', explanation: 'E-mails vinculados ao CNPJ encontrados em fontes públicas e cadastros. Domínio do e-mail diferente do site da empresa pode indicar inconsistência.' },
  'Emails': { label: 'E-mails', category: 'contato', explanation: 'E-mails vinculados ao CNPJ.' },
  'emails_extended': { label: 'E-mails (Completo)', category: 'contato', explanation: 'E-mails com informações adicionais de validação e origem.' },
  'EmailsExtended': { label: 'E-mails (Completo)', category: 'contato', explanation: 'E-mails com validação e origem.' },
  'phones': { label: 'Telefones', category: 'contato', explanation: 'Telefones vinculados ao CNPJ. Empresa com apenas telefone celular e sem fixo pode ser micro operação.' },
  'Phones': { label: 'Telefones', category: 'contato', explanation: 'Telefones vinculados ao CNPJ.' },
  'phones_extended': { label: 'Telefones (Completo)', category: 'contato', explanation: 'Telefones com dados adicionais de operadora, tipo e validação.' },
  'PhonesExtended': { label: 'Telefones (Completo)', category: 'contato', explanation: 'Telefones com operadora e validação.' },
  'related_people_phones': { label: 'Telefones dos Sócios', category: 'contato', explanation: 'Telefones pessoais dos sócios da empresa, encontrados em fontes públicas. Útil para contato direto em caso de irregularidades.' },
  'RelatedPeoplePhones': { label: 'Telefones dos Sócios', category: 'contato', explanation: 'Telefones pessoais dos sócios.' },
  'related_people_emails': { label: 'E-mails dos Sócios', category: 'contato', explanation: 'E-mails pessoais dos sócios. Pode revelar vínculos com outras empresas quando o mesmo e-mail aparece em múltiplos CNPJs.' },
  'RelatedPeopleEmails': { label: 'E-mails dos Sócios', category: 'contato', explanation: 'E-mails pessoais dos sócios.' },
  'related_people_addresses': { label: 'Endereços dos Sócios', category: 'contato', explanation: 'Endereços residenciais dos sócios. Sócios morando no exterior podem indicar risco adicional de jurisdição.' },
  'RelatedPeopleAddresses': { label: 'Endereços dos Sócios', category: 'contato', explanation: 'Endereços dos sócios.' },
  // Societário
  'owners': { label: 'Quadro Societário (QSA)', category: 'societario', explanation: 'Lista completa de sócios e administradores da empresa como registrado na Receita Federal. Mostra nome, CPF/CNPJ, qualificação (sócio-administrador, sócio, administrador), data de entrada e percentual de participação. É fundamental para identificar quem realmente controla a empresa.' },
  'Relationships': { label: 'Quadro Societário (QSA)', category: 'societario', explanation: 'QSA — sócios e administradores registrados na Receita.' },
  'relationships': { label: 'Quadro Societário (QSA)', category: 'societario', explanation: 'QSA — sócios e administradores.' },
  'related_people': { label: 'Pessoas Relacionadas', category: 'societario', explanation: 'Pessoas vinculadas à empresa que não necessariamente aparecem no QSA, como procuradores, representantes legais e ex-sócios.' },
  'related_companies': { label: 'Empresas Relacionadas', category: 'societario', explanation: 'Outras empresas que compartilham sócios, endereço ou vínculos societários. Pode revelar grupo econômico oculto ou conflitos de interesse.' },
  'owners_kyc': { label: 'KYC dos Sócios (PEP/Sanções)', category: 'societario', explanation: 'Verificação individual de CADA sócio nas listas de Pessoas Politicamente Expostas (PEP), sanções internacionais (OFAC, EU, UN), sanções nacionais (CEIS, CNEP, CEPIM), negativação e processos. É uma das verificações mais importantes — um sócio PEP ou sancionado pode bloquear toda a aprovação.' },
  'OwnersKyc': { label: 'KYC dos Sócios (PEP/Sanções)', category: 'societario', explanation: 'KYC individual de cada sócio: PEP, sanções, negativação.' },
  'owners_lawsuits': { label: 'Processos dos Sócios', category: 'societario', explanation: 'Todos os processos judiciais dos sócios como pessoa física: cíveis, criminais, trabalhistas, tributários. Processos criminais de sócios são especialmente graves e podem indicar risco de envolvimento em atividades ilegais.' },
  'OwnersLawsuits': { label: 'Processos dos Sócios', category: 'societario', explanation: 'Processos judiciais dos sócios.' },
  'owners_influence': { label: 'Influência dos Sócios', category: 'societario', explanation: 'Nível de influência e conexões dos sócios no mercado — quantas empresas participam, cargos ocupados, relevância do network.' },
  'OwnersInfluence': { label: 'Influência dos Sócios', category: 'societario', explanation: 'Nível de influência e conexões dos sócios.' },
  'owners_electoral_donors': { label: 'Doações Eleitorais dos Sócios', category: 'societario', explanation: 'Doações feitas pelos sócios a partidos políticos e candidatos, registradas no TSE. Doações muito altas podem indicar que o sócio tem vínculos políticos significativos (possível PEP indireto).' },
  'OwnersElectoralDonors': { label: 'Doações Eleitorais dos Sócios', category: 'societario', explanation: 'Doações eleitorais ao TSE.' },
  'owners_industrial_property': { label: 'Propriedade Industrial dos Sócios', category: 'societario', explanation: 'Patentes e marcas registradas no INPI pelos sócios pessoalmente.' },
  'OwnersIndustrialProperty': { label: 'Propriedade Industrial dos Sócios', category: 'societario', explanation: 'Patentes e marcas dos sócios no INPI.' },
  'political_involvement': { label: 'Envolvimento Político', category: 'societario', explanation: 'Verificação de envolvimento político do quadro societário: cargos públicos ocupados, vínculos partidários, candidaturas. Complementa a verificação de PEP com dados mais detalhados.' },
  'PoliticalInvolvement': { label: 'Envolvimento Político', category: 'societario', explanation: 'Cargos públicos e vínculos partidários.' },
  // Compliance
  'kyc': { label: 'KYC Empresa (Sanções/PEP)', category: 'compliance', explanation: 'Verificação KYC da empresa (não dos sócios): checa se o CNPJ está em listas de sanções nacionais (CEIS, CNEP, CEPIM, Lista Suja do Trabalho Escravo) e internacionais (OFAC/SDN, EU Sanctions, UN Sanctions, UK Treasury). Também verifica doações eleitorais feitas pela empresa e presença em cadastros de restrição.' },
  'Kyc': { label: 'KYC Empresa (Sanções/PEP)', category: 'compliance', explanation: 'KYC da empresa: sanções, listas restritivas, doações eleitorais.' },
  'processes': { label: 'Processos Judiciais', category: 'compliance', explanation: 'Todos os processos judiciais da EMPRESA (não dos sócios): cíveis, trabalhistas, tributários, criminais. Inclui número do processo, tribunal, vara, tipo, valor da causa, status, partes envolvidas e última movimentação. Muitos processos trabalhistas podem indicar problemas de gestão; processos criminais são red flag grave.' },
  'Processes': { label: 'Processos Judiciais', category: 'compliance', explanation: 'Processos judiciais da empresa.' },
  'lawsuits': { label: 'Ações Judiciais', category: 'compliance', explanation: 'Ações judiciais detalhadas com partes envolvidas e movimentações.' },
  'Lawsuits': { label: 'Ações Judiciais', category: 'compliance', explanation: 'Ações judiciais detalhadas.' },
  'sanctions': { label: 'Sanções / Listas Restritivas', category: 'compliance', explanation: 'Presença em listas de sanções nacionais e internacionais.' },
  'pep': { label: 'PEP (Pessoa Politicamente Exposta)', category: 'compliance', explanation: 'Verificação de vínculo com pessoas politicamente expostas.' },
  'government_debtors': { label: 'Dívida Ativa / Devedores do Governo', category: 'compliance', explanation: 'Verificação se a empresa está inscrita na Dívida Ativa da União, dos estados ou dos municípios. A Dívida Ativa é quando a empresa deve impostos ao governo e não pagou — diferente de dívida com empresas privadas. Valores altos ou múltiplas inscrições são indicativos de problemas financeiros sérios.' },
  'GovernmentDebtors': { label: 'Dívida Ativa / Devedores do Governo', category: 'compliance', explanation: 'Inscrição em Dívida Ativa da União/estados/municípios.' },
  'collections': { label: 'Negativação / Cobranças', category: 'compliance', explanation: 'Presença em cadastros de restrição ao crédito: Serasa, SPC, protestos em cartório. Mostra se a empresa tem "nome sujo", valores devidos e credores. Muitas negativações indicam que a empresa não consegue pagar suas contas — risco alto de chargebacks e inadimplência.' },
  'Collections': { label: 'Negativação / Cobranças', category: 'compliance', explanation: 'Serasa, SPC, protestos — "nome sujo".' },
  // Financeiro
  'debts': { label: 'Dívidas Ativas', category: 'financeiro', explanation: 'Detalhamento de dívidas da empresa com órgãos públicos e privados.' },
  'protests': { label: 'Protestos', category: 'financeiro', explanation: 'Protestos registrados em cartórios — títulos não pagos (duplicatas, cheques, notas promissórias) que foram levados a protesto pelo credor.' },
  'bankruptcies': { label: 'Falências / Recuperação Judicial', category: 'financeiro', explanation: 'Verificação se a empresa pediu ou teve decretada falência ou recuperação judicial.' },
  'financial_market': { label: 'Mercado Financeiro (BCB/CVM)', category: 'financeiro', explanation: 'Registros no Banco Central (BCB) e na Comissão de Valores Mobiliários (CVM). Verifica se a empresa tem licenças financeiras, se é instituição regulada, se tem penalidades aplicadas por reguladores. Empresa que opera como fintech sem registro no BCB é irregularidade grave.' },
  'FinancialMarket': { label: 'Mercado Financeiro (BCB/CVM)', category: 'financeiro', explanation: 'Registros BCB/CVM e licenças financeiras.' },
  'economic_group': { label: 'Grupo Econômico', category: 'financeiro', explanation: 'Identifica se a empresa faz parte de um grupo econômico — outras empresas com sócios em comum, mesmo endereço, ou vínculos societários indiretos. Ajuda a entender a real dimensão da operação e se há empresas relacionadas com problemas.' },
  'EconomicGroup': { label: 'Grupo Econômico', category: 'financeiro', explanation: 'Empresas relacionadas e vínculos societários.' },
  'merchant_category_data': { label: 'MCC / Categoria Merchant', category: 'financeiro', explanation: 'Código MCC (Merchant Category Code) real da empresa, identificado pela BDC. Pode ser diferente do MCC declarado pelo merchant. Se o MCC real for diferente do declarado, pode indicar que a empresa está tentando se classificar em categoria de menor risco para pagar taxas menores.' },
  'MerchantCategoryData': { label: 'MCC / Categoria Merchant', category: 'financeiro', explanation: 'MCC real vs declarado.' },
  'licenses_and_authorizations': { label: 'Licenças e Autorizações', category: 'financeiro', explanation: 'Licenças e autorizações governamentais da empresa: Anvisa, ANS, ANATEL, etc. Empresas reguladas que operam sem licença ativa são bloqueio.' },
  'LicensesAndAuthorizations': { label: 'Licenças e Autorizações', category: 'financeiro', explanation: 'Licenças governamentais.' },
  'industrial_property': { label: 'Propriedade Industrial (INPI)', category: 'financeiro', explanation: 'Patentes e marcas registradas pela empresa no INPI. Pode indicar investimento em inovação e proteção de propriedade intelectual.' },
  'IndustrialProperty': { label: 'Propriedade Industrial (INPI)', category: 'financeiro', explanation: 'Patentes e marcas no INPI.' },
  'credit_score': { label: 'Score de Crédito', category: 'financeiro', explanation: 'Score de crédito da empresa calculado pela BDC com base em múltiplas fontes.' },
  'revenue': { label: 'Faturamento Estimado', category: 'financeiro', explanation: 'Estimativa de faturamento da empresa baseada em indicadores indiretos.' },
  'company_size': { label: 'Porte da Empresa', category: 'financeiro', explanation: 'Classificação de porte baseada em faturamento e número de empregados.' },
  // Digital
  'online_presence': { label: 'Presença Online', category: 'digital', explanation: 'Score geral de presença online da empresa. Considera domínios, redes sociais, marketplaces e menções na web. Empresas com presença online zero são suspeitas — podem ser empresas de fachada que não operam de verdade.' },
  'OnlinePresence': { label: 'Presença Online', category: 'digital', explanation: 'Score geral de presença online.' },
  'domains': { label: 'Domínios', category: 'digital', explanation: 'Domínios de internet registrados pela empresa. Verifica: idade do domínio (domínio criado há menos de 6 meses = risco), se tem certificado SSL (cadeado de segurança), qual plataforma usa (Shopify, WooCommerce, etc.), e se o domínio está ativo. Site profissional com histórico é ponto positivo.' },
  'Domains': { label: 'Domínios', category: 'digital', explanation: 'Domínios com idade, SSL e plataforma.' },
  'online_ads': { label: 'Anúncios Online', category: 'digital', explanation: 'Anúncios ativos encontrados em plataformas como Google Ads, Facebook Ads. Indica investimento em marketing e operação real.' },
  'OnlineAds': { label: 'Anúncios Online', category: 'digital', explanation: 'Anúncios em plataformas de marketing.' },
  'passages': { label: 'Passagens Web', category: 'digital', explanation: 'Quantas vezes a empresa apareceu em sites, diretórios e buscas nos últimos 12 meses. Funciona como proxy de "atividade real" — empresa com zero passagens provavelmente não tem clientes nem operação. Acima de 50 passagens indica boa atividade.' },
  'Passages': { label: 'Passagens Web', category: 'digital', explanation: 'Menções da empresa na web nos últimos 12 meses.' },
  'activity_indicators': { label: 'Indicadores de Atividade', category: 'digital', explanation: 'Indicadores calculados pela BDC que medem se a empresa tem sinais reais de operação: nível de atividade (0-100), score de "Shell Company" (empresa de fachada — acima de 30% é preocupante, acima de 50% é grave, acima de 80% é bloqueio), e presença digital combinada.' },
  'ActivityIndicators': { label: 'Indicadores de Atividade', category: 'digital', explanation: 'Nível de atividade e score de shell company.' },
  'marketplace_data': { label: 'Dados de Marketplace', category: 'digital', explanation: 'Presença da empresa em marketplaces como Mercado Livre, Shopee, Amazon, Magazine Luiza. Vendas ativas em marketplaces conhecidos são forte indicativo de operação legítima e verificável.' },
  'MarketplaceData': { label: 'Dados de Marketplace', category: 'digital', explanation: 'Presença em marketplaces.' },
  'social_media': { label: 'Redes Sociais', category: 'digital', explanation: 'Perfis da empresa em redes sociais (Instagram, Facebook, LinkedIn, Twitter). Presença ativa com seguidores reais indica operação legítima.' },
  // Reputação
  'media_profile_and_exposure': { label: 'Perfil de Mídia / Adverse Media', category: 'reputacao', explanation: 'Busca notícias sobre a empresa em fontes de mídia (jornais, sites, TV) e classifica o sentimento: positivo, neutro ou negativo. Notícias negativas (adverse media) sobre fraude, lavagem de dinheiro, processos criminais ou escândalos são red flags graves que podem impedir aprovação.' },
  'MediaProfileAndExposure': { label: 'Perfil de Mídia / Adverse Media', category: 'reputacao', explanation: 'Notícias com análise de sentimento.' },
  'reputations_and_reviews': { label: 'Reputação e Avaliações (Reclame Aqui)', category: 'reputacao', explanation: 'Avaliações da empresa em plataformas como Reclame Aqui: nota, quantidade de reclamações, taxa de resolução, tempo de resposta. Empresa com nota ruim no Reclame Aqui pode indicar problemas de atendimento que geram chargebacks.' },
  'ReputationsAndReviews': { label: 'Reputação e Avaliações (Reclame Aqui)', category: 'reputacao', explanation: 'Reclame Aqui e plataformas de avaliação.' },
  'awards_and_certifications': { label: 'Prêmios e Certificações', category: 'reputacao', explanation: 'Prêmios recebidos, selos de qualidade e certificações (ISO, PCI DSS, etc.). São pontos positivos que indicam seriedade operacional.' },
  'AwardsAndCertifications': { label: 'Prêmios e Certificações', category: 'reputacao', explanation: 'Prêmios e certificações.' },
  'adverse_media': { label: 'Mídia Adversa', category: 'reputacao', explanation: 'Especificamente notícias negativas encontradas sobre a empresa ou sócios.' },
  'negative_media': { label: 'Mídia Negativa', category: 'reputacao', explanation: 'Notícias negativas em fontes de mídia.' },
  'complaints': { label: 'Reclamações', category: 'reputacao', explanation: 'Reclamações registradas em órgãos de defesa do consumidor (Procon, consumidor.gov.br).' },
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

      {/* Explanation of what this dataset is */}
      {expanded && meta.explanation && (
        <div className="px-4 py-2.5 bg-blue-50/50 border-t border-blue-100">
          <p className="text-[11px] text-blue-800/70 leading-relaxed">
            <span className="font-bold text-blue-700">O que é este dataset:</span>{' '}
            {meta.explanation}
          </p>
        </div>
      )}

      {expanded && !isEmpty && (
        <div className="border-t border-[#002443]/5 p-4 bg-[#fafafa] max-h-[500px] overflow-y-auto">
          <DataValue value={data} />
        </div>
      )}
    </div>
  );
}