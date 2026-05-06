import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ConteudoContrato from '@/components/contrato/ConteudoContrato';

/**
 * Botão que baixa o contrato em PDF usando EXATAMENTE o mesmo
 * componente <ConteudoContrato /> que renderiza o preview.
 *
 * Para garantir alta qualidade e fidelidade visual, renderiza o contrato
 * em tamanho real (sem o scale do preview) num container off-screen,
 * tira print com html2canvas e gera o PDF com jsPDF (multi-página A4).
 */
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

    // Container temporário fora da viewport, em tamanho real
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.top = '0';
    tempContainer.style.left = '-10000px';
    tempContainer.style.width = '800px';
    tempContainer.style.background = '#ffffff';
    tempContainer.style.zIndex = '-1';
    document.body.appendChild(tempContainer);

    try {
      const ReactDOM = await import('react-dom/client');
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const root = ReactDOM.createRoot(tempContainer);
      root.render(<ConteudoContrato contract={contract} />);

      // Aguarda render + carregamento de imagens
      await new Promise(resolve => setTimeout(resolve, 800));

      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: 800,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 10;

      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);

      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }

      const fileName = `${contract.codigo || contract.clientName || 'contrato'}.pdf`;
      pdf.save(fileName.replace(/[^a-zA-Z0-9-_.]/g, '_'));
      toast.success('PDF gerado com sucesso!');

      root.unmount();
    } catch (err) {
      console.error('Erro ao gerar PDF do contrato:', err);
      toast.error('Erro ao gerar o PDF. Tente novamente.');
    } finally {
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