import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Database, ShieldCheck } from 'lucide-react';
import DocBDC from '@/components/kyc-doc/DocBDC';
import DocCAF from '@/components/kyc-doc/DocCAF';

/**
 * Sub-aba "BDC + CAF Microscópico" — visão técnica detalhada de cada
 * dataset BDC e cada serviço CAF, em layout dedicado e imprimível.
 * Reaproveita DocBDC e DocCAF (já contêm o conteúdo microscópico).
 */
export default function DocBdcCafMicroscopico() {
  return (
    <div id="bdc-caf-print" className="max-w-[1200px] mx-auto">
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm 10mm; }
          *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { margin: 0 !important; background: white !important; }
          body > *:not(:has(#bdc-caf-print)) { display: none !important; }
          .no-print { display: none !important; }
          #bdc-caf-print { padding: 0 !important; max-width: 100% !important; }
          #bdc-caf-print h1 { font-size: 16pt !important; }
          #bdc-caf-print h2 { font-size: 11pt !important; page-break-after: avoid; }
          #bdc-caf-print h3 { font-size: 10pt !important; page-break-after: avoid; }
          #bdc-caf-print p, #bdc-caf-print li, #bdc-caf-print td, #bdc-caf-print th { font-size: 8pt !important; line-height: 1.35 !important; }
          #bdc-caf-print table { font-size: 7pt !important; page-break-inside: auto; }
          #bdc-caf-print thead { display: table-header-group; }
          #bdc-caf-print tr { page-break-inside: avoid; }
          .doc-break { page-break-before: always !important; }
        }
      `}</style>

      {/* Header com ação de impressão */}
      <div className="no-print sticky top-[68px] z-[5] bg-white border-b border-[#e8e8e8] px-6 py-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#1356E2]">Documento Técnico</p>
          <p className="text-sm font-bold text-[#0A0A0A]">BDC + CAF — Análise Microscópica</p>
        </div>
        <Button onClick={() => window.print()} className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white">
          <Download className="w-4 h-4 mr-1.5" /> Baixar PDF
        </Button>
      </div>

      {/* Intro */}
      <div className="px-8 py-8 border-b border-[#e8e8e8]">
        <h1 className="text-3xl font-bold text-[#0A0A0A] mb-3">BDC + CAF Microscópico</h1>
        <p className="text-[#1a1a1a]/70 text-[14px] leading-relaxed max-w-3xl">
          Detalhamento técnico de cada dataset consultado na <strong>BigDataCorp (BDC)</strong> e cada serviço
          executado pelo <strong>CAF (Combate à Fraude)</strong> — incluindo campos retornados, regras de
          interpretação, custo por consulta e impacto no Risk Scoring V4.
        </p>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-4 rounded-lg bg-[#f0fdf4] border border-[#86efac]/40">
            <Database className="w-5 h-5 text-[#1356E2] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-[#0A0A0A]">BigDataCorp (BDC)</p>
              <p className="text-[11px] text-[#1a1a1a]/60 mt-1">Enriquecimento de dados PF/PJ — KYC, KYB, processos, sócios, contatos, sanções.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-lg bg-[#eff6ff] border border-[#93c5fd]/40">
            <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] font-bold text-[#0A0A0A]">CAF (Combate à Fraude)</p>
              <p className="text-[11px] text-[#1a1a1a]/60 mt-1">Liveness, FaceMatch, OCR, documentscopy, PEP/sanções internacionais.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo BDC */}
      <div className="px-8">
        <DocBDC />
      </div>

      {/* Conteúdo CAF */}
      <div className="px-8 doc-break">
        <DocCAF />
      </div>

      {/* Footer */}
      <div className="mt-10 mx-8 border-t border-[#e0e0e0] pt-4 pb-6 text-center">
        <p className="text-[11px] text-[#1a1a1a]/30">
          Pin Bank — BDC + CAF Microscópico — Compliance V4.0
        </p>
        <p className="text-[10px] text-[#1a1a1a]/20 mt-1">
          Documento Confidencial — {new Date().toLocaleDateString('pt-BR')}
        </p>
      </div>
    </div>
  );
}