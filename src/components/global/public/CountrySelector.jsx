import React from 'react';
import { COUNTRIES, REGIONS } from '@/lib/global/countryMap';

/**
 * Chips de países agrupados por região, com bandeiras.
 * value = array de country codes (ISO-2). onChange recebe novo array.
 */
export default function CountrySelector({ value = [], onChange, lang = 'en' }) {
  const toggle = (code) => {
    if (value.includes(code)) onChange(value.filter(c => c !== code));
    else onChange([...value, code]);
  };

  return (
    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
      {REGIONS.map(region => {
        const items = COUNTRIES.filter(c => c.region === region.code);
        return (
          <div key={region.code}>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#0A0A0A]/50 mb-1.5">
              {region.label[lang] || region.label.en}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {items.map(c => {
                const isActive = value.includes(c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => toggle(c.code)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-[#1356E2] text-white border-[#1356E2]'
                        : 'bg-white text-[#0A0A0A]/70 border-[#0A0A0A]/10 hover:border-[#1356E2]/40'
                    }`}
                  >
                    <span>{c.flag}</span>
                    <span>{c.name[lang] || c.name.en}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}