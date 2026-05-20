import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Shield, Rocket, ExternalLink, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/**
 * [V5.2 Fase 6.5.3] Header do Comparator V4↔V5.2.
 *
 * Mostra identificação do merchant + datas dos dois casos + botão voltar.
 * Não toma decisões — apenas resume o "o que estou comparando".
 */
export default function ComparatorHeader({ merchant, v4Case, v5_2Case }) {
  const fmt = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return '—'; }
  };

  const merchantName = merchant?.companyName || merchant?.fullName || 'Cliente sem nome';
  const merchantDoc = merchant?.cpfCnpj || '—';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      {/* Top row: back + breadcrumb */}
      <div className="flex items-center justify-between mb-4">
        <Link
          to={merchant?.id ? `/CadastroDetalhe?id=${merchant.id}` : '/Cadastro'}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#002443]/70 hover:text-[#002443]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar ao cadastro
        </Link>
        <Badge className="bg-[#2bc196]/15 text-[#2bc196] border border-[#2bc196]/30 text-[10px] gap-1">
          <Rocket className="w-2.5 h-2.5" /> Comparator V4 ↔ V5.2
        </Badge>
      </div>

      {/* Merchant identification */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-[#002443]">{merchantName}</h1>
        <p className="text-xs text-[#002443]/60 mt-0.5">
          {merchant?.type === 'PF' ? 'CPF' : 'CNPJ'}: <span className="font-mono">{merchantDoc}</span>
        </p>
      </div>

      {/* Side-by-side cases overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* V4 column */}
        <div className="border-2 border-blue-200 bg-blue-50/40 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
                <Shield className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Trilho V4 (Legado)</p>
                <p className="text-xs font-semibold text-[#002443]">Análise oficial</p>
              </div>
            </div>
            {v4Case?.id && (
              <Link
                to={`/AnaliseCompleta?id=${v4Case.id}`}
                className="inline-flex items-center gap-1 text-[10px] text-blue-700 hover:underline"
              >
                Análise <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#002443]/60">
            <Calendar className="w-3 h-3" />
            <span>Submetido em {fmt(v4Case?.submissionDate || v4Case?.created_date)}</span>
          </div>
          <p className="text-[10px] text-[#002443]/50 mt-1 font-mono truncate">id: {v4Case?.id || '—'}</p>
        </div>

        {/* V5.2 column */}
        <div className="border-2 border-[#2bc196]/40 bg-[#2bc196]/5 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#2bc196] flex items-center justify-center">
                <Rocket className="w-3.5 h-3.5 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#2bc196]">Trilho V5.2 (Novo)</p>
                <p className="text-xs font-semibold text-[#002443]">Sandbox / reprocesso</p>
              </div>
            </div>
            {v5_2Case?.id && (
              <Link
                to={`/AnaliseCompleta?id=${v5_2Case.id}`}
                className="inline-flex items-center gap-1 text-[10px] text-[#2bc196] hover:underline"
              >
                Análise <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#002443]/60">
            <Calendar className="w-3 h-3" />
            <span>Reprocessado em {fmt(v5_2Case?.submissionDate || v5_2Case?.created_date)}</span>
          </div>
          <p className="text-[10px] text-[#002443]/50 mt-1 font-mono truncate">id: {v5_2Case?.id || '—'}</p>
        </div>
      </div>
    </div>
  );
}