import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';

export default function ExportButtons({ contentRef }) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2 text-xs">
        <Printer className="w-3 h-3" />
        Imprimir
      </Button>
    </div>
  );
}