import React from 'react';
import { Copy, Check, ExternalLink, ShoppingCart, GraduationCap, Lightbulb, Monitor, Globe, Store, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const SEGMENT_ICONS = {
  'E-commerce': ShoppingCart,
  'Educação': GraduationCap,
  'Infoprodutos': Lightbulb,
  'SaaS': Monitor,
  'Gateway': Globe,
  'Marketplace': Store,
  'Dropshipping': Package,
};

const SEGMENT_COLORS = {
  'E-commerce': 'from-emerald-500 to-teal-600',
  'Educação': 'from-blue-500 to-indigo-600',
  'Infoprodutos': 'from-amber-500 to-orange-600',
  'SaaS': 'from-violet-500 to-purple-600',
  'Gateway': 'from-rose-500 to-pink-600',
  'Marketplace': 'from-cyan-500 to-blue-600',
  'Dropshipping': 'from-orange-500 to-red-600',
};

const ALL_SEGMENTS = ['E-commerce', 'Educação', 'Infoprodutos', 'SaaS', 'Gateway', 'Marketplace', 'Dropshipping'];

export default function SegmentQuickLinks({ proposals }) {
  const [copiedSegment, setCopiedSegment] = React.useState(null);

  // Find the default proposal for each segment
  const segmentMap = React.useMemo(() => {
    const map = {};
    ALL_SEGMENTS.forEach(seg => {
      // First try isDefaultForSegment, then fallback to first active one
      const defaultProp = proposals.find(p => p.segment === seg && p.isDefaultForSegment && p.status === 'ativa' && p.tokenPublico);
      if (defaultProp) {
        map[seg] = defaultProp;
      } else {
        const activeProp = proposals.find(p => p.segment === seg && p.status === 'ativa' && p.tokenPublico);
        if (activeProp) map[seg] = activeProp;
      }
    });
    return map;
  }, [proposals]);

  const copyLink = (segment) => {
    const prop = segmentMap[segment];
    if (!prop) return;
    const url = `${window.location.origin}/PropostaPadraoPublica?token=${prop.tokenPublico}`;
    navigator.clipboard.writeText(url);
    setCopiedSegment(segment);
    toast.success(`Link da proposta ${segment} copiado!`);
    setTimeout(() => setCopiedSegment(null), 2000);
  };

  const openLink = (segment) => {
    const prop = segmentMap[segment];
    if (!prop) return;
    const url = `${window.location.origin}/PropostaPadraoPublica?token=${prop.tokenPublico}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-[#002443]">Links Rápidos por Segmento</h2>
          <p className="text-xs text-[#002443]/50 mt-0.5">Copie o link da proposta padrão de cada segmento para enviar ao cliente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ALL_SEGMENTS.map(segment => {
          const Icon = SEGMENT_ICONS[segment];
          const colorClass = SEGMENT_COLORS[segment];
          const prop = segmentMap[segment];
          const isCopied = copiedSegment === segment;

          return (
            <div
              key={segment}
              className={`relative rounded-xl border p-4 transition-all duration-200 ${
                prop
                  ? 'border-[#002443]/8 hover:border-[#2bc196]/30 hover:shadow-md bg-white'
                  : 'border-dashed border-[#002443]/10 bg-[#f4f4f4]/50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-extrabold text-[#2bc196]">{segment}</p>
                  <p className="text-[11px] text-[#002443]/50 truncate">Proposta Padrão</p>
                </div>
              </div>

              {prop ? (
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => copyLink(segment)}
                    className={`flex-1 h-8 text-xs font-semibold rounded-lg transition-all ${
                      isCopied
                        ? 'bg-green-500 hover:bg-green-500 text-white'
                        : 'bg-[#2bc196] hover:bg-[#2bc196]/90 text-white'
                    }`}
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                    {isCopied ? 'Copiado!' : 'Copiar Link'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openLink(segment)}
                    className="h-8 w-8 p-0 rounded-lg border-[#002443]/10"
                    title="Abrir proposta"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <p className="text-[10px] text-[#002443]/40 mt-3 text-center">Nenhuma proposta ativa</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}