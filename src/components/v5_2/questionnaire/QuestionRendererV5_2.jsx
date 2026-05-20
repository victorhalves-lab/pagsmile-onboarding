// V5.2 — Dispatcher de perguntas por modalidade.
// Escolhe o componente correto (ConfirmCard/HybridInput/PureInput/Derived/DocumentUpload/Composite)
// baseado em `question.modalidade_origem` + `question.type`.
import React from 'react';
import ConfirmCard from './ConfirmCard';
import HybridInputCard from './HybridInputCard';
import PureInputCard from './PureInputCard';
import DerivedCard from './DerivedCard';
import DocumentUploadCard from './DocumentUploadCard';
import CompositeCard from './CompositeCard';

export default function QuestionRendererV5_2({
  question,
  value,
  fileMeta,
  bdcSnapshot = {},
  derivedValues = {},
  onChange,
  onChangeFile,
  onRemoveFile,
  datasetNomeAmigavel,
}) {
  if (!question) return null;

  // Tipo COMPOSITE → sempre CompositeCard (independente da modalidade)
  if (question.type === 'COMPOSITE') {
    const inputValue = value?.input ?? '';
    return (
      <CompositeCard
        question={question}
        inputValue={inputValue}
        fileMeta={fileMeta}
        onChangeInput={(v) => onChange?.({ ...(value || {}), input: v })}
        onUpload={onChangeFile}
        onRemoveFile={onRemoveFile}
      />
    );
  }

  // Tipo FILE_UPLOAD → Modalidade E
  if (question.type === 'FILE_UPLOAD') {
    return (
      <DocumentUploadCard
        question={question}
        fileMeta={fileMeta}
        onUpload={onChangeFile}
        onRemove={onRemoveFile}
      />
    );
  }

  // Por modalidade
  const modalidade = question.modalidade_origem;

  if (modalidade === 'modalidade_a_bdc_confirmacao') {
    const bdcPath = question?.cross_check_bdc?.campo_bdc;
    const bdcValue = bdcPath ? bdcSnapshot?.[bdcPath] : undefined;
    return (
      <ConfirmCard
        question={question}
        bdcValue={bdcValue}
        datasetNomeAmigavel={datasetNomeAmigavel}
        value={value}
        onConfirm={() => onChange?.('confirmed')}
        onReportDivergence={() => onChange?.('divergent')}
      />
    );
  }

  if (modalidade === 'modalidade_b_bdc_input_hibrido') {
    const bdcPath = question?.cross_check_bdc?.campo_bdc;
    const bdcSuggestion = bdcPath ? bdcSnapshot?.[bdcPath] : undefined;
    return (
      <HybridInputCard
        question={question}
        bdcSuggestion={bdcSuggestion}
        value={value}
        onChange={onChange}
        datasetNomeAmigavel={datasetNomeAmigavel}
      />
    );
  }

  if (modalidade === 'modalidade_d_derivado') {
    return (
      <DerivedCard
        question={question}
        derivedValue={derivedValues?.[question.id_canonico]}
        derivedFrom={question.helpText}
      />
    );
  }

  if (modalidade === 'modalidade_e_documento_upload') {
    return (
      <DocumentUploadCard
        question={question}
        fileMeta={fileMeta}
        onUpload={onChangeFile}
        onRemove={onRemoveFile}
      />
    );
  }

  // Default: Modalidade C (puro)
  return <PureInputCard question={question} value={value} onChange={onChange} />;
}