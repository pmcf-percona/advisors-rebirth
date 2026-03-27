import { useSearchParams } from 'react-router-dom';
import {
  getScenarioChecks,
  type CheckResult,
  type CheckSeverity,
  type Scenario,
} from '../../mocks/advisorsData';

const severityConfig: Record<CheckSeverity, { dot: string; badge: string; label: string }> = {
  critical: {
    dot: 'bg-fx-red',
    badge: 'bg-fx-red/10 text-fx-red',
    label: 'Critical',
  },
  warning: {
    dot: 'bg-fx-orange',
    badge: 'bg-fx-orange/10 text-fx-orange',
    label: 'Warning',
  },
  notice: {
    dot: 'bg-fx-blue',
    badge: 'bg-fx-blue/10 text-fx-blue',
    label: 'Notice',
  },
};

const dbIcons: Record<string, string> = {
  postgresql: 'PG',
  mongodb: 'MDB',
  mysql: 'MY',
};

export function Feed() {
  const [searchParams, setSearchParams] = useSearchParams();
  const scenario = (searchParams.get('scenario') as Scenario) ?? undefined;
  const checks = getScenarioChecks(scenario);

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fx-black">Checks Feed</h1>
          <p className="mt-1 text-sm text-fx-600">
            {checks.length} failed check{checks.length !== 1 && 's'} across your monitored fleet.
          </p>
        </div>

        {/* wireframe: scenario toggle for demos */}
        <div className="flex items-center gap-1.5 rounded-md border border-fx-200 bg-white px-1 py-0.5">
          {(['default', 'empty', 'all-critical'] as const).map((s) => (
            <button
              key={s}
              onClick={() => {
                if (s === 'default') {
                  searchParams.delete('scenario');
                } else {
                  searchParams.set('scenario', s);
                }
                setSearchParams(searchParams);
              }}
              className={`px-2.5 py-1 text-xs rounded transition-colors ${
                (scenario ?? 'default') === s
                  ? 'bg-fx-150 text-fx-black font-medium'
                  : 'text-fx-500 hover:text-fx-black'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {checks.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-lg border border-dashed border-fx-300 bg-fx-100/50 py-16">
          <p className="text-sm font-medium text-fx-600">No failed checks</p>
          <p className="mt-1 text-xs text-fx-500">All configured checks are passing, or none are enabled yet.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {checks.map((check) => (
            <CheckCard key={check.id} check={check} />
          ))}
        </ul>
      )}
    </div>
  );
}

function CheckCard({ check }: { check: CheckResult }) {
  const sev = severityConfig[check.severity];
  const dbLabel = dbIcons[check.databaseType] ?? check.databaseType;
  const time = new Date(check.lastRun).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <li className="rounded-lg border border-fx-200 bg-white p-5 shadow-sm hover:shadow transition-shadow">
      <div className="flex items-start gap-4">
        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${sev.dot}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-fx-black">{check.name}</h3>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${sev.badge}`}>
              {sev.label}
            </span>
            <span className="inline-flex items-center rounded border border-fx-200 bg-fx-100 px-1.5 py-0.5 text-[11px] font-mono text-fx-700">
              {dbLabel}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-fx-700 leading-relaxed">{check.summary}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-fx-500">
            <span className="font-mono">{check.target}</span>
            <span>&middot;</span>
            <span>{check.advisor}</span>
            <span>&middot;</span>
            <time>{time}</time>
          </div>
        </div>
      </div>
    </li>
  );
}
