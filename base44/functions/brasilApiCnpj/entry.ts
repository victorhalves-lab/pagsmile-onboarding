import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

// Mapeamento de código de natureza jurídica para tipo de empresa
function mapNaturezaJuridica(codigo, opcaoPeloMei) {
  if (opcaoPeloMei === true) return 'MEI';
  const c = parseInt(codigo);
  if (c === 2062 || c === 2063) return 'Sociedade Limitada';
  if (c === 2046) return 'S.A.';
  if (c === 2305) return 'EIRELI';
  return 'Outro';
}

// Tabela de mapeamento CNAE → MCC (principais pares)
const CNAE_MCC_MAP = {
  '4711301': '5411', '4711302': '5411', // Supermercados
  '4712100': '5411', // Minimercados
  '4721102': '5499', // Padaria
  '4751201': '5944', // Artigos de joalheria
  '4753900': '5947', // Presentes
  '4755501': '5732', // Eletrônicos
  '4755502': '5732',
  '4756300': '5735', // Música
  '4757100': '5941', // Esportes
  '4759801': '5999', // Artigos em geral
  '4761003': '5942', // Livrarias
  '4763601': '5945', // Brinquedos
  '4763602': '5947', // Artigos de festa
  '4771701': '5912', // Farmácias
  '4772500': '5977', // Cosméticos
  '4781400': '5541', // Combustível
  '5611201': '5812', // Restaurantes
  '5611202': '5812',
  '5611203': '5814', // Fast food
  '5612100': '5812',
  '5620101': '5811', // Buffet
  '5620104': '5811',
  '6201500': '7372', // Software sob encomenda
  '6202300': '7372', // Software customizável
  '6203100': '7372', // Software não-customizável
  '6204000': '7372', // Consultoria em TI
  '6209100': '7372', // Suporte TI
  '6311900': '7375', // Tratamento de dados
  '6319400': '7375', // Portais e provedores
  '4713001': '5999', // Comércio varejista pela internet
  '4713002': '5999',
  '4713003': '5999',
  '4713004': '5999',
  '4713005': '5999',
  '6462000': '6012', // Holdings
  '6463800': '6012',
  '6491300': '6051', // Atividades de crédito
  '6499999': '6012', // Atividades financeiras
};

function mapCnaeToMcc(cnaeFiscal) {
  const cnaeStr = String(cnaeFiscal);
  return CNAE_MCC_MAP[cnaeStr] || null;
}

// Verificação de setor regulado (C1 — Licenciamento)
// Divisões 64 (financeiras), 65 (seguros), 66 (auxiliares financeiros)
function checkSetorRegulado(cnaeFiscal) {
  const divisao = String(cnaeFiscal).substring(0, 2);
  const reguladores = {
    '64': { regulado: true, orgao: 'BCB — Banco Central do Brasil' },
    '65': { regulado: true, orgao: 'SUSEP — Superintendência de Seguros Privados' },
    '66': { regulado: true, orgao: 'CVM — Comissão de Valores Mobiliários' }
  };
  return reguladores[divisao] || { regulado: false, orgao: null };
}

// Listas do Anexo I — Atividades RESTRITAS e PROIBIDAS (PagSmile)
const ATIVIDADES_RESTRITAS_CNAES = [
  '9200301', '9200302', '9200399', // Jogos e apostas
  '6619302', // Câmbio
  '6622300', // Corretoras
  '4789004', // Armas
  '4723700', // Bebidas alcoólicas
  '1220401', '1220402', // Tabaco
  '4774100', // Artigos de ótica
];
const ATIVIDADES_PROIBIDAS_CNAES = [
  '9200301', // Casas de bingo (quando proibido por lei)
  '9200302', // Exploração de apostas (ilegal)
];

function checkAnexoI(cnaeFiscal, cnaesSecundarios) {
  const allCnaes = [String(cnaeFiscal), ...(cnaesSecundarios || []).map(c => String(c.codigo))];
  
  const restritos = allCnaes.filter(c => ATIVIDADES_RESTRITAS_CNAES.includes(c));
  const proibidos = allCnaes.filter(c => ATIVIDADES_PROIBIDAS_CNAES.includes(c));
  
  return {
    restrito: restritos.length > 0,
    proibido: proibidos.length > 0,
    cnaesRestritos: restritos,
    cnaesProibidos: proibidos,
    bloqueado: proibidos.length > 0,
    mensagem: proibidos.length > 0 
      ? 'Atividade proibida conforme Anexo I. Cadastro não pode ser realizado.'
      : restritos.length > 0 
      ? `Atividade restrita detectada (CNAEs: ${restritos.join(', ')}). Análise adicional necessária.`
      : null
  };
}

