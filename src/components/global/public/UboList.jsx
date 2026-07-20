import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, UserPlus } from 'lucide-react';

/**
 * Editor de lista de UBOs do KYC público Global.
 */
export default function UboList({ value = [], onChange, t }) {
  const add = () => onChange([...value, { name: '', nationality: '', address: '', ownership_percentage: '' }]);
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  const update = (i, k, v) => onChange(value.map((u, idx) => idx === i ? { ...u, [k]: v } : u));

  return (
    <div className="space-y-2">
      {value.map((u, i) => (
        <div key={i} className="bg-white rounded-xl border border-[#0A0A0A]/10 p-3 grid grid-cols-2 gap-2 relative">
          <Field><label className="text-[10px] uppercase text-[#0A0A0A]/50">{t('ubo_name')}</label><Input className="h-9" value={u.name} onChange={e => update(i, 'name', e.target.value)} /></Field>
          <Field><label className="text-[10px] uppercase text-[#0A0A0A]/50">{t('ubo_nationality')}</label><Input className="h-9" value={u.nationality} onChange={e => update(i, 'nationality', e.target.value)} /></Field>
          <Field wide><label className="text-[10px] uppercase text-[#0A0A0A]/50">{t('ubo_address')}</label><Input className="h-9" value={u.address} onChange={e => update(i, 'address', e.target.value)} /></Field>
          <Field><label className="text-[10px] uppercase text-[#0A0A0A]/50">{t('ubo_pct')}</label><Input className="h-9" type="number" step="0.01" value={u.ownership_percentage} onChange={e => update(i, 'ownership_percentage', e.target.value)} /></Field>
          <button type="button" onClick={() => remove(i)} className="absolute top-2 right-2 text-red-500 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <UserPlus className="w-4 h-4 mr-1.5" /> {t('add_ubo')}
      </Button>
    </div>
  );
}

function Field({ wide, children }) {
  return <div className={wide ? 'col-span-2' : ''}>{children}</div>;
}