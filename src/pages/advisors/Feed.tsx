import { Link } from 'react-router-dom';
import {
  getScenarioChecks,
  getFleetSummary,
  type CheckResult,
  type CheckSeverity,
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

function FleetSummary() {
  const { totalActive, passing, actionable } = getFleetSummary();

  return (
    <div className="rounded-lg border border-fx-200 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-fx-green/15 text-fx-green">
            <svg width="16" height="16" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.5 6.5 5 9l4.5-6" />
            </svg>
          </span>
          <span className="text-2xl font-semibold text-fx-green">{passing}</span>
          <span className="text-sm font-semibold text-fx-green/100">passed</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-fx-red/15 text-fx-red">
            <svg width="16" height="16" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 1v5" />
              <circle cx="6" cy="10" r="1.25" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <span className="text-2xl font-semibold text-fx-red">{actionable}</span>
          <span className="text-sm font-semibold text-fx-red/100">actionable</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-10 gap-y-1 text-xs text-fx-500">
        <div className="flex items-center gap-2">
          <span>From a total of {totalActive} active checks</span>
          <span>&middot;</span>
          <Link to="/advisors/available" className="text-fx-blue">
            Manage checks
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <span>Last checked: 1 min. ago</span>
          <span>&middot;</span>
          <button type="button" className="text-fx-blue">
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

export function Feed() {
  const checks = getScenarioChecks();

  return (
    <div>
      <FleetSummary />

      <h2 className="mt-6 text-lg font-semibold text-fx-black">
        {checks.length} actionable check{checks.length !== 1 && 's'}
      </h2>

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
    <li className="rounded-lg border p-4">
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
