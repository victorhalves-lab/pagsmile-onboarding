/**
 * Sentinel Text Parser — aggressive heuristic that takes the raw SENTINEL
 * analysis text (often a wall of text with no structure) and returns a list
 * of structured sections with inferred titles.
 *
 * Strategy:
 *   1. Split by explicit markers first (Conclusão:, Evidências:, etc.)
 *   2. Fallback: detect thematic shifts by keyword families
 *   3. Split long paragraphs by sentence heuristics
 *   4. Return: [{ id, title, icon, paragraphs: string[] }]
 */

const EXPLICIT_MARKERS = [
  { re: /(?:^|\n)\s*(?:\*\*)?(resumo\s*executivo|sumário\s*executivo|sumario\s*executivo)(?:\*\*)?\s*[:\-]\s*/gi, title: 'Resumo Executivo', icon: '📝', id: 'resumo' },
  { re: /(?:^|\n)\s*(?:\*\*)?(conclus[aã]o|parecer\s*final|veredito)(?:\*\*)?\s*[:\-]\s*/gi, title: 'Conclusão & Recomendação', icon: '🎯', id: 'conclusao' },
  { re: /(?:^|\n)\s*(?:\*\*)?(evid[êe]ncias|provas|achados)(?:\*\*)?\s*[:\-]\s*/gi, title: 'Evidências Analisadas', icon: '📋', id: 'evidencias' },
  { re: /(?:^|\n)\s*(?:\*\*)?(recomendaç[ãa]o|recomendações|próximos?\s*passos?|proximos?\s*passos?)(?:\*\*)?\s*[:\-]\s*/gi, title: 'Recomendações', icon: '💡', id: 'recomendacao' },
  { re: /(?:^|\n)\s*(?:\*\*)?(an[aá]lise\s*cadastral|cadastro|identidade)(?:\*\*)?\s*[:\-]\s*/gi, title: 'Cadastro & Identidade', icon: '🏢', id: 'cadastro' },
  { re: /(?:^|\n)\s*(?:\*\*)?(an[aá]lise\s*financeira|financeiro|saúde\s*financeira|saude\s*financeira)(?:\*\*)?\s*[:\-]\s*/gi, title: 'Análise Financeira', icon: '💰', id: 'financeiro' },
  { re: /(?:^|\n)\s*(?:\*\*)?(sócios|socios|qsa|quadro\s*societ[áa]rio)(?:\*\*)?\s*[:\-]\s*/gi, title: 'Sócios & QSA', icon: '👥', id: 'socios' },
  { re: /(?:^|\n)\s*(?:\*\*)?(opera[çc][ãa]o|modelo\s*de\s*neg[óo]cio|an[aá]lise\s*operacional)(?:\*\*)?\s*[:\-]\s*/gi, title: 'Operação & Modelo de Negócio', icon: '⚙️', id: 'operacao' },
  { re: /(?:^|\n)\s*(?:\*\*)?(compliance|pld|pld\/ft|lavagem)(?:\*\*)?\s*[:\-]\s*/gi, title: 'Compliance & PLD', icon: '🛡️', id: 'compliance' },
  { re: /(?:^|\n)\s*(?:\*\*)?(reputaç[ãa]o|mídia|midia\s*advers)(?:\*\*)?\s*[:\-]\s*/gi, title: 'Reputação & Mídia', icon: '⭐', id: 'reputacao' },
  { re: /(?:^|\n)\s*(?:\*\*)?(biometria|liveness|facematch)(?:\*\*)?\s*[:\-]\s*/gi, title: 'Biometria & Identidade', icon: '📸', id: 'biometria' },
  { re: /(?:^|\n)\s*(?:\*\*)?(pontos?\s*positivos?)(?:\*\*)?\s*[:\-]\s*/gi, title: 'Pontos Positivos', icon: '✅', id: 'positivos' },
  { re: /(?:^|\n)\s*(?:\*\*)?(pontos?\s*de\s*aten[çc][ãa]o|atenç[ãa]o|riscos?\s*identificados?)(?:\*\*)?\s*[:\-]\s*/gi, title: 'Pontos de Atenção', icon: '⚠️', id: 'atencao' },
  { re: /(?:^|\n)\s*(?:\*\*)?(condi[çc][õo]es|condi[çc][õo]es\s*de\s*aprovaç[ãa]o)(?:\*\*)?\s*[:\-]\s*/gi, title: 'Condições de Aprovação', icon: '📌', id: 'condicoes' },
];

