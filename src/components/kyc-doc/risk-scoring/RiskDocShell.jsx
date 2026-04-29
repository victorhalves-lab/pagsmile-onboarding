import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

/* Shared printable shell for Risk Scoring documents.
   Provides cover, table-of-contents and print stylesheet.
   `id` must be unique on the page so the print scope is isolated. */
export default function RiskDocShell({ id, title, subtitle, audience, version, toc = [], children, onPrint }) {
  const handlePrint = () => {
    if (onPrint) return onPrint();
    window.print();
  };

  return (
    <div className="bg-white">
      {/* Toolbar — not printed */}
      <div className="no-print sticky top-[68px] z-[5] bg-white border-b border-[#e8e8e8] flex items-center justify-between max-w-[1100px] mx-auto px-6 py-3">
        <div>
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#2bc196]">Documento Técnico — Auditoria</p>
          <p className="text-sm font-bold text-[#002443]">{title}</p>
        </div>
        <Button onClick={handlePrint} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white">
          <Download className="w-4 h-4 mr-1.5" /> Baixar PDF
        </Button>
      </div>

      <div id={id} className="risk-doc max-w-[900px] mx-auto px-8 py-6">
        <PrintStyles scopeId={id} />

        {/* Cover */}
        <section className="risk-cover">
          <p className="risk-cover-eyebrow">PAGSMILE • COMPLIANCE V4 • DOCUMENTO TÉCNICO PARA AUDITORIA</p>
          <h1>{title}</h1>
          <h2>{subtitle}</h2>
          <div className="risk-cover-meta">
            <div><span className="lbl">Audiência</span><span className="val">{audience}</span></div>
            <div><span className="lbl">Versão</span><span className="val">{version}</span></div>
            <div><span className="lbl">Data</span><span className="val">{new Date().toLocaleDateString('pt-BR')}</span></div>
            <div><span className="lbl">Classificação</span><span className="val">CONFIDENCIAL — Auditoria Externa</span></div>
            <div><span className="lbl">Base regulatória</span><span className="val">Circular BCB 3.978/2020 • Resolução BCB 96/2021 • Lei 9.613/98 (PLD-FT) • LGPD 13.709/18</span></div>
          </div>
        </section>

        {/* TOC */}
        {toc.length > 0 && (
          <section className="risk-toc">
            <h3>Índice</h3>
            <ol>
              {toc.map((t, i) => <li key={i}>{t}</li>)}
            </ol>
          </section>
        )}

        {/* Body */}
        <div className="risk-body">{children}</div>

        {/* Footer */}
        <div className="risk-footer">
          <p>PagSmile — {title} — V{version} — {new Date().toLocaleDateString('pt-BR')}</p>
          <p>Documento Confidencial. Distribuição restrita a auditores autorizados (Bandeiras, Reguladores, Compliance interno).</p>
        </div>
      </div>
    </div>
  );
}

