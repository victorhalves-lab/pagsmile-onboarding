import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Calculator, TrendingUp, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell } from 'recharts';

/**
 * Simulador de receita anual em USD para uma proposta Global hipotética.
 * Sliders para TPV, taxa, fee fixo e ticket médio. Mostra projeção 12 meses + breakdown.
 */
export default function GlobalRevenueSimulator() {
  const [tpv, setTpv]                 = useState(500_000); // USD/mês
  const [avgTicket, setAvgTicket]     = useState(50);
  const [rate, setRate]               = useState(3.5);     // %
  const [fixedFee, setFixedFee]       = useState(0.30);    // USD
  const [chargebackRate, setCbRate]   = useState(0.5);     // % das trx
  const [chargebackFee, setCbFee]     = useState(15);      // USD
  const [refundRate, setRefundRate]   = useState(2);       // %
  const [refundFee, setRefundFee]     = useState(0.50);    // USD

  const trxPerMonth = useMemo(() => avgTicket > 0 ? tpv / avgTicket : 0, [tpv, avgTicket]);

  const monthly = useMemo(() => {
    const grossPct       = tpv * (rate / 100);
    const grossFixed     = trxPerMonth * fixedFee;
    const cbCount        = trxPerMonth * (chargebackRate / 100);
    const cbRevenue      = cbCount * chargebackFee;
    const refundCount    = trxPerMonth * (refundRate / 100);
    const refundRevenue  = refundCount * refundFee;
    const totalGross     = grossPct + grossFixed + cbRevenue + refundRevenue;
    return { grossPct, grossFixed, cbRevenue, refundRevenue, totalGross, trxPerMonth };
  }, [tpv, trxPerMonth, rate, fixedFee, chargebackRate, chargebackFee, refundRate, refundFee]);

  const monthlySeries = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      month: `M${i + 1}`,
      taxa: Number(monthly.grossPct.toFixed(0)),
      fee: Number(monthly.grossFixed.toFixed(0)),
      cb: Number(monthly.cbRevenue.toFixed(0)),
      refund: Number(monthly.refundRevenue.toFixed(0)),
    }));
  }, [monthly]);

  const breakdown = useMemo(() => [
    { name: 'Taxa (%)',  value: Number(monthly.grossPct.toFixed(0)),       color: '#2bc196' },
    { name: 'Fee fixo',  value: Number(monthly.grossFixed.toFixed(0)),     color: '#5cf7cf' },
    { name: 'Chargeback',value: Number(monthly.cbRevenue.toFixed(0)),      color: '#002443' },
    { name: 'Refund',    value: Number(monthly.refundRevenue.toFixed(0)),  color: '#003366' },
  ], [monthly]);

  const annual = monthly.totalGross * 12;
  const fmt = v => `$${(v || 0).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  return (
    <div className="grid lg:grid-cols-5 gap-4">
      {/* Inputs */}
      <Card className="border-[#002443]/5 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calculator className="w-4 h-4 text-[#2bc196]" /> Parâmetros
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <SliderField label="TPV Mensal (USD)" value={tpv} onChange={setTpv} min={10_000} max={10_000_000} step={10_000} format={fmt} />
          <SliderField label="Ticket Médio (USD)" value={avgTicket} onChange={setAvgTicket} min={5} max={5000} step={5} format={v => `$${v}`} />
          <SliderField label="Taxa Final (%)" value={rate} onChange={setRate} min={1} max={8} step={0.05} format={v => `${v.toFixed(2)}%`} />
          <NumberRow>
            <NumberField label="Fee Fixo / Trx (USD)" value={fixedFee} onChange={setFixedFee} step="0.01" />
            <NumberField label="Chargeback Fee (USD)" value={chargebackFee} onChange={setCbFee} step="0.5" />
          </NumberRow>
          <NumberRow>
            <NumberField label="Chargeback (%)" value={chargebackRate} onChange={setCbRate} step="0.1" />
            <NumberField label="Refund (%)" value={refundRate} onChange={setRefundRate} step="0.1" />
            <NumberField label="Refund Fee (USD)" value={refundFee} onChange={setRefundFee} step="0.01" />
          </NumberRow>
        </CardContent>
      </Card>

      {/* Resultados */}
      <div className="lg:col-span-3 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <KPI icon={DollarSign} label="Receita Mensal" value={fmt(monthly.totalGross)} accent="bg-[#2bc196]/10 text-[#2bc196]" />
          <KPI icon={TrendingUp} label="Receita Anual" value={fmt(annual)} accent="bg-blue-100 text-blue-700" />
          <KPI icon={Calculator} label="Transações/mês" value={Math.round(monthly.trxPerMonth).toLocaleString('en-US')} accent="bg-amber-100 text-amber-700" />
          <KPI icon={DollarSign} label="Receita/Trx" value={fmt(monthly.totalGross / Math.max(monthly.trxPerMonth, 1))} accent="bg-slate-100 text-slate-700" />
        </div>

        <Card className="border-[#002443]/5">
          <CardHeader><CardTitle className="text-sm">Projeção 12 Meses (USD)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthlySeries}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="taxa"   stackId="a" fill="#2bc196" name="Taxa" />
                <Bar dataKey="fee"    stackId="a" fill="#5cf7cf" name="Fee fixo" />
                <Bar dataKey="cb"     stackId="a" fill="#002443" name="Chargeback" />
                <Bar dataKey="refund" stackId="a" fill="#003366" name="Refund" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-[#002443]/5">
          <CardHeader><CardTitle className="text-sm">Breakdown Mensal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={breakdown} dataKey="value" nameKey="name" outerRadius={70} label={(e) => `${e.name}: ${fmt(e.value)}`}>
                  {breakdown.map((b, i) => <Cell key={i} fill={b.color} />)}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SliderField({ label, value, onChange, min, max, step, format }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs font-mono text-[#2bc196] font-semibold">{format(value)}</span>
      </div>
      <Slider value={[value]} onValueChange={(v) => onChange(v[0])} min={min} max={max} step={step} />
    </div>
  );
}

function NumberRow({ children }) {
  return <div className="grid grid-cols-2 md:grid-cols-3 gap-2">{children}</div>;
}

function NumberField({ label, value, onChange, step }) {
  return (
    <div>
      <Label className="text-[10px] uppercase tracking-wider text-[#002443]/50">{label}</Label>
      <Input type="number" step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="h-9 text-sm" />
    </div>
  );
}

function KPI({ icon: Icon, label, value, accent }) {
  return (
    <div className="bg-white rounded-2xl border border-[#002443]/5 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#002443]/50">{label}</span>
        <div className={`p-1.5 rounded-lg ${accent}`}><Icon className="w-3.5 h-3.5" /></div>
      </div>
      <div className="text-xl font-bold text-[#002443]">{value}</div>
    </div>
  );
}