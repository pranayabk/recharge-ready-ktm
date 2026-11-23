import { CloudRain, Coins, Droplets, Gauge, Layers, Timer } from 'lucide-react';
import type { ReactNode } from 'react';
import { formatLiters, formatNPR, formatNumber, STRUCTURE_LABELS } from '../lib/format';
import type { SimulationResult } from '../types/simulator';
import { MonthlyChart } from './MonthlyChart';

interface Props {
  result: SimulationResult;
  buildings: number;
}

function Stat({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-xl font-semibold text-slate-900">{value}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  );
}

function ScoreRing({ score }: { score: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  const color = score >= 80 ? '#059669' : score >= 50 ? '#d97706' : score >= 25 ? '#64748b' : '#dc2626';
  return (
    <svg viewBox="0 0 80 80" className="h-20 w-20 shrink-0" role="img" aria-label={`Readiness score ${score} of 100`}>
      <circle cx="40" cy="40" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
      <circle
        cx="40"
        cy="40"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={`${(score / 100) * c} ${c}`}
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="46" textAnchor="middle" className="fill-slate-900 text-[20px] font-bold">
        {score}
      </text>
    </svg>
  );
}

export function ResultsPanel({ result: r, buildings }: Props) {
  const scope = buildings > 1 ? `across ${formatNumber(buildings)} buildings` : 'this building';
  const units = STRUCTURE_LABELS[r.structureType];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-l-4 bg-white p-4 shadow-sm" style={{ borderLeftColor: r.zoneColor }}>
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: r.zoneColor }}>
          {r.zoneName} · infiltration ×{r.infiltrationMultiplier}
        </p>
        <p className="mt-1 text-sm text-slate-600">{r.soilDescription}</p>
        <p className="mt-3 text-sm font-medium text-slate-900">
          Recommended: {r.engineeringRecommendation}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Unit: {r.structureDimensions} ({formatLiters(r.structureCapacityLiters)} buffer each)
        </p>
      </div>

      <div className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm">
        <ScoreRing score={r.readinessScore} />
        <div>
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Gauge className="h-3.5 w-3.5" aria-hidden /> Recharge Readiness Score
          </p>
          <p className="mt-1 text-base font-semibold text-slate-900">{r.rebateTierLabel}</p>
          <p className="text-xs text-slate-500">Per building. Rebate tiers are a proposed policy scenario.</p>
        </div>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Impact {scope}</p>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
        <Stat
          icon={<CloudRain className="h-3.5 w-3.5" aria-hidden />}
          label="Cloudburst diverted"
          value={formatLiters(r.cloudburstDivertedLiters)}
          sub="kept off streets in a 50 mm / 2 h storm"
        />
        <Stat
          icon={<Droplets className="h-3.5 w-3.5" aria-hidden />}
          label="Annual recharge"
          value={formatLiters(r.annualRechargeLiters)}
          sub={`of ${formatLiters(r.annualRunoffLiters)} harvested`}
        />
        <Stat
          icon={<Layers className="h-3.5 w-3.5" aria-hidden />}
          label="Structures"
          value={formatNumber(r.structuresRequired)}
          sub={r.structuresRequired === 1 ? units.singular : units.plural}
        />
        <Stat
          icon={<Coins className="h-3.5 w-3.5" aria-hidden />}
          label="Capital cost"
          value={formatNPR(r.estimatedCostNPR)}
        />
        <Stat
          icon={<Coins className="h-3.5 w-3.5" aria-hidden />}
          label="Annual savings"
          value={formatNPR(r.annualTaxSavingsNPR + r.annualWaterSavingsNPR)}
          sub={`${formatNPR(r.annualTaxSavingsNPR)} tax + ${formatNPR(r.annualWaterSavingsNPR)} water`}
        />
        <Stat
          icon={<Timer className="h-3.5 w-3.5" aria-hidden />}
          label="Payback"
          value={r.paybackYears === null ? 'n/a' : `${r.paybackYears} yrs`}
          sub="simple payback, per building"
        />
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Monthly runoff vs recharge ({scope})
        </p>
        <MonthlyChart runoff={r.monthlyRunoffLiters} recharge={r.monthlyRechargeLiters} />
      </div>
    </div>
  );
}
