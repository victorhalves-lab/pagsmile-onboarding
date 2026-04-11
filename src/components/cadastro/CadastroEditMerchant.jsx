import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Save, X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const EDITABLE_FIELDS = [
  { key: 'fullName', label: 'Nome / Razão Social', type: 'text' },
  { key: 'companyName', label: 'Nome Fantasia', type: 'text', pjOnly: true },
  { key: 'email', label: 'E-mail', type: 'email' },
  { key: 'phone', label: 'Telefone', type: 'text' },
  { key: 'dateOfBirth', label: 'Data de Nascimento', type: 'date', pfOnly: true },
  { key: 'nationality', label: 'Nacionalidade', type: 'text', pfOnly: true },
  { key: 'motherName', label: 'Nome da Mãe', type: 'text', pfOnly: true },
];

export default function CadastroEditMerchant({ merchant, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fields = EDITABLE_FIELDS.filter(f => {
    if (f.pjOnly && merchant.type !== 'PJ') return false;
    if (f.pfOnly && merchant.type !== 'PF') return false;
    return true;
  });

  const startEdit = () => {
    const initial = {};
    fields.forEach(f => { initial[f.key] = merchant[f.key] || ''; });
    setForm(initial);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const changes = {};
    const oldValues = {};
    fields.forEach(f => {
      if (form[f.key] !== (merchant[f.key] || '')) {
        changes[f.key] = form[f.key];
        oldValues[f.key] = merchant[f.key] || '';
      }
    });

    if (Object.keys(changes).length === 0) {
      setEditing(false);
      setSaving(false);
      return;
    }

    await base44.entities.Merchant.update(merchant.id, changes);

    // Log the changes
    const user = await base44.auth.me();
    const changeDetails = Object.keys(changes).map(k => {
      const field = fields.find(f => f.key === k);
      return `${field?.label || k}: "${oldValues[k]}" → "${changes[k]}"`;
    });
    
    await base44.entities.AuditLog.create({
      entityName: 'Merchant',
      entityId: merchant.id,
      actionType: 'UPDATE',
      actionDescription: `Dados cadastrais editados: ${changeDetails.join('; ')}`,
      changedBy: user?.email || 'sistema',
      changeDate: new Date().toISOString(),
      details: { changes, oldValues },
    });

    toast.success('Dados atualizados com sucesso!');
    setEditing(false);
    setSaving(false);
    if (onSaved) onSaved();
  };

  if (!editing) {
    return (
      <Button variant="outline" size="sm" onClick={startEdit} className="gap-1.5">
        <Pencil className="w-3.5 h-3.5" /> Editar Dados
      </Button>
    );
  }

  return (
    <div className="bg-white rounded-xl border-2 border-[var(--pagsmile-green)]/30 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--pagsmile-blue)]">Editando Dados Cadastrais</h3>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => setEditing(false)} disabled={saving}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(f => (
          <div key={f.key}>
            <Label className="text-xs text-[var(--pagsmile-blue)]/60">{f.label}</Label>
            <Input
              type={f.type}
              value={form[f.key] || ''}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              className="mt-1"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={() => setEditing(false)} disabled={saving}>Cancelar</Button>
        <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1.5">
          <Save className="w-3.5 h-3.5" /> {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </div>
  );
}