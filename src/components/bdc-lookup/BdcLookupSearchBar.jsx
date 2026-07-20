import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

const MODES = [
  { id: 'quick', label: 'Quick', desc: '5 datasets · ~1s · 1 crédito' },
  { id: 'kyc_pld_full', label: 'KYC/PLD Completo', desc: '18-20 datasets · ~5s · 4 créditos', recommended: true },
  { id: 'due_diligence_deep', label: 'Due Diligence Profunda', desc: '35+ datasets · ~15s · 10 créditos' },
];

function formatDoc(raw) {
  const d = raw.replace(/\D/g, '');
  if (d.length <= 11) {
    // CPF
    return d.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, e) => {
      let s = a;
      if (b) s += '.' + b;
      if (c) s += '.' + c;
      if (e) s += '-' + e;
      return s;
    });
  }
  // CNPJ
  return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, (_, a, b, c, e, f) => {
    let s = a;
    if (b) s += '.' + b;
    if (c) s += '.' + c;
    if (e) s += '/' + e;
    if (f) s += '-' + f;
    return s;
  });
}

export default function BdcLookupSearchBar({ onSearch, loading }) {
  const [doc, setDoc] = useState('');
  const [mode, setMode] = useState('kyc_pld_full');

  const handleSubmit = () => {
    const clean = doc.replace(/\D/g, '');
    if (clean.length !== 11 && clean.length !== 14) return;
    onSearch({ document: clean, mode });
  };

  const onKey = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Search className="w-5 h-5 text-[#1356E2]" />
        <h2 className="text-lg font-semibold text-[#0A0A0A]">Pesquisa Rápida BDC</h2>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <Input
          placeholder="CPF (11 dígitos) ou CNPJ (14 dígitos)"
          value={doc}
          onChange={(e) => setDoc(formatDoc(e.target.value))}
          onKeyDown={onKey}
          className="text-base flex-1"
          maxLength={18}
        />
        <Button
          onClick={handleSubmit}
          disabled={loading || (doc.replace(/\D/g, '').length !== 11 && doc.replace(/\D/g, '').length !== 14)}
          className="bg-[#1356E2] hover:bg-[#E84B1C] text-white min-w-[140px]"
        >
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Consultando...</> : <><Search className="w-4 h-4 mr-2" /> Buscar</>}
        </Button>
      </div>

      <div>
        <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 block">Modo de busca</Label>
        <RadioGroup value={mode} onValueChange={setMode} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {MODES.map(m => (
            <label
              key={m.id}
              htmlFor={`mode-${m.id}`}
              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${mode === m.id ? 'border-[#1356E2] bg-[#1356E2]/5' : 'border-slate-200 hover:border-slate-300'}`}
            >
              <RadioGroupItem value={m.id} id={`mode-${m.id}`} className="mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-[#0A0A0A]">{m.label}</span>
                  {m.recommended && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#1356E2] text-white">RECOMENDADO</span>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{m.desc}</p>
              </div>
            </label>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}