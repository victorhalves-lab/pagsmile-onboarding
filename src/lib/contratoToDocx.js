/**
 * Converte o DOM renderizado do <ConteudoContrato /> em um documento Word (.docx).
 *
 * Estratégia: o componente JSX já é a fonte de verdade. Em vez de duplicar todo
 * o texto das cláusulas em arrays, lemos o DOM real (renderizado off-screen) e
 * convertemos cada nó em primitivas do `docx`.
 *
 * Suporta:
 * - Headings (H1, H2, H3, H4)
 * - Parágrafos com bold/italic preservados
 * - Tabelas (KVTable e BrandTable, marcadas com [data-pdf-block="table"])
 * - Quebras de seção / cláusulas como blocos atômicos do Word
 * - Cores: títulos em azul Pagsmile (#002443) ou verde (#2bc196), corpo preto
 *
 * Retorna: Blob (.docx) pronto para download.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  PageOrientation,
  convertInchesToTwip,
} from 'docx';

const COLOR_PRIMARY = '002443';   // azul Pagsmile
const COLOR_ACCENT = '2BC196';    // verde Pagsmile
const COLOR_BODY = '1A1A1A';      // preto suave para texto
const COLOR_MUTED = '4A5568';     // cinza para textos secundários

// ─── helpers ────────────────────────────────────────────────────────────────

/** Converte runs de um elemento DOM em TextRun[] do docx, preservando bold/italic */
function nodeToRuns(node, options = {}) {
  const { bold = false, italic = false, color = COLOR_BODY, size = 20 } = options;
  const runs = [];

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent;
    if (text && text.trim()) {
      runs.push(new TextRun({ text, bold, italics: italic, color, size, font: 'Calibri' }));
    } else if (text) {
      // Preserva espaços entre runs
      runs.push(new TextRun({ text, bold, italics: italic, color, size, font: 'Calibri' }));
    }
    return runs;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return runs;

  const tag = node.tagName?.toLowerCase();
  const childBold = bold || tag === 'strong' || tag === 'b';
  const childItalic = italic || tag === 'em' || tag === 'i';

  for (const child of node.childNodes) {
    runs.push(...nodeToRuns(child, { bold: childBold, italic: childItalic, color, size }));
  }
  return runs;
}

/** Cria um Paragraph para parágrafos de corpo (justificado, espaçamento normal) */
function makeBodyParagraph(domEl) {
  const runs = nodeToRuns(domEl, { color: COLOR_BODY, size: 20 });
  if (runs.length === 0) return null;

  // Detecta indentação (paddingLeft > 0 → sub-item)
  const paddingLeft = parseInt(domEl.style?.paddingLeft || '0', 10) || 0;
  const indent = paddingLeft > 0 ? { left: convertInchesToTwip(0.4) } : undefined;

  // Detecta se é um parágrafo "destaque" (bold+centered, tipo "RESOLVEM AS PARTES...")
  const isBoldCentered = domEl.style?.fontWeight === '700' || domEl.style?.fontWeight === 'bold';
  const isCentered = domEl.style?.textAlign === 'center';

  return new Paragraph({
    children: runs,
    alignment: isCentered ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
    spacing: { after: 120, line: 320 },
    indent,
  });
}

