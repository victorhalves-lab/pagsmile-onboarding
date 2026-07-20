import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronDown, ChevronUp, Phone, Mail, MapPin, Users, Building2, Clock
} from 'lucide-react';

function renderValue(val, depth = 0) {
  if (val == null || val === '') return null;
  if (typeof val === 'boolean') return val ? 'Sim' : 'Não';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') return val;
  if (Array.isArray(val)) {
    if (val.length === 0) return null;
    if (val.every(v => typeof v === 'string' || typeof v === 'number')) return val.join(', ');
    return val.map((v, i) => (
      <div key={i} className="ml-2 pl-2 border-l border-slate-200 mt-1">
        {typeof v === 'object' && v !== null ? (
          Object.entries(v).filter(([k]) => !k.startsWith('_') && k !== 'MatchKeys').map(([k2, v2]) => {
            const rendered = renderValue(v2, depth + 1);
            if (!rendered) return null;
            return (
              <div key={k2} className="flex items-start gap-1.5 py-0.5">
                <span className="text-[10px] font-semibold text-[#0A0A0A]/35 min-w-[100px] shrink-0">{formatKey(k2)}</span>
                <span className="text-[11px] text-[#0A0A0A]/80 break-all">{rendered}</span>
              </div>
            );
          })
        ) : (
          <span className="text-[11px] text-[#0A0A0A]/80">{String(v)}</span>
        )}
      </div>
    ));
  }
  if (typeof val === 'object') {
    const entries = Object.entries(val).filter(([k]) => !k.startsWith('_') && k !== 'MatchKeys');
    if (entries.length === 0) return null;
    if (depth > 1) return entries.map(([k, v]) => `${formatKey(k)}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join(', ');
    return (
      <div className="ml-2 pl-2 border-l border-slate-200">
        {entries.map(([k, v]) => {
          const rendered = renderValue(v, depth + 1);
          if (!rendered) return null;
          return (
            <div key={k} className="flex items-start gap-1.5 py-0.5">
              <span className="text-[10px] font-semibold text-[#0A0A0A]/35 min-w-[100px] shrink-0">{formatKey(k)}</span>
              <span className="text-[11px] text-[#0A0A0A]/80 break-all">{typeof rendered === 'string' ? rendered : rendered}</span>
            </div>
          );
        })}
      </div>
    );
  }
  return String(val);
}

function ContactCard({ icon: Icon, label, items, accentColor = 'blue' }) {
  const [open, setOpen] = useState(items.length > 0);
  
  if (!items || items.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-4 opacity-60">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-[#0A0A0A]">{label}</span>
          <span className="text-[10px] text-[#0A0A0A]/30">Sem dados</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-4 hover:bg-slate-50/50 transition-colors text-left"
      >
        <div className={`p-2 rounded-lg bg-${accentColor}-50`}>
          <Icon className={`w-4 h-4 text-${accentColor}-600`} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-[#0A0A0A]">{label}</h4>
          <p className="text-[10px] text-[#0A0A0A]/40">{items.length} registro(s)</p>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-[#0A0A0A]/30" /> : <ChevronDown className="w-4 h-4 text-[#0A0A0A]/30" />}
      </button>
      {open && (
        <div className="border-t border-slate-100 divide-y divide-slate-50">
          {items.map((item, i) => (
            <div key={i} className="px-4 py-3 text-xs space-y-1">
              {Object.entries(item).filter(([k]) => !k.startsWith('_') && k !== 'MatchKeys').map(([key, val]) => {
                const rendered = renderValue(val);
                if (!rendered) return null;
                return (
                  <div key={key} className="flex items-start gap-2">
                    <span className="text-[10px] font-semibold text-[#0A0A0A]/40 min-w-[120px] shrink-0">
                      {formatKey(key)}
                    </span>
                    <div className="text-[#0A0A0A]/80 break-all flex-1">
                      {typeof rendered === 'string' ? <span>{rendered}</span> : rendered}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatKey(key) {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/^\w/, c => c.toUpperCase());
}

function flattenBDCArray(dataset) {
  if (!dataset) return [];
  if (Array.isArray(dataset)) {
    return dataset.flatMap(d => {
      if (d && d.MatchKeys) return [d];
      if (Array.isArray(d)) return d;
      return [d];
    }).filter(Boolean);
  }
  return [dataset];
}

export default function BDCContactsSection({ rawResult }) {
  if (!rawResult) return null;

  const phones = flattenBDCArray(rawResult?.PhonesExtended || rawResult?.phones_extended || rawResult?.Phones || rawResult?.phones);
  const emails = flattenBDCArray(rawResult?.EmailsExtended || rawResult?.emails_extended || rawResult?.Emails || rawResult?.emails);
  const addresses = flattenBDCArray(rawResult?.AddressesExtended || rawResult?.addresses_extended || rawResult?.Addresses || rawResult?.addresses);
  const relPhones = flattenBDCArray(rawResult?.RelatedPeoplePhones || rawResult?.related_people_phones);
  const relEmails = flattenBDCArray(rawResult?.RelatedPeopleEmails || rawResult?.related_people_emails);
  const relAddresses = flattenBDCArray(rawResult?.RelatedPeopleAddresses || rawResult?.related_people_addresses);
  const historyBasic = flattenBDCArray(rawResult?.HistoryBasicData || rawResult?.history_basic_data);
  const companyEvolution = flattenBDCArray(rawResult?.CompanyEvolution || rawResult?.company_evolution);

  const hasAnyData = phones.length > 0 || emails.length > 0 || addresses.length > 0 || 
    relPhones.length > 0 || relEmails.length > 0 || relAddresses.length > 0 ||
    historyBasic.length > 0 || companyEvolution.length > 0;

  if (!hasAnyData) return null;

  return (
    <div className="space-y-3">
      {/* Empresa */}
      {(phones.length > 0 || emails.length > 0 || addresses.length > 0) && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-4 h-4 text-[#0A0A0A]/40" />
            <h4 className="text-xs font-bold text-[#0A0A0A]/60 uppercase tracking-wider">Contatos da Empresa</h4>
          </div>
          <div className="space-y-2">
            <ContactCard icon={Phone} label="Telefones" items={phones} accentColor="blue" />
            <ContactCard icon={Mail} label="E-mails" items={emails} accentColor="indigo" />
            <ContactCard icon={MapPin} label="Endereços" items={addresses} accentColor="emerald" />
          </div>
        </div>
      )}

      {/* Sócios */}
      {(relPhones.length > 0 || relEmails.length > 0 || relAddresses.length > 0) && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-[#0A0A0A]/40" />
            <h4 className="text-xs font-bold text-[#0A0A0A]/60 uppercase tracking-wider">Contatos dos Sócios</h4>
          </div>
          <div className="space-y-2">
            <ContactCard icon={Phone} label="Telefones dos Sócios" items={relPhones} accentColor="violet" />
            <ContactCard icon={Mail} label="E-mails dos Sócios" items={relEmails} accentColor="violet" />
            <ContactCard icon={MapPin} label="Endereços dos Sócios" items={relAddresses} accentColor="violet" />
          </div>
        </div>
      )}

      {/* Histórico */}
      {(historyBasic.length > 0 || companyEvolution.length > 0) && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-[#0A0A0A]/40" />
            <h4 className="text-xs font-bold text-[#0A0A0A]/60 uppercase tracking-wider">Histórico Cadastral</h4>
          </div>
          <div className="space-y-2">
            <ContactCard icon={Clock} label="Histórico de Alterações" items={historyBasic} accentColor="amber" />
            <ContactCard icon={Clock} label="Evolução da Empresa" items={companyEvolution} accentColor="amber" />
          </div>
        </div>
      )}
    </div>
  );
}