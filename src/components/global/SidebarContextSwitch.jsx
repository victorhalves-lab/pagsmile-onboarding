import React from 'react';
import { Flag, Globe2 } from 'lucide-react';
import { getAppContext, setAppContext, subscribeAppContext } from '@/lib/global/globalContext';

/**
 * Switch Brasil ↔ Global que aparece no topo da sidebar.
 * Persiste em localStorage e dispara evento para o resto da UI reagir.
 */
export default function SidebarContextSwitch({ collapsed = false }) {
  const [ctx, setCtx] = React.useState(getAppContext());

  React.useEffect(() => subscribeAppContext(setCtx), []);

  const onPick = (next) => {
    if (next === ctx) return;
    setAppContext(next);
    // Quando troca para Global, levar pro Dashboard Global; quando volta, pra Home.
    window.location.href = next === 'global' ? '/GlobalDashboard' : '/Home';
  };

  if (collapsed) {
    return (
      <div className="flex flex-col gap-1 px-1">
        <button
          onClick={() => onPick('brasil')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            ctx === 'brasil' ? 'bg-[#2bc196] text-white shadow' : 'text-white/40 hover:bg-white/5'
          }`}
          title="Brasil"
        >
          <Flag className="w-4 h-4" />
        </button>
        <button
          onClick={() => onPick('global')}
          className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
            ctx === 'global' ? 'bg-[#2bc196] text-white shadow' : 'text-white/40 hover:bg-white/5'
          }`}
          title="Global"
        >
          <Globe2 className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-xl p-1 flex gap-1">
      <button
        onClick={() => onPick('brasil')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
          ctx === 'brasil' ? 'bg-[#2bc196] text-white shadow' : 'text-white/50 hover:text-white/80'
        }`}
      >
        <Flag className="w-3 h-3" />
        Brasil
      </button>
      <button
        onClick={() => onPick('global')}
        className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
          ctx === 'global' ? 'bg-[#2bc196] text-white shadow' : 'text-white/50 hover:text-white/80'
        }`}
      >
        <Globe2 className="w-3 h-3" />
        Global
      </button>
    </div>
  );
}