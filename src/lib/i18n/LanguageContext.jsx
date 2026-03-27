import React, { createContext, useContext, useState, useCallback } from 'react';
import { translations } from './translations';

const LanguageContext = createContext();

const SUPPORTED_LANGUAGES = [
  { code: 'pt', label: 'Português', flag: '🇧🇷' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
];

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    try { return localStorage.getItem('app_language') || 'pt'; } catch { return 'pt'; }
  });

  const changeLanguage = useCallback((lang) => {
    setLanguage(lang);
    try { localStorage.setItem('app_language', lang); } catch {}
  }, []);

  const t = useCallback((key, replacements) => {
    const dict = translations[language] || translations.pt;
    let text = dict[key] ?? translations.pt[key] ?? key;
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }
    return text;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used within LanguageProvider');
  return ctx;
}

export { SUPPORTED_LANGUAGES };