import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Eye, Building2, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import moment from 'moment';

const STATUS_CONFIG = {
  rascunho: { label: 'Rascunho', color: 'bg-slate-100 text-slate-700' },
  enviada: { label: 'Enviada', color: 'bg-yellow-100 text-yellow-700' },
  visualizada: { label: 'Visualizada', color: 'bg-orange-100 text-orange-700' },
  contraproposta: { label: 'Contraproposta', color: 'bg-blue-100 text-blue-700' },
  aceita: { label: 'Aceita', color: 'bg-green-100 text-green-700' },
  recusada: { label: 'Recusada', color: 'bg-red-100 text-red-700' },
  expirada: { label: 'Expirada', color: 'bg-slate-100 text-slate-500' },
};

export default function ProposalsByCompanyTab({ propostas = [] }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [expandedCompanies, setExpandedCompanies] = useState([]);

  const grouped = useMemo(() => {
    const currentVersions = propostas.filter(p => p.isCurrentVersion !== false);
    
    let filtered = currentVersions;
    if (search) {
      const s = search.toLowerCase();
      filtered = currentVersions.filter(p => (p.clienteNome || '').toLowerCase().includes(s));
    }

    const map = {};
    filtered.forEach(p => {
      const company = p.clienteNome || 'Sem empresa';
      if (!map[company]) map[company] = [];
      map[company].push(p);
    });

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([company, proposals]) => ({
        company,
        proposals: proposals.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)),
        total: proposals.length,
      }));
  }, [propostas, search]);

  const toggleCompany = (company) => {
    setExpandedCompanies(prev =>
      prev.includes(company) ? prev.filter(c => c !== company) : [...prev, company]
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#0A0A0A]/40" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrar por nome da empresa..."
          className="pl-10 h-10"
        />
      </div>

      {grouped.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 mx-auto text-[#0A0A0A]/20 mb-3" />
          <p className="text-[#0A0A0A]/60">
            {search ? `Nenhuma empresa encontrada para "${search}"` : 'Nenhuma proposta cadastrada'}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {grouped.map(({ company, proposals, total }) => {
          const isExpanded = expandedCompanies.includes(company);
          return (
            <div key={company} className="bg-white rounded-xl border border-[#0A0A0A]/5 shadow-sm overflow-hidden">
              <button
                onClick={() => toggleCompany(company)}
                className="w-full flex items-center gap-3 px-5 py-4 hover:bg-[#f4f4f4] transition-colors text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-[#1356E2]/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-4 h-4 text-[#1356E2]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#0A0A0A] truncate">{company}</p>
                  <p className="text-xs text-[#0A0A0A]/50">{total} proposta{total > 1 ? 's' : ''}</p>
                </div>
                {isExpanded ? <ChevronDown className="w-4 h-4 text-[#0A0A0A]/40" /> : <ChevronRight className="w-4 h-4 text-[#0A0A0A]/40" />}
              </button>

              {isExpanded && (
                <div className="border-t border-[#0A0A0A]/5 divide-y divide-[#0A0A0A]/5">
                  {proposals.map(p => {
                    const sCfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.rascunho;
                    return (
                      <div key={p.id} className="flex items-center gap-4 px-5 py-3 hover:bg-[#f4f4f4]/50 transition-colors">
                        <FileText className="w-4 h-4 text-[#0A0A0A]/30 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[#0A0A0A] truncate">
                            <span className="font-mono text-[#1356E2] mr-2">{p.codigo || '—'}</span>
                            {p.proposalName || ''}
                          </p>
                          <p className="text-xs text-[#0A0A0A]/50">
                            Criada em {moment(p.created_date).format('DD/MM/YYYY')}
                            {p.version > 1 && <span className="ml-2 text-[#1356E2]">v{p.version}</span>}
                          </p>
                        </div>
                        <Badge className={sCfg.color}>{sCfg.label}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(createPageUrl('PropostaDetalhes') + `?id=${p.id}`)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}