// Validação cruzada de volume vs porte/capital (B4)
function checkVolumeConsistency(porte, capitalSocial, opcaoPeloMei, opcaoPeloSimples) {
  const limits = {};
  if (opcaoPeloMei) {
    limits.maxAnual = 81000;
    limits.maxMensal = 6750;
    limits.descricao = 'MEI (limite R$ 81K/ano)';
  } else if (opcaoPeloSimples && porte === 'ME') {
    limits.maxAnual = 360000;
    limits.maxMensal = 30000;
    limits.descricao = 'Microempresa no Simples (limite R$ 360K/ano)';
  } else if (opcaoPeloSimples && porte === 'EPP') {
    limits.maxAnual = 4800000;
    limits.maxMensal = 400000;
    limits.descricao = 'EPP no Simples (limite R$ 4.8MM/ano)';
  } else {
    limits.maxAnual = null;
    limits.maxMensal = null;
    limits.descricao = 'Demais portes';
  }
  
  return limits;
}

// Sugestão de faturamento anual baseada no porte (Lead Pergunta 27)
function sugerirFaixaFaturamento(porte, opcaoPeloSimples, opcaoPeloMei) {
  if (opcaoPeloMei) return 'Até R$ 1 milhão';
  if (opcaoPeloSimples && porte === 'ME') return 'Até R$ 1 milhão';
  if (opcaoPeloSimples && porte === 'EPP') return 'R$ 1–5 milhões';
  return null; // Sem sugestão para DEMAIS
}

async function fetchCnpjBrasilApi(cnpj) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  
  const response = await fetch(
    `https://brasilapi.com.br/api/cnpj/v1/${cnpj}`,
    { 
      headers: { 'Accept': 'application/json' },
      signal: controller.signal 
    }
  );
  clearTimeout(timeoutId);
  
  if (response.status === 404) {
    return { error: 'CNPJ não encontrado na base da Receita Federal.', code: 404 };
  }
  if (response.status === 429 || response.status >= 500) {
    return { error: 'rate_limit_or_server', code: response.status };
  }
  if (!response.ok) {
    return { error: `Erro HTTP ${response.status}`, code: response.status };
  }
  
  return { data: await response.json() };
}

async function fetchCnpjOpenCnpj(cnpj) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  
  const response = await fetch(
    `https://publica.cnpj.ws/cnpj/${cnpj}`,
    { 
      headers: { 'Accept': 'application/json' },
      signal: controller.signal 
    }
  );
  clearTimeout(timeoutId);
  
  if (!response.ok) {
    return { error: `Fallback 1 falhou: HTTP ${response.status}`, code: response.status };
  }
  
  const raw = await response.json();
  
  // Normalizar para formato BrasilAPI
  return {
    data: {
      razao_social: raw.razao_social || '',
      nome_fantasia: raw.estabelecimento?.nome_fantasia || '',
      codigo_natureza_juridica: parseInt(raw.natureza_juridica?.id) || 0,
      opcao_pelo_mei: raw.simei?.optante === true,
      opcao_pelo_simples: raw.simples?.optante === true,
      cnae_fiscal: parseInt(raw.estabelecimento?.atividade_principal?.id) || 0,
      cnae_fiscal_descricao: raw.estabelecimento?.atividade_principal?.descricao || '',
      cnaes_secundarios: (raw.estabelecimento?.atividades_secundarias || []).map(a => ({
        codigo: parseInt(a.id) || 0,
        descricao: a.descricao || ''
      })),
      situacao_cadastral: raw.estabelecimento?.situacao_cadastral === 'Ativa' ? 2 : 
                          raw.estabelecimento?.situacao_cadastral === 'Suspensa' ? 3 :
                          raw.estabelecimento?.situacao_cadastral === 'Inapta' ? 4 :
                          raw.estabelecimento?.situacao_cadastral === 'Baixada' ? 8 : 0,
      descricao_situacao_cadastral: raw.estabelecimento?.situacao_cadastral || '',
      data_situacao_cadastral: raw.estabelecimento?.data_situacao_cadastral || '',
      capital_social: parseFloat(raw.capital_social) || 0,
      porte: raw.porte?.id === '01' ? 'ME' : raw.porte?.id === '03' ? 'EPP' : 'DEMAIS',
      cep: raw.estabelecimento?.cep || '',
      logradouro: raw.estabelecimento?.logradouro || '',
      numero: raw.estabelecimento?.numero || '',
      complemento: raw.estabelecimento?.complemento || '',
      bairro: raw.estabelecimento?.bairro || '',
      municipio: raw.estabelecimento?.cidade?.nome || '',
      uf: raw.estabelecimento?.estado?.sigla || '',
      data_inicio_atividade: raw.estabelecimento?.data_inicio_atividade || '',
      email: raw.estabelecimento?.email || '',
      ddd_telefone_1: `${raw.estabelecimento?.ddd1 || ''}${raw.estabelecimento?.telefone1 || ''}`,
      situacao_especial: raw.estabelecimento?.situacao_especial || null,
      qsa: (raw.socios || []).map(s => ({
        nome_socio: s.nome || '',
        cnpj_cpf_do_socio: s.cpf_cnpj_socio || '',
        codigo_qualificacao_socio: parseInt(s.qualificacao_socio?.id) || 0,
        qualificacao_socio: s.qualificacao_socio?.descricao || '',
        data_entrada_sociedade: s.data_entrada || ''
      }))
    }
  };
}

