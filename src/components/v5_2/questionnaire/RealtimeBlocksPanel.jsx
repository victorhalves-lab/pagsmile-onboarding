// V5.2 — Painel que exibe os bloqueios em tempo real (Fase 5.6)
import React from 'react';
import { AlertOctagon, AlertTriangle } from 'lucide-react';
import { getMicrocopy } from '@/lib/v5_2/microcopy';

export default function RealtimeBlocksPanel({ soft = [], hard = [] }) {
  if (soft.length === 0 && hard.length === 0) return null;

  return (
    <div className="space-y-3">
      {hard.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertOctagon className="w-5 h-5 text-red-700" />
            <h4 className="font-semibold text-red-900 text-sm">
              {getMicrocopy('block_realtime.hard.title')}
            </h4>
          </div>
          <p className="text-xs text-red-700 mb-3">
            {getMicrocopy('block_realtime.hard.subtitle')}
          </p>
          <ul className="space-y-2">
            {hard.map((b) => (
              <li key={b.codigo} className="text-sm text-red-900 flex gap-2">
                <span className="font-mono text-[10px] px-1.5 py-0.5 bg-red-100 rounded shrink-0 h-fit mt-0.5">
                  {b.codigo}
                </span>
                <span>{b.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {soft.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-700" />
            <h4 className="font-semibold text-amber-900 text-sm">
              {getMicrocopy('block_realtime.soft.title')}
            </h4>
          </div>
          <p className="text-xs text-amber-700 mb-3">
            {getMicrocopy('block_realtime.soft.subtitle')}
          </p>
          <ul className="space-y-2">
            {soft.map((b) => (
              <li key={b.codigo} className="text-sm text-amber-900 flex gap-2">
                <span className="font-mono text-[10px] px-1.5 py-0.5 bg-amber-100 rounded shrink-0 h-fit mt-0.5">
                  {b.codigo}
                </span>
                <span>{b.message}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}