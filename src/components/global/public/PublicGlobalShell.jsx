import React from 'react';
import { Globe2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PUBLIC_LANG_OPTIONS } from './usePublicGlobalI18n';

/**
 * Shell visual padrão das páginas PÚBLICAS Global.
 * Mostra topo Pagsmile, seletor de idioma e card central.
 */
export default function PublicGlobalShell({ title, subtitle, lang, setLang, children, maxWidth = '3xl' }) {
  const widthMap = { '2xl': 'max-w-2xl', '3xl': 'max-w-3xl', '4xl': 'max-w-4xl', '5xl': 'max-w-5xl' };
  return (
    <div className="min-h-screen bg-[#f4f4f4] py-8 px-4">
      <div className={`${widthMap[maxWidth] || widthMap['3xl']} mx-auto`}>
        {/* Topo */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#2bc196] to-[#5cf7cf] shadow-sm">
              <Globe2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-[#002443] leading-tight">{title}</h1>
              {subtitle && <p className="text-xs text-[#002443]/60">{subtitle}</p>}
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
        <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm">
          {children}
        </div>

        {/* Rodapé */}
        <p className="text-center text-[10px] text-[#002443]/40 mt-4">
          © {new Date().getFullYear()} Pagsmile · Global Payments
        </p>
      </div>
    </div>
  );
}