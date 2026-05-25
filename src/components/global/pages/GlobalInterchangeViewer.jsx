import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Table2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n/LanguageContext';
import {
  VISA_INTERCHANGE_RATES,
  MASTERCARD_INTERCHANGE_RATES,
  INTERCHANGE_SUMMARY,
} from '@/lib/global/interchangeData';

/**
 * Viewer somente-leitura das tabelas de Interchange Visa/Mastercard (Card Not Present).
 * Já implementado na Fase 1 porque depende só de dados estáticos.
 */
export default function GlobalInterchangeViewer() {
  const { t } = useTranslation();
  const [tab, setTab] = useState('summary');

  const formatPct = (v) => `${Number(v).toFixed(2)}%`;
  const formatFixed = (v) => `$${Number(v).toFixed(2)}`;

  const SummaryCard = ({ title, data, accent }) => (
    <Card className="border-[#002443]/5">
      <CardHeader>
        <CardTitle className="text-base text-[#002443]">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'low', label: t('global.interchange.low') || 'Menor' },
            { key: 'avg', label: t('global.interchange.avg') || 'Média' },
            { key: 'high', label: t('global.interchange.high') || 'Maior' },
          ].map(({ key, label }) => (
            <div key={key} className={`p-3 rounded-xl ${accent} border border-[#002443]/5`}>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#002443]/50">{label}</div>
              <div className="text-lg font-bold text-[#002443] mt-1">{formatPct(data[key].percentage)}</div>
              <div className="text-xs text-[#002443]/60">+ {formatFixed(data[key].fixed)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  const RateTable = ({ data }) => (
    <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('global.interchange.program') || 'Programa'}</TableHead>
            <TableHead>{t('global.interchange.card_type') || 'Tipo de Cartão'}</TableHead>
            <TableHead className="text-right">{t('global.interchange.rate_pct') || 'Taxa (%)'}</TableHead>
            <TableHead className="text-right">{t('global.interchange.rate_fixed') || 'Fixo (USD)'}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((r, i) => (
            <TableRow key={i} className="hover:bg-[#f4f4f4]">
              <TableCell className="font-medium text-sm">{r.program_name}</TableCell>
              <TableCell className="text-sm text-[#002443]/70">{r.card_type}</TableCell>
              <TableCell className="text-right font-mono text-sm">{formatPct(r.rate_percentage)}</TableCell>
              <TableCell className="text-right font-mono text-sm">{formatFixed(r.rate_fixed)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#2bc196]/10">
            <Table2 className="w-5 h-5 text-[#2bc196]" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#002443]">
              {t('global.interchange.title') || 'Tabelas de Interchange'}
            </h2>
            <p className="text-xs text-[#002443]/60">
              {t('global.interchange.subtitle') || 'Visa e Mastercard — Card Not Present (USD)'}
            </p>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="bg-white border border-[#002443]/5">
          <TabsTrigger value="summary">{t('global.interchange.summary') || 'Resumo'}</TabsTrigger>
          <TabsTrigger value="visa">Visa</TabsTrigger>
          <TabsTrigger value="master">Mastercard</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <SummaryCard title="Visa" data={INTERCHANGE_SUMMARY.visa} accent="bg-blue-50/50" />
            <SummaryCard title="Mastercard" data={INTERCHANGE_SUMMARY.master} accent="bg-red-50/50" />
            <SummaryCard title={t('global.interchange.combined') || 'Combinado'} data={INTERCHANGE_SUMMARY.combined} accent="bg-[#2bc196]/5" />
          </div>
          <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-5 text-sm text-[#002443]/70">
            <p className="font-semibold text-[#002443] mb-2">{t('global.interchange.legend') || 'Legenda'}</p>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong>{t('global.interchange.low') || 'Menor'}:</strong> {t('global.interchange.low_desc') || 'Taxa mais baixa disponível por bandeira.'}</li>
              <li><strong>{t('global.interchange.avg') || 'Média'}:</strong> {t('global.interchange.avg_desc') || 'Média de todas as taxas da bandeira.'}</li>
              <li><strong>{t('global.interchange.high') || 'Maior'}:</strong> {t('global.interchange.high_desc') || 'Taxa mais alta disponível por bandeira.'}</li>
              <li><strong>{t('global.interchange.combined') || 'Combinado'}:</strong> {t('global.interchange.combined_desc') || 'Média de Visa + Mastercard.'}</li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="visa" className="mt-4">
          <RateTable data={VISA_INTERCHANGE_RATES} />
        </TabsContent>

        <TabsContent value="master" className="mt-4">
          <RateTable data={MASTERCARD_INTERCHANGE_RATES} />
        </TabsContent>
      </Tabs>
    </div>
  );
}