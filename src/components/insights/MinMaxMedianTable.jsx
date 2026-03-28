import React from 'react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function MinMaxMedianTable({ title, rows, formatter }) {
  const fmt = formatter || ((v) => v);
  
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b bg-slate-50/80">
        <h3 className="text-sm font-bold text-[#002443]">{title}</h3>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs">Métrica</TableHead>
            <TableHead className="text-xs text-right">Mínimo</TableHead>
            <TableHead className="text-xs text-right">Mediana</TableHead>
            <TableHead className="text-xs text-right">Média</TableHead>
            <TableHead className="text-xs text-right">Máximo</TableHead>
            <TableHead className="text-xs text-right">Qtd</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i}>
              <TableCell className="text-xs font-medium">{row.label}</TableCell>
              <TableCell className="text-xs text-right font-mono">{fmt(row.stats.min)}</TableCell>
              <TableCell className="text-xs text-right font-mono font-semibold text-[#2bc196]">{fmt(row.stats.median)}</TableCell>
              <TableCell className="text-xs text-right font-mono">{fmt(row.stats.avg)}</TableCell>
              <TableCell className="text-xs text-right font-mono">{fmt(row.stats.max)}</TableCell>
              <TableCell className="text-xs text-right text-[#002443]/50">{row.stats.count}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}