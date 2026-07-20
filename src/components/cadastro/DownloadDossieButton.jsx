import React, { useState } from 'react';
import { Download, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DownloadDossieButton({ merchantId, merchantName }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateCadastroPdf', { merchantId }, { responseType: 'arraybuffer' });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dossie_${merchantName || merchantId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Dossiê gerado com sucesso!');
    } catch (err) {
      toast.error('Erro ao gerar dossiê: ' + (err.message || 'Tente novamente'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleDownload}
      disabled={loading}
      variant="outline"
      className="gap-2 border-[var(--pinbank-blue)]/30 text-[var(--pinbank-blue)] hover:bg-[var(--pinbank-blue)]/5"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      {loading ? 'Gerando PDF...' : 'Baixar Dossiê'}
    </Button>
  );
}