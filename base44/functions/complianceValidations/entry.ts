/**
 * complianceValidations — Função unificada de validações complementares
 * 
 * Ações disponíveis:
 * - viacep: Autocomplete de endereço por CEP
 * - ddd: Validação de DDD + cross-ref UF
 * - registrobr: Validação de domínio .br
 * - cnae: Descrição hierárquica de CNAE
 * - banks: Validação de código de banco
 * - dnsMx: Validação de e-mail via DNS MX Lookup
 * - ibgeEstados: Lista 27 estados (UF)
 * - validateEmail: Validação completa de e-mail (MX + provedor gratuito + domínio cruzado)
 * - validatePhone: Validação completa de telefone (DDD + cross-ref UF)
 */

const FREE_EMAIL_PROVIDERS = [
  'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.com.br',
  'bol.com.br', 'uol.com.br', 'terra.com.br', 'ig.com.br', 'live.com',
  'icloud.com', 'protonmail.com', 'zoho.com', 'aol.com', 'mail.com'
];

// DDD → UF mapping
const DDD_UF_MAP = {
  '11':'SP','12':'SP','13':'SP','14':'SP','15':'SP','16':'SP','17':'SP','18':'SP','19':'SP',
  '21':'RJ','22':'RJ','24':'RJ',
  '27':'ES','28':'ES',
  '31':'MG','32':'MG','33':'MG','34':'MG','35':'MG','37':'MG','38':'MG',
  '41':'PR','42':'PR','43':'PR','44':'PR','45':'PR','46':'PR',
  '47':'SC','48':'SC','49':'SC',
  '51':'RS','53':'RS','54':'RS','55':'RS',
  '61':'DF','62':'GO','63':'TO','64':'GO',
  '65':'MT','66':'MT','67':'MS',
  '68':'AC','69':'RO',
  '71':'BA','73':'BA','74':'BA','75':'BA','77':'BA',
  '79':'SE',
  '81':'PE','82':'AL','83':'PB','84':'RN','85':'CE','86':'PI','87':'PE','88':'CE','89':'PI',
  '91':'PA','92':'AM','93':'PA','94':'PA','95':'RR','96':'AP','97':'AM','98':'MA','99':'MA'
};

async function handleViaCep(cep) {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) {
    return { error: 'CEP deve ter 8 dígitos' };
  }
  const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
  if (!res.ok) return { error: `ViaCEP retornou HTTP ${res.status}` };
  const data = await res.json();
  if (data.erro) return { error: 'CEP não encontrado' };
  return {
    cep: data.cep,
    logradouro: data.logradouro || '',
    complemento: data.complemento || '',
    bairro: data.bairro || '',
    localidade: data.localidade || '',
    uf: data.uf || '',
    ibge: data.ibge || '',
    ddd: data.ddd || ''
  };
}

async function handleDdd(ddd) {
  const cleanDdd = String(ddd).replace(/\D/g, '').substring(0, 2);
  if (cleanDdd.length !== 2) return { error: 'DDD deve ter 2 dígitos' };
  
  const res = await fetch(`https://brasilapi.com.br/api/ddd/v1/${cleanDdd}`);
  if (res.status === 404) return { valid: false, error: `DDD ${cleanDdd} não é válido` };
  if (!res.ok) {
    // Fallback para tabela local
    const uf = DDD_UF_MAP[cleanDdd];
    if (uf) return { valid: true, state: uf, cities: [], source: 'local' };
    return { valid: false, error: `DDD ${cleanDdd} não reconhecido` };
  }
  const data = await res.json();
  return { valid: true, state: data.state, cities: data.cities || [], source: 'brasilapi' };
}

async function handleRegistroBr(dominio) {
  // Only works for .br domains
  const domain = dominio.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').toLowerCase();
  const isBr = domain.endsWith('.br');
  
  if (isBr) {
    const res = await fetch(`https://brasilapi.com.br/api/registrobr/v1/${domain}`);
    if (!res.ok) return { domain, isBr: true, status: 'UNKNOWN', error: `HTTP ${res.status}` };
    const data = await res.json();
    
    // Calculate domain age if registered
    let domainAgeMonths = null;
    let domainAgeFlag = null;
    if (data.expires_at) {
      // expires_at is in the future; registration date can be inferred
      // We can't get exact registration from this API, but we can flag very new domains
      // if expires_at is within 1-2 years of now, the domain is likely new
      const expires = new Date(data.expires_at);
      const now = new Date();
      const monthsUntilExpiry = (expires - now) / (1000 * 60 * 60 * 24 * 30);
      if (monthsUntilExpiry < 6) {
        domainAgeFlag = 'Domínio expira em menos de 6 meses — verificar renovação';
      }
    }
    
    return {
      domain,
      isBr: true,
      status: data.status || 'UNKNOWN', // REGISTERED or AVAILABLE
      fqdn: data.fqdn,
      expiresAt: data.expires_at || null,
      domainAgeMonths,
      domainAgeFlag,
      registered: data.status === 'REGISTERED'
    };
  } else {
    // For international domains, do a HEAD request to check if site is online
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`https://${domain}`, { 
        method: 'HEAD', 
        signal: controller.signal,
        redirect: 'follow'
      });
      clearTimeout(timeoutId);
      return {
        domain,
        isBr: false,
        status: res.ok ? 'ONLINE' : 'OFFLINE',
        httpStatus: res.status
      };
    } catch (e) {
      return { domain, isBr: false, status: 'OFFLINE', error: e.message };
    }
  }
}

