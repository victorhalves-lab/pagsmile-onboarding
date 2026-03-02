import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Mapeia campos do Lead e do questionnaireData do Lead para perguntas do compliance.
 * Utiliza palavras-chave no texto das perguntas para encontrar correspondências.
 */

// Mapeamento de palavras-chave da pergunta de compliance → campo do Lead (fallback quando sourceEntityPath não está definido)
const LEAD_FIELD_MAPPINGS = [
  { keywords: ['cnpj'], leadField: 'cpfCnpj' },
  { keywords: ['razão social', 'razao social'], leadField: 'fullName' },
  { keywords: ['nome fantasia'], leadField: 'companyName' },
  { keywords: ['e-mail da empresa', 'email da empresa', 'e-mail corporativo', 'email corporativo'], leadField: 'email' },
  { keywords: ['telefone da empresa', 'telefone comercial', 'telefone principal'], leadField: 'phone' },
  { keywords: ['site corporativo', 'site da empresa', 'website', 'url do site'], leadField: 'website' },
  { keywords: ['mcc'], leadField: 'mcc' },
  { keywords: ['nome do contato', 'nome do responsável', 'nome completo do responsável'], leadField: 'contactName' },
  { keywords: ['cargo do contato', 'cargo do responsável'], leadField: 'contactRole' },
  { keywords: ['volume mensal', 'tpv mensal', 'estimativa de volume'], leadField: 'tpvMensal' },
  { keywords: ['ticket médio', 'ticket medio'], leadField: 'ticketMedio' },
  { keywords: ['transações por mês', 'transacoes por mes', 'quantidade de transações'], leadField: 'transacoesMes' },
  { keywords: ['expectativa de crescimento', 'crescimento esperado'], leadField: 'expectativaCrescimento' },
];

// Mapeamento de palavras-chave da pergunta de compliance → chaves no questionnaireData (respostas do lead)
const QUESTIONNAIRE_DATA_KEYWORDS = [
  { keywords: ['cnpj'], qKeywords: ['cnpj'] },
  { keywords: ['razão social', 'razao social'], qKeywords: ['razão social', 'razao social'] },
  { keywords: ['nome fantasia'], qKeywords: ['fantasia', 'nome fantasia'] },
  { keywords: ['e-mail', 'email'], qKeywords: ['e-mail', 'email'] },
  { keywords: ['telefone', 'celular'], qKeywords: ['telefone', 'celular'] },
  { keywords: ['site', 'website', 'url'], qKeywords: ['site', 'website', 'url'] },
  { keywords: ['mcc'], qKeywords: ['mcc'] },
  { keywords: ['volume', 'tpv'], qKeywords: ['volume', 'tpv'] },
  { keywords: ['ticket'], qKeywords: ['ticket'] },
  { keywords: ['tipo de empresa', 'natureza jurídica'], qKeywords: ['tipo de empresa', 'natureza', 'tipo'] },
  { keywords: ['produto', 'serviço'], qKeywords: ['produto', 'serviço', 'atividade'] },
  { keywords: ['endereço', 'cep'], qKeywords: ['endereço', 'cep'] },
  { keywords: ['cliente', 'público'], qKeywords: ['cliente', 'público', 'b2b', 'b2c'] },
  { keywords: ['contato', 'responsável'], qKeywords: ['contato', 'responsável', 'cargo'] },
  { keywords: ['crescimento'], qKeywords: ['crescimento'] },
  { keywords: ['transações', 'transacoes'], qKeywords: ['transações', 'transacoes'] },
];

