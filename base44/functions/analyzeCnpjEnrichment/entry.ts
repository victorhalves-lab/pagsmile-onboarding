import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * analyzeCnpjEnrichment — Fase 3 do roadmap de Compliance
 * 
 * Processa dados CNPJ (da BrasilAPI) e gera 8 pontos de enriquecimento:
 * 1. Idade da empresa (anos)
 * 2. Situação especial (Receita Federal)
 * 3. Simples Nacional (optante?)
 * 4. MEI (optante?)
 * 5. QSA cross-ref (sócios × base PagSmile)
 * 6. Consistência domínio e-mail vs site declarado
 * 7. Consistência geográfica UF vs DDD do telefone
 * 8. Score de risco automatizado (0-100)
 * 
 * Pode processar 1 ou mais CNPJs (array).
 * Retorna array de resultados com score individual + score consolidado.
 */

// Mapa DDD → UF(s) para validação geográfica
const DDD_UF_MAP = {
  '11': ['SP'], '12': ['SP'], '13': ['SP'], '14': ['SP'], '15': ['SP'], '16': ['SP'], '17': ['SP'], '18': ['SP'], '19': ['SP'],
  '21': ['RJ'], '22': ['RJ'], '24': ['RJ'],
  '27': ['ES'], '28': ['ES'],
  '31': ['MG'], '32': ['MG'], '33': ['MG'], '34': ['MG'], '35': ['MG'], '37': ['MG'], '38': ['MG'],
  '41': ['PR'], '42': ['PR'], '43': ['PR'], '44': ['PR'], '45': ['PR'], '46': ['PR'],
  '47': ['SC'], '48': ['SC'], '49': ['SC'],
  '51': ['RS'], '53': ['RS'], '54': ['RS'], '55': ['RS'],
  '61': ['DF', 'GO'], '62': ['GO'], '63': ['TO'], '64': ['GO'],
  '65': ['MT'], '66': ['MT'], '67': ['MS'],
  '68': ['AC'], '69': ['RO'],
  '71': ['BA'], '73': ['BA'], '74': ['BA'], '75': ['BA'], '77': ['BA', 'TO'],
  '79': ['SE'],
  '81': ['PE'], '82': ['AL'], '83': ['PB'], '84': ['RN'], '85': ['CE'], '86': ['PI'], '87': ['PE'], '88': ['CE'],
  '89': ['PI'],
  '91': ['PA'], '92': ['AM'], '93': ['PA'], '94': ['PA'], '95': ['RR'], '96': ['AP'], '97': ['AM'], '98': ['MA'], '99': ['MA']
};

// CNAEs de alto risco (jogos, armas, tabaco, cripto, forex, etc.)
const HIGH_RISK_CNAES = [
  '9200301', '9200302', '9200399', // Jogos de azar
  '4789004', // Comércio de armas
  '1220401', '1220402', // Tabaco
  '6499999', // Atividades financeiras não especificadas
  '6619302', // Câmbio
  '6622300', // Corretoras
];

function analyzeCompanyAge(dataInicioAtividade) {
  if (!dataInicioAtividade) return { anos: null, riskPoints: 15, flag: 'Data de início não disponível' };
  
  const inicio = new Date(dataInicioAtividade);
  const agora = new Date();
  const anos = Math.floor((agora - inicio) / (365.25 * 24 * 60 * 60 * 1000));
  
  if (anos < 1) return { anos, riskPoints: 25, flag: `Empresa muito nova (${anos < 1 ? 'menos de 1 ano' : anos + ' ano'})` };
  if (anos < 2) return { anos, riskPoints: 15, flag: `Empresa recente (${anos} ano${anos > 1 ? 's' : ''})` };
  if (anos < 5) return { anos, riskPoints: 5, flag: null };
  return { anos, riskPoints: 0, flag: null };
}

