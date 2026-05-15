import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

export default function BdcTabRaw({ result, status, queryId }) {
  const [copied, setCopied] = useState(false);

  const fullPayload = { queryId, status, result };
  const jsonStr = JSON.stringify(fullPayload, null, 2);

  const copy = () => {
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[#002443]">Raw JSON BDC</h3>
        <Button variant="outline" size="sm" onClick={copy} className="h-8 text-xs">
          {copied ? <><Check className="w-3.5 h-3.5 mr-1.5" /> Copiado</> : <><Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar</>}
        </Button>
      </div>
      <pre className="text-[11px] font-mono p-4 overflow-auto max-h-[600px] bg-slate-900 text-slate-100">{jsonStr}</pre>
    </div>
  );
}