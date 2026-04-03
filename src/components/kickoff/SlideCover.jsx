import React from 'react';
import { motion } from 'framer-motion';

export default function SlideCover({ clientName, date, totalSlides }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="relative w-full aspect-[16/9] bg-[#002443] rounded-3xl overflow-hidden shadow-[0_12px_60px_rgba(0,36,67,0.25)]"
      style={{ pageBreakAfter: 'always' }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#2bc196] rounded-full blur-[180px] opacity-[0.07]" />
        <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] bg-[#5cf7cf] rounded-full blur-[150px] opacity-[0.05]" />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-[#2bc196] rounded-full blur-[120px] opacity-[0.04]" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />

      {/* Top accent with glow */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#2bc196] to-transparent" />
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-[#2bc196]/[0.06] to-transparent" />

      {/* Decorative elements */}
      <div className="absolute top-8 right-10 flex gap-1.5">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full border border-white/10" />
        ))}
      </div>
      <div className="absolute bottom-20 left-10 w-12 h-[1px] bg-gradient-to-r from-[#2bc196]/40 to-transparent" />

      <div className="relative h-full flex flex-col items-center justify-center text-center px-16">
        {/* Logo */}
        <motion.img
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983b65f017b96d5f695f9bb/cc0a80f40_Logo-modo-escuro.png"
          alt="Pagsmile" className="h-10 mb-10"
        />

        {/* Overline */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-[1px] bg-[#2bc196]/40" />
          <span className="text-[10px] text-[#2bc196]/60 font-semibold tracking-[0.3em] uppercase">Apresentação</span>
          <div className="w-8 h-[1px] bg-[#2bc196]/40" />
        </div>

        {/* Title */}
        <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">
          Kick-Off de <span className="text-[#2bc196]">Implementação</span>
        </h1>
        <div className="w-16 h-1 bg-gradient-to-r from-transparent via-[#2bc196] to-transparent rounded-full mb-8" />

        {/* Client name */}
        <div className="px-6 py-3 bg-white/[0.04] border border-white/[0.06] rounded-2xl backdrop-blur-sm mb-2">
          <p className="text-lg text-white font-bold tracking-wide">{clientName || 'Cliente'}</p>
        </div>
        <p className="text-xs text-white/30 font-medium">
          {date || new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
        </p>

        {/* Bottom badge */}
        <div className="absolute bottom-10 flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] border border-white/[0.06] rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-[#2bc196] animate-pulse" />
            <span className="text-[9px] text-white/30 font-semibold tracking-[0.15em] uppercase">Confidencial</span>
          </div>
          <div className="px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-full">
            <span className="text-[9px] text-white/30 font-mono">{totalSlides} slides</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}