import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Paintbrush, Upload, Loader2, Eye, X, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

export default function BrandingEditor({ link, onUpdate }) {
  const [brandName, setBrandName] = useState(link.brandName || '');
  const [brandLogoUrl, setBrandLogoUrl] = useState(link.brandLogoUrl || '');
  const [brandPrimaryColor, setBrandPrimaryColor] = useState(link.brandPrimaryColor || '#2bc196');
  const [brandSecondaryColor, setBrandSecondaryColor] = useState(link.brandSecondaryColor || '#002443');
  const [customSlug, setCustomSlug] = useState(link.customSlug || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const slugValue = customSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setBrandLogoUrl(file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.OnboardingLink.update(link.id, {
      brandName,
      brandLogoUrl,
      brandPrimaryColor,
      brandSecondaryColor,
      customSlug: slugValue || '',
    });
    setSaving(false);
    toast.success('Personalização salva com sucesso!');
    if (onUpdate) onUpdate();
  };

  const handleClear = async () => {
    setSaving(true);
    await base44.entities.OnboardingLink.update(link.id, {
      brandName: '',
      brandLogoUrl: '',
      brandPrimaryColor: '',
      brandSecondaryColor: '',
      customSlug: '',
    });
    setBrandName('');
    setBrandLogoUrl('');
    setBrandPrimaryColor('#2bc196');
    setBrandSecondaryColor('#002443');
    setCustomSlug('');
    setSaving(false);
    toast.success('Personalização removida — voltará ao padrão PagSmile.');
    if (onUpdate) onUpdate();
  };

  return (
    <div className="space-y-4">
      {/* URL curta personalizada */}
      <div>
        <Label className="text-xs font-semibold text-[#002443]/70 flex items-center gap-1.5">
          <LinkIcon className="w-3 h-3" /> URL curta personalizada
        </Label>
        <div className="flex items-center gap-0 mt-1">
          <span className="text-xs text-[#002443]/40 bg-slate-50 border border-r-0 border-slate-200 rounded-l-lg px-2 py-2 whitespace-nowrap">
            {window.location.origin}/s/
          </span>
          <Input
            value={customSlug}
            onChange={e => setCustomSlug(e.target.value)}
            placeholder="nome-do-cliente"
            className="rounded-l-none text-xs font-mono"
          />
        </div>
        {slugValue && (
          <p className="text-[10px] text-emerald-600 mt-1">
            URL: {window.location.origin}/s/{slugValue}
          </p>
        )}
      </div>

      {/* Nome */}
      <div>
        <Label className="text-xs font-semibold text-[#002443]/70">Nome do Cliente (exibido no questionário)</Label>
        <Input
          value={brandName}
          onChange={e => setBrandName(e.target.value)}
          placeholder="Ex: Loja XYZ Pagamentos"
          className="mt-1"
        />
      </div>

      {/* Logo */}
      <div>
        <Label className="text-xs font-semibold text-[#002443]/70">Logo do Cliente</Label>
        <div className="mt-1 flex items-center gap-3">
          {brandLogoUrl ? (
            <div className="relative">
              <img src={brandLogoUrl} alt="Logo" className="h-10 max-w-[160px] object-contain rounded border border-slate-200 p-1 bg-white" />
              <button onClick={() => setBrandLogoUrl('')} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <X className="w-2.5 h-2.5 text-white" />
              </button>
            </div>
          ) : (
            <>
              <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg hover:border-[#2bc196] transition-all text-sm text-[#002443]/60">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? 'Enviando...' : 'Upload do logo'}
                <input type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp,application/pdf,.png,.jpg,.jpeg,.svg,.webp,.pdf" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
              </label>
              <span className="text-[9px] text-[#002443]/30">PNG, SVG, JPG, WEBP ou PDF</span>
            </>
          )}
        </div>
      </div>

      {/* Cores */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs font-semibold text-[#002443]/70">Cor Primária (botões, header)</Label>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" value={brandPrimaryColor} onChange={e => setBrandPrimaryColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
            <Input value={brandPrimaryColor} onChange={e => setBrandPrimaryColor(e.target.value)} className="font-mono text-xs" />
          </div>
        </div>
        <div>
          <Label className="text-xs font-semibold text-[#002443]/70">Cor Secundária (textos, footer)</Label>
          <div className="flex items-center gap-2 mt-1">
            <input type="color" value={brandSecondaryColor} onChange={e => setBrandSecondaryColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
            <Input value={brandSecondaryColor} onChange={e => setBrandSecondaryColor(e.target.value)} className="font-mono text-xs" />
          </div>
        </div>
      </div>

      {/* Preview */}
      <button onClick={() => setShowPreview(!showPreview)} className="text-xs text-[#2bc196] font-semibold flex items-center gap-1 hover:underline">
        <Eye className="w-3 h-3" /> {showPreview ? 'Ocultar preview' : 'Ver preview'}
      </button>
      {showPreview && (
        <div className="border rounded-xl p-4 bg-white">
          <div className="flex items-center justify-center gap-3 mb-3" style={{ borderBottom: `3px solid ${brandPrimaryColor}`, paddingBottom: 12 }}>
            {brandLogoUrl ? (
              <img src={brandLogoUrl} alt="Logo" className="h-8 max-w-[140px] object-contain" />
            ) : (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: brandPrimaryColor }}>
                {(brandName || 'P').charAt(0)}
              </div>
            )}
            <span className="text-sm font-bold" style={{ color: brandSecondaryColor }}>
              {brandName || 'Nome do Cliente'}
            </span>
          </div>
          <div className="text-center text-xs" style={{ color: brandSecondaryColor }}>
            <p className="font-semibold">Cadastro de Subconta</p>
            <p className="opacity-60 mt-0.5">Questionário de compliance</p>
          </div>
          <div className="mt-3 flex justify-center">
            <div className="px-4 py-1.5 rounded-lg text-white text-xs font-bold" style={{ backgroundColor: brandPrimaryColor }}>
              Continuar
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <Button onClick={handleSave} disabled={saving} className="bg-[#2bc196] text-white text-xs">
          {saving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Paintbrush className="w-3 h-3 mr-1" />}
          Salvar Identidade Visual
        </Button>
        {(link.brandName || link.brandLogoUrl) && (
          <Button variant="outline" size="sm" onClick={handleClear} disabled={saving} className="text-xs text-red-500 border-red-200 hover:bg-red-50">
            Remover Branding
          </Button>
        )}
      </div>
    </div>
  );
}