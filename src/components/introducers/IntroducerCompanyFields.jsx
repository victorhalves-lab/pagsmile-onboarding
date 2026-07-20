import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { base44 } from '@/api/base44Client';
import { Upload, Image, Loader2, ExternalLink, Globe } from 'lucide-react';
import { toast } from 'sonner';

function nameToSlug(name) {
  return name
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export default function IntroducerCompanyFields({ form, setForm }) {
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/svg+xml', 'image/webp', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato inválido. Use PNG, SVG, WebP ou JPEG.');
      return;
    }

    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(p => ({ ...p, companyLogoUrl: file_url }));
    setUploading(false);
    toast.success('Logo enviado com sucesso!');
  };

  const handleCompanyNameChange = (name) => {
    const updates = { companyName: name };
    if (!form.uniqueLandingPageSlug || form.uniqueLandingPageSlug === nameToSlug(form.companyName || '')) {
      updates.uniqueLandingPageSlug = nameToSlug(name);
    }
    setForm(p => ({ ...p, ...updates }));
  };

  const appBaseUrl = window.location.origin;

  return (
    <div className="space-y-4 pt-2 border-t border-[#0A0A0A]/10">
      <p className="text-xs font-bold text-[#1356E2] uppercase tracking-wider">Dados da Empresa</p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-[#0A0A0A]/50">Nome da Empresa *</Label>
          <Input
            value={form.companyName || ''}
            onChange={e => handleCompanyNameChange(e.target.value)}
            placeholder="Nome Fantasia da Empresa"
            className="h-10 rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-[#0A0A0A]/50">CNPJ</Label>
          <Input
            value={form.cnpj || ''}
            onChange={e => setForm(p => ({ ...p, cnpj: e.target.value }))}
            placeholder="00.000.000/0001-00"
            className="h-10 rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-[#0A0A0A]/50">E-mail da Empresa</Label>
          <Input
            type="email"
            value={form.contactEmailCompany || ''}
            onChange={e => setForm(p => ({ ...p, contactEmailCompany: e.target.value }))}
            placeholder="contato@empresa.com"
            className="h-10 rounded-xl"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-[#0A0A0A]/50">Telefone da Empresa</Label>
          <Input
            value={form.contactPhoneCompany || ''}
            onChange={e => setForm(p => ({ ...p, contactPhoneCompany: e.target.value }))}
            placeholder="(11) 99999-9999"
            className="h-10 rounded-xl"
          />
        </div>
      </div>

      {/* Logo Upload */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-[#0A0A0A]/50">Logo da Empresa</Label>
        <div className="flex items-center gap-4">
          {form.companyLogoUrl ? (
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-[#1356E2]/30 bg-white flex items-center justify-center p-2">
              <img src={form.companyLogoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-xl border-2 border-dashed border-[#0A0A0A]/10 bg-[#f4f4f4] flex items-center justify-center">
              <Image className="w-6 h-6 text-[#0A0A0A]/20" />
            </div>
          )}
          <div className="flex-1">
            <label className="cursor-pointer">
              <input type="file" accept="image/png,image/svg+xml,image/webp,image/jpeg" onChange={handleLogoUpload} className="hidden" />
              <Button type="button" variant="outline" size="sm" className="rounded-xl" asChild>
                <span>
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  {uploading ? 'Enviando...' : 'Enviar Logo'}
                </span>
              </Button>
            </label>
            <p className="text-[10px] text-[#0A0A0A]/30 mt-1.5">
              Fundo branco ou transparente. PNG ou SVG. Mínimo 200×200px.
            </p>
          </div>
        </div>
      </div>

      {/* Landing Page Slug */}
      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-[#0A0A0A]/50">Slug da Landing Page *</Label>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#f4f4f4] rounded-l-xl px-3 h-10 border border-r-0 border-[#0A0A0A]/10">
            <Globe className="w-3.5 h-3.5 text-[#0A0A0A]/30 mr-1.5" />
            <span className="text-xs text-[#0A0A0A]/40">{appBaseUrl}/parceiro/</span>
          </div>
          <Input
            value={form.uniqueLandingPageSlug || ''}
            onChange={e => setForm(p => ({ ...p, uniqueLandingPageSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
            placeholder="nome-do-parceiro"
            className="h-10 rounded-l-none rounded-r-xl font-mono"
          />
        </div>
        {form.uniqueLandingPageSlug && (
          <p className="text-[10px] text-[#1356E2] flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            {appBaseUrl}/parceiro/{form.uniqueLandingPageSlug}
          </p>
        )}
      </div>

      {/* Landing Page Active */}
      <div className="flex items-center justify-between bg-[#f4f4f4] rounded-xl p-3">
        <div>
          <p className="text-xs font-bold text-[#0A0A0A]">Landing Page Ativa</p>
          <p className="text-[10px] text-[#0A0A0A]/40">Quando desativada, a página exibe "não disponível"</p>
        </div>
        <Switch
          checked={form.landingPageActive !== false}
          onCheckedChange={(v) => setForm(p => ({ ...p, landingPageActive: v }))}
        />
      </div>
    </div>
  );
}