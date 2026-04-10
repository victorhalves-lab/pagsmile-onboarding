import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Database, Search, Download, Clock, Building2, User, Filter,
  FileText, Shield, Globe, TrendingUp, Users, AlertTriangle,
} from 'lucide-react';
import BDCDatasetViewer from './BDCDatasetViewer';
import BDCRevalidationTimeline from './BDCRevalidationTimeline';

const CATEGORY_ICONS = {
  cadastral: Building2,
  contato: FileText,
  societario: Users,
  compliance: Shield,
  financeiro: TrendingUp,
  digital: Globe,
  reputacao: AlertTriangle,
};

export default function BDCRawDataTab({ validations, merchant }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [activeView, setActiveView] = useState('dados'); // 'dados' | 'timeline'

  // Get the most recent BDC validation with full resultData
  const bdcValidations = useMemo(() => {
    return validations
      .filter(v => v.provider === 'BigDataCorp' && v.resultData)
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [validations]);

  const latestValidation = bdcValidations[0];

  // Extract all datasets from the latest validation's resultData
  const datasets = useMemo(() => {
    if (!latestValidation?.resultData) return [];

    const rd = latestValidation.resultData;
    const extracted = [];

    // resultData can have different structures depending on the BDC response
    // Try to extract datasets from common structures
    const processObject = (obj, prefix = '') => {
      if (!obj || typeof obj !== 'object') return;

      Object.entries(obj).forEach(([key, value]) => {
        // Skip metadata keys
        if (['scoreDelta', 'oldScore', 'newScore', 'oldSubfaixa', 'newSubfaixa',
             'subfaixaChanged', 'datasetsQueried', 'status', 'alert',
             'merchantName', 'document', 'type', 'error'].includes(key)) return;

        const fullKey = prefix ? `${prefix}.${key}` : key;

        // If value looks like a dataset (object or array with data)
        if (value && typeof value === 'object') {
          extracted.push({
            key: fullKey,
            data: value,
            displayKey: key,
          });
        }
      });
    };

    // Check if resultData has a "datasets" or "Result" wrapper
    if (rd.datasets) {
      processObject(rd.datasets);
    } else if (rd.Result) {
      // BDC standard format
      if (Array.isArray(rd.Result)) {
        rd.Result.forEach((result, i) => {
          const datasetName = result.DataSetName || result.dataSetName || `dataset_${i}`;
          extracted.push({
            key: datasetName,
            data: result.Data || result.data || result,
            displayKey: datasetName,
          });
        });
      } else {
        processObject(rd.Result);
      }
    } else {
      // Direct structure — process top-level keys
      processObject(rd);
    }

    return extracted;
  }, [latestValidation]);

  // Categorize datasets
  const categorizedDatasets = useMemo(() => {
    const CATEGORY_MAP = {
      'basic': 'cadastral', 'registration': 'cadastral', 'address': 'cadastral', 'empresa': 'cadastral', 'cnpj': 'cadastral', 'cpf': 'cadastral',
      'email': 'contato', 'phone': 'contato', 'telefone': 'contato',
      'owner': 'societario', 'qsa': 'societario', 'socio': 'societario', 'related': 'societario', 'partner': 'societario',
      'process': 'compliance', 'lawsuit': 'compliance', 'sanction': 'compliance', 'pep': 'compliance', 'kyc': 'compliance', 'aml': 'compliance',
      'debt': 'financeiro', 'protest': 'financeiro', 'bankrupt': 'financeiro', 'credit': 'financeiro', 'revenue': 'financeiro', 'financial': 'financeiro', 'score': 'financeiro',
      'online': 'digital', 'domain': 'digital', 'social': 'digital', 'web': 'digital', 'digital': 'digital',
      'media': 'reputacao', 'complaint': 'reputacao', 'reputation': 'reputacao', 'news': 'reputacao', 'adverse': 'reputacao',
    };

    return datasets.map(ds => {
      const keyLower = ds.displayKey.toLowerCase();
      let category = 'outros';
      for (const [pattern, cat] of Object.entries(CATEGORY_MAP)) {
        if (keyLower.includes(pattern)) {
          category = cat;
          break;
        }
      }
      return { ...ds, category };
    });
  }, [datasets]);

  // Apply filters
  const filteredDatasets = useMemo(() => {
    return categorizedDatasets.filter(ds => {
      if (categoryFilter !== 'all' && ds.category !== categoryFilter) return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return ds.displayKey.toLowerCase().includes(q) || ds.category.includes(q);
      }
      return true;
    });
  }, [categorizedDatasets, categoryFilter, searchTerm]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = {};
    categorizedDatasets.forEach(ds => {
      counts[ds.category] = (counts[ds.category] || 0) + 1;
    });
    return counts;
  }, [categorizedDatasets]);

  const handleExportJson = () => {
    if (!latestValidation?.resultData) return;
    const blob = new Blob([JSON.stringify(latestValidation.resultData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bdc_${merchant?.cpfCnpj || 'dados'}_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#002443] to-[#1a3a5c] rounded-2xl p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/10">
              <Database className="w-5 h-5 text-[#5cf7cf]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Dados BigDataCorp — Visão Completa</h3>
              <p className="text-white/50 text-xs mt-0.5">
                {merchant?.type === 'PF' ? 'Pessoa Física' : 'Pessoa Jurídica'} • 
                {merchant?.cpfCnpj || 'N/D'} • 
                {merchant?.fullName || ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {latestValidation && (
              <div className="text-right mr-3">
                <p className="text-[10px] text-white/40">Última consulta</p>
                <p className="text-xs text-white/80 font-medium">
                  {new Date(latestValidation.created_date).toLocaleDateString('pt-BR', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </p>
              </div>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportJson}
              disabled={!latestValidation}
              className="border-white/20 text-white hover:bg-white/10 bg-transparent text-xs"
            >
              <Download className="w-3.5 h-3.5 mr-1" /> Exportar JSON
            </Button>
          </div>
        </div>

        {/* Quick stats */}
        {latestValidation && (
          <div className="flex gap-4 mt-4">
            <div className="bg-white/10 rounded-lg px-3 py-1.5">
              <span className="text-[10px] text-white/40">Datasets</span>
              <p className="text-sm font-bold text-white">{datasets.length}</p>
            </div>
            <div className="bg-white/10 rounded-lg px-3 py-1.5">
              <span className="text-[10px] text-white/40">Consultas</span>
              <p className="text-sm font-bold text-white">{bdcValidations.length}</p>
            </div>
            {Object.entries(categoryCounts).slice(0, 5).map(([cat, count]) => (
              <div key={cat} className="bg-white/10 rounded-lg px-3 py-1.5">
                <span className="text-[10px] text-white/40 capitalize">{cat}</span>
                <p className="text-sm font-bold text-white">{count}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={activeView === 'dados' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveView('dados')}
          className={activeView === 'dados' ? 'bg-[#2bc196] hover:bg-[#2bc196]/90 text-white' : ''}
        >
          <Database className="w-3.5 h-3.5 mr-1.5" /> Dados por Dataset ({datasets.length})
        </Button>
        <Button
          variant={activeView === 'timeline' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveView('timeline')}
          className={activeView === 'timeline' ? 'bg-[#2bc196] hover:bg-[#2bc196]/90 text-white' : ''}
        >
          <Clock className="w-3.5 h-3.5 mr-1.5" /> Timeline ({bdcValidations.length})
        </Button>
      </div>

      {activeView === 'timeline' ? (
        <BDCRevalidationTimeline validations={validations} />
      ) : (
        <>
          {/* Filters */}
          {datasets.length > 0 && (
            <div className="bg-white rounded-xl border border-[#002443]/8 p-3 flex items-center gap-3">
              <Filter className="w-4 h-4 text-[#002443]/30 shrink-0" />
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#002443]/30" />
                <Input
                  placeholder="Buscar dataset..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas categorias</SelectItem>
                  {Object.entries(categoryCounts).map(([cat, count]) => (
                    <SelectItem key={cat} value={cat} className="capitalize">{cat} ({count})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Dataset list */}
          {filteredDatasets.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#002443]/8 p-8 text-center">
              <Database className="w-10 h-10 text-[#002443]/15 mx-auto mb-3" />
              <p className="text-sm text-[#002443]/50">
                {datasets.length === 0
                  ? 'Nenhum dado BDC disponível. Execute o enriquecimento BDC primeiro.'
                  : 'Nenhum dataset corresponde aos filtros'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDatasets.map(ds => (
                <BDCDatasetViewer key={ds.key} datasetKey={ds.displayKey} data={ds.data} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}