import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, FileText, Database, Server, FileEdit } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

const Section = ({ title, icon: Icon, children }) => (
  <div>
    <h4 className="text-xs uppercase tracking-wider text-[#0A0A0A]/60 font-bold mb-2 flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {title}
    </h4>
    {children}
  </div>
);

export default function ChangelogDetailModal({ entry, onClose, categoryConfig, severityConfig }) {
  const cat = categoryConfig[entry.category] || categoryConfig.FEATURE;
  const sev = severityConfig[entry.severity] || severityConfig.MEDIUM;
  const Icon = cat.icon;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${cat.color}`}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-lg">{entry.title}</DialogTitle>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge className={cat.color}>{cat.label}</Badge>
                <Badge className={sev.color}>{sev.label}</Badge>
                {entry.breakingChanges && <Badge className="bg-red-100 text-red-700"><AlertTriangle className="w-3 h-3 mr-1" />Breaking Change</Badge>}
                <span className="text-xs text-[#0A0A0A]/50">{format(new Date(entry.implementedAt || entry.created_date), 'dd/MM/yyyy HH:mm')}</span>
                {entry.implementedBy && <span className="text-xs text-[#0A0A0A]/50">· {entry.implementedBy}</span>}
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 mt-2">
          {entry.userRequest && (
            <Section title="Pedido Original do Usuário">
              <div className="bg-slate-50 border-l-4 border-[#1356E2] p-3 rounded text-sm italic text-[#0A0A0A]/80">
                "{entry.userRequest}"
              </div>
            </Section>
          )}

          <Section title="Resumo Executivo">
            <p className="text-sm text-[#0A0A0A]/80 whitespace-pre-wrap">{entry.summary}</p>
          </Section>

          {entry.businessImpact && (
            <Section title="Impacto de Negócio">
              <p className="text-sm text-[#0A0A0A]/80 whitespace-pre-wrap">{entry.businessImpact}</p>
            </Section>
          )}

          {entry.technicalDetails && (
            <Section title="Detalhes Técnicos">
              <div className="prose prose-sm max-w-none text-[#0A0A0A]/80">
                <ReactMarkdown>{entry.technicalDetails}</ReactMarkdown>
              </div>
            </Section>
          )}

          {entry.filesChanged?.length > 0 && (
            <Section title={`Arquivos Modificados (${entry.filesChanged.length})`} icon={FileEdit}>
              <div className="space-y-1">
                {entry.filesChanged.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs bg-slate-50 px-3 py-2 rounded">
                    <Badge variant="outline" className={
                      f.action === 'created' ? 'border-emerald-300 text-emerald-700' :
                      f.action === 'deleted' ? 'border-red-300 text-red-700' : 'border-blue-300 text-blue-700'
                    }>{f.action}</Badge>
                    <code className="font-mono">{f.path}</code>
                    {f.description && <span className="text-[#0A0A0A]/60">— {f.description}</span>}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {(entry.entitiesAffected?.length > 0 || entry.functionsAffected?.length > 0 || entry.pagesAffected?.length > 0) && (
            <div className="grid md:grid-cols-3 gap-4">
              {entry.entitiesAffected?.length > 0 && (
                <Section title="Entidades" icon={Database}>
                  <div className="flex flex-wrap gap-1">{entry.entitiesAffected.map(e => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}</div>
                </Section>
              )}
              {entry.functionsAffected?.length > 0 && (
                <Section title="Functions" icon={Server}>
                  <div className="flex flex-wrap gap-1">{entry.functionsAffected.map(f => <Badge key={f} variant="outline" className="text-xs">{f}</Badge>)}</div>
                </Section>
              )}
              {entry.pagesAffected?.length > 0 && (
                <Section title="Páginas" icon={FileText}>
                  <div className="flex flex-wrap gap-1">{entry.pagesAffected.map(p => <Badge key={p} variant="outline" className="text-xs">{p}</Badge>)}</div>
                </Section>
              )}
            </div>
          )}

          {entry.testingNotes && (
            <Section title="Como Testar">
              <p className="text-sm text-[#0A0A0A]/80 whitespace-pre-wrap bg-emerald-50 p-3 rounded border border-emerald-200">{entry.testingNotes}</p>
            </Section>
          )}

          {entry.rollbackInstructions && (
            <Section title="Como Reverter">
              <p className="text-sm text-[#0A0A0A]/80 whitespace-pre-wrap bg-amber-50 p-3 rounded border border-amber-200">{entry.rollbackInstructions}</p>
            </Section>
          )}

          {entry.tags?.length > 0 && (
            <Section title="Tags">
              <div className="flex flex-wrap gap-1">{entry.tags.map(t => <span key={t} className="px-2 py-0.5 bg-slate-100 rounded text-xs">{t}</span>)}</div>
            </Section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}