import React from 'react';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/aec69033a_Logo-modo-claro.png";

export { LOGO_URL };

export const V = ({ value, placeholder = '[A DEFINIR]' }) => {
  if (value && String(value).trim()) {
    return <strong style={{ color: '#002443' }}>{value}</strong>;
  }
  return <span style={{ color: '#e53e3e', backgroundColor: '#fff5f5', padding: '0 4px', borderRadius: '3px', fontSize: '10px' }}>{placeholder}</span>;
};

export const Num = ({ value, prefix = 'R$ ', placeholder = '[A DEFINIR]' }) => {
  if (value !== null && value !== undefined && value !== '') {
    const formatted = typeof value === 'number' 
      ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : value;
    return <strong style={{ color: '#002443' }}>{prefix}{formatted}</strong>;
  }
  return <span style={{ color: '#e53e3e', backgroundColor: '#fff5f5', padding: '0 4px', borderRadius: '3px', fontSize: '10px' }}>{placeholder}</span>;
};

export const Pct = ({ value, placeholder = '[A DEFINIR]' }) => {
  if (value !== null && value !== undefined && value !== '') {
    const formatted = typeof value === 'number'
      ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : value;
    return <strong style={{ color: '#002443' }}>{formatted}%</strong>;
  }
  return <span style={{ color: '#e53e3e', backgroundColor: '#fff5f5', padding: '0 4px', borderRadius: '3px', fontSize: '10px' }}>{placeholder}</span>;
};

export const Check = ({ checked }) => checked ? '☑' : '☐';

export const SectionHeading = ({ children, level = 1 }) => {
  if (level === 1) {
    return (
      <div data-pdf-block="section-heading" style={{ borderTop: '3px solid #2bc196', paddingTop: '24px', marginTop: '40px', marginBottom: '16px' }}>
        <h2 style={{ 
          color: '#002443', fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', 
          letterSpacing: '1.5px', textAlign: 'center', margin: 0,
        }}>{children}</h2>
      </div>
    );
  }
  return (
    <h3 data-pdf-block="section-heading" style={{ 
      color: '#2bc196', fontSize: '11px', fontWeight: 700, marginBottom: '8px', marginTop: '20px',
      paddingBottom: '4px', borderBottom: '1px solid rgba(43,193,150,0.2)',
    }}>{children}</h3>
  );
};

export const ClauseTitle = ({ children }) => (
  <h3 data-pdf-block="clause-title" style={{
    color: '#002443', fontSize: '11px', fontWeight: 700, marginTop: '28px', marginBottom: '12px',
    paddingBottom: '6px', borderBottom: '2px solid rgba(43,193,150,0.2)', textTransform: 'uppercase', letterSpacing: '0.5px',
  }}>{children}</h3>
);

export const SubClauseTitle = ({ children }) => (
  <h4 data-pdf-block="subclause-title" style={{
    color: '#2bc196', fontSize: '11px', fontWeight: 700, marginTop: '20px', marginBottom: '8px',
  }}>{children}</h4>
);

export const P = ({ children, style = {} }) => (
  <p data-pdf-block="paragraph" style={{ 
    marginBottom: '10px', textAlign: 'justify', lineHeight: 1.75, color: '#002443', fontSize: '10.5px', ...style,
  }}>{children}</p>
);

export const BrandTable = ({ headers, rows, compact = false }) => (
  <table data-pdf-block="table" style={{ 
    width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: compact ? '9.5px' : '10.5px',
    border: '1px solid rgba(0,36,67,0.12)', borderRadius: '8px', overflow: 'hidden',
  }}>
    {headers && (
      <thead>
        <tr style={{ backgroundColor: '#002443', color: '#ffffff' }}>
          {headers.map((h, i) => (
            <th key={i} style={{ 
              padding: compact ? '6px 8px' : '10px 12px', textAlign: i === 0 ? 'left' : 'center',
              fontWeight: 600, fontSize: compact ? '9px' : '10px', textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>{h}</th>
          ))}
        </tr>
      </thead>
    )}
    <tbody>
      {rows.map((row, i) => (
        <tr key={i} style={{ borderBottom: '1px solid rgba(0,36,67,0.06)', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafb' }}>
          {row.map((cell, j) => (
            <td key={j} style={{ 
              padding: compact ? '6px 8px' : '10px 12px', textAlign: j === 0 ? 'left' : 'center',
              fontWeight: j === 0 ? 600 : 400, color: '#002443', borderRight: j < row.length - 1 ? '1px solid rgba(0,36,67,0.06)' : 'none',
            }}>{cell}</td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

export const KVTable = ({ items }) => (
  <table data-pdf-block="table" style={{ 
    width: '100%', borderCollapse: 'collapse', marginBottom: '20px', fontSize: '10.5px',
    border: '1px solid rgba(0,36,67,0.12)', borderRadius: '8px', overflow: 'hidden',
  }}>
    <tbody>
      {items.map(([label, value], i) => (
        <tr key={i} style={{ borderBottom: '1px solid rgba(0,36,67,0.06)', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f8fafb' }}>
          <td style={{ 
            padding: '10px 14px', fontWeight: 700, color: '#002443', width: '40%',
            backgroundColor: 'rgba(0,36,67,0.02)', borderRight: '2px solid #2bc196', verticalAlign: 'top',
          }}>{label}</td>
          <td style={{ padding: '10px 14px', color: '#002443' }}>{value}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

export const formatDate = (dateStr) => {
  if (!dateStr) return null;
  try { return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  catch { return dateStr; }
};