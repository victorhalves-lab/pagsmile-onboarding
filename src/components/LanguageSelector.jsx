import React from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LANG_CONFIG = [
  { code: 'pt', flag: '🇧🇷', short: 'PT' },
  { code: 'en', flag: '🇺🇸', short: 'EN' },
  { code: 'zh', flag: '🇨🇳', short: 'ZH' },
];

export default function LanguageSelector({ variant = 'default' }) {
  const { language, changeLanguage } = useTranslation();
  const current = LANG_CONFIG.find(l => l.code === language) || LANG_CONFIG[0];

  // Sidebar collapsed: just the flag
  if (variant === 'sidebar-collapsed') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-9 h-9 rounded-lg flex items-center justify-center text-lg hover:bg-white/10 transition-all duration-150">
            {current.flag}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" className="min-w-[130px]">
          {LANG_CONFIG.map(lang => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`gap-2 text-xs cursor-pointer ${language === lang.code ? 'font-bold bg-[#1356E2]/10' : ''}`}
            >
              <span className="text-base">{lang.flag}</span>
              <span>{lang.short}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Sidebar expanded: flag + code, dropdown on click
  if (variant === 'sidebar') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-white/10 transition-all duration-150 text-white/60 hover:text-white/80">
            <span className="text-base leading-none">{current.flag}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">{current.short}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" className="min-w-[130px]">
          {LANG_CONFIG.map(lang => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`gap-2 text-xs cursor-pointer ${language === lang.code ? 'font-bold bg-[#1356E2]/10' : ''}`}
            >
              <span className="text-base">{lang.flag}</span>
              <span>{lang.short}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default: public pages
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/80 backdrop-blur-sm border border-slate-200 hover:bg-white transition-all duration-150">
          <span className="text-base leading-none">{current.flag}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0A0A0A]/70">{current.short}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[130px]">
        {LANG_CONFIG.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`gap-2 text-xs cursor-pointer ${language === lang.code ? 'font-bold bg-[#1356E2]/10' : ''}`}
          >
            <span className="text-base">{lang.flag}</span>
            <span>{lang.short}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}