async function handleCnae(cnaeFiscal) {
  const s = String(cnaeFiscal).padStart(7, '0');
  const formatted = `${s.slice(0,2)}.${s.slice(2,4)}-${s.slice(4,5)}/${s.slice(5,7)}`;
  const divisao = s.slice(0, 2);
  
  // BrasilAPI CNAE v2 endpoint is unreliable — generate hierarchy from code structure
  // Division (2 digits), Group (3 digits), Class (5 digits), Subclass (7 digits)
  // Known sections mapping (first 2 digits → section letter)
  const DIVISAO_SECAO = {
    '01':'A','02':'A','03':'A','05':'B','06':'B','07':'B','08':'B','09':'B',
    '10':'C','11':'C','12':'C','13':'C','14':'C','15':'C','16':'C','17':'C','18':'C','19':'C',
    '20':'C','21':'C','22':'C','23':'C','24':'C','25':'C','26':'C','27':'C','28':'C','29':'C',
    '30':'C','31':'C','32':'C','33':'C','35':'D','36':'E','37':'E','38':'E','39':'E',
    '41':'F','42':'F','43':'F','45':'G','46':'G','47':'G','49':'H','50':'H','51':'H','52':'H','53':'H',
    '55':'I','56':'I','58':'J','59':'J','60':'J','61':'J','62':'J','63':'J',
    '64':'K','65':'K','66':'K','68':'L','69':'M','70':'M','71':'M','72':'M','73':'M','74':'M','75':'M',
    '77':'N','78':'N','79':'N','80':'N','81':'N','82':'N','84':'O','85':'P',
    '86':'Q','87':'Q','88':'Q','90':'R','91':'R','92':'R','93':'R','94':'S','95':'S','96':'S','97':'T','99':'U'
  };
  const SECAO_NOMES = {
    'A':'Agricultura','B':'Indústrias extrativas','C':'Indústrias de transformação',
    'D':'Eletricidade e gás','E':'Água e esgoto','F':'Construção',
    'G':'Comércio','H':'Transporte','I':'Alojamento e alimentação',
    'J':'Informação e comunicação','K':'Atividades financeiras','L':'Atividades imobiliárias',
    'M':'Atividades profissionais','N':'Atividades administrativas','O':'Administração pública',
    'P':'Educação','Q':'Saúde','R':'Artes e cultura','S':'Outras atividades de serviços',
    'T':'Serviços domésticos','U':'Organismos internacionais'
  };
  
  const secaoId = DIVISAO_SECAO[divisao] || '?';
  const secaoNome = SECAO_NOMES[secaoId] || 'Não classificado';
  
  return {
    code: cnaeFiscal,
    formatted,
    divisao: { id: divisao, descricao: `Divisão ${divisao}` },
    secao: { id: secaoId, descricao: `Seção ${secaoId} — ${secaoNome}` },
    grupo: { id: s.slice(0, 3), descricao: `Grupo ${s.slice(0, 3)}` },
    hierarquia: `Seção ${secaoId} — ${secaoNome} → Divisão ${divisao} → Classe ${formatted}`
  };
}

async function handleBanks(codigo) {
  const res = await fetch(`https://brasilapi.com.br/api/banks/v1/${codigo}`);
  if (res.status === 404) return { valid: false, error: 'Código de banco não encontrado' };
  if (!res.ok) return { valid: false, error: `HTTP ${res.status}` };
  const data = await res.json();
  return { valid: true, code: data.code, name: data.name, fullName: data.fullName, ispb: data.ispb };
}

async function handleDnsMx(domain) {
  try {
    const records = await Deno.resolveDns(domain, 'MX');
    if (records && records.length > 0) {
      return {
        valid: true,
        domain,
        records: records.map(r => ({ exchange: r.exchange, preference: r.preference }))
      };
    }
    return { valid: false, domain, error: 'Nenhum registro MX encontrado — domínio não aceita e-mails' };
  } catch (e) {
    return { valid: false, domain, error: `Erro DNS: ${e.message}` };
  }
}

