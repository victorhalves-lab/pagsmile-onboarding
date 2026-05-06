import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import ConteudoContrato from '@/components/contrato/ConteudoContrato';
import { buildDocxFromContractDom } from '@/lib/contratoToDocx';

/**
 * Botão que baixa o contrato como documento Word (.docx).
 *
 * Estratégia:
 * 1. Renderiza <ConteudoContrato /> em container off-screen (mesma fonte de
 *    verdade do PDF) — garante que o texto sai 100% idêntico ao preview.
 * 2. Lê o DOM resultante e converte em estrutura Word (texto selecionável,
 *    tabelas reais, formatação preservada).
 * 3. Faz o download como .docx.
 */
export default function DownloadContractDocxButton({
  contract,
  variant = 'outline',
  size = 'default',
  label = 'Baixar Word',
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
    tempContainer.style.width = '850px';
    tempContainer.style.background = '#ffffff';
    tempContainer.style.zIndex = '-1';
    document.body.appendChild(tempContainer);

    let root = null;

    try {
      const ReactDOM = await import('react-dom/client');
      root = ReactDOM.createRoot(tempContainer);
      root.render(<ConteudoContrato contract={contract} />);

      // Aguarda render
      await new Promise(resolve => setTimeout(resolve, 600));

      const contractRoot = tempContainer.firstElementChild;
      if (!contractRoot) throw new Error('Falha ao renderizar contrato');

      const blob = await buildDocxFromContractDom(contractRoot, contract);

      // Download
      const fileName = `${contract.codigo || contract.clientName || 'contrato'}.docx`;
      const safeName = fileName.replace(/[^a-zA-Z0-9-_.]/g, '_');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = safeName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Documento Word gerado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar Word do contrato:', err);
      toast.error('Erro ao gerar o documento Word. Tente novamente.');
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
        <FileText className="w-4 h-4 mr-2" />
      )}
      {label}
    </Button>
  );
}