import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Dataset, Material, WellScenario } from '../types';
import { DEFAULT_SCENARIO } from '../services/scenarios';

export type Units = 'metric' | 'field';
function readPreference(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}
interface AppState {
  dataset: Dataset;
  well: WellScenario;
  setWell: React.Dispatch<React.SetStateAction<WellScenario>>;
  units: Units;
  setUnits: (units: Units) => void;
  theme: string;
  setTheme: (theme: string) => void;
  comparison: Material[];
  toggleComparison: (material: Material) => void;
  clearComparison: () => void;
  numericErrors: Record<string, string>;
  setNumericError: (key: string, error: string) => void;
  notice: string;
  notify: (message: string) => void;
}
const Context = createContext<AppState | null>(null);
export function AppProvider({ dataset, children }: { dataset: Dataset; children: ReactNode }) {
  const [well, setWell] = useState<WellScenario>(() => ({ ...DEFAULT_SCENARIO }));
  const [units, updateUnits] = useState<Units>(() =>
    readPreference('octg.units', 'metric') === 'field' ? 'field' : 'metric',
  );
  const [theme, updateTheme] = useState(() => readPreference('octg.theme', 'light'));
  const [ids, setIds] = useState<string[]>([]);
  const [numericErrors, setNumericErrors] = useState<Record<string, string>>({});
  const [notice, notify] = useState('');
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('octg.theme', theme);
    } catch {
      /* Preference remains available in this session. */
    }
  }, [theme]);
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => notify(''), 4500);
    return () => clearTimeout(timeout);
  }, [notice]);
  const comparison = useMemo(
    () =>
      ids.map((id) => dataset.materials.find((m) => m.id === id)).filter((m): m is Material => !!m),
    [ids, dataset],
  );
  const toggleComparison = (material: Material) =>
    setIds((current) => {
      if (current.includes(material.id)) return current.filter((id) => id !== material.id);
      if (current.length >= 4) {
        notify('Compare up to four materials. Remove one to add another.');
        return current;
      }
      notify(`${material.grade} added to comparison.`);
      return [...current, material.id];
    });
  return (
    <Context.Provider
      value={{
        dataset,
        well,
        setWell,
        units,
        setUnits: (value) => {
          updateUnits(value);
          try {
            localStorage.setItem('octg.units', value);
          } catch {
            /* Session preference only. */
          }
        },
        theme,
        setTheme: updateTheme,
        comparison,
        toggleComparison,
        clearComparison: () => setIds([]),
        numericErrors,
        setNumericError: (key, error) =>
          setNumericErrors((current) => {
            const next = { ...current };
            if (error) next[key] = error;
            else delete next[key];
            return next;
          }),
        notice,
        notify,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useApp() {
  const context = useContext(Context);
  if (!context) throw new Error('Application context unavailable.');
  return context;
}
