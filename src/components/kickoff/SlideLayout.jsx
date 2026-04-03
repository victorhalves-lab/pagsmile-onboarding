import React from 'react';
import { motion } from 'framer-motion';

export default function SlideLayout({ slideNumber, totalSlides, children, variant = 'light', className = '' }) {
  const isDark = variant === 'dark';
  const isMid = variant === 'mid';

  const bgClass = isDark
    ? 'bg-[#002443]'
    : isMid
    ? 'bg-gradient-to-br from-[#002443] to-[#003a6b]'
    : 'bg-white';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={`relative w-full aspect-[16/9] ${bgClass} rounded-3xl overflow-hidden shadow-[0_8px_40px_rgba(0,36,67,0.12)] border border-[#002443]/[0.06] ${className}`}
      style={{ pageBreakAfter: 'always', pageBreakInside: 'avoid' }}
    >
      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#002443] via-[#2bc196] to-[#5cf7cf]" />

      {/* Decorative orbs */}
      {!isDark && !isMid && (
        <>
          <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#2bc196]/[0.06] to-transparent rounded-bl-full" />
          <div className="absolute bottom-10 left-0 w-32 h-32 bg-gradient-to-tr from-[#002443]/[0.04] to-transparent rounded-tr-full" />
        </>
      )}
      {(isDark || isMid) && (
        <>
          <div className="absolute top-[-10%] right-[-5%] w-[300px] h-[300px] bg-[#2bc196] rounded-full blur-[150px] opacity-[0.06]" />
          <div className="absolute bottom-[-10%] left-[-5%] w-[250px] h-[250px] bg-[#5cf7cf] rounded-full blur-[120px] opacity-[0.04]" />
        </>
      )}

      {/* Content */}
      <div className="absolute inset-0 pt-6 pb-12 px-10 flex flex-col">
        {children}
      </div>

      {/* Footer */}
      <div className={`absolute bottom-0 left-0 right-0 h-9 flex items-center justify-between px-10 ${isDark || isMid ? 'bg-white/[0.03]' : 'bg-[#002443]/[0.02]'} border-t ${isDark || isMid ? 'border-white/[0.06]' : 'border-[#002443]/[0.05]'}`}>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-gradient-to-br from-[#2bc196] to-[#002443] flex items-center justify-center">
            <span className="text-[6px] font-bold text-white">P</span>
          </div>
          <span className={`text-[8px] font-semibold tracking-wider uppercase ${isDark || isMid ? 'text-white/20' : 'text-[#002443]/25'}`}>Pagsmile</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[8px] tracking-wider ${isDark || isMid ? 'text-white/15' : 'text-[#002443]/15'}`}>CONFIDENCIAL</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalSlides }, (_, i) => (
              <div key={i} className={`w-1 h-1 rounded-full transition-all ${i + 1 === slideNumber ? 'bg-[#2bc196] w-3' : isDark || isMid ? 'bg-white/15' : 'bg-[#002443]/10'}`} />
            ))}
          </div>
          <span className={`text-[9px] font-mono font-medium ${isDark || isMid ? 'text-white/25' : 'text-[#002443]/25'}`}>{String(slideNumber).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Left accent */}
      <div className="absolute left-0 top-1.5 bottom-9 w-[3px] bg-gradient-to-b from-[#2bc196] via-[#2bc196]/30 to-transparent rounded-r" />
    </motion.div>
  );
}