function PrintStyles({ scopeId }) {
  return (
    <style>{`
      #${scopeId} { font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; color: #1a1a1a; background: white; }
      #${scopeId} h1, #${scopeId} h2, #${scopeId} h3, #${scopeId} h4 { color: #002443; }
      #${scopeId} .risk-cover { border-bottom: 2px solid #2bc196; padding: 36px 0 30px; margin-bottom: 28px; }
      #${scopeId} .risk-cover-eyebrow { font-size: 10px; letter-spacing: 0.2em; color: #2bc196; font-weight: 800; margin-bottom: 14px; }
      #${scopeId} .risk-cover h1 { font-size: 32px; font-weight: 900; line-height: 1.1; margin-bottom: 6px; color: #002443; }
      #${scopeId} .risk-cover h2 { font-size: 16px; font-weight: 600; color: #1a1a1a; opacity: .8; margin-bottom: 22px; }
      #${scopeId} .risk-cover-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 18px; }
      #${scopeId} .risk-cover-meta div { display: flex; flex-direction: column; padding: 6px 10px; background: #f9fafb; border-left: 3px solid #2bc196; }
      #${scopeId} .risk-cover-meta .lbl { font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; color: #1a1a1a; opacity: .55; }
      #${scopeId} .risk-cover-meta .val { font-size: 11.5px; color: #002443; font-weight: 600; line-height: 1.3; }
      #${scopeId} .risk-toc { background: #f9fafb; padding: 20px 26px; border-radius: 6px; margin-bottom: 28px; page-break-after: always; }
      #${scopeId} .risk-toc h3 { font-size: 16px; margin-bottom: 12px; color: #002443; }
      #${scopeId} .risk-toc ol { list-style: none; padding: 0; margin: 0; columns: 1; }
      #${scopeId} .risk-toc li { font-size: 12px; padding: 5px 0; border-bottom: 1px dashed #e0e6ed; color: #1a1a1a; }
      #${scopeId} .risk-section { margin-bottom: 26px; }
      #${scopeId} .risk-section.risk-break { page-break-before: always; }
      #${scopeId} .risk-section h1 { font-size: 19px; font-weight: 900; padding-bottom: 6px; border-bottom: 2px solid #2bc196; margin: 18px 0 14px; color: #002443; }
      #${scopeId} .risk-section h2 { font-size: 13.5px; font-weight: 800; margin: 16px 0 6px; color: #002443; }
      #${scopeId} .risk-section h3 { font-size: 12px; font-weight: 700; margin: 10px 0 4px; color: #2bc196; }
      #${scopeId} .risk-section p { font-size: 12px; line-height: 1.55; color: #1a1a1a; margin-bottom: 8px; }
      #${scopeId} .risk-section strong { color: #002443; font-weight: 700; }
      #${scopeId} .risk-section em { color: #1a1a1a; font-style: italic; }
      #${scopeId} .risk-section code { background: #f0f4f8; color: #002443; font-size: 10.5px; padding: 1px 4px; border-radius: 2px; font-family: ui-monospace, monospace; }
      #${scopeId} .risk-list { padding-left: 18px; margin: 6px 0 10px; }
      #${scopeId} .risk-list li { font-size: 12px; line-height: 1.55; color: #1a1a1a; margin-bottom: 4px; }
      #${scopeId} .risk-table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; font-size: 10.5px; }
      #${scopeId} .risk-table thead th { background: #002443; color: white; padding: 6px 8px; text-align: left; font-weight: 700; font-size: 10px; }
      #${scopeId} .risk-table tbody td { padding: 5px 8px; border-bottom: 1px solid #e8e8e8; color: #1a1a1a; vertical-align: top; line-height: 1.4; }
      #${scopeId} .risk-table tbody tr:nth-child(even) { background: #f9fafb; }
      #${scopeId} .risk-formula { background: #002443; color: #5cf7cf; padding: 10px 14px; font-family: ui-monospace, monospace; font-size: 11px; line-height: 1.55; border-radius: 4px; overflow-x: auto; white-space: pre; margin: 8px 0 14px; }
      #${scopeId} .risk-note { background: #fff8e1; border-left: 3px solid #f59e0b; padding: 8px 12px; font-size: 11px; color: #1a1a1a; margin: 10px 0; }
      #${scopeId} .risk-callout { background: #ecfdf5; border-left: 3px solid #2bc196; padding: 8px 12px; font-size: 11px; color: #1a1a1a; margin: 10px 0; }
      #${scopeId} .risk-dl dt { font-weight: 700; color: #002443; margin-top: 6px; font-size: 11.5px; }
      #${scopeId} .risk-dl dd { font-size: 11px; color: #1a1a1a; margin: 0 0 4px 14px; line-height: 1.45; }
      #${scopeId} .risk-footer { border-top: 1px solid #e8e8e8; margin-top: 30px; padding-top: 14px; text-align: center; }
      #${scopeId} .risk-footer p { font-size: 9.5px; color: #1a1a1a; opacity: .5; margin: 2px 0; }

      @media print {
        @page { size: A4; margin: 14mm 12mm; }
        *, *::before, *::after { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { margin: 0 !important; background: white !important; }
        body > *:not(:has(#${scopeId})) { display: none !important; }
        .no-print { display: none !important; }
        #${scopeId} { max-width: 100% !important; padding: 0 !important; margin: 0 !important; }
        #${scopeId} .risk-cover { page-break-after: always; padding: 30pt 0 !important; }
        #${scopeId} .risk-cover h1 { font-size: 22pt !important; }
        #${scopeId} .risk-cover h2 { font-size: 12pt !important; }
        #${scopeId} .risk-toc { page-break-after: always; }
        #${scopeId} .risk-section.risk-break { page-break-before: always; }
        #${scopeId} .risk-section h1 { font-size: 13pt !important; page-break-after: avoid; }
        #${scopeId} .risk-section h2 { font-size: 10.5pt !important; page-break-after: avoid; }
        #${scopeId} .risk-section h3 { font-size: 9.5pt !important; page-break-after: avoid; }
        #${scopeId} .risk-section p, #${scopeId} .risk-list li { font-size: 8.5pt !important; line-height: 1.45 !important; }
        #${scopeId} .risk-table { font-size: 7pt !important; page-break-inside: auto; }
        #${scopeId} .risk-table thead { display: table-header-group; }
        #${scopeId} .risk-table tr { page-break-inside: avoid; }
        #${scopeId} .risk-table thead th { font-size: 7pt !important; padding: 3pt 4pt !important; }
        #${scopeId} .risk-table tbody td { font-size: 7pt !important; padding: 2.5pt 4pt !important; }
        #${scopeId} .risk-formula { font-size: 7.5pt !important; padding: 5pt 8pt !important; }
      }
    `}</style>
  );
}