import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Pencil, Calendar, Send, CheckCircle, XCircle, Clock, GitBranch } from 'lucide-react';
import moment from 'moment';

export default function PropostaRevisaoHeader({ proposta, statusConfig, onBack, onEdit, onMarkAsAccepted, isUpdatingStatus }) {
  const isRascunho = proposta.status === 'rascunho';
  const canEdit = ['rascunho', 'enviada', 'visualizada'].includes(proposta.status);

  return (
    <div className="bg-gradient-to-r from-[#002443] to-[#36706c] rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack} className="text-white/70 hover:text-white hover:bg-white/10">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-white">{proposta.codigo || 'Proposta'}</h1>
            <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
            {(proposta.version || 1) > 1 && (
              <span className="text-[10px] bg-[#2bc196]/20 text-[#5cf7cf] px-2 py-0.5 rounded-md font-bold">v{proposta.version}</span>
            )}
          </div>
          <p className="text-white/50 text-sm mt-1">
            {proposta.clienteNome || 'Sem cliente'} — Revisão interna
          </p>
        </div>
        <div className="flex items-center gap-2">
          {['enviada', 'visualizada'].includes(proposta.status) && onMarkAsAccepted && (
            <Button onClick={onMarkAsAccepted} disabled={isUpdatingStatus} className="bg-green-500 hover:bg-green-600 text-white gap-2 rounded-xl">
              <CheckCircle className="w-4 h-4" />
              {isUpdatingStatus ? 'Atualizando...' : 'Marcar como Aceita'}
            </Button>
          )}
          {canEdit && (
            <Button onClick={onEdit} className="bg-white/10 hover:bg-white/20 text-white gap-2 rounded-xl">
              {isRascunho ? <Pencil className="w-4 h-4" /> : <GitBranch className="w-4 h-4" />}
              {isRascunho ? 'Editar Proposta' : 'Nova Versão'}
            </Button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="flex flex-wrap gap-6 text-xs mt-4 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-white/40" />
          <span className="text-white/50">Criada:</span>
          <span className="font-semibold text-white">{moment(proposta.created_date).format('DD/MM/YYYY HH:mm')}</span>
        </div>
        {proposta.sentDate && (
          <div className="flex items-center gap-2">
            <Send className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-white/50">Enviada:</span>
            <span className="font-semibold text-white">{moment(proposta.sentDate).format('DD/MM/YYYY HH:mm')}</span>
          </div>
        )}
        {proposta.acceptedDate && (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-green-400" />
            <span className="text-white/50">Aceita:</span>
            <span className="font-semibold text-white">{moment(proposta.acceptedDate).format('DD/MM/YYYY HH:mm')}</span>
          </div>
        )}
        {proposta.rejectedDate && (
          <div className="flex items-center gap-2">
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-white/50">Recusada:</span>
            <span className="font-semibold text-white">{moment(proposta.rejectedDate).format('DD/MM/YYYY HH:mm')}</span>
          </div>
        )}
        {proposta.validUntil && (
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-white/50">Validade:</span>
            <span className="font-semibold text-white">{moment(proposta.validUntil).format('DD/MM/YYYY')}</span>
          </div>
        )}
      </div>
    </div>
  );
}