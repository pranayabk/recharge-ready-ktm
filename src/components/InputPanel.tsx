import { Building2, MapPin } from 'lucide-react';
import { KTM_PRESETS } from '../data/presets';
import { ROOF_MATERIAL_LABELS } from '../lib/format';
import type { PresetLocation, RoofMaterial, SimulationInput } from '../types/simulator';

const WARD_OPTIONS = [1, 100, 500, 1000] as const;

interface Props {
  input: SimulationInput;
  activePresetId: string | null;
  onChange: (patch: Partial<SimulationInput>) => void;
  onPreset: (preset: PresetLocation) => void;
}

const labelCls = 'block text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1';
const fieldCls =
  'w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200';

export function InputPanel({ input, activePresetId, onChange, onPreset }: Props) {
  const num = (v: string) => (v === '' ? 0 : Number(v));

  return (
    <div className="space-y-5">
      <section>
        <h2 className={labelCls}>Demo properties</h2>
        <div className="grid gap-2">
          {KTM_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPreset(p)}
              className={`rounded-md border px-3 py-2 text-left text-sm transition ${
                activePresetId === p.id
                  ? 'border-sky-500 bg-sky-50 ring-2 ring-sky-200'
                  : 'border-slate-200 bg-white hover:border-slate-400'
              }`}
            >
              <span className="block font-medium text-slate-800">{p.label}</span>
              <span className="block text-xs text-slate-500">{p.wardLabel}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="flex items-start gap-2 rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-600">
        <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <span>
          {input.lat.toFixed(4)}, {input.lng.toFixed(4)}. Click anywhere on the map to move the
          property.
        </span>
      </section>

      <section className="space-y-4">
        <div>
          <label htmlFor="roofArea" className={labelCls}>
            Roof area (m²)
          </label>
          <input
            id="roofArea"
            type="number"
            min={0}
            step={5}
            className={fieldCls}
            value={input.roofAreaSqM}
            onChange={(e) => onChange({ roofAreaSqM: num(e.target.value) })}
          />
        </div>

        <div>
          <label htmlFor="roofMaterial" className={labelCls}>
            Roof material
          </label>
          <select
            id="roofMaterial"
            className={fieldCls}
            value={input.roofMaterial}
            onChange={(e) => onChange({ roofMaterial: e.target.value as RoofMaterial })}
          >
            {(Object.keys(ROOF_MATERIAL_LABELS) as RoofMaterial[]).map((m) => (
              <option key={m} value={m}>
                {ROOF_MATERIAL_LABELS[m]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="yard" className={labelCls}>
            Permeable yard: {input.permeableYardPercent}%
            {input.permeableYardPercent < 15 && (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 normal-case text-amber-800">
                tight plot
              </span>
            )}
          </label>
          <input
            id="yard"
            type="range"
            min={0}
            max={100}
            className="w-full accent-sky-600"
            value={input.permeableYardPercent}
            onChange={(e) => onChange({ permeableYardPercent: Number(e.target.value) })}
          />
        </div>

        <div>
          <label htmlFor="tax" className={labelCls}>
            Annual property tax (NPR)
          </label>
          <input
            id="tax"
            type="number"
            min={0}
            step={500}
            className={fieldCls}
            value={input.annualPropertyTaxNPR}
            onChange={(e) => onChange({ annualPropertyTaxNPR: num(e.target.value) })}
          />
        </div>

        <div>
          <span className={labelCls}>
            <Building2 className="mr-1 inline h-3.5 w-3.5" aria-hidden />
            Ward-scale adoption (buildings)
          </span>
          <div className="grid grid-cols-4 gap-1" role="radiogroup" aria-label="Ward multiplier">
            {WARD_OPTIONS.map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={input.wardBuildingMultiplier === n}
                onClick={() => onChange({ wardBuildingMultiplier: n })}
                className={`rounded-md border px-2 py-1.5 text-sm font-medium ${
                  input.wardBuildingMultiplier === n
                    ? 'border-sky-600 bg-sky-600 text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                }`}
              >
                ×{n.toLocaleString('en-IN')}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