async function fetchCnpjReceitaWs(cnpj) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  
  const response = await fetch(
    `https://receitaws.com.br/v1/cnpj/${cnpj}`,
    { 
      headers: { 'Accept': 'application/json' },
      signal: controller.signal 
    }
  );
  clearTimeout(timeoutId);
  
  if (!response.ok) {
    return { error: `Fallback 2 falhou: HTTP ${response.status}`, code: response.status };
  }
  
  const raw = await response.json();
  if (raw.status === 'ERROR') {
    return { error: raw.message || 'Erro na ReceitaWS', code: 400 };
  }
  
  // Normalizar para formato BrasilAPI
  return {
    data: {
      razao_social: raw.nome || '',
      nome_fantasia: raw.fantasia || '',
      codigo_natureza_juridica: parseInt(raw.natureza_juridica?.split(' ')[0]) || 0,
      opcao_pelo_mei: false,
      opcao_pelo_simples: raw.simples?.optante_simples === true,
      cnae_fiscal: parseInt((raw.atividade_principal?.[0]?.code || '').replace(/[\.\-\/]/g, '')) || 0,
      cnae_fiscal_descricao: raw.atividade_principal?.[0]?.text || '',
      cnaes_secundarios: (raw.atividades_secundarias || []).map(a => ({
        codigo: parseInt((a.code || '').replace(/[\.\-\/]/g, '')) || 0,
        descricao: a.text || ''
      })),
      situacao_cadastral: raw.situacao === 'ATIVA' ? 2 : 
                          raw.situacao === 'SUSPENSA' ? 3 :
                          raw.situacao === 'INAPTA' ? 4 :
                          raw.situacao === 'BAIXADA' ? 8 : 0,
      descricao_situacao_cadastral: raw.situacao || '',
      data_situacao_cadastral: raw.data_situacao || '',
      capital_social: parseFloat((raw.capital_social || '0').replace(/\./g, '').replace(',', '.')) || 0,
      porte: raw.porte === 'MICRO EMPRESA' ? 'ME' : raw.porte === 'EMPRESA DE PEQUENO PORTE' ? 'EPP' : 'DEMAIS',
      cep: (raw.cep || '').replace(/[\.\-]/g, ''),
      logradouro: raw.logradouro || '',
      numero: raw.numero || '',
      complemento: raw.complemento || '',
      bairro: raw.bairro || '',
      municipio: raw.municipio || '',
      uf: raw.uf || '',
      data_inicio_atividade: raw.abertura ? raw.abertura.split('/').reverse().join('-') : '',
      email: raw.email || '',
      ddd_telefone_1: (raw.telefone || '').replace(/[\(\)\-\s\/]/g, ''),
      situacao_especial: raw.situacao_especial || null,
      qsa: (raw.qsa || []).map(s => ({
        nome_socio: s.nome || '',
        cnpj_cpf_do_socio: '',
        codigo_qualificacao_socio: 0,
        qualificacao_socio: s.qual || '',
        data_entrada_sociedade: ''
      }))
    }
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { cnpj } = await req.json();
    
    if (!cnpj || cnpj.length !== 14) {
      return Response.json({ error: 'CNPJ deve ter 14 dígitos numéricos.' }, { status: 400 });
    }

    // Tentar BrasilAPI primeiro
    let result;
    try {
      result = await fetchCnpjBrasilApi(cnpj);
    } catch (e) {
      result = { error: 'rate_limit_or_server', code: 500 };
    }
    
    // Se BrasilAPI falhou com 404, não tentar fallback (CNPJ não existe)
    if (result.code === 404) {
      return Response.json({ error: result.error }, { status: 404 });
    }
    
    // Se BrasilAPI falhou (rate limit, timeout, server error), tentar OpenCNPJ
    if (result.error && result.code !== 404) {
      console.log('BrasilAPI falhou, tentando OpenCNPJ...');
      try {
        result = await fetchCnpjOpenCnpj(cnpj);
      } catch (e) {
        result = { error: 'fallback_failed', code: 500 };
      }
    }

    // Se OpenCNPJ também falhou, tentar ReceitaWS
    if (result.error) {
      console.log('OpenCNPJ falhou, tentando ReceitaWS...');
      try {
        result = await fetchCnpjReceitaWs(cnpj);
      } catch (e) {
        result = { error: 'Todas as APIs falharam. Tente novamente em alguns segundos.', code: 500 };
      }
    }

    if (result.error) {
      // Mensagem amigável para CNPJ não encontrado em nenhuma API
      const friendlyError = (result.code === 400 || result.code === 404) 
        ? 'CNPJ não encontrado. Verifique se o número está correto.'
        : result.error;
      return Response.json({ error: friendlyError }, { status: result.code || 500 });
    }

    const d = result.data;

    // Montar resposta padronizada
    const response = {
      // Dados de autocomplete direto
      razao_social: d.razao_social || '',
      nome_fantasia: d.nome_fantasia || '',
      tipo_empresa: mapNaturezaJuridica(d.codigo_natureza_juridica, d.opcao_pelo_mei),
      codigo_natureza_juridica: d.codigo_natureza_juridica,
      cnae_fiscal: d.cnae_fiscal,
      cnae_fiscal_descricao: d.cnae_fiscal_descricao || '',
      cnaes_secundarios: d.cnaes_secundarios || [],
      situacao_cadastral: d.situacao_cadastral,
      descricao_situacao_cadastral: d.descricao_situacao_cadastral || '',
      data_situacao_cadastral: d.data_situacao_cadastral || '',
      capital_social: d.capital_social || 0,
      porte: d.porte || '',
      
      // Endereço (7 subcampos)
      endereco: {
        cep: d.cep || '',
        logradouro: d.logradouro || '',
        numero: d.numero || '',
        complemento: d.complemento || '',
        bairro: d.bairro || '',
        municipio: d.municipio || '',
        uf: d.uf || ''
      },
      
      data_inicio_atividade: d.data_inicio_atividade || '',
      email: d.email || '',
      telefone: d.ddd_telefone_1 || '',
      
      // Dados de enriquecimento
      opcao_pelo_simples: d.opcao_pelo_simples || false,
      opcao_pelo_mei: d.opcao_pelo_mei || false,
      situacao_especial: d.situacao_especial || null,
      qsa: d.qsa || [],
      
      // MCC sugerido
      mcc_sugerido: mapCnaeToMcc(d.cnae_fiscal),
      
      // Sugestão de site baseada no e-mail
      site_sugerido: (() => {
        if (!d.email) return null;
        const domain = d.email.split('@')[1];
        if (!domain) return null;
        const freeEmails = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.com.br', 'bol.com.br', 'uol.com.br', 'terra.com.br', 'ig.com.br'];
        if (freeEmails.includes(domain.toLowerCase())) return null;
        return `https://${domain}`;
      })(),
      
      // Idade da empresa em anos
      idade_empresa_anos: (() => {
        if (!d.data_inicio_atividade) return null;
        const inicio = new Date(d.data_inicio_atividade);
        const agora = new Date();
        return Math.floor((agora - inicio) / (365.25 * 24 * 60 * 60 * 1000));
      })(),
      
      // Setor regulado (C1)
      setor_regulado: checkSetorRegulado(d.cnae_fiscal),
      
      // Anexo I — atividades restritas/proibidas (I5/I6)
      anexo_i: checkAnexoI(d.cnae_fiscal, d.cnaes_secundarios),
      
      // Validação cruzada de volume (B4)
      limites_volume: checkVolumeConsistency(d.porte, d.capital_social, d.opcao_pelo_mei, d.opcao_pelo_simples),
      
      // Sugestão de faixa de faturamento (Lead P27)
      faixa_faturamento_sugerida: sugerirFaixaFaturamento(d.porte, d.opcao_pelo_simples, d.opcao_pelo_mei),
      
      // Fonte dos dados
      fonte: 'receita_federal'
    };

    return Response.json(response);
    
  } catch (error) {
    console.error('Erro na consulta CNPJ:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});