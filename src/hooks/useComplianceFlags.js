import { useMemo } from 'react';

/**
 * Hook que computa flags de validação cruzada em tempo real para questionários de Compliance.
 * Retorna um mapa de questionId → array de alertas {severity, message, code}.
 * 
 * Cobre:
 * - B3+B4+B5: Volume ≈ Transações × Ticket (margem 30%)
 * - B4 vs Porte/Capital: ME > R$30K, B4 > capital×10, B4×12 > B11
 * - MK4/GM3: sellers/sub-merchants ativos = 0
 * - MK5/GM4: crescimento > 50%/mês
 * - MK6b: PF+PJ soma 100%
 * - MK9/MK10/MK18/MK23, GM6/GM7/GM18/GM20: "Não" → flags
 * - MK29/GM28/GM30c: chargeback thresholds
 * - MK33/GM31+31b+33: PCI DSS condicionais
 * - GM25: volume vs capital × 50
 * - GM30b: chargeback por bandeira (Visa 0.9%, Mastercard 1.5%)
 * - K1: auto-suggest quando F8 preenchido
 */

function findQ(questions, matcher) {
  return questions.find(q => {
    const t = (q.text || '').toLowerCase();
    return matcher(t, q);
  });
}

function getVal(formData, q) {
  if (!q) return undefined;
  return formData[q.id];
}

function num(val) {
  return parseFloat(val) || 0;
}