/** Cria um Paragraph para headings, com cor e tamanho variando por nível */
function makeHeading(domEl) {
  const tag = domEl.tagName?.toLowerCase();
  const blockType = domEl.getAttribute('data-pdf-block');

  let size = 26; // 13pt
  let color = COLOR_PRIMARY;
  let alignment = AlignmentType.LEFT;
  let upper = false;
  let spaceBefore = 240;
  let spaceAfter = 120;
  let bordered = false;

  if (blockType === 'section-heading') {
    if (tag === 'h2') {
      // Section heading nível 1: centralizado, uppercase, com borda superior
      size = 28; color = COLOR_PRIMARY; alignment = AlignmentType.CENTER; upper = true;
      spaceBefore = 480; spaceAfter = 240; bordered = true;
    } else {
      // Section heading nível 2: verde, com borda
      size = 22; color = COLOR_ACCENT; spaceBefore = 320; spaceAfter = 120;
    }
  } else if (blockType === 'clause-title') {
    size = 24; color = COLOR_PRIMARY; upper = true;
    spaceBefore = 360; spaceAfter = 160;
    bordered = true;
  } else if (blockType === 'subclause-title') {
    size = 22; color = COLOR_ACCENT;
    spaceBefore = 240; spaceAfter = 120;
  }

  let text = (domEl.textContent || '').trim();
  if (upper) text = text.toUpperCase();

  return new Paragraph({
    children: [new TextRun({ text, bold: true, color, size, font: 'Calibri' })],
    alignment,
    spacing: { before: spaceBefore, after: spaceAfter, line: 300 },
    border: bordered ? {
      bottom: { color: COLOR_ACCENT, space: 4, style: BorderStyle.SINGLE, size: 8 },
    } : undefined,
  });
}

/** Lê uma tabela DOM e converte em Table do docx, preservando estrutura visual */
function makeTable(domTable) {
  const allRows = Array.from(domTable.querySelectorAll('tr'));
  if (allRows.length === 0) return null;

  // Detecta header (thead)
  const headerRows = Array.from(domTable.querySelectorAll('thead tr'));
  const bodyRows = Array.from(domTable.querySelectorAll('tbody tr'));
  const useExplicitHeader = headerRows.length > 0;

  const rows = [];

  // Header rows (azul Pagsmile + texto branco)
  for (const tr of headerRows) {
    const cells = Array.from(tr.children);
    rows.push(new TableRow({
      children: cells.map(cell => new TableCell({
        children: [new Paragraph({
          children: [new TextRun({
            text: (cell.textContent || '').trim(),
            bold: true, color: 'FFFFFF', size: 18, font: 'Calibri',
          })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 40, after: 40 },
        })],
        shading: { type: ShadingType.CLEAR, fill: COLOR_PRIMARY, color: 'auto' },
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
      })),
      tableHeader: true,
    }));
  }

  // Body rows (com zebra-stripe e primeira coluna em destaque para KVTable)
  const dataRows = useExplicitHeader ? bodyRows : allRows;
  for (let i = 0; i < dataRows.length; i++) {
    const tr = dataRows[i];
    const cells = Array.from(tr.children);
    const isStripe = i % 2 === 1;

    rows.push(new TableRow({
      children: cells.map((cell, j) => {
        const isFirstCol = j === 0;
        const isKVTable = cells.length === 2; // KVTable tem só 2 colunas (label, value)
        const labelStyle = isKVTable && isFirstCol;

        const runs = nodeToRuns(cell, {
          color: COLOR_BODY,
          size: 18,
          bold: labelStyle,
        });

        return new TableCell({
          children: [new Paragraph({
            children: runs.length > 0 ? runs : [new TextRun({ text: ' ', size: 18, font: 'Calibri' })],
            alignment: isFirstCol ? AlignmentType.LEFT : AlignmentType.CENTER,
            spacing: { before: 40, after: 40, line: 280 },
          })],
          shading: labelStyle
            ? { type: ShadingType.CLEAR, fill: 'F0F4F8', color: 'auto' }
            : (isStripe ? { type: ShadingType.CLEAR, fill: 'F8FAFB', color: 'auto' } : undefined),
          margins: { top: 80, bottom: 80, left: 100, right: 100 },
          borders: labelStyle ? {
            right: { color: COLOR_ACCENT, size: 12, style: BorderStyle.SINGLE },
          } : undefined,
        });
      }),
    }));
  }

  return new Table({
    rows,
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E0' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E0' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E0' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E0' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
    },
  });
}

// ─── main ───────────────────────────────────────────────────────────────────

/**
 * Constrói o documento Word a partir do elemento DOM raiz do <ConteudoContrato />.
 * @param {HTMLElement} contractRoot - elemento renderizado off-screen
 * @param {object} contract - dados do contrato (para metadados/título do arquivo)
 * @returns {Promise<Blob>}
 */