function normalizeText(text) {
  return (text || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Resolve o valor de um sourceEntityPath no objeto Lead.
 * Ex: "Lead.cpfCnpj" → lead.cpfCnpj
 *     "Lead.questionnaireData.abc123" → lead.questionnaireData.abc123
 */
function resolveSourcePath(lead, path) {
  if (!path || !lead) return undefined;
  
  // Remove o prefixo "Lead." se presente
  const cleanPath = path.startsWith('Lead.') ? path.substring(5) : path;
  
  // Navega pelo objeto
  const parts = cleanPath.split('.');
  let value = lead;
  for (const part of parts) {
    if (value === null || value === undefined) return undefined;
    value = value[part];
  }
  
  return value;
}

/**
 * Dado um Lead e suas questões do questionário de lead, 
 * retorna um objeto { questionId: valor } para pré-preencher o compliance.
 * Prioridade: 1) sourceEntityPath explícito, 2) keywords em campos do Lead, 3) keywords no questionnaireData
 */
export function mapLeadToComplianceQuestions(lead, leadQuestions, complianceQuestions) {
  if (!lead || !complianceQuestions?.length) return {};
  
  const prefillData = {};
  const prefillSources = {};

  for (const cq of complianceQuestions) {
    // 1. PRIORIDADE: usar sourceEntityPath se definido na pergunta
    if (cq.sourceEntityPath) {
      const val = resolveSourcePath(lead, cq.sourceEntityPath);
      if (val !== undefined && val !== null && val !== '' && val !== 0) {
        prefillData[cq.id] = String(val);
        prefillSources[cq.id] = cq.sourceEntityPath;
        continue; // Encontrou via caminho explícito, pula para próxima pergunta
      }
    }

    // 2. FALLBACK: tentar mapear por keywords do campo direto do Lead
    const cqText = normalizeText(cq.text);
    for (const mapping of LEAD_FIELD_MAPPINGS) {
      const match = mapping.keywords.some(kw => cqText.includes(normalizeText(kw)));
      if (match && lead[mapping.leadField]) {
        const val = lead[mapping.leadField];
        if (val !== undefined && val !== null && val !== '' && val !== 0) {
          prefillData[cq.id] = String(val);
          prefillSources[cq.id] = `Lead.${mapping.leadField}`;
          break;
        }
      }
    }

    // 3. Se não encontrou, tentar mapear do questionnaireData do Lead
    if (!prefillData[cq.id] && lead.questionnaireData && leadQuestions?.length > 0) {
      for (const qdMapping of QUESTIONNAIRE_DATA_KEYWORDS) {
        const complianceMatch = qdMapping.keywords.some(kw => cqText.includes(normalizeText(kw)));
        if (!complianceMatch) continue;

        for (const lq of leadQuestions) {
          const lqText = normalizeText(lq.text);
          const leadMatch = qdMapping.qKeywords.some(kw => lqText.includes(normalizeText(kw)));
          
          if (leadMatch && lead.questionnaireData[lq.id]) {
            const val = lead.questionnaireData[lq.id];
            if (val !== undefined && val !== null && val !== '') {
              prefillData[cq.id] = val;
              prefillSources[cq.id] = `Lead.questionnaireData (${lq.text})`;
              break;
            }
          }
        }
        if (prefillData[cq.id]) break;
      }
    }
  }

  return { prefillData, prefillSources };
}

/**
 * Hook que busca o Lead associado ao link de onboarding e retorna dados para pré-preenchimento.
 */
export function useLeadPrefill(complianceQuestions) {
  const linkCode = typeof window !== 'undefined' ? localStorage.getItem('onboarding_link_code') : null;

  // Buscar Lead pelo linkCode
  const { data: lead } = useQuery({
    queryKey: ['leadByLinkCode', linkCode],
    queryFn: async () => {
      if (!linkCode) return null;
      // Buscar lead pelo código do link de onboarding
      const leads = await base44.entities.Lead.filter(
        { onboardingLinkCode: linkCode },
        '-created_date',
        1
      );
      return leads[0] || null;
    },
    enabled: !!linkCode
  });

  // Buscar perguntas do questionário de leads original
  const { data: leadQuestions = [] } = useQuery({
    queryKey: ['leadTemplateQuestions', lead?.leadQuestionnaireTemplateId],
    queryFn: () => base44.entities.Question.filter(
      { questionnaireTemplateId: lead.leadQuestionnaireTemplateId },
      'order'
    ),
    enabled: !!lead?.leadQuestionnaireTemplateId
  });

  // Computar mapeamento
  const { prefillData = {}, prefillSources = {} } = lead 
    ? mapLeadToComplianceQuestions(lead, leadQuestions, complianceQuestions) 
    : {};

  return {
    lead,
    prefillData,
    prefillSources,
    hasPrefill: Object.keys(prefillData).length > 0
  };
}