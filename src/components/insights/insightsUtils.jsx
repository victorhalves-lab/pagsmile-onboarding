// Utility functions for insights calculations

export function calcStats(values) {
  const nums = values.filter(v => typeof v === 'number' && !isNaN(v) && v > 0);
  if (nums.length === 0) return { min: 0, max: 0, avg: 0, median: 0, count: 0, total: 0 };
  
  const sorted = [...nums].sort((a, b) => a - b);
  const total = nums.reduce((s, v) => s + v, 0);
  const avg = total / nums.length;
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg: Math.round(avg * 100) / 100,
    median: Math.round(median * 100) / 100,
    count: nums.length,
    total: Math.round(total * 100) / 100,
  };
}

export function formatCurrency(value) {
  if (!value && value !== 0) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
}

export function formatPercent(value) {
  if (!value && value !== 0) return '-';
  return `${value.toFixed(2)}%`;
}

export function formatNumber(value) {
  if (!value && value !== 0) return '-';
  return new Intl.NumberFormat('pt-BR').format(Math.round(value));
}