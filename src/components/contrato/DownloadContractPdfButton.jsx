import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ConteudoContrato from '@/components/contrato/ConteudoContrato';

/**
 * Botão que baixa o contrato em PDF usando EXATAMENTE o mesmo
 * componente <ConteudoContrato /> que renderiza o preview.
 *
 * Estratégia de paginação inteligente:
 * 1. Renderiza o contrato em container off-screen em tamanho real.
 * 2. Identifica todos os blocos marcados com [data-pdf-block] (cláusulas,
 *    parágrafos, tabelas, headers, assinaturas).
 * 3. Distribui os blocos em páginas A4 — um bloco NUNCA é cortado:
 *    se ele não cabe no espaço restante, vai inteiro para a próxima página.
 * 4. Captura cada página separadamente via html2canvas e adiciona ao PDF.
 *
 * Resultado: nenhum corte no meio de texto, tabelas ou títulos.
 */

// A4: 210mm x 297mm. Margens 15mm. Conversão px @ scale 2 → mm.
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 15;
const CONTENT_WIDTH_MM = A4_WIDTH_MM - 2 * MARGIN_MM; // 180mm
const CONTENT_HEIGHT_MM = A4_HEIGHT_MM - 2 * MARGIN_MM; // 267mm

export default function DownloadContractPdfButton({
  contract,
  variant = 'outline',
  size = 'default',
  label = 'Baixar PDF',
  className = '',
}) {
  const [generating, setGenerating] = useState(false);

  const handleDownload = async () => {
    if (!contract) {
      toast.error('Contrato não disponível para download.');
      return;
    }
    setGenerating(true);

    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.top = '0';
    tempContainer.style.left = '-10000px';
    tempContainer.style.width = '800px';
    tempContainer.style.background = '#ffffff';
    tempContainer.style.zIndex = '-1';
    document.body.appendChild(tempContainer);

    let root = null;

    try {
      const ReactDOM = await import('react-dom/client');
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      root = ReactDOM.createRoot(tempContainer);
      root.render(<ConteudoContrato contract={contract} />);

      // Aguarda render + carregamento de imagens (logo)
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Aguarda imagens carregarem
      const imgs = tempContainer.querySelectorAll('img');
      await Promise.all(Array.from(imgs).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(res => {
          img.onload = res;
          img.onerror = res;
          setTimeout(res, 3000); // timeout safety
        });
      }));

      // O elemento raiz do contrato (primeiro filho do container)
      const contractRoot = tempContainer.firstElementChild;
      if (!contractRoot) throw new Error('Falha ao renderizar contrato');

      const containerRect = contractRoot.getBoundingClientRect();
      const containerTop = containerRect.top;
      const containerWidthPx = containerRect.width;

      // px → mm: usamos a largura em mm conhecida (CONTENT_WIDTH_MM)
      const pxToMm = CONTENT_WIDTH_MM / containerWidthPx;

      // Coleta TODOS os blocos atômicos ([data-pdf-block]).
      // Filtra só os que estão no nível mais alto possível (não-aninhados em outros blocks).
      const allBlocks = Array.from(contractRoot.querySelectorAll('[data-pdf-block]'));
      const topLevelBlocks = allBlocks.filter(el => {
        // Bloco é top-level se nenhum ancestral (até contractRoot) tiver data-pdf-block
        let parent = el.parentElement;
        while (parent && parent !== contractRoot) {
          if (parent.hasAttribute('data-pdf-block')) return false;
          parent = parent.parentElement;
        }
        return true;
      });

      if (topLevelBlocks.length === 0) {
        throw new Error('Nenhum bloco atômico identificado');
      }

      // Mede cada bloco: posição Y relativa ao contractRoot + altura
      const blocks = topLevelBlocks.map(el => {
        const rect = el.getBoundingClientRect();
        return {
          el,
          topPx: rect.top - containerTop,
          heightPx: rect.height,
          topMm: (rect.top - containerTop) * pxToMm,
          heightMm: rect.height * pxToMm,
        };
      });

      // Algoritmo: distribui blocos em páginas. Se um bloco não couber no
      // espaço restante, fecha a página atual e começa nova.
      const pages = []; // cada página: { startTopMm, endBottomMm }
      let pageStartMm = 0;
      let cursorMm = 0;

      for (const b of blocks) {
        // Se o bloco começa antes do cursor (sobreposição por margin negativa, etc), normaliza
        const blockTop = Math.max(b.topMm, cursorMm);
        const blockBottom = b.topMm + b.heightMm;
        const usedOnPage = blockBottom - pageStartMm;

        if (usedOnPage > CONTENT_HEIGHT_MM && blockTop > pageStartMm) {
          // Não cabe → fecha página atual no fim do bloco anterior
          pages.push({ startMm: pageStartMm, endMm: cursorMm });
          pageStartMm = b.topMm;
        }
        cursorMm = blockBottom;

        // Caso extremo: o próprio bloco é maior que uma página.
        // Não tem como evitar corte — aceita o corte só dentro desse bloco gigante.
        if (b.heightMm > CONTENT_HEIGHT_MM) {
          // Fecha página antes do bloco (se já tem conteúdo), depois consome o bloco em fatias
          if (b.topMm > pageStartMm) {
            pages.push({ startMm: pageStartMm, endMm: b.topMm });
            pageStartMm = b.topMm;
          }
          // Quebra o bloco gigante em páginas inteiras
          let sliceStart = b.topMm;
          while (sliceStart + CONTENT_HEIGHT_MM < b.topMm + b.heightMm) {
            pages.push({ startMm: sliceStart, endMm: sliceStart + CONTENT_HEIGHT_MM });
            sliceStart += CONTENT_HEIGHT_MM;
          }
          pageStartMm = sliceStart;
          cursorMm = b.topMm + b.heightMm;
        }
      }
      // Última página
      if (cursorMm > pageStartMm) {
        pages.push({ startMm: pageStartMm, endMm: cursorMm });
      }

      // Renderiza o documento inteiro como UMA imagem (mais rápido) e fatia.
      const fullCanvas = await html2canvas(contractRoot, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 800,
        backgroundColor: '#ffffff',
      });
      const fullHeightPx = fullCanvas.height;
      const fullWidthPx = fullCanvas.width;
      // px do canvas → mm (canvas tem scale 2× e largura = 800px do container)
      const canvasPxToMm = CONTENT_WIDTH_MM / (containerWidthPx * 2);

      const pdf = new jsPDF('p', 'mm', 'a4');

      for (let i = 0; i < pages.length; i++) {
        const p = pages[i];
        // px no canvas correspondente
        const sliceTopPx = Math.round((p.startMm / canvasPxToMm));
        const sliceBottomPx = Math.min(Math.round((p.endMm / canvasPxToMm)), fullHeightPx);
        const sliceHeightPx = sliceBottomPx - sliceTopPx;
        if (sliceHeightPx <= 0) continue;

        // Recorta a fatia em um canvas temporário
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = fullWidthPx;
        sliceCanvas.height = sliceHeightPx;
        const ctx = sliceCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, fullWidthPx, sliceHeightPx);
        ctx.drawImage(fullCanvas, 0, sliceTopPx, fullWidthPx, sliceHeightPx, 0, 0, fullWidthPx, sliceHeightPx);

        const sliceImg = sliceCanvas.toDataURL('image/jpeg', 0.95);
        const sliceHeightMm = sliceHeightPx * canvasPxToMm;

        if (i > 0) pdf.addPage();
        pdf.addImage(sliceImg, 'JPEG', MARGIN_MM, MARGIN_MM, CONTENT_WIDTH_MM, sliceHeightMm);
      }

      const fileName = `${contract.codigo || contract.clientName || 'contrato'}.pdf`;
      pdf.save(fileName.replace(/[^a-zA-Z0-9-_.]/g, '_'));
      toast.success('PDF gerado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar PDF do contrato:', err);
      toast.error('Erro ao gerar o PDF. Tente novamente.');
    } finally {
      try { if (root) root.unmount(); } catch {}
      if (tempContainer.parentNode) {
        tempContainer.parentNode.removeChild(tempContainer);
      }
      setGenerating(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleDownload}
      disabled={generating}
      className={className}
    >
      {generating ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Download className="w-4 h-4 mr-2" />
      )}
      {label}
    </Button>
  );
}