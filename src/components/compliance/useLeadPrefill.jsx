import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Mapeamento ASSERTIVO de Lead → Compliance.
 * 
 * Fontes de dados (por prioridade):
 * 1. Lead entity fields (cpfCnpj, fullName, email, phone, etc.)
 * 2. Lead.questionnaireData (respostas por questionId do Lead)
 * 3. Lead.questionnaireData._cnpjEnrichment (dados BrasilAPI enriquecidos)
 * 
 * O mapeamento é feito pelo TEXTO EXATO (normalizado) da pergunta de compliance.
 */

function normalizeText(text) {
  return (text || '').toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Busca no questionnaireData do Lead a resposta cuja pergunta (no Lead) 
 * tem texto similar ao texto buscado.
 */
function findLeadAnswer(lead, leadQuestions, searchTexts) {
  if (!lead?.questionnaireData || !leadQuestions?.length) return undefined;
  
  for (const searchText of searchTexts) {
    const normalSearch = normalizeText(searchText);
    for (const lq of leadQuestions) {
      const lqText = normalizeText(lq.text);
      if (lqText === normalSearch || lqText.includes(normalSearch) || normalSearch.includes(lqText)) {
        const val = lead.questionnaireData[lq.id];
        if (val !== undefined && val !== null && val !== '' && val !== 0) {
          return { value: val, source: `Lead Q: ${lq.text}` };
        }
      }
    }
  }
  return undefined;
}

/**
 * Mapeamento principal: texto exato da pergunta de compliance → valor do Lead
 */
function buildPrefillMap(lead, leadQuestions) {
  if (!lead) return {};
  
  const qd = lead.questionnaireData || {};
  const enrichment = qd._cnpjEnrichment || {};
  const map = {};

  // === HELPER: adiciona mapeamento com source tracking ===
  const add = (complianceText, value, source) => {
    if (value !== undefined && value !== null && value !== '' && value !== 0) {
      map[normalizeText(complianceText)] = { value: String(value), source };
    }
  };

  // =====================================================
  // 1. CAMPOS DIRETOS DA ENTIDADE LEAD
  // =====================================================
  add('cnpj', lead.cpfCnpj, 'Lead.cpfCnpj');
  add('razao social', lead.fullName, 'Lead.fullName');
  add('nome fantasia', lead.companyName, 'Lead.companyName');
  add('site da empresa', lead.website, 'Lead.website');
  add('codigo mcc', lead.mcc, 'Lead.mcc');
  add('mcc pretendido', lead.mcc, 'Lead.mcc');

  // Contato / Responsável
  add('nome do contato', lead.contactName, 'Lead.contactName');
  add('nome completo do contato', lead.contactName, 'Lead.contactName');
  add('nome completo do responsavel legal', lead.contactName, 'Lead.contactName');
  add('cargo do contato', lead.contactRole, 'Lead.contactRole');
  add('cargo', lead.contactRole, 'Lead.contactRole');
  
  // Email e telefone
  add('e-mail de contato', lead.email, 'Lead.email');
  add('e-mail do responsavel', lead.email, 'Lead.email');
  add('e-mail corporativo', lead.email, 'Lead.email');
  add('telefone de contato', lead.phone, 'Lead.phone');
  add('celular / whatsapp', lead.phone, 'Lead.phone');
  add('telefone do responsavel', lead.phone, 'Lead.phone');

  // Volumetria
  if (lead.tpvMensal) {
    add('volume mensal estimado', lead.tpvMensal, 'Lead.tpvMensal');
    add('tpv mensal estimado', lead.tpvMensal, 'Lead.tpvMensal');
    add('tpv mensal estimado (r$)', lead.tpvMensal, 'Lead.tpvMensal');
    add('volume transacional mensal estimado (r$)', lead.tpvMensal, 'Lead.tpvMensal');
  }
  if (lead.ticketMedio) {
    add('ticket medio', lead.ticketMedio, 'Lead.ticketMedio');
    add('ticket medio (r$)', lead.ticketMedio, 'Lead.ticketMedio');
    add('ticket medio estimado (r$)', lead.ticketMedio, 'Lead.ticketMedio');
  }
  if (lead.transacoesMes) {
    add('quantidade de transacoes por mes', lead.transacoesMes, 'Lead.transacoesMes');
    add('transacoes por mes estimadas', lead.transacoesMes, 'Lead.transacoesMes');
  }
  add('expectativa de crescimento', lead.expectativaCrescimento, 'Lead.expectativaCrescimento');

  // =====================================================
  // 2. DADOS ENRIQUECIDOS DO CNPJ (BrasilAPI)
  //    Salvos no Lead via questionnaireData._cnpjEnrichment
  // =====================================================
  if (enrichment.cnae_fiscal_descricao) {
    const cnae = String(enrichment.cnae_fiscal || '');
    const formatted = cnae.length === 7 
      ? `${cnae.slice(0,4)}-${cnae.slice(4,5)}/${cnae.slice(5)} — ${enrichment.cnae_fiscal_descricao}` 
      : enrichment.cnae_fiscal_descricao;
    add('cnae principal', formatted, 'CNPJ Enrichment');
  }
  if (enrichment.cnaes_secundarios?.length > 0) {
    const sec = enrichment.cnaes_secundarios.map(c => `${c.codigo} — ${c.descricao}`).join('; ');
    add('cnaes secundarios', sec, 'CNPJ Enrichment');
  }
  if (enrichment.descricao_situacao_cadastral) {
    add('situacao cadastral', enrichment.descricao_situacao_cadastral, 'CNPJ Enrichment');
  }
  if (enrichment.capital_social) {
    add('capital social', new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(enrichment.capital_social), 'CNPJ Enrichment');
  }
  if (enrichment.porte) {
    const porteMap = { 'ME': 'Microempresa (ME)', 'EPP': 'Empresa de Pequeno Porte (EPP)', 'DEMAIS': 'Demais' };
    add('porte da empresa', porteMap[enrichment.porte] || enrichment.porte, 'CNPJ Enrichment');
  }
  if (enrichment.tipo_empresa) {
    add('tipo de empresa', enrichment.tipo_empresa, 'CNPJ Enrichment');
  }

  // Endereço do CNPJ
  if (enrichment.endereco) {
    const e = enrichment.endereco;
    add('cep', e.cep, 'CNPJ Endereço');
    add('logradouro', e.logradouro, 'CNPJ Endereço');
    add('numero', e.numero, 'CNPJ Endereço');
    add('complemento', e.complemento, 'CNPJ Endereço');
    add('bairro', e.bairro, 'CNPJ Endereço');
    add('cidade', e.municipio, 'CNPJ Endereço');
    add('municipio', e.municipio, 'CNPJ Endereço');
    add('uf', e.uf, 'CNPJ Endereço');
    add('estado', e.uf, 'CNPJ Endereço');
  }

  // Data de início
  if (enrichment.data_inicio_atividade) {
    const d = enrichment.data_inicio_atividade;
    add('data de inicio da atividade', d.includes('-') ? d.split('-').reverse().join('/') : d, 'CNPJ Enrichment');
  }

  // Email e telefone da Receita
  add('e-mail da receita federal', enrichment.email_receita, 'CNPJ Enrichment');
  add('email da receita federal', enrichment.email_receita, 'CNPJ Enrichment');
  add('telefone da receita federal', enrichment.telefone_receita, 'CNPJ Enrichment');

  // QSA → UBO / Quadro Societário
  if (enrichment.qsa?.length > 0) {
    const qsaFormatted = enrichment.qsa.map(s => 
      `${s.nome_socio} — ${s.qualificacao_socio}${s.data_entrada_sociedade ? ` (desde ${s.data_entrada_sociedade})` : ''}`
    ).join('\n');
    add('beneficiarios finais / ubos', qsaFormatted, 'CNPJ QSA');
    add('quadro societario', qsaFormatted, 'CNPJ QSA');
    add('socios e administradores', qsaFormatted, 'CNPJ QSA');
    add('liste os beneficiarios finais (ubos)', qsaFormatted, 'CNPJ QSA');
  }

  // MCC sugerido
  if (enrichment.mcc_sugerido) {
    add('codigo mcc', enrichment.mcc_sugerido, 'CNPJ Enrichment');
    add('mcc pretendido', enrichment.mcc_sugerido, 'CNPJ Enrichment');
  }

  // Site sugerido
  if (enrichment.site_sugerido && !lead.website) {
    add('site da empresa', enrichment.site_sugerido, 'CNPJ Enrichment');
  }

  // Setor regulado
  if (enrichment.setor_regulado?.regulado) {
    add('licenciamento', 'true', 'CNPJ Enrichment');
  }

  // =====================================================
  // 3. RESPOSTAS DO QUESTIONÁRIO DE LEAD (questionnaireData)
  //    Mapeadas por texto similar da pergunta
  // =====================================================
  
  // Descrição de atividade/produtos
  const descAtividade = findLeadAnswer(lead, leadQuestions, [
    'Descreva brevemente todos os produtos/serviços',
    'Descrição do Modelo de Receita',
  ]);
  if (descAtividade) {
    add('descricao da atividade principal', descAtividade.value, descAtividade.source);
    add('descricao detalhada dos produtos e servicos', descAtividade.value, descAtividade.source);
  }

  // Canais de venda
  const canais = findLeadAnswer(lead, leadQuestions, ['Canais de Venda']);
  if (canais) {
    add('canais de venda utilizados', canais.value, canais.source);
    add('quais sao os canais de venda', canais.value, canais.source);
  }

  // Tipo de produto/serviço
  const tipoProduto = findLeadAnswer(lead, leadQuestions, ['Tipos de Produtos/Serviços']);
  if (tipoProduto) {
    add('tipos de produtos/servicos', tipoProduto.value, tipoProduto.source);
  }

  // Segmento
  const segmento = findLeadAnswer(lead, leadQuestions, ['Segmento de atuação']);
  if (segmento) {
    add('segmento de atuacao', segmento.value, segmento.source);
  }

  // Modelos de negócio (B2B, B2C, etc.)
  const modeloNeg = findLeadAnswer(lead, leadQuestions, ['Modelos de Negócio']);
  if (modeloNeg) {
    add('modelo de negocio', modeloNeg.value, modeloNeg.source);
    add('qual o modelo de negocio', modeloNeg.value, modeloNeg.source);
  }

  // Meios de pagamento
  const meiosPag = findLeadAnswer(lead, leadQuestions, ['Meios de Pagamento Desejados']);
  if (meiosPag) {
    add('metodos de pagamento desejados', meiosPag.value, meiosPag.source);
  }

  // Endereço (campo composto do Lead v2)
  const enderecoQ = findLeadAnswer(lead, leadQuestions, ['Endereço da Empresa']);
  if (enderecoQ && typeof enderecoQ.value === 'object') {
    const addr = enderecoQ.value;
    if (addr.cep) add('cep', addr.cep, 'Lead Endereço');
    if (addr.logradouro) add('logradouro', addr.logradouro, 'Lead Endereço');
    if (addr.numero) add('numero', addr.numero, 'Lead Endereço');
    if (addr.complemento) add('complemento', addr.complemento, 'Lead Endereço');
    if (addr.bairro) add('bairro', addr.bairro, 'Lead Endereço');
    if (addr.cidade) add('cidade', addr.cidade, 'Lead Endereço');
    if (addr.uf) add('uf', addr.uf, 'Lead Endereço');
    if (addr.uf) add('estado', addr.uf, 'Lead Endereço');
  }

  return map;
}

/**
 * Dado um map de texto→valor e as perguntas de compliance,
 * retorna { prefillData, prefillSources } com questionId→valor.
 */
export function mapLeadToComplianceQuestions(lead, leadQuestions, complianceQuestions) {
  if (!lead || !complianceQuestions?.length) return {};
  
  const map = buildPrefillMap(lead, leadQuestions);
  const prefillData = {};
  const prefillSources = {};

  for (const cq of complianceQuestions) {
    const cqNorm = normalizeText(cq.text);
    
    // 1. Busca EXATA no map
    if (map[cqNorm]) {
      prefillData[cq.id] = map[cqNorm].value;
      prefillSources[cq.id] = map[cqNorm].source;
      continue;
    }
    
    // 2. Busca PARCIAL: a chave do map está contida no texto da pergunta ou vice-versa
    for (const [key, entry] of Object.entries(map)) {
      if (cqNorm.includes(key) || key.includes(cqNorm)) {
        // Verificar compatibilidade de tipo: não misturar boolean com text, etc.
        if (cq.type === 'BOOLEAN') {
          const boolVal = entry.value === 'true' || entry.value === true;
          prefillData[cq.id] = boolVal;
        } else if (cq.type === 'NUMBER') {
          const num = parseFloat(entry.value);
          if (!isNaN(num)) prefillData[cq.id] = num;
        } else if (cq.type === 'MULTI_SELECT' && Array.isArray(entry.value)) {
          prefillData[cq.id] = entry.value;
        } else {
          prefillData[cq.id] = entry.value;
        }
        prefillSources[cq.id] = entry.source;
        break;
      }
    }
  }

  return { prefillData, prefillSources };
}

/**
 * Hook que busca o Lead associado ao link de onboarding e retorna dados para pré-preenchimento.
 * 
 * A busca funciona em 2 cenários:
 * 1. linkCode no localStorage (jornada Lead → Compliance no mesmo navegador)
 * 2. leadId na URL (link de compliance gerado internamente com referência ao Lead)
 */
export function useLeadPrefill(complianceQuestions) {
  const linkCode = typeof window !== 'undefined' ? localStorage.getItem('onboarding_link_code') : null;
  const leadIdFromStorage = typeof window !== 'undefined' ? localStorage.getItem('lead_id_for_compliance') : null;
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const leadIdFromUrl = urlParams?.get('leadId');

  // Buscar Lead pelo linkCode, leadId na URL, ou leadId no localStorage
  const { data: lead } = useQuery({
    queryKey: ['leadByLinkCode', linkCode, leadIdFromUrl, leadIdFromStorage],
    queryFn: async () => {
      // Prioridade 1: leadId explícito na URL
      if (leadIdFromUrl) {
        const leads = await base44.entities.Lead.filter({ id: leadIdFromUrl });
        return leads[0] || null;
      }
      // Prioridade 2: leadId salvo pelo questionário de Lead
      if (leadIdFromStorage) {
        const leads = await base44.entities.Lead.filter({ id: leadIdFromStorage });
        return leads[0] || null;
      }
      // Prioridade 3: linkCode do localStorage
      if (linkCode) {
        const leads = await base44.entities.Lead.filter(
          { onboardingLinkCode: linkCode },
          '-created_date',
          1
        );
        return leads[0] || null;
      }
      return null;
    },
    enabled: !!(linkCode || leadIdFromUrl || leadIdFromStorage)
  });

  // Buscar perguntas do questionário de leads original (para mapear respostas por texto)
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