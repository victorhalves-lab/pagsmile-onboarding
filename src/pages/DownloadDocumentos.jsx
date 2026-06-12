// =============================================================================
// Página "Download de Documentos" — exibe os questionários de leads em modo
// microscópico (V5 Cartão + Pix V4) com export PDF na identidade visual Pagsmile.
// Acessada como tab "Download de Documentos" dentro de HubPropostas.
// =============================================================================

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2, CreditCard, Zap, FileText } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Ch21_QuestionariosLeads from '@/components/doc-master/chapters/Ch21_QuestionariosLeads';

const TABS = [
  { id: 'v5',  label: 'Questionário V5 — Cartão', icon: CreditCard, filename: 'Pagsmile_Questionario_Leads_V5_Cartao.pdf' },
  { id: 'pix', label: 'Questionário Pix V4',      icon: Zap,        filename: 'Pagsmile_Questionario_Leads_Pix_V4.pdf' },
];

export default function DownloadDocumentos() {
  const [tab, setTab] = useState('v5');
  const [downloading, setDownloading] = useState(false);
  const printableRef = useRef(null);

  const currentTab = TABS.find(t => t.id === tab);

  const handleDownload = async () => {
    if (!printableRef.current) return;
    setDownloading(true);
    try {
      // Renderização em alta resolução. scale=2 garante texto nítido no PDF.
      const canvas = await html2canvas(printableRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
        windowWidth: 1100,
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgW = pdfW;
      const imgH = (canvas.height * imgW) / canvas.width;

      // Pagina o canvas longo em múltiplas páginas A4
      let heightLeft = imgH;
      let position = 0;
      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
      heightLeft -= pdfH;
      while (heightLeft > 0) {
        position = heightLeft - imgH;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgW, imgH);
        heightLeft -= pdfH;
      }
      pdf.save(currentTab.filename);
      toast.success('PDF baixado com sucesso!');
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      toast.error(`Não foi possível gerar o PDF: ${err?.message || 'erro desconhecido'}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#002443] to-[#003366] flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#002443]">Download de Documentos</h1>
              <p className="text-sm text-[#002443]/60 mt-0.5">
                Documentação microscópica dos questionários públicos de captação de leads.
              </p>
            </div>
          </div>
          <Button
            onClick={handleDownload}
            disabled={downloading}
            className="bg-[#2bc196] hover:bg-[#36706c] text-white"
          >
            {downloading ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Gerando PDF…</>
            ) : (
              <><Download className="w-4 h-4 mr-2" /> Baixar PDF deste documento</>
            )}
          </Button>
        </div>

        {/* Sub-tabs */}
        <div className="mt-5 inline-flex gap-1 bg-[#f4f4f4] rounded-xl p-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  isActive ? 'bg-white text-[#002443] shadow-sm' : 'text-[#002443]/60 hover:text-[#002443]'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Área imprimível com branding Pagsmile no topo (entra no PDF) */}
      <div ref={printableRef} className="bg-[#f4f4f4] p-6 rounded-2xl">
        {/* Capa interna do PDF — só aparece no documento exportado */}
        <div className="bg-gradient-to-br from-[#002443] via-[#003366] to-[#002443] rounded-2xl p-8 mb-6 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#2bc196] via-[#5cf7cf] to-[#2bc196]" />
          <div className="flex items-center justify-between">
            <div>
              <img
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png"
                alt="Pagsmile"
                className="h-8 mb-4"
              />
              <h2 className="text-2xl font-bold">{currentTab.label}</h2>
              <p className="text-sm text-white/70 mt-1">Documentação operacional · Versão atual em produção</p>
            </div>
            <div className="text-right text-xs text-white/60">
              <div>Gerado em {new Date().toLocaleDateString('pt-BR')}</div>
              <div className="mt-1">Pagsmile · Confidencial</div>
            </div>
          </div>
        </div>

        {/* Conteúdo: questionário renderizado */}
        <Ch21_QuestionariosLeads tab={tab} />

        {/* Rodapé do PDF */}
        <div className="mt-8 pt-4 border-t border-[#002443]/10 text-center text-[10px] text-[#002443]/50">
          © {new Date().getFullYear()} Pagsmile · Documento gerado automaticamente pelo Hub de Propostas.
        </div>
      </div>
    </div>
  );
}