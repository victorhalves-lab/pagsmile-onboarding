import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from 'lucide-react';

export default function ComplianceCaseFilters({
  searchTerm, onSearchChange,
  modelFilter, onModelFilterChange,
  merchantTypeFilter, onMerchantTypeFilterChange,
  scoreFilter, onScoreFilterChange,
  dateFilter, onDateFilterChange,
  analystFilter, onAnalystFilterChange,
  priorityFilter, onPriorityFilterChange,
  statusFilter,
  analysts,
  onClearFilters,
}) {
  const hasActiveFilters = statusFilter !== 'all' || merchantTypeFilter !== 'all' || scoreFilter !== 'all' || dateFilter !== 'all' || analystFilter !== 'all' || priorityFilter !== 'all' || modelFilter !== 'all';

  return (
    <div className="bg-white rounded-2xl border border-[#0A0A0A]/5 shadow-sm p-4 sticky top-0 z-10">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex gap-2 flex-wrap items-center">
          <Filter className="w-4 h-4 text-[var(--pinbank-blue)]/50" />
          
          <Select value={modelFilter} onValueChange={onModelFilterChange}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Modelo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Modelos</SelectItem>
              <SelectItem value="ComplianceEcommerceV4">E-commerce v4</SelectItem>
              <SelectItem value="ComplianceGatewayV4">Gateway v4</SelectItem>
              <SelectItem value="ComplianceMarketplaceV4">Marketplace v4</SelectItem>
              <SelectItem value="CompliancePlataformaVerticalV4">Plat. Vertical v4</SelectItem>
              <SelectItem value="ComplianceInfoprodutosV4">Infoprodutos v4</SelectItem>
              <SelectItem value="ComplianceEducacaoV4">Educação v4</SelectItem>
              <SelectItem value="ComplianceSaaSV4">SaaS v4</SelectItem>
              <SelectItem value="ComplianceMerchantLinkV4">Link Pgto v4</SelectItem>
              <SelectItem value="ComplianceMPEV4">MPE v4</SelectItem>
              <SelectItem value="ComplianceDropshippingV4">Dropshipping v4</SelectItem>
              <SelectItem value="CompliancePixMerchantV4">PIX Merchant v4</SelectItem>
              <SelectItem value="CompliancePixIntermediarioV4">PIX Intermediário v4</SelectItem>
              <SelectItem value="pix_api_enterprise">PIX API Enterprise</SelectItem>
              <SelectItem value="subseller_v2">Subseller v2</SelectItem>
              <SelectItem value="merchant">Merchant (legado)</SelectItem>
              <SelectItem value="gateway">Gateway (legado)</SelectItem>
              <SelectItem value="marketplace">Marketplace (legado)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={merchantTypeFilter} onValueChange={onMerchantTypeFilterChange}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Tipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Tipos</SelectItem>
              <SelectItem value="PF">Pessoa Física</SelectItem>
              <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
            </SelectContent>
          </Select>

          <Select value={scoreFilter} onValueChange={onScoreFilterChange}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Score Helena" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Scores</SelectItem>
              <SelectItem value="high">≥ 80 (Baixo Risco)</SelectItem>
              <SelectItem value="medium">50-79 (Médio Risco)</SelectItem>
              <SelectItem value="low">&lt; 50 (Alto Risco)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={onDateFilterChange}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Período" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo período</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
            </SelectContent>
          </Select>

          {analysts.length > 0 && (
            <Select value={analystFilter} onValueChange={onAnalystFilterChange}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Analista" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Analistas</SelectItem>
                {analysts.map(a => (
                  <SelectItem key={a} value={a}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={priorityFilter} onValueChange={onPriorityFilterChange}>
            <SelectTrigger className="w-32"><SelectValue placeholder="Prioridade" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="critical">Crítica</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={onClearFilters} className="text-[var(--pinbank-blue)]/70">
              Limpar filtros
            </Button>
          )}
        </div>
        
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--pinbank-blue)]/50" />
          <Input
            placeholder="Buscar por nome, CPF/CNPJ, e-mail ou ID..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
    </div>
  );
}