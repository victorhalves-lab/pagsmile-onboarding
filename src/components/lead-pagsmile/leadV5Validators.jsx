// ============================================================
// VALIDADORES CENTRAIS — Questionário Leads Pagsmile V5
// Fonte única de verdade. Cada validador retorna:
//   - errors: { [fieldName]: 'mensagem' }
//   - summary: string[] (mensagens para exibir no topo)
// ============================================================

import { FREE_EMAIL_DOMAINS, ANTIFRAUDE_SEGMENTS } from './pagsmileQuestionnaireData';

// ── CNPJ com dígito verificador ──
export function isValidCnpj(cnpj) {
  const digits = String(cnpj || '').replace(/\D/g, '');
  if (digits.length !== 14) return false;
  if (/^(\d)\1+$/.test(digits)) return false; // all same digits
  const calc = (base, weights) => {
    const sum = base.split('').reduce((acc, d, i) => acc + parseInt(d, 10) * weights[i], 0);
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calc(digits.slice(0, 12), w1);
  const d2 = calc(digits.slice(0, 12) + d1, w2);
  return d1 === parseInt(digits[12], 10) && d2 === parseInt(digits[13], 10);
}

export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  // RFC 5322 simplified
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function isValidBrPhone(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  // BR mobile/landline: 10 or 11 digits (DDD 2 + number 8 or 9)
  if (d.length !== 10 && d.length !== 11) return false;
  const ddd = parseInt(d.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) return false;
  return true;
}

// ── Map: segmento → campos condicionais obrigatórios da Etapa 4 (Modelo Negócio) ──
const SEGMENT_REQUIRED_FIELDS = {
  gateway: ['licencaBCB', 'splitPagamento'],
  marketplace: ['takeRate', 'kycSubSellers'],
  plataforma_vertical: ['verticalPrincipal'],
  saas: ['churn', 'pricingSaas'],
  infoprodutos: ['modeloAfiliados', 'garantia', 'pctAfiliados'],
  ecommerce: ['tipoProdutoEcommerce', 'modeloEntrega', 'politicaDevolucao'],
  dropshipping: ['tipoProdutoDrop', 'origemFornecedores', 'prazoEntrega'],
  link_pagamento: ['tipoProdutoLink', 'canaisLink'],
  mpe: ['tipoMpe', 'oQueVendeMpe', 'modalidadeCartao'],
};

const FIELD_LABELS = {
  cnpj: 'CNPJ',
  razaoSocial: 'Razão Social',
  nomeFantasia: 'Nome Fantasia',
  presencaDigital: 'Presença digital',
  email: 'E-mail',
  phone: 'Telefone',
  contactName: 'Nome do contato',
  cargo: 'Cargo',
  cargoOutro: 'Cargo (detalhar)',
  modeloCobranca: 'Modelo de cobrança',
  descricaoNegocio: 'Descrição do negócio',
  antifraude: 'Antifraude / 3DS',
  licencaBCB: 'Licença BCB',
  splitPagamento: 'Split de pagamento',
  takeRate: 'Take rate',
  kycSubSellers: 'KYC de sub-sellers',
  verticalPrincipal: 'Vertical principal',
  churn: 'Churn mensal',
  pricingSaas: 'Modelo de pricing',
  modeloAfiliados: 'Modelo de afiliados',
  garantia: 'Política de garantia',
  pctAfiliados: '% vindo de afiliados',
  tipoProdutoEcommerce: 'Tipo de produto',
  modeloEntrega: 'Modelo de entrega',
  politicaDevolucao: 'Política de devolução',
  tipoProdutoDrop: 'Tipo de produto',
  origemFornecedores: 'Origem de fornecedores',
  prazoEntrega: 'Prazo de entrega',
  tipoProdutoLink: 'Tipo de produto/serviço',
  canaisLink: 'Canais de envio',
  tipoMpe: 'Tipo de negócio',
  oQueVendeMpe: 'O que vende',
  modalidadeCartao: 'Modalidade de cartão',
  tpvMensal: 'TPV Mensal',
  ticketMedio: 'Ticket Médio',
  faturamentoAnual: 'Faturamento Anual',
  funcionarios: 'Número de funcionários',
  jaProcessa: 'Já processa pagamentos',
  distribuicao: 'Distribuição de meios',
  distribuicaoDesejada: 'Distribuição desejada',
  distribuicaoParcelamento: 'Distribuição por parcelamento',
  mdrAvista: 'MDR Crédito à Vista',
  mdr2a6x: 'MDR Crédito 2-6x',
  mdr7a12x: 'MDR Crédito 7-12x',
  mdrDebito: 'MDR Débito',
  taxaPix: 'Taxa PIX',
  taxaBoleto: 'Taxa Boleto',
  taxaAntecipacao: 'Taxa Antecipação',
  feeTransacao: 'Fee por transação',
  custoAntifraude: 'Custo antifraude',
  taxa3ds: 'Taxa 3DS',
  mixOperacao: 'Composição da operação',
  encerrado: 'Já foi encerrado',
  chargeback: 'Taxa de chargeback',
  medPix: 'Taxa de MED PIX',
  urgencia: 'Quando quer começar',
  crescimento: 'Expectativa de crescimento',
};

function err(field, message) {
  return { field, message: message || `${FIELD_LABELS[field] || field} é obrigatório` };
}

// Sum helper that handles array/object numeric values
function sumValues(obj) {
  if (!obj || typeof obj !== 'object') return 0;
  return Object.values(obj).reduce((s, v) => s + (Number(v) || 0), 0);
}

// ── Validator por etapa (0..11) ──
export function validateStepV5(step, form) {
  const out = [];

  if (step === 0) {
    if (!form.segmento) out.push(err('segmento', 'Selecione o tipo de negócio'));
  }

  if (step === 1) {
    if (!isValidCnpj(form.cnpj)) {
      out.push(err('cnpj', 'CNPJ inválido — confira os dígitos'));
    }
    if (!form.razaoSocial || String(form.razaoSocial).trim().length < 2) {
      out.push(err('razaoSocial', 'Razão Social é obrigatória'));
    }
    if (!form.nomeFantasia || String(form.nomeFantasia).trim().length < 2) {
      out.push(err('nomeFantasia', 'Nome Fantasia é obrigatório'));
    }
    if (!form.presencaDigital || String(form.presencaDigital).trim().length < 2) {
      out.push(err('presencaDigital', 'Informe site, @rede social ou "Não possuo"'));
    }
  }

  if (step === 2) {
    if (!form._enderecoConfirmado) {
      out.push(err('_enderecoConfirmado', 'Confirme o endereço antes de prosseguir'));
    }
  }

  if (step === 3) {
    if (!isValidEmail(form.email)) {
      out.push(err('email', 'E-mail inválido'));
    }
    if (!isValidBrPhone(form.phone)) {
      out.push(err('phone', 'Telefone inválido (DDD + número)'));
    }
    if (!form.contactName || String(form.contactName).trim().length < 2) {
      out.push(err('contactName', 'Nome do contato é obrigatório'));
    }
    if (!form.cargo) {
      out.push(err('cargo', 'Cargo é obrigatório'));
    } else if (form.cargo === '__other__' && (!form.cargoOutro || form.cargoOutro.trim().length < 2)) {
      out.push(err('cargoOutro', 'Descreva o cargo'));
    }
  }

  if (step === 4) {
    if (!form.modeloCobranca) out.push(err('modeloCobranca'));
    if (!form.descricaoNegocio || form.descricaoNegocio.trim().length < 10) {
      out.push(err('descricaoNegocio', 'Descreva seu negócio (mín. 10 caracteres)'));
    }
    if (ANTIFRAUDE_SEGMENTS.includes(form.segmento) && !form.antifraude) {
      out.push(err('antifraude'));
    }
    // Campos condicionais por segmento
    const required = SEGMENT_REQUIRED_FIELDS[form.segmento] || [];
    for (const f of required) {
      const val = form[f];
      const isEmpty = Array.isArray(val) ? val.length === 0 : !val;
      if (isEmpty) out.push(err(f));
    }
  }

  if (step === 5) {
    // Composição da Operação — total deve somar 100% (estimado)
    const mix = form.mixOperacao || {};
    const fixedTotal =
      (Number(mix.ecommerce) || 0) +
      (Number(mix.dropshipping) || 0) +
      (Number(mix.infoproduto) || 0) +
      (Number(mix.saas) || 0) +
      (Number(mix.educacao) || 0);
    const outros = Array.isArray(mix.outros) ? mix.outros : [];
    const outrosTotal = outros.reduce((s, o) => s + (Number(o?.percentual) || 0), 0);
    const total = fixedTotal + outrosTotal;

    if (total !== 100) {
      out.push(err('mixOperacao', `Composição da operação deve somar 100% (atual: ${total}%)`));
    }
    // Cada "Outros" precisa ter nome (mín 2 chars) e percentual > 0
    for (let i = 0; i < outros.length; i++) {
      const o = outros[i] || {};
      const nome = String(o.nome || '').trim();
      const pct = Number(o.percentual) || 0;
      if (!nome || nome.length < 2) {
        out.push(err('mixOperacao', `Categoria "Outros" #${i + 1}: informe o nome`));
      }
      if (pct <= 0) {
        out.push(err('mixOperacao', `Categoria "Outros" #${i + 1}: percentual deve ser maior que zero`));
      }
    }
  }

  if (step === 6) {
    const tpv = parseFloat(form.tpvMensal) || 0;
    const ticket = parseFloat(form.ticketMedio) || 0;
    if (tpv <= 0) {
      out.push(err('tpvMensal', 'TPV Mensal deve ser maior que zero'));
    } else if (tpv < 50000) {
      out.push(err('tpvMensal', 'Só aceitamos TPV mensal acima de R$ 50.000 — confira se digitou o valor em reais'));
    }
    if (ticket <= 0) out.push(err('ticketMedio', 'Ticket Médio deve ser maior que zero'));
    if (!form.faturamentoAnual) out.push(err('faturamentoAnual'));
    if (!form.funcionarios) out.push(err('funcionarios'));
  }

  if (step === 7) {
    if (!form.jaProcessa) {
      out.push(err('jaProcessa', 'Informe se já processa pagamentos'));
    } else if (form.jaProcessa === 'Sim, já processo') {
      const totalDist = sumValues(form.distribuicao);
      if (Math.round(totalDist) !== 100) {
        out.push(err('distribuicao', `Distribuição de meios deve somar 100% (atual: ${Math.round(totalDist)}%)`));
      }
      const totalParc = sumValues(form.distribuicaoParcelamento);
      if (Math.round(totalParc) !== 100) {
        out.push(err('distribuicaoParcelamento', `Distribuição por parcelamento deve somar 100% (atual: ${Math.round(totalParc)}%)`));
      }
    } else if (form.jaProcessa === 'Não, estou começando') {
      const totalDes = sumValues(form.distribuicaoDesejada);
      if (Math.round(totalDes) !== 100) {
        out.push(err('distribuicaoDesejada', `Distribuição desejada deve somar 100% (atual: ${Math.round(totalDes)}%)`));
      }
    }
  }

  if (step === 8 && form.jaProcessa === 'Sim, já processo') {
    const dist = form.distribuicao || {};
    const temPix = (dist.pix || 0) > 0;
    const temBoleto = (dist.boleto || 0) > 0;
    const temCartao = (dist.credito || 0) > 0 || (dist.debito || 0) > 0;
    if (temCartao) {
      if (!form.mdrAvista) out.push(err('mdrAvista'));
      if (!form.mdr2a6x) out.push(err('mdr2a6x'));
      if (!form.mdr7a12x) out.push(err('mdr7a12x'));
      if (!form.mdrDebito) out.push(err('mdrDebito'));
    }
    if (temPix && !form.taxaPix) out.push(err('taxaPix'));
    if (temBoleto && !form.taxaBoleto) out.push(err('taxaBoleto'));
    if (!form.taxaAntecipacao) out.push(err('taxaAntecipacao'));
    if (!form.feeTransacao) out.push(err('feeTransacao'));
    if (!form.custoAntifraude) out.push(err('custoAntifraude'));
    if (!form.taxa3ds) out.push(err('taxa3ds'));
  }

  if (step === 10) {
    if (!form.encerrado) out.push(err('encerrado'));
    const jaProcessa = form.jaProcessa === 'Sim, já processo';
    const dist = jaProcessa ? (form.distribuicao || {}) : (form.distribuicaoDesejada || {});
    const temCartao = (dist.credito || 0) > 0;
    const temPix = (dist.pix || 0) > 0;
    if (jaProcessa && temCartao && !form.chargeback) out.push(err('chargeback'));
    if (temPix && !form.medPix) out.push(err('medPix'));
  }

  if (step === 11) {
    if (!form.urgencia) out.push(err('urgencia'));
    if (!form.crescimento) out.push(err('crescimento'));
  }

  // Build error map + summary
  const errors = {};
  const summary = [];
  for (const e of out) {
    errors[e.field] = true;
    summary.push(e.message);
  }
  return { errors, summary, isValid: out.length === 0, raw: out };
}

// Count total required fields per step (for "X/Y preenchidos" indicator)
export function countStepFields(step, form) {
  // Run a synthetic validation against an empty form to count required
  const emptyResult = validateStepV5(step, {});
  const currentResult = validateStepV5(step, form);
  const total = Object.keys(emptyResult.errors).length;
  const missing = Object.keys(currentResult.errors).length;
  const filled = Math.max(0, total - missing);
  return { total, filled, missing };
}