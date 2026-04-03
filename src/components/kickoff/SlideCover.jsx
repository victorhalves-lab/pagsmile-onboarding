import React from 'react';

export default function SlideCover({ clientName, date, totalSlides }) {
  return (
    <div className="relative w-full aspect-[16/9] bg-[#002443] rounded-2xl overflow-hidden shadow-lg"
         style={{ pageBreakAfter: 'always' }}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#2bc196] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#5cf7cf] rounded-full blur-[100px]" />
      </div>

      {/* Top accent */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#2bc196] via-[#5cf7cf] to-[#2bc196]" />

      <div className="relative h-full flex flex-col items-center justify-center text-center px-12">
        {/* Logo */}
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png"
          alt="Pagsmile" className="h-10 mb-8"
        />

        {/* Title */}
        <h1 className="text-3xl font-bold text-white mb-2">Kick-Off de Implementação</h1>
        <div className="w-20 h-1 bg-[#2bc196] rounded-full mb-6" />

        {/* Client */}
        <p className="text-lg text-[#2bc196] font-semibold mb-1">{clientName || 'Cliente'}</p>
        <p className="text-sm text-white/50">{date || new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>

        {/* Badge */}
        <div className="absolute bottom-12 flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
          <div className="w-2 h-2 rounded-full bg-[#2bc196]" />
          <span className="text-[10px] text-white/40 font-medium tracking-wider uppercase">Confidencial • {totalSlides} slides</span>
        </div>
      </div>
    </div>
  );
}