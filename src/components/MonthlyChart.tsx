import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import rainfallData from '../data/rainfall_ktm.json';
import { formatLiters } from '../lib/format';

interface Props {
  runoff: number[];
  recharge: number[];
}

const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

export function MonthlyChart({ runoff, recharge }: Props) {
  const data = rainfallData.monthly.map((m, i) => ({
    month: m.month,
    Runoff: runoff[i],
    Recharge: recharge[i],
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v: number) => `${compact.format(v)} L`} tick={{ fontSize: 12 }} width={60} />
          <Tooltip formatter={(v) => formatLiters(Number(v))} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="Runoff" fill="#38bdf8" radius={[3, 3, 0, 0]} />
          <Bar dataKey="Recharge" fill="#0369a1" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
