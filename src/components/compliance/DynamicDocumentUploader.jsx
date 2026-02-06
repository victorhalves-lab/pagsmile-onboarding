import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FileUp, CheckCircle2, AlertCircle, Trash2, 
  Shield, Lock, Loader2, Upload, File
} from 'lucide-react';
import { toast } from 'sonner';

// Card individual de documento
function DocumentCard({ doc, uploadedFile, onUpload, onRemove, isUploading }) {
  const inputRef = React.useRef(null);
  const isUploaded = !!uploadedFile?.url;

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tamanho
    const maxSize = (doc.maxSizeMB || 10) * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Arquivo muito grande. Máximo: ${doc.maxSizeMB || 10}MB`);
      return;
    }

    // Validar formato
    const allowedFormats = doc.allowedFormats || ['PDF', 'JPG', 'JPEG', 'PNG'];
    const fileExt = file.name.split('.').pop().toUpperCase();
    if (!allowedFormats.includes(fileExt)) {
      toast.error(`Formato não permitido. Use: ${allowedFormats.join(', ')}`);
      return;
    }

    onUpload(doc.documentTypeId || doc.id, file);
    e.target.value = '';
  };

  return (
    <div className={`
      bg-white rounded-xl border-2 p-4 transition-all duration-200
      ${isUploaded 
        ? 'border-green-200 bg-green-50/50' 
        : doc.required 
          ? 'border-amber-200 bg-amber-50/30' 
          : 'border-slate-200 hover:border-slate-300'
      }
    `}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isUploaded ? (
              <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            ) : doc.required ? (
              <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            ) : (
              <File className="w-5 h-5 text-slate-400 shrink-0" />
            )}
            <h4 className="font-semibold text-[#002443] text-sm truncate">
              {doc.label || doc.name}
              {doc.required && <span className="text-red-500 ml-1">*</span>}
            </h4>
          </div>
          
          <p className="text-xs text-slate-500 mb-3 line-clamp-2">
            {doc.description || doc.instructions || 'Envie o documento solicitado'}
          </p>

          {isUploaded ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full truncate max-w-[200px]">
                {uploadedFile.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(doc.documentTypeId || doc.id)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 px-2"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <div>
              <input
                ref={inputRef}
                type="file"
                onChange={handleFileSelect}
                accept={
                  (doc.allowedFormats || ['PDF', 'JPG', 'JPEG', 'PNG'])
                    .map(f => `.${f.toLowerCase()}`).join(',')
                }
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => inputRef.current?.click()}
                disabled={isUploading}
                className="h-8 text-xs"
              >
                {isUploading ? (
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3 mr-2" />
                )}
                Selecionar Arquivo
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Componente principal
export default function DynamicDocumentUploader({
  template,
  documents,
  setDocuments,
  storageKey,
  onAllRequiredUploaded
}) {
  const [uploadingDoc, setUploadingDoc] = useState(null);

  // Documentos do template
  const requiredDocs = template?.requiredDocuments || [];

  // Carregar documentos salvos do localStorage
  useEffect(() => {
    if (storageKey) {
      const savedDocs = localStorage.getItem(storageKey);
      if (savedDocs) {
        try {
          setDocuments(JSON.parse(savedDocs));
        } catch (e) {
          console.error('Erro ao carregar documentos salvos:', e);
        }
      }
    }
  }, [storageKey, setDocuments]);

  // Salvar no localStorage quando mudar
  useEffect(() => {
    if (storageKey && documents && Object.keys(documents).length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(documents));
    }
  }, [documents, storageKey]);

  // Verificar se todos os obrigatórios foram enviados
  useEffect(() => {
    if (onAllRequiredUploaded) {
      const requiredIds = requiredDocs.filter(d => d.required).map(d => d.documentTypeId || d.id);
      const allUploaded = requiredIds.every(id => documents[id]?.url);
      onAllRequiredUploaded(allUploaded);
    }
  }, [documents, requiredDocs, onAllRequiredUploaded]);

  const handleUpload = async (docId, file) => {
    setUploadingDoc(docId);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setDocuments(prev => ({
        ...prev,
        [docId]: {
          url: file_url,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadedAt: new Date().toISOString()
        }
      }));
      toast.success('Documento enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar: ' + error.message);
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleRemove = (docId) => {
    setDocuments(prev => {
      const newDocs = { ...prev };
      delete newDocs[docId];
      return newDocs;
    });
  };

  // Separar obrigatórios e opcionais
  const mandatoryDocs = requiredDocs.filter(d => d.required);
  const optionalDocs = requiredDocs.filter(d => !d.required);

  const uploadedCount = Object.keys(documents).length;
  const requiredCount = mandatoryDocs.length;
  const progress = requiredCount > 0 ? Math.round((
    mandatoryDocs.filter(d => documents[d.documentTypeId || d.id]?.url).length / requiredCount
  ) * 100) : 100;

  if (requiredDocs.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <FileUp className="w-12 h-12 mx-auto text-slate-300 mb-3" />
        <p>Nenhum documento configurado para este questionário.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#002443]">
            Progresso do Envio
          </span>
          <span className="text-sm font-semibold text-[#2bc196]">
            {progress}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-slate-500 mt-2">
          {mandatoryDocs.filter(d => documents[d.documentTypeId || d.id]?.url).length} de {requiredCount} documentos obrigatórios enviados
        </p>
      </div>

      {/* Documentos Obrigatórios */}
      {mandatoryDocs.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-[#002443] mb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            Documentos Obrigatórios ({mandatoryDocs.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mandatoryDocs.map((doc) => (
              <DocumentCard
                key={doc.documentTypeId || doc.id}
                doc={doc}
                uploadedFile={documents[doc.documentTypeId || doc.id]}
                onUpload={handleUpload}
                onRemove={handleRemove}
                isUploading={uploadingDoc === (doc.documentTypeId || doc.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Documentos Opcionais */}
      {optionalDocs.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-[#002443] mb-3 flex items-center gap-2">
            <File className="w-4 h-4 text-slate-400" />
            Documentos Opcionais ({optionalDocs.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {optionalDocs.map((doc) => (
              <DocumentCard
                key={doc.documentTypeId || doc.id}
                doc={doc}
                uploadedFile={documents[doc.documentTypeId || doc.id]}
                onUpload={handleUpload}
                onRemove={handleRemove}
                isUploading={uploadingDoc === (doc.documentTypeId || doc.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Info de Segurança */}
      <div className="bg-slate-50 rounded-xl p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-[#002443]/60 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-[#002443]">Seus documentos estão seguros</p>
          <p className="text-xs text-[#002443]/60 mt-1">
            Todos os arquivos são criptografados e armazenados em ambiente seguro, 
            acessíveis apenas pela equipe de compliance.
          </p>
        </div>
      </div>

      {/* Requisitos */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Lock className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <h4 className="font-medium text-[#002443] text-sm">Requisitos dos Arquivos</h4>
            <ul className="text-sm text-slate-500 mt-1 space-y-1 list-disc pl-4">
              <li>Formatos aceitos: <strong>PDF, JPG, PNG</strong></li>
              <li>Tamanho máximo: <strong>10MB</strong> por arquivo</li>
              <li>Documentos devem estar legíveis e dentro da validade</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}