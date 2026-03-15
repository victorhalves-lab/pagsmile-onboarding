import React, { useState, useEffect } from 'react';
import { CheckCircle, Save } from 'lucide-react';

export default function AutoSaveIndicator({ lastSaved }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!lastSaved) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, [lastSaved]);

  if (!visible || !lastSaved) return null;

  const time = lastSaved.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-center gap-1.5 text-xs text-[#2bc196] animate-in fade-in slide-in-from-top-2 duration-300">
      <CheckCircle className="w-3.5 h-3.5" />
      <span className="font-medium">Rascunho salvo às {time}</span>
    </div>
  );
}