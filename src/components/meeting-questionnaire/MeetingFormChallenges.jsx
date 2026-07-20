import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';

export default function MeetingFormChallenges({ form, updateField }) {
  return (
    <Card className="border-[#0A0A0A]/5">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="w-5 h-5 text-[#1356E2]" />
          Desafios e Oportunidades
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Principais Desafios com a Solução Atual</Label>
          <Textarea value={form.currentChallenges} onChange={e => updateField('currentChallenges', e.target.value)} placeholder="Quais são as dores do cliente com a solução atual?" rows={3} />
        </div>
        <div>
          <Label>Funcionalidades Críticas Necessárias</Label>
          <Textarea value={form.criticalFeatures} onChange={e => updateField('criticalFeatures', e.target.value)} placeholder="Quais funcionalidades são indispensáveis para o cliente?" rows={2} />
        </div>
        <div>
          <Label>Prazo para Implementação</Label>
          <Input value={form.implementationTimeline} onChange={e => updateField('implementationTimeline', e.target.value)} placeholder="Ex: Precisa estar operando em 30 dias" />
        </div>
        <div>
          <Label>Observações Adicionais</Label>
          <Textarea value={form.notes} onChange={e => updateField('notes', e.target.value)} placeholder="Anotações gerais da reunião..." rows={3} />
        </div>
      </CardContent>
    </Card>
  );
}