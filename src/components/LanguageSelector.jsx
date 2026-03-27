import React from 'react';
import { useTranslation } from '@/lib/i18n/LanguageContext';

const LANG_CONFIG = [
  { code: 'pt', flag: '🇧🇷', short: 'POR' },
  { code: 'en', flag: '🇺🇸', short: 'ENG' },
  { code: 'zh', flag: '🇨🇳', short: 'CNH' },
];

export default function LanguageSelector({ variant = 'default' }) {
  const { language, changeLanguage } = useTranslation();

  // Sidebar collapsed: vertical stack of flags
  if (variant === 'sidebar-collapsed') {
    return (
      <div className="flex flex-col items-center gap-1">
        {LANG_CONFIG.map(lang => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`w-9 h-7 rounded-md flex items-center justify-center text-sm transition-all duration-150
              ${language === lang.code
                ? 'bg-[#2bc196]/20 ring-1 ring-[#2bc196]/40 scale-105'
                : 'hover:bg-white/10 opacity-50 hover:opacity-80'
              }`}
            title={lang.short}
          >
            {lang.flag}
          </button>
        ))}
      </div>
    );
  }

  // Sidebar expanded: horizontal row with flag + code
  if (variant === 'sidebar') {
    return (
      <div className="flex items-center gap-1 px-1">
        {LANG_CONFIG.map(lang => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-150
              ${language === lang.code
                ? 'bg-[#2bc196]/15 text-[#5cf7cf] ring-1 ring-[#2bc196]/30'
                : 'text-white/35 hover:text-white/60 hover:bg-white/5'
              }`}
          >
            <span className="text-sm leading-none">{lang.flag}</span>
            <span>{lang.short}</span>
          </button>
        ))}
      </div>
    );
  }

  // Default: for public pages / header — compact inline
  return (
    <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm border border-slate-200 rounded-xl px-1.5 py-1">
      {LANG_CONFIG.map(lang => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all duration-150
            ${language === lang.code
              ? 'bg-[#2bc196]/15 text-[#002443] ring-1 ring-[#2bc196]/30'
              : 'text-[#002443]/40 hover:text-[#002443]/70 hover:bg-slate-100'
            }`}
        >
          <span className="text-sm leading-none">{lang.flag}</span>
          <span>{lang.short}</span>
        </button>
      ))}
    </div>
  );
}