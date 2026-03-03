import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, History, RotateCcw } from 'lucide-react';
import moment from 'moment';

export default function TemplateVersionHistory({ open, onClose, templateName, currentVersion, onRestore }) {
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['templateVersions', templateName],
    queryFn: async () => {
      const all = await base44.entities.QuestionnaireTemplate.filter({ name: templateName }, '-version');
      return all;
    },
    enabled: open && !!templateName
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-[var(--pagsmile-blue)]/60" />
            Histórico de Versões
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : versions.length <= 1 ? (
          <div className="text-center py-8">
            <History className="w-10 h-10 mx-auto text-[var(--pagsmile-blue)]/30 mb-2" />
            <p className="text-sm text-[var(--pagsmile-blue)]/60">Apenas a versão atual existe.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {versions.map(v => (
              <div key={v.id} className={`p-3 rounded-lg border ${v.version === currentVersion ? 'border-[var(--pagsmile-green)] bg-[var(--pagsmile-green)]/5' : v.isArchived ? 'border-slate-200 opacity-60' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[var(--pagsmile-blue)]">v{v.version}</span>
                      {v.version === currentVersion && <Badge className="bg-green-100 text-green-700 text-[10px]">Atual</Badge>}
                      {v.isArchived && <Badge variant="outline" className="text-[10px]">Arquivada</Badge>}
                    </div>
                    <p className="text-[10px] text-[var(--pagsmile-blue)]/50 mt-0.5">
                      {v.created_date ? moment(v.created_date).format('DD/MM/YY HH:mm') : '-'}
                    </p>
                  </div>
                  {v.isArchived && onRestore && (
                    <Button variant="outline" size="sm" onClick={() => onRestore(v)} className="text-xs">
                      <RotateCcw className="w-3 h-3 mr-1" /> Restaurar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}