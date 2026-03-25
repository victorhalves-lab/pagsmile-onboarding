import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

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
  // Convert integer to formatted code: 6201500 → 6201-5/00
  const s = String(cnaeFiscal).padStart(7, '0');
  // BrasilAPI expects: XXXX-X/XX format (without dot before group)
  const formatted = `${s.slice(0,4)}-${s.slice(4,5)}/${s.slice(5,7)}`;
  
  const res = await fetch(`https://brasilapi.com.br/api/cnae/v2/${formatted}`);
  if (!res.ok) {
    // Try alternative format with dot: XX.XX-X/XX
    const altFormatted = `${s.slice(0,2)}.${s.slice(2,4)}-${s.slice(4,5)}/${s.slice(5,7)}`;
    const res2 = await fetch(`https://brasilapi.com.br/api/cnae/v2/${altFormatted}`);
    if (!res2.ok) return { code: cnaeFiscal, formatted, error: `CNAE não encontrado` };
    const data2 = await res2.json();
    return {
      code: cnaeFiscal, formatted: altFormatted,
      descricao: data2.descricao || '',
      grupo: data2.grupo ? { id: data2.grupo.id, descricao: data2.grupo.descricao } : null,
      divisao: data2.divisao ? { id: data2.divisao.id, descricao: data2.divisao.descricao } : null,
      secao: data2.secao ? { id: data2.secao.id, descricao: data2.secao.descricao } : null
    };
  }
  const data = await res.json();
  return {
    code: cnaeFiscal,
    formatted,
    descricao: data.descricao || '',
    grupo: data.grupo ? { id: data.grupo.id, descricao: data.grupo.descricao } : null,
    divisao: data.divisao ? { id: data.divisao.id, descricao: data.divisao.descricao } : null,
    secao: data.secao ? { id: data.secao.id, descricao: data.secao.descricao } : null
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
    const base44 = createClientFromRequest(req);
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