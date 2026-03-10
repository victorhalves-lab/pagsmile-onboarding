import React from 'react';
import {
  Globe, Mail, Phone, Hash, ToggleLeft, FileText,
  CheckCircle2, XCircle, ExternalLink, Copy, Calendar,
  DollarSign, Percent
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

function getTypeIcon(type, text) {
  const t = (text || '').toLowerCase();
  if (type === 'BOOLEAN') return ToggleLeft;
  if (type === 'EMAIL' || t.includes('e-mail') || t.includes('email')) return Mail;
  if (type === 'PHONE' || t.includes('telefone') || t.includes('celular')) return Phone;
  if (type === 'DATE' || t.includes('data')) return Calendar;
  if (type === 'NUMBER' || type === 'CPF_CNPJ') return Hash;
  if (t.includes('site') || t.includes('url') || t.includes('www') || t.includes('http')) return Globe;
  if (t.includes('tpv') || t.includes('faturamento') || t.includes('ticket') || t.includes('r$')) return DollarSign;
  if (t.includes('%') || t.includes('percentual')) return Percent;
  return FileText;
}

function formatValue(value, text, type) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (Array.isArray(value)) return value;

  const str = String(value);
  const num = parseFloat(str);
  const qLower = (text || '').toLowerCase();

  const isMoney = qLower.includes('tpv') || qLower.includes('ticket') || qLower.includes('faturamento') || qLower.includes('(r$)') || qLower.includes('r$') || qLower.includes('valor');
  if (isMoney && !isNaN(num) && num > 0) {
    return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const isPercent = qLower.includes('(%)') || qLower.includes('percentual') || qLower.includes('distribuição');
  if (isPercent && !isNaN(num)) {
    return `${num.toFixed(2).replace('.', ',')}%`;
  }

  return str;
}

export default function ResponseCard({ question, value, type }) {
  const formatted = formatValue(value, question, type);
  const Icon = getTypeIcon(type, question);
  const isUrl = typeof value === 'string' && (value.startsWith('http') || value.startsWith('www'));
  const isBool = type === 'BOOLEAN' || typeof value === 'boolean';
  const boolVal = value === true || value === 'true' || value === 'Sim';
  const isEmpty = formatted === null;

  const copyValue = () => {
    const text = Array.isArray(formatted) ? formatted.join(', ') : String(formatted);
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  return (
    <div className={cn(
      'group relative rounded-xl border p-4 transition-all duration-200',
      isEmpty
        ? 'bg-[#f4f4f4]/50 border-[#002443]/4 opacity-50'
        : 'bg-white border-[#002443]/6 hover:border-[#2bc196]/30 hover:shadow-sm'
    )}>
      {/* Question label */}
      <div className="flex items-start gap-2.5 mb-2">
        <div className={cn(
          'shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5',
          isEmpty ? 'bg-[#002443]/5' : 'bg-[#2bc196]/10'
        )}>
          <Icon className={cn('w-3.5 h-3.5', isEmpty ? 'text-[#002443]/30' : 'text-[#2bc196]')} />
        </div>
        <p className="text-xs text-[#002443]/55 font-medium leading-relaxed flex-1 pt-1">{question}</p>
        {!isEmpty && (
          <button
            onClick={copyValue}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-[#002443]/5 shrink-0"
            title="Copiar"
          >
            <Copy className="w-3 h-3 text-[#002443]/30" />
          </button>
        )}
      </div>

      {/* Value */}
      <div className="pl-9">
        {isEmpty ? (
          <span className="text-xs text-[#002443]/25 italic">Não informado</span>
        ) : isBool ? (
          <span className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold',
            boolVal ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
          )}>
            {boolVal ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
            {boolVal ? 'Sim' : 'Não'}
          </span>
        ) : Array.isArray(formatted) ? (
          <div className="flex flex-wrap gap-1.5">
            {formatted.map((item, i) => (
              <span key={i} className="inline-flex px-2.5 py-1 rounded-lg bg-[#002443]/5 text-xs font-medium text-[#002443]/80">
                {String(item)}
              </span>
            ))}
          </div>
        ) : isUrl ? (
          <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[#2bc196] hover:text-[#2bc196]/80 text-sm font-medium transition-colors break-all">
            <Globe className="w-3.5 h-3.5 shrink-0" />
            {value}
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        ) : typeof formatted === 'string' && formatted.startsWith('R$') ? (
          <span className="text-lg font-bold text-emerald-600 tracking-tight">{formatted}</span>
        ) : typeof formatted === 'string' && formatted.endsWith('%') ? (
          <span className="text-base font-bold text-blue-600">{formatted}</span>
        ) : (
          <p className="text-sm text-[#002443] font-semibold leading-relaxed">{formatted}</p>
        )}
      </div>
    </div>
  );
}