function analyzeSituacaoEspecial(situacaoEspecial) {
  if (!situacaoEspecial || situacaoEspecial === '' || situacaoEspecial === 'null') {
    return { hasSituacao: false, riskPoints: 0, flag: null };
  }
  return { hasSituacao: true, riskPoints: 30, flag: `Situação especial: ${situacaoEspecial}` };
}

function analyzeSimplesNacional(optante) {
  // Simples Nacional não é negativo; útil para contexto
  return { optante: !!optante, riskPoints: 0, flag: null, info: optante ? 'Optante do Simples Nacional' : 'Não optante do Simples Nacional' };
}

function analyzeMEI(optante, capitalSocial, tpvDeclarado) {
  if (!optante) return { optante: false, riskPoints: 0, flag: null };
  
  // MEI com TPV alto é red flag
  const flags = [];
  let riskPoints = 5; // Leve risco por ser MEI (estrutura limitada)
  
  if (tpvDeclarado && tpvDeclarado > 81000 / 12) { // Limite MEI ~R$81k/ano = ~R$6.750/mês
    riskPoints += 25;
    flags.push(`MEI com TPV declarado (R$${tpvDeclarado.toLocaleString('pt-BR')}/mês) acima do limite legal`);
  }
  
  return { optante: true, riskPoints, flag: flags.length > 0 ? flags.join('; ') : 'Optante MEI — verificar limites de faturamento' };
}

function analyzeQSA(qsa, existingMerchants) {
  if (!qsa || qsa.length === 0) return { totalSocios: 0, crossMatches: [], riskPoints: 10, flag: 'QSA vazio — verificar estrutura societária' };
  
  const crossMatches = [];
  
  if (existingMerchants && existingMerchants.length > 0) {
    for (const socio of qsa) {
      const nome = (socio.nome_socio || '').toLowerCase().trim();
      const cpfCnpj = (socio.cnpj_cpf_do_socio || '').replace(/\D/g, '');
      
      for (const merchant of existingMerchants) {
        const mNome = (merchant.fullName || '').toLowerCase().trim();
        const mDoc = (merchant.cpfCnpj || '').replace(/\D/g, '');
        
        if ((cpfCnpj && mDoc && cpfCnpj === mDoc) || (nome && mNome && nome === mNome)) {
          crossMatches.push({
            socio: socio.nome_socio,
            merchantId: merchant.id,
            merchantName: merchant.fullName,
            qualificacao: socio.qualificacao_socio
          });
        }
      }
    }
  }
  
  return {
    totalSocios: qsa.length,
    crossMatches,
    riskPoints: crossMatches.length > 0 ? 10 : 0,
    flag: crossMatches.length > 0 
      ? `${crossMatches.length} sócio(s) encontrado(s) na base PagSmile: ${crossMatches.map(m => m.socio).join(', ')}` 
      : null
  };
}

function analyzeEmailDomain(emailReceita, siteDeclared) {
  if (!emailReceita) return { consistent: null, riskPoints: 5, flag: 'E-mail da Receita não disponível' };
  
  const emailDomain = emailReceita.split('@')[1]?.toLowerCase();
  if (!emailDomain) return { consistent: null, riskPoints: 5, flag: 'Domínio de e-mail inválido' };
  
  const freeEmails = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'yahoo.com.br', 'bol.com.br', 'uol.com.br', 'terra.com.br', 'ig.com.br', 'live.com'];
  
  if (freeEmails.includes(emailDomain)) {
    return { consistent: false, riskPoints: 10, flag: 'E-mail corporativo usa provedor gratuito (Gmail, Hotmail, etc.)' };
  }
  
  if (siteDeclared) {
    const siteClean = siteDeclared.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '').toLowerCase();
    if (emailDomain === siteClean || siteClean.endsWith(emailDomain)) {
      return { consistent: true, riskPoints: 0, flag: null };
    } else {
      return { consistent: false, riskPoints: 8, flag: `Domínio do e-mail (${emailDomain}) difere do site declarado (${siteClean})` };
    }
  }
  
  return { consistent: null, riskPoints: 0, flag: null };
}

