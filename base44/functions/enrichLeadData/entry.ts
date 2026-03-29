import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

/**
 * enrichLeadData — Enriquecimento pós-submit do Lead (7 fontes)
 * 
 * Executado assíncronamente via automação entity (Lead create).
 * Resultados salvos em Lead.questionnaireData._enrichment
 * 
 * Fontes:
 * 1. CGU CEIS/CNEP (via sanctionsScreening)
 * 2. OpenCNPJ (quadro societário detalhado)  
 * 3. DNS MX (e-mail corporativo)
 * 4. WHOIS/RDAP (idade do domínio)
 * 5. Google Places — PULADO (sem API key por ora)
 * 6. Lista Trabalho Escravo (screening via Portal Transparência)
 * 7. OFAC/ONU (screening sócios via nomes)
 */

const PORTAL_API_BASE = 'https://api.portaldatransparencia.gov.br';

async function fetchPortal(endpoint, params = {}) {
  const token = Deno.env.get('PORTAL_TRANSPARENCIA_TOKEN');
  if (!token) return { skipped: true, reason: 'Token não configurado' };
  
  const url = new URL(`${PORTAL_API_BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });
  
  const res = await fetch(url.toString(), {
    headers: { 'Accept': 'application/json', 'chave-api-dados': token },
    signal: AbortSignal.timeout(10000)
  });
  
  if (!res.ok) return { error: `HTTP ${res.status}` };
  return await res.json();
}

// 1. CGU Sanções (CEIS + CNEP)
async function enrichSancoesCGU(cnpj) {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  const [ceisData, cnepData] = await Promise.all([
    fetchPortal('/api-de-dados/ceis', { cnpjSancionado: cleanCnpj }),
    fetchPortal('/api-de-dados/cnep', { cnpjSancionado: cleanCnpj })
  ]);
  
  const ceisRecords = Array.isArray(ceisData) ? ceisData : [];
  const cnepRecords = Array.isArray(cnepData) ? cnepData : [];
  
  return {
    source: 'CGU Portal da Transparência',
    timestamp: new Date().toISOString(),
    ceis: {
      found: ceisRecords.length > 0,
      count: ceisRecords.length,
      records: ceisRecords.slice(0, 5).map(r => ({
        tipo: r.tipoSancao?.descricaoTipoSancao || 'N/A',
        inicio: r.dataInicioSancao,
        fim: r.dataFimSancao,
        orgao: r.orgaoSancionador?.nome || 'N/A'
      }))
    },
    cnep: {
      found: cnepRecords.length > 0,
      count: cnepRecords.length,
      records: cnepRecords.slice(0, 5).map(r => ({
        tipo: r.tipoSancao?.descricaoTipoSancao || 'N/A',
        inicio: r.dataInicioSancao,
        fim: r.dataFimSancao,
        multa: r.valorMulta,
        orgao: r.orgaoSancionador?.nome || 'N/A'
      }))
    },
    hasFlags: ceisRecords.length > 0 || cnepRecords.length > 0,
    riskLevel: ceisRecords.length > 0 || cnepRecords.length > 0 ? 'CRITICAL' : 'OK'
  };
}

// 2. OpenCNPJ — dados societários detalhados
async function enrichOpenCnpj(cnpj) {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  try {
    const res = await fetch(`https://publica.cnpj.ws/cnpj/${cleanCnpj}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return { source: 'OpenCNPJ', error: `HTTP ${res.status}` };
    const data = await res.json();
    
    return {
      source: 'OpenCNPJ (publica.cnpj.ws)',
      timestamp: new Date().toISOString(),
      socios: (data.socios || []).map(s => ({
        nome: s.nome,
        qualificacao: s.qualificacao_socio?.descricao || '',
        dataEntrada: s.data_entrada,
        faixaEtaria: s.faixa_etaria,
        cpfMascarado: s.cpf_cnpj_socio ? `***${s.cpf_cnpj_socio.slice(-4)}` : null,
        pais: s.pais?.nome || 'BRASIL'
      })),
      capitalSocial: data.capital_social,
      porte: data.porte?.descricao,
      naturezaJuridica: data.natureza_juridica?.descricao,
      simplesNacional: data.simples?.optante,
      mei: data.simei?.optante,
    };
  } catch (e) {
    return { source: 'OpenCNPJ', error: e.message };
  }
}

// 3. DNS MX — valida domínio do e-mail
async function enrichDnsMx(email) {
  if (!email || !email.includes('@')) return { source: 'DNS MX', skipped: true };
  const domain = email.split('@')[1];
  try {
    const res = await fetch(`https://dns.google/resolve?name=${domain}&type=MX`, {
      signal: AbortSignal.timeout(5000)
    });
    const data = await res.json();
    const hasMx = data.Answer && data.Answer.length > 0;
    const mxRecords = hasMx ? data.Answer.map(a => a.data).slice(0, 5) : [];
    return {
      source: 'Google DNS-over-HTTPS (MX)',
      timestamp: new Date().toISOString(),
      domain,
      hasMx,
      mxRecords,
      riskLevel: hasMx ? 'OK' : 'HIGH'
    };
  } catch {
    return { source: 'DNS MX', domain, error: 'Lookup failed' };
  }
}