async function handleIbgeEstados() {
  const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
  if (!res.ok) {
    // Fallback: static list
    return { states: [
      {sigla:'AC',nome:'Acre'},{sigla:'AL',nome:'Alagoas'},{sigla:'AM',nome:'Amazonas'},
      {sigla:'AP',nome:'Amapá'},{sigla:'BA',nome:'Bahia'},{sigla:'CE',nome:'Ceará'},
      {sigla:'DF',nome:'Distrito Federal'},{sigla:'ES',nome:'Espírito Santo'},{sigla:'GO',nome:'Goiás'},
      {sigla:'MA',nome:'Maranhão'},{sigla:'MG',nome:'Minas Gerais'},{sigla:'MS',nome:'Mato Grosso do Sul'},
      {sigla:'MT',nome:'Mato Grosso'},{sigla:'PA',nome:'Pará'},{sigla:'PB',nome:'Paraíba'},
      {sigla:'PE',nome:'Pernambuco'},{sigla:'PI',nome:'Piauí'},{sigla:'PR',nome:'Paraná'},
      {sigla:'RJ',nome:'Rio de Janeiro'},{sigla:'RN',nome:'Rio Grande do Norte'},{sigla:'RO',nome:'Rondônia'},
      {sigla:'RR',nome:'Roraima'},{sigla:'RS',nome:'Rio Grande do Sul'},{sigla:'SC',nome:'Santa Catarina'},
      {sigla:'SE',nome:'Sergipe'},{sigla:'SP',nome:'São Paulo'},{sigla:'TO',nome:'Tocantins'}
    ], source: 'fallback' };
  }
  const data = await res.json();
  return {
    states: data.map(s => ({ id: s.id, sigla: s.sigla, nome: s.nome })),
    source: 'ibge'
  };
}

async function handleValidateEmail(email, emailReceitaFederal) {
  if (!email || !email.includes('@')) {
    return { valid: false, error: 'Formato de e-mail inválido' };
  }
  
  const domain = email.split('@')[1].toLowerCase();
  const result = {
    email,
    domain,
    formatValid: true,
    mxValid: null,
    isFreeProvider: FREE_EMAIL_PROVIDERS.includes(domain),
    freeProviderWarning: null,
    domainMatchReceita: null
  };
  
  // DNS MX lookup
  const mx = await handleDnsMx(domain);
  result.mxValid = mx.valid;
  if (!mx.valid) {
    result.mxError = mx.error;
  }
  
  // Free provider warning
  if (result.isFreeProvider) {
    result.freeProviderWarning = 'Recomendamos usar um e-mail corporativo (@suaempresa.com.br) para facilitar o contato.';
  }
  
  // Cross-reference with Receita Federal email
  if (emailReceitaFederal && emailReceitaFederal.includes('@')) {
    const receitaDomain = emailReceitaFederal.split('@')[1].toLowerCase();
    result.domainMatchReceita = domain === receitaDomain;
    if (!result.domainMatchReceita) {
      result.domainMismatchNote = `Domínio do e-mail (${domain}) difere do e-mail registrado na Receita (${receitaDomain})`;
    }
  }
  
  return result;
}

async function handleValidatePhone(phone, empresaUf) {
  const cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return { valid: false, error: 'Telefone deve ter pelo menos 10 dígitos' };
  }
  
  const ddd = cleanPhone.substring(0, 2);
  const dddResult = await handleDdd(ddd);
  
  const result = {
    phone: cleanPhone,
    ddd,
    dddValid: dddResult.valid,
    state: dddResult.state || null,
    geoConsistent: null
  };
  
  if (!dddResult.valid) {
    result.error = dddResult.error;
    return result;
  }
  
  // Cross-reference UF
  if (empresaUf) {
    result.geoConsistent = dddResult.state === empresaUf.toUpperCase();
    if (!result.geoConsistent) {
      result.geoWarning = `Telefone com DDD ${ddd} (${dddResult.state}) difere da UF da empresa (${empresaUf})`;
    }
  }
  
  return result;
}

Deno.serve(async (req) => {
  try {
    // This function is called from PUBLIC compliance pages (unauthenticated clients).
    // No auth required — it only proxies external APIs (ViaCEP, BrasilAPI, DNS).
    const body = await req.json();
    const { action } = body;
    
    switch (action) {
      case 'viacep':
        return Response.json(await handleViaCep(body.cep));
      
      case 'ddd':
        return Response.json(await handleDdd(body.ddd));
      
      case 'registrobr':
        return Response.json(await handleRegistroBr(body.dominio));
      
      case 'cnae':
        return Response.json(await handleCnae(body.cnaeFiscal));
      
      case 'banks':
        return Response.json(await handleBanks(body.codigo));
      
      case 'dnsMx':
        return Response.json(await handleDnsMx(body.domain));
      
      case 'ibgeEstados':
        return Response.json(await handleIbgeEstados());
      
      case 'validateEmail':
        return Response.json(await handleValidateEmail(body.email, body.emailReceitaFederal));
      
      case 'validatePhone':
        return Response.json(await handleValidatePhone(body.phone, body.empresaUf));
      
      default:
        return Response.json({ error: `Ação '${action}' não reconhecida` }, { status: 400 });
    }
  } catch (error) {
    console.error('complianceValidations error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});