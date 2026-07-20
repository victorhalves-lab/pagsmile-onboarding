import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Search, Hash, Building2 } from 'lucide-react';
import { MCC_LIST, CNAE_TO_MCC } from './mccData';

export default function MCCSearchModal({ isOpen, onClose, onSelect }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [cnaeSearch, setCnaeSearch] = useState('');
  const [activeTab, setActiveTab] = useState('keyword'); // 'keyword' | 'cnae'

  const filteredMCCs = useMemo(() => {
    if (activeTab === 'cnae' && cnaeSearch.trim()) {
      // Limpar CNAE (remover / e -)
      const cleanCnae = cnaeSearch.replace(/[\/\-\.\s]/g, '');
      const foundMcc = CNAE_TO_MCC[cleanCnae];
      if (foundMcc) {
        return MCC_LIST.filter(m => m.mcc === foundMcc);
      }
      // Busca parcial por CNAE
      const partial = Object.entries(CNAE_TO_MCC)
        .filter(([cnae]) => cnae.startsWith(cleanCnae))
        .map(([, mcc]) => mcc);
      const uniqueMccs = [...new Set(partial)];
      return MCC_LIST.filter(m => uniqueMccs.includes(m.mcc));
    }

    if (activeTab === 'keyword' && searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      return MCC_LIST.filter(m => 
        m.mcc.includes(term) ||
        m.name.toLowerCase().includes(term) ||
        m.nameEn.toLowerCase().includes(term)
      );
    }

    return MCC_LIST;
  }, [searchTerm, cnaeSearch, activeTab]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-[#0A0A0A]">Buscar Código MCC</h2>
            <p className="text-xs text-[#0A0A0A]/60 mt-0.5">Merchant Category Code - Código de atividade do negócio</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-[#0A0A0A]/60" />
          </button>
        </div>

        {/* Tabs de busca */}
        <div className="px-5 pt-4">
          <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
            <button
              onClick={() => setActiveTab('keyword')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'keyword' 
                  ? 'bg-white text-[#0A0A0A] shadow-sm' 
                  : 'text-[#0A0A0A]/50 hover:text-[#0A0A0A]/70'
              }`}
            >
              <Search className="w-4 h-4" />
              Buscar por Palavra
            </button>
            <button
              onClick={() => setActiveTab('cnae')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'cnae' 
                  ? 'bg-white text-[#0A0A0A] shadow-sm' 
                  : 'text-[#0A0A0A]/50 hover:text-[#0A0A0A]/70'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Buscar por CNAE
            </button>
          </div>

          {activeTab === 'keyword' ? (
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A0A0A]/40" />
              <Input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Ex: Restaurante, Varejo, Software..."
                className="h-12 pl-11 rounded-xl"
                autoFocus
              />
            </div>
          ) : (
            <div className="relative">
              <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A0A0A]/40" />
              <Input
                value={cnaeSearch}
                onChange={e => setCnaeSearch(e.target.value)}
                placeholder="Ex: 5611201 ou 5611-2/01"
                className="h-12 pl-11 rounded-xl"
                autoFocus
              />
              {cnaeSearch.trim() && filteredMCCs.length === 0 && (
                <p className="text-xs text-amber-600 mt-2">
                  Nenhum MCC encontrado para este CNAE. Verifique o número e tente novamente.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Lista de resultados */}
        <div className="flex-1 overflow-y-auto px-5 py-3 min-h-0">
          <p className="text-xs text-[#0A0A0A]/50 mb-2">
            {filteredMCCs.length} {filteredMCCs.length === 1 ? 'resultado' : 'resultados'}
          </p>
          <div className="space-y-1.5">
            {filteredMCCs.map(mcc => (
              <button
                key={mcc.mcc}
                onClick={() => {
                  onSelect(mcc.mcc);
                  onClose();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-[#1356E2] hover:bg-[#1356E2]/5 transition-all text-left group"
              >
                <Badge className="bg-[#0A0A0A]/10 text-[#0A0A0A] font-mono font-bold text-sm px-2.5 py-1 shrink-0">
                  {mcc.mcc}
                </Badge>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0A0A0A] truncate">{mcc.name}</p>
                  <p className="text-xs text-[#0A0A0A]/50 truncate">{mcc.nameEn}</p>
                </div>
                <span className="text-xs text-[#1356E2] font-semibold opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  Selecionar
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200">
          <Button variant="outline" onClick={onClose} className="w-full">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}