import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  X, Plus, Loader2, Upload, Eye, Paintbrush, Shield, Link as LinkIcon
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const PAGSMILE_GREEN = '#2bc196';
const PAGSMILE_BLUE = '#002443';

export default function GenerateLinkModal({ merchant, onGenerate, onClose, isPending }) {
  const [mode, setMode] = useState(null); // null = choosing, 'pagsmile' | 'custom'
  // Pré-preenche com o nome do cliente (seller) — usuário pode editar se quiser.
  const [brandName, setBrandName] = useState(merchant?.fullName || merchant?.companyName || '');
  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [brandPrimaryColor, setBrandPrimaryColor] = useState(PAGSMILE_GREEN);
  const [brandSecondaryColor, setBrandSecondaryColor] = useState(PAGSMILE_BLUE);
  const [customSlug, setCustomSlug] = useState('');
  const [uploading, setUploading] = useState(false);
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

  const handleGenerate = () => {
    if (mode === 'custom') {
      onGenerate({ brandName, brandLogoUrl, brandPrimaryColor, brandSecondaryColor, customSlug: slugValue || undefined });
    } else {
      onGenerate(customSlug ? { customSlug: slugValue } : null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center">
              <Plus className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#002443]">Gerar Link de Subseller</h2>
              <p className="text-xs text-[#002443]/50">{merchant?.fullName || merchant?.companyName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Step 1: Choose mode */}
          {!mode && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[#002443]">Escolha o estilo do link:</p>
              
              <button
                onClick={() => setMode('pagsmile')}
                className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50/30 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2bc196] to-[#002443] flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#002443]">Padrão PagSmile</p>
                    <p className="text-xs text-[#002443]/50">Cores e logo PagSmile — sem personalização</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode('custom')}
                className="w-full p-4 border-2 border-slate-200 rounded-xl hover:border-purple-400 hover:bg-purple-50/30 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                    <Paintbrush className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#002443]">Personalizado (White-Label)</p>
                    <p className="text-xs text-[#002443]/50">Logo, cores e nome do cliente no questionário</p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Step 2a: Pagsmile confirm */}
          {mode === 'pagsmile' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2bc196] to-[#002443] flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#002443]">Estilo Padrão PagSmile</p>
                    <p className="text-xs text-[#002443]/50">O questionário usará as cores e logo padrão da PagSmile.</p>
                  </div>
                </div>
              </div>

              {/* Slug personalizado */}
              <div>
                <Label className="text-xs font-semibold text-[#002443]/70 flex items-center gap-1.5">
                  <LinkIcon className="w-3 h-3" /> URL curta personalizada (opcional)
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

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setMode(null)} className="flex-1">Voltar</Button>
                <Button onClick={handleGenerate} disabled={isPending} className="flex-1 bg-[#2bc196] text-white">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Gerar Link
                </Button>
              </div>
            </div>
          )}

          {/* Step 2b: Custom branding */}
          {mode === 'custom' && (
            <div className="space-y-4">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                <p className="text-xs font-bold text-purple-700 flex items-center gap-1.5">
                  <Paintbrush className="w-3.5 h-3.5" /> Identidade Visual do Cliente
                </p>
                <p className="text-[10px] text-purple-600/60 mt-0.5">O questionário exibirá o logo e cores do cliente.</p>
              </div>

              {/* Nome */}
              <div>
                <Label className="text-xs font-semibold text-[#002443]/70">Nome de exibição</Label>
                <Input
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  placeholder="Ex: Loja XYZ Pagamentos"
                  className="mt-1"
                />
              </div>

              {/* Logo */}
              <div>
                <Label className="text-xs font-semibold text-[#002443]/70">Logo do cliente</Label>
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
                      <label className="cursor-pointer flex items-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg hover:border-purple-400 transition-all text-sm text-[#002443]/60">
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        {uploading ? 'Enviando...' : 'Upload do logo'}
                        <input type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml,image/webp,.png,.jpg,.jpeg,.svg,.webp" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
                      </label>
                      <span className="text-[9px] text-[#002443]/30">PNG, SVG, JPG, WEBP</span>
                    </>
                  )}
                </div>
              </div>

              {/* Cores */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-[#002443]/70">Cor primária</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={brandPrimaryColor} onChange={e => setBrandPrimaryColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                    <Input value={brandPrimaryColor} onChange={e => setBrandPrimaryColor(e.target.value)} className="font-mono text-xs" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-[#002443]/70">Cor secundária</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="color" value={brandSecondaryColor} onChange={e => setBrandSecondaryColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0" />
                    <Input value={brandSecondaryColor} onChange={e => setBrandSecondaryColor(e.target.value)} className="font-mono text-xs" />
                  </div>
                </div>
              </div>

              {/* Slug personalizado */}
              <div>
                <Label className="text-xs font-semibold text-[#002443]/70 flex items-center gap-1.5">
                  <LinkIcon className="w-3 h-3" /> URL curta personalizada (opcional)
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
                  <p className="text-[10px] text-purple-600 mt-1">
                    URL: {window.location.origin}/s/{slugValue}
                  </p>
                )}
              </div>

              {/* Preview */}
              <button onClick={() => setShowPreview(!showPreview)} className="text-xs text-purple-600 font-semibold flex items-center gap-1 hover:underline">
                <Eye className="w-3 h-3" /> {showPreview ? 'Ocultar preview' : 'Ver preview'}
              </button>
              {showPreview && (
                <div className="border rounded-xl p-4 bg-white">
                  <div className="flex items-center justify-center gap-3 mb-3" style={{ borderBottom: `3px solid ${brandPrimaryColor}`, paddingBottom: 12 }}>
                    {brandLogoUrl ? (
                      <img src={brandLogoUrl} alt="Logo" className="h-8 max-w-[140px] object-contain" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: brandPrimaryColor }}>
                        {(brandName || 'C').charAt(0)}
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
              <div className="flex gap-2 pt-1">
                <Button variant="outline" onClick={() => setMode(null)} className="flex-1">Voltar</Button>
                <Button onClick={handleGenerate} disabled={isPending} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white">
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Gerar Link Personalizado
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}