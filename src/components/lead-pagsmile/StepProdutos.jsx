import React from 'react';
import ButtonSelector from './ButtonSelector';
import { TIPO_PRODUTO_OPTIONS, PRODUTOS_FISICOS, PRODUTOS_DIGITAIS } from './productsCatalog';

/**
 * NOVA PERGUNTA — Tipo de Produto + Quais produtos vende
 * Embutida no Step de Modelo de Negócio.
 * - Tipo de Produto: Físico / Digital / Ambos (seleção única)
 * - Quais produtos: multi-seleção em chips (depende do tipo)
 */
export default function StepProdutos({ form, updateField, errors = {} }) {
  const tipoProduto = form.tipoProduto;
  const produtos = form.produtosSelecionados || [];

  const toggleProduto = (nome) => {
    const exists = produtos.find(p => p.nome === nome);
    let updated;
    if (exists) {
      updated = produtos.filter(p => p.nome !== nome);
    } else {
      // Detecta a categoria automaticamente
      const categoria = PRODUTOS_FISICOS.includes(nome) ? 'Físico' : 'Digital';
      updated = [...produtos, { nome, categoria }];
    }
    updateField('produtosSelecionados', updated);
  };

  const isSelected = (nome) => produtos.some(p => p.nome === nome);

  // Quando muda o tipo, limpa produtos que não pertencem mais ao novo tipo
  const handleTipoChange = (novoTipo) => {
    updateField('tipoProduto', novoTipo);
    if (novoTipo === 'Físico') {
      updateField('produtosSelecionados', produtos.filter(p => p.categoria === 'Físico'));
    } else if (novoTipo === 'Digital') {
      updateField('produtosSelecionados', produtos.filter(p => p.categoria === 'Digital'));
    }
    // Se mudou pra "Ambos", mantém os atuais
  };

  const renderChip = (nome) => {
    const selected = isSelected(nome);
    return (
      <button
        key={nome}
        type="button"
        onClick={() => toggleProduto(nome)}
        className={`px-3.5 py-2 rounded-full text-xs font-medium border-2 transition-all
          ${selected
            ? 'bg-[#2bc196] border-[#2bc196] text-white shadow-sm'
            : 'bg-white border-[#002443]/15 text-[#002443]/70 hover:border-[#2bc196]/40 hover:bg-[#2bc196]/5'
          }`}
      >
        {selected && '✓ '}{nome}
      </button>
    );
  };

  return (
    <div className="space-y-5">
      {/* Tipo de Produto */}
      <div className="space-y-2" data-field="tipoProduto">
        <label className="text-sm font-semibold text-[#002443]">Tipo de Produto *</label>
        <p className="text-xs text-[#002443]/50">Você vende produtos físicos, digitais ou ambos?</p>
        <ButtonSelector
          options={TIPO_PRODUTO_OPTIONS}
          value={tipoProduto}
          onChange={handleTipoChange}
          columns={3}
        />
        {errors?.tipoProduto && <p className="text-xs text-red-500">Selecione o tipo de produto</p>}
      </div>

      {/* Quais produtos vende */}
      {tipoProduto && (
        <div className="space-y-3" data-field="produtosSelecionados">
          <div>
            <label className="text-sm font-semibold text-[#002443]">Quais produtos você vende? *</label>
            <p className="text-xs text-[#002443]/50">Selecione todos que se aplicam</p>
          </div>

          {/* Físicos */}
          {(tipoProduto === 'Físico' || tipoProduto === 'Ambos') && (
            <div className="space-y-2">
              {tipoProduto === 'Ambos' && (
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#002443]/40">Produtos Físicos</p>
              )}
              <div className="flex flex-wrap gap-2">
                {PRODUTOS_FISICOS.map(renderChip)}
              </div>
            </div>
          )}

          {/* Digitais */}
          {(tipoProduto === 'Digital' || tipoProduto === 'Ambos') && (
            <div className="space-y-2">
              {tipoProduto === 'Ambos' && (
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#002443]/40 mt-3">Produtos Digitais</p>
              )}
              <div className="flex flex-wrap gap-2">
                {PRODUTOS_DIGITAIS.map(renderChip)}
              </div>
            </div>
          )}

          {errors?.produtosSelecionados && (
            <p className="text-xs text-red-500">Selecione pelo menos 1 produto</p>
          )}
          {produtos.length > 0 && (
            <p className="text-[11px] text-[#2bc196] font-medium">
              ✓ {produtos.length} produto{produtos.length > 1 ? 's' : ''} selecionado{produtos.length > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )}
    </div>
  );
}