export default function useComplianceFlags(questions, formData, cnpjData) {
  return useMemo(() => {
    if (!questions || questions.length === 0) return {};
    const alerts = {};
    const add = (qId, severity, message, code) => {
      if (!qId) return;
      if (!alerts[qId]) alerts[qId] = [];
      alerts[qId].push({ severity, message, code });
    };

    // Helper: find question by text keywords
    const f = (keywords) => findQ(questions, (t) => keywords.every(k => t.includes(k)));

    // ────────────────────────────────────────
    // PARTE I — Comum aos 3
    // ────────────────────────────────────────

    // B3+B4+B5: Volume ≈ Transações × Ticket
    const qVolume = f(['volume mensal']) || f(['volume operacional']) || f(['tpv mensal']);
    const qTicket = f(['ticket médio']);
    const qTransacoes = f(['quantidade de transações']) || f(['transações por mês']) || f(['número de transações']);
    
    if (qVolume && qTicket && qTransacoes) {
      const vol = num(getVal(formData, qVolume));
      const ticket = num(getVal(formData, qTicket));
      const trans = num(getVal(formData, qTransacoes));
      if (vol > 0 && ticket > 0 && trans > 0) {
        const expected = trans * ticket;
        const ratio = vol / expected;
        if (ratio < 0.7 || ratio > 1.3) {
          add(qVolume.id, 'MEDIUM', `Volume (R$ ${vol.toLocaleString('pt-BR')}) inconsistente com Transações × Ticket (R$ ${expected.toLocaleString('pt-BR')}). Diferença de ${Math.abs(Math.round((ratio - 1) * 100))}%.`, 'B345_CROSS');
        }
      }
    }

    // B4 vs Porte/Capital
    if (cnpjData && qVolume) {
      const vol = num(getVal(formData, qVolume));
      if (vol > 0) {
        if (cnpjData.porte === 'ME' && vol > 30000) {
          add(qVolume.id, 'MEDIUM', `Volume mensal (R$ ${vol.toLocaleString('pt-BR')}) elevado para Microempresa (ME). Limite esperado ~R$ 30K/mês.`, 'B4_PORTE');
        }
        const cap = cnpjData.capital_social || 0;
        if (cap > 0 && vol > cap * 10) {
          add(qVolume.id, 'HIGH', `Volume mensal (R$ ${vol.toLocaleString('pt-BR')}) é ${Math.round(vol / cap)}x o capital social (R$ ${cap.toLocaleString('pt-BR')}). Alavancagem elevada.`, 'B4_CAPITAL');
        }
      }
    }

    // B4×12 vs B11 (Faturamento Anual)
    const qFaturamento = f(['faturamento anual']) || f(['receita anual']);
    if (qVolume && qFaturamento) {
      const vol = num(getVal(formData, qVolume));
      const fat = num(getVal(formData, qFaturamento));
      if (vol > 0 && fat > 0 && vol * 12 > fat) {
        add(qVolume.id, 'MEDIUM', `Volume anualizado (R$ ${(vol * 12).toLocaleString('pt-BR')}) supera faturamento declarado (R$ ${fat.toLocaleString('pt-BR')}).`, 'B4_FAT');
      }
    }

    // K1: Gestor de Compliance auto-suggest
    const qRespCompliance = f(['nome', 'responsável', 'compliance']) || f(['responsável de compliance']);
    const qGestorCompliance = f(['gestor de compliance']) || f(['possui gestor']);
    if (qRespCompliance && qGestorCompliance) {
      const respName = getVal(formData, qRespCompliance);
      if (respName && String(respName).trim().length > 2 && getVal(formData, qGestorCompliance) === undefined) {
        add(qGestorCompliance.id, 'INFO', 'Sugestão: campo "Responsável de Compliance" preenchido — considere marcar "Sim".', 'K1_SUGGEST');
      }
    }

    // ────────────────────────────────────────
    // PARTE II — Marketplace (MK)
    // ────────────────────────────────────────

    const qSellersAtivos = f(['sellers ativos']) || f(['quantidade total de sellers']);
    const qNovosSellers = f(['novos sellers']) || f(['novos sellers/mês']);
    
    if (qSellersAtivos) {
      const sellersAt = num(getVal(formData, qSellersAtivos));
      if (getVal(formData, qSellersAtivos) !== undefined && sellersAt === 0) {
        add(qSellersAtivos.id, 'MEDIUM', 'Marketplace sem sellers ativos? Verifique a informação.', 'MK4_ZERO');
      }
      if (qNovosSellers) {
        const novos = num(getVal(formData, qNovosSellers));
        if (sellersAt > 0 && novos > sellersAt * 0.5) {
          add(qNovosSellers.id, 'MEDIUM', `Taxa de crescimento ${Math.round((novos / sellersAt) * 100)}%/mês (${novos} novos / ${sellersAt} ativos). Acima de 50%.`, 'MK5_GROWTH');
        }
      }
    }

    // MK6b: PF+PJ soma 100%
    const qPctPF = f(['percentual pf']) || f(['% pf']) || f(['sellers pf']);
    const qPctPJ = f(['percentual pj']) || f(['% pj']) || f(['sellers pj']);
    if (qPctPF && qPctPJ) {
      const pf = num(getVal(formData, qPctPF));
      const pj = num(getVal(formData, qPctPJ));
      if ((pf > 0 || pj > 0) && Math.abs(pf + pj - 100) > 0.01) {
        add(qPctPF.id, 'MEDIUM', `PF (${pf}%) + PJ (${pj}%) = ${pf + pj}%. A soma deve ser 100%.`, 'MK6B_SUM');
      }
    }

    // MK9/MK10/MK18/MK23 — boolean flags Marketplace
    const boolFlags = [
      { kw: ['kyc', 'sellers'], msg: 'Marketplace não realiza KYC/KYB dos sellers', severity: 'HIGH', code: 'MK9' },
      { kw: ['coleta', 'cnpj', 'sellers'], msg: 'Marketplace não coleta CNPJ/CPF dos sellers', severity: 'CRITICAL', code: 'MK10' },
      { kw: ['contrato', 'sellers'], msg: 'Marketplace sem contrato com sellers', severity: 'HIGH', code: 'MK18' },
      { kw: ['monitora', 'transações', 'sellers'], msg: 'Marketplace não monitora transações dos sellers', severity: 'HIGH', code: 'MK23' },
      // Gateway flags
      { kw: ['kyc', 'sub-merchants'], msg: 'Gateway não realiza KYC/KYB dos sub-merchants', severity: 'CRITICAL', code: 'GM6' },
      { kw: ['kyc', 'sub merchants'], msg: 'Gateway não realiza KYC/KYB dos sub-merchants', severity: 'CRITICAL', code: 'GM6b' },
      { kw: ['coleta', 'cnpj', 'sub-merchants'], msg: 'Gateway não coleta CNPJ/CPF dos sub-merchants', severity: 'CRITICAL', code: 'GM7' },
      { kw: ['coleta', 'cnpj', 'sub merchants'], msg: 'Gateway não coleta CNPJ/CPF dos sub-merchants', severity: 'CRITICAL', code: 'GM7b' },
      { kw: ['contrato', 'sub-merchants'], msg: 'Gateway sem contrato com sub-merchants', severity: 'HIGH', code: 'GM18' },
      { kw: ['contrato', 'sub merchants'], msg: 'Gateway sem contrato com sub-merchants', severity: 'HIGH', code: 'GM18b' },
      { kw: ['monitora', 'transações suspeitas'], msg: 'Gateway não monitora transações suspeitas', severity: 'HIGH', code: 'GM20' },
    ];

    for (const bf of boolFlags) {
      const q = f(bf.kw);
      if (q && getVal(formData, q) === false) {
        add(q.id, bf.severity, bf.msg, bf.code);
      }
    }

    // Chargeback thresholds (MK29 / GM28)
    const qChargeback = f(['taxa de chargeback']) || f(['chargeback consolidad']);
    if (qChargeback) {
      const cb = num(getVal(formData, qChargeback));
      if (cb > 2) add(qChargeback.id, 'CRITICAL', `Chargeback ${cb}% — acima de 2% (risco alto).`, 'CB_HIGH');
      else if (cb > 1) add(qChargeback.id, 'HIGH', `Chargeback ${cb}% — acima de 1% (atenção).`, 'CB_MED');
    }

    // GM28 specific thresholds
    const qCBConsolidado = f(['chargeback consolidad']);
    if (qCBConsolidado) {
      const cb = num(getVal(formData, qCBConsolidado));
      if (cb > 1.5) add(qCBConsolidado.id, 'HIGH', `Chargeback ${cb}% — acima do threshold Mastercard ECM (1.5%).`, 'GM28_MC');
      else if (cb > 0.9) add(qCBConsolidado.id, 'MEDIUM', `Chargeback ${cb}% — acima do threshold Visa VDMP (0.9%).`, 'GM28_VISA');
    }

    // GM30b: chargeback por bandeira
    const qCBVisa = f(['chargeback', 'visa']);
    const qCBMaster = f(['chargeback', 'mastercard']);
    if (qCBVisa) {
      const v = num(getVal(formData, qCBVisa));
      if (v > 0.9) add(qCBVisa.id, 'HIGH', `Chargeback Visa ${v}% — acima do threshold VDMP (0.9%).`, 'GM30B_VISA');
    }
    if (qCBMaster) {
      const v = num(getVal(formData, qCBMaster));
      if (v > 1.5) add(qCBMaster.id, 'HIGH', `Chargeback Mastercard ${v}% — acima do threshold ECM (1.5%).`, 'GM30B_MC');
    }

    // GM30c: MED PIX
    const qMedPix = f(['med pix']);
    if (qMedPix) {
      const v = num(getVal(formData, qMedPix));
      if (v > 3) add(qMedPix.id, 'CRITICAL', `MED PIX ${v}% — acima de 3% (crítico).`, 'GM30C_CRIT');
      else if (v > 1) add(qMedPix.id, 'HIGH', `MED PIX ${v}% — acima de 1% (atenção).`, 'GM30C_HIGH');
    }

    // GM29: taxa de reembolso
    const qReembolso = f(['taxa de reembolso']);
    if (qReembolso) {
      const v = num(getVal(formData, qReembolso));
      if (v > 5) add(qReembolso.id, 'MEDIUM', `Taxa de reembolso ${v}% — acima de 5%.`, 'GM29_HIGH');
    }

    // PCI DSS condicional (MK33/GM31)
    const qArmazenaCartao = f(['armazena', 'dados de cartão']) || f(['processa', 'dados de cartão']);
    const qPciDss = f(['pci dss']) || f(['pci-dss']);
    const qAntifraude = f(['antifraude']) || f(['anti-fraude']);
    
    if (qArmazenaCartao && getVal(formData, qArmazenaCartao) === true) {
      if (qPciDss) {
        const pci = getVal(formData, qPciDss);
        if (pci === false || (typeof pci === 'string' && pci.toLowerCase().includes('não possui'))) {
          add(qPciDss.id, 'CRITICAL', 'Armazena/processa dados de cartão SEM PCI DSS — violação grave.', 'PCI_CRITICAL');
        }
      }
      if (qAntifraude) {
        const af = getVal(formData, qAntifraude);
        if (af === false || af === 'Nenhum' || (typeof af === 'string' && af.toLowerCase() === 'nenhum')) {
          add(qAntifraude.id, 'HIGH', 'Armazena/processa dados de cartão SEM provider de antifraude.', 'AF_NONE');
        }
      }
    }

    // GM33: sub-merchants com acesso a dados de cartão
    const qSubCartao = f(['sub-merchants', 'acesso', 'dados de cartão']) || f(['sub merchants', 'acesso', 'dados de cartão']);
    if (qSubCartao && getVal(formData, qSubCartao) === true) {
      add(qSubCartao.id, 'CRITICAL', 'Sub-merchants com acesso a dados de cartão — possível violação PCI DSS.', 'GM33_CRIT');
    }

    // ────────────────────────────────────────
    // PARTE II — Gateway (GM) specifics
    // ────────────────────────────────────────

    const qSubMerchantsAtivos = f(['sub-merchants ativos']) || f(['sub merchants ativos']) || f(['quantidade total de sub']);
    const qNovosSubMerchants = f(['novos sub-merchants']) || f(['novos sub merchants']);
    
    if (qSubMerchantsAtivos) {
      const sma = num(getVal(formData, qSubMerchantsAtivos));
      if (getVal(formData, qSubMerchantsAtivos) !== undefined) {
        if (sma === 0) add(qSubMerchantsAtivos.id, 'MEDIUM', 'Gateway sem sub-merchants ativos?', 'GM3_ZERO');
        if (sma > 0 && sma < 5) add(qSubMerchantsAtivos.id, 'LOW', 'Operação muito concentrada (< 5 sub-merchants).', 'GM3_LOW');
      }
      if (qNovosSubMerchants) {
        const novos = num(getVal(formData, qNovosSubMerchants));
        if (sma > 0 && novos > sma * 0.5) {
          add(qNovosSubMerchants.id, 'MEDIUM', `Crescimento ${Math.round((novos / sma) * 100)}%/mês (${novos} novos / ${sma} ativos).`, 'GM4_GROWTH');
        }
        if (sma > 0 && novos > sma) {
          add(qNovosSubMerchants.id, 'HIGH', 'Mais novos sub-merchants/mês que base total ativa.', 'GM4_EXCEED');
        }
      }
    }

    // GM25: Volume vs Capital × 50
    const qVolGateway = f(['volume mensal total']);
    if (qVolGateway && cnpjData) {
      const vol = num(getVal(formData, qVolGateway));
      const cap = cnpjData.capital_social || 0;
      if (vol > 0 && cap > 0 && vol > cap * 50) {
        add(qVolGateway.id, 'HIGH', `Volume (R$ ${vol.toLocaleString('pt-BR')}) é ${Math.round(vol / cap)}x o capital social. Alavancagem excessiva para gateway.`, 'GM25_LEVER');
      }
    }

    // ────────────────────────────────────────
    // PARTE II — Merchant
    // ────────────────────────────────────────

    // M14+M15+M16: cross-validation
    const qVolMerchant = f(['volume mensal', 'merchant']) || f(['volume mensal transacion']);
    const qTransMerchant = f(['quantidade de transações', 'merchant']) || f(['número de transações mensal']);
    const qTicketMerchant = f(['ticket médio', 'merchant']);
    if (qVolMerchant && qTransMerchant && qTicketMerchant) {
      const vol = num(getVal(formData, qVolMerchant));
      const trans = num(getVal(formData, qTransMerchant));
      const ticket = num(getVal(formData, qTicketMerchant));
      if (vol > 0 && trans > 0 && ticket > 0) {
        const expected = trans * ticket;
        const ratio = vol / expected;
        if (ratio < 0.7 || ratio > 1.3) {
          add(qVolMerchant.id, 'MEDIUM', `Volume merchant (R$ ${vol.toLocaleString('pt-BR')}) inconsistente com transações × ticket (R$ ${expected.toLocaleString('pt-BR')}).`, 'M14_CROSS');
        }
      }
    }

    // MK26/GM25 vs B4 consistency
    const qVolMk = f(['volume mensal total']);
    if (qVolMk && qVolume) {
      const volMk = num(getVal(formData, qVolMk));
      const volB4 = num(getVal(formData, qVolume));
      if (volMk > 0 && volB4 > 0) {
        const ratio = volMk / volB4;
        if (ratio < 0.5 || ratio > 2) {
          add(qVolMk.id, 'MEDIUM', `Volume Parte II (R$ ${volMk.toLocaleString('pt-BR')}) inconsistente com Seção B (R$ ${volB4.toLocaleString('pt-BR')}).`, 'VOL_CROSS');
        }
      }
    }

    return alerts;
  }, [questions, formData, cnpjData]);
}