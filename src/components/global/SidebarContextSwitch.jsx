import React from 'react';
import { Flag, Globe2, Link2 } from 'lucide-react';
import { getAppContext, setAppContext, subscribeAppContext } from '@/lib/global/globalContext';

/**
 * Switch de contexto Brasil / Global / Unificado no topo da sidebar.
 * Persiste em localStorage e navega para a home de cada contexto.
 */
export default function SidebarContextSwitch({ collapsed = false }) {
  const [ctx, setCtx] = React.useState(getAppContext());

  React.useEffect(() => subscribeAppContext(setCtx), []);

  const onPick = (next) => {
    if (next === ctx) return;
    setAppContext(next);
    const home = next === 'global' ? '/GlobalDashboard'
               : next === 'unified' ? '/HubPropostas'
               : '/Home';
    window.location.href = home;
  };

  const options = [
    { key: 'brasil', label: 'Brasil', icon: Flag },
    { key: 'global', label: 'Global', icon: Globe2 },
    { key: 'unified', label: 'Unificado', icon: Link2 },
  ];

  if (collapsed) {
    return (
      <div className="flex flex-col gap-1 px-1">
        {options.map(opt => {
          const Icon = opt.icon;
          const active = ctx === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => onPick(opt.key)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                active ? 'bg-[#2bc196] text-white shadow' : 'text-white/40 hover:bg-white/5'
              }`}
              title={opt.label}
            >
              <Icon className="w-4 h-4" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-xl p-1 flex gap-1">
      {options.map(opt => {
        const Icon = opt.icon;
        const active = ctx === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => onPick(opt.key)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
              active ? 'bg-[#2bc196] text-white shadow' : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Icon className="w-3 h-3" />
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}