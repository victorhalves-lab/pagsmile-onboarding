// ──────────────────────────────────────────────────────────────────────────────
// V5.2 — Microcopy oficial centralizado (Fase 5.4)
// ──────────────────────────────────────────────────────────────────────────────
// SSOT (Single Source of Truth) para TODOS os textos exibidos ao seller durante
// o questionário V5.2. Mantém uniformidade entre fluxos (T1/T2/T3/Subsellers)
// e evita drift de tom entre componentes diferentes.
//
// USO:
//   import { getMicrocopy } from '@/lib/v5_2/microcopy';
//   const txt = getMicrocopy('confirm_card.razao_social.title', { value: 'ACME LTDA' });
//
// Placeholders aceitos via context:
//   {value}         → valor a confirmar (ex: razão social)
//   {seller_name}   → "[Nome do seller mestre]" — usado nos fluxos Subseller
//   {tier}          → tier_1 / tier_2 / tier_3 / subseller_pj / subseller_pf
//   {grau}          → A / B / C (subsellers)
//   {segmento}      → segmento canônico
//   {dataset}       → nome amigável do dataset BDC
//   {capability}    → nome amigável da capability
//   {threshold}     → valor numérico de limiar (TPV, etc.)
// ──────────────────────────────────────────────────────────────────────────────

const PLACEHOLDER_SELLER = '[Nome do seller mestre]';

// ============================================================================
// MODALIDADES DE COLETA (A/B/C/D/E) — Bloco 4
// ============================================================================
const MODALIDADES = {
  // Modalidade A — Confirmação de dado BDC
  'modalidade_a.title': 'Confirme estes dados',
  'modalidade_a.subtitle': 'Encontramos estas informações em fontes oficiais. Confirme se estão corretas.',
  'modalidade_a.confirm_button': 'Está correto',
  'modalidade_a.report_divergence': 'Reportar divergência',
  'modalidade_a.divergence_warning': 'Ao reportar divergência, seu caso será encaminhado para revisão manual.',
  'modalidade_a.source_label': 'Fonte: {dataset}',

  // Modalidade B — Input híbrido (sugere mas aceita override)
  'modalidade_b.title': 'Confira e edite se necessário',
  'modalidade_b.subtitle': 'Pré-preenchemos com dados que encontramos. Você pode editar se preferir.',
  'modalidade_b.suggestion_label': 'Sugestão BDC: {value}',
  'modalidade_b.override_note': 'Se o valor declarado divergir muito da sugestão, podemos solicitar comprovação.',

  // Modalidade C — Input puro (sem BDC)
  'modalidade_c.title': 'Informe',
  'modalidade_c.subtitle': 'Esta informação não está disponível em fontes públicas — precisamos que você declare.',

  // Modalidade D — Derivado automaticamente
  'modalidade_d.title': 'Calculado automaticamente',
  'modalidade_d.derived_from': 'Derivado de: {source}',

  // Modalidade E — Upload de documento
  'modalidade_e.title': 'Anexe o documento',
  'modalidade_e.subtitle': 'Aceitamos PDF, JPG ou PNG (até 10MB).',
  'modalidade_e.composite_label': 'Informe o valor e anexe o documento comprobatório:',
};

// ============================================================================
// TIERING DINÂMICO (5.3) — mensagens exibidas ao seller quando tier escala
// ============================================================================
const TIERING = {
  'tier.escalated.banner': 'Com base nas suas respostas, identificamos que precisaremos de algumas perguntas adicionais.',
  'tier.escalated.t1_to_t2': 'Seu perfil agora exige documentação financeira complementar.',
  'tier.escalated.t1_to_t3': 'Seu perfil exige análise estendida — vamos te guiar passo a passo.',
  'tier.escalated.t2_to_t3': 'Identificamos elementos que pedem uma análise mais detalhada.',
  'tier.reescalated_after_submit': 'Após análise externa, identificamos novos pontos. Enviamos um email com as próximas etapas.',
  'tier.subseller_grau_a': 'Cadastro simplificado — algumas perguntas básicas.',
  'tier.subseller_grau_b': 'Cadastro intermediário — perguntas adicionais sobre seu fluxo.',
  'tier.subseller_grau_c': 'Cadastro completo — incluindo documentação de renda.',
};

// ============================================================================
// CONFIRM CARDS (Modalidade A) — textos por field_id da CV-16
// ============================================================================
const CONFIRM_CARDS = {
  'confirm_card.razao_social.title': 'Razão Social',
  'confirm_card.razao_social.helptext': 'Nome registrado oficialmente na Receita Federal.',
  'confirm_card.nome_fantasia.title': 'Nome Fantasia',
  'confirm_card.nome_fantasia.helptext': 'Como sua empresa é conhecida no mercado.',
  'confirm_card.cnpj_situacao.title': 'Situação na Receita Federal',
  'confirm_card.cnpj_situacao.helptext': 'Esperamos que esteja ATIVA. Outras situações podem impedir o cadastro.',
  'confirm_card.data_fundacao.title': 'Data de Fundação',
  'confirm_card.data_fundacao.helptext': 'Data em que sua empresa foi registrada.',
  'confirm_card.capital_social.title': 'Capital Social',
  'confirm_card.capital_social.helptext': 'Valor declarado no contrato social.',
  'confirm_card.endereco.title': 'Endereço',
  'confirm_card.endereco.helptext': 'Endereço de sede registrado oficialmente.',
  'confirm_card.cnae.title': 'Atividade Principal (CNAE)',
  'confirm_card.cnae.helptext': 'Classificação Nacional de Atividade Econômica registrada.',
};