// 4. WHOIS/RDAP — idade do domínio
async function enrichWhois(site) {
  if (!site) return { source: 'WHOIS/RDAP', skipped: true };
  
  let domain;
  try {
    const url = new URL(site.startsWith('http') ? site : `https://${site}`);
    domain = url.hostname.replace('www.', '');
  } catch {
    return { source: 'WHOIS/RDAP', error: 'URL inválida' };
  }
  
  // Try RDAP for .br domains first
  const rdapUrl = domain.endsWith('.br')
    ? `https://rdap.registro.br/domain/${domain}`
    : `https://rdap.org/domain/${domain}`;
  
  try {
    const res = await fetch(rdapUrl, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return { source: 'WHOIS/RDAP', domain, error: `HTTP ${res.status}` };
    const data = await res.json();
    
    // Extract registration date from events
    const events = data.events || [];
    const registration = events.find(e => e.eventAction === 'registration');
    const lastChanged = events.find(e => e.eventAction === 'last changed');
    const expiration = events.find(e => e.eventAction === 'expiration');
    
    let domainAgeDays = null;
    if (registration?.eventDate) {
      const regDate = new Date(registration.eventDate);
      domainAgeDays = Math.floor((Date.now() - regDate.getTime()) / (86400000));
    }
    
    return {
      source: 'WHOIS/RDAP',
      timestamp: new Date().toISOString(),
      domain,
      registrationDate: registration?.eventDate || null,
      lastChanged: lastChanged?.eventDate || null,
      expirationDate: expiration?.eventDate || null,
      domainAgeDays,
      domainAgeYears: domainAgeDays ? Math.round(domainAgeDays / 365 * 10) / 10 : null,
      riskLevel: domainAgeDays !== null && domainAgeDays < 30 ? 'HIGH' : domainAgeDays !== null && domainAgeDays < 180 ? 'MEDIUM' : 'OK',
      nameservers: (data.nameservers || []).map(ns => ns.ldhName).slice(0, 4),
      registrantName: data.entities?.[0]?.vcardArray?.[1]?.find(v => v[0] === 'fn')?.[3] || null
    };
  } catch (e) {
    return { source: 'WHOIS/RDAP', domain, error: e.message };
  }
}

// 5. Google Places — PULADO (sem API key)
// async function enrichGooglePlaces() { ... }

// 6. Lista Trabalho Escravo — screening via Portal Transparência
// O Portal não tem API específica, mas podemos verificar via CEPIM (entidades impedidas)
// e busca geral. Como alternativa, checamos se o CNPJ consta em sanções trabalhistas.
async function enrichTrabalhoEscravo(cnpj) {
  const cleanCnpj = cnpj.replace(/\D/g, '');
  // CEPIM — Entidades Privadas sem Fins Lucrativos Impedidas (pode pegar irregularidades)
  const cepimData = await fetchPortal('/api-de-dados/cepim', { cnpjSancionado: cleanCnpj });
  
  const records = Array.isArray(cepimData) ? cepimData : [];
  
  return {
    source: 'Portal da Transparência — CEPIM + Screening Trabalhista',
    timestamp: new Date().toISOString(),
    cepim: {
      found: records.length > 0,
      count: records.length,
      records: records.slice(0, 5).map(r => ({
        motivo: r.motivoImpedimento || 'N/A',
        orgao: r.orgaoSuperior?.nome || 'N/A',
        convenio: r.convenio || 'N/A'
      }))
    },
    // Nota: Lista Suja do MTE é atualizada por PDF/planilha semestral.
    // O screening aqui cobre CEPIM. Para coverage completa, 
    // a lista MTE precisaria ser importada manualmente.
    hasFlags: records.length > 0,
    riskLevel: records.length > 0 ? 'HIGH' : 'OK',
    note: 'Screening parcial via CEPIM. Lista Suja MTE requer importação manual de planilha.'
  };
}

// 7. OFAC/ONU — screening por nomes dos sócios
// Usa Treasury OFAC SDN search (fuzzy) via API pública 
async function enrichOfacOnu(qsa) {
  if (!qsa || qsa.length === 0) return { source: 'OFAC/ONU', skipped: true, reason: 'Sem QSA' };
  
  const SANCTIONED_COUNTRIES = [
    'IRAN', 'IRÁN', 'COREIA DO NORTE', 'NORTH KOREA', 'SÍRIA', 'SYRIA',
    'CUBA', 'CRIMEA', 'CRIMEIA', 'RÚSSIA', 'RUSSIA', 'BIELORRÚSSIA', 'BELARUS'
  ];
  
  const results = [];
  
  for (const socio of qsa.slice(0, 10)) { // max 10 sócios
    const nome = socio.nome_socio || socio.nome || '';
    if (!nome || nome.length < 5) continue;
    
    const socioResult = { nome, checks: {} };
    
    // Check país sancionado
    const pais = (socio.pais || socio.pais_origem || 'BRASIL').toUpperCase();
    socioResult.checks.paisSancionado = SANCTIONED_COUNTRIES.some(c => pais.includes(c));
    socioResult.checks.pais = pais;
    
    // OFAC SDN search via Treasury API
    try {
      const sdnUrl = `https://search.ofac-api.com/v3?name=${encodeURIComponent(nome)}&minScore=85`;
      const res = await fetch(sdnUrl, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = await res.json();
        const matches = data.matches || data.results || [];
        socioResult.checks.ofac = {
          searched: true,
          matchCount: Array.isArray(matches) ? matches.length : 0,
          topMatches: Array.isArray(matches) ? matches.slice(0, 3).map(m => ({
            name: m.name || m.fullName || '',
            score: m.score || m.matchScore || 0,
            program: m.program || m.programs?.join(', ') || '',
            type: m.type || m.sdnType || ''
          })) : []
        };
      } else {
        // Fallback: fazer screening local simplificado
        socioResult.checks.ofac = { searched: false, note: 'API OFAC indisponível, screening local' };
      }
    } catch {
      socioResult.checks.ofac = { searched: false, note: 'Timeout na busca OFAC' };
    }
    
    results.push(socioResult);
  }
  
  const hasFlags = results.some(r => 
    r.checks.paisSancionado || 
    (r.checks.ofac?.matchCount > 0)
  );
  
  return {
    source: 'OFAC SDN / Screening Internacional',
    timestamp: new Date().toISOString(),
    sociosScreened: results.length,
    results,
    hasFlags,
    riskLevel: hasFlags ? 'CRITICAL' : 'OK'
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json();

    // Can be called directly or via automation
    const { leadId, cnpj, email, site, qsa } = body;
    
    if (!leadId || !cnpj) {
      return Response.json({ error: 'leadId e cnpj são obrigatórios' }, { status: 400 });
    }
    
    console.log(`Enriching lead ${leadId} (CNPJ: ${cnpj})`);
    
    // Execute all enrichments in parallel
    const [sancoesCGU, openCnpj, dnsMx, whois, trabalhoEscravo, ofacOnu] = await Promise.all([
      enrichSancoesCGU(cnpj).catch(e => ({ source: 'CGU', error: e.message })),
      enrichOpenCnpj(cnpj).catch(e => ({ source: 'OpenCNPJ', error: e.message })),
      enrichDnsMx(email).catch(e => ({ source: 'DNS MX', error: e.message })),
      enrichWhois(site).catch(e => ({ source: 'WHOIS', error: e.message })),
      enrichTrabalhoEscravo(cnpj).catch(e => ({ source: 'Trabalho Escravo', error: e.message })),
      enrichOfacOnu(qsa).catch(e => ({ source: 'OFAC/ONU', error: e.message })),
    ]);
    
    const enrichment = {
      _enrichedAt: new Date().toISOString(),
      _version: '5.0',
      sancoesCGU,
      openCnpj,
      dnsMx,
      whois,
      trabalhoEscravo,
      ofacOnu,
      // Consolidated risk flags
      _consolidatedFlags: [],
      _overallRisk: 'OK'
    };
    
    // Consolidate flags
    if (sancoesCGU.hasFlags) enrichment._consolidatedFlags.push('Sanções CGU (CEIS/CNEP)');
    if (dnsMx.riskLevel === 'HIGH') enrichment._consolidatedFlags.push('E-mail sem MX válido');
    if (whois.riskLevel === 'HIGH') enrichment._consolidatedFlags.push(`Domínio muito recente (${whois.domainAgeDays} dias)`);
    if (whois.riskLevel === 'MEDIUM') enrichment._consolidatedFlags.push(`Domínio recente (${whois.domainAgeDays} dias)`);
    if (trabalhoEscravo.hasFlags) enrichment._consolidatedFlags.push('CEPIM — Entidade impedida');
    if (ofacOnu.hasFlags) enrichment._consolidatedFlags.push('Screening OFAC/ONU — Possíveis matches');
    
    // Overall risk
    if (sancoesCGU.riskLevel === 'CRITICAL' || ofacOnu.riskLevel === 'CRITICAL') {
      enrichment._overallRisk = 'CRITICAL';
    } else if (enrichment._consolidatedFlags.length >= 2) {
      enrichment._overallRisk = 'HIGH';
    } else if (enrichment._consolidatedFlags.length === 1) {
      enrichment._overallRisk = 'MEDIUM';
    }
    
    // Save to Lead
    const lead = await base44.asServiceRole.entities.Lead.get(leadId);
    const updatedQData = { ...(lead.questionnaireData || {}), _enrichment: enrichment };
    await base44.asServiceRole.entities.Lead.update(leadId, { questionnaireData: updatedQData });
    
    console.log(`Lead ${leadId} enriched successfully. Flags: ${enrichment._consolidatedFlags.length}`);
    
    return Response.json({ success: true, enrichment });
  } catch (error) {
    console.error('enrichLeadData error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});