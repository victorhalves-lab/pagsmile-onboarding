import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, UserPlus } from 'lucide-react';

/**
 * Editor de lista de Diretores do KYC público Global.
 */
export default function DirectorsList({ value = [], onChange, t }) {
  const add = () => onChange([...value, { first_name: '', last_name: '', job_title: '' }]);
  const remove = (i) => onChange(value.filter((_, idx) => idx !== i));
  const update = (i, k, v) => onChange(value.map((d, idx) => idx === i ? { ...d, [k]: v } : d));

  return (
    <div className="space-y-2">
      {value.map((d, i) => (
        <div key={i} className="bg-white rounded-xl border border-[#0A0A0A]/10 p-3 grid grid-cols-3 gap-2 relative">
          <div><label className="text-[10px] uppercase text-[#0A0A0A]/50">{t('director_first')}</label><Input className="h-9" value={d.first_name} onChange={e => update(i, 'first_name', e.target.value)} /></div>
          <div><label className="text-[10px] uppercase text-[#0A0A0A]/50">{t('director_last')}</label><Input className="h-9" value={d.last_name} onChange={e => update(i, 'last_name', e.target.value)} /></div>
          <div><label className="text-[10px] uppercase text-[#0A0A0A]/50">{t('director_role')}</label><Input className="h-9" value={d.job_title} onChange={e => update(i, 'job_title', e.target.value)} /></div>
          <button type="button" onClick={() => remove(i)} className="absolute top-2 right-2 text-red-500 hover:text-red-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <UserPlus className="w-4 h-4 mr-1.5" /> {t('add_director')}
      </Button>
    </div>
  );
}