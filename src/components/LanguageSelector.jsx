import React from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function LanguageSelector({ variant = 'default' }) {
  const { language, changeLanguage, SUPPORTED_LANGUAGES } = useTranslation();
  const current = SUPPORTED_LANGUAGES.find(l => l.code === language);

  if (variant === 'sidebar-collapsed') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center justify-center w-full py-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all duration-200">
            <span className="text-sm">{current?.flag}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" className="min-w-[140px]">
          {SUPPORTED_LANGUAGES.map(lang => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`gap-2 text-xs ${language === lang.code ? 'font-bold bg-[#2bc196]/10' : ''}`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'sidebar') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-white/40 hover:text-white/70 hover:bg-white/5 transition-all duration-200 text-xs">
            <Globe className="w-3.5 h-3.5" />
            <span className="flex-1 text-left">{current?.flag} {current?.label}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" className="min-w-[140px]">
          {SUPPORTED_LANGUAGES.map(lang => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`gap-2 text-xs ${language === lang.code ? 'font-bold bg-[#2bc196]/10' : ''}`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default: inline selector for public pages
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 border border-slate-200 hover:bg-white text-xs font-medium text-[#002443] transition-all">
          <span>{current?.flag}</span>
          <span>{current?.label}</span>
          <Globe className="w-3 h-3 text-[#002443]/40" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-[140px]">
        {SUPPORTED_LANGUAGES.map(lang => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`gap-2 text-xs ${language === lang.code ? 'font-bold bg-[#2bc196]/10' : ''}`}
          >
            <span>{lang.flag}</span>
            <span>{lang.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}