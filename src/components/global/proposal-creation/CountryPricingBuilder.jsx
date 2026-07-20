import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, AlertTriangle, ShieldAlert, Globe2 } from 'lucide-react';
import { COUNTRIES } from '@/lib/global/countryMap';
import { getAlertsForCountry, HR_INDUSTRIES } from '@/lib/global/regulatoryAlerts';
import { methodLabel, inferMethodCategory } from '@/lib/global/paymentMethods';

/**
 * Construtor de proposta por país. Permite ao admin selecionar países,
 * incluir canais do catálogo, editar rate/fixed/min e ver alertas regulatórios.
 *
 * Recebe value = array de country_pricing items e onChange.
 * Recebe declaredIndustries (HR do lead) para alertas contextuais.
 */
export default function CountryPricingBuilder({ value = [], onChange, declaredIndustries = [] }) {
  const [selectedCountry, setSelectedCountry] = useState('');

  const { data: channels = [] } = useQuery({
    queryKey: ['globalCountryChannels', 'forBuilder'],
    queryFn: () => base44.entities.GlobalCountryChannel.list('-created_date', 2000),
    initialData: [],
  });

  const { data: fees = [] } = useQuery({
    queryKey: ['globalCountryFees', 'forBuilder'],
    queryFn: () => base44.entities.GlobalCountryFee.list('-created_date', 200),
    initialData: [],
  });

  // Lista de países disponíveis (com canais cadastrados)
  const availableCountries = useMemo(() => {
    const set = new Map();
    channels.forEach(c => set.set(c.country, c.country_name));
    return Array.from(set.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [channels]);

  const addCountry = (code) => {
    if (!code || value.some(v => v.country === code)) return;
    const meta = COUNTRIES.find(c => c.code === code) || { name: { en: code } };
    const taxes = fees.filter(f => f.country === code).map(f => ({
      tax_type: f.tax_type, percentage: f.percentage, label: f.label_en,
    }));
    onChange([...value, {
      country: code,
      country_name: meta.name?.en || code,
      methods: [],
      taxes,
      restrictions: [],
      notes: '',
    }]);
    setSelectedCountry('');
  };

  const removeCountry = (code) => {
    onChange(value.filter(v => v.country !== code));
  };

  const updateCountry = (code, patch) => {
    onChange(value.map(v => v.country === code ? { ...v, ...patch } : v));
  };

  const addMethodFromChannel = (countryCode, channel) => {
    const country = value.find(v => v.country === countryCode);
    if (!country) return;
    const newMethod = {
      channel_id: channel.id,
      method_category: channel.method_category || inferMethodCategory(channel.payment_method),
      method_label: channel.payment_method,
      description: channel.collection_points || '',
      rate_pct: channel.default_payin_rate_pct || 3,
      fixed: channel.default_payin_fixed || 0,
      fixed_currency: channel.default_payin_fixed_currency || 'USD',
      min_per_trx: channel.default_payin_min || null,
      min_per_trx_currency: channel.default_payin_fixed_currency || 'USD',
      type: channel.payin_or_payout === 'PAYOUT' ? 'payout' : 'payin',
      amount_range_label: channel.transaction_limits || '',
    };
    updateCountry(countryCode, { methods: [...country.methods, newMethod] });
  };

  const addCustomMethod = (countryCode) => {
    const country = value.find(v => v.country === countryCode);
    if (!country) return;
    updateCountry(countryCode, {
      methods: [...country.methods, {
        method_category: 'cards', method_label: 'New Method', description: '',
        rate_pct: 3, fixed: 0, fixed_currency: 'USD', type: 'payin',
      }],
    });
  };

  const updateMethod = (countryCode, idx, patch) => {
    const country = value.find(v => v.country === countryCode);
    if (!country) return;
    const methods = country.methods.map((m, i) => i === idx ? { ...m, ...patch } : m);
    updateCountry(countryCode, { methods });
  };

  const removeMethod = (countryCode, idx) => {
    const country = value.find(v => v.country === countryCode);
    if (!country) return;
    updateCountry(countryCode, { methods: country.methods.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-3">
      {/* Adicionar país */}
      <div className="flex items-center gap-2 bg-[#f4f4f4]/50 rounded-xl p-3">
        <Globe2 className="w-4 h-4 text-[#1356E2]" />
        <select
          value={selectedCountry}
          onChange={e => setSelectedCountry(e.target.value)}
          className="flex-1 h-9 rounded-md border border-[#0A0A0A]/10 px-2 text-sm bg-white"
        >
          <option value="">Selecionar país para adicionar...</option>
          {availableCountries
            .filter(c => !value.some(v => v.country === c.code))
            .map(c => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)
          }
        </select>
        <Button size="sm" onClick={() => addCountry(selectedCountry)} disabled={!selectedCountry}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar país
        </Button>
      </div>

      {/* Países adicionados */}
      {value.length === 0 && (
        <div className="text-center text-xs text-[#0A0A0A]/50 py-8 border border-dashed border-[#0A0A0A]/15 rounded-xl">
          Nenhum país adicionado. Selecione acima para começar a construir a proposta por mercado.
        </div>
      )}

      {value.map(country => {
        const countryChannels = channels.filter(c => c.country === country.country && c.is_active !== false);
        const alerts = getAlertsForCountry(country.country, declaredIndustries);
        const meta = COUNTRIES.find(c => c.code === country.country);

        return (
          <div key={country.country} className="bg-white border border-[#0A0A0A]/8 rounded-2xl overflow-hidden">
            {/* Header país */}
            <div className="bg-[#0A0A0A] text-white px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">{meta?.flag || '🌐'}</span>
                <span className="text-sm font-bold">{country.country_name}</span>
                <span className="text-[10px] font-mono opacity-50">{country.country}</span>
              </div>
              <Button size="icon" variant="ghost" onClick={() => removeCountry(country.country)} className="h-7 w-7 text-white/70 hover:text-white hover:bg-white/10">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Alertas regulatórios */}
            {alerts.length > 0 && (
              <div className="bg-amber-50 border-b border-amber-200 p-3 space-y-1">
                {alerts.map((a, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs">
                    <ShieldAlert className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${a.severity === 'critical' ? 'text-red-600' : 'text-amber-600'}`} />
                    <span className={a.severity === 'critical' ? 'text-red-800' : 'text-amber-800'}>{a.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Catálogo de canais disponíveis */}
            <div className="p-3 border-b border-[#0A0A0A]/5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#0A0A0A]/50 mb-2">
                Canais disponíveis ({countryChannels.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {countryChannels.slice(0, 12).map(ch => {
                  const added = country.methods.some(m => m.channel_id === ch.id);
                  return (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => !added && addMethodFromChannel(country.country, ch)}
                      disabled={added}
                      className={`text-[11px] px-2 py-1 rounded-full border transition-all ${
                        added
                          ? 'bg-[#1356E2]/10 border-[#1356E2]/30 text-[#1356E2]/70 cursor-default'
                          : 'bg-white border-[#0A0A0A]/15 text-[#0A0A0A]/70 hover:border-[#1356E2] hover:text-[#1356E2]'
                      }`}
                    >
                      {added && '✓ '}{ch.provider} · {ch.payment_method}
                    </button>
                  );
                })}
                {countryChannels.length > 12 && (
                  <span className="text-[10px] text-[#0A0A0A]/50 self-center">+{countryChannels.length - 12} mais</span>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={() => addCustomMethod(country.country)} className="mt-2 text-xs">
                <Plus className="w-3 h-3 mr-1" /> Adicionar método custom
              </Button>
            </div>

            {/* Métodos selecionados */}
            <div className="p-3 space-y-2">
              {country.methods.length === 0 && (
                <div className="text-[11px] text-[#0A0A0A]/50 text-center py-3">Nenhum método selecionado. Clique nos canais acima.</div>
              )}
              {country.methods.map((m, idx) => (
                <div key={idx} className="bg-[#f4f4f4]/50 rounded-lg p-2.5 grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-3">
                    <Input value={m.method_label} onChange={e => updateMethod(country.country, idx, { method_label: e.target.value })}
                      className="h-8 text-xs" placeholder="Método" />
                    <div className="text-[9px] text-[#0A0A0A]/40 mt-0.5">{methodLabel(m.method_category, 'pt')}</div>
                  </div>
                  <div className="col-span-3">
                    <Input value={m.description} onChange={e => updateMethod(country.country, idx, { description: e.target.value })}
                      className="h-8 text-xs" placeholder="Descrição (bancos, redes...)" />
                  </div>
                  <div className="col-span-2 flex gap-1 items-center">
                    <Input type="number" step="0.01" value={m.rate_pct} onChange={e => updateMethod(country.country, idx, { rate_pct: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-xs" placeholder="%" />
                    <span className="text-xs text-[#0A0A0A]/40">%</span>
                  </div>
                  <div className="col-span-2 flex gap-1 items-center">
                    <Input type="number" step="0.01" value={m.fixed} onChange={e => updateMethod(country.country, idx, { fixed: parseFloat(e.target.value) || 0 })}
                      className="h-8 text-xs" placeholder="fixo" />
                    <Input value={m.fixed_currency} onChange={e => updateMethod(country.country, idx, { fixed_currency: e.target.value.toUpperCase() })}
                      className="h-8 text-xs w-14" placeholder="cur" />
                  </div>
                  <div className="col-span-1 text-[10px]">
                    <span className={`px-1.5 py-0.5 rounded ${m.type === 'payout' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                      {m.type}
                    </span>
                  </div>
                  <div className="col-span-1 text-right">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeMethod(country.country, idx)}>
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Impostos automáticos */}
            {country.taxes && country.taxes.length > 0 && (
              <div className="px-3 pb-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#0A0A0A]/50 mb-1">Impostos aplicáveis</div>
                <div className="flex flex-wrap gap-1.5">
                  {country.taxes.map((t, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[#0A0A0A]/8 text-[#0A0A0A]/80">
                      {t.tax_type} {t.percentage}%
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Aviso se não houver canais */}
      {availableCountries.length === 0 && channels.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            Nenhum canal cadastrado ainda. Vá em <strong>Canais por País</strong> e importe a planilha XLSX.
          </div>
        </div>
      )}
    </div>
  );
}