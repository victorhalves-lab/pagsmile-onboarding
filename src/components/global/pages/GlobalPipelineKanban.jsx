import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { toast } from 'sonner';
import { Building2, Mail, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

/**
 * Kanban com 5 colunas baseado em GlobalQuestionnaire.pipeline_status.
 * Drag-and-drop atualiza o status no backend imediatamente.
 */
const COLUMNS = [
  { id: 'leads',             label: 'Leads',             color: 'border-t-slate-400'   },
  { id: 'proposal_made',     label: 'Proposta Enviada',  color: 'border-t-blue-500'    },
  { id: 'proposal_accepted', label: 'Aceita',            color: 'border-t-[#1356E2]'   },
  { id: 'counter_proposal',  label: 'Contraproposta',    color: 'border-t-amber-500'   },
  { id: 'proposal_lost',     label: 'Perdida',           color: 'border-t-red-500'     },
];

export default function GlobalPipelineKanban() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['globalQuestionnaires'],
    queryFn: () => base44.entities.GlobalQuestionnaire.list('-created_date', 500),
    initialData: [],
  });

  const updateM = useMutation({
    mutationFn: ({ id, status }) => base44.entities.GlobalQuestionnaire.update(id, { pipeline_status: status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['globalQuestionnaires'] }),
    onError: () => toast.error('Erro ao mover'),
  });

  const grouped = useMemo(() => {
    const g = Object.fromEntries(COLUMNS.map(c => [c.id, []]));
    items.forEach(q => { (g[q.pipeline_status] || g.leads).push(q); });
    return g;
  }, [items]);

  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination || source.droppableId === destination.droppableId) return;
    updateM.mutate({ id: draggableId, status: destination.droppableId });
    toast.success('Movido!');
  };

  const fmt = v => `$${(Number(v) || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  if (isLoading) {
    return <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 shadow-sm p-10 text-center text-[#0A0A0A]/50">Carregando pipeline...</div>;
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="grid grid-cols-5 gap-3 overflow-x-auto pb-2">
        {COLUMNS.map(col => {
          const colItems = grouped[col.id] || [];
          const tpv = colItems.reduce((s, i) => s + (Number(i.monthly_tpv) || 0), 0);
          return (
            <Droppable key={col.id} droppableId={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`bg-[#f4f4f4]/50 rounded-2xl border-t-4 ${col.color} ${snapshot.isDraggingOver ? 'bg-[#1356E2]/10' : ''} min-w-[200px]`}
                >
                  <div className="px-3 py-2 border-b border-[#0A0A0A]/5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">{col.label}</h3>
                      <span className="text-[10px] font-bold text-[#0A0A0A]/50 bg-white px-2 py-0.5 rounded-full">{colItems.length}</span>
                    </div>
                    <div className="text-[10px] text-[#0A0A0A]/50 mt-0.5">TPV: {fmt(tpv)}</div>
                  </div>

                  <div className="p-2 space-y-2 min-h-[200px]">
                    {colItems.map((q, idx) => (
                      <Draggable key={q.id} draggableId={q.id} index={idx}>
                        {(prov, snap) => (
                          <div
                            ref={prov.innerRef}
                            {...prov.draggableProps}
                            {...prov.dragHandleProps}
                            className={`bg-white rounded-xl border border-[#0A0A0A]/5 p-3 shadow-sm cursor-grab ${snap.isDragging ? 'shadow-lg rotate-1' : ''}`}
                          >
                            <div className="flex items-start gap-2">
                              <Building2 className="w-3.5 h-3.5 text-[#1356E2] mt-0.5 flex-shrink-0" />
                              <div className="min-w-0 flex-1">
                                <div className="text-xs font-semibold text-[#0A0A0A] truncate">{q.company_name}</div>
                                <div className="text-[10px] text-[#0A0A0A]/50 truncate flex items-center gap-1 mt-0.5">
                                  <Mail className="w-2.5 h-2.5" /> {q.contact_email}
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#0A0A0A]/5">
                                  <span className="text-[10px] font-mono text-[#1356E2] flex items-center gap-1">
                                    <DollarSign className="w-2.5 h-2.5" />{fmt(q.monthly_tpv)}
                                  </span>
                                  <span className="text-[9px] text-[#0A0A0A]/40">
                                    {q.created_date ? format(new Date(q.created_date), 'dd/MM') : '—'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {colItems.length === 0 && (
                      <div className="text-center text-[10px] text-[#0A0A0A]/30 py-6">Vazio</div>
                    )}
                  </div>
                </div>
              )}
            </Droppable>
          );
        })}
      </div>
    </DragDropContext>
  );
}