import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Renderiza um elemento DOM como canvas (html2canvas) e devolve dataURL PNG.
 */
async function renderToCanvas(element) {
  return html2canvas(element, {
    scale: 2,        // alta resolução
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });
}

export async function downloadProposalAsPNG(element, filename = 'pagsmile-proposal.png') {
  const canvas = await renderToCanvas(element);
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

export async function downloadProposalAsPDF(element, filename = 'pagsmile-proposal.pdf') {
  const canvas = await renderToCanvas(element);
  const imgData = canvas.toDataURL('image/png');

  // Cria PDF retrato A4
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidthMm = 210;
  const pageHeightMm = 297;
  const imgWidthMm = pageWidthMm;
  const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;

  let heightLeft = imgHeightMm;
  let position = 0;
  pdf.addImage(imgData, 'PNG', 0, position, imgWidthMm, imgHeightMm);
  heightLeft -= pageHeightMm;

  while (heightLeft > 0) {
    position = heightLeft - imgHeightMm;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidthMm, imgHeightMm);
    heightLeft -= pageHeightMm;
  }
  pdf.save(filename);
}