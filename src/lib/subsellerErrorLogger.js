/**
 * Logger centralizado para erros do fluxo de onboarding (subseller + qualquer compliance).
 *
 * Objetivo: garantir que TODO bloqueio/falha que o cliente encontra seja:
 *   1. Registrado no backend (entidade IntegrationLog via logPublicClientError)
 *   2. Disparado com contexto suficiente para o time de suporte investigar sem screenshot
 *
 * Uso: `logSubsellerError({ stage, message, context })` — fire-and-forget, nunca throw.
 *
 * Pontos de uso esperados:
 *   • Questionário: validação falhou (campos obrigatórios, CNPJ inativo, etc.)
 *   • Lazy-case: falha ao criar Merchant + OnboardingCase
 *   • Upload: erro de rede, arquivo grande, tipo inválido
 *   • Submit final: caseId perdido, docs faltando, CAF falhou
 */

import { callPublicFunction } from '@/lib/publicApi';

/**
 * @param {Object} params
 * @param {string} params.stage - Identificador da etapa (ex: 'subseller_questionnaire_validation', 'subseller_lazy_case_create_failed')
 * @param {string} params.message - Mensagem descritiva do erro
 * @param {Object} [params.context] - Metadados adicionais (flowType, caseId, fieldName, etc.)
 */
export function logSubsellerError({ stage, message, context = {} }) {
  if (!stage) return;
  try {
    const payload = {
      stage: `subseller:${stage}`,
      errorMessage: String(message || 'unknown'),
      caseId: context.caseId || (typeof window !== 'undefined' ? localStorage.getItem('created_onboarding_case_id') : null),
      userAgent: typeof navigator !== 'undefined' ? (navigator.userAgent || '').slice(0, 300) : '',
      extra: {
        ...context,
        url: typeof window !== 'undefined' ? window.location.href : '',
        screenWidth: typeof window !== 'undefined' ? window.innerWidth : null,
        timestamp: new Date().toISOString(),
        linkCode: typeof window !== 'undefined' ? localStorage.getItem('onboarding_link_code') : null,
      },
    };
    // fire-and-forget — não bloqueia o fluxo se o backend estiver lento
    callPublicFunction('logPublicClientError', payload).catch(() => {});
  } catch (_) { /* silent — logger never breaks UX */ }
}

/**
 * Helper: formata uma mensagem amigável para o cliente baseada no stage.
 * Usar quando o componente quer mostrar um modal/banner explicando o problema.
 */
export function getClientFriendlyMessage(stage, fallback = 'Algo deu errado. Por favor, tente novamente.') {
  const messages = {
    validation_required_fields: 'Há campos obrigatórios não preenchidos nesta etapa.',
    validation_cnpj_inactive: 'O CNPJ informado não está com situação ATIVA na Receita Federal. Apenas empresas ativas podem prosseguir.',
    lazy_case_create_failed: 'Não conseguimos preparar seu cadastro para receber os documentos. Verifique sua conexão e tente novamente.',
    upload_network: 'Falha na conexão durante o envio do arquivo. Tente novamente — se persistir, troque de rede ou navegador.',
    upload_too_large: 'O arquivo é muito grande. Reduza para menos de 7MB ou divida em vários PDFs.',
    upload_invalid_type: 'Tipo de arquivo não aceito. Envie em PDF, JPG ou PNG.',
    case_id_missing: 'Seus documentos foram enviados mas o cadastro não foi localizado. Vamos tentar recuperar automaticamente.',
    missing_required_docs: 'Ainda faltam documentos obrigatórios para você avançar.',
    submit_failed: 'Erro ao finalizar o envio. Seus dados estão salvos — tente novamente em alguns instantes.',
  };
  return messages[stage] || fallback;
}