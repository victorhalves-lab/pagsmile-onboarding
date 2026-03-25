/**
 * Hook que calcula flags de risco SILENCIOSAS para o lead.
 * Estas flags NÃO são exibidas ao cliente — são salvas no questionnaireData
 * para análise posterior pela PRISCILA/IA e pelo time interno.
 */

export function computeSilentFlags(formData, questions, cnpjData) {
  const flags = [];
  
  // Helper: encontrar pergunta por texto
  const findQ = (keyword) => questions.find(q => (q.text || '').toLowerCase().includes(keyword));
  const getVal = (keyword) => {
    const q = findQ(keyword);
    return q ? formData[q.id] : undefined;
  };
  const getNumVal = (keyword) => parseFloat(getVal(keyword)) || 0;

  // === FLAG: Chargeback > 2% ===
  const chargeback = getNumVal('chargeback');
  if (chargeback > 2) {
    flags.push({ type: 'HIGH_CHARGEBACK', severity: 'high', value: chargeback, threshold: 2, description: `Chargeback ${chargeback}% > 2%` });
  }

  // === FLAG: MED PIX > 1% ===
  const medPix = getNumVal('med pix');
  if (medPix > 1) {
    flags.push({ type: 'HIGH_MED_PIX', severity: 'high', value: medPix, threshold: 1, description: `MED PIX ${medPix}% > 1%` });
  }

  // === FLAG: TPV vs Ticket × Transações (margem 30%) ===
  const tpv = getNumVal('tpv');
  const ticket = getNumVal('ticket');
  if (tpv > 0 && ticket > 0) {
    const expectedTpv = ticket * (tpv / ticket); // This is always tpv
    const transacoes = Math.round(tpv / ticket);
    const recalculated = ticket * transacoes;
    const diff = Math.abs(tpv - recalculated) / tpv;
    // Actually check transações field if manually provided
    const transQ = findQ('quantidade de transações');
    if (transQ && formData[transQ.id]) {
      const manualTrans = parseFloat(formData[transQ.id]) || 0;
      if (manualTrans > 0) {
        const recalc = ticket * manualTrans;
        const variance = Math.abs(tpv - recalc) / tpv;
        if (variance > 0.3) {
          flags.push({ type: 'TPV_INCONSISTENCY', severity: 'medium', value: `TPV=${tpv}, Ticket=${ticket}, Transações=${manualTrans}`, description: `TPV inconsistente com Ticket × Transações (variação ${(variance*100).toFixed(0)}%)` });
        }
      }
    }
  }

  // === FLAG: Faturamento vs TPV×12 ===
  const faturamento = getNumVal('faturamento do último exercício');
  if (faturamento > 0 && tpv > 0) {
    const tpvAnual = tpv * 12;
    if (tpvAnual > faturamento * 1.3) {
      flags.push({ type: 'TPV_EXCEEDS_REVENUE', severity: 'medium', value: `TPV anual=${tpvAnual}, Faturamento=${faturamento}`, description: `TPV anualizado (${tpvAnual.toLocaleString('pt-BR')}) > Faturamento (${faturamento.toLocaleString('pt-BR')})` });
    }
  }

  // === FLAG: Taxas fora da faixa 1-15% ===
  const rateQuestions = questions.filter(q => (q.text || '').toLowerCase().includes('mdr') && q.type === 'NUMBER');
  for (const q of rateQuestions) {
    const val = parseFloat(formData[q.id]);
    if (val && (val < 1 || val > 15)) {
      flags.push({ type: 'UNUSUAL_RATE', severity: 'low', value: val, description: `${q.text}: ${val}% fora da faixa normal (1-15%)` });
    }
  }

  // === FLAG: Empresa < 1 ano (via CNPJ data) ===
  if (cnpjData?.idade_empresa_anos !== null && cnpjData?.idade_empresa_anos !== undefined && cnpjData?.idade_empresa_anos < 1) {
    flags.push({ type: 'YOUNG_COMPANY', severity: 'medium', value: cnpjData.idade_empresa_anos, description: `Empresa com menos de 1 ano de atividade` });
  }

  // === FLAG: Situação especial (recuperação judicial etc) ===
  if (cnpjData?.situacao_especial && cnpjData.situacao_especial.trim() !== '') {
    flags.push({ type: 'SPECIAL_SITUATION', severity: 'critical', value: cnpjData.situacao_especial, description: `Situação especial: ${cnpjData.situacao_especial}` });
  }

  // === FLAG: E-mail pessoal ===
  const FREE_DOMAINS = ['gmail.com','hotmail.com','outlook.com','yahoo.com','yahoo.com.br','bol.com.br','uol.com.br','terra.com.br','ig.com.br','live.com','icloud.com'];
  const email = getVal('e-mail') || getVal('email');
  if (email && email.includes('@')) {
    const domain = email.split('@')[1]?.toLowerCase();
    if (FREE_DOMAINS.includes(domain)) {
      flags.push({ type: 'PERSONAL_EMAIL', severity: 'low', value: domain, description: `E-mail pessoal (${domain})` });
    }
  }

  // === FLAG: Setor regulado via CNAE ===
  if (cnpjData?.setor_regulado?.regulado) {
    flags.push({ type: 'REGULATED_SECTOR', severity: 'high', value: cnpjData.setor_regulado.orgao, description: `Setor regulado: ${cnpjData.setor_regulado.orgao}` });
  }

  // === FLAG: Atividade restrita/proibida ===
  if (cnpjData?.anexo_i?.restrito) {
    flags.push({ type: 'RESTRICTED_ACTIVITY', severity: 'critical', value: cnpjData.anexo_i.cnaesRestritos, description: cnpjData.anexo_i.mensagem });
  }

  return flags;
}

/**
 * Calcula score de lead (0-100) usando dados de enriquecimento.
 */
export function computeLeadScore(formData, questions, cnpjData) {
  let score = 40; // Base

  const findQ = (keyword) => questions.find(q => (q.text || '').toLowerCase().includes(keyword));
  const getVal = (keyword) => { const q = findQ(keyword); return q ? formData[q.id] : undefined; };
  const getNumVal = (keyword) => parseFloat(getVal(keyword)) || 0;

  // TPV alto
  const tpv = getNumVal('tpv');
  if (tpv > 1000000) score += 15;
  else if (tpv > 500000) score += 10;
  else if (tpv > 100000) score += 5;

  // Capital social alto
  if (cnpjData?.capital_social > 1000000) score += 10;
  else if (cnpjData?.capital_social > 100000) score += 5;

  // Empresa madura
  if (cnpjData?.idade_empresa_anos > 5) score += 10;
  else if (cnpjData?.idade_empresa_anos > 2) score += 5;

  // Cargo do contato
  const cargo = String(getVal('cargo') || '').toLowerCase();
  if (cargo.includes('sócio') || cargo.includes('dono') || cargo.includes('diretor') || cargo.includes('c-level')) score += 10;

  // E-mail corporativo
  const email = getVal('e-mail') || getVal('email') || '';
  if (email.includes('@') && !['gmail.com','hotmail.com','outlook.com','yahoo.com'].includes(email.split('@')[1]?.toLowerCase())) {
    score += 10;
  }

  // Site preenchido
  const site = getVal('site') || '';
  if (site.length > 5) score += 5;

  // Porte > ME
  if (cnpjData?.porte === 'DEMAIS') score += 5;
  else if (cnpjData?.porte === 'EPP') score += 3;

  return Math.min(100, Math.max(0, score));
}