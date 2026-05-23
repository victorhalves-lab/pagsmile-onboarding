// ============================================================
// CATÁLOGO DE PRODUTOS — Físicos e Digitais
// Usado nas perguntas "Tipo de Produto" + "Quais produtos vende?"
// ============================================================

export const PRODUTOS_FISICOS = [
  'Roupas e Moda',
  'Calçados e Acessórios',
  'Cosméticos e Perfumaria',
  'Eletrônicos',
  'Eletrodomésticos',
  'Móveis e Decoração',
  'Livros e Papelaria',
  'Alimentos e Bebidas',
  'Suplementos',
  'Pet',
  'Esporte e Fitness',
  'Brinquedos',
  'Joias e Bijuterias',
  'Automotivo',
  'Outros Físicos',
];

export const PRODUTOS_DIGITAIS = [
  'Infoprodutos (e-books, PDFs)',
  'Cursos Online',
  'Mentorias e Coaching',
  'SaaS (Software)',
  'Templates e Recursos Gráficos',
  'Plugins e Extensões',
  'Áudio e Trilhas Sonoras',
  'Vídeos e Filmes',
  'Apps e Jogos',
  'Assinaturas de Conteúdo',
  'Comunidades Pagas',
  'Licenças de Software',
  'Outros Digitais',
];

export const TIPO_PRODUTO_OPTIONS = ['Físico', 'Digital', 'Ambos'];

// Pega lista correta de produtos com base no Tipo de Produto
export function getProdutosDisponiveis(tipoProduto) {
  if (tipoProduto === 'Físico') return PRODUTOS_FISICOS.map(p => ({ nome: p, categoria: 'Físico' }));
  if (tipoProduto === 'Digital') return PRODUTOS_DIGITAIS.map(p => ({ nome: p, categoria: 'Digital' }));
  if (tipoProduto === 'Ambos') {
    return [
      ...PRODUTOS_FISICOS.map(p => ({ nome: p, categoria: 'Físico' })),
      ...PRODUTOS_DIGITAIS.map(p => ({ nome: p, categoria: 'Digital' })),
    ];
  }
  return [];
}

// Lista de "dores no mercado" (Etapa 9 — sempre visível)
export const DORES_MERCADO_OPTIONS = [
  'Taxas altas',
  'Antecipação cara',
  'Atendimento ruim',
  'Aprovação baixa',
  'Muito chargeback',
  'Muito MED PIX',
  'Demora no repasse (D+30, D+90)',
  'Falta de integração técnica',
  'Limites de processamento baixos',
  'Bloqueios/encerramentos sem aviso',
  'Falta de suporte para meu segmento',
];

// Faixas obrigatórias de Chargeback (Etapa 10 — sempre visível)
export const CHARGEBACK_FAIXAS = ['Menos de 0,5%', '0,5% a 1%', 'Acima de 1%'];

// Faixas obrigatórias de MED PIX (Etapa 10 — sempre visível)
export const MED_PIX_FAIXAS = ['Menos de 0,5%', '0,5% a 1%', '1% a 2%', 'Acima de 2%'];