function analyzeGeographicConsistency(uf, telefone) {
  if (!uf || !telefone) return { consistent: null, riskPoints: 0, flag: null };
  
  const ddd = telefone.replace(/\D/g, '').substring(0, 2);
  if (!ddd || ddd.length < 2) return { consistent: null, riskPoints: 0, flag: null };
  
  const expectedUFs = DDD_UF_MAP[ddd];
  if (!expectedUFs) return { consistent: null, riskPoints: 0, flag: `DDD ${ddd} não mapeado` };
  
  if (expectedUFs.includes(uf)) {
    return { consistent: true, riskPoints: 0, flag: null };
  } else {
    return { consistent: false, riskPoints: 8, flag: `UF registrada (${uf}) inconsistente com DDD do telefone (${ddd} → ${expectedUFs.join('/')})` };
  }
}

function calculateOverallRiskScore(enrichmentResults) {
  // Soma dos risk points individuais, máximo 100
  let totalRiskPoints = 0;
  const flags = [];
  
  for (const result of Object.values(enrichmentResults)) {
    if (result && typeof result.riskPoints === 'number') {
      totalRiskPoints += result.riskPoints;
    }
    if (result && result.flag) {
      flags.push(result.flag);
    }
  }
  
  // Score invertido: 100 = sem risco, 0 = máximo risco
  const score = Math.max(0, Math.min(100, 100 - totalRiskPoints));
  
  let riskLevel;
  if (score >= 80) riskLevel = 'BAIXO';
  else if (score >= 60) riskLevel = 'MEDIO';
  else if (score >= 40) riskLevel = 'ALTO';
  else riskLevel = 'CRITICO';
  
  return { score, riskLevel, totalRiskPoints, flags };
}

