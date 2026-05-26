// Contexto Brasil ↔ Global — persiste em localStorage e dispara evento para a sidebar
// reagir em tempo real. Sem provider/Context API para manter dependência zero.

const KEY = 'pagsmile_app_context'; // 'brasil' | 'global'
const EVT = 'pagsmile-context-change';

export function getAppContext() {
  try { return localStorage.getItem(KEY) === 'global' ? 'global' : 'brasil'; }
  catch { return 'brasil'; }
}

export function setAppContext(ctx) {
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

// Lista das páginas que pertencem ao "mundo Global" — usada pela sidebar
// para auto-trocar o contexto quando o usuário navega para uma delas.
export const GLOBAL_PAGES = new Set([
  'GlobalDashboard','GlobalLeadLinks','GlobalLeadsRecebidos','GlobalPropostas',
  'GlobalCriarProposta','GlobalPipeline','GlobalCanaisPaises','GlobalInterchange',
  'GlobalSimulador','GlobalLinksCompliance','GlobalKYCRecebidos','GlobalComoFunciona',
]);