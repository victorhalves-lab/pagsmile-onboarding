/**
 * Dataset Glossary — explains what each BDC dataset/section brings,
 * used by BDCDataConfidence tooltips (Bloco 6).
 */

export const DATASET_GLOSSARY = {
  identity: {
    label: 'Dados Cadastrais',
    brings: 'Razão social, nome fantasia, CNPJ, CNAE principal e secundários, situação cadastral na Receita Federal, data de abertura, porte, capital social, endereço fiscal.',
    datasets: ['basic_data', 'registration_data'],
  },
  owners: {
    label: 'Quadro Societário (QSA)',
    brings: 'Lista completa de sócios (nome, CPF, percentual), grupo econômico, participações em outras empresas, indicadores de PEP e sanções internacionais (OFAC, UE, ONU), UBO (beneficiário final).',
    datasets: ['owners_kyc', 'pep_international', 'sanctions_international', 'relationships'],
  },
  digital: {
    label: 'Presença Digital',
    brings: 'Domínios próprios (ativo/inativo), quantidade de passagens web, redes sociais identificadas, shell company score (probabilidade de empresa de fachada), atividade online histórica.',
    datasets: ['domains', 'activity_indicators', 'web_presence'],
  },
  compliance: {
    label: 'Compliance & PLD',
    brings: 'Processos judiciais (número, vara, valor, partes, status), dívida ativa federal/estadual/municipal, protestos, negativações em bureaus de crédito, presença em listas de sanções.',
    datasets: ['lawsuits', 'processes_detailed', 'tax_debt', 'sanctions', 'cease_desist'],
  },
  reputation: {
    label: 'Reputação & Mídia',
    brings: 'Adverse media (notícias com sentimento negativo classificadas por tema: fraude, lavagem, corrupção), avaliações Reclame Aqui, certificações (ISO, PCI-DSS), presença em mídia positiva.',
    datasets: ['adverse_media', 'reputation_scores', 'media_exposure'],
  },
  financial: {
    label: 'Financeiro & Mercado',
    brings: 'Faixa de receita mensal estimada pela Receita, score de crédito PJ (Serasa/BoaVista), histórico de inadimplência, cheques sem fundo, protestos financeiros, indicadores de liquidez.',
    datasets: ['pj_credit_profile', 'financial_indicators', 'credit_score', 'revenue_range'],
  },
  evolution: {
    label: 'Evolução Histórica',
    brings: 'Timeline de alterações cadastrais: mudanças de sócios, alterações de capital social, mudanças de CNAE, mudanças de endereço, alterações de porte, frequência dessas mudanças.',
    datasets: ['registration_history', 'ownership_changes'],
  },
  esg: {
    label: 'ESG & Lista Suja',
    brings: 'Presença na Lista Suja do MTE (trabalho análogo à escravidão), embargos ambientais ativos do IBAMA, autos de infração ambiental, indicadores de conformidade trabalhista e ambiental.',
    datasets: ['mte_lista_suja', 'ibama_embargos', 'esg_indicators'],
  },
  contacts: {
    label: 'Validação de Contatos',
    brings: 'Telefones associados à empresa na BDC (com data de última atualização), e-mails conhecidos, endereços físicos registrados, coerência com declarações do questionário.',
    datasets: ['phones', 'emails', 'addresses'],
  },
  employeesKyc: {
    label: 'KYC Funcionários',
    brings: 'Faixa de empregados CLT registrados no eSocial/CAGED, KYC dos funcionários-chave (PEP/sanções), tamanho efetivo da operação humana.',
    datasets: ['kyc_employees', 'esocial_data'],
  },
  sectorial: {
    label: 'Dados Setoriais',
    brings: 'Registros em órgãos reguladores setoriais: ANVISA (saúde), CVM (mercado de capitais), ANS (saúde suplementar), OAB/CRM/CREA (profissões), BCB (instituições financeiras), licenças específicas.',
    datasets: ['sectorial_data', 'regulatory_registries'],
  },
  assets: {
    label: 'Ativos Patrimoniais',
    brings: 'Propriedade industrial (marcas e patentes no INPI), imóveis, veículos, aeronaves, embarcações registradas em nome da empresa, licenças operacionais, prêmios e certificações.',
    datasets: ['intellectual_property', 'real_estate', 'vehicles', 'aircrafts'],
  },
};

export function getDatasetInfo(key) {
  return DATASET_GLOSSARY[key] || null;
}