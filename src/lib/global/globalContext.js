// Contexto do app: Brasil ↔ Global ↔ Unificado.
// Persiste em localStorage e dispara evento para a sidebar reagir em tempo real.

const KEY = 'pagsmile_app_context'; // 'brasil' | 'global' | 'unified'
const EVT = 'pagsmile-context-change';

const VALID = new Set(['brasil', 'global', 'unified']);

export function getAppContext() {
  try {
    const v = localStorage.getItem(KEY);
    return VALID.has(v) ? v : 'brasil';
  } catch { return 'brasil'; }
}

export function setAppContext(ctx) {
  if (!VALID.has(ctx)) ctx = 'brasil';
  try {
    localStorage.setItem(KEY, ctx);
    window.dispatchEvent(new CustomEvent(EVT, { detail: ctx }));
  } catch {}
}

export function subscribeAppContext(cb) {
  const handler = (e) => cb(e.detail || getAppContext());
  window.addEventListener(EVT, handler);
  return () => window.removeEventListener(EVT, handler);
}

// Páginas do mundo Global — sidebar auto-troca o contexto quando o usuário navega.
export const GLOBAL_PAGES = new Set([
  'GlobalDashboard','GlobalLeadLinks','GlobalLeadsRecebidos','GlobalPropostas',
  'GlobalCriarProposta','GlobalPipeline','GlobalCanaisPaises','GlobalInterchange',
  'GlobalSimulador','GlobalLinksCompliance','GlobalKYCRecebidos','GlobalComoFunciona',
]);

// Páginas do mundo Unificado.
export const UNIFIED_PAGES = new Set([
  'HubPropostas','CriarPropostaUnificada',
]);