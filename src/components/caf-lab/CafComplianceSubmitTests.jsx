import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Play, CheckCircle2, XCircle, ChevronDown, ChevronRight,
  Building2, User, Info, Search, Paperclip, Trash2, Plus
} from 'lucide-react';

/**
 * CafComplianceSubmitTests — testa o wrapper cafSubmitCompliance (PF & PJ)
 * usando os templateIds configurados nos secrets CAF_TEMPLATE_ID_PF / CAF_TEMPLATE_ID_PJ.
 *
 * Regras:
 *   • Docs de identidade (selfie, rg, cnh) → type SELFIE/FRONT/BACK
 *   • Outros docs (contrato social, comprovante de endereço, faturamento etc.) → type ATTACHMENTS
 */

function ResultBlock({ result }) {
  const [expanded, setExpanded] = useState(false);
  if (!result) return null;
  const { ok, duration, data, error, timestamp } = result;
  return (
    <div className="mt-3 text-xs">
      <div className="flex items-center gap-2 flex-wrap">
        <Badge className={ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
          {ok ? <><CheckCircle2 className="w-3 h-3 mr-1" /> OK</> : <><XCircle className="w-3 h-3 mr-1" /> FAIL</>}
        </Badge>
        <span className="text-slate-500">{duration}ms</span>
        <span className="text-slate-400 text-[10px]">{timestamp}</span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-auto flex items-center gap-1 text-slate-600 hover:text-slate-900"
        >
          {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          {expanded ? 'Ocultar' : 'Ver JSON'}
        </button>
      </div>
      {error && <p className="mt-2 text-red-600 text-xs">{error}</p>}
      {expanded && (
        <pre className="mt-2 p-3 bg-slate-900 text-slate-100 rounded-lg overflow-auto max-h-96 text-[10px] leading-relaxed">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}

const FILE_TYPES = ['ATTACHMENTS', 'SELFIE', 'FRONT', 'BACK', 'DOCUMENT'];

function FilesUploader({ files, onChange }) {
  const addFile = (f, type) => {
    const r = new FileReader();
    r.onloadend = () => {
      onChange([...files, { type, base64: r.result, filename: f.name, size: f.size }]);
    };
    r.readAsDataURL(f);
  };

  const removeFile = (idx) => {
    onChange(files.filter((_, i) => i !== idx));
  };

  const updateType = (idx, newType) => {
    onChange(files.map((f, i) => i === idx ? { ...f, type: newType } : f));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          type="file"
          accept="image/*,application/pdf"
          multiple
          onChange={(e) => {
            [...e.target.files].forEach(f => addFile(f, 'ATTACHMENTS'));
            e.target.value = '';
          }}
          className="h-9 text-xs"
        />
      </div>
      {files.length === 0 && (
        <p className="text-[10px] text-slate-400 italic">Nenhum arquivo selecionado. Clique acima pra adicionar (serão adicionados como ATTACHMENTS — mude o tipo se for selfie/documento de identidade).</p>
      )}
      {files.map((f, idx) => (
        <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-md">
          <Paperclip className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#0A0A0A] truncate font-medium">{f.filename}</p>
            <p className="text-[10px] text-slate-500">{Math.round(f.size / 1024)}KB</p>
          </div>
          <select
            value={f.type}
            onChange={(e) => updateType(idx, e.target.value)}
            className="text-[10px] font-bold px-2 py-1 border border-slate-300 rounded-md bg-white"
          >
            {FILE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => removeFile(idx)}
            className="h-6 w-6 text-red-500 hover:bg-red-50"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}

export default function CafComplianceSubmitTests() {
  const [pj, setPj] = useState({
    onboardingCaseId: '',
    cnpj: '',
    files: [],
  });
  const [pf, setPf] = useState({
    onboardingCaseId: '',
    cpf: '',
    name: '',
    birthDate: '',
    motherName: '',
    files: [],
  });
  const [results, setResults] = useState({});
  const [loadingId, setLoadingId] = useState(null);

  const runTest = async (id, fn, successCheck = () => true) => {
    setLoadingId(id);
    const start = Date.now();
    try {
      const res = await fn();
      const duration = Date.now() - start;
      const data = res?.data || res;
      const ok = !data?.error && successCheck(data);
      setResults((prev) => ({
        ...prev,
        [id]: {
          ok, duration, data, error: data?.error || null,
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [id]: {
          ok: false, duration: Date.now() - start, data: null,
          error: err.message, timestamp: new Date().toLocaleTimeString(),
        },
      }));
    } finally {
      setLoadingId(null);
    }
  };

  const fetchTxResult = (txId) => runTest(`get_${txId}`,
    () => base44.functions.invoke('cafConnectGetTransaction', {
      transactionId: txId,
      includeCroppedImages: true,
    }),
    (d) => d?.success === true
  );

  return (
    <div className="space-y-4">
      {/* Info banner */}
      <Card className="p-4 bg-emerald-50 border-emerald-200">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 space-y-1">
            <p className="font-bold">cafSubmitCompliance — wrapper PF/PJ (produção)</p>
            <p className="opacity-80">
              Usa os templateIds dos secrets <code className="bg-white/70 px-1 rounded">CAF_TEMPLATE_ID_PF</code> e{' '}
              <code className="bg-white/70 px-1 rounded">CAF_TEMPLATE_ID_PJ</code>.
            </p>
            <ul className="list-disc list-inside opacity-80 mt-1">
              <li><strong>PJ</strong> → todos os questionários de compliance PJ (9 segmentos v4 + 3 PIX)</li>
              <li><strong>PF</strong> → subsellers PF</li>
              <li>Docs de identidade: type <code>SELFIE</code>/<code>FRONT</code>/<code>BACK</code></li>
              <li>Outros (contrato social, comprovante endereço, faturamento): type <code>ATTACHMENTS</code></li>
            </ul>
          </div>
        </div>
      </Card>

      {/* ───── PJ ───── */}
      <Card className="p-4 border-[#0A0A0A]/30">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-[#0A0A0A]" />
          <h4 className="text-sm font-bold text-[#0A0A0A]">Compliance PJ (templateId_PJ)</h4>
          <Badge className="bg-[#0A0A0A] text-white text-[9px]">COMPLIANCE PJ</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">OnboardingCase ID</Label>
            <Input
              value={pj.onboardingCaseId}
              onChange={(e) => setPj({ ...pj, onboardingCaseId: e.target.value })}
              placeholder="69e65d61f5e31d7556f62ebc"
              className="h-9 text-sm font-mono"
            />
          </div>
          <div>
            <Label className="text-xs">CNPJ</Label>
            <Input
              value={pj.cnpj}
              onChange={(e) => setPj({ ...pj, cnpj: e.target.value })}
              placeholder="00000000000000"
              className="h-9 text-sm font-mono"
            />
          </div>
        </div>

        <div className="mt-3">
          <Label className="text-xs mb-1 block">Documentos (contrato social, comprov. endereço, faturamento...)</Label>
          <FilesUploader files={pj.files} onChange={(files) => setPj({ ...pj, files })} />
        </div>

        <div className="flex justify-end mt-4">
          <Button
            onClick={() => runTest('pj',
              () => base44.functions.invoke('cafSubmitCompliance', {
                onboardingCaseId: pj.onboardingCaseId,
                personType: 'PJ',
                attributes: pj.cnpj ? { cnpj: pj.cnpj.replace(/\D/g, '') } : {},
                files: pj.files,
              }),
              (d) => d?.success === true
            )}
            disabled={loadingId === 'pj' || !pj.onboardingCaseId || !pj.cnpj}
            size="sm"
            className="bg-[#0A0A0A] hover:bg-[#0A0A0A]/90 text-white"
          >
            {loadingId === 'pj' ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Enviando PJ...</>
            ) : (
              <><Play className="w-3.5 h-3.5 mr-1.5" /> Submeter Compliance PJ</>
            )}
          </Button>
        </div>
        {(!pj.onboardingCaseId || !pj.cnpj) && (
          <p className="text-[10px] text-amber-700 mt-2">⚠ Preencha onboardingCaseId + CNPJ</p>
        )}
        <ResultBlock result={results.pj} />

        {results.pj?.data?.transactionId && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <p className="text-xs font-semibold text-[#0A0A0A]">
              ✅ TX PJ: <code className="font-mono bg-slate-100 px-1">{results.pj.data.transactionId}</code>
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchTxResult(results.pj.data.transactionId)}
              disabled={loadingId === `get_${results.pj.data.transactionId}`}
              className="mt-1"
            >
              <Search className="w-3.5 h-3.5 mr-1.5" /> Buscar resultado
            </Button>
            <ResultBlock result={results[`get_${results.pj.data.transactionId}`]} />
          </div>
        )}
      </Card>

      {/* ───── PF ───── */}
      <Card className="p-4 border-[#1356E2]/30">
        <div className="flex items-center gap-2 mb-3">
          <User className="w-4 h-4 text-[#1356E2]" />
          <h4 className="text-sm font-bold text-[#0A0A0A]">Compliance PF — Subseller (templateId_PF)</h4>
          <Badge className="bg-[#1356E2] text-white text-[9px]">SUBSELLER PF</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">OnboardingCase ID (do subseller)</Label>
            <Input
              value={pf.onboardingCaseId}
              onChange={(e) => setPf({ ...pf, onboardingCaseId: e.target.value })}
              placeholder="69e65d61f5e31d7556f62ebc"
              className="h-9 text-sm font-mono"
            />
          </div>
          <div>
            <Label className="text-xs">CPF</Label>
            <Input
              value={pf.cpf}
              onChange={(e) => setPf({ ...pf, cpf: e.target.value })}
              placeholder="12345678909"
              className="h-9 text-sm font-mono"
            />
          </div>
          <div>
            <Label className="text-xs">Nome completo</Label>
            <Input
              value={pf.name}
              onChange={(e) => setPf({ ...pf, name: e.target.value })}
              placeholder="João da Silva"
              className="h-9 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Data de nascimento (DD/MM/YYYY)</Label>
            <Input
              value={pf.birthDate}
              onChange={(e) => setPf({ ...pf, birthDate: e.target.value })}
              placeholder="01/01/1990"
              className="h-9 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Nome da mãe</Label>
            <Input
              value={pf.motherName}
              onChange={(e) => setPf({ ...pf, motherName: e.target.value })}
              placeholder="Maria da Silva"
              className="h-9 text-sm"
            />
          </div>
        </div>

        <div className="mt-3">
          <Label className="text-xs mb-1 block">Documentos (selfie, RG/CNH frente/verso, comprovantes...)</Label>
          <FilesUploader files={pf.files} onChange={(files) => setPf({ ...pf, files })} />
        </div>

        <div className="flex justify-end mt-4">
          <Button
            onClick={() => runTest('pf',
              () => base44.functions.invoke('cafSubmitCompliance', {
                onboardingCaseId: pf.onboardingCaseId,
                personType: 'PF',
                attributes: {
                  ...(pf.cpf ? { cpf: pf.cpf.replace(/\D/g, '') } : {}),
                  ...(pf.name ? { name: pf.name } : {}),
                  ...(pf.birthDate ? { birthDate: pf.birthDate } : {}),
                  ...(pf.motherName ? { motherName: pf.motherName } : {}),
                },
                files: pf.files,
              }),
              (d) => d?.success === true
            )}
            disabled={loadingId === 'pf' || !pf.onboardingCaseId || !pf.cpf}
            size="sm"
            className="bg-[#1356E2] hover:bg-[#1356E2]/90 text-white"
          >
            {loadingId === 'pf' ? (
              <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Enviando PF...</>
            ) : (
              <><Play className="w-3.5 h-3.5 mr-1.5" /> Submeter Compliance PF</>
            )}
          </Button>
        </div>
        {(!pf.onboardingCaseId || !pf.cpf) && (
          <p className="text-[10px] text-amber-700 mt-2">⚠ Preencha onboardingCaseId + CPF</p>
        )}
        <ResultBlock result={results.pf} />

        {results.pf?.data?.transactionId && (
          <div className="mt-3 pt-3 border-t border-slate-200">
            <p className="text-xs font-semibold text-[#0A0A0A]">
              ✅ TX PF: <code className="font-mono bg-slate-100 px-1">{results.pf.data.transactionId}</code>
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchTxResult(results.pf.data.transactionId)}
              disabled={loadingId === `get_${results.pf.data.transactionId}`}
              className="mt-1"
            >
              <Search className="w-3.5 h-3.5 mr-1.5" /> Buscar resultado
            </Button>
            <ResultBlock result={results[`get_${results.pf.data.transactionId}`]} />
          </div>
        )}
      </Card>
    </div>
  );
}