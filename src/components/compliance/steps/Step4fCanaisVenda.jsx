import React from 'react';
import { ShoppingBag, Globe, Smartphone, MessageCircle, Link, Store, Phone, Plus } from 'lucide-react';
import FormSection from '../FormSection';
import SelectionButton from '../SelectionButton';

export default function Step4fCanaisVenda({ formData, handleChange }) {
  const canaisVendaOptions = [
    { value: 'site_proprio', label: 'Site Próprio', icon: <Globe className="w-5 h-5" /> },
    { value: 'app_mobile', label: 'Aplicativo Móvel', icon: <Smartphone className="w-5 h-5" /> },
    { value: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle className="w-5 h-5" /> },
    { value: 'link_pagamento', label: 'Link de Pagamento', icon: <Link className="w-5 h-5" /> },
    { value: 'loja_fisica', label: 'PDV / Loja Física', icon: <Store className="w-5 h-5" /> },
    { value: 'marketplace', label: 'Marketplace', icon: <ShoppingBag className="w-5 h-5" /> },
    { value: 'televendas', label: 'Televendas', icon: <Phone className="w-5 h-5" /> },
    { value: 'outro', label: 'Outro', icon: <Plus className="w-5 h-5" /> }
  ];

  return (
    <FormSection
      title="Canais de Venda"
      subtitle="Por onde você vende seus produtos/serviços?"
      icon={ShoppingBag}
    >
      <SelectionButton
        options={canaisVendaOptions}
        value={formData.canaisVenda}
        onChange={(val) => handleChange('canaisVenda', val)}
        isMulti={true}
        columns={2}
        helperText="Selecione todos que se aplicam"
      />
    </FormSection>
  );
}