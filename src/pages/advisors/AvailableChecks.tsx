import { useState } from 'react';
import { availableChecks, type AvailableCheck } from '../../mocks/advisorsData';

const dbLabel: Record<string, string> = {
  postgresql: 'PostgreSQL',
  mongodb: 'MongoDB',
  mysql: 'MySQL',
};

export function AvailableChecks() {
  const [checks, setChecks] = useState(availableChecks);

  const toggle = (id: string) =>
    setChecks((prev) =>
      prev.map((c) => (c.id === id ? { ...c, enabled: !c.enabled } : c)),
    );

  const enabledCount = checks.filter((c) => c.enabled).length;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fx-black">Available Checks</h1>
          <p className="mt-1 text-sm text-fx-600">
            {enabledCount} of {checks.length} checks enabled.
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-fx-200 bg-white shadow-sm">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-fx-200 bg-fx-100/70">
              <th className="px-4 py-3 font-medium text-fx-600 text-xs uppercase tracking-wide">Check</th>
              <th className="px-4 py-3 font-medium text-fx-600 text-xs uppercase tracking-wide">Database</th>
              <th className="px-4 py-3 font-medium text-fx-600 text-xs uppercase tracking-wide">Category</th>
              <th className="px-4 py-3 font-medium text-fx-600 text-xs uppercase tracking-wide">Interval</th>
              <th className="px-4 py-3 font-medium text-fx-600 text-xs uppercase tracking-wide text-center">Enabled</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-fx-150">
            {checks.map((check) => (
              <CheckRow key={check.id} check={check} onToggle={toggle} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CheckRow({
  check,
  onToggle,
}: {
  check: AvailableCheck;
  onToggle: (id: string) => void;
}) {
  return (
    <tr className="hover:bg-fx-100/40 transition-colors">
      <td className="px-4 py-3">
        <p className="font-medium text-fx-black">{check.name}</p>
        <p className="mt-0.5 text-xs text-fx-500 max-w-md truncate">{check.description}</p>
      </td>
      <td className="px-4 py-3">
        <span className="inline-flex items-center rounded border border-fx-200 bg-fx-100 px-2 py-0.5 text-xs font-mono text-fx-700">
          {dbLabel[check.databaseType]}
        </span>
      </td>
      <td className="px-4 py-3 text-fx-600">{check.category}</td>
      <td className="px-4 py-3 font-mono text-xs text-fx-600">{check.interval}</td>
      <td className="px-4 py-3 text-center">
        <button
          onClick={() => onToggle(check.id)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            check.enabled ? 'bg-fx-green' : 'bg-fx-300'
          }`}
          aria-label={`${check.enabled ? 'Disable' : 'Enable'} ${check.name}`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
              check.enabled ? 'translate-x-[18px]' : 'translate-x-[3px]'
            }`}
          />
        </button>
      </td>
    </tr>
  );
}
