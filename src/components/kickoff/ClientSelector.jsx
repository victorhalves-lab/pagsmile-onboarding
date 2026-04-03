import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Loader2, Building2, FileText, Check } from 'lucide-react';

export default function ClientSelector({ onSelect }) {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setLoading(true);
    setResults(null);

    // Search proposals with status "aceita"
    const allProposals = await base44.entities.Proposal.filter({ status: 'aceita' });
    const searchLower = search.toLowerCase().replace(/\D/g, '');
    const searchText = search.toLowerCase();

    const filtered = allProposals.filter(p => {
      const nameMatch = p.clienteNome?.toLowerCase().includes(searchText);
      const cnpjMatch = p.clienteCnpj?.replace(/\D/g, '').includes(searchLower);
      const codeMatch = p.codigo?.toLowerCase().includes(searchText);
      return nameMatch || cnpjMatch || codeMatch;
    });

    // For each proposal, try to find a matching contract
    const enriched = [];
    for (const prop of filtered) {
      let contract = null;
      if (prop.id) {
        const contracts = await base44.entities.Contract.filter({ proposalId: prop.id });
        contract = contracts?.[0] || null;
      }
      if (!contract && prop.clienteCnpj) {
        const contracts = await base44.entities.Contract.filter({ clientCnpj: prop.clienteCnpj?.replace(/\D/g, '') });
        contract = contracts?.[0] || null;
      }
      enriched.push({ proposal: prop, contract });
    }

    setResults(enriched);
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-[#2bc196]/10 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-[#2bc196]" />
        </div>
        <h1 className="text-2xl font-bold text-[#002443] mb-2">Gerar Apresentação de Kick-Off</h1>
        <p className="text-sm text-[#002443]/50">Busque pelo cliente para gerar a apresentação com todas as taxas e condições negociadas</p>
      </div>

      <div className="flex gap-2 mb-6">
        <Input
          placeholder="Buscar por nome, CNPJ ou código da proposta..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          className="flex-1"
        />
        <Button onClick={handleSearch} disabled={loading} className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white px-6">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {results !== null && results.length === 0 && (
        <div className="text-center py-12 text-[#002443]/40 text-sm">
          Nenhuma proposta aceita encontrada para "{search}"
        </div>
      )}

      {results && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-[#002443]/50 font-medium">{results.length} proposta(s) aceita(s) encontrada(s)</p>
          {results.map(({ proposal, contract }, i) => (
            <button
              key={i}
              onClick={() => onSelect({ proposal, contract })}
              className="w-full text-left p-4 bg-white rounded-xl border border-[#002443]/8 hover:border-[#2bc196] hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#002443]/5 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-[#002443]/40" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#002443]">{proposal.clienteNome || 'Sem nome'}</p>
                    <p className="text-[10px] text-[#002443]/50">
                      {proposal.clienteCnpj || '—'} • {proposal.codigo || '—'} • {proposal.businessSubCategory || '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {contract ? (
                    <Badge className="bg-green-50 text-green-600 text-[10px]">Com contrato</Badge>
                  ) : (
                    <Badge className="bg-amber-50 text-amber-600 text-[10px]">Sem contrato</Badge>
                  )}
                  <Check className="w-4 h-4 text-[#2bc196] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}