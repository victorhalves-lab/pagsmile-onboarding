// ─────────────────────────────────────────────────────────────────────
// V5.1 — Pipeline Router
// ─────────────────────────────────────────────────────────────────────
// REGRA SUPREMA: este arquivo é o ÚNICO ponto onde se decide
// "este caso vai pra V4 ou pra V5.1?".
//
// Nada mais no codebase deve fazer essa pergunta. Quem precisar rotear
// chama `routeOnboardingPipeline()`.
// ─────────────────────────────────────────────────────────────────────

import { isV5_1, FRAMEWORK_V4, FRAMEWORK_V5_1 } from './frameworkConstants';

/**
 * Decide qual função de pipeline (autoEnrichOnboarding vs autoEnrichOnboardingV5_1)
 * deve processar este caso. NÃO invoca — apenas retorna o nome.
 *
 * @param {Object} onboardingCase
 * @returns {{ functionName: string, version: 'v4.0'|'v5.1' }}
 */
export function resolverPipelineFunctionName(onboardingCase) {
  if (isV5_1(onboardingCase)) {
    return { functionName: 'autoEnrichOnboardingV5_1', version: FRAMEWORK_V5_1 };
  }
  return { functionName: 'autoEnrichOnboarding', version: FRAMEWORK_V4 };
}

/**
 * Invoca o pipeline correto via base44 SDK. Use SOMENTE em backend functions.
 *
 * @param {Object} base44 — cliente do SDK
 * @param {Object} onboardingCase — caso com framework_version definido
 * @param {Object} extraPayload — payload extra passado para a function
 */
export async function routeOnboardingPipeline(base44, onboardingCase, extraPayload = {}) {
  const { functionName, version } = resolverPipelineFunctionName(onboardingCase);
  const payload = { onboardingCaseId: onboardingCase.id, ...extraPayload };
  const res = await base44.asServiceRole.functions.invoke(functionName, payload);
  return { functionName, version, response: res };
}