// ============================================================================
// COMPOSITE FIELDS (q_t2_revenue_proof, etc.)
// ============================================================================
const COMPOSITE = {
  'composite.revenue_proof.title': 'Comprovação de Faturamento',
  'composite.revenue_proof.subtitle': 'Informe seu faturamento anual e anexe o documento comprobatório.',
  'composite.revenue_proof.input_label': 'Faturamento anual declarado (R$)',
  'composite.revenue_proof.upload_label': 'Anexe ECF, DEFIS, balanço ou extrato consolidado',
  'composite.revenue_proof.both_required': 'Tanto o valor declarado quanto o documento são obrigatórios.',
};

// ============================================================================
// SUBSELLER (Fase 3c)
// ============================================================================
const SUBSELLER = {
  'subseller.welcome.pj': 'Olá! Você foi convidado(a) por {seller_name} a se cadastrar como sub-conta.',
  'subseller.welcome.pf': 'Olá! Você foi convidado(a) por {seller_name} a operar como recebedor.',
  'subseller.grau_a.intro': 'Cadastro simplificado — vamos pedir apenas o essencial.',
  'subseller.grau_b.intro': 'Cadastro intermediário — incluindo dados financeiros básicos.',
  'subseller.grau_c.intro': 'Cadastro completo — incluindo comprovação de renda.',
  'subseller.dirpf_upload_grau_c': 'Anexe sua DIRPF (declaração de Imposto de Renda) mais recente.',
  'subseller.pix_titularidade_warning': 'A chave PIX informada precisa estar no seu CPF.',
};

// ============================================================================
// B-SERIES REAL-TIME (5.6) — mensagens quando um bloqueio dispara durante o fluxo
// ============================================================================
const BLOCKS_REALTIME = {
  'block_realtime.soft.title': 'Atenção',
  'block_realtime.soft.subtitle': 'Identificamos um ponto que precisa de atenção, mas você pode continuar.',
  'block_realtime.hard.title': 'Não foi possível prosseguir',
  'block_realtime.hard.subtitle': 'Identificamos um impedimento. Nossa equipe vai entrar em contato.',
  'block_realtime.cnpj_novo': 'Seu CNPJ tem menos de 6 meses — vamos pedir documentação adicional.',
  'block_realtime.pep_undeclared': 'Detectamos vínculo PEP não declarado. Por favor, ajuste sua resposta anterior.',
  'block_realtime.sanction': 'Identificamos restrição em base de sanções. Caso encaminhado para análise manual.',
};

// ============================================================================
// FOOTER / CTAs / SAVE-RESUME
// ============================================================================
const COMMON = {
  'cta.next': 'Continuar',
  'cta.back': 'Voltar',
  'cta.save_and_exit': 'Salvar e sair',
  'cta.submit': 'Enviar para análise',
  'save.resume_email': 'Salvamos seu progresso. Enviamos um email para retomar de onde parou.',
  'save.ttl_t1_t2': 'Você tem 30 dias para retomar este cadastro.',
  'save.ttl_t3': 'Você tem 45 dias para retomar este cadastro.',
  'save.ttl_subseller': 'Você tem 15 dias para retomar este cadastro.',
  'validation.required': 'Campo obrigatório',
  'validation.invalid_email': 'E-mail inválido',
  'validation.invalid_phone': 'Telefone inválido',
  'validation.invalid_cpf': 'CPF inválido',
  'validation.invalid_cnpj': 'CNPJ inválido',
  'review.title': 'Revise antes de enviar',
  'review.edit_section': 'Editar esta seção',
  'submit.success': 'Recebemos seu cadastro. Em breve nossa equipe entrará em contato.',
};

// ============================================================================
// REGISTRO MASTER
// ============================================================================
const REGISTRY = {
  ...MODALIDADES,
  ...TIERING,
  ...CONFIRM_CARDS,
  ...COMPOSITE,
  ...SUBSELLER,
  ...BLOCKS_REALTIME,
  ...COMMON,
};

// ──────────────────────────────────────────────────────────────────────────────
// HELPER PRINCIPAL
// ──────────────────────────────────────────────────────────────────────────────
/**
 * Retorna o microcopy com placeholders substituídos.
 * @param {string} key  ex: "confirm_card.razao_social.title"
 * @param {object} ctx  ex: { value: "ACME LTDA", seller_name: "PagsmilePay" }
 * @returns {string}    texto formatado, ou a própria key se não encontrada (modo dev-friendly)
 */
export function getMicrocopy(key, ctx = {}) {
  const raw = REGISTRY[key];
  if (raw === undefined) {
    // Modo dev-friendly: retorna a key para tornar fácil identificar microcopy faltante
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(`[microcopy] key não encontrada: ${key}`);
    }
    return key;
  }
  const merged = { seller_name: PLACEHOLDER_SELLER, ...ctx };
  return String(raw).replace(/\{(\w+)\}/g, (_, name) =>
    merged[name] !== undefined && merged[name] !== null ? String(merged[name]) : `{${name}}`
  );
}

/**
 * Retorna o REGISTRY completo (útil para tela de auditoria de microcopy).
 */
export function getAllMicrocopy() {
  return { ...REGISTRY };
}

export const MICROCOPY_PLACEHOLDER_SELLER = PLACEHOLDER_SELLER;

export default { getMicrocopy, getAllMicrocopy, MICROCOPY_PLACEHOLDER_SELLER };