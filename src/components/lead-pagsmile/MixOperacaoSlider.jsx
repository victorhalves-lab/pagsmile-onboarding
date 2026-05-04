import React from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * MixOperacaoSlider — Composição da operação do cliente.
 * Categorias fixas: E-commerce, Dropshipping, Infoproduto, SaaS, Educação.
 * "Outros" é uma lista dinâmica: cliente pode adicionar várias categorias livres
 * com nome + percentual. Total deve somar 100%.
 *
 * value = {
 *   ecommerce: number, dropshipping: number, infoproduto: number,
 *   saas: number, educacao: number,
 *   outros: [{ nome: string, percentual: number }, ...]
 * }
 */

const FIXED_CATEGORIES = [
  { key: 'ecommerce',    label: 'E-commerce',   color: '#2bc196', hint: 'Loja virtual com estoque próprio' },
  { key: 'dropshipping', label: 'Dropshipping', color: '#36706c', hint: 'Loja sem estoque, fornecedor envia direto' },
  { key: 'infoproduto',  label: 'Infoproduto',  color: '#5cf7cf', hint: 'Cursos, e-books, mentorias, áreas de membros' },
  { key: 'saas',         label: 'SaaS',         color: '#1e90c8', hint: 'Software por assinatura recorrente' },
  { key: 'educacao',     label: 'Educação',     color: '#002443', hint: 'Escola, faculdade, curso presencial / instituição' },
];

export default function MixOperacaoSlider({ value, onChange }) {
  const safeValue = {
    ecommerce: 0, dropshipping: 0, infoproduto: 0, saas: 0, educacao: 0,
    outros: [],
    ...(value || {}),
  };

  const total =
    FIXED_CATEGORIES.reduce((s, c) => s + (Number(safeValue[c.key]) || 0), 0) +
    (safeValue.outros || []).reduce((s, o) => s + (Number(o.percentual) || 0), 0);

  const isValid = total === 100;

  const setFixed = (key, raw) => {
    const v = Math.max(0, Math.min(100, parseInt(raw, 10) || 0));
    onChange({ ...safeValue, [key]: v });
  };

  const addOutro = () => {
    onChange({
      ...safeValue,
      outros: [...(safeValue.outros || []), { nome: '', percentual: 0 }],
    });
  };

  const updateOutro = (idx, field, raw) => {
    const list = [...(safeValue.outros || [])];
    if (field === 'percentual') {
      list[idx] = { ...list[idx], percentual: Math.max(0, Math.min(100, parseInt(raw, 10) || 0)) };
    } else {
      list[idx] = { ...list[idx], nome: String(raw || '').slice(0, 60) };
    }
    onChange({ ...safeValue, outros: list });
  };

  const removeOutro = (idx) => {
    const list = [...(safeValue.outros || [])];
    list.splice(idx, 1);
    onChange({ ...safeValue, outros: list });
  };

  const renderRow = ({ key, label, color, hint, val, onPct, isOther, idx, nome, onNome, onRemove }) => (
    <div key={key} className="space-y-1.5">
      {isOther ? (
        <div className="flex items-center gap-2">
          <Input
            placeholder='Nome da categoria (ex: "Eventos", "Consultoria")'
            value={nome}
            onChange={(e) => onNome(e.target.value)}
            className="flex-1 h-9 text-sm"
          />
          <button
            type="button"
            onClick={onRemove}
            className="text-[#002443]/40 hover:text-red-500 p-1 rounded transition-colors"
            title="Remover esta categoria"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="flex justify-between items-center">
          <div>
            <span className="text-sm font-medium text-[#002443]/80">{label}</span>
            {hint && <p className="text-[10px] text-[#002443]/40 mt-0.5">{hint}</p>}
          </div>
          <span className="text-sm font-bold" style={{ color }}>{val || 0}%</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={100}
          value={val || 0}
          onChange={(e) => onPct(e.target.value)}
          className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${val || 0}%, #e5e7eb ${val || 0}%, #e5e7eb 100%)`,
          }}
        />
        <input
          type="number"
          min={0}
          max={100}
          value={val || 0}
          onChange={(e) => onPct(e.target.value)}
          className="w-16 h-8 text-center text-sm font-mono rounded-lg border border-[#002443]/10 bg-white"
        />
        {isOther && (
          <span className="text-sm font-bold w-10 text-right" style={{ color }}>%</span>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Disclaimer */}
      <div className="rounded-xl bg-[#5cf7cf]/10 border border-[#2bc196]/20 px-4 py-3 text-xs text-[#002443]/80 leading-relaxed">
        💡 <strong>Os percentuais podem ser estimados.</strong> Não precisa ser exato — uma aproximação do peso de cada categoria na sua operação é suficiente. O importante é nos dar uma visão geral do que você vende.
      </div>

      {/* Categorias fixas */}
      <div className="space-y-4">
        {FIXED_CATEGORIES.map((c) =>
          renderRow({
            key: c.key,
            label: c.label,
            color: c.color,
            hint: c.hint,
            val: safeValue[c.key],
            onPct: (raw) => setFixed(c.key, raw),
          })
        )}
      </div>

      {/* Outros (lista dinâmica) */}
      {(safeValue.outros || []).length > 0 && (
        <div className="space-y-4 pt-2 border-t border-[#002443]/10">
          <p className="text-xs font-bold uppercase tracking-wider text-[#002443]/50">Outros</p>
          {safeValue.outros.map((o, idx) =>
            renderRow({
              key: `outro-${idx}`,
              color: '#8b5cf6',
              val: o.percentual,
              onPct: (raw) => updateOutro(idx, 'percentual', raw),
              isOther: true,
              idx,
              nome: o.nome || '',
              onNome: (raw) => updateOutro(idx, 'nome', raw),
              onRemove: () => removeOutro(idx),
            })
          )}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        onClick={addOutro}
        className="w-full rounded-xl border-dashed border-[#002443]/20 text-[#002443]/70 hover:bg-[#2bc196]/5 hover:border-[#2bc196]/40 hover:text-[#002443] gap-2"
      >
        <Plus className="w-4 h-4" /> Adicionar outra categoria
      </Button>

      {/* Total */}
      <div
        className={`flex items-center justify-between p-3 rounded-xl text-sm font-bold ${
          isValid ? 'bg-[#2bc196]/10 text-[#2bc196]' : 'bg-red-50 text-red-600'
        }`}
      >
        <span>Total</span>
        <span>
          {total}% {isValid ? '✓' : total < 100 ? `(faltam ${100 - total}%)` : `(${total - 100}% acima de 100%)`}
        </span>
      </div>
    </div>
  );
}