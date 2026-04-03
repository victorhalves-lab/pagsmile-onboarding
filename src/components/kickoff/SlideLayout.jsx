import React from 'react';
import { motion } from 'framer-motion';

export default function SlideLayout({ slideNumber, totalSlides, children, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`relative w-full aspect-[16/9] bg-white rounded-3xl overflow-hidden shadow-[0_8px_40px_rgba(0,36,67,0.08)] border border-[#002443]/[0.04] ${className}`}
      style={{ pageBreakAfter: 'always', pageBreakInside: 'avoid' }}
    >
      {/* Top accent bar with glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#002443] via-[#2bc196] to-[#5cf7cf]" />
      <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-[#2bc196]/[0.03] to-transparent" />

      {/* Subtle corner ornaments */}
      <div className="absolute top-4 right-6 w-20 h-20 rounded-full bg-gradient-to-br from-[#2bc196]/[0.04] to-transparent" />
      <div className="absolute bottom-12 left-6 w-16 h-16 rounded-full bg-gradient-to-tr from-[#002443]/[0.03] to-transparent" />
      
      {/* Content */}
      <div className="absolute inset-0 pt-5 pb-11 px-10 flex flex-col">
        {children}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 h-9 flex items-center justify-between px-10 bg-gradient-to-r from-[#002443]/[0.02] via-transparent to-[#002443]/[0.02] border-t border-[#002443]/[0.04]">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-[#2bc196] to-[#002443] flex items-center justify-center">
            <span className="text-[6px] font-bold text-white">P</span>
          </div>
          <span className="text-[8px] text-[#002443]/25 font-semibold tracking-wider uppercase">Pagsmile</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[8px] text-[#002443]/20 tracking-wider">CONFIDENCIAL</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalSlides }, (_, i) => (
              <div key={i} className={`w-1 h-1 rounded-full transition-all ${i + 1 === slideNumber ? 'bg-[#2bc196] w-3' : 'bg-[#002443]/10'}`} />
            ))}
          </div>
          <span className="text-[9px] text-[#002443]/30 font-mono font-medium">{String(slideNumber).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Left accent line */}
      <div className="absolute left-0 top-1 bottom-9 w-[3px] bg-gradient-to-b from-[#2bc196] via-[#2bc196]/20 to-transparent rounded-r" />
    </motion.div>
  );
}