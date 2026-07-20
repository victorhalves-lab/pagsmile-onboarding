import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Play, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_TEST_DATA = JSON.stringify({
  riskScore: 75,
  status: "Pendente",
  "merchant.type": "PJ",
  iaDecision: "Aprovado",
  validationsCompleted: true,
  bigDataCorpCompleted: true,
  cafCompleted: false
}, null, 2);

export default function RuleSimulatorModal({ open, onClose, rule }) {
  const [testData, setTestData] = useState(DEFAULT_TEST_DATA);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async () => {
    setLoading(true);
    setResult(null);
    let parsed;
    try { parsed = JSON.parse(testData); } catch { toast.error('JSON inválido'); setLoading(false); return; }

    const res = await base44.functions.invoke('simulateComplianceRule', { rule, testData: parsed });
    setResult(res.data);
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-600" />
            Simular Regra: {rule?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Dados de Teste (JSON)</Label>
            <Textarea
              value={testData}
              onChange={(e) => setTestData(e.target.value)}
              rows={8}
              className="font-mono text-xs"
              placeholder='{"riskScore": 75, "status": "Pendente"}'
            />
            <p className="text-[10px] text-[var(--pinbank-blue)]/50">
              Insira os dados simulados como JSON. Os campos devem corresponder aos campos usados nas condições da regra.
            </p>
          </div>

          <Button onClick={runSimulation} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            Executar Simulação
          </Button>

          {result && (
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                {result.matched ? (
                  <><CheckCircle2 className="w-5 h-5 text-green-600" /><span className="font-bold text-green-700">Regra ACIONADA</span></>
                ) : (
                  <><XCircle className="w-5 h-5 text-red-500" /><span className="font-bold text-red-600">Regra NÃO acionada</span></>
                )}
              </div>

              <div>
                <p className="text-xs font-medium text-[var(--pinbank-blue)]/70 mb-1">
                  Operador: <Badge variant="outline">{result.logicOperator}</Badge>
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-medium text-[var(--pinbank-blue)]/70">Condições:</p>
                {result.conditionResults?.map((c, i) => (
                  <div key={i} className={`text-xs p-2 rounded ${c.result ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {c.result ? '✅' : '❌'} {c.condition} (valor atual: {String(c.actualValue)})
                  </div>
                ))}
              </div>

              {result.actionsToExecute?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[var(--pinbank-blue)]/70">Ações que seriam executadas:</p>
                  {result.actionsToExecute.map((a, i) => (
                    <div key={i} className="text-xs p-2 rounded bg-blue-50 text-blue-700">
                      ⚡ {a}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}