import { Save, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { SavedScenario } from '../engine/storage';
import { formatLiters } from '../lib/format';

interface Props {
  scenarios: SavedScenario[];
  onSave: (name: string) => void;
  onLoad: (s: SavedScenario) => void;
  onDelete: (id: string) => void;
}

export function SavedScenarios({ scenarios, onSave, onLoad, onDelete }: Props) {
  const [name, setName] = useState('');

  return (
    <div className="space-y-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(name);
          setName('');
        }}
      >
        <input
          aria-label="Scenario name"
          placeholder="Scenario name (optional)"
          className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="submit"
          className="flex items-center gap-1 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          <Save className="h-4 w-4" aria-hidden /> Save
        </button>
      </form>

      {scenarios.length === 0 ? (
        <p className="text-xs text-slate-500">No saved scenarios yet.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
          {scenarios.map((s) => (
            <li key={s.id} className="flex items-center gap-2 px-3 py-2">
              <button type="button" className="min-w-0 flex-1 text-left" onClick={() => onLoad(s)}>
                <span className="block truncate text-sm font-medium text-slate-800">{s.name}</span>
                <span className="block text-xs text-slate-500">
                  Score {s.result.readinessScore} · {formatLiters(s.result.cloudburstDivertedLiters)} diverted ·{' '}
                  {new Date(s.savedAt).toLocaleDateString()}
                </span>
              </button>
              <button
                type="button"
                aria-label={`Delete ${s.name}`}
                className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                onClick={() => onDelete(s.id)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