export async function buildDocxFromContractDom(contractRoot, contract = {}) {
  const children = [];

  // Cabeçalho do documento (substitui o "header com gradiente" do PDF)
  children.push(new Paragraph({
    children: [new TextRun({
      text: 'CONTRATO MASTER DE PRESTAÇÃO DE SERVIÇOS',
      bold: true, color: COLOR_PRIMARY, size: 32, font: 'Calibri',
    })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 120, line: 320 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({
      text: 'Abertura de Conta de Pagamento e Subadquirência',
      color: COLOR_ACCENT, size: 22, font: 'Calibri', italics: true,
    })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 480, line: 280 },
    border: {
      bottom: { color: COLOR_ACCENT, space: 8, style: BorderStyle.SINGLE, size: 12 },
    },
  }));

  // Percorre os filhos diretos do contractRoot, em ordem.
  // Para cada elemento, despacha pra função correta.
  const walkChildren = (parent) => {
    const kids = Array.from(parent.children);
    for (const el of kids) {
      const blockType = el.getAttribute?.('data-pdf-block');
      const tag = el.tagName?.toLowerCase();

      if (blockType === 'header') {
        // Pula o header visual (já adicionamos o título acima)
        continue;
      }
      if (blockType === 'paragraph') {
        const p = makeBodyParagraph(el);
        if (p) children.push(p);
        continue;
      }
      if (blockType === 'clause-title' || blockType === 'subclause-title' || blockType === 'section-heading') {
        children.push(makeHeading(el));
        continue;
      }
      if (blockType === 'table') {
        const t = makeTable(el);
        if (t) {
          children.push(t);
          // Espaço após tabela
          children.push(new Paragraph({ children: [new TextRun({ text: '', size: 8 })], spacing: { after: 160 } }));
        }
        continue;
      }
      if (blockType === 'signatures') {
        // Bloco de assinaturas: adiciona quebra de página e processa recursivamente
        // o conteúdo interno
        children.push(new Paragraph({
          children: [new TextRun({ text: '', size: 8 })],
          pageBreakBefore: true,
        }));
        walkChildren(el);
        continue;
      }

      // Caso o bloco não seja marcado, mas contenha filhos com marcação (containers como <div>)
      if (el.children?.length > 0) {
        walkChildren(el);
        continue;
      }

      // Texto solto em <p>/<div> (preâmbulo, etc.)
      if (tag === 'p' || tag === 'div') {
        const text = (el.textContent || '').trim();
        if (text) {
          const isCentered = el.style?.textAlign === 'center';
          const runs = nodeToRuns(el, { color: COLOR_BODY, size: 20 });
          children.push(new Paragraph({
            children: runs,
            alignment: isCentered ? AlignmentType.CENTER : AlignmentType.JUSTIFIED,
            spacing: { after: 120, line: 320 },
          }));
        }
      }
    }
  };

  walkChildren(contractRoot);

  // Bloco de assinaturas final — campos manuais (sempre presentes mesmo se já apareceram)
  // Footer
  children.push(new Paragraph({
    children: [new TextRun({
      text: `© ${new Date().getFullYear()} Pagsmile Instituição de Pagamento Ltda. Todos os direitos reservados.`,
      color: COLOR_MUTED, size: 16, font: 'Calibri', italics: true,
    })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 480 },
    border: {
      top: { color: 'CBD5E0', space: 8, style: BorderStyle.SINGLE, size: 4 },
    },
  }));

  const doc = new Document({
    creator: 'Pagsmile',
    title: contract.codigo || 'Contrato Master',
    description: 'Contrato Master de Prestação de Serviços',
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 20 } },
      },
    },
    sections: [{
      properties: {
        page: {
          size: { orientation: PageOrientation.PORTRAIT, width: 11906, height: 16838 }, // A4
          margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 }, // 2cm
        },
      },
      children,
    }],
  });

  return await Packer.toBlob(doc);
}