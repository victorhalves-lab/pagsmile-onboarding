import React from 'react';

export default function SlideLayout({ slideNumber, totalSlides, children, className = '' }) {
  return (
    <div className={`relative w-full aspect-[16/9] bg-white rounded-2xl overflow-hidden shadow-lg border border-[#002443]/5 ${className}`}
         style={{ pageBreakAfter: 'always', pageBreakInside: 'avoid' }}>
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#002443] via-[#2bc196] to-[#5cf7cf]" />
      
      {/* Content */}
      <div className="absolute inset-0 pt-4 pb-10 px-10 flex flex-col">
        {children}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 h-8 flex items-center justify-between px-10 bg-[#002443]/[0.03]">
        <img 
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png" 
          alt="Pagsmile" className="h-3.5 opacity-40 invert"
        />
        <span className="text-[9px] text-[#002443]/30 font-medium">{slideNumber} / {totalSlides}</span>
      </div>

      {/* Left accent */}
      <div className="absolute left-0 top-1.5 bottom-8 w-1 bg-gradient-to-b from-[#2bc196] to-[#002443]/10" />
    </div>
  );
}