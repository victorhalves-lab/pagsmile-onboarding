import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FileText, Download, Loader2, FileJson, FileBadge, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { buildDossieV5_2, dossieToJson, downloadBlob } from '@/lib/v5_2/dossieBuilder';
import { generateDossiePdf } from './dossiePdfGenerator';
import { generateDossieXlsx } from './dossieXlsxGenerator';

/**
 * [V5.2 Fase 6.5.5] Botão "Dossiê Auditável V5.2" — gera JSON ou PDF imutável
 * do caso V5.2 com hash SHA-256 de integridade, pronto para entrega regulatória.
 *
 * Props:
 *   - caseId: ID do OnboardingCase (obrigatório)
 *   - merchantName: nome do merchant (para o nome do arquivo)
 *   - variant: 'default' (padrão) | 'compact' (sem texto, só ícone)
 */
export default function DossieV5_2Button({ caseId, merchantName, variant = 'default' }) {
  const [loading, setLoading] = useState(null); // 'json' | 'pdf' | 'xlsx' | null

  const slug = (merchantName || 'merchant')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

  const handleExport = async (format) => {
    if (!caseId) {
      toast.error('Case ID não informado.');
      return;
    }
    setLoading(format);
    try {
      const dossie = await buildDossieV5_2({ caseId });

      if (format === 'json') {
        const json = dossieToJson(dossie);
        const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
        downloadBlob(blob, `dossie-v5_2_${slug}_${timestamp}.json`);
        toast.success('Dossiê JSON gerado', {
          description: `Hash SHA-256: ${dossie.hash.substring(0, 16)}…`,
        });
      } else if (format === 'pdf') {
        const blob = generateDossiePdf(dossie);
        downloadBlob(blob, `dossie-v5_2_${slug}_${timestamp}.pdf`);
        toast.success('Dossiê PDF gerado', {
          description: `Hash SHA-256: ${dossie.hash.substring(0, 16)}…`,
        });
      } else if (format === 'xlsx') {
        const blob = generateDossieXlsx(dossie);
        downloadBlob(blob, `dossie-v5_2_${slug}_${timestamp}.xlsx`);
        toast.success('Dossiê XLSX gerado', {
          description: `Hash SHA-256: ${dossie.hash.substring(0, 16)}…`,
        });
      }
    } catch (err) {
      console.error('[Dossie V5.2] erro:', err);
      toast.error('Erro ao gerar dossiê', { description: err?.message || 'Tente novamente.' });
    } finally {
      setLoading(null);
    }
  };

  const isLoading = loading !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={variant === 'compact' ? 'icon' : 'sm'}
          disabled={isLoading}
          className={variant === 'compact' ? 'h-9 w-9' : 'gap-2'}
          title="Dossiê Auditável V5.2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-[#1356E2]" />
          )}
          {variant !== 'compact' && (
            <span>{isLoading ? 'Gerando…' : 'Dossiê Auditável'}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-[#0A0A0A]/60">
          Exportar dossiê V5.2
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={isLoading} className="cursor-pointer">
          <FileBadge className="w-4 h-4 mr-2 text-red-500" />
          <div className="flex-1">
            <div className="text-xs font-semibold">PDF Regulatório</div>
            <div className="text-[10px] text-[#0A0A0A]/50">Layout para entrega externa</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('xlsx')} disabled={isLoading} className="cursor-pointer">
          <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-600" />
          <div className="flex-1">
            <div className="text-xs font-semibold">XLSX Auditoria</div>
            <div className="text-[10px] text-[#0A0A0A]/50">Planilha multi-aba para auditoria</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('json')} disabled={isLoading} className="cursor-pointer">
          <FileJson className="w-4 h-4 mr-2 text-blue-500" />
          <div className="flex-1">
            <div className="text-xs font-semibold">JSON Imutável</div>
            <div className="text-[10px] text-[#0A0A0A]/50">Auditoria + verificação programática</div>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5 text-[9px] text-[#0A0A0A]/40 leading-tight">
          <p className="font-semibold mb-0.5">Integridade SHA-256</p>
          <p>Circ. BCB 3.978 Art. 17 + Resol. BCB 403/2024</p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}