// Keywords that suggest a new paragraph should start
const PARAGRAPH_STARTERS = /^(Portanto|Por\s*fim|Além\s*disso|Alem\s*disso|Entretanto|Contudo|Nota-se|Observa-se|Destaca-se|Por\s*outro\s*lado|Em\s*resumo|Em\s*conclusão|Em\s*conclusao|Cabe\s*ressaltar|Vale\s*mencionar|Ressalta-se|Ademais)/i;

function splitIntoParagraphs(text) {
  if (!text) return [];
  // Normalise line breaks
  let t = text.replace(/\r\n/g, '\n').trim();

  // If already has double-newline breaks, honour them
  if (/\n\s*\n/.test(t)) {
    return t.split(/\n\s*\n+/).map(p => p.trim()).filter(Boolean);
  }

  // Otherwise split by sentence and regroup into paragraphs
  // Split into sentences on ". " / "? " / "! " but keep the terminator
  const sentences = t
    .split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ])/g)
    .map(s => s.trim())
    .filter(Boolean);

  if (sentences.length <= 2) return [t];

  const paragraphs = [];
  let current = [];
  const MAX_LEN = 320; // chars — hard limit per paragraph

  for (const s of sentences) {
    const startsNew = PARAGRAPH_STARTERS.test(s);
    const currentLen = current.join(' ').length;
    if ((startsNew && current.length > 0) || currentLen + s.length > MAX_LEN) {
      paragraphs.push(current.join(' '));
      current = [s];
    } else {
      current.push(s);
    }
  }
  if (current.length > 0) paragraphs.push(current.join(' '));

  return paragraphs.map(p => p.trim()).filter(Boolean);
}

/**
 * Find explicit markers in the text. Returns an array of { index, marker }.
 */
function findMarkers(text) {
  const found = [];
  for (const m of EXPLICIT_MARKERS) {
    m.re.lastIndex = 0;
    let match;
    while ((match = m.re.exec(text)) !== null) {
      found.push({
        index: match.index,
        endIndex: match.index + match[0].length,
        title: m.title,
        icon: m.icon,
        id: m.id,
      });
    }
  }
  // Sort by position, de-duplicate overlaps keeping the first
  found.sort((a, b) => a.index - b.index);
  const cleaned = [];
  for (const mk of found) {
    if (cleaned.length === 0 || mk.index >= cleaned[cleaned.length - 1].endIndex) {
      cleaned.push(mk);
    }
  }
  return cleaned;
}

/**
 * Parse the full SENTINEL text into structured sections.
 * @param {string} text
 * @returns {Array<{ id, title, icon, paragraphs: string[] }>}
 */
export function parseSentinelText(text) {
  if (!text || typeof text !== 'string') return [];

  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const markers = findMarkers(cleaned);

  // Case A: no explicit markers → single auto-section "Análise Completa"
  if (markers.length === 0) {
    const paragraphs = splitIntoParagraphs(cleaned);
    if (paragraphs.length === 0) return [];
    return [
      {
        id: 'analise',
        title: 'Análise Completa',
        icon: '🧠',
        paragraphs,
      },
    ];
  }

  // Case B: has markers → split accordingly
  const sections = [];

  // Preamble before the first marker
  const preamble = cleaned.slice(0, markers[0].index).trim();
  if (preamble) {
    sections.push({
      id: 'introducao',
      title: 'Introdução',
      icon: '📖',
      paragraphs: splitIntoParagraphs(preamble),
    });
  }

  for (let i = 0; i < markers.length; i++) {
    const mk = markers[i];
    const nextStart = i + 1 < markers.length ? markers[i + 1].index : cleaned.length;
    const content = cleaned.slice(mk.endIndex, nextStart).trim();
    if (!content) continue;
    sections.push({
      id: `${mk.id}-${i}`,
      title: mk.title,
      icon: mk.icon,
      paragraphs: splitIntoParagraphs(content),
    });
  }

  return sections;
}