import { Droplets } from 'lucide-react';
import { useMemo, useState } from 'react';
import { InputPanel } from './components/InputPanel';
import { ResultsPanel } from './components/ResultsPanel';
import { SavedScenarios } from './components/SavedScenarios';
import { ZoneMap } from './components/ZoneMap';
import { KTM_PRESETS } from './data/presets';
import { runSimulation } from './engine/hydroEngine';
import {
  deleteScenario,
  loadSavedScenarios,
  saveScenario,
  type SavedScenario,
} from './engine/storage';
import type { PresetLocation, SimulationInput } from './types/simulator';

const presetToInput = (p: PresetLocation, ward: number): SimulationInput => ({
  lat: p.lat,
  lng: p.lng,
  roofAreaSqM: p.roofAreaSqM,
  roofMaterial: p.roofMaterial,
  permeableYardPercent: p.permeableYardPercent,
  annualPropertyTaxNPR: p.annualPropertyTaxNPR,
  wardBuildingMultiplier: ward,
});

export default function App() {
  const first = KTM_PRESETS[0];
  const [input, setInput] = useState<SimulationInput>(() => presetToInput(first, 1));
  const [activePresetId, setActivePresetId] = useState<string | null>(first.id);
  const [focusKey, setFocusKey] = useState(0);
  const [scenarios, setScenarios] = useState<SavedScenario[]>(loadSavedScenarios);

  const result = useMemo(() => runSimulation(input), [input]);
  const activePreset = KTM_PRESETS.find((p) => p.id === activePresetId) ?? null;

  const update = (patch: Partial<SimulationInput>) => setInput((prev) => ({ ...prev, ...patch }));

  const choosePreset = (p: PresetLocation) => {
    setInput((prev) => presetToInput(p, prev.wardBuildingMultiplier));
    setActivePresetId(p.id);
    setFocusKey((k) => k + 1);
  };

  const pickPoint = (lat: number, lng: number) => {
    update({ lat, lng });
    setActivePresetId(null);
  };

  return (
    <div className="flex h-full flex-col bg-slate-50 text-slate-900">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <Droplets className="h-6 w-6 text-sky-600" aria-hidden />
        <div>
          <h1 className="text-lg font-bold leading-tight">Recharge-Ready Kathmandu</h1>
          <p className="text-xs text-slate-500">
            Flash-flood mitigation &amp; groundwater recharge simulator for property and ward
          </p>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_420px]">
        <aside className="overflow-y-auto border-r border-slate-200 bg-white p-4">
          <InputPanel input={input} activePresetId={activePresetId} onChange={update} onPreset={choosePreset} />
          <hr className="my-5 border-slate-200" />
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Saved scenarios</h2>
          <SavedScenarios
            scenarios={scenarios}
            onSave={(name) => setScenarios(saveScenario(name, input))}
            onLoad={(s) => {
              setInput(s.input);
              setActivePresetId(null);
              setFocusKey((k) => k + 1);
            }}
            onDelete={(id) => setScenarios(deleteScenario(id))}
          />
        </aside>

        <section className="h-[50vh] min-h-[320px] lg:h-auto">
          <ZoneMap
            lat={input.lat}
            lng={input.lng}
            focusKey={focusKey}
            roofPolygon={activePreset?.defaultPolygon ?? null}
            onPick={pickPoint}
          />
        </section>

        <aside className="overflow-y-auto border-l border-slate-200 p-4">
          <ResultsPanel result={result} buildings={input.wardBuildingMultiplier} />
        </aside>
      </main>
    </div>
  );
}
