import React from 'react';
import { Globe2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PUBLIC_LANG_OPTIONS } from './usePublicGlobalI18n';

/**
 * Shell visual padrão das páginas PÚBLICAS Global.
 * Mostra topo Pin Bank, seletor de idioma e card central.
 */
export default function PublicGlobalShell({ title, subtitle, lang, setLang, children, maxWidth = '3xl' }) {
  const widthMap = { '2xl': 'max-w-2xl', '3xl': 'max-w-3xl', '4xl': 'max-w-4xl', '5xl': 'max-w-5xl' };
  return (
    <div className="min-h-screen bg-[#f4f4f4] py-8 px-4">
      <div className={`${widthMap[maxWidth] || widthMap['3xl']} mx-auto`}>
        {/* Topo */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#1356E2] to-[#E84B1C] shadow-sm">
              <Globe2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#0A0A0A] leading-tight">{title}</h1>
              {subtitle && <p className="text-xs text-[#0A0A0A]/60">{subtitle}</p>}
            </div>
          </div>
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger className="w-32 h-9 bg-white"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PUBLIC_LANG_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Conteúdo */}
        <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 shadow-sm">
          {children}
        </div>

        {/* Rodapé */}
        <p className="text-center text-[10px] text-[#0A0A0A]/40 mt-4">
          © {new Date().getFullYear()} Pin Bank · Global Payments
        </p>
      </div>
    </div>
  );
}