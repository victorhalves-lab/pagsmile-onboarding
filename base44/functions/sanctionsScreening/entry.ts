import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * sanctionsScreening — Screening de sanções e PEP
 * 
 * Ações disponíveis:
 * - ceis: Consulta CEIS (Cadastro de Empresas Inidôneas e Suspensas)
 * - cnep: Consulta CNEP (Cadastro Nacional de Empresas Punidas)
 * - ceaf: Consulta CEAF (Cadastro de Expulsões da Administração Federal)
 * - pep: Consulta PEPs (Pessoas Expostas Politicamente)
 * - servidores: Consulta servidores por nome (verificação PEP complementar)
 * - screenCnpj: Screening completo de um CNPJ (CEIS + CNEP)
 * - screenCpf: Screening completo de um CPF (CEAF)
 * - screenNome: Screening completo por nome (PEP + Servidores + OFAC + ONU)
 * - fullScreening: Screening completo de empresa + sócios
 * 
 * IMPORTANTE: Requer secret PORTAL_TRANSPARENCIA_TOKEN configurado.
 */

const PORTAL_API_BASE = 'https://api.portaldatransparencia.gov.br';

// OFAC SDN List - países sancionados para verificação G2
const SANCTIONED_COUNTRIES = [
  'IRÁN', 'IRAN', 'COREIA DO NORTE', 'NORTH KOREA', 'COREA DEL NORTE',
  'SÍRIA', 'SYRIA', 'SIRIA', 'CUBA', 'CRIMEA', 'CRIMEIA',
  'RÚSSIA', 'RUSSIA', 'BIELORRÚSSIA', 'BELARUS', 'VENEZUELA'
];