function analyzeCnaeRisk(cnaeFiscal, cnaesSecundarios) {
  const allCnaes = [String(cnaeFiscal), ...(cnaesSecundarios || []).map(c => String(c.codigo))];
  const highRiskMatches = allCnaes.filter(c => HIGH_RISK_CNAES.includes(c));
  
  if (highRiskMatches.length > 0) {
    return { riskPoints: 20, flag: `CNAE(s) de alto risco: ${highRiskMatches.join(', ')}` };
  }
  return { riskPoints: 0, flag: null };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // This function is called from PUBLIC compliance pages (unauthenticated clients)
    // as well as from admin pages. Do NOT require auth — use asServiceRole for entity access.

    const body = await req.json();
    const { cnpjDataArray, tpvDeclarado, siteDeclared, onboardingCaseId } = body;
    
    // Aceita um único objeto ou array
    const dataList = Array.isArray(cnpjDataArray) ? cnpjDataArray : [cnpjDataArray];
    
    if (!dataList.length || !dataList[0]) {
      return Response.json({ error: 'cnpjDataArray é obrigatório' }, { status: 400 });
    }

    // Buscar merchants existentes para cross-ref QSA
    let existingMerchants = [];
    try {
      existingMerchants = await base44.asServiceRole.entities.Merchant.filter({});
    } catch (e) {
      console.warn('Não foi possível carregar merchants para cross-ref:', e.message);
    }

    const results = [];
    
    for (const cnpjData of dataList) {
      // 1. Idade da empresa
      const companyAge = analyzeCompanyAge(cnpjData.data_inicio_atividade);
      
      // 2. Situação especial
      const situacaoEspecial = analyzeSituacaoEspecial(cnpjData.situacao_especial);
      
      // 3. Simples Nacional
      const simplesNacional = analyzeSimplesNacional(cnpjData.opcao_pelo_simples);
      
      // 4. MEI
      const mei = analyzeMEI(cnpjData.opcao_pelo_mei, cnpjData.capital_social, tpvDeclarado);
      
      // 5. QSA cross-ref
      const qsaAnalysis = analyzeQSA(cnpjData.qsa, existingMerchants);
      
      // 6. Consistência domínio e-mail
      const emailDomain = analyzeEmailDomain(cnpjData.email, siteDeclared || cnpjData.site_sugerido);
      
      // 7. Consistência geográfica
      const geoConsistency = analyzeGeographicConsistency(
        cnpjData.endereco?.uf || cnpjData.uf,
        cnpjData.telefone || cnpjData.ddd_telefone_1
      );
      
      // Bônus: CNAE de alto risco
      const cnaeRisk = analyzeCnaeRisk(cnpjData.cnae_fiscal, cnpjData.cnaes_secundarios);
      
      // 8. Score consolidado
      const enrichment = {
        companyAge,
        situacaoEspecial,
        simplesNacional,
        mei,
        qsaAnalysis,
        emailDomain,
        geoConsistency,
        cnaeRisk
      };
      
      const overallScore = calculateOverallRiskScore(enrichment);
      
      results.push({
        cnpj: cnpjData.cnpj || 'N/A',
        razaoSocial: cnpjData.razao_social || '',
        enrichment,
        overallScore
      });
    }

    // Score consolidado (média ponderada se múltiplos CNPJs)
    const avgScore = results.length > 0 
      ? Math.round(results.reduce((sum, r) => sum + r.overallScore.score, 0) / results.length)
      : 0;
    
    const allFlags = results.flatMap(r => r.overallScore.flags);
    
    const consolidatedResult = {
      results,
      consolidated: {
        averageScore: avgScore,
        riskLevel: avgScore >= 80 ? 'BAIXO' : avgScore >= 60 ? 'MEDIO' : avgScore >= 40 ? 'ALTO' : 'CRITICO',
        totalFlags: allFlags.length,
        flags: allFlags,
        analyzedAt: new Date().toISOString(),
        cnpjCount: results.length
      }
    };

    // Se onboardingCaseId fornecido, salvar resultado no ComplianceScore
    if (onboardingCaseId) {
      try {
        const existing = await base44.asServiceRole.entities.ComplianceScore.filter({ onboarding_case_id: onboardingCaseId });
        
        const scoreData = {
          onboarding_case_id: onboardingCaseId,
          score_questionario: avgScore * 10, // Escala 0-1000
          classificacao_questionario: consolidatedResult.consolidated.riskLevel,
          red_flags: allFlags,
          pontos_atencao: allFlags.filter(f => !f.includes('CNAE') && !f.includes('Situação especial')),
          pontos_positivos: results.flatMap(r => {
            const positives = [];
            if (r.enrichment.companyAge.anos >= 5) positives.push(`Empresa com ${r.enrichment.companyAge.anos} anos de atividade`);
            if (r.enrichment.emailDomain.consistent === true) positives.push('Domínio de e-mail consistente com site');
            if (r.enrichment.geoConsistency.consistent === true) positives.push('UF consistente com DDD do telefone');
            if (!r.enrichment.situacaoEspecial.hasSituacao) positives.push('Sem situação especial na Receita');
            return positives;
          }),
          fase_1_completa: true,
          data_analise_fase_1: new Date().toISOString(),
          sumario_executivo: `Análise de enriquecimento CNPJ: Score ${avgScore}/100 (${consolidatedResult.consolidated.riskLevel}). ${allFlags.length} flag(s) identificada(s).`
        };
        
        if (existing.length > 0) {
          await base44.asServiceRole.entities.ComplianceScore.update(existing[0].id, scoreData);
        } else {
          await base44.asServiceRole.entities.ComplianceScore.create(scoreData);
        }
      } catch (e) {
        console.warn('Erro ao salvar ComplianceScore:', e.message);
      }
    }

    return Response.json(consolidatedResult);
    
  } catch (error) {
    console.error('Erro em analyzeCnpjEnrichment:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});