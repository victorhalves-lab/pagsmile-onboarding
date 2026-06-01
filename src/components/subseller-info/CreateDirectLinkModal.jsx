import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Star, Loader2 } from 'lucide-react';

/**
 * Modal simplificado para criar link/cadastro DIRETO Pagsmile.
 * Não pede dados de "Gateway" — só nome/email do contato do cliente final (opcional)
 * e notas internas. O gateway_name é fixo: "Pagsmile Direto".
 */
export default function CreateDirectLinkModal({ open, onClose, onSubmit, isSubmitting, mode = 'link' }) {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setContactName('');
      setContactEmail('');
      setNotes('');
    }
  }, [open]);

  if (!open) return null;

  const isManual = mode === 'manual';
  const title = isManual ? 'Cadastrar manualmente' : 'Link Direto Pagsmile';
  const subtitle = isManual
    ? 'Você mesmo preenche os dados — sem precisar enviar link.'
    : 'Gera um link para o cliente final preencher (sem passar por Gateway).';
  const ctaLabel = isManual ? 'Abrir formulário' : 'Gerar link';

  const handleSubmit = () => {
    onSubmit({
      gateway_name: 'Pagsmile Direto',
      gateway_contact_name: contactName.trim(),
      gateway_contact_email: contactEmail.trim(),
      notes: notes.trim(),
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-[#002443]/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[520px] max-h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="px-6 py-4 border-b border-[#002443]/8 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#2bc196]/10 flex items-center justify-center flex-shrink-0">
              <Star className="w-4 h-4 text-[#2bc196]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[#002443] truncate">{title}</h2>
              <p className="text-[11px] text-[#002443]/50 truncate">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#002443]/40 hover:bg-[#002443]/5 hover:text-[#002443] transition-colors flex-shrink-0"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 min-h-0 space-y-3">
          <div className="bg-[#2bc196]/8 border border-[#2bc196]/20 rounded-xl px-3 py-2.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#2bc196] mb-0.5">
              Agrupado como
            </div>
            <div className="text-sm font-bold text-[#002443]">⭐ Pagsmile Direto</div>
          </div>

          <div>
            <Label className="text-xs font-semibold text-[#002443]">
              Nome do contato {isManual ? '(opcional)' : '(do cliente final)'}
            </Label>
            <Input
              autoFocus
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Ex: João Silva"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-[#002443]">
              Email do contato {isManual ? '(opcional)' : ''}
            </Label>
            <Input
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contato@cliente.com"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-[#002443]">Notas internas</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Opcional — só você verá."
              className="mt-1 h-20"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#002443]/8 bg-[#f4f4f4]/40 flex items-center justify-between gap-3 flex-shrink-0">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {isManual ? 'Abrindo...' : 'Criando...'}</>
            ) : (
              ctaLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}