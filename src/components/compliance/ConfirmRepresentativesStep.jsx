import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  UserCheck, UserX, Plus, Trash2, Info, AlertTriangle,
  CheckCircle2, ArrowRight, ArrowLeft, FileText, ShieldCheck
} from 'lucide-react';
import { logSubsellerError } from '@/lib/subsellerErrorLogger';

/**
 * ConfirmRepresentativesStep — tela intermediária entre questionário e upload.
 *
 * Por quê?
 * Hoje o cliente termina o questionário e vai direto pra tela de docs, onde
 * descobre que precisa enviar 3 RGs sem entender de onde vieram. Esta tela
 * resolve isso: mostra cada representante com a fonte (QSA / declarado),
 * deixa o cliente marcar inativos (não exige RG deles) e adicionar quem faltou.
 *
 * Props:
 *   - representatives: lista pré-detectada (vinda de getRepresentativesFromStorage + bdcSocios)
 *   - onConfirm: (confirmedList) => void  // só os ATIVOS vão pro upload
 *   - onBack: () => void
 *   - hasBranding?: boolean
 */
export default function ConfirmRepresentativesStep({
  representatives = [],
  onConfirm,
  onBack,
  hasBranding = false,
}) {
  // Normaliza cada rep com defaults
  const [reps, setReps] = useState(() => representatives.map((r, idx) => ({
    id: r.id || `rep_${idx}`,
    nome: r.nome || '',
    cpf: r.cpf || '',
    cargo: r.cargo || '',
    source: r.source || 'declared',  // 'principal_declared' | 'bdc_qsa' | 'declared' | 'manual'
    status: r.status || 'active',
    ...r,
  })));

  // Log de entrada — quantos chegaram pra confirmação
  useEffect(() => {
    if (representatives.length > 0) {
      logSubsellerError({
        stage: 'confirm_representatives_shown',
        message: `Cliente vendo ${representatives.length} representantes para confirmar`,
        context: {
          repsCount: representatives.length,
          sources: representatives.map(r => r.source || 'unknown'),
        },
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeCount = reps.filter(r => r.status === 'active').length;
  const inactiveCount = reps.filter(r => r.status === 'inactive').length;

  const formatCpf = (val) => {
    const d = (val || '').replace(/\D/g, '').slice(0, 11);
    return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  };

  const maskCpf = (val) => {
    const d = (val || '').replace(/\D/g, '');
    if (d.length !== 11) return formatCpf(val);
    return `${d.slice(0, 3)}.***.***-${d.slice(9)}`;
  };

  const toggleStatus = (id) => {
    setReps(prev => prev.map(r =>
      r.id === id ? { ...r, status: r.status === 'active' ? 'inactive' : 'active' } : r
    ));
  };

  const updateRep = (id, field, val) => {
    setReps(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const addManualRep = () => {
    setReps(prev => [...prev, {
      id: `manual_${Date.now()}`,
      nome: '',
      cpf: '',
      cargo: '',
      source: 'manual',
      status: 'active',
    }]);
  };

  const removeManualRep = (id) => {
    setReps(prev => prev.filter(r => r.id !== id));
  };

  const canConfirm = useMemo(() => {
    if (activeCount === 0) return false;
    // Todos os ATIVOS precisam ter nome + CPF válidos
    return reps.filter(r => r.status === 'active').every(r =>
      (r.nome || '').trim().length >= 3 && (r.cpf || '').replace(/\D/g, '').length === 11
    );
  }, [reps, activeCount]);

  const handleConfirm = () => {
    if (!canConfirm) return;
    // Loga decisões importantes para auditoria de compliance
    if (inactiveCount > 0) {
      logSubsellerError({
        stage: 'representatives_dispensed',
        message: `Cliente dispensou ${inactiveCount} representante(s) como inativos`,
        context: {
          activeCount,
          inactiveCount,
          dispensados: reps.filter(r => r.status === 'inactive').map(r => ({
            nome: r.nome,
            cpfMasked: maskCpf(r.cpf),
            source: r.source,
          })),
        },
      });
    }
    onConfirm(reps);
  };

  const sourceBadge = (source) => {
    if (source === 'principal_declared') {
      return { icon: ShieldCheck, label: 'Você informou no questionário', color: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
    if (source === 'bdc_qsa') {
      return { icon: FileText, label: 'QSA da Receita Federal', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
    if (source === 'manual') {
      return { icon: Plus, label: 'Adicionado por você', color: 'bg-purple-100 text-purple-800 border-purple-200' };
    }
    return { icon: FileText, label: 'Declarado', color: 'bg-slate-100 text-slate-700 border-slate-200' };
  };

  return (
    <div className="max-w-3xl mx-auto px-4">
      {/* Cabeçalho */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-blue-50 mb-3">
          <UserCheck className="w-7 h-7 text-blue-600" />
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-[#002443] mb-2">
          Confirme os representantes legais
        </h1>
        <p className="text-sm text-[#002443]/70 leading-relaxed max-w-xl mx-auto">
          Identificamos os seguintes representantes da empresa. Para cada um <strong>ativo</strong>,
          vamos pedir um documento de identidade. Se alguém não é mais sócio, marque como inativo.
        </p>
      </div>

      {/* Cards de representantes */}
      <div className="space-y-3 mb-6">
        {reps.length === 0 && (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-sm text-[#002443]/60 mb-3">Nenhum representante identificado.</p>
            <Button onClick={addManualRep} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1.5" />
              Adicionar representante
            </Button>
          </div>
        )}

        {reps.map((rep) => {
          const isActive = rep.status === 'active';
          const isManual = rep.source === 'manual';
          const badge = sourceBadge(rep.source);
          const BadgeIcon = badge.icon;
          const cpfValid = (rep.cpf || '').replace(/\D/g, '').length === 11;
          const nameValid = (rep.nome || '').trim().length >= 3;

          return (
            <div
              key={rep.id}
              className={`rounded-xl border-2 p-4 transition-all ${
                isActive
                  ? 'bg-white border-emerald-200'
                  : 'bg-slate-50 border-slate-200 opacity-70'
              }`}
            >
              {/* Linha 1: Badge de fonte + status */}
              <div className="flex items-start justify-between gap-2 mb-3 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badge.color}`}>
                  <BadgeIcon className="w-3 h-3" />
                  {badge.label}
                </span>
                {!isActive && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                    <UserX className="w-3 h-3" />
                    Dispensado
                  </span>
                )}
              </div>

              {/* Linha 2: Nome + CPF (editáveis se manual ou inválidos) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <div>
                  <Label className="text-xs text-[#002443]/70 mb-1 block">
                    Nome completo {isActive && <span className="text-red-500">*</span>}
                  </Label>
                  {(isManual || !nameValid) && isActive ? (
                    <Input
                      value={rep.nome}
                      onChange={(e) => updateRep(rep.id, 'nome', e.target.value)}
                      placeholder="Nome do representante"
                      className="h-10 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-semibold text-[#002443] py-2 break-words">
                      {rep.nome || <span className="italic text-[#002443]/40">Não informado</span>}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-[#002443]/70 mb-1 block">
                    CPF {isActive && <span className="text-red-500">*</span>}
                  </Label>
                  {(isManual || !cpfValid) && isActive ? (
                    <Input
                      value={formatCpf(rep.cpf)}
                      onChange={(e) => updateRep(rep.id, 'cpf', e.target.value.replace(/\D/g, ''))}
                      placeholder="000.000.000-00"
                      className="h-10 text-sm"
                    />
                  ) : (
                    <p className="text-sm font-mono text-[#002443] py-2">
                      {isActive ? formatCpf(rep.cpf) : maskCpf(rep.cpf)}
                    </p>
                  )}
                </div>
              </div>

              {/* Cargo se houver */}
              {rep.cargo && (
                <p className="text-xs text-[#002443]/60 mb-3">
                  <strong>Cargo:</strong> {rep.cargo}
                </p>
              )}

              {/* Botões de ação */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={isActive ? 'default' : 'outline'}
                  onClick={() => toggleStatus(rep.id)}
                  className={`h-9 text-xs whitespace-normal text-left ${
                    isActive
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'border-amber-300 text-amber-700 hover:bg-amber-50'
                  }`}
                >
                  {isActive ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                      Sócio ativo — enviarei RG
                    </>
                  ) : (
                    <>
                      <UserX className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                      Marcar como ativo novamente
                    </>
                  )}
                </Button>
                {isActive && rep.source !== 'principal_declared' && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleStatus(rep.id)}
                    className="h-9 text-xs text-[#002443]/60 hover:text-amber-700 hover:bg-amber-50 whitespace-normal text-left"
                  >
                    <UserX className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                    Não é mais sócio
                  </Button>
                )}
                {isManual && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => removeManualRep(rep.id)}
                    className="h-9 text-xs text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Remover
                  </Button>
                )}
              </div>
            </div>
          );
        })}

        {/* Botão Adicionar */}
        {reps.length > 0 && (
          <Button
            onClick={addManualRep}
            variant="outline"
            className="w-full h-11 border-dashed border-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Adicionar outro representante
          </Button>
        )}
      </div>

      {/* Resumo + Avisos */}
      <div className="space-y-3 mb-6">
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold mb-1">
                Você confirmou {activeCount} representante{activeCount !== 1 ? 's' : ''} ativo{activeCount !== 1 ? 's' : ''}
              </p>
              <p className="text-blue-800/90 text-xs leading-relaxed">
                Vamos pedir documento de identidade (RG ou CNH) de cada um.
                {inactiveCount > 0 && (
                  <>
                    {' '}
                    <strong>{inactiveCount} representante{inactiveCount !== 1 ? 's foram dispensados' : ' foi dispensado'}</strong>
                    {' '}— registramos essa declaração para nossa análise de compliance.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {inactiveCount > 0 && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-relaxed">
                <strong>Importante:</strong> ao dispensar um representante, você declara que essa pessoa
                não é mais sócia ou administradora da empresa. Nossa equipe poderá solicitar o contrato
                social atualizado para confirmar essa informação.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Botões de navegação */}
      <div className="flex flex-col-reverse sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-4 border-t border-slate-200">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-slate-600 hover:text-[#002443] w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="bg-[var(--pagsmile-green)] hover:bg-[var(--pagsmile-green)]/90 text-white px-6 h-12 rounded-xl shadow-lg shadow-green-500/20 disabled:opacity-50 w-full sm:w-auto"
        >
          Confirmar e enviar documentos
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {!canConfirm && activeCount > 0 && (
        <p className="text-xs text-amber-700 text-center mt-3">
          Preencha nome e CPF de todos os representantes ativos para continuar.
        </p>
      )}
      {activeCount === 0 && reps.length > 0 && (
        <p className="text-xs text-red-600 text-center mt-3">
          Você precisa ter pelo menos 1 representante ativo.
        </p>
      )}
    </div>
  );
}