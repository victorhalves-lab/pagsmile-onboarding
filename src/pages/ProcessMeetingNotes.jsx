import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, Bot, Upload, FileText, Sparkles, CheckCircle2 } from 'lucide-react';

export default function ProcessMeetingNotes() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.txt') && !file.name.endsWith('.md') && !file.type.startsWith('text/')) {
      toast.error('Formato não suportado. Use arquivo .txt ou .md');
      return;
    }
    const content = await file.text();
    setText(content);
    toast.success(`Arquivo "${file.name}" carregado`);
  };

  const handleProcess = async () => {
    if (text.trim().length < 20) {
      toast.error('Forneça pelo menos algumas linhas de anotações');
      return;
    }
    setProcessing(true);
    setResult(null);
    try {
      const response = await base44.functions.invoke('processMeetingNotes', { text });
      setResult(response.data);
      toast.success(`IA extraiu ${response.data.extractedFields} campos do texto!`);
    } catch (err) {
      toast.error('Erro ao processar: ' + (err?.response?.data?.error || err.message));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0A0A0A] to-[#E84B1C] rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(createPageUrl('QuestionariosLeads'))} className="text-white/70 hover:text-white hover:bg-white/10">
            <ArrowLeft className="w-4 h-4 mr-1" /> Voltar
          </Button>
          <div className="p-3 rounded-xl bg-white/10">
            <Bot className="w-6 h-6 text-[#E84B1C]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Questionário com Robô</h1>
            <p className="text-sm text-white/60">Cole anotações ou transcrição de reunião e a IA preencherá o questionário</p>
          </div>
        </div>
      </div>

      {/* Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-[#1356E2]" />
            Anotações / Transcrição da Reunião
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Cole aqui as anotações da reunião, transcrição de áudio, ou qualquer texto com informações sobre o cliente...

Exemplo:
Reunião com João da empresa TechPay Ltda (CNPJ 12.345.678/0001-90). Eles processam cerca de R$ 2 milhões/mês em transações, com ticket médio de R$ 150. Usam gateway e precisam de PIX e cartão de crédito. Atualmente pagam MDR de 2.5% no crédito à vista..."
            className="min-h-[250px] text-sm"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <input type="file" accept=".txt,.md,text/*" className="hidden" onChange={handleFileUpload} />
                <Button variant="outline" size="sm" asChild>
                  <span><Upload className="w-4 h-4 mr-1" /> Upload arquivo .txt</span>
                </Button>
              </label>
              <span className="text-xs text-[var(--pinbank-blue)]/40">
                {text.length > 0 ? `${text.length} caracteres` : ''}
              </span>
            </div>
            <Button
              onClick={handleProcess}
              disabled={processing || text.trim().length < 20}
              className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white"
            >
              {processing ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Analisando com IA...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Processar com IA</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      {result && (
        <Card className="border-[#1356E2]/30 bg-[#1356E2]/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 className="w-6 h-6 text-[#1356E2]" />
              <div>
                <p className="font-semibold">Questionário criado com sucesso!</p>
                <p className="text-sm text-[var(--pinbank-blue)]/60">
                  Protocolo: <span className="font-mono text-[#1356E2]">{result.protocolo}</span> · {result.extractedFields} campos preenchidos pela IA
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => navigate(createPageUrl('QuestionarioReuniao') + `?id=${result.questionnaireId}`)}
                className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white"
              >
                <FileText className="w-4 h-4 mr-1" /> Revisar e Completar
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setText('');
                  setResult(null);
                }}
              >
                Processar Outro
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate(createPageUrl('QuestionariosLeads'))}
              >
                Voltar para Lista
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}