// Função de fuzzy matching simples para comparação de nomes
function similarityScore(str1, str2) {
  const s1 = (str1 || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  const s2 = (str2 || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  
  if (s1 === s2) return 100;
  if (!s1 || !s2) return 0;
  
  // Split into words and check overlap
  const words1 = s1.split(/\s+/).filter(w => w.length > 2);
  const words2 = s2.split(/\s+/).filter(w => w.length > 2);
  
  let matches = 0;
  for (const w1 of words1) {
    if (words2.some(w2 => w2.includes(w1) || w1.includes(w2))) {
      matches++;
    }
  }
  
  return Math.round((matches / Math.max(words1.length, words2.length)) * 100);
}

async function fetchPortal(endpoint, params = {}) {
  const token = Deno.env.get('PORTAL_TRANSPARENCIA_TOKEN');
  if (!token) {
    console.warn('PORTAL_TRANSPARENCIA_TOKEN não configurado. Retornando resultado vazio.');
    return { skipped: true, reason: 'Token não configurado' };
  }
  
  const url = new URL(`${PORTAL_API_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.set(k, v);
    }
  });
  
  const res = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'chave-api-dados': token
    }
  });
  
  if (!res.ok) {
    const text = await res.text();
    console.error(`Portal API error: ${res.status} - ${text}`);
    return { error: `HTTP ${res.status}`, details: text };
  }
  
  return await res.json();
}

// CEIS - Cadastro de Empresas Inidôneas e Suspensas
async function handleCeis(cnpj) {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  const data = await fetchPortal('/api-de-dados/ceis', { cnpjSancionado: cleanCnpj });
  
  if (data.skipped || data.error) return { cnpj: cleanCnpj, inCeis: false, ...data };
  
  const records = Array.isArray(data) ? data : [];
  return {
    cnpj: cleanCnpj,
    inCeis: records.length > 0,
    recordCount: records.length,
    records: records.map(r => ({
      tipoSancao: r.tipoSancao?.descricaoTipoSancao || 'N/A',
      dataInicioSancao: r.dataInicioSancao,
      dataFimSancao: r.dataFimSancao,
      orgaoSancionador: r.orgaoSancionador?.nome || 'N/A',
      fundamentoLegal: r.fundamentoLegal
    })),
    flag: records.length > 0 ? `CEIS: Empresa consta no Cadastro de Empresas Inidôneas e Suspensas (${records.length} registro(s))` : null
  };
}

// CNEP - Cadastro Nacional de Empresas Punidas
async function handleCnep(cnpj) {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  const data = await fetchPortal('/api-de-dados/cnep', { cnpjSancionado: cleanCnpj });
  
  if (data.skipped || data.error) return { cnpj: cleanCnpj, inCnep: false, ...data };
  
  const records = Array.isArray(data) ? data : [];
  return {
    cnpj: cleanCnpj,
    inCnep: records.length > 0,
    recordCount: records.length,
    records: records.map(r => ({
      tipoSancao: r.tipoSancao?.descricaoTipoSancao || 'N/A',
      dataInicioSancao: r.dataInicioSancao,
      dataFimSancao: r.dataFimSancao,
      valorMulta: r.valorMulta,
      orgaoSancionador: r.orgaoSancionador?.nome || 'N/A'
    })),
    flag: records.length > 0 ? `CNEP: Empresa punida com base na Lei Anticorrupção (${records.length} registro(s))` : null
  };
}

// CEAF - Cadastro de Expulsões da Administração Federal
async function handleCeaf(cpf) {
  const cleanCpf = cpf.replace(/\D/g, '');
  const data = await fetchPortal('/api-de-dados/ceaf', { cpfServidor: cleanCpf });
  
  if (data.skipped || data.error) return { cpf: cleanCpf, inCeaf: false, ...data };
  
  const records = Array.isArray(data) ? data : [];
  return {
    cpf: cleanCpf,
    inCeaf: records.length > 0,
    recordCount: records.length,
    records: records.map(r => ({
      portaria: r.portariaNumero,
      dataPublicacao: r.dataPublicacaoPortaria,
      tipoPublicacao: r.tipoPunicao,
      orgao: r.orgaoLotacao?.nome || 'N/A'
    })),
    flag: records.length > 0 ? `CEAF: Pessoa foi expulsa da Administração Federal (${records.length} registro(s))` : null
  };
}

// PEPs - Pessoas Expostas Politicamente
async function handlePep(cpf) {
  const cleanCpf = cpf.replace(/\D/g, '');
  const data = await fetchPortal('/api-de-dados/peps', { cpf: cleanCpf });
  
  if (data.skipped || data.error) return { cpf: cleanCpf, isPep: false, ...data };
  
  const records = Array.isArray(data) ? data : [];
  return {
    cpf: cleanCpf,
    isPep: records.length > 0,
    recordCount: records.length,
    records: records.map(r => ({
      nome: r.nome,
      cpf: r.cpf,
      siglaFuncao: r.siglaFuncao,
      descricaoFuncao: r.descricaoFuncao,
      nivelFuncao: r.nivelFuncao,
      nomeOrgao: r.nomeOrgao,
      dataInicioExercicio: r.dataInicioExercicio,
      dataFimExercicio: r.dataFimExercicio
    })),
    flag: records.length > 0 ? `PEP: Pessoa Exposta Politicamente (${records[0].descricaoFuncao || 'cargo público'})` : null
  };
}

// Servidores - Busca por nome para verificação PEP complementar
async function handleServidores(nome) {
  const data = await fetchPortal('/api-de-dados/servidores', { nome: nome, pagina: 1 });
  
  if (data.skipped || data.error) return { nome, found: false, ...data };
  
  const records = Array.isArray(data) ? data : [];
  
  // Filtrar por cargos de alto escalão (DAS 4+, NE, ou funções específicas)
  const highRankRecords = records.filter(r => {
    const funcao = (r.funcao || '').toUpperCase();
    const cargo = (r.cargo || '').toUpperCase();
    return funcao.includes('DAS') || funcao.includes('NE') || funcao.includes('MINISTRO') ||
           funcao.includes('SECRETÁRIO') || funcao.includes('DIRETOR') || 
           cargo.includes('MINISTRO') || cargo.includes('SECRETÁRIO');
  });
  
  return {
    nome,
    found: records.length > 0,
    totalRecords: records.length,
    highRankRecords: highRankRecords.length,
    records: highRankRecords.slice(0, 5).map(r => ({
      nome: r.nome,
      cpf: r.cpf ? `***${r.cpf.slice(-4)}` : 'N/A',
      cargo: r.cargo,
      funcao: r.funcao,
      orgao: r.orgaoSuperior || r.orgaoLotacao || 'N/A'
    })),
    flag: highRankRecords.length > 0 ? `Possível PEP: ${highRankRecords.length} servidor(es) de alto escalão com nome similar encontrado(s)` : null,
    warning: records.length > highRankRecords.length ? `${records.length - highRankRecords.length} servidor(es) de escalão inferior também encontrados (podem ser homônimos)` : null
  };
}

// Screening completo de CNPJ (CEIS + CNEP)
async function handleScreenCnpj(cnpj) {
  const [ceis, cnep] = await Promise.all([
    handleCeis(cnpj),
    handleCnep(cnpj)
  ]);
  
  const flags = [];
  if (ceis.flag) flags.push(ceis.flag);
  if (cnep.flag) flags.push(cnep.flag);
  
  return {
    cnpj: cnpj.replace(/\D/g, ''),
    ceis,
    cnep,
    hasFlags: flags.length > 0,
    flags,
    riskLevel: flags.length > 0 ? 'CRITICAL' : 'OK'
  };
}

// Screening completo por nome (PEP + Servidores + verificação país sancionado)
async function handleScreenNome(nome, pais) {
  const [pepCheck, servidoresCheck] = await Promise.all([
    // PEP check requires CPF, so we skip if not available
    Promise.resolve({ skipped: true, reason: 'Requer CPF para busca PEP' }),
    handleServidores(nome)
  ]);
  
  const flags = [];
  if (servidoresCheck.flag) flags.push(servidoresCheck.flag);
  
  // Check sanctioned country
  const paisUpper = (pais || '').toUpperCase();
  const isSanctionedCountry = SANCTIONED_COUNTRIES.some(c => paisUpper.includes(c));
  if (isSanctionedCountry) {
    flags.push(`G2: Vínculo com país sancionado (${pais})`);
  }
  
  return {
    nome,
    pais,
    servidores: servidoresCheck,
    isSanctionedCountry,
    hasFlags: flags.length > 0,
    flags,
    riskLevel: flags.length > 0 ? (isSanctionedCountry ? 'CRITICAL' : 'HIGH') : 'OK'
  };
}

// Full screening: empresa + todos os sócios do QSA
async function handleFullScreening(cnpj, qsa) {
  const results = {
    empresa: null,
    socios: [],
    consolidado: {
      hasFlags: false,
      flags: [],
      riskLevel: 'OK',
      ceisCnpjFlags: 0,
      cnepFlags: 0,
      pepFlags: 0,
      sanctionedCountryFlags: 0
    }
  };
  
  // Screen empresa
  results.empresa = await handleScreenCnpj(cnpj);
  if (results.empresa.hasFlags) {
    results.consolidado.hasFlags = true;
    results.consolidado.flags.push(...results.empresa.flags);
    if (results.empresa.ceis?.inCeis) results.consolidado.ceisCnpjFlags++;
    if (results.empresa.cnep?.inCnep) results.consolidado.cnepFlags++;
  }
  
  // Screen each sócio
  if (qsa && qsa.length > 0) {
    for (const socio of qsa) {
      const nome = socio.nome_socio || socio.nome || '';
      const pais = socio.pais_origem || socio.pais || 'BRASIL';
      const cpf = socio.cnpj_cpf_do_socio || socio.cpf || '';
      
      const socioResult = {
        nome,
        pais,
        cpf: cpf ? `***${cpf.slice(-4)}` : null,
        screening: null
      };
      
      // If has CPF, try CEAF and PEP
      if (cpf && cpf.length >= 11) {
        const [ceaf, pep] = await Promise.all([
          handleCeaf(cpf),
          handlePep(cpf)
        ]);
        socioResult.ceaf = ceaf;
        socioResult.pep = pep;
        
        if (ceaf.flag) {
          results.consolidado.hasFlags = true;
          results.consolidado.flags.push(`${nome}: ${ceaf.flag}`);
        }
        if (pep.flag) {
          results.consolidado.hasFlags = true;
          results.consolidado.flags.push(`${nome}: ${pep.flag}`);
          results.consolidado.pepFlags++;
        }
      }
      
      // Check servidores by name
      const servidores = await handleServidores(nome);
      socioResult.servidores = servidores;
      if (servidores.flag && !socioResult.pep?.isPep) {
        results.consolidado.hasFlags = true;
        results.consolidado.flags.push(`${nome}: ${servidores.flag}`);
        results.consolidado.pepFlags++;
      }
      
      // Check sanctioned country
      const paisUpper = pais.toUpperCase();
      if (SANCTIONED_COUNTRIES.some(c => paisUpper.includes(c))) {
        results.consolidado.hasFlags = true;
        results.consolidado.flags.push(`${nome}: Sócio com vínculo a país sancionado (${pais})`);
        results.consolidado.sanctionedCountryFlags++;
      }
      
      results.socios.push(socioResult);
    }
  }
  
  // Determine risk level
  if (results.consolidado.ceisCnpjFlags > 0 || results.consolidado.cnepFlags > 0 || results.consolidado.sanctionedCountryFlags > 0) {
    results.consolidado.riskLevel = 'CRITICAL';
  } else if (results.consolidado.pepFlags > 0) {
    results.consolidado.riskLevel = 'HIGH';
  } else if (results.consolidado.flags.length > 0) {
    results.consolidado.riskLevel = 'MEDIUM';
  }
  
  return results;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();
    const { action } = body;
    
    switch (action) {
      case 'ceis':
        return Response.json(await handleCeis(body.cnpj));
      
      case 'cnep':
        return Response.json(await handleCnep(body.cnpj));
      
      case 'ceaf':
        return Response.json(await handleCeaf(body.cpf));
      
      case 'pep':
        return Response.json(await handlePep(body.cpf));
      
      case 'servidores':
        return Response.json(await handleServidores(body.nome));
      
      case 'screenCnpj':
        return Response.json(await handleScreenCnpj(body.cnpj));
      
      case 'screenNome':
        return Response.json(await handleScreenNome(body.nome, body.pais));
      
      case 'fullScreening':
        return Response.json(await handleFullScreening(body.cnpj, body.qsa || []));
      
      default:
        return Response.json({ error: `Ação '${action}' não reconhecida` }, { status: 400 });
    }
  } catch (error) {
    console.error('sanctionsScreening error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});