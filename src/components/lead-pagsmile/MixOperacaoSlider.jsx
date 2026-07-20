import React from 'react';

/**
 * MixOperacaoSlider — Composição da operação BASEADA NOS PRODUTOS SELECIONADOS.
 * Recebe a lista de produtos que o cliente escolheu na Etapa 4 e gera 1 slider para cada.
 * O cliente distribui % entre eles. Total deve somar 100%.
 *
 * value = { [nomeProduto]: percentual, ... }
 */

const COR_FISICO = '#1356E2';
const COR_DIGITAL = '#1e90c8';

export default function MixOperacaoSlider({ value, onChange, produtos = [] }) {
  const safeValue = value || {};

  const total = produtos.reduce((s, p) => s + (Number(safeValue[p.nome]) || 0), 0);
  const isValid = total === 100;

  const setPct = (nome, raw) => {
    const v = Math.max(0, Math.min(100, parseInt(raw, 10) || 0));
    onChange({ ...safeValue, [nome]: v });
  };

  // Auto-distribui igualmente entre todos os produtos
  const distribuirIgual = () => {
    if (produtos.length === 0) return;
    const base = Math.floor(100 / produtos.length);
    const resto = 100 - base * produtos.length;
    const nova = {};
    produtos.forEach((p, i) => {
      nova[p.nome] = i === 0 ? base + resto : base;
    });
    onChange(nova);
  };

  if (produtos.length === 0) {
    return (
      <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-900">
        ⚠️ Volte para a etapa <strong>Modelo de Negócio</strong> e selecione pelo menos 1 produto antes de prosseguir.
      </div>
    );
  }

  const fisicos = produtos.filter(p => p.categoria === 'Físico');
  const digitais = produtos.filter(p => p.categoria === 'Digital');

  const renderSlider = (p) => {
    const cor = p.categoria === 'Físico' ? COR_FISICO : COR_DIGITAL;
    const val = Number(safeValue[p.nome]) || 0;
    return (
      <div key={p.nome} className="space-y-1.5">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-[#0A0A0A]/80">{p.nome}</span>
          <span className="text-sm font-bold" style={{ color: cor }}>{val}%</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            value={val}
            onChange={(e) => setPct(p.nome, e.target.value)}
            className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${cor} 0%, ${cor} ${val}%, #e5e7eb ${val}%, #e5e7eb 100%)`,
            }}
          />
          <input
            type="number"
            min={0}
            max={100}
            value={val}
            onChange={(e) => setPct(p.nome, e.target.value)}
            className="w-16 h-8 text-center text-sm font-mono rounded-lg border border-[#0A0A0A]/10 bg-white"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Disclaimer */}
      <div className="rounded-xl bg-[#E84B1C]/10 border border-[#1356E2]/20 px-4 py-3 text-xs text-[#0A0A0A]/80 leading-relaxed">
        💡 <strong>Os percentuais podem ser estimados.</strong> Não precisa ser exato — uma aproximação do peso de cada produto na sua operação já nos ajuda muito.
      </div>

      {/* Botão distribuir igual */}
      <button
        type="button"
        onClick={distribuirIgual}
        className="text-xs font-medium text-[#1356E2] hover:underline"
      >
        Distribuir igualmente entre {produtos.length} produto{produtos.length > 1 ? 's' : ''}
      </button>

      {/* Sliders agrupados */}
      {fisicos.length > 0 && (
        <div className="space-y-4">
          {digitais.length > 0 && (
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#0A0A0A]/40">Produtos Físicos</p>
          )}
          {fisicos.map(renderSlider)}
        </div>
      )}

      {digitais.length > 0 && (
        <div className="space-y-4 pt-2">
          {fisicos.length > 0 && (
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#0A0A0A]/40 border-t border-[#0A0A0A]/10 pt-3">Produtos Digitais</p>
          )}
          {digitais.map(renderSlider)}
        </div>
      )}

      {/* Total */}
      <div
        className={`flex items-center justify-between p-3 rounded-xl text-sm font-bold ${
          isValid ? 'bg-[#1356E2]/10 text-[#1356E2]' : 'bg-red-50 text-red-600'
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