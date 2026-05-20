/**
 * [V5.2 Fase 6.5.5] Catálogo canônico dos 15 atalhos de teclado da tela V5.2.
 * Especificado em docs/V5_2_BLOCO6_REDESIGN_ANALISE_RISCO.md §5.5 + §2.5 (Princípio 7).
 *
 * O catálogo é a fonte única de verdade — o hook `useKeyboardShortcutsV5_2`
 * consome a lista para fazer o binding e o painel `KeyboardShortcutsPanel` para
 * renderizar o "?" help. NÃO duplique atalhos fora deste arquivo.
 */

export const SHORTCUT_CATEGORIES = {
  NAVIGATION: 'Navegação',
  ACTIONS: 'Ações de Decisão',
  TOOLS: 'Ferramentas',
};

/**
 * Tipos de atalho:
 *   - single: tecla única (ex: '1', '?', '/')
 *   - sequence: sequência de 2 teclas com timeout (ex: 'g c')
 *
 * O campo `id` precisa ser único e estável — usado pelo hook como dispatch key.
 */
export const SHORTCUTS_V5_2 = [
  // ── NAVEGAÇÃO ─────────────────────────────────────────────────────
  { id: 'tab_resumo',       keys: ['1'],   label: 'Aba Resumo & Decisão',   category: SHORTCUT_CATEGORIES.NAVIGATION, type: 'single' },
  { id: 'tab_evidencias',   keys: ['2'],   label: 'Aba Evidências',         category: SHORTCUT_CATEGORIES.NAVIGATION, type: 'single' },
  { id: 'tab_dimensional',  keys: ['3'],   label: 'Aba Dimensional BDC',    category: SHORTCUT_CATEGORIES.NAVIGATION, type: 'single' },
  { id: 'tab_sentinel',     keys: ['4'],   label: 'Aba SENTINEL & Auditoria', category: SHORTCUT_CATEGORIES.NAVIGATION, type: 'single' },
  { id: 'next_item',        keys: ['j'],   label: 'Próximo item da aba',    category: SHORTCUT_CATEGORIES.NAVIGATION, type: 'single' },
  { id: 'prev_item',        keys: ['k'],   label: 'Item anterior',          category: SHORTCUT_CATEGORIES.NAVIGATION, type: 'single' },
  { id: 'escape',           keys: ['Esc'], label: 'Voltar um nível',        category: SHORTCUT_CATEGORIES.NAVIGATION, type: 'single' },

  // ── AÇÕES DE DECISÃO ──────────────────────────────────────────────
  { id: 'action_aprovar',           keys: ['a'], label: 'Aprovar',                category: SHORTCUT_CATEGORIES.ACTIONS, type: 'single' },
  { id: 'action_aprovar_condicoes', keys: ['c'], label: 'Aprovar c/ Condições',   category: SHORTCUT_CATEGORIES.ACTIONS, type: 'single' },
  { id: 'action_manual',            keys: ['m'], label: 'Revisão Manual',         category: SHORTCUT_CATEGORIES.ACTIONS, type: 'single' },
  { id: 'action_recusar',           keys: ['r'], label: 'Recusar',                category: SHORTCUT_CATEGORIES.ACTIONS, type: 'single' },
  { id: 'action_solicitar_docs',    keys: ['s'], label: 'Solicitar docs adic.',   category: SHORTCUT_CATEGORIES.ACTIONS, type: 'single' },
  { id: 'action_escalar',           keys: ['e'], label: 'Escalar para Senior',    category: SHORTCUT_CATEGORIES.ACTIONS, type: 'single' },

  // ── FERRAMENTAS ───────────────────────────────────────────────────
  { id: 'search',           keys: ['/'],     label: 'Buscar no caso',         category: SHORTCUT_CATEGORIES.TOOLS, type: 'single' },
  { id: 'generate_pdf',     keys: ['p'],     label: 'Gerar Dossiê PDF',       category: SHORTCUT_CATEGORIES.TOOLS, type: 'single' },
  { id: 'copy_case_id',     keys: ['g','c'], label: 'Copiar ID do caso',      category: SHORTCUT_CATEGORIES.TOOLS, type: 'sequence' },
  { id: 'help',             keys: ['?'],     label: 'Painel de atalhos',      category: SHORTCUT_CATEGORIES.TOOLS, type: 'single' },
];

/** Validação: documento exige 15 atalhos. */
export const EXPECTED_SHORTCUT_COUNT = 15;

/** Helper para renderizar a tecla numa "kbd box". */
export const formatKey = (key) => {
  if (key === 'Esc') return 'Esc';
  if (key === '?') return '?';
  if (key === '/') return '/';
  return key.toUpperCase();
};