import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Save, CheckCircle, Settings2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

import SegmentRatesList from '@/components/segment-rates/SegmentRatesList';
import SegmentRateForm from '@/components/segment-rates/SegmentRateForm';
import SegmentRatePreview from '@/components/segment-rates/SegmentRatePreview';

export default function GerenciarTaxasPadrao() {
  const [activeId, setActiveId] = useState(null);
  const [editData, setEditData] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);
  const queryClient = useQueryClient();

  const { data: segments = [], isLoading } = useQuery({
    queryKey: ['segmentDefaultRates'],
    queryFn: () => base44.entities.SegmentDefaultRates.list('segmentName'),
  });

  // Set first segment as active on load
  useEffect(() => {
    if (segments.length > 0 && !activeId) {
      setActiveId(segments[0].id);
      setEditData({ ...segments[0] });
      setHasChanges(false);
    }
  }, [segments, activeId]);

  const handleSelect = (id) => {
    if (hasChanges) {
      const confirm = window.confirm('Você tem alterações não salvas. Deseja descartar?');
      if (!confirm) return;
    }
    setActiveId(id);
    const seg = segments.find(s => s.id === id);
    if (seg) {
      setEditData({ ...seg });
      setHasChanges(false);
    }
  };

  const handleChange = (newData) => {
    setEditData(newData);
    setHasChanges(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { id, created_date, updated_date, created_by, entity_name, app_id, created_by_id, is_sample, is_deleted, deleted_date, environment, ...cleanData } = editData;
      await base44.entities.SegmentDefaultRates.update(activeId, cleanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segmentDefaultRates'] });
      setHasChanges(false);
      toast.success('Taxas salvas com sucesso! A propagação automática para Introducers e Propostas Padrão será iniciada.');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#2bc196]" />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#2bc196]/10 rounded-xl">
              <Settings2 className="w-5 h-5 text-[#2bc196]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-[#002443]">Taxas Padrão por Segmento</h1>
              <p className="text-xs text-[#002443]/50">Edite as taxas base de cada segmento. As alterações serão propagadas automaticamente.</p>
            </div>
          </div>
        </div>

        {hasChanges && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">Alterações não salvas</span>
            </div>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="bg-[#2bc196] hover:bg-[#2bc196]/90 text-white gap-2 font-bold"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar e Propagar
            </Button>
          </div>
        )}

        {!hasChanges && editData && (
          <div className="flex items-center gap-1.5 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg">
            <CheckCircle className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Tudo salvo</span>
          </div>
        )}
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left — Segment List */}
        <div className="lg:col-span-3">
          <div className="bg-[#f4f4f4] rounded-xl p-3 sticky top-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#002443]/30 px-2 mb-2">
              {segments.length} segmentos
            </p>
            <SegmentRatesList
              segments={segments}
              activeId={activeId}
              onSelect={handleSelect}
            />
          </div>
        </div>

        {/* Center — Edit Form */}
        <div className="lg:col-span-5">
          {editData ? (
            <SegmentRateForm data={editData} onChange={handleChange} />
          ) : (
            <div className="flex items-center justify-center h-64 text-[#002443]/30 text-sm">
              Selecione um segmento para editar
            </div>
          )}
        </div>

        {/* Right — Preview */}
        <div className="lg:col-span-4">
          <div className="sticky top-4">
            {editData ? (
              <SegmentRatePreview data={editData} />
            ) : (
              <div className="flex items-center justify-center h-64 text-[#002443]/30 text-sm">
                Selecione um segmento para pré-visualizar
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}