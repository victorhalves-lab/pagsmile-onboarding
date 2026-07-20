/**
 * exportUtils — utilitários para exportar capítulos da Documentação Master.
 *
 * Estratégia "conteúdo primeiro": esta versão usa o suporte nativo de impressão
 * do navegador (window.print) com CSS @media print já configurado em
 * pages/DocumentacaoMaster.jsx. Funcional sem dependências adicionais.
 *
 * Implementações futuras (jspdf + html2canvas / docx) podem substituir estas
 * funções mantendo a mesma assinatura.
 */

/**
 * Imprime o capítulo ativo (ou root inteiro) como PDF via diálogo nativo.
 * O CSS @media print da página já oculta tudo que não está marcado como
 * .doc-master-printable e força page-breaks corretos.
 */
export async function exportChapterToPdf(elementId, title) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(elementId);
  if (!el) {
    console.warn(`[exportChapterToPdf] elemento '${elementId}' não encontrado`);
    return;
  }
  const previousTitle = document.title;
  document.title = title || 'Documentação Master';
  document.body.classList.add('printing-doc-master');
  try {
    window.print();
  } finally {
    // O `afterprint` event garante restauração mesmo em cancelamento.
    const restore = () => {
      document.body.classList.remove('printing-doc-master');
      document.title = previousTitle;
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
  }
}

/**
 * Exporta capítulo como DOCX simples — implementação inicial: salva como HTML
 * com extensão .doc, que o Word abre nativamente preservando formatação básica.
 * Versão futura usará a lib `docx` para gerar arquivo nativo.
 */
export async function exportChapterToDocx(elementId, title) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(elementId);
  if (!el) {
    console.warn(`[exportChapterToDocx] elemento '${elementId}' não encontrado`);
    return;
  }

  const safeTitle = (title || 'capitulo').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
  const html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  body { font-family: 'Calibri', Arial, sans-serif; color: #1a1a1a; font-size: 11pt; line-height: 1.55; }
  h1 { color: #0A0A0A; font-size: 22pt; border-bottom: 2px solid #1356E2; padding-bottom: 6pt; }
  h2 { color: #0A0A0A; font-size: 16pt; margin-top: 18pt; }
  h3 { color: #0A0A0A; font-size: 13pt; margin-top: 14pt; }
  table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
  th { background: #0A0A0A; color: #fff; text-align: left; padding: 6pt; font-size: 10pt; }
  td { border: 1px solid #ddd; padding: 5pt; font-size: 10pt; vertical-align: top; }
  pre, code { font-family: 'Consolas', monospace; background: #f4f4f4; padding: 4pt; font-size: 9.5pt; }
  pre { border: 1px solid #ddd; white-space: pre-wrap; word-wrap: break-word; }
</style>
</head>
<body>${el.innerHTML}</body>
</html>`;

  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeTitle}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}